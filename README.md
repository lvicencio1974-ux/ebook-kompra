# Legado Digital

Una aplicación para dejar un testimonio de vida — historias, consejos y recuerdos en
video, audio y texto — para que tus hijos u otras personas queridas puedan acceder a él y
"conversar" contigo, incluso después de que ya no estés.

El proyecto tiene dos partes:

- **`server/`** — API (Express + TypeScript + Prisma/SQLite): autenticación, roles
  (autor / beneficiario / albacea digital), visibilidad de contenido, verificación de
  fallecimiento, cifrado de archivos y el endpoint de conversación con Claude (o un
  respaldo local sin IA si no hay clave configurada). Ver `server/README.md` para el
  detalle completo.
- **`src/`** — Frontend (React + TypeScript + Vite) que consume esa API.

## Cómo correr todo localmente

**1. Backend**

```bash
cd server
cp .env.example .env
# completa JWT_SECRET y MEDIA_ENCRYPTION_KEY (el archivo .env.example explica cómo generarlos)
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev   # http://localhost:4000
```

**2. Frontend** (en otra terminal, desde la raíz del repo)

```bash
cp .env.example .env   # por defecto apunta a http://localhost:4000
npm install
npm run dev   # http://localhost:5173
```

Abre `http://localhost:5173`, crea una cuenta y crea tu legado.

## Flujo general

1. Te registras y creas un legado (le puedes poner tu nombre).
2. Completas tu perfil, escribes historias, respondes consejos guiados en video/audio/texto,
   y subes fotos y videos — cada contenido con su propia regla de cuándo se puede ver
   (inmediato, tras tu fallecimiento, desde una fecha, o desde cierta edad del destinatario).
3. Invitas a tus beneficiarios y a 1-2 personas de confianza como "albacea digital" desde
   *Personas invitadas*.
4. Cuando corresponda, un albacea inicia la verificación de fallecimiento (sube un
   documento); otra persona de confianza la confirma; hay un período de gracia durante el
   cual tú (el autor) puedes cancelar si sigue siendo un error. Pasado ese período sin
   cancelar, se desbloquea el modo conversación.
5. Tus beneficiarios pueden explorar la *Biblioteca de recuerdos* en cualquier momento
   (según lo que ya esté desbloqueado) y usar *Hablar conmigo* una vez confirmado el
   fallecimiento.

## Estado del proyecto

Funcional de punta a punta localmente. Antes de un despliegue real con usuarios de verdad
haría falta: hosting real (hoy corre con SQLite local), envío de invitaciones por correo
(hoy el enlace se comparte manualmente), activar clonación de voz/avatar de video si se
desea, y una revisión legal de cumplimiento normativo sobre datos biométricos.
