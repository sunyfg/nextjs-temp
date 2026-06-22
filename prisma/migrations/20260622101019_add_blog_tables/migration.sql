-- Drop old placeholder posts table
DROP TABLE IF EXISTS `posts`;

-- CreateTable: blog_user
CREATE TABLE `blog_user` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `display_name` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `avatar` VARCHAR(191) NULL,
    `hashed_password` VARCHAR(191) NULL,
    `bio` VARCHAR(500) NULL,
    `is_super_admin` INTEGER NOT NULL DEFAULT 0,
    `status` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `blog_user_username_key`(`username`),
    UNIQUE INDEX `blog_user_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: blog_categories
CREATE TABLE `blog_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `visible` TINYINT NOT NULL DEFAULT 1,

    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `blog_categories_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: blog_tags
CREATE TABLE `blog_tags` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,

    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `blog_tags_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: blog_posts
CREATE TABLE `blog_posts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `summary` VARCHAR(500) NULL,
    `cover_image` VARCHAR(191) NULL,

    `content` LONGTEXT NOT NULL,
    `content_text` TEXT NULL,

    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `is_top` TINYINT NOT NULL DEFAULT 0,
    `is_recommend` TINYINT NOT NULL DEFAULT 0,

    `view_count` INTEGER NOT NULL DEFAULT 0,

    `seo_title` VARCHAR(191) NULL,
    `seo_keywords` VARCHAR(191) NULL,
    `seo_description` VARCHAR(500) NULL,

    `published_at` DATETIME(3) NULL,

    `author_id` INTEGER NOT NULL,
    `category_id` INTEGER NULL,

    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `blog_posts_slug_key`(`slug`),
    INDEX `blog_posts_status_idx`(`status`),
    INDEX `blog_posts_category_id_idx`(`category_id`),
    INDEX `blog_posts_author_id_idx`(`author_id`),
    INDEX `blog_posts_published_at_idx`(`published_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: blog_post_tags
CREATE TABLE `blog_post_tags` (
    `post_id` INTEGER NOT NULL,
    `tag_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`post_id`, `tag_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey: blog_posts -> blog_user
ALTER TABLE `blog_posts` ADD CONSTRAINT `blog_posts_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `blog_user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: blog_posts -> blog_categories
ALTER TABLE `blog_posts` ADD CONSTRAINT `blog_posts_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `blog_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: blog_post_tags -> blog_posts
ALTER TABLE `blog_post_tags` ADD CONSTRAINT `blog_post_tags_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `blog_posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: blog_post_tags -> blog_tags
ALTER TABLE `blog_post_tags` ADD CONSTRAINT `blog_post_tags_tag_id_fkey` FOREIGN KEY (`tag_id`) REFERENCES `blog_tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
