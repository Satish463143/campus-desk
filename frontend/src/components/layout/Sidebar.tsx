'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAppSelector, useAppDispatch } from '@/src/store/hooks'
import { toggleSidebar } from '@/src/store/slices/uiSlice'
import {
  LayoutDashboard, Users, GraduationCap, BookOpen,
  CalendarDays, ClipboardList, Banknote, Receipt,
  FileText, Settings, Bell, UserCheck, School,
  ChevronLeft, ChevronRight, ChevronDown, BookMarked,
  BadgeDollarSign, BarChart3, UsersRound, Megaphone, Clock,
  type LucideIcon,
} from 'lucide-react'
import { useState, useEffect } from 'react'

// ── Types ──────────────────────────────────────────────────────
interface NavItem {
  label: string
  href?: string
  icon: LucideIcon
  children?: Omit<NavItem, 'children'>[]
}

type Role = 'super_admin' | 'principal' | 'admin_staff' | 'accountant' | 'teacher' | 'student' | 'parent'

// ── Nav config per role ────────────────────────────────────────
const NAV_ITEMS: Record<Role, NavItem[]> = {
  super_admin: [
    { label: 'Dashboard',  href: '/dashboard', icon: LayoutDashboard },
    { label: 'Schools',    href: '/school-list',   icon: School },
    { label: 'Settings',   href: '/settings',  icon: Settings },
  ],
  principal: [
    { label: 'Dashboard',  href: '/dashboard',  icon: LayoutDashboard },
    { label: 'Management', icon: LayoutDashboard,
      children: [
        { label: 'Students',   href: '/students',   icon: GraduationCap },
        { label: 'Teachers',   href: '/teachers',   icon: Users },
        { label: 'Attendance', href: '/attendance',         icon: UserCheck },
        { label: 'School members', href: '/school-members',         icon: UserCheck },
      ]
     },
    {
      label: 'Academic', icon: BookOpen,
      children: [
        { label: 'Overview',           href: '/academic',           icon: LayoutDashboard},
        { label: 'Academic Years',     href: '/academic/years',     icon: CalendarDays },
        { label: 'Classes',            href: '/academic/classes',   icon: BookOpen },
        { label: 'Subjects',           href: '/academic/subjects',  icon: BookMarked },
        { label: 'Periods',            href: '/academic/periods',   icon: Clock },
        { label: 'Timetable',          href: '/academic/timetable', icon: CalendarDays },
      ],
    },
    {
      label: 'Finance', icon: Banknote,
      children: [
        { label: 'Fee Management',   href: '/fee-management', icon: Banknote },
        { label: 'Manual Payments',       href: '/manual-payments',     icon: FileText },
        { label: 'Payments Gateway',       href: '/payment-gateway',     icon: FileText },
        { label: 'CRM',   href: '/crm', icon: BadgeDollarSign },
      ],
    },
    {
      label: 'LMS', icon: BookMarked,
      children: [
        { label: 'Syllabus',     href: '/lms',              icon: BookMarked },
        { label: 'Assignments',  href: '/lms/assignments',  icon: ClipboardList },
        { label: 'Live Classes', href: '/lms/live-classes', icon: CalendarDays },
        { label: 'Exams',        href: '/lms/exams',        icon: FileText },
        { label: 'Progress',     href: '/lms/progress',     icon: BarChart3 },
      ],
    },
    
    { label: 'Settings', href: '/settings', icon: Settings },
  ],

  admin_staff: [
    { label: 'Dashboard',  href: '/dashboard',  icon: LayoutDashboard },
    { label: 'Students',   href: '/students',   icon: GraduationCap },
    { label: 'Teachers',   href: '/teachers',   icon: Users },
    { label: 'Parents',    href: '/parents',    icon: UsersRound },
    { label: 'Admissions', href: '/admissions', icon: FileText },
    {
      label: 'Academic', icon: BookOpen,
      children: [
        { label: 'Academic Years',     href: '/academic/years',     icon: CalendarDays },
        { label: 'Classes & Sections', href: '/academic/classes',   icon: BookOpen },
        { label: 'Subjects',           href: '/academic/subjects',  icon: BookMarked },
        { label: 'Periods',            href: '/academic/periods',   icon: Clock },
        { label: 'Timetable',          href: '/academic/timetable', icon: CalendarDays },
        { label: 'Attendance',         href: '/attendance',         icon: UserCheck },
      ],
    },
    {
      label: 'Finance', icon: Banknote,
      children: [
        { label: 'Fee Management',   href: '/fee-management',  icon: Banknote },
        { label: 'Manual Payments',  href: '/manual-payments', icon: Receipt },
        { label: 'Payment Gateway',  href: '/payment-gateway', icon: FileText },
        { label: 'CRM',     href: '/crm',    icon: BadgeDollarSign },
      ],
    },
    { label: 'Notifications', href: '/notifications', icon: Megaphone },
    { label: 'Settings',      href: '/settings',      icon: Settings },
  ],

  accountant: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    {
      label: 'Finance', icon: Banknote,
      children: [
        { label: 'Fee Management',  href: '/fee-management',  icon: Banknote },
        { label: 'Manual Payments', href: '/manual-payments', icon: Receipt },
        { label: 'Payment Gateway', href: '/payment-gateway', icon: FileText },
        { label: 'CRM',    href: '/crm',    icon: BadgeDollarSign },
      ],
    },
    { label: 'Students', href: '/students', icon: GraduationCap },
  ],

  teacher: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Timetable', href: '/timetable', icon: CalendarDays },
    { label: 'Attendance', href: '/attendance', icon: UserCheck },
    {
      label: 'LMS', icon: BookMarked,
      children: [
        { label: 'Syllabus',     href: '/lms',              icon: BookMarked },
        { label: 'Assignments',  href: '/lms/assignments',  icon: ClipboardList },
        { label: 'Live Classes', href: '/lms/live-classes', icon: CalendarDays },
        { label: 'Exams',        href: '/lms/exams',        icon: FileText },
      ],
    },
    { label: 'Progress', href: '/progress', icon: BarChart3 },
  ],
  student: [
    { label: 'Dashboard',  href: '/dashboard',      icon: LayoutDashboard },
    { label: 'Timetable',  href: '/timetable',      icon: CalendarDays },
    { label: 'Attendance', href: '/attendance',     icon: UserCheck },
    { label: 'My Fees',    href: '/fees',           icon: Banknote },
    {
      label: 'LMS', icon: BookMarked,
      children: [
        { label: 'Syllabus',    href: '/lms',             icon: BookMarked },
        { label: 'Assignments', href: '/lms/assignments', icon: ClipboardList },
        { label: 'Exams',       href: '/lms/exams',       icon: FileText },
      ],
    },
    { label: 'Progress',      href: '/progress',      icon: BarChart3 },
    { label: 'Notifications', href: '/notifications', icon: Bell },
  ],

  parent: [
    { label: 'Dashboard',     href: '/dashboard',     icon: LayoutDashboard },
    { label: 'My Children',   href: '/children',      icon: UsersRound },
    { label: 'Attendance',    href: '/attendance',    icon: UserCheck },
    { label: 'Fees',          href: '/fees',          icon: Banknote },
    { label: 'Progress',      href: '/progress',      icon: BarChart3 },
    { label: 'Notifications', href: '/notifications', icon: Bell },
  ],
}

