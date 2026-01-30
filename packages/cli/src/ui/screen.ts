import figlet from 'figlet'
import pc from 'picocolors'

import { crystalGradient, logBar } from './styles'

export function generateLogo(): string {
  const asciiArt = figlet.textSync('USTWO', { font: 'Larry 3D', horizontalLayout: 'default' })
  return `
${crystalGradient.multiline(asciiArt)}
  ${pc.white(pc.bold('USTWO'))} ${pc.blue('›')} ${pc.bold(pc.blue('Agent Skills'))}
  ${pc.white('Infrastructure blueprint skills for AI coding agents')}
`
}

export function initScreen(): void {
  console.clear()
  console.log(generateLogo())
  logBar()
}
