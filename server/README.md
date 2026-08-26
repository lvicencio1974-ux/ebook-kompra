# Legado Digital — backend

API para el testimonio de vida / avatar de legado descrito en el prompt maestro del
producto: un autor graba su historia, valores y consejos en vida; sus beneficiarios
(hijos, pareja, etc.) reciben acceso, controlado por permisos, a esa biblioteca y a un
modo de conversación una vez que un albacea de confianza verifica el fallecimiento.

Este backend corre localmente sobre SQLite — no depende de infraestructura en la nube.
El frontend en `../src` consume esta API (ver `../README.md` para correr ambos juntos).

## Poner en marcha

```bash
cp .env.example .env
```

Completa `.env`:

- `JWT_SECRET`: genera uno con `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- `MEDIA_ENCRYPTION_KEY`: genera uno con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` (debe tener exactamente 64 caracteres hexadecimales)
- `ANTHROPIC_API_KEY`: opcional. Sin ella, el chat conversacional usa un buscador local por
  palabras clave como respaldo seguro (nunca inventa contenido). Con ella, las respuestas
  las genera Claude, restringido por prompt a responder solo con lo que el autor grabó.

```bash
npm install
npm run prisma:generate
npm run prisma:migrate   # crea dev.db y aplica el esquema
npm run dev               # servidor en http://localhost:4000
```

Para probar el flujo completo automáticamente (sin tocar tu `dev.db`, usa una base de
datos SQLite temporal propia):

```bash
npm run smoke
```

## Modelo de datos y roles

- **Legacy**: el "legado" de un autor. Tiene `status`: `ACTIVE` → `DEATH_PENDING` →
  `DEATH_CONFIRMED`.
- **Membership**: vincula un usuario a un legado con un rol — `AUTHOR`, `BENEFICIARY` o
  `EXECUTOR` (albacea digital) — y controla invitaciones, edad mínima de acceso, y si ese
  beneficiario pausó el modo conversación.
- **ContentItem**: historias, consejos, cápsulas dirigidas y archivos multimedia. Cada
  uno tiene su propia regla de visibilidad (`IMMEDIATE`, `POSTMORTEM`, `DATE`, `AGE`) y,
  opcionalmente, un destinatario único.
- **DeathVerificationRequest**: el flujo de verificación de fallecimiento (ver abajo).
- **ConversationLog**: historial de preguntas y respuestas del modo conversación.

## Verificación de fallecimiento (válvula de seguridad)

1. Un albacea sube un documento (acta de defunción u otro) — `POST
   /legacies/:id/death-verification`. Esto por sí solo **no** desbloquea nada.
2. Otra persona de confianza del legado (no quien inició el proceso) da una segunda
   confirmación — `POST .../:requestId/confirm`. Ahí arranca el período de gracia
   (`DEATH_VERIFICATION_GRACE_DAYS`, por defecto 7 días).
3. Mientras dure la gracia, **el propio autor puede cancelar** si sigue vivo y esto fue
   un error o un fraude — `POST .../:requestId/cancel`.
4. Si nadie cancela, al vencer el período el legado pasa a `DEATH_CONFIRMED` y el modo
   conversación se desbloquea para los beneficiarios. No hay un cron aparte: esto se
   resuelve de forma perezosa (`finalizeIfDue`) la próxima vez que se consulta el legado
   o sus solicitudes — ver `src/lib/deathVerification.ts`.

## El chat del avatar

`POST /legacies/:id/chat` — bloqueado para beneficiarios/albaceas hasta
`DEATH_CONFIRMED` (el autor puede probarlo en cualquier momento, en modo previsualización).

1. Filtra el contenido del legado por lo que ese beneficiario en particular puede ver
   (visibilidad + destinatario).
2. Busca los fragmentos más relevantes a la pregunta (`src/lib/matcher.ts`).
3. Si no hay ninguno relevante, responde con un mensaje honesto de "no dejé nada
   grabado sobre eso" — nunca inventa.
4. Si hay `ANTHROPIC_API_KEY`, genera la respuesta con Claude, con un prompt de sistema
   que le prohíbe explícitamente inventar hechos, dar consejos médicos/legales/financieros
   como si fueran vigentes, o salirse de las fuentes proporcionadas
   (`src/lib/claude.ts`). Si Claude falla o no hay clave, usa el fragmento grabado tal
   cual (`src/lib/matcher.ts` + respuesta local).
5. Toda respuesta incluye `disclaimer` (aviso de que esto es una recreación, no la
   persona) y `griefResources` (recursos de acompañamiento, sin tono alarmista) para que
   el frontend los muestre de forma visible pero no invasiva.
6. Un beneficiario puede pausar el modo conversación (`PATCH .../chat/pause`) sin perder
   acceso a la biblioteca de recuerdos.

## Cifrado y almacenamiento

Todo archivo (fotos, videos, audios, actas de defunción) se cifra con AES-256-GCM antes
de tocar disco (`src/lib/mediaCrypto.ts`), bajo `storage/<legacyId>/`. Solo se descifra
al servirlo a alguien con permiso de verlo (`isContentVisible`).

## Proveedores externos (todavía no conectados)

`src/providers/voiceProvider.ts` y `src/providers/avatarProvider.ts` definen la interfaz
para clonación de voz (ej. ElevenLabs) y avatar de video hablante (ej. HeyGen, D-ID).
Hoy devuelven una implementación "no-op" que lanza un error explicativo. Cuando haya
`ELEVENLABS_API_KEY` / `HEYGEN_API_KEY`, se implementa la clase real ahí — nada más en el
código necesita cambiar para activarlos.

## Qué falta (fuera del alcance de esta primera versión)

- Envío real de invitaciones por correo (hoy el enlace de invitación se devuelve en la
  respuesta de la API y se muestra en la pantalla de "Personas invitadas" para copiar y
  compartir manualmente).
- Activar los proveedores de voz/avatar cuando haya cuentas y API keys.
- Hosting real (hoy SQLite local) y revisión legal de cumplimiento normativo (GDPR u
  otras leyes locales de datos biométricos) antes de un despliegue con usuarios reales.
