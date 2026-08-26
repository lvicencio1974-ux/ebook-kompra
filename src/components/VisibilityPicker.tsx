import type { ContentVisibility, Membership } from '../api/types'

interface Props {
  visibility: ContentVisibility
  visibleFromDate: string
  visibleFromAge: string
  recipientMembershipId: string
  onChange: (fields: { visibility?: ContentVisibility; visibleFromDate?: string; visibleFromAge?: string; recipientMembershipId?: string }) => void
  recipients: Membership[]
}

const OPTIONS: { value: ContentVisibility; label: string; hint: string }[] = [
  { value: 'IMMEDIATE', label: 'Inmediato', hint: 'Visible ya, sin esperar nada.' },
  { value: 'POSTMORTEM', label: 'Tras mi fallecimiento', hint: 'Solo cuando el fallecimiento esté confirmado.' },
  { value: 'DATE', label: 'A partir de una fecha', hint: 'Se desbloquea en la fecha que elijas.' },
  { value: 'AGE', label: 'A partir de una edad', hint: 'Se desbloquea cuando el destinatario cumpla esa edad.' },
]

export default function VisibilityPicker({ visibility, visibleFromDate, visibleFromAge, recipientMembershipId, onChange, recipients }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <label className="label">¿Cuándo se puede ver?</label>
        <select className="input" value={visibility} onChange={(e) => onChange({ visibility: e.target.value as ContentVisibility })}>
          {OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-legado-200/50">{OPTIONS.find((o) => o.value === visibility)?.hint}</p>
      </div>

      {visibility === 'DATE' && (
        <div>
          <label className="label">Fecha de desbloqueo</label>
          <input
            type="date"
            className="input"
            value={visibleFromDate}
            onChange={(e) => onChange({ visibleFromDate: e.target.value })}
            required
          />
        </div>
      )}

      {visibility === 'AGE' && (
        <div>
          <label className="label">Edad mínima del destinatario</label>
          <input
            type="number"
            min={0}
            max={120}
            className="input"
            value={visibleFromAge}
            onChange={(e) => onChange({ visibleFromAge: e.target.value })}
            required
          />
        </div>
      )}

      {recipients.length > 0 && (
        <div>
          <label className="label">¿Es para alguien en particular? (opcional)</label>
          <select
            className="input"
            value={recipientMembershipId}
            onChange={(e) => onChange({ recipientMembershipId: e.target.value })}
          >
            <option value="">Para todos los que puedan verlo</option>
            {recipients.map((m) => (
              <option key={m.id} value={m.id}>
                {m.user?.name || m.inviteEmail} {m.relationship ? `(${m.relationship})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
