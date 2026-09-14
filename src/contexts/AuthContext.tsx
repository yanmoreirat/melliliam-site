import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { Session, User } from '@supabase/supabase-js'

interface AuthContextData {
  user: User | null
  session: Session | null
  isAdmin: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextData | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const checkAdmin = async (userId: string | undefined) => {
    if (!userId) {
      setIsAdmin(false)
      return
    }
    try {
      const { data } = await supabase
        .from('admin_profiles')
        .select('id')
        .eq('auth_user_id', userId)
        .limit(1)
      setIsAdmin(Array.isArray(data) && data.length > 0)
    } catch {
      setIsAdmin(false)
    }
  }

  const refreshProfile = async () => {
    if (user) await checkAdmin(user.id)
  }

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
      setUser(data.session?.user ?? null)
      await checkAdmin(data.session?.user?.id)
      setIsLoading(false)

      supabase.auth.onAuthStateChange(async (_event, newSession) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)
        await checkAdmin(newSession?.user?.id)
      })
    }
    init()
  }, [])

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{ user, session, isAdmin, isLoading, login, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
