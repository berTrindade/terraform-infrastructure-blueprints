import pc from 'picocolors'

import { detectInstalledAgents, getAllAgentTypes } from '../agents'
import { groupSkillsByCategory } from '../categories'
import { isGloballyInstalled } from '../installer'
import { discoverSkills } from '../skills'
import type { AgentType, InstallOptions } from '../types'
import { truncate } from '../ui/formatting'
import { blueConfirm, blueMultiSelectWithBack, blueSelectWithBack, isCancelled } from '../ui/input'
import { initScreen } from '../ui/screen'
import { logBar, logBarEnd, logCancelled } from '../ui/styles'
import { checkForUpdates, getCurrentVersion } from '../update-check'
import { showInstallationSummary } from './results'
import { buildAgentOptions, getAllInstalledSkillNames } from './utils'

type WizardState = {
  category: string
  skills: string[]
  agents: AgentType[]
  method: 'symlink' | 'copy'
  global: boolean
}

const ALL_SKILLS_VALUE = '__all_skills__'
const ALL_CATEGORIES_VALUE = '__all__'

export async function runInteractiveInstall(): Promise<InstallOptions | null> {
  initScreen()
  await checkEnvironment()

  const allSkills = discoverSkills()
  if (allSkills.length === 0) {
    logBarEnd(pc.red('No skills available'))
    return null
  }

  const installedAgents = detectInstalledAgents()
  const allAgents = getAllAgentTypes()
  const targetAgents = installedAgents.length > 0 ? installedAgents : allAgents
  const installedSkills = await getAllInstalledSkillNames(targetAgents)

  const state: WizardState = {
    category: ALL_CATEGORIES_VALUE,
    skills: [],
    agents: installedAgents.length > 0 ? installedAgents : (['cursor', 'claude-code'] as AgentType[]),
    method: 'symlink',
    global: false,
  }

  let currentStep = 1
  const totalSteps = 4

  while (currentStep <= totalSteps) {
    const stepIndicator = pc.gray(`[${currentStep}/${totalSteps}]`)
    const allowBack = currentStep > 1

    switch (currentStep) {
      case 1: {
        const result = await selectCategoryStep({ allSkills, stepIndicator, currentCategory: state.category })
        if (result === null) return null
        state.category = result
        currentStep++
        break
      }

      case 2: {
        const result = await selectSkillsStep({
          state,
          allSkills,
          installedSkills,
          stepIndicator,
          allowBack,
        })

        if (result === Symbol.for('back')) {
          currentStep--
          break
        }

        if (result === null) return null

        state.skills = result as string[]
        currentStep++
        break
      }

      case 3: {
        const result = await selectAgentsStep({
          allAgents,
          installedAgents,
          currentAgents: state.agents,
          stepIndicator,
          allowBack,
        })

        if (result === Symbol.for('back')) {
          currentStep--
          break
        }

        if (result === null) return null

        state.agents = result as AgentType[]
        currentStep++
        break
      }

      case 4: {
        const result = await configureInstallationStep({
          state,
          stepIndicator,
          allowBack,
        })

        if (result === Symbol.for('back')) {
          state.method = 'symlink'
          currentStep--
          break
        }

        if (result === null) return null
        if (result === false) {
          currentStep = 1
          break
        }

        return result as InstallOptions
      }
    }
  }

  return null
}

async function checkEnvironment() {
  const currentVersion = getCurrentVersion()
  const latestVersion = await checkForUpdates(currentVersion)

  if (latestVersion) {
    logBar(
      `${pc.yellow('⚠')}  ${pc.yellow('Update available:')} ${pc.gray(currentVersion)} → ${pc.green(latestVersion)}`,
    )
    logBar(`   ${pc.gray('Run: npm update -g @bertrindade/agent-skills')}`)
    logBar()
  } else if (!isGloballyInstalled()) {
    logBar(`${pc.yellow('⚠')}  ${pc.yellow('Not installed globally')}`)
    logBar(`   ${pc.yellow("Skills won't auto-update. Install globally:")}`)
    logBar(`   ${pc.yellow('npm i -g @bertrindade/agent-skills')}`)
    logBar()
  }
}

interface SelectCategoryProps {
  allSkills: ReturnType<typeof discoverSkills>
  stepIndicator: string
  currentCategory: string
}

async function selectCategoryStep({
  allSkills,
  stepIndicator,
  currentCategory,
}: SelectCategoryProps): Promise<string | null> {
  const groupedSkills = groupSkillsByCategory(allSkills)
  const categoryList = Array.from(groupedSkills.keys())

  const categoryOptions = [
    { value: ALL_CATEGORIES_VALUE, label: `${pc.cyan('◉')} All skills`, hint: `${allSkills.length} available` },
    ...categoryList.map((cat) => {
      const skillCount = groupedSkills.get(cat)?.length ?? 0
      return { value: cat.id, label: `${pc.cyan('▸')} ${cat.name}`, hint: `${skillCount} skill(s)` }
    }),
  ]

  const selectedCategory = await blueSelectWithBack(
    `${stepIndicator} Browse by category`,
    categoryOptions,
    currentCategory,
    false,
  )

  if (isCancelled(selectedCategory)) {
    logCancelled()
    return null
  }

  return selectedCategory as string
}

