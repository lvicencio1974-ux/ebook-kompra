import { useEffect, useRef, useState } from 'react'
import type { MediaKind } from '../types'

interface Props {
  kind: MediaKind
  onCapture: (blob: Blob, mimeType: string) => void
}

export default function Recorder({ kind, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [active, setActive] = useState(false)
  const [recording, setRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    let timer: number | undefined
    if (recording) {
      timer = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    } else {
      setSeconds(0)
    }
    return () => window.clearInterval(timer)
  }, [recording])

  useEffect(() => {
    return () => stopCamera()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function startCamera() {
    setError(null)
    try {
      const constraints: MediaStreamConstraints =
        kind === 'audio' ? { audio: true } : { audio: kind === 'video', video: true }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      if (videoRef.current && kind !== 'audio') {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setActive(true)
    } catch (err) {
      setError('No pudimos acceder a tu cámara o micrófono. Revisa los permisos del navegador, o sube un archivo.')
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setActive(false)
    setRecording(false)
  }

  function startRecording() {
    if (!streamRef.current) return
    chunksRef.current = []
    const mimeType = kind === 'audio' ? 'audio/webm' : 'video/webm'
    const recorder = new MediaRecorder(streamRef.current, { mimeType })
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType })
      onCapture(blob, mimeType)
      stopCamera()
    }
    recorder.start()
    recorderRef.current = recorder
    setRecording(true)
  }

  function stopRecording() {
    recorderRef.current?.stop()
  }

  function capturePhoto() {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext('2d')
    ctx?.drawImage(videoRef.current, 0, 0)
    canvas.toBlob((blob) => {
      if (blob) onCapture(blob, 'image/png')
      stopCamera()
    }, 'image/png')
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    onCapture(file, file.type)
    e.target.value = ''
  }

  const kindLabel = kind === 'photo' ? 'foto' : kind === 'video' ? 'video' : 'audio'

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-300">{error}</p>}

      {active && kind !== 'audio' && (
        <video ref={videoRef} muted className="w-full max-w-md rounded-xl bg-black" playsInline />
      )}
      {active && kind === 'audio' && (
        <div className="flex items-center gap-2 text-legado-200/70 text-sm">
          <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" /> Micrófono activo
        </div>
      )}
      {recording && <p className="text-sm text-legado-200/60">Grabando… {seconds}s</p>}

      <div className="flex flex-wrap gap-2">
        {!active && (
          <button type="button" className="btn-secondary" onClick={startCamera}>
            Activar {kind === 'audio' ? 'micrófono' : 'cámara'}
          </button>
        )}
        {active && kind !== 'photo' && !recording && (
          <button type="button" className="btn-primary" onClick={startRecording}>
            Empezar a grabar {kindLabel}
          </button>
        )}
        {active && recording && (
          <button type="button" className="btn-danger" onClick={stopRecording}>
            Detener grabación
          </button>
        )}
        {active && kind === 'photo' && (
          <button type="button" className="btn-primary" onClick={capturePhoto}>
            Tomar foto
          </button>
        )}
        {active && (
          <button type="button" className="btn-secondary" onClick={stopCamera}>
            Cancelar
          </button>
        )}
        <button type="button" className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
          Subir {kindLabel} desde un archivo
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={kind === 'photo' ? 'image/*' : kind === 'video' ? 'video/*' : 'audio/*'}
          className="hidden"
          onChange={handleFile}
        />
      </div>
    </div>
  )
}
