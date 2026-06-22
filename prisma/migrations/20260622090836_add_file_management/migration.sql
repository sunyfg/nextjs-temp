-- AlterTable
ALTER TABLE `blog_categories` MODIFY `visible` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `blog_posts` MODIFY `is_top` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `is_recommend` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `cms_file` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `filename` VARCHAR(255) NOT NULL,
    `originalName` VARCHAR(255) NOT NULL,
    `displayName` VARCHAR(255) NULL,
    `ext` VARCHAR(32) NOT NULL,
    `mimeType` VARCHAR(100) NOT NULL,
    `size` INTEGER NOT NULL,
    `sizeText` VARCHAR(50) NULL,
    `rootDir` VARCHAR(100) NOT NULL DEFAULT 'uploads',
    `subDir` VARCHAR(255) NULL,
    `relativePath` VARCHAR(500) NOT NULL,
    `absolutePath` VARCHAR(1000) NULL,
    `accessUrl` VARCHAR(500) NULL,
    `remark` VARCHAR(500) NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `status` INTEGER NOT NULL DEFAULT 1,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `createUserId` VARCHAR(64) NULL,
    `createUserName` VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `cms_file_subDir_idx`(`subDir`),
    INDEX `cms_file_mimeType_idx`(`mimeType`),
    INDEX `cms_file_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cms_upload_dir` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `dir` VARCHAR(255) NOT NULL,
    `description` VARCHAR(500) NULL,
    `maxSize` INTEGER NULL,
    `allowTypes` VARCHAR(500) NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `cms_upload_dir_dir_key`(`dir`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
