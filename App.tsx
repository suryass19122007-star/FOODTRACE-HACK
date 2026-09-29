import { createContext, lazy, Suspense, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronDown, Languages, Package, RotateCcw, ShieldCheck, X } from 'lucide-react'
import { dict, type K, type Lang } from './i18n'
import { COUNTS, PRODUCT, STAGES, type Stage, type Status } from './data'
import Logo from './Logo'
import ScanScreen, { PRODUCT_ID, PRODUCT_PATH, parseProductId, type ScanError } from './Scan'

const Map3D = lazy(() => import('./Map3D'))

const LangCtx = createContext<{ lang: Lang; t: (k: K) => string }>({ lang: 'en', t: (k) => k })
const useT = () => useContext(LangCtx)

const STATUS_STYLE: Record<Status, { cls: string; Icon: typeof CheckCircle2 }> = {
  verified: { cls: 'bg-leafsoft text-leaf', Icon: CheckCircle2 },
  traceable: { cls: 'bg-leafsoft text-leaf', Icon: CheckCircle2 },
  incomplete: { cls: 'bg-ambersoft text-amber2', Icon: AlertTriangle },
  unverifiable: { cls: 'bg-rosesoft text-rose2', Icon: AlertTriangle },
}

function Badge({ status }: { status: Status }) {
  const { t } = useT()
  const { cls, Icon } = STATUS_STYLE[status]
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}><Icon size={13} />{t(status)}</span>
}

function useDate() {
  const { t } = useT()
  return {
    short: (d: number, end?: number) => `${String(d).padStart(2, '0')}${end ? '–' + end : ''} ${t('sept')} 2026`,
    long: (d: number) => `${String(d).padStart(2, '0')} ${t('september')} 2026`,
  }
}

