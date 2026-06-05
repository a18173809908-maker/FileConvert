export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card px-4 py-4 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 sm:flex-row">
        <a
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground hover:underline"
        >
          湘ICP备2026009303号-2
        </a>

        <a
          href="https://www.aiboxpro.cn/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground hover:underline"
        >
          更多 AI 工具，请访问 AIBoxPro 主站
        </a>
      </div>
    </footer>
  )
}
