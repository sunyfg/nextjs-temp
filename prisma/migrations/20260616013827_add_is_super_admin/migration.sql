-- DropForeignKey
ALTER TABLE `accounts` DROP FOREIGN KEY `Account_userId_fkey`;

-- DropForeignKey
ALTER TABLE `sessions` DROP FOREIGN KEY `Session_userId_fkey`;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `is_super_admin` INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `sessions` RENAME INDEX `Session_sessionToken_key` TO `sessions_sessionToken_key`;

-- RenameIndex
ALTER TABLE `users` RENAME INDEX `User_email_key` TO `users_email_key`;
