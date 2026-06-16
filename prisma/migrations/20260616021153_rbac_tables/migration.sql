-- Drop FK constraints referencing users table
ALTER TABLE `accounts` DROP FOREIGN KEY `accounts_userId_fkey`;
ALTER TABLE `sessions` DROP FOREIGN KEY `sessions_userId_fkey`;

-- Rename table users → sys_user (data preserved)
RENAME TABLE `users` TO `sys_user`;

-- Rename columns to snake_case
ALTER TABLE `sys_user` RENAME COLUMN `createdAt` TO `created_at`;
ALTER TABLE `sys_user` RENAME COLUMN `emailVerified` TO `email_verified`;
ALTER TABLE `sys_user` RENAME COLUMN `hashedPassword` TO `hashed_password`;
ALTER TABLE `sys_user` RENAME COLUMN `updatedAt` TO `updated_at`;

-- Rename index to match new table name
ALTER TABLE `sys_user` RENAME INDEX `users_email_key` TO `sys_user_email_key`;

-- Recreate FK constraints referencing sys_user
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `sys_user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `sys_user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Create sys_role table
CREATE TABLE `sys_role` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `role_code` VARCHAR(191) NOT NULL,
    `role_name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `status` INTEGER NOT NULL DEFAULT 1,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `sys_role_role_code_key`(`role_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create sys_user_role table (user ↔ role mapping)
CREATE TABLE `sys_user_role` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(191) NOT NULL,
    `role_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `sys_user_role_user_id_role_id_key`(`user_id`, `role_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create sys_permission table
CREATE TABLE `sys_permission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `parent_id` INTEGER NOT NULL DEFAULT 0,
    `permission_name` VARCHAR(191) NOT NULL,
    `permission_code` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL,
    `path` VARCHAR(191) NULL,
    `component` VARCHAR(191) NULL,
    `icon` VARCHAR(191) NULL,
    `visible` INTEGER NOT NULL DEFAULT 1,
    `status` INTEGER NOT NULL DEFAULT 1,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create sys_role_permission table (role ↔ permission mapping)
CREATE TABLE `sys_role_permission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `role_id` INTEGER NOT NULL,
    `permission_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `sys_role_permission_role_id_permission_id_key`(`role_id`, `permission_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add FK constraints for new tables
ALTER TABLE `sys_user_role` ADD CONSTRAINT `sys_user_role_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `sys_user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `sys_user_role` ADD CONSTRAINT `sys_user_role_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `sys_role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `sys_role_permission` ADD CONSTRAINT `sys_role_permission_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `sys_role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `sys_role_permission` ADD CONSTRAINT `sys_role_permission_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `sys_permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
