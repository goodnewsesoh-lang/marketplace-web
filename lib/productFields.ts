export type ExtraField = {
  key: string
  label: string
  placeholder?: string
  options?: string[]
}

// Extra details asked for each store type. Saved in products.extras.
export const EXTRA_FIELDS: Record<string, ExtraField[]> = {
  music: [
    { key: 'artist', label: 'Artist', placeholder: 'e.g. Ada Beats' },
    { key: 'genre', label: 'Genre', placeholder: 'e.g. Afrobeats' },
    { key: 'format', label: 'Format', options: ['Single', 'Album', 'EP', 'Beat', 'Instrument', 'Other'] },
  ],
  books: [
    { key: 'author', label: 'Author', placeholder: 'e.g. Chinua Achebe' },
    { key: 'format', label: 'Format', options: ['Paperback', 'Hardcover', 'E-book', 'Audiobook'] },
    { key: 'language', label: 'Language', placeholder: 'e.g. English' },
  ],
  digital: [
    { key: 'file_type', label: 'File type', placeholder: 'e.g. PDF, ZIP, MP4' },
    { key: 'delivery_method', label: 'How the buyer receives it', placeholder: 'e.g. Link sent by email' },
  ],
  fashion: [
    { key: 'brand', label: 'Brand', placeholder: 'Optional' },
    { key: 'size', label: 'Size', placeholder: 'e.g. M, 42, One size' },
    { key: 'color', label: 'Colour', placeholder: 'e.g. Black' },
  ],
  services: [
    { key: 'pricing_basis', label: 'Price is', options: ['Fixed price', 'Per hour', 'Per day', 'Per project', 'Starting from'] },
    { key: 'service_area', label: 'Where you work', placeholder: 'e.g. Lagos or Online' },
  ],
  general: [],
}

export const NEEDS_CONDITION = new Set(['fashion', 'general'])

export function extraFieldsFor(slug: string | null | undefined): ExtraField[] {
  return EXTRA_FIELDS[slug ?? 'general'] ?? []
}
