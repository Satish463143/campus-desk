'use client'
import React, { useState } from 'react'
import {
  TrendingUp, TrendingDown, Users, CreditCard, AlertTriangle,
  Banknote, Wifi, Search, Calendar, Clock, ChevronRight,
  BarChart3, PieChart, Activity, RefreshCw, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { useListManualPaymentsQuery, useGetPaymentHistoryQuery } from '@/src/store/api/paymentApi'
import { useListFeeRecordsQuery, useGetOverdueFeesQuery } from '@/src/store/api/feeApi'
import { useListStudentsQuery } from '@/src/store/api/studentApi'

interface CRMProps { schoolId: string; onClose: () => void }

// ── Stat Card ──────────────────────────────────────
function KPICard({ label, value, sub, icon, color, bg, trend, trendLabel }: {
  label: string; value: string | number; sub?: string
  icon: React.ReactNode; color: string; bg: string
  trend?: 'up' | 'down' | 'neutral'; trendLabel?: string
}) {
  return (
    <div className="erp-card flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`} style={{ color }}>
          {icon}
        </div>
        {trend && trendLabel && (
          <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${trend === 'up' ? 'bg-[var(--success-bg)] text-[var(--success-text)]' : trend === 'down' ? 'bg-[var(--danger-bg)] text-[var(--danger-text)]' : 'bg-[var(--gray-100)] text-[var(--gray-600)]'}`}>
            {trend === 'up' ? <ArrowUpRight size={11}/> : trend === 'down' ? <ArrowDownRight size={11}/> : null}
            {trendLabel}
          </span>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold text-[var(--foreground)]">{value}</div>
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)] mt-0.5">{label}</div>
        {sub && <div className="text-xs text-[var(--foreground-muted)] mt-1">{sub}</div>}
      </div>
    </div>
  )
}

// ── Mini bar chart (CSS only) ──────────────────────
function MiniBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-24 text-[var(--foreground-muted)] text-xs truncate shrink-0">{label}</div>
      <div className="flex-1 bg-[var(--surface-raised)] rounded-full h-2">
        <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="w-20 text-right text-xs font-semibold text-[var(--foreground)]">Rs.{value.toLocaleString()}</div>
      <div className="w-10 text-right text-xs text-[var(--foreground-muted)]">{pct}%</div>
    </div>
  )
}

// ── Recent Activity row ────────────────────────────
function ActivityRow({ name, amount, method, date, type }: { name: string; amount: number; method: string; date: string; type: 'manual' | 'online' }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[var(--border)] last:border-0">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${type === 'manual' ? 'bg-[var(--info-bg)] text-[var(--info-text)]' : 'bg-[var(--secondary-light)] text-[var(--secondary)]'}`}>
        {name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-[var(--foreground)] truncate">{name}</div>
        <div className="text-xs text-[var(--foreground-muted)]">{method.replace(/_/g, ' ').toUpperCase()} · {date}</div>
      </div>
      <div className="flex flex-col items-end shrink-0">
        <div className="font-bold text-sm text-[var(--success)]">+Rs.{amount.toLocaleString()}</div>
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${type === 'manual' ? 'bg-[var(--info-bg)] text-[var(--info-text)]' : 'bg-[var(--secondary-light)] text-[var(--secondary)]'}`}>
          {type === 'manual' ? 'Cash' : 'Online'}
        </span>
      </div>
    </div>
  )
}

// ── Overdue Student Row ────────────────────────────
function OverdueRow({ fee }: { fee: any }) {
  const days = fee.dueDate ? Math.floor((Date.now() - new Date(fee.dueDate).getTime()) / 86400000) : 0
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[var(--border)] last:border-0">
      <div className="w-8 h-8 rounded-full bg-[var(--danger-bg)] text-[var(--danger)] flex items-center justify-center shrink-0 text-xs font-bold">
        {(fee.student?.user?.name ?? 'S').charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-[var(--foreground)] truncate">{fee.student?.user?.name ?? '—'}</div>
        <div className="text-xs text-[var(--foreground-muted)]">{fee.feeStructure?.feeCategory?.name ?? 'Fee'}</div>
      </div>
      <div className="flex flex-col items-end shrink-0">
        <div className="font-bold text-sm text-[var(--danger)]">Rs.{Number(fee.amount).toLocaleString()}</div>
        <span className="badge-overdue px-1.5 py-0.5 rounded-full text-xs">{days}d overdue</span>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────
export default function CRM({ schoolId, onClose }: CRMProps) {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  const fromDate = period === '7d' ? new Date(Date.now() - 7*86400000).toISOString().split('T')[0]
    : period === '30d' ? new Date(Date.now() - 30*86400000).toISOString().split('T')[0]
    : period === '90d' ? new Date(Date.now() - 90*86400000).toISOString().split('T')[0]
    : undefined

  const { data: manualData } = useListManualPaymentsQuery({ limit: 200, from: fromDate })
  const { data: onlineData }  = useGetPaymentHistoryQuery({ limit: 200, from: fromDate })
  const { data: allFeesData } = useListFeeRecordsQuery({ limit: 1 })
  const { data: overdueData } = useGetOverdueFeesQuery({ limit: 10 })
  const { data: studentsData } = useListStudentsQuery({ limit: 1 })

  const manualPayments = manualData?.result ?? []
  const onlinePayments = onlineData?.result ?? []

  const manualTotal  = manualPayments.reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0)
  const onlineTotal  = onlinePayments.reduce((s: number, p: any) => s + Number(p.totalAmount ?? 0), 0)
  const grandTotal   = manualTotal + onlineTotal

  const totalDue     = allFeesData?.meta?.totalDue ?? 0
  const totalPending = allFeesData?.meta?.pending ?? 0
  const totalPaid    = allFeesData?.meta?.paid ?? 0
  const totalStudents = studentsData?.meta?.total ?? 0
  const overdueFeeds = overdueData?.result ?? []
  const overdueMeta  = overdueData?.meta?.total ?? 0

  const collectionRate = totalDue > 0 ? Math.round((grandTotal / totalDue) * 100) : 0

  // Methods breakdown
  const methodMap: Record<string, number> = {}
  for (const p of manualPayments) {
    const m = p.paymentMethod ?? 'cash'
    methodMap[m] = (methodMap[m] ?? 0) + Number(p.amount ?? 0)
  }
  for (const p of onlinePayments) {
    const m = p.paymentMethod ?? 'online'
    methodMap[m] = (methodMap[m] ?? 0) + Number(p.totalAmount ?? 0)
  }
  const methodMax = Math.max(...Object.values(methodMap), 1)

  const METHOD_COLORS_MAP: Record<string, string> = {
    cash: 'var(--success)',
    esewa: '#2ecc71',
    khalti: '#9b59b6',
    fone_pay: 'var(--info)',
    bank_transfer: 'var(--primary)',
    card: 'var(--accent)',
  }

  // Recent activity — last 8 combined
  const recentManual = manualPayments.slice(0, 20).map((p: any) => ({
    name: p.student?.user?.name ?? '—',
    amount: Number(p.amount ?? 0),
    method: p.paymentMethod ?? 'cash',
    date: p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '—',
    type: 'manual' as const,
    ts: new Date(p.paymentDate ?? p.createdAt).getTime(),
  }))
  const recentOnline = onlinePayments.slice(0, 20).map((p: any) => ({
    name: p.student?.user?.name ?? '—',
    amount: Number(p.totalAmount ?? 0),
    method: p.paymentMethod ?? 'online',
    date: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—',
    type: 'online' as const,
    ts: new Date(p.createdAt).getTime(),
  }))
  const recentActivity = [...recentManual, ...recentOnline].sort((a, b) => b.ts - a.ts).slice(0, 8)

  return (
    <div className="p-5 flex flex-col gap-6">
      {/* ── Header ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
            <BarChart3 size={20}/>
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">Fee CRM Dashboard</h1>
            <p className="text-sm text-[var(--foreground-muted)]">Collection analytics and student payment insights</p>
          </div>
        </div>

        {/* Period selector */}
        <div className="flex bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius-md)] p-0.5 gap-0.5">
          {(['7d','30d','90d','all'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-sm)] transition-all ${period === p ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'}`}>
              {p === 'all' ? 'All' : p}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Row ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          label="Total Collected"
          value={`Rs. ${grandTotal.toLocaleString()}`}
          sub={`${collectionRate}% collection rate`}
          icon={<CreditCard size={20}/>}
          color="var(--success)"
          bg="var(--success-bg)"
          trend="up"
          trendLabel={`${collectionRate}%`}
        />
        <KPICard
          label="Balance Due"
          value={`Rs. ${Number(totalDue).toLocaleString()}`}
          sub={`${totalPending} pending students`}
          icon={<AlertTriangle size={20}/>}
          color="var(--danger)"
          bg="var(--danger-bg)"
          trend={overdueMeta > 0 ? 'down' : 'neutral'}
          trendLabel={overdueMeta > 0 ? `${overdueMeta} overdue` : 'On track'}
        />
        <KPICard
          label="Manual / Cash"
          value={`Rs. ${manualTotal.toLocaleString()}`}
          sub={`${manualPayments.length} transactions`}
          icon={<Banknote size={20}/>}
          color="var(--info)"
          bg="var(--info-bg)"
        />
        <KPICard
          label="Online Payments"
          value={`Rs. ${onlineTotal.toLocaleString()}`}
          sub={`${onlinePayments.length} transactions`}
          icon={<Wifi size={20}/>}
          color="var(--secondary)"
          bg="var(--secondary-light)"
        />
      </div>

      {/* ── Second KPI row ───────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard label="Total Students" value={totalStudents} icon={<Users size={20}/>} color="var(--primary)" bg="var(--primary-light)"/>
        <KPICard label="Fully Paid" value={totalPaid} icon={<Activity size={20}/>} color="var(--success)" bg="var(--success-bg)"/>
        <KPICard label="Pending" value={totalPending} icon={<Clock size={20}/>} color="var(--warning)" bg="var(--warning-bg)"/>
        <KPICard label="Overdue" value={overdueMeta} icon={<AlertTriangle size={20}/>} color="var(--danger)" bg="var(--danger-bg)"/>
      </div>

      {/* ── Collection Rate Progress ─────────────────── */}
      <div className="erp-card flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-[var(--foreground)] flex items-center gap-2"><TrendingUp size={16} className="text-[var(--success)]"/>Fee Collection Rate</h2>
          <span className="text-lg font-bold text-[var(--success)]">{collectionRate}%</span>
        </div>
        <div className="relative w-full bg-[var(--surface-raised)] rounded-full h-4 overflow-hidden">
          <div
            className="h-4 rounded-full transition-all duration-700"
            style={{ width: `${collectionRate}%`, background: 'linear-gradient(90deg, var(--success) 0%, var(--primary) 100%)' }}
          />
        </div>
        <div className="flex justify-between text-xs text-[var(--foreground-muted)]">
          <span>Collected: Rs. {grandTotal.toLocaleString()}</span>
          <span>Due: Rs. {Number(totalDue).toLocaleString()}</span>
        </div>
      </div>

      {/* ── Methods + Recent Activity ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Payment Methods Breakdown */}
        <div className="erp-card flex flex-col gap-4">
          <h2 className="font-bold text-[var(--foreground)] flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <PieChart size={15} className="text-[var(--primary)]"/> Payment Methods
          </h2>
          {Object.keys(methodMap).length === 0 ? (
            <div className="text-sm text-[var(--foreground-muted)] py-4 text-center">No payment data yet.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {Object.entries(methodMap).sort(([,a],[,b]) => b - a).map(([method, amount]) => (
                <MiniBar
                  key={method}
                  label={method.replace(/_/g,' ')}
                  value={amount}
                  max={methodMax}
                  color={METHOD_COLORS_MAP[method] ?? 'var(--primary)'}
                />
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="erp-card flex flex-col gap-3">
          <h2 className="font-bold text-[var(--foreground)] flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <Activity size={15} className="text-[var(--secondary)]"/> Recent Activity
          </h2>
          {recentActivity.length === 0 ? (
            <div className="text-sm text-[var(--foreground-muted)] py-4 text-center">No recent activity.</div>
          ) : (
            <div className="flex flex-col">
              {recentActivity.map((a, i) => (
                <ActivityRow key={i} {...a}/>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Overdue Students ─────────────────────────── */}
      {overdueFeeds.length > 0 && (
        <div className="erp-card flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h2 className="font-bold text-[var(--foreground)] flex items-center gap-2">
              <AlertTriangle size={15} className="text-[var(--danger)]"/> Overdue Students
              <span className="ml-1 px-2 py-0.5 rounded-full bg-[var(--danger-bg)] text-[var(--danger)] text-xs font-bold">{overdueMeta}</span>
            </h2>
            <a href="/fee-management" className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1">View all <ChevronRight size={12}/></a>
          </div>
          <div className="flex flex-col">
            {overdueFeeds.slice(0, 6).map((f: any) => <OverdueRow key={f.id} fee={f}/>)}
          </div>
        </div>
      )}

      {/* ── Quick Actions ─────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Fee Management', href: '/fee-management', icon: <Banknote size={18}/>, color: 'var(--primary)', bg: 'var(--primary-light)' },
          { label: 'Manual Payments', href: '/manual-payments', icon: <CreditCard size={18}/>, color: 'var(--info)', bg: 'var(--info-bg)' },
          { label: 'Payment Gateway', href: '/payment-gateway', icon: <Wifi size={18}/>, color: 'var(--secondary)', bg: 'var(--secondary-light)' },
          { label: 'View Students', href: '/students', icon: <Users size={18}/>, color: 'var(--success)', bg: 'var(--success-bg)' },
        ].map(q => (
          <a key={q.label} href={q.href} className="erp-card flex items-center gap-3 hover:border-[var(--primary)] transition-colors group">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ color: q.color, background: q.bg }}>{q.icon}</div>
            <span className="text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">{q.label}</span>
            <ChevronRight size={14} className="ml-auto text-[var(--foreground-muted)] group-hover:text-[var(--primary)] transition-colors"/>
          </a>
        ))}
      </div>
    </div>
  )
}