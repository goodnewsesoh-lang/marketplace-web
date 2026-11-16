import type { Metadata } from 'next'

import { MyProducts } from '@/components/MyProducts'

export const metadata: Metadata = { title: 'My items' }

export default function ProductsPage() {
  return (
    <div className="container auth-wrap auth-wrap-wide">
      <MyProducts />
    </div>
  )
}
