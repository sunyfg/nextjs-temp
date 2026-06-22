-- CreateTable: blog_post_draft
CREATE TABLE `blog_post_draft` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `post_id` INTEGER NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `summary` VARCHAR(500) NULL,
    `cover_image` VARCHAR(191) NULL,
    `content` LONGTEXT NOT NULL,
    `content_text` TEXT NULL,
    `is_top` BOOLEAN NOT NULL DEFAULT false,
    `is_recommend` BOOLEAN NOT NULL DEFAULT false,
    `seo_title` VARCHAR(191) NULL,
    `seo_keywords` VARCHAR(191) NULL,
    `seo_description` VARCHAR(500) NULL,
    `tag_ids` TEXT NULL,
    `author_id` INTEGER NOT NULL,
    `category_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `blog_post_draft_author_id_slug_key`(`author_id`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
