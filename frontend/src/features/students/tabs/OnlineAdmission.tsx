'use client'
import React from 'react'
import { Globe } from 'lucide-react'

export default function OnlineAdmission() {
  return (
    <div className="flex flex-col items-center py-20 gap-4 text-[var(--foreground-muted)]">
      <div className="w-16 h-16 rounded-xl bg-[var(--primary-light)] flex items-center justify-center">
        <Globe size={28} className="text-[var(--primary)]" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-[var(--foreground)]">Online Admissions</p>
        <p className="text-sm mt-1 max-w-xs">When students apply online, their applications will appear here for review and approval.</p>
      </div>
      <div className="px-4 py-3 rounded-xl bg-[var(--info-bg)] text-xs text-[var(--foreground-muted)] max-w-sm text-center">
        Online admission portal integration coming soon.
      </div>
    </div>
  )
}
