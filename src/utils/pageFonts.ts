export type PageFontId =
  | 'instrument-serif'
  | 'inter'
  | 'lora'
  | 'playfair-display'
  | 'dm-serif-display'
  | 'source-serif-4'
  | 'source-sans-3'
  | 'ibm-plex-sans'
  | 'nunito-sans'
  | 'merriweather'
  | 'crimson-pro'
  | 'libre-baskerville'

export type PageFontOption = {
  id: PageFontId
  label: string
  category: 'serif' | 'sans'
  googleFamily: string
  weights: string
}

export const DEFAULT_HEADING_FONT: PageFontId = 'instrument-serif'
export const DEFAULT_BODY_FONT: PageFontId = 'inter'

export const HEADING_FONTS: PageFontOption[] = [
  { id: 'instrument-serif', label: 'Instrument Serif', category: 'serif', googleFamily: 'Instrument Serif', weights: '400' },
  { id: 'lora', label: 'Lora', category: 'serif', googleFamily: 'Lora', weights: '400;500;600' },
  { id: 'playfair-display', label: 'Playfair Display', category: 'serif', googleFamily: 'Playfair Display', weights: '400;500;600' },
  { id: 'dm-serif-display', label: 'DM Serif Display', category: 'serif', googleFamily: 'DM Serif Display', weights: '400' },
  { id: 'source-serif-4', label: 'Source Serif 4', category: 'serif', googleFamily: 'Source Serif 4', weights: '400;600' },
  { id: 'merriweather', label: 'Merriweather', category: 'serif', googleFamily: 'Merriweather', weights: '400;700' },
  { id: 'crimson-pro', label: 'Crimson Pro', category: 'serif', googleFamily: 'Crimson Pro', weights: '400;600' },
  { id: 'libre-baskerville', label: 'Libre Baskerville', category: 'serif', googleFamily: 'Libre Baskerville', weights: '400;700' },
]

export const BODY_FONTS: PageFontOption[] = [
  { id: 'inter', label: 'Inter', category: 'sans', googleFamily: 'Inter', weights: '400;500;600' },
  { id: 'source-sans-3', label: 'Source Sans 3', category: 'sans', googleFamily: 'Source Sans 3', weights: '400;500;600' },
  { id: 'ibm-plex-sans', label: 'IBM Plex Sans', category: 'sans', googleFamily: 'IBM Plex Sans', weights: '400;500;600' },
  { id: 'nunito-sans', label: 'Nunito Sans', category: 'sans', googleFamily: 'Nunito Sans', weights: '400;600' },
  { id: 'lora', label: 'Lora', category: 'serif', googleFamily: 'Lora', weights: '400;500' },
  { id: 'source-serif-4', label: 'Source Serif 4', category: 'serif', googleFamily: 'Source Serif 4', weights: '400' },
]

const ALL_FONTS = [...HEADING_FONTS, ...BODY_FONTS]

export function findPageFont(id: string | undefined): PageFontOption | undefined {
  if (!id) return undefined
  return ALL_FONTS.find(font => font.id === id)
}

export function fontFamilyCss(id: string | undefined, role: 'heading' | 'body'): string {
  const fallback = role === 'heading' ? 'Georgia, serif' : 'ui-sans-serif, system-ui, sans-serif'
  const font = findPageFont(id)
  if (!font) {
    return role === 'heading' ? `'Instrument Serif', ${fallback}` : `'Inter', ${fallback}`
  }
  return `'${font.googleFamily}', ${fallback}`
}

export function googleFontsUrl(fontIds: string[]): string {
  const unique = new Map<string, PageFontOption>()
  for (const id of fontIds) {
    const font = findPageFont(id)
    if (font) unique.set(font.googleFamily, font)
  }
  if (unique.size === 0) return ''

  const families = [...unique.values()]
    .map(font => {
      const name = font.googleFamily.replace(/ /g, '+')
      return `family=${name}:wght@${font.weights}`
    })
    .join('&')

  return `https://fonts.googleapis.com/css2?${families}&display=swap`
}
