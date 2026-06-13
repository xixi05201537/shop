CREATE TABLE `FloatingWidget` (
    `id` VARCHAR(191) NOT NULL,
    `url` VARCHAR(2048) NOT NULL,
    `displayType` VARCHAR(191) NOT NULL DEFAULT 'text',
    `label` VARCHAR(120) NOT NULL DEFAULT 'i',
    `imageUrl` VARCHAR(2048) NULL,
    `openMode` VARCHAR(191) NOT NULL DEFAULT 'current',
    `size` VARCHAR(191) NOT NULL DEFAULT 'medium',
    `position` VARCHAR(191) NOT NULL DEFAULT 'right-bottom',
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FloatingWidget_enabled_sortOrder_idx`(`enabled`, `sortOrder`),
    INDEX `FloatingWidget_position_sortOrder_idx`(`position`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
