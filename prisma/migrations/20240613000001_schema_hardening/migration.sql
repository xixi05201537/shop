-- Normalize legacy status values before applying enum constraints.
UPDATE `SelectionSubmission` SET `status` = 'pending' WHERE `status` NOT IN ('pending', 'confirmed', 'paying', 'paid', 'cancelled', 'completed');
UPDATE `SelectionCheckout` SET `status` = 'pending' WHERE `status` NOT IN ('pending', 'paying', 'paid', 'cancelled');
UPDATE `PaymentRequest` SET `status` = 'pending' WHERE `status` NOT IN ('pending', 'confirmed', 'deferred', 'paying', 'paid', 'cancelled');
UPDATE `Order` SET `status` = 'created' WHERE `status` NOT IN ('created', 'paying', 'paid', 'cancelled', 'refunded', 'failed');
UPDATE `Order` SET `buyerEmailStatus` = 'pending' WHERE `buyerEmailStatus` NOT IN ('pending', 'sending', 'sent', 'failed', 'skipped', 'disabled');
UPDATE `Order` SET `adminEmailStatus` = 'pending' WHERE `adminEmailStatus` NOT IN ('pending', 'sending', 'sent', 'failed', 'skipped', 'disabled');
UPDATE `Order` SET `shipmentEmailStatus` = 'pending' WHERE `shipmentEmailStatus` NOT IN ('pending', 'sending', 'sent', 'failed', 'skipped', 'disabled');
UPDATE `PaymentRequest` SET `emailStatus` = 'pending' WHERE `emailStatus` NOT IN ('pending', 'sending', 'sent', 'failed', 'skipped', 'disabled');
UPDATE `PaymentRequest` SET `paidEmailStatus` = 'pending' WHERE `paidEmailStatus` NOT IN ('pending', 'sending', 'sent', 'failed', 'skipped', 'disabled');
UPDATE `SelectionCheckout` SET `emailStatus` = 'pending' WHERE `emailStatus` NOT IN ('pending', 'sending', 'sent', 'failed', 'skipped', 'disabled');

-- AlterTable
ALTER TABLE `SelectionSubmission` MODIFY `status` ENUM('pending', 'confirmed', 'paying', 'paid', 'cancelled', 'completed') NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE `SelectionCheckout` MODIFY `status` ENUM('pending', 'paying', 'paid', 'cancelled') NOT NULL DEFAULT 'pending',
    MODIFY `emailStatus` ENUM('pending', 'sending', 'sent', 'failed', 'skipped', 'disabled') NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE `PaymentRequest` MODIFY `status` ENUM('pending', 'confirmed', 'deferred', 'paying', 'paid', 'cancelled') NOT NULL DEFAULT 'pending',
    MODIFY `emailStatus` ENUM('pending', 'sending', 'sent', 'failed', 'skipped', 'disabled') NOT NULL DEFAULT 'pending',
    MODIFY `paidEmailStatus` ENUM('pending', 'sending', 'sent', 'failed', 'skipped', 'disabled') NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE `Order` MODIFY `status` ENUM('created', 'paying', 'paid', 'cancelled', 'refunded', 'failed') NOT NULL DEFAULT 'created',
    MODIFY `buyerEmailStatus` ENUM('pending', 'sending', 'sent', 'failed', 'skipped', 'disabled') NOT NULL DEFAULT 'pending',
    MODIFY `adminEmailStatus` ENUM('pending', 'sending', 'sent', 'failed', 'skipped', 'disabled') NOT NULL DEFAULT 'pending',
    MODIFY `shipmentEmailStatus` ENUM('pending', 'sending', 'sent', 'failed', 'skipped', 'disabled') NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE `AuditLog` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateIndex
CREATE INDEX `Order_status_createdAt_idx` ON `Order`(`status`, `createdAt`);

-- CreateIndex
CREATE INDEX `Order_buyerEmail_idx` ON `Order`(`buyerEmail`);

-- CreateIndex
CREATE INDEX `Order_paypalBuyerEmail_idx` ON `Order`(`paypalBuyerEmail`);

-- CreateIndex
CREATE INDEX `Order_createdAt_idx` ON `Order`(`createdAt`);

-- CreateIndex
CREATE INDEX `AuditLog_adminId_idx` ON `AuditLog`(`adminId`);

-- CreateIndex
CREATE INDEX `AuditLog_action_idx` ON `AuditLog`(`action`);

-- CreateIndex
CREATE INDEX `AuditLog_adminId_createdAt_idx` ON `AuditLog`(`adminId`, `createdAt`);
