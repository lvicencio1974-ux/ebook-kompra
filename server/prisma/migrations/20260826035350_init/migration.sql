-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthDate" DATETIME,
    "totpSecret" TEXT,
    "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Legacy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "deathConfirmedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Legacy_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "legacyId" TEXT NOT NULL,
    "userId" TEXT,
    "role" TEXT NOT NULL,
    "relationship" TEXT,
    "inviteEmail" TEXT,
    "inviteToken" TEXT,
    "invitedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" DATETIME,
    "minAccessAge" INTEGER,
    "conversationPaused" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Membership_legacyId_fkey" FOREIGN KEY ("legacyId") REFERENCES "Legacy" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "legacyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "textContent" TEXT,
    "transcript" TEXT,
    "mediaPath" TEXT,
    "mediaMimeType" TEXT,
    "mediaKind" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'POSTMORTEM',
    "visibleFromDate" DATETIME,
    "visibleFromAge" INTEGER,
    "recipientMembershipId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContentItem_legacyId_fkey" FOREIGN KEY ("legacyId") REFERENCES "Legacy" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ContentItem_recipientMembershipId_fkey" FOREIGN KEY ("recipientMembershipId") REFERENCES "Membership" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeathVerificationRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "legacyId" TEXT NOT NULL,
    "initiatedByMembershipId" TEXT NOT NULL,
    "certificatePath" TEXT NOT NULL,
    "certificateMimeType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "secondConfirmerMembershipId" TEXT,
    "secondConfirmedAt" DATETIME,
    "gracePeriodDays" INTEGER NOT NULL,
    "unlockAt" DATETIME,
    "cancelledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeathVerificationRequest_legacyId_fkey" FOREIGN KEY ("legacyId") REFERENCES "Legacy" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DeathVerificationRequest_initiatedByMembershipId_fkey" FOREIGN KEY ("initiatedByMembershipId") REFERENCES "Membership" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DeathVerificationRequest_secondConfirmerMembershipId_fkey" FOREIGN KEY ("secondConfirmerMembershipId") REFERENCES "Membership" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConversationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "legacyId" TEXT NOT NULL,
    "askedByMembershipId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "usedContentIds" TEXT NOT NULL,
    "engine" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConversationLog_legacyId_fkey" FOREIGN KEY ("legacyId") REFERENCES "Legacy" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ConversationLog_askedByMembershipId_fkey" FOREIGN KEY ("askedByMembershipId") REFERENCES "Membership" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_inviteToken_key" ON "Membership"("inviteToken");
