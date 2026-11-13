import type { Metadata } from 'next'

import { DashboardView } from '@/components/DashboardView'

export const metadata: Metadata = { title: 'Dashboard' }

export default function DashboardPage() {
  return (
    <div className="container auth-wrap auth-wrap-wide">
      <DashboardView />
    </div>
  )
}
