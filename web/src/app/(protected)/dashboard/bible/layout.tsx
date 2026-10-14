import { PalavraTabs } from '@/components/palavra/PalavraTabs'

export default function BibleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <PalavraTabs />
      {children}
    </div>
  )
}
