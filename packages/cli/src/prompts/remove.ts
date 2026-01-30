import pc from 'picocolors'

import { getAllAgentTypes } from '../agents'
import { removeSkill } from '../installer'
import type { AgentType } from '../types'
import { blueConfirm, blueMultiSelectWithBack, isCancelled } from '../ui/input'
import { initScreen } from '../ui/screen'
import { logBar, logBarEnd, logCancelled } from '../ui/styles'
import { showRemoveResults } from './results'
import { buildAgentOptions, getInstalledSkillNames } from './utils'

export async function runInteractiveRemove(global: boolean): Promise<void> {
  initScreen()
  const allAgents = getAllAgentTypes()
  const installedSkills = await getInstalledSkillNames(allAgents, global)

  if (installedSkills.size === 0) {
    logBar(pc.yellow('No skills installed'))
    logBarEnd()
    return
  }

  const skillsArray = Array.from(installedSkills)

  // Step 1
  const selectedSkills = await blueMultiSelectWithBack(
    `Which skills do you want to remove? ${pc.gray(`(${skillsArray.length} installed)`)}`,
    skillsArray.map((name) => ({ value: name, label: name })),
    [],
    false,
  )

  if (isCancelled(selectedSkills) || (selectedSkills as string[]).length === 0) {
    logCancelled()
    return
  }

  // Step 2
  const selectedAgents = await blueMultiSelectWithBack(
    'Remove from which agents?',
    buildAgentOptions(allAgents).map((opt) => ({ ...opt, hint: undefined })),
    allAgents,
    true,
  )

  if (isCancelled(selectedAgents)) {
    logCancelled()
    return
  }

  // Step 3
  const confirm = await blueConfirm(
    `Remove ${selectedSkills.length} skill(s) from ${selectedAgents.length} agent(s)?`,
    false,
  )

  if (isCancelled(confirm) || !confirm) {
    logCancelled()
    return
  }

  logBar()

  for (const skillName of selectedSkills) {
    const results = await removeSkill(skillName, selectedAgents as AgentType[], { global })
    showRemoveResults(skillName, results)
  }
}
