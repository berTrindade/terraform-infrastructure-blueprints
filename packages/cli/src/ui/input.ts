import { ConfirmPrompt, MultiSelectPrompt, SelectPrompt } from '@clack/core'
import pc from 'picocolors'

import {
  S_BAR,
  S_BAR_END,
  S_CHECKBOX_ACTIVE,
  S_CHECKBOX_INACTIVE,
  S_RADIO_ACTIVE,
  S_RADIO_INACTIVE,
  SYMBOL,
} from './styles'

export interface Option<T> {
  value: T
  label: string
  hint?: string
}

export function isCancelled<T>(value: T | symbol): value is symbol {
  return typeof value === 'symbol'
}

export async function blueSelectWithBack<T>(
  message: string,
  options: Option<T>[],
  initialValue?: T,
  allowBack = true,
): Promise<T | symbol> {
  const opt = (option: Option<T>, isActive: boolean) => {
    const radio = isActive ? pc.blue(S_RADIO_ACTIVE) : pc.gray(S_RADIO_INACTIVE)
    const label = isActive ? pc.blue(option.label) : pc.white(option.label)
    const hint = isActive && option.hint ? pc.dim(pc.gray(` - ${option.hint}`)) : ''
    return `${radio} ${label}${hint}`
  }

  const prompt = new SelectPrompt({
    options,
    initialValue,
    render() {
      const title = `${pc.blue(S_BAR)}\n${SYMBOL} ${pc.white(pc.bold(message))}\n`
      const backHint = allowBack ? 'esc = back, ' : ''

      switch (this.state) {
        case 'submit':
          return `${title}${pc.blue(S_BAR)}  ${pc.blue(this.options.find((o) => o.value === this.value)?.label)}\n${pc.blue(S_BAR)}`
        case 'cancel':
          return `${title}${pc.blue(S_BAR)}  ${pc.strikethrough(pc.gray('back'))}\n${pc.blue(S_BAR)}`
        default:
          return `${title}${this.options
            .map((option, i) => `${pc.blue(S_BAR)}  ${opt(option as Option<T>, i === this.cursor)}`)
            .join(
              '\n',
            )}\n${pc.blue(S_BAR)}\n${pc.blue(S_BAR_END)}  ${pc.dim(pc.gray(`(↑↓ navigate, ${backHint}enter confirm)`))}`
      }
    },
  })

  const result = await prompt.prompt()
  if (typeof result === 'symbol' && allowBack) return Symbol.for('back')
  return result as T | symbol
}

export async function blueMultiSelectWithBack<T>(
  message: string,
  options: Option<T>[],
  initialValues: T[] = [],
  allowBack = true,
): Promise<T[] | symbol> {
  const opt = (option: Option<T>, state: 'active' | 'selected' | 'cancelled' | 'inactive' | 'selected-active') => {
    const isSelected = state === 'selected' || state === 'selected-active'
    const isActive = state === 'active' || state === 'selected-active'
    const checkbox = isSelected ? pc.blue(S_CHECKBOX_ACTIVE) : pc.gray(S_CHECKBOX_INACTIVE)
    const label = isActive ? pc.blue(option.label) : pc.white(option.label)
    const hint = isActive && option.hint ? pc.dim(pc.gray(` (${option.hint})`)) : ''
    return `${checkbox} ${label}${hint}`
  }

  const prompt = new MultiSelectPrompt({
    options,
    initialValues,
    render() {
      const title = `${pc.blue(S_BAR)}\n${SYMBOL} ${pc.white(pc.bold(message))}\n`
      const backHint = allowBack ? 'esc = back, ' : ''

      switch (this.state) {
        case 'submit':
          return `${title}${pc.blue(S_BAR)}  ${this.options
            .filter((o) => this.value.includes(o.value))
            .map((o) => pc.blue(String(o.value)))
            .join(pc.gray(', '))}\n${pc.blue(S_BAR)}`
        case 'cancel':
          return `${title}${pc.blue(S_BAR)}  ${pc.strikethrough(pc.gray('back'))}\n${pc.blue(S_BAR)}`
        default:
          return `${title}${this.options
            .map((option, i) => {
              const isSelected = this.value.includes(option.value)
              const isActive = i === this.cursor
              const state =
                isSelected && isActive ? 'selected-active' : isSelected ? 'selected' : isActive ? 'active' : 'inactive'
              return `${pc.blue(S_BAR)}  ${opt(option as Option<T>, state)}`
            })
            .join(
              '\n',
            )}\n${pc.blue(S_BAR)}\n${pc.blue(S_BAR_END)}  ${pc.dim(pc.gray(`(↑↓ navigate, space select, ${backHint}enter confirm)`))}`
      }
    },
  })

  const result = await prompt.prompt()
  if (typeof result === 'symbol' && allowBack) return Symbol.for('back')
  return result as T[] | symbol
}

export async function blueConfirm(message: string, initialValue = false): Promise<boolean | symbol> {
  const prompt = new ConfirmPrompt({
    active: 'Yes',
    inactive: 'No',
    initialValue,
    render() {
      const title = `${pc.blue(S_BAR)}\n${SYMBOL} ${pc.white(pc.bold(message))}\n`

      switch (this.state) {
        case 'submit':
          return `${title}${pc.blue(S_BAR)}  ${pc.blue(this.value ? 'Yes' : 'No')}\n${pc.blue(S_BAR)}`
        case 'cancel':
          return `${title}${pc.blue(S_BAR)}  ${pc.strikethrough(pc.gray('cancelled'))}\n${pc.blue(S_BAR)}`
        default:
          return `${title}${pc.blue(S_BAR)}  ${
            this.value
              ? `${pc.blue('● Yes')} ${pc.dim(pc.gray('/'))} ${pc.gray('○')} ${pc.white('No')}`
              : `${pc.gray('○')} ${pc.white('Yes')} ${pc.dim(pc.gray('/'))} ${pc.blue('● No')}`
          }\n${pc.blue(S_BAR)}\n${pc.blue(S_BAR_END)}  ${pc.dim(pc.gray('(←→ to change, enter to confirm)'))}`
      }
    },
  })

  return prompt.prompt() as Promise<boolean | symbol>
}
