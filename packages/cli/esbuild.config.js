import { build } from 'esbuild'
import { readFileSync, writeFileSync, cpSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const outDir = join(__dirname, 'dist')
const skillsDir = join(__dirname, '..', '..', 'skills')

// Ensure dist directory exists
mkdirSync(outDir, { recursive: true })

// Build the CLI
await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: join(outDir, 'index.js'),
  external: [
    '@clack/core',
    '@clack/prompts',
    'chalk',
    'commander',
    'figlet',
    'gradient-string',
    'package-json',
    'picocolors'
  ],
  banner: {
    js: '#!/usr/bin/env node'
  },
  sourcemap: true,
  minify: false,
  target: 'node22'
})

// Copy skills directory to dist
if (existsSync(skillsDir)) {
  cpSync(skillsDir, join(outDir, 'skills'), { recursive: true })
}

// Generate package.json for dist
const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'))
const distPkg = {
  name: pkg.name,
  version: pkg.version,
  type: 'module',
  bin: pkg.bin,
  engines: pkg.engines,
  dependencies: pkg.dependencies
}
writeFileSync(join(outDir, 'package.json'), JSON.stringify(distPkg, null, 2))

console.log('Build complete!')
