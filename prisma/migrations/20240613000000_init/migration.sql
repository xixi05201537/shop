-- CreateTable
CREATE TABLE `Admin` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Admin_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `imageUrl` VARCHAR(2048) NULL,
    `imageSource` VARCHAR(191) NOT NULL DEFAULT 'url',
    `uploadedImagePath` VARCHAR(2048) NULL,
    `shortDescription` VARCHAR(191) NOT NULL,
    `longDescriptionMarkdown` LONGTEXT NOT NULL,
    `enabledAmounts` VARCHAR(191) NOT NULL DEFAULT '[0.1,1,10,30,50]',
    `defaultAmount` DOUBLE NOT NULL DEFAULT 1,
    `defaultQuantity` INTEGER NOT NULL DEFAULT 1,
    `maxQuantity` INTEGER NOT NULL DEFAULT 99,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SelectionPage` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` LONGTEXT NULL,
    `submitLabel` VARCHAR(191) NOT NULL DEFAULT '提交选择',
    `isPublished` BOOLEAN NOT NULL DEFAULT true,
    `showPrices` BOOLEAN NOT NULL DEFAULT true,
    `allowQuantity` BOOLEAN NOT NULL DEFAULT true,
    `showName` BOOLEAN NOT NULL DEFAULT true,
    `showEmail` BOOLEAN NOT NULL DEFAULT true,
    `showContact` BOOLEAN NOT NULL DEFAULT true,
    `requireName` BOOLEAN NOT NULL DEFAULT false,
    `requireEmail` BOOLEAN NOT NULL DEFAULT false,
    `requireContact` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SelectionPage_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SelectionItem` (
    `id` VARCHAR(191) NOT NULL,
    `pageId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `imageUrl` VARCHAR(2048) NOT NULL,
    `description` LONGTEXT NULL,
    `price` DOUBLE NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `minQuantity` INTEGER NOT NULL DEFAULT 1,
    `maxQuantity` INTEGER NOT NULL DEFAULT 99,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SelectionItem_pageId_sortOrder_idx`(`pageId`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SelectionSubmission` (
    `id` VARCHAR(191) NOT NULL,
    `pageId` VARCHAR(191) NOT NULL,
    `customerName` VARCHAR(191) NULL,
    `customerEmail` VARCHAR(191) NULL,
    `customerContact` VARCHAR(191) NULL,
    `note` LONGTEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `totalQuantity` INTEGER NOT NULL,
    `totalAmount` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SelectionSubmission_pageId_createdAt_idx`(`pageId`, `createdAt`),
    INDEX `SelectionSubmission_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SelectionSubmissionItem` (
    `id` VARCHAR(191) NOT NULL,
    `submissionId` VARCHAR(191) NOT NULL,
    `itemId` VARCHAR(191) NULL,
    `titleSnapshot` VARCHAR(191) NOT NULL,
    `imageSnapshot` VARCHAR(2048) NOT NULL,
    `descriptionSnapshot` LONGTEXT NULL,
    `priceSnapshot` DOUBLE NULL,
    `currencySnapshot` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `quantity` INTEGER NOT NULL,
    `lineTotal` DOUBLE NULL,

    INDEX `SelectionSubmissionItem_submissionId_idx`(`submissionId`),
    INDEX `SelectionSubmissionItem_itemId_idx`(`itemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SelectionCheckout` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `customerName` VARCHAR(191) NULL,
    `customerEmail` VARCHAR(191) NULL,
    `customerContact` VARCHAR(191) NULL,
    `totalQuantity` INTEGER NOT NULL,
    `subtotalAmount` DOUBLE NOT NULL DEFAULT 0,
    `totalAmount` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `emailRecipient` VARCHAR(191) NULL,
    `emailStatus` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `emailError` LONGTEXT NULL,
    `emailedAt` DATETIME(3) NULL,
    `paypalOrderId` VARCHAR(191) NULL,
    `paypalCaptureId` VARCHAR(191) NULL,
    `paypalRawSummary` LONGTEXT NULL,
    `paidAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SelectionCheckout_token_key`(`token`),
    UNIQUE INDEX `SelectionCheckout_paypalOrderId_key`(`paypalOrderId`),
    INDEX `SelectionCheckout_status_idx`(`status`),
    INDEX `SelectionCheckout_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SelectionCheckoutSubmission` (
    `id` VARCHAR(191) NOT NULL,
    `checkoutId` VARCHAR(191) NOT NULL,
    `submissionId` VARCHAR(191) NOT NULL,

    INDEX `SelectionCheckoutSubmission_submissionId_idx`(`submissionId`),
    UNIQUE INDEX `SelectionCheckoutSubmission_checkoutId_submissionId_key`(`checkoutId`, `submissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentRequest` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` LONGTEXT NOT NULL,
    `totalAmount` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `adminNote` LONGTEXT NULL,
    `emailRecipient` VARCHAR(191) NULL,
    `emailStatus` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `emailError` LONGTEXT NULL,
    `emailedAt` DATETIME(3) NULL,
    `paidEmailStatus` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `paidEmailError` LONGTEXT NULL,
    `paidEmailedAt` DATETIME(3) NULL,
    `paypalOrderId` VARCHAR(191) NULL,
    `paypalCaptureId` VARCHAR(191) NULL,
    `paypalRawSummary` LONGTEXT NULL,
    `paidAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PaymentRequest_token_key`(`token`),
    UNIQUE INDEX `PaymentRequest_paypalOrderId_key`(`paypalOrderId`),
    INDEX `PaymentRequest_status_idx`(`status`),
    INDEX `PaymentRequest_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentRequestImage` (
    `id` VARCHAR(191) NOT NULL,
    `paymentRequestId` VARCHAR(191) NOT NULL,
    `imageUrl` VARCHAR(2048) NOT NULL,
    `caption` VARCHAR(255) NULL,
    `price` DOUBLE NOT NULL DEFAULT 0,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `PaymentRequestImage_paymentRequestId_sortOrder_idx`(`paymentRequestId`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Article` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `published` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Article_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SiteConfig` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` LONGTEXT NOT NULL,
    `secret` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SiteConfig_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Order` (
    `id` VARCHAR(191) NOT NULL,
    `orderNumber` VARCHAR(191) NOT NULL,
    `paypalOrderId` VARCHAR(191) NULL,
    `paypalCaptureId` VARCHAR(191) NULL,
    `productNameSnapshot` VARCHAR(191) NOT NULL,
    `productImageSnapshot` VARCHAR(2048) NULL,
    `buyerEmail` VARCHAR(191) NULL,
    `buyerNickname` VARCHAR(191) NULL,
    `paypalBuyerEmail` VARCHAR(191) NULL,
    `paypalBuyerNickname` VARCHAR(191) NULL,
    `paypalPayerId` VARCHAR(191) NULL,
    `paypalShippingName` VARCHAR(191) NULL,
    `paypalShippingAddress` LONGTEXT NULL,
    `unitAmount` DOUBLE NOT NULL,
    `quantity` INTEGER NOT NULL,
    `totalAmount` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `status` VARCHAR(191) NOT NULL DEFAULT 'created',
    `paypalRawSummary` LONGTEXT NULL,
    `buyerEmailStatus` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `buyerEmailError` LONGTEXT NULL,
    `adminEmailStatus` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `adminEmailError` LONGTEXT NULL,
    `trackingNumber` VARCHAR(191) NULL,
    `shippedAt` DATETIME(3) NULL,
    `shipmentEmailStatus` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `shipmentEmailError` LONGTEXT NULL,
    `internalNote` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `paidAt` DATETIME(3) NULL,

    UNIQUE INDEX `Order_orderNumber_key`(`orderNumber`),
    UNIQUE INDEX `Order_paypalOrderId_key`(`paypalOrderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PayerNote` (
    `id` VARCHAR(191) NOT NULL,
    `payerId` VARCHAR(191) NOT NULL,
    `note` LONGTEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PayerNote_payerId_key`(`payerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WebhookEvent` (
    `id` VARCHAR(191) NOT NULL,
    `paypalEventId` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `resourceId` VARCHAR(191) NULL,
    `payload` LONGTEXT NOT NULL,
    `processed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `WebhookEvent_paypalEventId_key`(`paypalEventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `adminId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `targetType` VARCHAR(191) NOT NULL,
    `targetId` VARCHAR(191) NULL,
    `summary` VARCHAR(512) NOT NULL,
    `metadata` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_createdAt_idx`(`createdAt`),
    INDEX `AuditLog_targetType_targetId_idx`(`targetType`, `targetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SelectionItem` ADD CONSTRAINT `SelectionItem_pageId_fkey` FOREIGN KEY (`pageId`) REFERENCES `SelectionPage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SelectionSubmission` ADD CONSTRAINT `SelectionSubmission_pageId_fkey` FOREIGN KEY (`pageId`) REFERENCES `SelectionPage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SelectionSubmissionItem` ADD CONSTRAINT `SelectionSubmissionItem_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `SelectionSubmission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SelectionSubmissionItem` ADD CONSTRAINT `SelectionSubmissionItem_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `SelectionItem`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SelectionCheckoutSubmission` ADD CONSTRAINT `SelectionCheckoutSubmission_checkoutId_fkey` FOREIGN KEY (`checkoutId`) REFERENCES `SelectionCheckout`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SelectionCheckoutSubmission` ADD CONSTRAINT `SelectionCheckoutSubmission_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `SelectionSubmission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentRequestImage` ADD CONSTRAINT `PaymentRequestImage_paymentRequestId_fkey` FOREIGN KEY (`paymentRequestId`) REFERENCES `PaymentRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
