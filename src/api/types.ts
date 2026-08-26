export type MembershipRole = 'AUTHOR' | 'BENEFICIARY' | 'EXECUTOR'
export type LegacyStatus = 'ACTIVE' | 'DEATH_PENDING' | 'DEATH_CONFIRMED'
export type ContentType = 'STORY' | 'ADVICE' | 'MEDIA' | 'CAPSULE'
export type ContentVisibility = 'IMMEDIATE' | 'POSTMORTEM' | 'DATE' | 'AGE'
export type MediaKind = 'PHOTO' | 'VIDEO' | 'AUDIO'
export type DeathVerificationStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED'

export interface User {
  id: string
  email: string
  name: string
  totpEnabled?: boolean
}

export interface MembershipUser {
  id: string
  name: string
  email: string
}

export interface Membership {
  id: string
  legacyId: string
  userId: string | null
  user?: MembershipUser | null
  role: MembershipRole
  relationship: string | null
  inviteEmail: string | null
  inviteToken?: string | null
  invitedAt: string
  acceptedAt: string | null
  minAccessAge: number | null
  conversationPaused: boolean
}

export interface Legacy {
  id: string
  name: string
  authorId: string
  status: LegacyStatus
  deathConfirmedAt: string | null
  createdAt: string
  bio: string | null
  humor: string | null
  traits: string[]
  values: string[]
  phrases: string[]
  memberships: Membership[]
}

export interface ContentItem {
  id: string
  legacyId: string
  type: ContentType
  title: string
  category: string | null
  textContent: string | null
  transcript: string | null
  mediaMimeType: string | null
  mediaKind: MediaKind | null
  hasMedia: boolean
  visibility: ContentVisibility
  visibleFromDate: string | null
  visibleFromAge: number | null
  recipientMembershipId: string | null
  createdAt: string
  updatedAt: string
}

export interface DeathVerificationRequest {
  id: string
  legacyId: string
  initiatedByMembershipId: string
  certificateMimeType: string
  status: DeathVerificationStatus
  secondConfirmerMembershipId: string | null
  secondConfirmedAt: string | null
  gracePeriodDays: number
  unlockAt: string | null
  cancelledAt: string | null
  createdAt: string
}

export interface ChatMessageResponse {
  answer: string
  engine: 'claude' | 'local-matcher'
  sources: { id: string; title: string; type: ContentType; category: string | null }[]
  disclaimer: string
  griefResources: { label: string; detail: string }[]
}

export interface ConversationLogEntry {
  id: string
  legacyId: string
  askedByMembershipId: string
  question: string
  answer: string
  engine: 'claude' | 'local-matcher'
  createdAt: string
}
