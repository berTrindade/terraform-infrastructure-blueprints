import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const PACKAGE_NAME = '@bertrindade/agent-skills'

export function getNpmGlobalRoot(): string | null {
  try {
    return execSync('npm root -g', { encoding: 'utf-8' }).trim()
  } catch {
    return null
  }
}

export function getGlobalSkillsPath(): string | null {
  const npmGlobalRoot = getNpmGlobalRoot()
  if (!npmGlobalRoot) return null
  const skillsPath = join(npmGlobalRoot, PACKAGE_NAME, 'skills')
  return existsSync(skillsPath) ? skillsPath : null
}

export function isGloballyInstalled(): boolean {
  return getGlobalSkillsPath() !== null
}

export function getGlobalSkillPath(skillName: string): string | null {
  const skillsPath = getGlobalSkillsPath()
  if (!skillsPath) return null
  const skillPath = join(skillsPath, skillName)
  return existsSync(skillPath) ? skillPath : null
}
