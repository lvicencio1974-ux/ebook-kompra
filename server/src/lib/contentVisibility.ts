import type { ContentItem, Legacy, Membership, User } from '@prisma/client'

function age(birthDate: Date, at: Date): number {
  let years = at.getFullYear() - birthDate.getFullYear()
  const monthDiff = at.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && at.getDate() < birthDate.getDate())) years--
  return years
}

/**
 * A piece of content is gated two independent ways: WHEN it unlocks (its `visibility`
 * trigger) and WHO it's for (an optional single recipient). The author can always see
 * everything they wrote; everyone else needs both gates open.
 */
export function isContentVisible(
  content: ContentItem,
  legacy: Pick<Legacy, 'status'>,
  viewerMembership: Membership,
  viewerUser: Pick<User, 'birthDate'>
): boolean {
  if (viewerMembership.role === 'AUTHOR') return true

  if (content.recipientMembershipId && content.recipientMembershipId !== viewerMembership.id) {
    return false
  }

  switch (content.visibility) {
    case 'IMMEDIATE':
      return true
    case 'POSTMORTEM':
      return legacy.status === 'DEATH_CONFIRMED'
    case 'DATE':
      return !!content.visibleFromDate && new Date() >= content.visibleFromDate
    case 'AGE':
      return (
        !!content.visibleFromAge &&
        !!viewerUser.birthDate &&
        age(viewerUser.birthDate, new Date()) >= content.visibleFromAge
      )
    default:
      return false
  }
}
