import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { getSkillCategoryId } from './categories'
import type { SkillInfo } from './types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Constants from @tech-leads-club/core (inlined)
const SKILLS_ROOT_DIR = 'skills'

export function getSkillsDirectory(): string {
  const devSkillsDir = join(__dirname, '..', '..', '..', SKILLS_ROOT_DIR)
  if (existsSync(devSkillsDir)) return devSkillsDir
  const pkgSkillsDir = join(__dirname, '..', SKILLS_ROOT_DIR)
  if (existsSync(pkgSkillsDir)) return pkgSkillsDir
  const bundleSkillsDir = join(__dirname, SKILLS_ROOT_DIR)
  if (existsSync(bundleSkillsDir)) return bundleSkillsDir
  throw new Error(`Skills directory not found. Checked: ${bundleSkillsDir}, ${pkgSkillsDir}`)
}

export function discoverSkills(): SkillInfo[] {
  const skillsDir = getSkillsDirectory()
  const skills: SkillInfo[] = []
  if (!existsSync(skillsDir)) return skills
  const entries = readdirSync(skillsDir, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const skillMdPath = join(skillsDir, entry.name, 'SKILL.md')
    if (!existsSync(skillMdPath)) continue
    const content = readFileSync(skillMdPath, 'utf-8')
    const { name, description } = parseSkillFrontmatter(content)

    const skillName = name || entry.name
    skills.push({
      name: skillName,
      description: description || 'No description',
      path: join(skillsDir, entry.name),
      category: getSkillCategoryId(skillName),
    })
  }

  return skills
}

function parseSkillFrontmatter(content: string): { name?: string; description?: string } {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!frontmatterMatch) return {}
  const frontmatter = frontmatterMatch[1]
  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m)
  const descMatch = frontmatter.match(/^description:\s*(.+)$/m)
  return { name: nameMatch?.[1]?.trim(), description: descMatch?.[1]?.trim() }
}

export function getSkillByName(name: string): SkillInfo | undefined {
  const skills = discoverSkills()
  return skills.find((s) => s.name === name)
}
