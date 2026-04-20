'use client'
import React, { useState } from 'react'
import {
  BookOpen, CreditCard, AlertTriangle, Clock, Bell,
  Settings, FileText, DollarSign, Users
} from 'lucide-react'
import FeeRecord from './tabs/FeeRecord'
import Uncollected from './tabs/Uncollected'
import Overdue from './tabs/Overdue'
import Payments from './tabs/Payments'
import Reminders from './tabs/Reminders'
import FeeSetup from './tabs/FeeSetup'
import Setting from './tabs/Seeting'
import Invoices from './tabs/Invoices'
import { useListFeeRecordsQuery, useGetOverdueFeesQuery } from '@/src/store/api/feeApi'
import { useListPendingInvoicesQuery } from '@/src/store/api/invoiceApi'

type TabId = 'records' | 'uncollected' | 'overdue' | 'payments' | 'reminders' | 'setup' | 'settings' | 'invoices'

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'records',    label: 'Fee Records',  icon: <BookOpen size={15} /> },
  { id: 'uncollected',label: 'Uncollected',  icon: <Users size={15} /> },
  { id: 'overdue',    label: 'Overdue',      icon: <AlertTriangle size={15} /> },
  { id: 'payments',   label: 'Payments',     icon: <CreditCard size={15} /> },
  { id: 'reminders',  label: 'Reminders',    icon: <Bell size={15} /> },
  { id: 'setup',      label: 'Fee Setup',    icon: <DollarSign size={15} /> },
  { id: 'settings',   label: 'Settings',     icon: <Settings size={15} /> },
  { id: 'invoices',   label: 'Invoices',     icon: <FileText size={15} /> },
]

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  color: string
  bg: string
}

function StatCard({ label, value, sub, icon, color, bg }: StatCardProps) {
  return (
    <div className="erp-card flex items-center justify-between gap-4 min-w-0">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">{label}</span>
        <span className="text-2xl font-bold text-[var(--foreground)]">{value}</span>
        {sub && <span className="text-xs text-[var(--foreground-muted)]">{sub}</span>}
      </div>
      <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${bg}`} style={{ color }}>
        {icon}
      </div>
    </div>
  )
}

export default function Fee({ schoolId }: { schoolId: string; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<TabId>('records')

  const { data: recordsData } = useListFeeRecordsQuery({ limit: 1 })
  const { data: overdueData } = useGetOverdueFeesQuery({ limit: 1 })

  const totalDue      = recordsData?.meta?.totalDue     ?? 0
  const totalCollected= recordsData?.meta?.totalCollected?? 0
  const overdueCount  = overdueData?.meta?.total        ?? 0
  const pendingCount  = recordsData?.meta?.pending       ?? 0
  const fullyPaid     = recordsData?.meta?.paid          ?? 0

  return (
    <div className="flex flex-col gap-0 h-full w-full bg-[var(--background-secondary)]">
      {/* ── Stats Header ─────────────────────────────────────────── */}
      <div className="p-5 pb-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
          <StatCard
            label="Total Balance Due"
            value={`Rs. ${Number(totalDue).toLocaleString()}`}
            sub="0 students"
            icon={<DollarSign size={20} />}
            color="var(--danger)"
            bg="var(--danger-bg)"
          />
          <StatCard
            label="Total Collected"
            value={`Rs. ${Number(totalCollected).toLocaleString()}`}
            sub="All time"
            icon={<CreditCard size={20} />}
            color="var(--secondary)"
            bg="var(--secondary-light)"
          />
          <StatCard
            label="Overdue Students"
            value={overdueCount}
            icon={<AlertTriangle size={20} />}
            color="var(--warning)"
            bg="var(--warning-bg)"
          />
          <StatCard
            label="Pending Students"
            value={pendingCount}
            icon={<Clock size={20} />}
            color="var(--accent)"
            bg="var(--accent-light)"
          />
          <StatCard
            label="Fully Paid"
            value={fullyPaid}
            icon={<Users size={20} />}
            color="var(--success)"
            bg="var(--success-bg)"
          />
        </div>

        {/* ── Tab Bar ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-0.5 border-b border-[var(--border)] overflow-x-auto no-scrollbar">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-150 ${
                activeTab === tab.id
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--border-strong)]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'records'     && <FeeRecord schoolId={schoolId} />}
        {activeTab === 'uncollected' && <Uncollected schoolId={schoolId} />}
        {activeTab === 'overdue'     && <Overdue schoolId={schoolId} />}
        {activeTab === 'payments'    && <Payments schoolId={schoolId} />}
        {activeTab === 'reminders'   && <Reminders schoolId={schoolId} />}
        {activeTab === 'setup'       && <FeeSetup schoolId={schoolId} />}
        {activeTab === 'settings'    && <Setting schoolId={schoolId} />}
        {activeTab === 'invoices'    && <Invoices schoolId={schoolId} />}
      </div>
    </div>
  )
}