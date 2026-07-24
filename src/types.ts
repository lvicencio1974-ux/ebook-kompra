export interface Profile {
  id: 'main'
  name: string
  relationship: string
  birthDate: string
  bio: string
  traits: string[]
  values: string[]
  phrases: string[]
  humor: string
  updatedAt: number
}

export const emptyProfile = (): Profile => ({
  id: 'main',
  name: '',
  relationship: '',
  birthDate: '',
  bio: '',
  traits: [],
  values: [],
  phrases: [],
  humor: '',
  updatedAt: Date.now(),
})

export interface Story {
  id: string
  title: string
  content: string
  category: string
  createdAt: number
}

export type MediaKind = 'photo' | 'video' | 'audio'

export interface MediaItem {
  id: string
  kind: MediaKind
  mimeType: string
  blob: Blob
  title: string
  createdAt: number
  linkedAdviceId?: string
}

export interface AdviceEntry {
  id: string
  category: string
  prompt: string
  textResponse: string
  mediaId?: string
  createdAt: number
  done: boolean
}

export interface GuidedPrompt {
  category: string
  categoryLabel: string
  prompt: string
}

export const GUIDED_PROMPTS: GuidedPrompt[] = [
  { category: 'valores', categoryLabel: 'Valores y principios', prompt: '¿Cuál es la lección más importante que aprendiste en tu vida?' },
  { category: 'valores', categoryLabel: 'Valores y principios', prompt: '¿Qué es lo que más valoras en una persona?' },
  { category: 'valores', categoryLabel: 'Valores y principios', prompt: '¿Qué principios te gustaría que siempre guiaran tus decisiones?' },
  { category: 'dificultades', categoryLabel: 'Momentos difíciles', prompt: '¿Qué le dirías a tu hijo/a en un momento de tristeza profunda?' },
  { category: 'dificultades', categoryLabel: 'Momentos difíciles', prompt: '¿Cómo superaste tú los momentos más difíciles de tu vida?' },
  { category: 'dificultades', categoryLabel: 'Momentos difíciles', prompt: '¿Qué le dirías si siente que ya no puede más?' },
  { category: 'decisiones', categoryLabel: 'Decisiones importantes', prompt: '¿Qué consejo darías antes de tomar una decisión importante?' },
  { category: 'decisiones', categoryLabel: 'Decisiones importantes', prompt: '¿Qué harías tú si tuvieras que elegir entre seguridad y un sueño?' },
  { category: 'amor', categoryLabel: 'Amor y relaciones', prompt: '¿Qué le dirías el día de su boda o cuando encuentre pareja?' },
  { category: 'amor', categoryLabel: 'Amor y relaciones', prompt: '¿Qué aprendiste sobre el amor a lo largo de tu vida?' },
  { category: 'familia', categoryLabel: 'Familia', prompt: '¿Qué te gustaría que recordara sobre nuestra familia?' },
  { category: 'familia', categoryLabel: 'Familia', prompt: '¿Qué consejo darías cuando tenga sus propios hijos?' },
  { category: 'trabajo', categoryLabel: 'Trabajo y propósito', prompt: '¿Qué le dirías sobre encontrar su vocación o propósito?' },
  { category: 'trabajo', categoryLabel: 'Trabajo y propósito', prompt: '¿Qué consejo darías sobre el trabajo y el dinero?' },
  { category: 'orgullo', categoryLabel: 'Orgullo y ánimo', prompt: '¿De qué te sientes más orgulloso de él o ella?' },
  { category: 'orgullo', categoryLabel: 'Orgullo y ánimo', prompt: '¿Qué le dirías para darle ánimo cuando dude de sí mismo/a?' },
  { category: 'despedida', categoryLabel: 'Un mensaje final', prompt: '¿Qué es lo último que te gustaría que supiera siempre?' },
  { category: 'despedida', categoryLabel: 'Un mensaje final', prompt: '¿Cómo te gustaría que te recordara?' },
]

export interface Backup {
  version: 1
  exportedAt: number
  profile: Profile | null
  stories: Story[]
  advice: AdviceEntry[]
  media: { id: string; kind: MediaKind; mimeType: string; title: string; createdAt: number; linkedAdviceId?: string; dataUrl: string }[]
}
