import pc from 'picocolors'

import { getAgentConfig } from '../agents'
import { listInstalledSkills } from '../installer'
import type { AgentType } from '../types'
import { truncate } from '../ui/formatting'
import type { Option } from '../ui/input'

export function buildAgentOptions(agents: AgentType[], detectedAgents: AgentType[] = []): Option<AgentType>[] {
  return agents.map((type) => {
    const config = getAgentConfig(type)
    const isDetected = detectedAgents.includes(type)
    return {
      value: type,
      label: isDetected ? `${config.displayName} ${pc.green('● detected')}` : config.displayName,
      hint: truncate(config.description, 50),
    }
  })
}

export async function getInstalledSkillNames(agents: AgentType[], global: boolean): Promise<Set<string>> {
  const installed = new Set<string>()
  for (const agent of agents) {
    const skills = await listInstalledSkills(agent, global)
    skills.forEach((skill) => installed.add(skill))
  }
  return installed
}

export async function getAllInstalledSkillNames(agents: AgentType[]): Promise<Set<string>> {
  const [globalSkills, localSkills] = await Promise.all([
    getInstalledSkillNames(agents, true),
    getInstalledSkillNames(agents, false),
  ])
  return new Set([...globalSkills, ...localSkills])
}
