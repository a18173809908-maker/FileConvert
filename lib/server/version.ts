import 'server-only'
import { execSync } from 'node:child_process'
import pkg from '@/package.json'

export interface AppVersionInfo {
  name: string
  version: string
  commit: string
  branch: string
  builtAt: string
}

let cached: AppVersionInfo | null = null

function readGitValue(command: string): string {
  try {
    return execSync(command, {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 1000,
    }).trim()
  } catch {
    return ''
  }
}

export function getAppVersionInfo(): AppVersionInfo {
  if (cached) return cached

  const commit =
    process.env.APP_VERSION ||
    process.env.GIT_COMMIT ||
    process.env.COMMIT_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    readGitValue('git rev-parse --short HEAD') ||
    'unknown'

  const branch =
    process.env.APP_BRANCH ||
    process.env.GIT_BRANCH ||
    process.env.VERCEL_GIT_COMMIT_REF ||
    readGitValue('git rev-parse --abbrev-ref HEAD') ||
    'unknown'

  cached = {
    name: pkg.name,
    version: pkg.version,
    commit,
    branch,
    builtAt: process.env.BUILD_TIME || new Date().toISOString(),
  }

  return cached
}
