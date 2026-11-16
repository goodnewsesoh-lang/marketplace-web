import type { Metadata } from 'next'

import { ProductForm } from '@/components/ProductForm'

export const metadata: Metadata = { title: 'Add item' }

export default function NewProductPage() {
  return (
    <div className="container auth-wrap auth-wrap-wide">
      <ProductForm />
    </div>
  )
}
