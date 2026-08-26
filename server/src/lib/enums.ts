// SQLite has no native enum support in Prisma, so these unions are the source of
// truth for the "enum" columns declared as String in prisma/schema.prisma.

export const MEMBERSHIP_ROLES = ['AUTHOR', 'BENEFICIARY', 'EXECUTOR'] as const
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number]

export const LEGACY_STATUSES = ['ACTIVE', 'DEATH_PENDING', 'DEATH_CONFIRMED'] as const
export type LegacyStatus = (typeof LEGACY_STATUSES)[number]

export const CONTENT_TYPES = ['STORY', 'ADVICE', 'MEDIA', 'CAPSULE'] as const
export type ContentType = (typeof CONTENT_TYPES)[number]

export const CONTENT_VISIBILITIES = ['IMMEDIATE', 'POSTMORTEM', 'DATE', 'AGE'] as const
export type ContentVisibility = (typeof CONTENT_VISIBILITIES)[number]

export const MEDIA_KINDS = ['PHOTO', 'VIDEO', 'AUDIO'] as const
export type MediaKind = (typeof MEDIA_KINDS)[number]

export const DEATH_VERIFICATION_STATUSES = ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED'] as const
export type DeathVerificationStatus = (typeof DEATH_VERIFICATION_STATUSES)[number]
