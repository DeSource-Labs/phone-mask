#!/usr/bin/env node
// Run with Node 20+
// Install first: npm i -D package-build-stats@8.2.5
// Usage: node measure-dist-bundlephobia.mjs ./dist --entry index.js

import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import crypto from 'node:crypto'
import process from 'node:process'
import { getPackageStats } from 'package-build-stats'

function parseArgs(argv) {
  const args = { dist: argv[0] || './dist', entry: 'index.js' }
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--entry' && argv[i + 1]) {
      args.entry = argv[++i]
      continue
    }
    if (a.startsWith('--entry=')) {
      args.entry = a.slice('--entry='.length)
      continue
    }
    throw new Error(`Unknown arg: ${a}`)
  }
  return args
}

async function exists(p) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

async function findNearestPackageJson(startDir) {
  let dir = path.resolve(startDir)
  while (true) {
    const candidate = path.join(dir, 'package.json')
    if (await exists(candidate)) return candidate
    const parent = path.dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

function toPosix(p) {
  return p.split(path.sep).join('/')
}

async function main() {
  const { dist, entry } = parseArgs(process.argv.slice(2))
  const distAbs = path.resolve(dist)
  const entryAbs = path.join(distAbs, entry)

  if (!(await exists(distAbs))) {
    throw new Error(`dist folder not found: ${distAbs}`)
  }
  if (!(await exists(entryAbs))) {
    throw new Error(`entry file not found: ${entryAbs}`)
  }

  // Pull dependencies/peerDependencies from nearest package.json so the wrapper
  // behaves like your local package as much as possible.
  const nearestPkgPath = await findNearestPackageJson(path.dirname(distAbs))
  const sourcePkg = nearestPkgPath
    ? JSON.parse(await fs.readFile(nearestPkgPath, 'utf8'))
    : {}

  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'bp-dist-'))
  const wrapperDir = path.join(tmpRoot, 'wrapper')
  await fs.mkdir(wrapperDir, { recursive: true })

  try {
    await fs.cp(distAbs, path.join(wrapperDir, 'dist'), { recursive: true })

    const relEntry = `./dist/${toPosix(entry)}`
    const wrapperPkg = {
      name: `bp-dist-${crypto.randomUUID().slice(0, 8)}`,
      version: '0.0.0-local',
      private: true,
      main: relEntry,
      module: relEntry,
      exports: { '.': relEntry },
      dependencies: sourcePkg.dependencies || {},
      peerDependencies: sourcePkg.peerDependencies || {},
      optionalDependencies: sourcePkg.optionalDependencies || {},
    }

    if (sourcePkg.type === 'module') {
      wrapperPkg.type = 'module'
    }

    await fs.writeFile(
      path.join(wrapperDir, 'package.json'),
      JSON.stringify(wrapperPkg, null, 2),
      'utf8',
    )

    // Same entry API used by Bundlephobia build-service.
    const result = await getPackageStats(wrapperDir, {
      client: ['bun', 'npm'],
      minify: true,
      installTimeout: 60000,
    })

    console.log(
      JSON.stringify(
        {
          size: result.size,
          gzip: result.gzip,
          assets: result.assets,
          ignoredMissingDependencies: result.ignoredMissingDependencies || [],
          dependencySizes: result.dependencySizes || [],
        },
        null,
        2,
      ),
    )
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true })
  }
}

main().catch(err => {
  console.error(err?.stack || err)
  process.exit(1)
})
