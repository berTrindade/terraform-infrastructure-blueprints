export interface CategoryInfo {
  id: string
  name: string
  description?: string
  priority?: number
}

export interface CategoriesConfig {
  $schema?: string
  categories: CategoryInfo[]
  skills: Record<string, string>
}

export type AgentType =
  | 'cursor'
  | 'claude-code'
  | 'github-copilot'
  | 'windsurf'
  | 'cline'
  | 'aider'
  | 'codex'
  | 'gemini'
  | 'antigravity'
  | 'roo'
  | 'kilocode'
  | 'amazon-q'
  | 'augment'
  | 'tabnine'
  | 'opencode'
  | 'sourcegraph'

export interface AgentConfig {
  name: string
  displayName: string
  description: string
  skillsDir: string
  globalSkillsDir: string
  detectInstalled: () => boolean
}

export interface SkillInfo {
  name: string
  description: string
  path: string
  category?: string
}

export interface InstallOptions {
  global: boolean
  method: 'symlink' | 'copy'
  agents: AgentType[]
  skills: string[]
}

export interface InstallResult {
  agent: string
  skill: string
  path: string
  method: 'symlink' | 'copy'
  success: boolean
  error?: string
  usedGlobalSymlink?: boolean
  symlinkFailed?: boolean
}
