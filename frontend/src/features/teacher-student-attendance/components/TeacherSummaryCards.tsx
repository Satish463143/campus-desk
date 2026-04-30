'use client'

import React, { useMemo } from 'react'
import { useGetSectionDailySummaryQuery } from '../../../store/api/attendanceApi'
import { Users, CheckCircle, XCircle, Clock } from 'lucide-react'
import { attendanceStatus } from '@/src/config/constant'

interface TeacherSummaryCardsProps {
  sectionId: string | null
  date: string
}

export function TeacherSummaryCards({ sectionId, date }: TeacherSummaryCardsProps) {
  const { data, isLoading, isError } = useGetSectionDailySummaryQuery(
    { sectionId: sectionId as string, date },
    { skip: !sectionId }
  )

  const summary = useMemo(() => {
    if (!data?.result) return { total: 0, present: 0, absent: 0, lateLeave: 0 }
    const records = data.result as any[]
    let present = 0, absent = 0, lateLeave = 0
    records.forEach((r: any) => {
      const s = r.dailyStatus?.toUpperCase()
      if (s === attendanceStatus.PRESENT) present++
      else if (s === attendanceStatus.ABSENT) absent++
      else if (s === attendanceStatus.LATE || s === attendanceStatus.LEAVE) lateLeave++
      else present++ // default present if no record
    })
    return { total: records.length, present, absent, lateLeave }
  }, [data])

  if (!sectionId) return null

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (isError) return null

  const cards = [
    { title: 'Total Students', value: summary.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
    { title: 'Present', value: summary.present, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/30', percent: summary.total ? Math.round((summary.present / summary.total) * 100) : 0 },
    { title: 'Absent', value: summary.absent, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/30', percent: summary.total ? Math.round((summary.absent / summary.total) * 100) : 0 },
    { title: 'Late / Leave', value: summary.lateLeave, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/30', percent: summary.total ? Math.round((summary.lateLeave / summary.total) * 100) : 0 },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon
        return (
          <div key={idx} className="erp-card flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</h3>
                {card.percent !== undefined && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${card.bg} ${card.color}`}>
                    {card.percent}%
                  </span>
                )}
              </div>
            </div>
            <div className={`p-3 rounded-full ${card.bg} ${card.color}`}>
              <Icon size={22} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
