import { ScanLine } from 'lucide-react'
export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-leaf text-white"><ScanLine size={18} /></span>
      <span className="font-display text-xl font-semibold tracking-tight">FoodTrace</span>
    </div>
  )
}
