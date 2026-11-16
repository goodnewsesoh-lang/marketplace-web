'use client'

import { useEffect, useState } from 'react'

import { readAuthLog } from '@/lib/authDebug'

// Temporary diagnostic panel. Remove once the logout problem is fixed.
export function AuthDebug() {
  const [lines, setLines] = useState<string[]>([])
  useEffect(() => {
    const update = () => setLines(readAuthLog())
    update()
    window.addEventListener('nexta-authlog', update)
    return () => window.removeEventListener('nexta-authlog', update)
  }, [])
  if (lines.length === 0) return null
  return (
    <pre style={{ margin: '24px auto', maxWidth: 760, padding: 12, fontSize: 12, background: '#f5f3ff', borderRadius: 8, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
      {'Session check (send me a screenshot of this):\n' + lines.join('\n')}
    </pre>
  )
}
