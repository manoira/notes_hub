import { useEffect } from 'react'
import { googleFontsUrl } from '../utils/pageFonts'

const loadedUrls = new Set<string>()

export function useGoogleFont(...fontIds: (string | undefined)[]) {
  useEffect(() => {
    const url = googleFontsUrl(fontIds.filter(Boolean) as string[])
    if (!url || loadedUrls.has(url)) return

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = url
    document.head.appendChild(link)
    loadedUrls.add(url)

    return () => {
      // Keep loaded fonts for the session — avoids flicker when switching pages.
    }
  }, [fontIds.join('|')])
}
