/*
  Warnings:

  - Added the required column `goldCapacity` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `normalCapacity` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `premiumCapacity` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalCapacity` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "allowGold" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowNormal" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowPremium" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "goldCapacity" INTEGER NOT NULL,
ADD COLUMN     "normalCapacity" INTEGER NOT NULL,
ADD COLUMN     "premiumCapacity" INTEGER NOT NULL,
ADD COLUMN     "totalCapacity" INTEGER NOT NULL;
