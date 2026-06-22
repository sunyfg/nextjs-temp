import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface UploadOptions {
  /** Custom upload sub-directory under rootDir */
  subDir?: string;
  /** Root upload dir name (default: "uploads") */
  rootDir?: string;
  /** Max file size in bytes (default: 10MB) */
  maxSize?: number;
  /** Allowed MIME types */
  allowTypes?: string[];
}

export interface UploadResult {
  filename: string;
  originalName: string;
  ext: string;
  mimeType: string;
  size: number;
  sizeText: string;
  rootDir: string;
  subDir: string;
  relativePath: string;
  absolutePath: string;
  accessUrl: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function getExt(mimeType: string, originalName: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'application/pdf': 'pdf',
    'application/zip': 'zip',
    'application/x-rar-compressed': 'rar',
    'application/x-7z-compressed': '7z',
    'text/plain': 'txt',
    'text/html': 'html',
    'text/css': 'css',
    'text/javascript': 'js',
    'application/json': 'json',
    'application/xml': 'xml',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      'pptx',
    'video/mp4': 'mp4',
    'audio/mpeg': 'mp3',
  };
  return (
    map[mimeType] || path.extname(originalName).slice(1).toLowerCase() || 'bin'
  );
}

const ROOT_UPLOAD_DIR = 'public/uploads';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

/**
 * Save an uploaded file to disk with UUID naming.
 * Returns metadata for persisting to the database.
 */
export async function saveUploadedFile(
  file: File,
  options: UploadOptions = {},
): Promise<UploadResult> {
  const maxSize = options.maxSize ?? 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error(`文件大小超过限制 (max: ${formatSize(maxSize)})`);
  }

  if (options.allowTypes && !options.allowTypes.includes(file.type)) {
    throw new Error(`不支持的文件类型: ${file.type}`);
  }

  const rootDir = options.rootDir || '';
  const subDir = options.subDir || '';
  const ext = getExt(file.type, file.name);
  const uuid = randomUUID();
  const filename = `${uuid}.${ext}`;

  const targetDir = path.join(ROOT_UPLOAD_DIR, rootDir, subDir);
  const relativePath = path.join(rootDir, subDir, filename);
  const absolutePath = path.resolve(targetDir, filename);
  const accessUrl = subDir
    ? `/${path.join('uploads', rootDir, subDir, filename)}`
    : `/${path.join('uploads', rootDir, filename)}`;

  await mkdir(targetDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, buffer);

  return {
    filename,
    originalName: file.name,
    ext,
    mimeType: file.type,
    size: file.size,
    sizeText: formatSize(file.size),
    rootDir,
    subDir,
    relativePath,
    absolutePath,
    accessUrl,
  };
}

/**
 * Delete a file from disk by its absolute path.
 */
export async function deleteUploadedFile(absolutePath: string): Promise<void> {
  try {
    await unlink(absolutePath);
  } catch {
    // file may already be gone
  }
}

/**
 * Get the full absolute path for a file record.
 */
export function getAbsolutePath(record: {
  rootDir: string;
  subDir: string | null;
  filename: string;
}): string {
  const sub = record.subDir
    ? path.join(record.subDir, record.filename)
    : record.filename;
  return path.resolve(ROOT_UPLOAD_DIR, record.rootDir, sub);
}

/**
 * Get the public access URL for a file record.
 */
export function getAccessUrl(record: {
  rootDir: string;
  subDir: string | null;
  filename: string;
}): string {
  const sub = record.subDir
    ? `${record.subDir}/${record.filename}`
    : record.filename;
  return `/${path.join('uploads', record.rootDir, sub)}`;
}
