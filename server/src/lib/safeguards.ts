// Copy shown alongside every response from the avatar chat endpoint, per the ethical
// safeguards this product commits to: constant transparency about what this is (a
// recreation from recorded content, not the person), and a non-alarmist pointer to
// professional grief support. Kept as data so the frontend renders it consistently
// instead of each screen inventing its own wording.

export function recreationDisclaimer(authorName: string): string {
  return `Esto es una recreación conversacional basada en lo que ${authorName} grabó o escribió en vida. No es ${authorName}, y no sabe nada que ${authorName} no haya dejado grabado.`
}

export const GRIEF_RESOURCES = [
  {
    label: 'Si necesitas hablar con alguien ahora',
    detail:
      'Buscar una línea de apoyo emocional o duelo en tu país es un buen primer paso; muchas están disponibles 24/7 y son gratuitas.',
  },
  {
    label: 'Este espacio no reemplaza acompañamiento profesional',
    detail:
      'Conversar aquí puede ayudar a recordar, pero si el duelo se siente abrumador, hablar con un psicólogo o grupo de apoyo especializado en duelo puede ayudar de una forma que esto no puede.',
  },
]

export const NO_SOURCE_FALLBACK =
  'Sobre eso no dejé nada grabado. Prueba a preguntarme sobre otra cosa, o revisa la biblioteca de recuerdos.'
