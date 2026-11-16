// Temporary: records login events so we can see why a session is cleared.
const KEY = 'nexta-authlog'

export function logAuth(message: string) {
  try {
    const t = new Date().toISOString().slice(11, 19)
    const list: string[] = JSON.parse(sessionStorage.getItem(KEY) || '[]')
    list.push(`${t} ${message}`)
    sessionStorage.setItem(KEY, JSON.stringify(list.slice(-25)))
    window.dispatchEvent(new Event('nexta-authlog'))
  } catch {
    /* ignore */
  }
}

export function readAuthLog(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}
