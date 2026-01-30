import { existsSync } from 'node:fs'
import { dirname, join, parse, resolve } from 'node:path'

export function findProjectRoot(startDir: string = process.cwd()): string {
  let currentDir = resolve(startDir)
  const root = parse(currentDir).root

  while (currentDir !== root) {
    if (existsSync(join(currentDir, 'package.json')) || existsSync(join(currentDir, '.git'))) {
      // Special check: ignore packages/cli/package.json if we are developing
      // This is a heuristic for the dev environment of this repo specifically
      const isCliPackage = currentDir.endsWith('packages/cli')
      if (!isCliPackage) return currentDir
    }
    currentDir = dirname(currentDir)
  }

  return startDir
}
