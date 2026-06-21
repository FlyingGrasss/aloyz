import { Suspense } from 'react'
import { DashboardApp } from '@/components/dashboard/DashboardApp'

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardApp />
    </Suspense>
  )
}

function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#e9edf3] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-sm font-semibold text-slate-600">
        <div className="size-8 rounded-full border-4 border-[#5f86b6] border-t-transparent animate-spin" />
        Yükleniyor...
      </div>
    </div>
  )
}
