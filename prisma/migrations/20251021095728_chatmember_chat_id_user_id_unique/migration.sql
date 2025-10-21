/*
  Warnings:

  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[chatId,userId]` on the table `ChatMember` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `passwordHash` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."User_email_key";

-- AlterTable
ALTER TABLE "Chat" ALTER COLUMN "isDirect" DROP NOT NULL,
ALTER COLUMN "isDirect" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "createdAt",
DROP COLUMN "email",
DROP COLUMN "name",
DROP COLUMN "password",
DROP COLUMN "updatedAt",
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "lastActiveAt" TIMESTAMP(3),
ADD COLUMN     "passwordHash" TEXT NOT NULL,
ADD COLUMN     "role" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'OFFLINE',
ADD COLUMN     "username" TEXT NOT NULL,
ALTER COLUMN "roleId" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "ChatMember_chatId_userId_key" ON "ChatMember"("chatId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");
