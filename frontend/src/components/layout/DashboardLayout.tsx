'use client'

import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useAppSelector } from '@/src/store/hooks'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sidebarOpen = useAppSelector(state => state.ui.sidebarOpen)

  return (
    <div className="min-h-screen flex bg-[var(--background)]">
      <Sidebar />

      {/* Main content area — pushes right based on sidebar width */}
      <div
        className={`
          flex flex-col flex-1 min-h-screen
          transition-[margin-left] duration-300 ease-in-out
          ${sidebarOpen ? 'ml-[240px]' : 'ml-[60px]'}
        `}
      >
        <Topbar />

        {/* Page content */}
        <main className="flex-1 mt-16 p-6 overflow-y-auto bg-[var(--background-secondary)]">
          {children}
        </main>
      </div>
    </div>
  )
}
