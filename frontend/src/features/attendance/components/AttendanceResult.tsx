import React, { useState, useMemo } from 'react';
import Select from 'react-select';
import { 
  useGetSchoolAttendanceSummaryQuery, 
  useGetClassAttendanceSummaryQuery, 
  useGetTeacherAttendanceSummaryQuery,
  useGetStudentDailySummaryQuery
} from '../../../store/api/attendanceApi';
import { useListClassesQuery } from '../../../store/api/classApi';
import { useListSectionsQuery } from '../../../store/api/sectionApi';
import { AttendanceFilterState } from '../types/attendance.types';
import { Users, BookOpen, GraduationCap, UserCheck } from 'lucide-react';
import { attendanceStatus } from '@/src/config/constant';

interface Props {
  filters: AttendanceFilterState;
}

export function AttendanceResult({ filters }: Props) {
  const [reportTab, setReportTab] = useState<'school' | 'class' | 'student' | 'teacher'>('school');
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  return (
    <div className="space-y-6">
      <div className="erp-card p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Attendance Analytics</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Comprehensive view of school-wide attendance</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">From:</label>
              <input 
                type="date" 
                className="erp-input text-sm py-1.5"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">To:</label>
              <input 
                type="date" 
                className="erp-input text-sm py-1.5"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <div className="flex overflow-x-auto bg-gray-50 dark:bg-gray-800/50 p-1 rounded-lg gap-1 border border-gray-100 dark:border-gray-800">
          {[
            { id: 'school', label: 'School Overview', icon: GraduationCap },
            { id: 'class', label: 'Class & Section', icon: BookOpen },
            { id: 'student', label: 'Student Deep Dive', icon: Users },
            { id: 'teacher', label: 'Teacher Attendance', icon: UserCheck }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setReportTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all ${
                reportTab === tab.id 
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {reportTab === 'school' && <SchoolOverviewTab filters={filters} dateRange={dateRange} />}
        {reportTab === 'class' && <ClassSectionReportTab filters={filters} dateRange={dateRange} />}
        {reportTab === 'student' && <StudentDeepDiveTab filters={filters} dateRange={dateRange} />}
        {reportTab === 'teacher' && <TeacherAttendanceTab dateRange={dateRange} />}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------------
// SCHOOL OVERVIEW TAB
// --------------------------------------------------------------------------------
function SchoolOverviewTab({ filters, dateRange }: { filters: AttendanceFilterState, dateRange: any }) {
  const { data, isFetching } = useGetSchoolAttendanceSummaryQuery(
    { academicYearId: filters.academicYearId || undefined, from: dateRange.from, to: dateRange.to },
    { skip: !filters.academicYearId }
  );

  const summary = data?.result || [];

  const totals = useMemo(() => {
    return summary.reduce((acc: any, curr: any) => ({
      enrolled: acc.enrolled + curr.totalEnrolled,
      present: acc.present + curr.presentCount,
      absent: acc.absent + curr.absentCount,
      late: acc.late + curr.lateCount,
      leave: acc.leave + curr.leaveCount,
      expected: acc.expected + (curr.totalEnrolled * curr.workingDays)
    }), { enrolled: 0, present: 0, absent: 0, late: 0, leave: 0, expected: 0 });
  }, [summary]);

  const overallPct = totals.expected > 0 ? Math.round((totals.present / totals.expected) * 100) : 0;

  if (!filters.academicYearId) return <div className="p-8 text-center text-gray-500">Please select an academic year in the global filters.</div>;
  if (isFetching) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Overall Attendance" value={`${overallPct}%`} subtitle={`${totals.present} / ${totals.expected} expected days`} color="blue" />
        <StatCard title="Total Students" value={totals.enrolled} subtitle="Across all classes" color="indigo" />
        <StatCard title="Total Absences" value={totals.absent} subtitle="In selected period" color="red" />
        <StatCard title="Late / Leaves" value={totals.late + totals.leave} subtitle={`${totals.late} Late, ${totals.leave} Leave`} color="yellow" />
      </div>

      <div className="erp-card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden rounded-xl">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">Class Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Class</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Students</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Working Days</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Present</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Absent</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Late/Leave</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {summary.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No data found</td></tr>
              ) : summary.map((row: any) => (
                <tr key={row.classId} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{row.className}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.totalEnrolled}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.workingDays}</td>
                  <td className="px-4 py-3 text-green-600">{row.presentCount}</td>
                  <td className="px-4 py-3 text-red-600">{row.absentCount}</td>
                  <td className="px-4 py-3 text-yellow-600">{row.lateCount + row.leaveCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${getPctColor(row.attendancePct)}`}>{row.attendancePct}%</span>
                      <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full ${getPctBg(row.attendancePct)}`} style={{ width: `${row.attendancePct}%` }} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------------
// CLASS & SECTION REPORT TAB
// --------------------------------------------------------------------------------
function ClassSectionReportTab({ filters, dateRange }: { filters: AttendanceFilterState, dateRange: any }) {
  const [classId, setClassId] = useState<string | null>(filters.classId);
  const [sectionId, setSectionId] = useState<string | null>(filters.sectionId);

  const { data: classesData } = useListClassesQuery({ academicYearId: filters.academicYearId || undefined }, { skip: !filters.academicYearId });
  const { data: sectionsData } = useListSectionsQuery({ classId: classId || undefined, academicYearId: filters.academicYearId || undefined }, { skip: !classId });

  const { data, isFetching } = useGetClassAttendanceSummaryQuery(
    { academicYearId: filters.academicYearId || undefined, classId: classId || undefined, sectionId: sectionId || undefined, from: dateRange.from, to: dateRange.to },
    { skip: !filters.academicYearId || !classId }
  );

  const students = data?.result || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">Select Class</label>
          <select value={classId || ''} onChange={(e) => { setClassId(e.target.value); setSectionId(null); }} className="erp-input w-full">
            <option value="">-- Choose Class --</option>
            {classesData?.data?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">Select Section (Optional)</label>
          <select value={sectionId || ''} onChange={(e) => setSectionId(e.target.value)} className="erp-input w-full" disabled={!classId}>
            <option value="">-- All Sections --</option>
            {sectionsData?.data?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {!classId ? (
        <div className="p-12 text-center text-gray-500 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
          Please select a class to view student attendance reports.
        </div>
      ) : isFetching ? (
        <LoadingSkeleton />
      ) : (
        <div className="erp-card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Student Name</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Working Days</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Present</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Absent</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Late</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Leave</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Overall %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {students.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No students found</td></tr>
                ) : students.map((row: any) => (
                  <tr key={row.studentId} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs shrink-0">
                          {row.studentName.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{row.studentName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.workingDays}</td>
                    <td className="px-4 py-3 text-green-600">{row.presentCount}</td>
                    <td className="px-4 py-3 text-red-600">{row.absentCount}</td>
                    <td className="px-4 py-3 text-yellow-600">{row.lateCount}</td>
                    <td className="px-4 py-3 text-blue-600">{row.leaveCount}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPctBadgeColor(row.attendancePct)}`}>
                        {row.attendancePct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------------
// STUDENT DEEP DIVE TAB
// --------------------------------------------------------------------------------
function StudentDeepDiveTab({ filters, dateRange }: { filters: AttendanceFilterState, dateRange: any }) {
  const [classId, setClassId] = useState<string | null>(filters.classId);
  const [sectionId, setSectionId] = useState<string | null>(filters.sectionId);
  const [studentId, setStudentId] = useState<string | null>(null);

  const { data: classesData } = useListClassesQuery({ academicYearId: filters.academicYearId || undefined }, { skip: !filters.academicYearId });
  const { data: sectionsData } = useListSectionsQuery({ classId: classId || undefined, academicYearId: filters.academicYearId || undefined }, { skip: !classId });
  const { data: studentsData, isFetching: isFetchingStudents } = useGetClassAttendanceSummaryQuery(
    { academicYearId: filters.academicYearId || undefined, classId: classId || undefined, sectionId: sectionId || undefined, from: dateRange.from, to: dateRange.to },
    { skip: !filters.academicYearId || !classId || !sectionId }
  );

  const { data: historyData, isFetching: isFetchingHistory } = useGetStudentDailySummaryQuery(
    { studentId: studentId as string, from: dateRange.from, to: dateRange.to },
    { skip: !studentId }
  );

  const historyRecords = historyData?.result || [];

  const studentOptions = useMemo(() => {
    if (!studentsData?.result) return [];
    return studentsData.result.map((s: any) => ({ value: s.studentId, label: s.studentName }));
  }, [studentsData]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
          <select value={classId || ''} onChange={(e) => { setClassId(e.target.value); setSectionId(null); setStudentId(null); }} className="erp-input w-full">
            <option value="">-- Class --</option>
            {classesData?.data?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Section</label>
          <select value={sectionId || ''} onChange={(e) => { setSectionId(e.target.value); setStudentId(null); }} className="erp-input w-full" disabled={!classId}>
            <option value="">-- Section --</option>
            {sectionsData?.data?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Student</label>
          <Select
            options={studentOptions}
            isLoading={isFetchingStudents}
            onChange={(selected: any) => setStudentId(selected?.value || null)}
            placeholder="Search student..."
            className="react-select-container"
            classNamePrefix="react-select"
            isDisabled={!sectionId}
            value={studentOptions.find((o: any) => o.value === studentId) || null}
          />
        </div>
      </div>

      {!studentId ? (
        <div className="p-12 text-center text-gray-500 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
          Select a student to view detailed day-by-day and period-wise attendance.
        </div>
      ) : isFetchingHistory ? (
        <LoadingSkeleton />
      ) : (
        <div className="erp-card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Daily Records</h3>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Date</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Daily Status</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Period Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {historyRecords.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">No records found for this period.</td></tr>
              ) : historyRecords.map((record: any, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-white font-medium">
                    {new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={record.dailyStatus.toUpperCase()} />
                  </td>
                  <td className="px-4 py-3">
                    {record.periodStatuses?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {record.periodStatuses.map((ps: any, i: number) => (
                          <div key={i} className="flex flex-col gap-1 bg-white dark:bg-gray-800 px-2.5 py-1.5 rounded border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-xs text-gray-700 dark:text-gray-300">{ps.period?.name || `Period ${i+1}`}</span>
                              <StatusBadge status={ps.status} small />
                            </div>
                            <span className="text-[10px] text-gray-500 truncate max-w-[120px]">{ps.subject?.name || 'Subject'}</span>
                            {ps.remark && <span className="text-[10px] text-red-500 italic truncate max-w-[120px]">Note: {ps.remark}</span>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm italic">Present all periods</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------------
// TEACHER ATTENDANCE TAB
// --------------------------------------------------------------------------------
function TeacherAttendanceTab({ dateRange }: { dateRange: any }) {
  const { data, isFetching } = useGetTeacherAttendanceSummaryQuery(
    { from: dateRange.from, to: dateRange.to }
  );

  const teachers = data?.result || [];

  if (isFetching) return <LoadingSkeleton />;

  return (
    <div className="erp-card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden rounded-xl">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Teacher Attendance Summary</h3>
        <span className="text-xs text-gray-500 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
          {new Date(dateRange.from).toLocaleDateString()} - {new Date(dateRange.to).toLocaleDateString()}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Teacher Name</th>
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Working Days</th>
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Present</th>
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Absent</th>
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Late / Leave</th>
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Attendance %</th>
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Latest Check-In</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {teachers.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No teacher attendance records found</td></tr>
            ) : teachers.map((row: any) => (
              <tr key={row.teacherId} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{row.teacherName}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.workingDays}</td>
                <td className="px-4 py-3 text-green-600 font-medium">{row.presentCount}</td>
                <td className="px-4 py-3 text-red-600 font-medium">{row.absentCount}</td>
                <td className="px-4 py-3 text-yellow-600">{row.lateCount} / {row.leaveCount}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPctBadgeColor(row.attendancePct)}`}>
                    {row.attendancePct}%
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {row.lastCheckIn ? new Date(row.lastCheckIn).toLocaleString() : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------------
// UTILS & SHARED COMPONENTS
// --------------------------------------------------------------------------------

function StatCard({ title, value, subtitle, color }: { title: string, value: string|number, subtitle: string, color: 'blue'|'indigo'|'red'|'yellow' }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
  };

  return (
    <div className="erp-card bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col">
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{title}</span>
      <div className="flex items-end gap-3 mt-auto">
        <span className={`text-3xl font-bold ${colorClasses[color].split(' ')[1]} ${colorClasses[color].split(' ')[3]}`}>{value}</span>
      </div>
      <span className="text-xs text-gray-400 mt-2">{subtitle}</span>
    </div>
  );
}

function StatusBadge({ status, small = false }: { status: string; small?: boolean }) {
  let color = 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
  if (status === attendanceStatus.PRESENT || status === 'PRESENT') color = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (status === attendanceStatus.ABSENT || status === 'ABSENT') color = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  if (status === attendanceStatus.LATE || status === 'LATE') color = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  if (status === attendanceStatus.LEAVE || status === 'LEAVE') color = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';

  return (
    <span className={`inline-flex items-center justify-center font-medium rounded-full ${color} ${small ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}>
      {status}
    </span>
  );
}

function getPctColor(pct: number) {
  if (pct >= 90) return 'text-green-600 dark:text-green-400';
  if (pct >= 75) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function getPctBg(pct: number) {
  if (pct >= 90) return 'bg-green-500 dark:bg-green-400';
  if (pct >= 75) return 'bg-yellow-500 dark:bg-yellow-400';
  return 'bg-red-500 dark:bg-red-400';
}

function getPctBadgeColor(pct: number) {
  if (pct >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
  if (pct >= 75) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
  return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4 bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
      <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded w-1/4 mb-6"></div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-12 bg-gray-50 dark:bg-gray-800/50 rounded"></div>
      ))}
    </div>
  );
}
