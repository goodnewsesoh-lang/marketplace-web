import type { Metadata } from 'next'

import { ProductForm } from '@/components/ProductForm'

export const metadata: Metadata = { title: 'Edit item' }

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="container auth-wrap auth-wrap-wide">
      <ProductForm productId={id} />
    </div>
  )
}
