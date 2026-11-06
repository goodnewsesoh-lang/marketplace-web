import { getSupabase } from './supabase'

export type StoreType = {
  slug: string
  name: string
  tagline: string
  icon: string
}

// Shown when the database cannot be reached, so the page is never empty.
export const FALLBACK_STORE_TYPES: StoreType[] = [
  { slug: 'music', name: 'Music store', tagline: 'Share tracks and albums with fans.', icon: 'music' },
  { slug: 'books', name: 'Book store', tagline: 'Showcase books, guides and stories.', icon: 'book' },
  { slug: 'digital', name: 'Digital store', tagline: 'Templates, courses, files and more.', icon: 'download' },
  { slug: 'fashion', name: 'Fashion store', tagline: 'Clothes, shoes, bags and accessories.', icon: 'shirt' },
  { slug: 'services', name: 'Services store', tagline: 'Offer your skills and bookings.', icon: 'wrench' },
  { slug: 'general', name: 'General store', tagline: 'Anything else you want to sell.', icon: 'grid' },
]

export async function getStoreTypes(): Promise<StoreType[]> {
  const supabase = getSupabase()
  if (!supabase) return FALLBACK_STORE_TYPES
  try {
    const { data, error } = await supabase
      .from('store_types')
      .select('slug, name, tagline, icon')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    if (error || !data || data.length === 0) return FALLBACK_STORE_TYPES
    return data.map((row) => ({
      slug: String(row.slug),
      name: String(row.name),
      tagline: row.tagline ? String(row.tagline) : '',
      icon: row.icon ? String(row.icon) : 'grid',
    }))
  } catch {
    return FALLBACK_STORE_TYPES
  }
}
