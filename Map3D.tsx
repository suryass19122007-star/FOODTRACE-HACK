import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html, Line } from '@react-three/drei'
import * as THREE from 'three'
import { STAGES, type Status } from './data'

const S = 4
const P = (lon: number, lat: number, y = 0.3) => new THREE.Vector3((lon - 78.6) * S, y, -(lat - 10.8) * S)
const THANJ = P(79.14, 10.79), CHEN = P(80.27, 13.08), TAMB = P(80.12, 12.92)
const off = (v: THREE.Vector3, x: number, z: number) => v.clone().add(new THREE.Vector3(x, 0, z))

const POS: Record<string, THREE.Vector3> = {
  harvested: THANJ,
  manufactured: off(CHEN, -0.65, -0.45),
  quality: off(CHEN, 0.25, -0.85),
  stored: off(CHEN, 0.75, 0.15),
  distributed: CHEN.clone().lerp(TAMB, 0.5),
  retail: off(TAMB, -0.4, 0.5),
  consumer: off(TAMB, 0.5, 0.6),
}
const CITIES = [{ n: 'Thanjavur', p: THANJ }, { n: 'Chennai', p: off(CHEN, 0, -0.1) }, { n: 'Tambaram', p: off(TAMB, -0.1, 0.05) }]
const ROUTES = [
  { a: THANJ, b: CHEN, on: ['harvested', 'manufactured'] },
  { a: CHEN, b: TAMB, on: ['distributed', 'retail'] },
]
const COAST: [number, number][] = [[79.3,13.55],[80.5,13.4],[80.55,12.9],[80.4,12.3],[80.0,11.9],[79.9,11.3],[79.85,10.8],[79.85,10.3],[79.35,10.25],[79.0,9.7],[78.4,9.2],[78.15,8.75],[77.55,8.08],[77.15,8.4],[76.95,9.1],[77.2,10.0],[76.9,10.9],[77.3,11.6],[77.7,12.1],[78.2,12.8],[78.6,13.3]]

const COLOR: Record<Status, string> = { verified: '#1f7a4d', traceable: '#1f7a4d', incomplete: '#b7791f', unverifiable: '#b42318' }
const HOME_T = new THREE.Vector3(0.5, 0, -0.5), HOME_P = new THREE.Vector3(0, 17, 15)

function Land() {
  const geo = useMemo(() => {
    const sh = new THREE.Shape(COAST.map(([lo, la]) => new THREE.Vector2((lo - 78.6) * S, (la - 10.8) * S)))
    return new THREE.ExtrudeGeometry(sh, { depth: 0.25, bevelEnabled: false })
  }, [])
  const edges = useMemo(() => new THREE.EdgesGeometry(geo), [geo])
  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh geometry={geo}><meshStandardMaterial color="#d3e5c8" roughness={0.9} /></mesh>
      <lineSegments geometry={edges}><lineBasicMaterial color="#8db98f" /></lineSegments>
    </group>
  )
}

function Route({ a, b, active }: { a: THREE.Vector3; b: THREE.Vector3; active: boolean }) {
  const pts = useMemo(() => {
    const mid = a.clone().lerp(b, 0.5); mid.y += a.distanceTo(b) * 0.28
    return new THREE.QuadraticBezierCurve3(a.clone().setY(0.4), mid, b.clone().setY(0.4)).getPoints(48)
  }, [a, b])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<any>(null)
  useFrame((_, d) => { const m = ref.current?.material; if (m) m.dashOffset -= d * (active ? 0.9 : 0.3) })
  return <Line ref={ref} points={pts} color={active ? '#1f7a4d' : '#9db3a4'} lineWidth={active ? 4 : 2} dashed dashSize={0.28} gapSize={0.18} />
}

function Marker({ id, emoji, status, label, selected, onSelect }: { id: string; emoji: string; status: Status; label: string; selected: boolean; onSelect: (id: string) => void }) {
  const ring = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ring.current) return
    const s = selected ? 1 + ((clock.elapsedTime * 1.2) % 1) * 1.2 : 1
    ring.current.scale.setScalar(s)
    ;(ring.current.material as THREE.MeshBasicMaterial).opacity = selected ? 0.6 - (s - 1) * 0.45 : 0
  })
  return (
    <group position={POS[id]}>
      <mesh onClick={(e) => { e.stopPropagation(); onSelect(id) }}>
        <sphereGeometry args={[selected ? 0.17 : 0.12, 20, 20]} />
        <meshStandardMaterial color={COLOR[status]} emissive={COLOR[status]} emissiveIntensity={selected ? 0.7 : 0.25} />
      </mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.26, 32]} /><meshBasicMaterial color={COLOR[status]} transparent opacity={0} />
      </mesh>
      <Html center position={[0, 0.5, 0]} zIndexRange={[10, 0]}>
        <button onClick={() => onSelect(id)} aria-label={label} className="flex flex-col items-center gap-1">
          <span className={`flex items-center justify-center rounded-full bg-white text-base shadow-md border-2 transition-all ${selected ? 'w-10 h-10 scale-110' : 'w-8 h-8'}`}
            style={{ borderColor: COLOR[status] }}>{emoji}</span>
          {selected && <span className="whitespace-nowrap rounded-full bg-ink px-2.5 py-0.5 text-xs font-medium text-white">{label}</span>}
        </button>
      </Html>
    </group>
  )
}

function Scene({ selected, names, resetKey, onSelect }: { selected: string | null; names: Record<string, string>; resetKey: number; onSelect: (id: string) => void }) {
  const { camera } = useThree()
  const controls = useThree((s) => s.controls) as unknown as { target: THREE.Vector3; update: () => void } | null
  const goal = useRef<{ t: THREE.Vector3; p: THREE.Vector3 } | null>(null)
  useEffect(() => {
    const p = selected ? POS[selected] : null
    goal.current = p ? { t: p.clone().setY(0), p: p.clone().add(new THREE.Vector3(0, 4.5, 5.5)) } : { t: HOME_T, p: HOME_P }
  }, [selected, resetKey])
  useFrame(() => {
    const g = goal.current
    if (!g || !controls) return
    controls.target.lerp(g.t, 0.07); camera.position.lerp(g.p, 0.07); controls.update()
    if (camera.position.distanceTo(g.p) < 0.03) goal.current = null
  })
  return (
    <>
      <color attach="background" args={['#f1f5ee']} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[6, 12, 8]} intensity={1.1} />
      <gridHelper args={[60, 60, '#dbe5e3', '#e6eeec']} position={[0, -0.02, 0]} />
      <Land />
      {ROUTES.map((r, i) => <Route key={i} a={r.a} b={r.b} active={!!selected && r.on.includes(selected)} />)}
      {CITIES.map((c) => (
        <Html key={c.n} position={[c.p.x, 0.05, c.p.z]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
          <span className="translate-y-8 block text-[11px] font-semibold tracking-wide text-ink/60">{c.n}</span>
        </Html>
      ))}
      {STAGES.map((s) => <Marker key={s.id} id={s.id} emoji={s.emoji} status={s.status} label={names[s.id]} selected={selected === s.id} onSelect={onSelect} />)}
      <OrbitControls makeDefault enableDamping minDistance={4} maxDistance={30} maxPolarAngle={Math.PI / 2.15} onStart={() => { goal.current = null }} />
    </>
  )
}

export default function Map3D(props: { selected: string | null; names: Record<string, string>; resetKey: number; onSelect: (id: string) => void }) {
  return (
    <Canvas camera={{ position: HOME_P.toArray(), fov: 40 }} dpr={[1, 2]}>
      <Scene {...props} />
    </Canvas>
  )
}
