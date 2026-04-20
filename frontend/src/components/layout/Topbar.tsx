'use client'

import { useAppSelector, useAppDispatch } from '@/src/store/hooks'
import { toggleSidebar, setTheme } from '@/src/store/slices/uiSlice'
import { logoutUser } from '@/src/store/slices/authSlice'
import { usePathname, useRouter } from 'next/navigation'
import {
  Menu, Bell, Search, Sun, Moon, Monitor,
  LogOut, ChevronDown, User, Settings,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import Cookies from 'js-cookie'

// ── Breadcrumb helper ──────────────────────────────────────────
function useBreadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)
  return segments.map((seg, i) => ({
    label: seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    href: '/' + segments.slice(0, i + 1).join('/'),
    isLast: i === segments.length - 1,
  }))
}

// ── Theme cycle button ─────────────────────────────────────────
function ThemeToggle() {
  const dispatch = useAppDispatch()
  const theme = useAppSelector(state => state.ui.theme)

  const cycle = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
    dispatch(setTheme(next))
  }

  // Apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'light') {
      root.classList.remove('dark')
    } else {
      // system — match OS
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', prefersDark)
    }
  }, [theme])

  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor
  const label = theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System'

  return (
    <button
      onClick={cycle}
      title={`Theme: ${label} — click to cycle`}
      className="
        flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
        text-[var(--foreground-secondary)] hover:text-[var(--foreground)]
        hover:bg-[var(--background-secondary)]
        border border-[var(--border)] hover:border-[var(--border-strong)]
        transition-all duration-200
      "
    >
      <Icon size={15} />
      <span className="hidden sm:inline text-xs font-medium">{label}</span>
    </button>
  )
}

