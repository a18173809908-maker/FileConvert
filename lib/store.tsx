'use client'

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react'

// ---------- 类型 ----------

export interface ConvertSettings {
  /** JPG/WEBP 输出质量 0.5-1.0 */
  imageQuality: number
  /** PDF → 图片 渲染倍数 1-4 */
  pdfScale: number
}

export const DEFAULT_SETTINGS: ConvertSettings = {
  imageQuality: 0.92,
  pdfScale: 2,
}

interface AppState {
  points: number
  setPoints: (n: number | ((prev: number) => number)) => void
  isLoggedIn: boolean
  setIsLoggedIn: (v: boolean) => void
  consecutiveDays: number
  setConsecutiveDays: (n: number | ((prev: number) => number)) => void
  hasSignedToday: boolean
  setHasSignedToday: (v: boolean) => void
  settings: ConvertSettings
  updateSettings: (patch: Partial<ConvertSettings>) => void
  resetSettings: () => void
}

const AppContext = createContext<AppState | null>(null)

// ---------- 持久化辅助 ----------

const LS_POINTS = 'fc:points'
const LS_LOGIN = 'fc:isLoggedIn'
const LS_DAYS = 'fc:consecutiveDays'
const LS_LAST_SIGN = 'fc:lastSignDate'
const LS_SETTINGS = 'fc:settings'

function loadNumber(key: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback
  const raw = window.localStorage.getItem(key)
  if (raw == null) return fallback
  const n = Number(raw)
  return Number.isFinite(n) ? n : fallback
}

function loadBool(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback
  const raw = window.localStorage.getItem(key)
  if (raw == null) return fallback
  return raw === 'true'
}

function loadSettings(): ConvertSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = window.localStorage.getItem(LS_SETTINGS)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

// ---------- Provider ----------

export function AppProvider({ children }: { children: ReactNode }) {
  // 初始用 fallback，避免 SSR 与首屏不一致；挂载后再从 localStorage 同步
  const [points, setPointsRaw] = useState<number>(120)
  const [isLoggedIn, setIsLoggedInRaw] = useState<boolean>(false)
  const [consecutiveDays, setConsecutiveDaysRaw] = useState<number>(0)
  const [hasSignedToday, setHasSignedTodayRaw] = useState<boolean>(false)
  const [settings, setSettings] = useState<ConvertSettings>(DEFAULT_SETTINGS)

  // 挂载后从 localStorage 读取
  useEffect(() => {
    setPointsRaw(loadNumber(LS_POINTS, 120))
    setIsLoggedInRaw(loadBool(LS_LOGIN, false))
    setConsecutiveDaysRaw(loadNumber(LS_DAYS, 0))
    const lastSign = window.localStorage.getItem(LS_LAST_SIGN)
    setHasSignedTodayRaw(lastSign === todayStr())
    setSettings(loadSettings())
  }, [])

  const setPoints = useCallback((n: number | ((prev: number) => number)) => {
    setPointsRaw(prev => {
      const next = typeof n === 'function' ? n(prev) : n
      window.localStorage.setItem(LS_POINTS, String(next))
      return next
    })
  }, [])

  const setIsLoggedIn = useCallback((v: boolean) => {
    setIsLoggedInRaw(v)
    window.localStorage.setItem(LS_LOGIN, String(v))
  }, [])

  const setConsecutiveDays = useCallback((n: number | ((prev: number) => number)) => {
    setConsecutiveDaysRaw(prev => {
      const next = typeof n === 'function' ? n(prev) : n
      window.localStorage.setItem(LS_DAYS, String(next))
      return next
    })
  }, [])

  const setHasSignedToday = useCallback((v: boolean) => {
    setHasSignedTodayRaw(v)
    if (v) {
      window.localStorage.setItem(LS_LAST_SIGN, todayStr())
    } else {
      window.localStorage.removeItem(LS_LAST_SIGN)
    }
  }, [])

  const updateSettings = useCallback((patch: Partial<ConvertSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch }
      window.localStorage.setItem(LS_SETTINGS, JSON.stringify(next))
      return next
    })
  }, [])

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
    window.localStorage.setItem(LS_SETTINGS, JSON.stringify(DEFAULT_SETTINGS))
  }, [])

  return (
    <AppContext.Provider
      value={{
        points, setPoints,
        isLoggedIn, setIsLoggedIn,
        consecutiveDays, setConsecutiveDays,
        hasSignedToday, setHasSignedToday,
        settings, updateSettings, resetSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppState {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp 必须在 AppProvider 内调用')
  return ctx
}

/** 读取当前转换设置的快照（用于非 React 模块） */
export function readSettingsSnapshot(): ConvertSettings {
  return loadSettings()
}
