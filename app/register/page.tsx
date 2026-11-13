import type { Metadata } from 'next'

import { RegisterFlow } from '@/components/RegisterFlow'
import { getStoreTypes } from '@/lib/storeTypes'

export const metadata: Metadata = { title: 'Open your store' }

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const { type } = await searchParams
  const types = await getStoreTypes()

  return (
    <div className="container auth-wrap">
      <RegisterFlow types={types} initialType={type} />
    </div>
  )
}