// ── Notification bell ──────────────────────────────────────────
function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="
          relative w-9 h-9 flex items-center justify-center rounded-lg
          text-[var(--foreground-secondary)] hover:text-[var(--foreground)]
          hover:bg-[var(--background-secondary)]
          border border-[var(--border)] hover:border-[var(--border-strong)]
          transition-all duration-200
        "
        aria-label="Notifications"
      >
        <Bell size={16} />
        {/* Unread badge */}
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--danger)] rounded-full ring-2 ring-[var(--topbar-bg)]" />
      </button>

      {open && (
        <div className="
          absolute right-0 top-full mt-2 w-72 z-50 rounded-xl shadow-lg
          bg-[var(--surface)] border border-[var(--border)]
          overflow-hidden animate-fade-in
        ">
          <div className="px-4 py-3 border-b border-[var(--border)] flex justify-between items-center">
            <span className="text-sm font-semibold text-[var(--foreground)]">Notifications</span>
            <span className="text-xs text-[var(--primary)] cursor-pointer hover:underline">Mark all read</span>
          </div>
          <div className="divide-y divide-[var(--border)] max-h-64 overflow-y-auto">
            {[
              { title: 'Fee payment received', time: '2m ago', color: 'var(--success)' },
              { title: 'New admission request', time: '1h ago', color: 'var(--primary)' },
              { title: 'Exam schedule updated', time: '3h ago', color: 'var(--accent)' },
            ].map((n, i) => (
              <div key={i} className="flex gap-3 px-4 py-3 hover:bg-[var(--background-secondary)] cursor-pointer transition-colors">
                <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: n.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[var(--foreground)] truncate">{n.title}</p>
                  <p className="text-[10px] text-[var(--foreground-muted)] mt-0.5">{n.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-2.5 border-t border-[var(--border)] text-center">
            <span className="text-xs text-[var(--primary)] cursor-pointer hover:underline">View all notifications</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── User menu dropdown ─────────────────────────────────────────
function UserMenu() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const user = useAppSelector(state => (state.user.loggedInUser as any))
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    dispatch(logoutUser())
    Cookies.remove('_at')
    Cookies.remove('_role')
    router.push('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="
          flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl
          hover:bg-[var(--background-secondary)]
          border border-transparent hover:border-[var(--border)]
          transition-all duration-200
        "
        aria-label="User menu"
      >
        {/* Avatar */}
        <div className="
          w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary-400)] to-[var(--primary-600)]
          flex items-center justify-center text-white text-xs font-bold shrink-0
        ">
          {initials}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-xs font-semibold text-[var(--foreground)] leading-tight truncate max-w-[100px]">
            {user?.name ?? 'User'}
          </p>
          <p className="text-[10px] text-[var(--foreground-muted)] capitalize leading-tight">
            {user?.role?.replace(/_/g, ' ') ?? 'Role'}
          </p>
        </div>
        <ChevronDown size={12} className={`hidden md:block text-[var(--foreground-muted)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="
          absolute right-0 top-full mt-2 w-52 z-50 rounded-xl shadow-lg
          bg-[var(--surface)] border border-[var(--border)]
          overflow-hidden
        ">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--background-secondary)]">
            <p className="text-xs font-semibold text-[var(--foreground)] truncate">{user?.name}</p>
            <p className="text-[10px] text-[var(--foreground-muted)] truncate">{user?.email}</p>
          </div>
          {/* Items */}
          <div className="py-1">
            <button
              onClick={() => { setOpen(false); router.push('/profile') }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)] transition-colors"
            >
              <User size={14} />Profile
            </button>
            <button
              onClick={() => { setOpen(false); router.push('/settings') }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)] transition-colors"
            >
              <Settings size={14} />Settings
            </button>
          </div>
          <div className="py-1 border-t border-[var(--border)]">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-[var(--danger)] hover:bg-[var(--danger-bg)] transition-colors"
            >
              <LogOut size={14} />Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Topbar ────────────────────────────────────────────────
export function Topbar() {
  const dispatch = useAppDispatch()
  const sidebarOpen = useAppSelector(state => state.ui.sidebarOpen)
  const breadcrumbs = useBreadcrumb()
  const [searchFocused, setSearchFocused] = useState(false)

  return (
    <header
      className={`
        erp-topbar fixed top-0 right-0 z-20 h-16
        flex items-center gap-3 px-4
        transition-[left] duration-300 ease-in-out
        ${sidebarOpen ? 'left-[240px]' : 'left-[60px]'}
      `}
    >
      {/* Hamburger toggle */}
      <button
        onClick={() => dispatch(toggleSidebar())}
        className="
          w-9 h-9 flex items-center justify-center rounded-lg shrink-0
          text-[var(--foreground-secondary)] hover:text-[var(--foreground)]
          hover:bg-[var(--background-secondary)]
          border border-[var(--border)] hover:border-[var(--border-strong)]
          transition-all duration-200
        "
        aria-label="Toggle sidebar"
      >
        <Menu size={16} />
      </button>

      {/* Breadcrumbs */}
      <nav className="hidden md:flex items-center gap-1.5 text-sm flex-1 min-w-0 overflow-hidden">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1.5 shrink-0">
            {i > 0 && <span className="text-[var(--foreground-muted)]">/</span>}
            <span className={crumb.isLast
              ? 'font-semibold text-[var(--foreground)]'
              : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] cursor-pointer transition-colors'
            }>
              {crumb.label}
            </span>
          </span>
        ))}
      </nav>

      {/* Search */}
      <div className={`
        flex items-center gap-2 rounded-lg px-3 py-1.5
        border transition-all duration-200
        bg-[var(--background-secondary)]
        ${searchFocused
          ? 'border-[var(--primary)] shadow-[0_0_0_3px_var(--primary-50)] w-64'
          : 'border-[var(--border)] w-40 md:w-52'
        }
      `}>
        <Search size={14} className="text-[var(--foreground-muted)] shrink-0" />
        <input
          type="text"
          placeholder="Quick search..."
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="bg-transparent text-sm w-full outline-none text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
        />
        <kbd className={`hidden sm:inline-flex text-[10px] px-1.5 py-0.5 rounded bg-[var(--border)] text-[var(--foreground-muted)] font-mono transition-opacity ${searchFocused ? 'opacity-0' : 'opacity-100'}`}>
          ⌘K
        </kbd>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 shrink-0">
        <ThemeToggle />
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  )
}
