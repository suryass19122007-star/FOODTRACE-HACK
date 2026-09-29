import type { K } from './i18n'

export type Status = 'verified' | 'incomplete' | 'unverifiable' | 'traceable'
/** kind: 't' = translate value key, 'd' = day of Sept 2026, undefined = proper noun / literal */
export interface Row { label: K; v: string; kind?: 't' | 'd' }
export interface Evidence { k: K; ok: boolean }
export interface Stage {
  id: string; emoji: string; name: K; loc?: string; day: number; dayEnd?: number
  status: Status; rows: Row[]; desc: K; evidence: Evidence[]; value: K
  warn?: K; gap?: { title: K; text: K }
}

export const PRODUCT = { name: 'Thanjavur Premium Rice', batch: 'TPR-100926', score: 92 }

export const STAGES: Stage[] = [
  { id: 'harvested', emoji: '🌾', name: 'harvested', loc: 'Thanjavur, Tamil Nadu', day: 5, status: 'verified',
    rows: [{ label: 'producer', v: 'Green Fields Cooperative' }, { label: 'batch', v: 'GF-050926' }],
    desc: 'd_harvested', evidence: [{ k: 'e_harvest', ok: true }], value: 'v_prosperity' },
  { id: 'manufactured', emoji: '🏭', name: 'manufactured', loc: 'ABC Foods, Chennai', day: 10, status: 'verified',
    rows: [{ label: 'batch', v: 'ABC-100926' }, { label: 'process', v: 'pMilling', kind: 't' }],
    desc: 'd_manufactured', evidence: [{ k: 'e_prod', ok: true }], value: 'v_responsibility' },
  { id: 'quality', emoji: '🧪', name: 'quality', loc: 'ABC Foods Quality Lab, Chennai', day: 10, status: 'verified',
    rows: [{ label: 'certificate', v: 'QC-100926' }, { label: 'result', v: 'passed', kind: 't' }],
    desc: 'd_quality', evidence: [{ k: 'e_qc', ok: true }], value: 'v_responsibility' },
  { id: 'stored', emoji: '📦', name: 'stored', loc: 'Chennai Distribution Centre', day: 11, dayEnd: 14, status: 'incomplete',
    rows: [{ label: 'received', v: '11', kind: 'd' }, { label: 'dispatched', v: '14', kind: 'd' }, { label: 'storage', v: 'tempCtl', kind: 't' }],
    desc: 'd_stored', evidence: [{ k: 'e_temp', ok: false }], value: 'v_transparency',
    warn: 'warnStorage', gap: { title: 'gapTempTitle', text: 'gapTempText' } },
  { id: 'distributed', emoji: '🚚', name: 'distributed', loc: 'Chennai → Tambaram', day: 15, status: 'verified',
    rows: [{ label: 'distributor', v: 'South Supply Network' }, { label: 'dispatchDate', v: '15', kind: 'd' }, { label: 'handover', v: '15', kind: 'd' }],
    desc: 'd_distributed', evidence: [{ k: 'e_dist', ok: true }], value: 'v_trust' },
  { id: 'retail', emoji: '🏪', name: 'retail', loc: 'Local Retail Partner, Tambaram', day: 15, status: 'verified',
    rows: [{ label: 'received', v: '15', kind: 'd' }, { label: 'stocked', v: '16', kind: 'd' }],
    desc: 'd_retail', evidence: [{ k: 'e_receipt', ok: true }], value: 'v_responsibility' },
  { id: 'consumer', emoji: '👤', name: 'consumer', day: 29, status: 'traceable',
    rows: [{ label: 'journey', v: 'journeyVal', kind: 't' }, { label: 'infoGaps', v: 'gapsVal', kind: 't' }],
    desc: 'd_consumer', evidence: [], value: 'v_understanding' },
]

export const COUNTS = {
  verified: STAGES.filter(s => s.status === 'verified').length,
  incomplete: STAGES.filter(s => s.status === 'incomplete').length,
  traceable: STAGES.filter(s => s.status === 'traceable').length,
}
