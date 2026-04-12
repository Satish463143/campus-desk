import {
  LayoutDashboard, Users, GraduationCap, BookOpen,
  CalendarDays, ClipboardList, Banknote, Receipt,
  FileText, Settings, Bell, UserCheck, School
} from 'lucide-react'

export const NAV_ITEMS = {

  super_admin: [
    { label: 'Dashboard',  href: '/dashboard',       icon: LayoutDashboard },
    { label: 'Schools',    href: '/schools',          icon: School },
    { label: 'Settings',   href: '/settings',         icon: Settings },
  ],

  principal: [
    { label: 'Dashboard',  href: '/dashboard',        icon: LayoutDashboard },
    { label: 'Students',   href: '/students',         icon: GraduationCap },
    { label: 'Teachers',   href: '/teachers',         icon: Users },
    { label: 'Academic',   href: '/academic',         icon: BookOpen },
    { label: 'Timetable',  href: '/timetable',        icon: CalendarDays },
    { label: 'Attendance', href: '/attendance',       icon: UserCheck },
    { label: 'Fees',       href: '/fees',             icon: Banknote },
    { label: 'LMS',        href: '/lms',              icon: BookOpen },
    { label: 'Progress',   href: '/progress',         icon: ClipboardList },
    { label: 'Settings',   href: '/settings',         icon: Settings },
  ],

  admin_staff: [
    { label: 'Dashboard',  href: '/dashboard',        icon: LayoutDashboard },
    { label: 'Students',   href: '/students',         icon: GraduationCap },
    { label: 'Teachers',   href: '/teachers',         icon: Users },
    { label: 'Parents',    href: '/parents',          icon: Users },
    { label: 'Academic',   href: '/academic',         icon: BookOpen },
    { label: 'Admissions', href: '/admissions',       icon: FileText },
    { label: 'Timetable',  href: '/timetable',        icon: CalendarDays },
    { label: 'Attendance', href: '/attendance',       icon: UserCheck },
    { label: 'Settings',   href: '/settings',         icon: Settings },
  ],

  accountant: [
    { label: 'Dashboard',  href: '/dashboard',        icon: LayoutDashboard },
    { label: 'Fees',       href: '/fees',             icon: Banknote },
    { label: 'Payments',   href: '/fees/payments',    icon: Receipt },
    { label: 'Invoices',   href: '/fees/invoices',    icon: FileText },
    { label: 'Scholarships', href: '/fees/scholarships', icon: GraduationCap },
    { label: 'Students',   href: '/students',         icon: GraduationCap },
  ],

  teacher: [
    { label: 'Dashboard',  href: '/dashboard',        icon: LayoutDashboard },
    { label: 'Timetable',  href: '/timetable',        icon: CalendarDays },
    { label: 'Attendance', href: '/attendance',       icon: UserCheck },
    { label: 'LMS',        href: '/lms',              icon: BookOpen },
    { label: 'Assignments', href: '/lms/assignments', icon: ClipboardList },
    { label: 'Live Classes', href: '/lms/live-classes', icon: CalendarDays },
    { label: 'Exams',      href: '/lms/exams',        icon: FileText },
    { label: 'Progress',   href: '/progress',         icon: ClipboardList },
  ],

  student: [
    { label: 'Dashboard',  href: '/dashboard',        icon: LayoutDashboard },
    { label: 'Timetable',  href: '/timetable',        icon: CalendarDays },
    { label: 'Attendance', href: '/attendance',       icon: UserCheck },
    { label: 'My Fees',    href: '/fees',             icon: Banknote },
    { label: 'LMS',        href: '/lms',              icon: BookOpen },
    { label: 'Assignments', href: '/lms/assignments', icon: ClipboardList },
    { label: 'Exams',      href: '/exams',            icon: FileText },
    { label: 'Progress',   href: '/progress',         icon: ClipboardList },
  ],

  parent: [
    { label: 'Dashboard',  href: '/dashboard',        icon: LayoutDashboard },
    { label: 'My Children', href: '/children',        icon: Users },
    { label: 'Attendance', href: '/attendance',       icon: UserCheck },
    { label: 'Fees',       href: '/fees',             icon: Banknote },
    { label: 'Progress',   href: '/progress',         icon: ClipboardList },
    { label: 'Notifications', href: '/notifications', icon: Bell },
  ],
}