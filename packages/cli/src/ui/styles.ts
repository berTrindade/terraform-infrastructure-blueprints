import gradient from 'gradient-string'
import pc from 'picocolors'

interface Gradient {
  (text: string, options?: unknown): string
  multiline(text: string, options?: unknown): string
}

export const crystalGradient: Gradient = gradient([
  { color: '#1e3a8a', pos: 0 },
  { color: '#3b82f6', pos: 0.3 },
  { color: '#0ea5e9', pos: 0.5 },
  { color: '#06b6d4', pos: 0.7 },
  { color: '#22d3ee', pos: 1 },
]) as Gradient

export const S_BAR = '│'
export const S_BAR_END = '└'
export const S_RADIO_ACTIVE = '●'
export const S_RADIO_INACTIVE = '○'
export const S_CHECKBOX_ACTIVE = '◼'
export const S_CHECKBOX_INACTIVE = '◻'
export const SYMBOL = pc.blue('◆')

export function logBar(message = ''): void {
  console.log(message ? `${pc.blue(S_BAR)}  ${message}` : pc.blue(S_BAR))
}

export function logBarEnd(message = ''): void {
  console.log(`${pc.blue(S_BAR_END)}  ${message}`)
}

export function logCancelled(): void {
  logBarEnd(pc.gray('Cancelled'))
}