/* ---------- Screen 2: language ---------- */
function LangScreen({ lang, setLang, onBack, onContinue }: { lang: Lang; setLang: (l: Lang) => void; onBack: () => void; onContinue: () => void }) {
  const { t } = useT()
  const opts: { id: Lang; flag: string; label: string }[] = [{ id: 'en', flag: '🇬🇧', label: 'English' }, { id: 'ta', flag: '🇮🇳', label: 'தமிழ்' }]
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <button onClick={onBack} className="mb-8 inline-flex w-fit items-center gap-1.5 text-sm text-ink/60 hover:text-ink"><ArrowLeft size={16} />{t('back')}</button>
      <h1 className="font-display text-3xl font-medium">{dict.en.chooseLang}</h1>
      <p className="mt-2 text-lg text-ink/70">{dict.ta.chooseLang}</p>
      <div className="mt-8 space-y-3" role="radiogroup">
        {opts.map((o) => (
          <button key={o.id} role="radio" aria-checked={lang === o.id} onClick={() => setLang(o.id)}
            className={`flex w-full items-center gap-4 rounded-2xl border-2 bg-white px-5 py-4 text-left transition ${lang === o.id ? 'border-leaf' : 'border-transparent ring-1 ring-black/10 hover:ring-black/20'}`}>
            <span className="text-2xl">{o.flag}</span><span className="flex-1 text-lg font-medium">{o.label}</span>
            <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${lang === o.id ? 'border-leaf bg-leaf' : 'border-black/20'}`}>{lang === o.id && <span className="h-2 w-2 rounded-full bg-white" />}</span>
          </button>
        ))}
      </div>
      <button onClick={onContinue} className="mt-8 rounded-xl bg-leaf px-6 py-3 font-semibold text-white transition hover:bg-[#186a41]">{t('continue')}</button>
    </div>
  )
}

/* ---------- Dashboard pieces ---------- */
function Ring({ pct }: { pct: number }) {
  const r = 38, c = 2 * Math.PI * r
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e4f2ea" strokeWidth="9" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="#1f7a4d" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${(c * pct) / 100} ${c}`} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-2xl font-semibold">{pct}%</span>
    </div>
  )
}

function DetailPanel({ s }: { s: Stage }) {
  const { t } = useT()
  const fmt = useDate()
  const dateVal = (v: string) => fmt.long(Number(v))
  return (
    <div className="fade-in mt-4 space-y-4 border-t border-black/10 pt-4 text-sm">
      {s.id === 'manufactured' && (
        <div className="rounded-xl bg-leafsoft p-4">
          <p className="text-xs font-semibold tracking-wider text-leaf">{t('mfgLabel')}</p>
          <p className="mt-1 font-display text-3xl font-semibold text-ink">{t('mfgDate')}</p>
          <ul className="mt-3 space-y-1.5 text-ink/80">
            <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-leaf" />{t('e_prod')}</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-leaf" />{t('mfgBatch')} ABC-100926</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-leaf" />{t('mfgFacility')}: ABC Foods, Chennai</li>
          </ul>
        </div>
      )}
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
        <dt className="text-ink/50">{t('stage')}</dt><dd className="font-medium">{t(s.name)}</dd>
        <dt className="text-ink/50">{t(s.id === 'consumer' ? 'scanDate' : 'date')}</dt><dd className="font-medium">{fmt.long(s.day)}</dd>
        {s.loc && <><dt className="text-ink/50">{t('location')}</dt><dd className="font-medium">{s.loc}</dd></>}
        {s.rows.map((r) => (
          <div key={r.label} className="contents">
            <dt className="text-ink/50">{t(r.label)}</dt>
            <dd className="font-medium">{r.kind === 'd' ? dateVal(r.v) : r.kind === 't' ? t(r.v as K) : r.v}</dd>
          </div>
        ))}
      </dl>
      <p className="text-ink/80">{t(s.desc)}</p>
      {s.evidence.length > 0 && (
        <div>
          <p className="mb-1.5 font-semibold">{t('evidence')}</p>
          <ul className="space-y-1.5">
            {s.evidence.map((e) => (
              <li key={e.k} className={`flex items-start gap-2 ${e.ok ? 'text-ink/80' : 'text-amber2'}`}>
                {e.ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-leaf" /> : <AlertTriangle size={16} className="mt-0.5 shrink-0" />}{t(e.k)}
              </li>
            ))}
          </ul>
        </div>
      )}
      {s.warn && (
        <div className="flex gap-2.5 rounded-xl bg-ambersoft p-3 text-amber2">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" /><p>{t(s.warn)}</p>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="flex items-center gap-2"><span className="text-ink/50">{t('verification')}</span><Badge status={s.status} /></span>
        <span className="flex items-center gap-2"><span className="text-ink/50">{t('humanValue')}</span><span className="rounded-full bg-paper px-2.5 py-0.5 text-xs font-semibold ring-1 ring-black/10">{t(s.value)}</span></span>
      </div>
    </div>
  )
}

function Timeline({ selected, onSelect, refs }: { selected: string | null; onSelect: (id: string) => void; refs: React.MutableRefObject<Record<string, HTMLDivElement | null>> }) {
  const { t } = useT()
  const fmt = useDate()
  return (
    <ol className="relative space-y-3 pl-14">
      <span className="absolute bottom-6 left-[21px] top-6 w-0.5 bg-black/10" aria-hidden />
      {STAGES.map((s) => {
        const on = selected === s.id
        const dot = s.status === 'incomplete' ? 'border-amber2' : 'border-leaf'
        return (
          <li key={s.id} ref={(el) => { refs.current[s.id] = el as HTMLDivElement | null }} className="relative scroll-mt-4">
            <span className={`absolute -left-14 top-3 flex h-11 w-11 items-center justify-center rounded-full border-2 bg-white text-lg transition ${dot} ${on ? 'scale-110 shadow-md ring-4 ring-leafsoft' : ''}`}>{s.emoji}</span>
            <div className={`rounded-2xl bg-white p-4 transition ${on ? 'ring-2 ring-leaf' : 'ring-1 ring-black/10 hover:ring-black/25'}`}>
              <button onClick={() => onSelect(s.id)} aria-expanded={on} className="flex w-full items-start justify-between gap-3 text-left">
                <span>
                  <span className="block font-semibold">{t(s.name)}</span>
                  {s.loc && <span className="block text-sm text-ink/60">{s.loc}</span>}
                  <span className="block text-sm text-ink/60">{fmt.short(s.day, s.dayEnd)}</span>
                  <span className="mt-2 block"><Badge status={s.status} /></span>
                </span>
                <ChevronDown size={18} className={`mt-1 shrink-0 text-ink/40 transition ${on ? 'rotate-180' : ''}`} />
              </button>
              {on && <DetailPanel s={s} />}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function GapsModal({ onClose }: { onClose: () => void }) {
  const { t } = useT()
  useEffect(() => { const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h) }, [onClose])
  const gaps = STAGES.filter((s) => s.gap)
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center" onClick={onClose} role="dialog" aria-modal="true" aria-label={t('gapsTitle')}>
      <div className="fade-in w-full max-w-md rounded-3xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-medium">{t('gapsTitle')}</h2>
          <button onClick={onClose} aria-label={t('close')} className="rounded-full p-1.5 hover:bg-black/5"><X size={20} /></button>
        </div>
        <ul className="mt-4 space-y-3">
          {gaps.map((s) => (
            <li key={s.id} className="flex gap-3 rounded-xl bg-ambersoft p-3.5">
              <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber2" />
              <div><p className="font-semibold text-amber2">{t(s.gap!.title)}</p><p className="text-sm text-ink/80">{t(s.gap!.text)}</p></div>
            </li>
          ))}
        </ul>
        <p className="mt-4 border-l-2 border-leaf pl-3 text-sm text-ink/70">{t('gapsNote')}</p>
        <button onClick={onClose} className="mt-5 w-full rounded-xl bg-ink px-4 py-2.5 font-semibold text-white">{t('close')}</button>
      </div>
    </div>
  )
}

const VALUES: { e: string; name: K; d: K }[] = [
  { e: '🤝', name: 'v_prosperity', d: 'vd_prosperity' }, { e: '🧭', name: 'v_responsibility', d: 'vd_responsibility' },
  { e: '🔎', name: 'v_transparency', d: 'vd_transparency' }, { e: '🧠', name: 'v_understanding', d: 'vd_understanding' },
]

function Dashboard({ lang, setLang, onBack }: { lang: Lang; setLang: (l: Lang) => void; onBack: () => void }) {
  const { t } = useT()
  const [selected, setSelected] = useState<string | null>(null)
  const [resetKey, setResetKey] = useState(0)
  const [gaps, setGaps] = useState(false)
  const refs = useRef<Record<string, HTMLDivElement | null>>({})
  const names = useMemo(() => Object.fromEntries(STAGES.map((s) => [s.id, dict[lang][s.name]])), [lang])
  const pick = (id: string, fromMap = false) => {
    setSelected((cur) => (!fromMap && cur === id ? null : id))
    if (fromMap) setTimeout(() => refs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
  }
  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <header className="flex items-center justify-between py-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} aria-label={t('back')} className="rounded-full p-2 ring-1 ring-black/10 hover:bg-white"><ArrowLeft size={18} /></button>
          <Logo />
        </div>
        <div className="flex items-center gap-1 rounded-full bg-white p-1 ring-1 ring-black/10">
          <Languages size={16} className="ml-2 text-ink/50" />
          {(['en', 'ta'] as Lang[]).map((l) => (
            <button key={l} onClick={() => setLang(l)} className={`rounded-full px-3 py-1 text-sm font-medium ${lang === l ? 'bg-leaf text-white' : 'text-ink/70'}`}>{l === 'en' ? 'English' : 'தமிழ்'}</button>
          ))}
        </div>
      </header>

      <section className="mt-2 grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-leafsoft text-leaf"><Package size={24} /></span>
            <div>
              <h1 className="font-display text-3xl font-medium leading-tight">{PRODUCT.name}</h1>
              <p className="mt-1 text-sm text-ink/60">{t('qty')}: {t('qtyVal')} · {t('category')}: {t('categoryVal')} · {t('batch')}: {PRODUCT.batch}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl bg-paper px-4 py-3 text-sm">
            <span className="flex items-center gap-2 font-semibold"><ShieldCheck size={18} className="text-leaf" />{t('summaryTitle')} <span className="font-display text-lg text-leaf">{PRODUCT.score}%</span></span>
            <span className="text-leaf">{COUNTS.verified + COUNTS.traceable} {t('verifiedRecords')}</span>
            <span className="text-amber2">{COUNTS.incomplete} {t('incompleteRecords')}</span>
          </div>
        </div>
        <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5">
          <h2 className="font-semibold">{t('overview')}</h2>
          <div className="mt-3 flex items-center gap-5">
            <Ring pct={PRODUCT.score} />
            <div className="space-y-1 text-sm">
              <p className="font-medium">{t('evidenceBacked')}</p>
              <p className="flex items-center gap-1.5 text-leaf"><CheckCircle2 size={14} />{COUNTS.verified} {t('verifiedStages')}</p>
              <p className="flex items-center gap-1.5 text-amber2"><AlertTriangle size={14} />{COUNTS.incomplete} {t('incompleteStages')}</p>
              <p className="flex items-center gap-1.5 text-leaf"><CheckCircle2 size={14} />{COUNTS.traceable} {t('traceableEvent')}</p>
            </div>
          </div>
          <button onClick={() => setGaps(true)} className="mt-4 rounded-xl px-4 py-2 text-sm font-semibold text-amber2 ring-1 ring-amber2/40 hover:bg-ambersoft">{t('viewGaps')}</button>
        </div>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <div className="lg:sticky lg:top-4 lg:self-start">
          <div className="relative h-[320px] overflow-hidden rounded-3xl ring-1 ring-black/10 lg:h-[calc(100vh-2rem)] lg:max-h-[680px]">
            <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-ink/50">…</div>}>
              <Map3D selected={selected} names={names} resetKey={resetKey} onSelect={(id) => pick(id, true)} />
            </Suspense>
            <button onClick={() => { setSelected(null); setResetKey((k) => k + 1) }} className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium shadow ring-1 ring-black/10"><RotateCcw size={13} />{t('resetView')}</button>
            <p className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs text-ink/60">{t('mapHint')}</p>
          </div>
        </div>
        <div>
          <h2 className="mb-1 font-display text-2xl font-medium">{t('journeyTitle')}</h2>
          <p className="mb-4 text-sm text-ink/60">{t('tapHint')}</p>
          <Timeline selected={selected} onSelect={(id) => pick(id)} refs={refs} />
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-3xl font-medium">{t('why')}</h2>
        <p className="mt-1 text-ink/70">{t('whySub')}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => (
            <div key={v.name} className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-leafsoft text-xl">{v.e}</span>
              <h3 className="mt-3 font-semibold">{t(v.name)}</h3>
              <p className="mt-1 text-sm text-ink/65">{t(v.d)}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-12 max-w-xl text-center font-display text-2xl leading-snug">{t('closing1')}<br /><span className="text-leaf">{t('closing2')}</span></p>
      </section>
      {gaps && <GapsModal onClose={() => setGaps(false)} />}
    </div>
  )
}

type Screen = 'scan' | 'lang' | 'dash'
const fromPath = (): { screen: Screen; err: ScanError | null } => {
  const id = window.location.pathname.startsWith('/product/') ? parseProductId(window.location.pathname) : null
  if (id === PRODUCT_ID) return { screen: 'lang', err: null }
  if (id) { window.history.replaceState(null, '', '/'); return { screen: 'scan', err: { title: 'Product not recognized', msg: 'This QR code is not a recognized FoodTrace product.' } } }
  return { screen: 'scan', err: null }
}

export default function App() {
  const [init] = useState(fromPath)
  const [screen, setScreen] = useState<Screen>(init.screen)
  const [lang, setLang] = useState<Lang>('en')
  const ctx = useMemo(() => ({ lang, t: (k: K) => dict[lang][k] }), [lang])
  useEffect(() => { document.documentElement.lang = lang }, [lang])
  useEffect(() => {
    const h = () => setScreen((cur) => (window.location.pathname === PRODUCT_PATH ? (cur === 'scan' ? 'lang' : cur) : 'scan'))
    window.addEventListener('popstate', h)
    return () => window.removeEventListener('popstate', h)
  }, [])
  const recognized = () => { window.history.pushState(null, '', PRODUCT_PATH); setScreen('lang') }
  const toScan = () => { if (window.location.pathname !== '/') window.history.pushState(null, '', '/'); setScreen('scan') }
  return (
    <LangCtx.Provider value={ctx}>
      <div key={screen} className="fade-in">
        {screen === 'scan' && <ScanScreen onRecognized={recognized} initialError={init.err} />}
        {screen === 'lang' && <LangScreen lang={lang} setLang={setLang} onBack={toScan} onContinue={() => setScreen('dash')} />}
        {screen === 'dash' && <Dashboard lang={lang} setLang={setLang} onBack={() => setScreen('lang')} />}
      </div>
    </LangCtx.Provider>
  )
}
