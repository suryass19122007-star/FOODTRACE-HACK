import { useCallback, useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import QRCode from 'qrcode'
import { AlertTriangle, Camera, CheckCircle2, Copy, ImageUp, Laptop, Smartphone, Wifi } from 'lucide-react'
import Logo from './Logo'
import { PRODUCT } from './data'

export const PRODUCT_ID = PRODUCT.batch // 'TPR-100926'
export const PRODUCT_PATH = `/product/${PRODUCT_ID}`
export const parseProductId = (text: string): string | null => {
  const t = text.trim()
  if (/^[A-Za-z0-9_-]+$/.test(t)) return t // bare ID, e.g. "TPR-100926"
  const m = t.match(/\/product\/([A-Za-z0-9_-]+)\/?(?:[?#].*)?$/)
  return m ? m[1] : null
}

type Mode = 'idle' | 'starting' | 'scanning' | 'success'
export interface ScanError { title: string; msg: string }
const INVALID: ScanError = { title: 'Product not recognized', msg: 'This QR code is not a recognized FoodTrace product.' }

function mapCameraError(e: unknown): ScanError {
  const s = `${(e as { name?: string })?.name ?? ''} ${(e as { message?: string })?.message ?? e}`
  if (/NotAllowed|Permission|denied/i.test(s)) return { title: 'Camera blocked', msg: 'Camera access is required to scan a product QR.' }
  if (/NotFound|DevicesNotFound|no camera|Requested device not found/i.test(s)) return { title: 'No camera', msg: 'No camera was detected on this device.' }
  return { title: 'Camera unavailable', msg: 'The camera could not be started. Close other apps using it and try again, or scan from a photo.' }
}

function DemoQR() {
  const [networkIps, setNetworkIps] = useState<string[]>([])
  const [selectedIp, setSelectedIp] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [src, setSrc] = useState('')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    fetch('/api/network-ip')
      .then((res) => res.json())
      .then((data: { ips?: string[] }) => {
        if (Array.isArray(data.ips) && data.ips.length > 0) {
          setNetworkIps(data.ips)
          const hotspotIp = data.ips.find((ip) => ip.startsWith('192.168.')) || data.ips[0]
          if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            setSelectedIp(hotspotIp)
          }
        }
      })
      .catch(() => { /* dev server plugin fallback */ })
  }, [])

  const currentHost = selectedIp || window.location.hostname
  const port = window.location.port ? `:${window.location.port}` : ''
  const protocol = window.location.protocol
  const url = `${protocol}//${currentHost}${port}${PRODUCT_PATH}`

  useEffect(() => {
    QRCode.toDataURL(url, { width: 512, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#1c2b22', light: '#ffffff' } })
      .then(setSrc).catch(() => setFailed(true))
  }, [url])

  const copyUrl = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  const isLocalhostHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

  return (
    <div className="rounded-3xl bg-white p-6 text-center ring-1 ring-black/5">
      <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-leafsoft px-3 py-1 text-xs font-semibold uppercase tracking-wider text-leaf">
        <Wifi size={14} /> Hotspot / Local Network QR
      </div>
      <h2 className="mt-3 font-display text-xl font-semibold tracking-wide">DEMO PRODUCT QR</h2>
      <p className="mt-1 text-sm text-ink/70">
        Connect your phone to this laptop&apos;s Hotspot, then scan this QR code with your phone camera to open the site directly!
      </p>

      <div className="mx-auto mt-4 flex h-60 w-60 items-center justify-center rounded-2xl bg-white p-2 shadow-inner ring-1 ring-black/10">
        {src ? <img src={src} alt={`QR code for ${url}`} className="h-full w-full rounded-xl" /> : <span className="px-4 text-sm text-ink/50">{failed ? 'Could not generate QR code.' : 'Generating QR…'}</span>}
      </div>

      <div className="mt-4 rounded-2xl bg-paper p-3 text-left ring-1 ring-black/5">
        <div className="mb-1 flex items-center justify-between gap-2 text-xs font-medium text-ink/60">
          <span className="flex items-center gap-1.5"><Laptop size={14} /> Network Host IP:</span>
          {networkIps.length > 0 && <span className="font-semibold text-leaf">Auto-detected</span>}
        </div>
        
        {networkIps.length > 0 ? (
          <select
            value={selectedIp || window.location.hostname}
            onChange={(e) => setSelectedIp(e.target.value)}
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm focus:border-leaf focus:outline-none"
          >
            {networkIps.map((ip) => (
              <option key={ip} value={ip}>
                {ip} {ip.startsWith('192.168.137.') ? '(Laptop Hotspot)' : ip.startsWith('192.168.') ? '(Wi-Fi / LAN)' : ''}
              </option>
            ))}
            <option value={window.location.hostname}>
              {window.location.hostname} (Current Host)
            </option>
          </select>
        ) : (
          <input
            type="text"
            value={selectedIp}
            onChange={(e) => setSelectedIp(e.target.value)}
            placeholder={window.location.hostname}
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-1.5 text-sm font-semibold text-ink"
          />
        )}

        <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl bg-white p-2 text-xs ring-1 ring-black/5">
          <span className="truncate font-mono font-medium text-ink/80">{url}</span>
          <button
            onClick={copyUrl}
            className="flex shrink-0 items-center gap-1 rounded-lg bg-leafsoft px-2.5 py-1 font-semibold text-leaf transition hover:bg-leaf hover:text-white"
          >
            <Copy size={13} /> {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-1.5 rounded-xl border border-leaf/20 bg-leafsoft/40 p-3 text-left text-xs text-ink/80">
        <p className="flex items-center gap-1.5 font-semibold text-leaf"><Smartphone size={14} /> How to open on your Phone:</p>
        <ol className="list-inside list-decimal space-y-1 pl-1 text-ink/70">
          <li>Turn on <strong>Mobile Hotspot</strong> on this laptop.</li>
          <li>Connect your phone to the hotspot Wi-Fi.</li>
          <li>Open your phone camera &amp; scan this QR.</li>
          <li>Tap the popup banner to view on your phone!</li>
        </ol>
      </div>

      {isLocalhostHost && (
        <p className="mt-3 rounded-xl bg-ambersoft p-2.5 text-left text-xs text-amber2">
          <strong>Note:</strong> QR is using IP <code>{currentHost}</code> instead of <code>localhost</code> so your phone can reach this laptop over the network!
        </p>
      )}
    </div>
  )
}

export default function ScanScreen({ onRecognized, initialError }: { onRecognized: () => void; initialError?: ScanError | null }) {
  const [mode, setMode] = useState<Mode>('idle')
  const [error, setError] = useState<ScanError | null>(initialError ?? null)
  const scanner = useRef<Html5Qrcode | null>(null)
  const run = useRef(0)
  const handled = useRef(false)
  const timer = useRef<number>()
  const fileInput = useRef<HTMLInputElement>(null)

  const stopCamera = useCallback(async () => {
    run.current++ // invalidates any start() still in flight
    const sc = scanner.current
    scanner.current = null
    if (!sc) return
    try { if (sc.isScanning) await sc.stop() } catch { /* already stopped */ }
    try { sc.clear() } catch { /* nothing to clear */ }
  }, [])

  useEffect(() => () => { window.clearTimeout(timer.current); void stopCamera() }, [stopCamera])

  const onText = useCallback((text: string) => {
    if (handled.current) return
    if (parseProductId(text) === PRODUCT_ID) {
      handled.current = true
      setError(null); setMode('success')
      void stopCamera()
      timer.current = window.setTimeout(onRecognized, 1300)
    } else setError(INVALID)
  }, [onRecognized, stopCamera])

  useEffect(() => {
    if (mode !== 'starting') return
    const id = ++run.current
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError({ title: 'Camera needs a secure connection', msg: 'Browsers only allow camera access on HTTPS or localhost. On this laptop, open http://localhost:5173 (or run npm run dev:https), or use “Scan from a photo”.' })
      setMode('idle'); return
    }
    const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    const sc = new Html5Qrcode('qr-reader', { verbose: false, formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE], useBarCodeDetectorIfSupported: true })
    scanner.current = sc
    sc.start(
      { facingMode: mobile ? 'environment' : 'user' }, // laptop webcam faces the user
      { fps: 10, aspectRatio: 1, qrbox: (w, h) => { const s = Math.floor(Math.min(w, h) * 0.7); return { width: s, height: s } } },
      onText, () => { /* no QR in this frame */ },
    ).then(async () => {
      if (run.current !== id) { try { await sc.stop(); sc.clear() } catch { /* ignore */ } return }
      setMode('scanning')
    }).catch((e) => {
      if (run.current !== id) return
      scanner.current = null
      setError(mapCameraError(e)); setMode('idle')
    })
  }, [mode, onText])

  const begin = () => { handled.current = false; setError(null); setMode('starting') }
  const cancel = async () => { await stopCamera(); setMode('idle'); setError(null) }

  const fromPhoto = async (f?: File) => {
    if (!f) return
    await stopCamera(); setMode('idle')
    const sc = new Html5Qrcode('qr-file', false)
    try { onText(await sc.scanFile(f, false)) }
    catch { setError({ title: 'No QR code found', msg: 'No QR code was found in that image. Try a sharper, closer photo.' }) }
    finally { try { sc.clear() } catch { /* ignore */ } if (fileInput.current) fileInput.current.value = '' }
  }

  const active = mode !== 'idle'
  return (
    <div className="mx-auto min-h-screen max-w-4xl px-5 py-8">
      <div className="flex flex-col items-center text-center">
        <Logo />
        <h1 className="mt-6 font-display text-3xl font-medium leading-tight">Trace every step. Build trust.</h1>
        <p className="mt-2 text-ink/70">Scan the QR code on your food product</p>
      </div>
      <div className="mt-8 grid gap-5 md:grid-cols-2 md:items-start">
        <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5">
          <h2 className="text-center font-semibold">Scan Product</h2>
          <div className="relative mx-auto mt-4 aspect-square w-full max-w-xs overflow-hidden rounded-2xl bg-ink/95">
            {active && <div id="qr-reader" className="h-full w-full" />}
            {!active && (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-white/70"><Camera size={44} /><span className="px-6 text-center text-sm">Camera starts after you tap Scan Product</span></div>
            )}
            {active && mode !== 'success' && (
              <div className="pointer-events-none absolute inset-[15%]">
                {['left-0 top-0 border-l-4 border-t-4 rounded-tl-xl', 'right-0 top-0 border-r-4 border-t-4 rounded-tr-xl', 'left-0 bottom-0 border-l-4 border-b-4 rounded-bl-xl', 'right-0 bottom-0 border-r-4 border-b-4 rounded-br-xl'].map((c) => <span key={c} className={`absolute h-8 w-8 border-white ${c}`} />)}
              </div>
            )}
            {mode === 'success' && (
              <div className="fade-in absolute inset-0 flex flex-col items-center justify-center gap-2 bg-leaf px-4 text-center text-white">
                <CheckCircle2 size={48} /><p className="font-semibold">Product recognized</p><p className="font-display text-xl">{PRODUCT.name}</p>
              </div>
            )}
          </div>
          <p className="mt-4 text-center text-sm text-ink/70">
            {mode === 'starting' ? 'Starting camera…' : mode === 'scanning' ? 'Scanning for product information…' : mode === 'success' ? 'Opening product…' : 'Point your camera at the FoodTrace QR code'}
          </p>
          {error && (
            <div role="alert" className="mt-3 flex gap-2.5 rounded-xl bg-rosesoft p-3 text-left text-sm text-rose2">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" /><div><p className="font-semibold">{error.title}</p><p>{error.msg}</p></div>
            </div>
          )}
          <div className="mt-4 flex flex-col items-center gap-2">
            {mode === 'idle' && <button onClick={begin} className="inline-flex items-center gap-2 rounded-xl bg-leaf px-6 py-3 font-semibold text-white transition hover:bg-[#186a41]"><Camera size={18} />Scan Product</button>}
            {(mode === 'starting' || mode === 'scanning') && <button onClick={cancel} className="rounded-xl px-6 py-2.5 font-semibold ring-1 ring-black/15 hover:bg-paper">Cancel</button>}
            {mode !== 'success' && (
              <>
                <button onClick={() => fileInput.current?.click()} className="inline-flex items-center gap-1.5 text-sm text-ink/60 underline-offset-2 hover:underline"><ImageUp size={15} />Scan from a photo</button>
                <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => void fromPhoto(e.target.files?.[0])} />
              </>
            )}
          </div>
          <div id="qr-file" className="hidden" />
        </div>
        <DemoQR />
      </div>
    </div>
  )
}
