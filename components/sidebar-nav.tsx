'use client'

import { useState } from 'react'
import { FileText, Image, Settings, PenTool, BookOpen, ChevronDown, ChevronRight, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CONVERSION_CATEGORIES, isConversionSupported } from '@/lib/conversion-config'
import { ImageToolDialog } from '@/components/image-tool-dialog'
import { ImageToolId, isImageTool } from '@/lib/image-tools'
import { PdfToolDialog } from '@/components/pdf-tool-dialog'
import { PdfToolId, isPdfTool } from '@/lib/pdf-tools'

const iconMap: Record<string, React.ElementType> = {
  'file-text': FileText,
  'file': FileText,
  'image': Image,
  'settings': Settings,
  'pen-tool': PenTool,
  'book-open': BookOpen,
}

interface SidebarNavProps {
  selectedConversion: string | null
  onSelectConversion: (conversion: string, from: string, to: string) => void
}

export function SidebarNav({ selectedConversion, onSelectConversion }: SidebarNavProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['pdf'])
  const [activeTool, setActiveTool] = useState<ImageToolId | null>(null)
  const [activePdfTool, setActivePdfTool] = useState<PdfToolId | null>(null)

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-card">
      <div className="p-4">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">转换方向</h2>
        
        <nav className="space-y-1">
          {CONVERSION_CATEGORIES.map((category) => {
            const Icon = iconMap[category.icon] || FileText
            const isExpanded = expandedCategories.includes(category.id)
            const hasActiveConversion = category.conversions.some(
              c => `${c.from}-${c.to}` === selectedConversion
            )

            return (
              <div key={category.id}>
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                    hasActiveConversion 
                      ? "bg-primary/10 text-primary" 
                      : "text-foreground hover:bg-accent"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{category.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">
                      {category.conversions.length}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Conversion Items */}
                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l border-border pl-3">
                    {category.conversions.map((conversion, index) => {
                      const conversionId = `${conversion.from}-${conversion.to}`
                      const isSelected = selectedConversion === conversionId
                      const isHot = index === 0 && category.id === 'pdf'
                      const supported = isConversionSupported(conversion.from, conversion.to)

                      const handleClick = () => {
                        // 图片工具：打开 Dialog 而不是切换转换方向
                        if (conversion.from === 'image' && isImageTool(conversion.to)) {
                          setActiveTool(conversion.to)
                          return
                        }
                        // PDF 工具：同样开 Dialog
                        if (conversion.from === 'pdf' && isPdfTool(conversion.to)) {
                          setActivePdfTool(conversion.to)
                          return
                        }
                        onSelectConversion(conversionId, conversion.from, conversion.to)
                      }

                      return (
                        <button
                          key={conversionId}
                          onClick={handleClick}
                          title={supported ? undefined : '暂未支持，敬请期待'}
                          className={cn(
                            "flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors",
                            isSelected
                              ? "bg-foreground text-background"
                              : supported
                                ? "text-muted-foreground hover:bg-accent hover:text-foreground"
                                : "text-muted-foreground/50 hover:bg-accent/50"
                          )}
                        >
                          <span className={cn(!supported && !isSelected && "line-through decoration-muted-foreground/30")}>
                            {conversion.label}
                          </span>
                          <span className="flex items-center gap-1">
                            {!supported && (
                              <span className="rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
                                敬请期待
                              </span>
                            )}
                            {isHot && supported && (
                              <span className="flex items-center gap-0.5 rounded bg-primary/10 px-1 py-0.5 text-xs text-primary">
                                <Flame className="h-3 w-3" />
                                热
                              </span>
                            )}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Info Text */}
        <div className="mt-6 rounded-md bg-muted p-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            支持 <span className="text-foreground font-medium">PDF</span>、
            <span className="text-foreground font-medium">图片</span>、
            <span className="text-foreground font-medium">文档</span>、
            <span className="text-foreground font-medium">电子书</span> 等30+种格式转换。
          </p>
        </div>
      </div>

      <ImageToolDialog tool={activeTool} onClose={() => setActiveTool(null)} />
      <PdfToolDialog tool={activePdfTool} onClose={() => setActivePdfTool(null)} />
    </aside>
  )
}