interface SelectSkillsProps {
  state: WizardState
  allSkills: ReturnType<typeof discoverSkills>
  installedSkills: Set<string>
  stepIndicator: string
  allowBack: boolean
}

async function selectSkillsStep({
  state,
  allSkills,
  installedSkills,
  stepIndicator,
  allowBack,
}: SelectSkillsProps): Promise<string[] | symbol | null> {
  const showAllCategories = state.category === ALL_CATEGORIES_VALUE
  const filteredSkills = showAllCategories ? allSkills : allSkills.filter((skill) => skill.category === state.category)

  const skillOptions = [
    {
      value: ALL_SKILLS_VALUE,
      label: `${pc.cyan('◉')} ${pc.bold('All Skills')}`,
      hint: `select all ${filteredSkills.length} skills`,
    },
    ...filteredSkills.map((skill) => {
      const isInstalled = installedSkills.has(skill.name)
      return {
        value: skill.name,
        label: isInstalled ? `${skill.name} ${pc.green('● installed')}` : skill.name,
        hint: truncate(skill.description, 150),
      }
    }),
  ]

  const initialSkills = state.skills.length > 0 ? state.skills : []

  const selectedSkills = await blueMultiSelectWithBack(
    `${stepIndicator} Select skills to install`,
    skillOptions,
    initialSkills,
    allowBack,
  )

  if (selectedSkills === Symbol.for('back')) return Symbol.for('back')

  if (isCancelled(selectedSkills)) {
    logCancelled()
    return null
  }

  const skillsArray = selectedSkills as string[]

  const validSkills = skillsArray.includes(ALL_SKILLS_VALUE)
    ? filteredSkills.map((s) => s.name)
    : skillsArray.filter((s) => s !== ALL_SKILLS_VALUE)

  if (validSkills.length === 0) logBar(pc.yellow('⚠ Please select at least one skill'))
  if (validSkills.length === 0) return selectSkillsStep({ state, allSkills, installedSkills, stepIndicator, allowBack })
  return validSkills
}

interface SelectAgentsProps {
  allAgents: AgentType[]
  installedAgents: AgentType[]
  currentAgents: AgentType[]
  stepIndicator: string
  allowBack: boolean
}

async function selectAgentsStep({
  allAgents,
  installedAgents,
  currentAgents,
  stepIndicator,
  allowBack,
}: SelectAgentsProps): Promise<AgentType[] | symbol | null> {
  const agentOptions = buildAgentOptions(allAgents, installedAgents)

  const selectedAgents = await blueMultiSelectWithBack(
    `${stepIndicator} Where to install?`,
    agentOptions,
    currentAgents,
    allowBack,
  )

  if (selectedAgents === Symbol.for('back')) return Symbol.for('back')

  if (isCancelled(selectedAgents)) {
    logCancelled()
    return null
  }

  const validAgents = selectedAgents as AgentType[]

  if (validAgents.length === 0) {
    logBar(pc.yellow('⚠ Please select at least one agent'))
    return selectAgentsStep({ allAgents, installedAgents, currentAgents, stepIndicator, allowBack })
  }

  return validAgents
}

interface ConfigureProps {
  state: WizardState
  stepIndicator: string
  allowBack: boolean
}

async function configureInstallationStep({
  state,
  stepIndicator,
  allowBack,
}: ConfigureProps): Promise<InstallOptions | symbol | null | false> {
  const methodOptions = [
    { value: 'symlink', label: 'Symlink', hint: 'shared source (recommended)' },
    { value: 'copy', label: 'Copy', hint: 'independent copies' },
  ]

  const method = await blueSelectWithBack(
    `${stepIndicator} Installation method`,
    methodOptions,
    state.method,
    allowBack,
  )

  if (method === Symbol.for('back')) return Symbol.for('back')

  if (isCancelled(method)) {
    logCancelled()
    return null
  }

  state.method = method as 'symlink' | 'copy'
  showInstallationSummary(state)
  const scopeResult = await selectScope(state)
  if (scopeResult === Symbol.for('back')) return configureInstallationStep({ state, stepIndicator, allowBack })
  if (scopeResult === null) return null
  state.global = scopeResult === 'global'
  const confirm = await blueConfirm(pc.white('Proceed with installation?'), true)

  if (isCancelled(confirm)) {
    logCancelled()
    return null
  }

  if (!confirm) return false
  logBar()

  return { agents: state.agents, skills: state.skills, method: state.method, global: state.global }
}

async function selectScope(state: WizardState): Promise<'local' | 'global' | symbol | null> {
  const scopeOptions = [
    { value: 'local', label: 'Local', hint: 'this project only' },
    { value: 'global', label: 'Global', hint: 'user home directory' },
  ]

  const scope = await blueSelectWithBack('Installation scope', scopeOptions, state.global ? 'global' : 'local', true)
  if (scope === Symbol.for('back')) return Symbol.for('back')
  if (isCancelled(scope)) return null
  return scope as 'local' | 'global'
}
