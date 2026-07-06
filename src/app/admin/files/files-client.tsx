'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FullPageSkeleton } from '@/app/admin/_components/table-skeleton';

interface CmsFile {
  id: number;
  filename: string;
  originalName: string;
  displayName: string | null;
  ext: string;
  mimeType: string;
  size: number;
  sizeText: string | null;
  rootDir: string;
  subDir: string | null;
  relativePath: string;
  absolutePath: string | null;
  accessUrl: string | null;
  remark: string | null;
  isPublic: boolean;
  status: number;
  deleted: boolean;
  createUserId: string | null;
  createUserName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ListData {
  items: CmsFile[];
  total: number;
  page: number;
  pageSize: number;
}

const imageTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getFileIcon(ext: string) {
  const icons: Record<string, string> = {
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    xls: '📊',
    xlsx: '📊',
    ppt: '📽',
    pptx: '📽',
    zip: '📦',
    rar: '📦',
    '7z': '📦',
    mp4: '🎬',
    mp3: '🎵',
    txt: '📃',
    html: '🌐',
    css: '🎨',
    js: '⚡',
    json: '📋',
    xml: '📋',
  };
  return icons[ext] || '📎';
}

export default function FilesClient() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ListData | null>(null);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [mimeFilter, setMimeFilter] = useState('');
  const [subDirFilter, setSubDirFilter] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadSubDir, setUploadSubDir] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Preview
  const [previewFile, setPreviewFile] = useState<CmsFile | null>(null);

  // Edit (rename + remark)
  const [editFile, setEditFile] = useState<CmsFile | null>(null);
  const [editForm, setEditForm] = useState({ displayName: '', remark: '' });

  // Delete
  const [deleteFile, setDeleteFile] = useState<CmsFile | null>(null);

  // Upload dirs for dropdown
  const [uploadDirs, setUploadDirs] = useState<
    {
      id: number;
      name: string;
      dir: string;
      description: string | null;
      maxSize: number | null;
      allowTypes: string | null;
      enabled: boolean;
    }[]
  >([]);
  const [dirModalOpen, setDirModalOpen] = useState(false);
  const [dirForm, setDirForm] = useState({
    name: '',
    dir: '',
    description: '',
    maxSize: '',
    allowTypes: '',
  });

  // Copy feedback
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedKeyword(keyword);
      setPage(1);
    }, 300);
    return () => clearTimeout(debounceTimer.current);
  }, [keyword]);

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams();
    if (debouncedKeyword) params.set('keyword', debouncedKeyword);
    if (mimeFilter) params.set('mimeType', mimeFilter);
    if (subDirFilter) params.set('subDir', subDirFilter);
    params.set('page', String(page));
    params.set('pageSize', '20');

    const res = await fetch(`/api/common/files?${params}`);
    const json = await res.json();
    if (json.code === 0) setData(json.data);
    setLoading(false);
  }, [debouncedKeyword, mimeFilter, subDirFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetch('/api/common/upload-dirs')
      .then((r) => r.json())
      .then((json) => {
        if (json.code === 0) setUploadDirs(json.data);
      })
      .catch(() => {});
  }, []);

  // Upload
  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);

    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;
    if (!file || file.size === 0) {
      alert('请选择文件');
      setUploading(false);
      return;
    }

    const res = await fetch('/api/common/files', {
      method: 'POST',
      body: formData,
    });
    const json = await res.json();
    setUploading(false);

    if (json.code === 0) {
      setShowUploadModal(false);
      fetchData();
      fetch('/api/common/upload-dirs')
        .then((r) => r.json())
        .then((j) => {
          if (j.code === 0) setUploadDirs(j.data);
        })
        .catch(() => {});
    } else {
      alert(json.message || '上传失败');
    }
  }

  // Edit
  async function handleEditSave() {
    if (!editFile) return;
    const res = await fetch(`/api/common/files/${editFile.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: editForm.displayName || null,
        remark: editForm.remark || null,
      }),
    });
    const json = await res.json();
    if (json.code === 0) {
      setEditFile(null);
      fetchData();
    } else {
      alert(json.message || '更新失败');
    }
  }

  // Delete
  async function handleDelete() {
    if (!deleteFile) return;
    const res = await fetch(`/api/common/files/${deleteFile.id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (json.code === 0) {
      setDeleteFile(null);
      fetchData();
    } else {
      alert(json.message || '删除失败');
    }
  }

  // Copy URL
  async function copyUrl(url: string, id: number) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }

  // Dir CRUD
  const [editingDir, setEditingDir] = useState<{
    id: number;
    name: string;
    dir: string;
    description: string | null;
    maxSize: number | null;
    allowTypes: string | null;
  } | null>(null);
  const [dirEditForm, setDirEditForm] = useState({
    name: '',
    dir: '',
    description: '',
    maxSize: '',
    allowTypes: '',
  });

  async function handleDirCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/common/upload-dirs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: dirForm.name,
        dir: dirForm.dir,
        description: dirForm.description || null,
        maxSize: dirForm.maxSize ? Number(dirForm.maxSize) : null,
        allowTypes: dirForm.allowTypes || null,
      }),
    });
    const json = await res.json();
    if (json.code === 0) {
      setDirForm({
        name: '',
        dir: '',
        description: '',
        maxSize: '',
        allowTypes: '',
      });
      setDirModalOpen(false);
      fetch('/api/common/upload-dirs')
        .then((r) => r.json())
        .then((j) => {
          if (j.code === 0) setUploadDirs(j.data);
        })
        .catch(() => {});
    } else {
      alert(json.message || '创建失败');
    }
  }

  async function handleDirUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingDir) return;
    const res = await fetch(`/api/common/upload-dirs/${editingDir.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: dirEditForm.name,
        dir: dirEditForm.dir,
        description: dirEditForm.description || null,
        maxSize: dirEditForm.maxSize ? Number(dirEditForm.maxSize) : null,
        allowTypes: dirEditForm.allowTypes || null,
      }),
    });
    const json = await res.json();
    if (json.code === 0) {
      setEditingDir(null);
      fetch('/api/common/upload-dirs')
        .then((r) => r.json())
        .then((j) => {
          if (j.code === 0) setUploadDirs(j.data);
        })
        .catch(() => {});
    } else {
      alert(json.message || '更新失败');
    }
  }

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  if (loading) {
    return <FullPageSkeleton withToolbar />;
  }

  return (
    <div>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight text-black dark:text-zinc-50'>
            文件管理
          </h1>
          <p className='mt-2 text-zinc-600 dark:text-zinc-400'>
            管理上传的文件。支持图片预览、链接复制、重命名和备注。
          </p>
        </div>
        <div className='flex gap-3'>
          <button
            onClick={() => setDirModalOpen(true)}
            className='shrink-0 rounded-lg border border-zinc-300 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
          >
            管理目录
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className='shrink-0 rounded-lg bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200'
          >
            + 上传文件
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className='mt-6 flex flex-wrap items-center gap-3'>
        <input
          type='text'
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder='搜索文件名/备注...'
          className='h-9 w-56 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50'
        />
        <select
          value={mimeFilter}
          onChange={(e) => {
            setMimeFilter(e.target.value);
            setPage(1);
          }}
          className='h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50'
        >
          <option value=''>全部类型</option>
          <option value='image'>图片</option>
          <option value='application/pdf'>PDF</option>
          <option value='video'>视频</option>
          <option value='audio'>音频</option>
          <option value='text'>文本</option>
          <option value='application/zip'>压缩包</option>
        </select>
        <select
          value={subDirFilter}
          onChange={(e) => {
            setSubDirFilter(e.target.value);
            setPage(1);
          }}
          className='h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50'
        >
          <option value=''>全部子目录</option>
          {uploadDirs.map((d) => (
            <option key={d.dir} value={d.dir}>
              {d.name} ({d.dir})
            </option>
          ))}
        </select>
      </div>

      {/* File table */}
      <div className='mt-4 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800'>
        <table className='w-full text-left text-sm'>
          <thead className='bg-zinc-50 dark:bg-zinc-900'>
            <tr>
              <th className='px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400 w-16'>
                预览
              </th>
              <th className='px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400'>
                文件名
              </th>
              <th className='px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400'>
                大小
              </th>
              <th className='px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400'>
                类型
              </th>
              <th className='px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400'>
                子目录
              </th>
              <th className='px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400'>
                备注
              </th>
              <th className='px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400'>
                上传时间
              </th>
              <th className='px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400'>
                操作
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-zinc-200 dark:divide-zinc-800'>
            {data?.items.map((file) => (
              <tr key={file.id} className='bg-white dark:bg-black'>
                <td className='px-4 py-3'>
                  {imageTypes.includes(file.mimeType) ? (
                    <button onClick={() => setPreviewFile(file)}>
                      <img
                        src={file.accessUrl || ''}
                        alt=''
                        className='h-10 w-10 rounded object-cover border border-zinc-200 dark:border-zinc-700'
                      />
                    </button>
                  ) : (
                    <span className='inline-flex h-10 w-10 items-center justify-center text-xl'>
                      {getFileIcon(file.ext)}
                    </span>
                  )}
                </td>
                <td className='max-w-[200px] px-4 py-3'>
                  <p className='truncate font-medium text-black dark:text-zinc-50'>
                    {file.displayName || file.originalName}
                  </p>
                  <p className='truncate font-mono text-xs text-zinc-400'>
                    {file.filename}
                  </p>
                </td>
                <td className='px-4 py-3 text-zinc-600 dark:text-zinc-400'>
                  {file.sizeText || `${file.size} B`}
                </td>
                <td className='px-4 py-3'>
                  <span className='rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'>
                    {file.ext}
                  </span>
                </td>
                <td className='px-4 py-3 font-mono text-xs text-zinc-500 dark:text-zinc-400'>
                  {file.subDir || '-'}
                </td>
                <td className='max-w-[120px] truncate px-4 py-3 text-zinc-600 dark:text-zinc-400'>
                  {file.remark || '-'}
                </td>
                <td className='px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400'>
                  {formatDate(file.createdAt)}
                </td>
                <td className='px-4 py-3'>
                  <div className='flex flex-wrap gap-1.5'>
                    {/* Copy URL */}
                    <button
                      onClick={() => copyUrl(file.accessUrl || '', file.id)}
                      className='rounded bg-zinc-700 px-2 py-1 text-xs font-medium text-white hover:bg-zinc-600 dark:bg-zinc-300 dark:text-black dark:hover:bg-zinc-400'
                    >
                      {copiedId === file.id ? '已复制' : '复制地址'}
                    </button>
                    {/* Preview for non-image */}
                    {!imageTypes.includes(file.mimeType) && (
                      <button
                        onClick={() => setPreviewFile(file)}
                        className='rounded border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800'
                      >
                        详情
                      </button>
                    )}
                    {/* Edit */}
                    <button
                      onClick={() => {
                        setEditFile(file);
                        setEditForm({
                          displayName: file.displayName || '',
                          remark: file.remark || '',
                        });
                      }}
                      className='rounded bg-zinc-800 px-2 py-1 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-200 dark:text-black dark:hover:bg-zinc-300'
                    >
                      编辑
                    </button>
                    {/* Delete */}
                    <button
                      onClick={() => setDeleteFile(file)}
                      className='rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700'
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {(!data || data.items.length === 0) && (
              <tr>
                <td
                  colSpan={8}
                  className='px-4 py-8 text-center text-sm text-zinc-400'
                >
                  暂无文件
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && totalPages > 1 && (
        <div className='mt-4 flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400'>
          <span>
            共 {data.total} 个文件，第 {data.page}/{totalPages} 页
          </span>
          <div className='flex gap-2'>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className='rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900'
            >
              上一页
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className='rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900'
            >
              下一页
            </button>
          </div>
        </div>
      )}

      {/* ─── Upload Modal ─────────────────────────── */}
      {showUploadModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
          <div className='w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900'>
            <h3 className='text-lg font-semibold text-black dark:text-zinc-50'>
              上传文件
            </h3>
            <form onSubmit={handleUpload} className='mt-4 flex flex-col gap-4'>
              <fieldset className='flex flex-col gap-1'>
                <label className='text-xs text-zinc-500'>选择文件 *</label>
                <input
                  name='file'
                  type='file'
                  required
                  className='rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-black outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 file:mr-3 file:rounded file:border-0 file:bg-zinc-800 file:px-3 file:py-1 file:text-xs file:text-white dark:file:bg-zinc-200 dark:file:text-black'
                />
              </fieldset>
              <fieldset className='flex flex-col gap-1'>
                <label className='text-xs text-zinc-500'>子目录（可选）</label>
                <div className='flex gap-2'>
                  <select
                    value={uploadSubDir}
                    onChange={(e) => setUploadSubDir(e.target.value)}
                    className='flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50'
                  >
                    <option value=''>根目录</option>
                    {uploadDirs
                      .filter((d) => d.enabled !== false)
                      .map((d) => (
                        <option key={d.dir} value={d.dir}>
                          {d.name}
                        </option>
                      ))}
                  </select>
                  <input type='hidden' name='subDir' value={uploadSubDir} />
                </div>
              </fieldset>
              <div className='mt-2 flex justify-end gap-3'>
                <button
                  type='button'
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadSubDir('');
                  }}
                  className='rounded-lg border border-zinc-300 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                >
                  取消
                </button>
                <button
                  type='submit'
                  disabled={uploading}
                  className='rounded-lg bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200'
                >
                  {uploading ? '上传中...' : '上传'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Preview / Detail Modal ───────────────── */}
      {previewFile && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
          <div className='flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900'>
            {/* Header */}
            <div className='flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-700'>
              <h3 className='text-lg font-semibold text-black dark:text-zinc-50'>
                {previewFile.displayName || previewFile.originalName}
              </h3>
              <button
                onClick={() => setPreviewFile(null)}
                className='text-zinc-400 hover:text-black dark:hover:text-white'
              >
                ✕
              </button>
            </div>
            {/* Body */}
            <div className='flex-1 overflow-y-auto p-6'>
              {imageTypes.includes(previewFile.mimeType) ? (
                <img
                  src={previewFile.accessUrl || ''}
                  alt={previewFile.originalName}
                  className='max-h-[60vh] w-full rounded-lg object-contain'
                />
              ) : (
                <div className='flex flex-col items-center gap-4 py-8'>
                  <span className='text-6xl'>
                    {getFileIcon(previewFile.ext)}
                  </span>
                  <p className='text-sm text-zinc-500 dark:text-zinc-400'>
                    此类型不支持在线预览
                  </p>
                </div>
              )}
              {/* File info */}
              <div className='mt-4 space-y-2 text-sm'>
                <div className='flex justify-between border-b border-zinc-100 pb-1 dark:border-zinc-800'>
                  <span className='text-zinc-500'>原始文件名</span>
                  <span className='text-black dark:text-zinc-50'>
                    {previewFile.originalName}
                  </span>
                </div>
                <div className='flex justify-between border-b border-zinc-100 pb-1 dark:border-zinc-800'>
                  <span className='text-zinc-500'>存储文件名</span>
                  <span className='font-mono text-xs text-black dark:text-zinc-50'>
                    {previewFile.filename}
                  </span>
                </div>
                <div className='flex justify-between border-b border-zinc-100 pb-1 dark:border-zinc-800'>
                  <span className='text-zinc-500'>MIME 类型</span>
                  <span className='text-black dark:text-zinc-50'>
                    {previewFile.mimeType}
                  </span>
                </div>
                <div className='flex justify-between border-b border-zinc-100 pb-1 dark:border-zinc-800'>
                  <span className='text-zinc-500'>文件大小</span>
                  <span className='text-black dark:text-zinc-50'>
                    {previewFile.sizeText || `${previewFile.size} B`}
                  </span>
                </div>
                <div className='flex justify-between border-b border-zinc-100 pb-1 dark:border-zinc-800'>
                  <span className='text-zinc-500'>子目录</span>
                  <span className='font-mono text-xs text-black dark:text-zinc-50'>
                    {previewFile.subDir || '根目录'}
                  </span>
                </div>
                <div className='flex justify-between border-b border-zinc-100 pb-1 dark:border-zinc-800'>
                  <span className='text-zinc-500'>上传者</span>
                  <span className='text-black dark:text-zinc-50'>
                    {previewFile.createUserName || '-'}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-zinc-500'>访问地址</span>
                  <button
                    onClick={() =>
                      copyUrl(previewFile.accessUrl || '', previewFile.id)
                    }
                    className='max-w-[250px] truncate font-mono text-xs text-blue-600 underline hover:text-blue-800 dark:text-blue-400'
                  >
                    {previewFile.accessUrl || '-'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Edit Modal (rename + remark) ────────── */}
      {editFile && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
          <div className='w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900'>
            <h3 className='text-lg font-semibold text-black dark:text-zinc-50'>
              编辑文件
            </h3>
            <div className='mt-4 flex flex-col gap-4'>
              <fieldset className='flex flex-col gap-1'>
                <label className='text-xs text-zinc-500'>显示名称</label>
                <input
                  value={editForm.displayName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, displayName: e.target.value })
                  }
                  placeholder='留空则使用原始文件名'
                  className='rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50'
                />
              </fieldset>
              <fieldset className='flex flex-col gap-1'>
                <label className='text-xs text-zinc-500'>备注</label>
                <textarea
                  value={editForm.remark}
                  onChange={(e) =>
                    setEditForm({ ...editForm, remark: e.target.value })
                  }
                  rows={3}
                  placeholder='添加备注...'
                  className='rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50'
                />
              </fieldset>
              <div className='mt-2 flex justify-end gap-3'>
                <button
                  onClick={() => setEditFile(null)}
                  className='rounded-lg border border-zinc-300 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                >
                  取消
                </button>
                <button
                  onClick={handleEditSave}
                  className='rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700'
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirm ──────────────────────── */}
      {deleteFile && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
          <div className='w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900'>
            <h3 className='text-lg font-semibold text-black dark:text-zinc-50'>
              确认删除
            </h3>
            <p className='mt-2 text-sm text-zinc-600 dark:text-zinc-400'>
              确定要永久删除文件{' '}
              <span className='font-medium text-black dark:text-zinc-50'>
                {deleteFile.displayName || deleteFile.originalName}
              </span>{' '}
              吗？文件将从磁盘和数据库中永久移除。
            </p>
            <div className='mt-5 flex justify-end gap-3'>
              <button
                onClick={() => setDeleteFile(null)}
                className='rounded-lg border border-zinc-300 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className='rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700'
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Upload Dirs Manager Modal ───────────── */}
      {(dirModalOpen || editingDir) && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
          <div className='flex max-h-[85vh] w-full max-w-xl flex-col rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900'>
            <div className='flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-700'>
              <h3 className='text-lg font-semibold text-black dark:text-zinc-50'>
                {editingDir ? '编辑目录' : '上传目录管理'}
              </h3>
              <button
                onClick={() => {
                  setDirModalOpen(false);
                  setEditingDir(null);
                }}
                className='text-zinc-400 hover:text-black dark:hover:text-white'
              >
                ✕
              </button>
            </div>

            <div className='flex-1 overflow-y-auto p-6'>
              {/* Create / Edit form */}
              <form
                onSubmit={editingDir ? handleDirUpdate : handleDirCreate}
                className='mb-6 flex flex-col gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50'
              >
                <h4 className='text-sm font-medium text-black dark:text-zinc-50'>
                  {editingDir ? '编辑目录' : '新增目录'}
                </h4>
                <div className='grid grid-cols-2 gap-4'>
                  <fieldset className='flex flex-col gap-1'>
                    <label className='text-xs text-zinc-500'>名称 *</label>
                    <input
                      required
                      value={editingDir ? dirEditForm.name : dirForm.name}
                      onChange={(e) => {
                        if (editingDir)
                          setDirEditForm({
                            ...dirEditForm,
                            name: e.target.value,
                          });
                        else setDirForm({ ...dirForm, name: e.target.value });
                      }}
                      className='rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50'
                    />
                  </fieldset>
                  <fieldset className='flex flex-col gap-1'>
                    <label className='text-xs text-zinc-500'>目录标识 *</label>
                    <input
                      required
                      value={editingDir ? dirEditForm.dir : dirForm.dir}
                      onChange={(e) => {
                        if (editingDir)
                          setDirEditForm({
                            ...dirEditForm,
                            dir: e.target.value,
                          });
                        else setDirForm({ ...dirForm, dir: e.target.value });
                      }}
                      placeholder='如: images, documents'
                      className='rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 font-mono text-xs'
                    />
                  </fieldset>
                  <fieldset className='col-span-2 flex flex-col gap-1'>
                    <label className='text-xs text-zinc-500'>描述</label>
                    <input
                      value={
                        editingDir
                          ? dirEditForm.description
                          : dirForm.description
                      }
                      onChange={(e) => {
                        if (editingDir)
                          setDirEditForm({
                            ...dirEditForm,
                            description: e.target.value,
                          });
                        else
                          setDirForm({
                            ...dirForm,
                            description: e.target.value,
                          });
                      }}
                      className='rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50'
                    />
                  </fieldset>
                  <fieldset className='flex flex-col gap-1'>
                    <label className='text-xs text-zinc-500'>
                      最大尺寸 (字节)
                    </label>
                    <input
                      type='number'
                      value={editingDir ? dirEditForm.maxSize : dirForm.maxSize}
                      onChange={(e) => {
                        if (editingDir)
                          setDirEditForm({
                            ...dirEditForm,
                            maxSize: e.target.value,
                          });
                        else
                          setDirForm({ ...dirForm, maxSize: e.target.value });
                      }}
                      placeholder='默认 10MB'
                      className='rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50'
                    />
                  </fieldset>
                  <fieldset className='flex flex-col gap-1'>
                    <label className='text-xs text-zinc-500'>允许类型</label>
                    <input
                      value={
                        editingDir ? dirEditForm.allowTypes : dirForm.allowTypes
                      }
                      onChange={(e) => {
                        if (editingDir)
                          setDirEditForm({
                            ...dirEditForm,
                            allowTypes: e.target.value,
                          });
                        else
                          setDirForm({
                            ...dirForm,
                            allowTypes: e.target.value,
                          });
                      }}
                      placeholder='逗号分隔, 如 image/*'
                      className='rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50'
                    />
                  </fieldset>
                </div>
                <div className='flex justify-end gap-3'>
                  {editingDir && (
                    <button
                      type='button'
                      onClick={() => setEditingDir(null)}
                      className='rounded-lg border border-zinc-300 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                    >
                      取消编辑
                    </button>
                  )}
                  <button
                    type='submit'
                    className='rounded-lg bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200'
                  >
                    {editingDir ? '保存' : '创建'}
                  </button>
                </div>
              </form>

              {/* Existing dirs list */}
              {!editingDir && (
                <div className='space-y-2'>
                  {uploadDirs.length === 0 && (
                    <p className='py-4 text-center text-sm text-zinc-400'>
                      暂无上传目录
                    </p>
                  )}
                  {uploadDirs.map((d) => (
                    <div
                      key={d.id}
                      className='flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900'
                    >
                      <div>
                        <p className='font-medium text-black dark:text-zinc-50'>
                          {d.name}
                        </p>
                        <p className='font-mono text-xs text-zinc-500'>
                          /{d.dir}
                        </p>
                      </div>
                      <div className='flex gap-2'>
                        <button
                          onClick={async () => {
                            const res = await fetch(
                              `/api/common/upload-dirs/${d.id}`,
                              {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ enabled: !d.enabled }),
                              },
                            );
                            const json = await res.json();
                            if (json.code === 0) {
                              fetch('/api/common/upload-dirs')
                                .then((r) => r.json())
                                .then((j) => {
                                  if (j.code === 0) setUploadDirs(j.data);
                                })
                                .catch(() => {});
                            }
                          }}
                          className={`rounded px-2 py-1 text-xs font-medium ${
                            d.enabled
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                          }`}
                        >
                          {d.enabled ? '启用' : '禁用'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingDir(d);
                            setDirEditForm({
                              name: d.name,
                              dir: d.dir,
                              description: d.description || '',
                              maxSize: String(d.maxSize ?? ''),
                              allowTypes: d.allowTypes || '',
                            });
                          }}
                          className='rounded bg-zinc-800 px-2 py-1 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-200 dark:text-black dark:hover:bg-zinc-300'
                        >
                          编辑
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