// ── NavLink (leaf) ─────────────────────────────────────────────
function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname()
  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href!))
  const Icon = item.icon

  return (
    <Link
      href={item.href!}
      title={collapsed ? item.label : undefined}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
        transition-all duration-200 group relative
        ${isActive
          ? 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] shadow-sm'
          : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-active-text)]'
        }
        ${collapsed ? 'justify-center px-2' : ''}
      `}
    >
      {/* Active indicator bar */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[var(--primary-300)] rounded-r-full" />
      )}
      <Icon size={18} className="shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}

      {/* Tooltip on collapsed */}
      {collapsed && (
        <span className="
          absolute left-full ml-2 px-2 py-1 text-xs rounded-md whitespace-nowrap
          bg-[var(--gray-900)] text-white opacity-0 pointer-events-none
          group-hover:opacity-100 transition-opacity duration-150 z-50
        ">
          {item.label}
        </span>
      )}
    </Link>
  )
}

// ── NavGroup (with dropdown) ───────────────────────────────────
function NavGroup({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname()
  const Icon = item.icon
  const isAnyChildActive = item.children?.some(
    c => pathname === c.href || pathname.startsWith(c.href!)
  )
  const [open, setOpen] = useState(isAnyChildActive ?? false)

  // Auto-open when navigating to a child
  useEffect(() => {
    if (isAnyChildActive) setOpen(true)
  }, [pathname, isAnyChildActive])

  // Collapse closes all groups
  useEffect(() => {
    if (collapsed) setOpen(false)
  }, [collapsed])

  return (
    <div>
      <button
        onClick={() => !collapsed && setOpen(o => !o)}
        title={collapsed ? item.label : undefined}
        className={`
          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
          transition-all duration-200 group relative
          ${isAnyChildActive
            ? 'text-[var(--sidebar-active-text)]'
            : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-active-text)]'
          }
          ${collapsed ? 'justify-center px-2' : ''}
        `}
      >
        <Icon size={18} className="shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left truncate">{item.label}</span>
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}
            />
          </>
        )}

        {/* Tooltip on collapsed */}
        {collapsed && (
          <span className="
            absolute left-full ml-2 px-2 py-1 text-xs rounded-md whitespace-nowrap
            bg-[var(--gray-900)] text-white opacity-0 pointer-events-none
            group-hover:opacity-100 transition-opacity duration-150 z-50
          ">
            {item.label}
          </span>
        )}
      </button>

      {/* Children (only in expanded mode) */}
      {!collapsed && (
        <div
          className={`overflow-hidden transition-all duration-200 ${open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l border-[rgba(255,255,255,0.08)] pl-3">
            {item.children?.map(child => (
              <NavLink key={child.href} item={child} collapsed={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Sidebar ───────────────────────────────────────────────
export function Sidebar() {
  const dispatch = useAppDispatch()
  const sidebarOpen = useAppSelector(state => state.ui.sidebarOpen)
  const user = useAppSelector(state => (state.user.loggedInUser as any))

  const role = (user?.role ?? 'principal') as Role
  const navItems = NAV_ITEMS[role] ?? NAV_ITEMS.principal

  const collapsed = !sidebarOpen

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => dispatch(toggleSidebar())}
        />
      )}

      <aside
        className={`
          erp-sidebar fixed top-0 left-0 h-full z-30 flex flex-col
          transition-[width] duration-300 ease-in-out
          ${collapsed ? 'w-[60px]' : 'w-[240px]'}
          shadow-lg overflow-hidden
        `}
      >
        {/* ── Logo / Brand ── */}
        <div className={`flex items-center h-16 border-b border-[rgba(255,255,255,0.06)] shrink-0 ${collapsed ? 'justify-center px-2' : 'px-4 gap-3'}`}>
          {/* Icon mark */}
          <div className="w-8 h-8 rounded-lg bg-[var(--primary-400)] flex items-center justify-center shrink-0">
            <School size={16} className="text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white leading-tight truncate">Campus Desk</p>
              <p className="text-[10px] text-[var(--sidebar-text-muted)] truncate">School ERP</p>
            </div>
          )}
        </div>

        {/* ── Nav links ── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 flex flex-col gap-0.5 scrollbar-thin">
          {navItems.map(item =>
            item.children
              ? <NavGroup key={item.label} item={item} collapsed={collapsed} />
              : <NavLink  key={item.href}  item={item} collapsed={collapsed} />
          )}
        </nav>

        {/* ── User info strip ── */}
        {!collapsed && user && (
          <div className="px-3 py-3 border-t border-[rgba(255,255,255,0.06)] shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[var(--primary-400)] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {user.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div className="overflow-hidden flex-1 min-w-0">
                <p className="text-xs font-medium text-[var(--sidebar-active-text)] truncate">{user.name}</p>
                <p className="text-[10px] text-[var(--sidebar-text-muted)] truncate capitalize">{user.role?.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Toggle button ── */}
        <button
          onClick={() => dispatch(toggleSidebar())}
          className={`
            shrink-0 flex items-center justify-center h-10 text-[var(--sidebar-text-muted)]
            hover:text-white hover:bg-[var(--sidebar-hover-bg)]
            border-t border-[rgba(255,255,255,0.06)]
            transition-colors duration-200
          `}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <ChevronRight size={16} />
            : <><ChevronLeft size={16} /><span className="ml-1 text-xs">Collapse</span></>
          }
        </button>
      </aside>
    </>
  )
}
