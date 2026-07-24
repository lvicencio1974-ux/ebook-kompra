import { useRef, useState } from 'react'
import { buildBackup, downloadBackup, parseBackupFile, restoreBackup } from '../utils/backup'
import { wipeAll } from '../db'
import type { Backup } from '../types'

export default function Settings() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [pendingBackup, setPendingBackup] = useState<Backup | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleExport() {
    setBusy(true)
    setStatus(null)
    try {
      const backup = await buildBackup()
      downloadBackup(backup)
      setStatus('Respaldo descargado correctamente.')
    } catch (err) {
      setStatus('Ocurrió un error al generar el respaldo.')
    } finally {
      setBusy(false)
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const backup = await parseBackupFile(file)
      setPendingBackup(backup)
      setStatus(null)
    } catch (err) {
      setStatus('No se pudo leer ese archivo. ¿Es un respaldo válido de Legado Digital?')
    }
    e.target.value = ''
  }

  async function handleRestore(mode: 'merge' | 'replace') {
    if (!pendingBackup) return
    if (mode === 'replace' && !confirm('Esto reemplazará todos los datos actuales. ¿Continuar?')) return
    setBusy(true)
    try {
      await restoreBackup(pendingBackup, mode)
      setStatus('Respaldo restaurado. Recarga la página para ver los cambios.')
      setPendingBackup(null)
    } catch (err) {
      setStatus('Ocurrió un error al restaurar el respaldo.')
    } finally {
      setBusy(false)
    }
  }

  async function handleWipe() {
    if (!confirm('Esto borrará TODO lo guardado en este dispositivo: perfil, historias, consejos, fotos y videos. Esta acción no se puede deshacer. ¿Continuar?')) return
    if (!confirm('¿Estás completamente seguro? Te recomendamos exportar un respaldo antes.')) return
    await wipeAll()
    setStatus('Todos los datos fueron eliminados. Recarga la página.')
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-3xl text-legado-100">Ajustes y respaldo</h2>
        <p className="mt-2 text-legado-200/70 max-w-2xl">
          Todo lo que escribes, grabas y subes se guarda únicamente en este navegador. No se envía a
          ningún servidor. Por eso es muy importante que exportes un respaldo y lo guardes en un
          lugar seguro (o lo compartas con la persona de confianza que deba tenerlo).
        </p>
      </div>

      {status && <div className="card p-4 text-sm text-legado-100">{status}</div>}

      <section className="card p-6 space-y-3">
        <h3 className="font-medium text-legado-100">Exportar respaldo</h3>
        <p className="text-sm text-legado-200/60">
          Descarga un archivo con tu perfil, historias, consejos, fotos y videos.
        </p>
        <button className="btn-primary" disabled={busy} onClick={handleExport}>
          Descargar respaldo
        </button>
      </section>

      <section className="card p-6 space-y-3">
        <h3 className="font-medium text-legado-100">Restaurar o importar respaldo</h3>
        <p className="text-sm text-legado-200/60">
          Sube un archivo de respaldo previamente exportado.
        </p>
        <button className="btn-secondary" onClick={() => fileRef.current?.click()}>
          Elegir archivo de respaldo
        </button>
        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={handleFile} />

        {pendingBackup && (
          <div className="mt-3 space-y-2 border-t border-legado-700/20 pt-3">
            <p className="text-sm text-legado-200/70">
              Respaldo con {pendingBackup.stories.length} historias, {pendingBackup.advice.length}{' '}
              consejos y {pendingBackup.media.length} archivos multimedia, exportado el{' '}
              {new Date(pendingBackup.exportedAt).toLocaleString()}.
            </p>
            <div className="flex gap-2">
              <button className="btn-primary" disabled={busy} onClick={() => handleRestore('merge')}>
                Combinar con lo actual
              </button>
              <button className="btn-secondary" disabled={busy} onClick={() => handleRestore('replace')}>
                Reemplazar todo
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="card p-6 space-y-3 border-red-500/20">
        <h3 className="font-medium text-red-300">Zona de peligro</h3>
        <p className="text-sm text-legado-200/60">
          Elimina permanentemente todos los datos guardados en este dispositivo.
        </p>
        <button className="btn-danger" onClick={handleWipe}>
          Borrar todos mis datos
        </button>
      </section>
    </div>
  )
}
