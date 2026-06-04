'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { useApp, ConvertSettings, DEFAULT_SETTINGS } from '@/lib/store'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { settings, updateSettings, resetSettings } = useApp()

  // 本地草稿，"保存"时才写入全局
  const [draft, setDraft] = useState<ConvertSettings>(settings)

  useEffect(() => {
    if (open) setDraft(settings)
  }, [open, settings])

  const handleSave = () => {
    updateSettings(draft)
    onOpenChange(false)
  }

  const handleReset = () => {
    setDraft(DEFAULT_SETTINGS)
    resetSettings()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>转换设置</DialogTitle>
          <DialogDescription>调整输出质量与渲染参数，设置会保存在浏览器本地</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* 图片质量 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>JPG / WEBP 输出质量</Label>
              <span className="text-sm text-muted-foreground">{Math.round(draft.imageQuality * 100)}%</span>
            </div>
            <Slider
              min={50}
              max={100}
              step={1}
              value={[Math.round(draft.imageQuality * 100)]}
              onValueChange={([v]) => setDraft(d => ({ ...d, imageQuality: v / 100 }))}
            />
            <p className="text-xs text-muted-foreground">数值越高画质越好，文件越大。PNG 无损不受影响。</p>
          </div>

          {/* PDF 渲染倍数 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>PDF → 图片 渲染倍数</Label>
              <span className="text-sm text-muted-foreground">{draft.pdfScale}x</span>
            </div>
            <Slider
              min={1}
              max={4}
              step={1}
              value={[draft.pdfScale]}
              onValueChange={([v]) => setDraft(d => ({ ...d, pdfScale: v }))}
            />
            <p className="text-xs text-muted-foreground">1x ≈ 屏幕清晰度；3-4x 适合打印。倍数越高越慢。</p>
          </div>
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            恢复默认
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-md border border-border px-4 py-1.5 text-sm hover:bg-accent"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-md bg-primary px-4 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
            >
              保存
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
