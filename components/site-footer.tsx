import { getAppVersionInfo } from '@/lib/server/version'

export function SiteFooter() {
  const version = getAppVersionInfo()
  const shortCommit = version.commit.length > 12 ? version.commit.slice(0, 12) : version.commit

  return (
    <footer className="border-t border-border bg-card px-4 py-4 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-2 sm:flex-row sm:gap-4">
        <a
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground hover:underline"
        >
          湘ICP备2026009303号-2
        </a>
        <span className="hidden text-muted-foreground/50 sm:inline">·</span>
        <span title={`${version.branch} / ${version.commit} / ${version.builtAt}`}>
          v{version.version} · {shortCommit}
        </span>
      </div>
    </footer>
  )
}
