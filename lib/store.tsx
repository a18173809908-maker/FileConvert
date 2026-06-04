'use client'

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react'

// ---------- 类型 ----------

export interface ConvertSettings {
  imageQuality: number
  pdfScale: number
}

export const DEFAULT_SETTINGS: ConvertSettings = {
  imageQuality: 0.92,
  pdfScale: 2,
}

export interface PublicUser {
  id: number
  nickname: string
  avatarUrl: string | null
  email: string | null
  hasWechat: boolean
  hasQQ: boolean
  points: number
  consecutiveDays: number
  hasSignedToday: boolean
  inviteCode: string
}

interface AppState {
  user: PublicUser | null
  loadingUser: boolean
  setUser: (u: PublicUser | null) => void
  refreshUser: () => Promise<void>
  logout: () => Promise<void>

  settings: ConvertSettings
  updateSettings: (patch: Partial<ConvertSettings>) => void
  resetSettings: () => void

  loginDialogOpen: boolean
  setLoginDialogOpen: (v: boolean) => void
}

const AppContext = createContext<AppState | null>(null)

// ---------- 设置（仍存 localStorage） ----------

const LS_SETTINGS = 'fc:settings'

function loadSettings(): ConvertSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = window.localStorage.getItem(LS_SETTINGS)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

// ---------- Provider ----------

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [settings, setSettings] = useState<ConvertSettings>(DEFAULT_SETTINGS)
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' })
      const data = await res.json()
      setUser(data.user || null)
    } catch {
      setUser(null)
    } finally {
      setLoadingUser(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
    setSettings(loadSettings())
  }, [refreshUser])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
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
        user, loadingUser, setUser, refreshUser, logout,
        settings, updateSettings, resetSettings,
        loginDialogOpen, setLoginDialogOpen,
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

export function readSettingsSnapshot(): ConvertSettings {
  return loadSettings()
}
