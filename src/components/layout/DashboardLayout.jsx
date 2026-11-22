import React, { useState } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCircle,
  Search,
  Sparkles,
  Users,
  Calendar,
  Target,
  GraduationCap,
  Clock,
  CheckSquare,
  FileText,
  ClipboardCheck,
  BookOpen,
  Headphones,
  Accessibility,
  LifeBuoy,
  MessageSquare,
  Bell,
  Briefcase,
  UserCheck,
  TrendingUp,
  Building2,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import UdaanLogo from '../common/UdaanLogo';
import Avatar from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { getRoleLabel } from '../../utils/helpers';

const ROLE_MENUS = {
  student: [
    {
      group: 'Overview',
      items: [
        { label: 'Dashboard', to: '/student/dashboard', icon: LayoutDashboard },
        { label: 'My Profile', to: '/student/profile', icon: UserCircle },
      ],
    },
    {
      group: 'Mentorship',
      items: [
        { label: 'Find a Mentor', to: '/student/mentors', icon: Search },
        { label: 'Mentor Matching', to: '/student/matching', icon: Sparkles },
        { label: 'My Mentorship', to: '/student/mentorship', icon: Users },
        { label: 'Sessions', to: '/student/sessions', icon: Calendar },
        { label: 'Learning Plans', to: '/student/learning-plan', icon: Target },
      ],
    },
    {
      group: 'Academics & Assistive',
      items: [
        { label: 'Academic Dashboard', to: '/student/academics', icon: GraduationCap },
        { label: 'Timetable', to: '/student/timetable', icon: Clock },
        { label: 'Attendance', to: '/student/attendance', icon: CheckSquare },
        { label: 'Assignments', to: '/student/assignments', icon: FileText },
        { label: 'Examinations', to: '/student/examinations', icon: ClipboardCheck },
        { label: 'Study Materials', to: '/student/materials', icon: BookOpen },
        { label: 'Assistive Learning Hub', to: '/student/assistive-hub', icon: Headphones },
        { label: 'Accessibility Settings', to: '/student/accessibility', icon: Accessibility },
      ],
    },
    {
      group: 'Support & Career',
      items: [
        { label: 'Support Requests', to: '/student/support', icon: LifeBuoy },
        { label: 'Messages', to: '/student/messages', icon: MessageSquare },
        { label: 'Notifications', to: '/student/notifications', icon: Bell },
        { label: 'Career Development', to: '/student/career', icon: Briefcase },
      ],
    },
  ],
  mentor: [
    {
      group: 'Mentor Workspace',
      items: [
        { label: 'Mentor Dashboard', to: '/mentor/dashboard', icon: LayoutDashboard },
        { label: 'My Students', to: '/mentor/students', icon: Users },
        { label: 'Mentorship Requests', to: '/mentor/requests', icon: UserCheck },
        { label: 'Session Management', to: '/mentor/sessions', icon: Calendar },
        { label: 'Student Progress', to: '/mentor/progress', icon: TrendingUp },
        { label: 'Learning Plan Manager', to: '/mentor/learning-plans', icon: Target },
      ],
    },
    {
      group: 'Communication & Tools',
      items: [
        { label: 'Messages', to: '/mentor/messages', icon: MessageSquare },
        { label: 'Notifications', to: '/mentor/notifications', icon: Bell },
        { label: 'Assistive Learning Hub', to: '/mentor/assistive-hub', icon: Headphones },
        { label: 'Accessibility Settings', to: '/mentor/accessibility', icon: Accessibility },
      ],
    },
  ],
  faculty: [
    {
      group: 'Faculty Workspace',
      items: [
        { label: 'Faculty Dashboard', to: '/faculty/dashboard', icon: LayoutDashboard },
        { label: 'Courses & Students', to: '/faculty/courses', icon: Users },
        { label: 'Accessible Materials', to: '/faculty/materials', icon: BookOpen },
        { label: 'Exam Accommodations', to: '/faculty/examinations', icon: ClipboardCheck },
      ],
    },
    {
      group: 'Communication & Tools',
      items: [
        { label: 'Messages', to: '/faculty/messages', icon: MessageSquare },
        { label: 'Notifications', to: '/faculty/notifications', icon: Bell },
        { label: 'Accessibility Settings', to: '/faculty/accessibility', icon: Accessibility },
      ],
    },
  ],
  support: [
    {
      group: 'Inclusion & Support Cell',
      items: [
        { label: 'Support Dashboard', to: '/support/dashboard', icon: LayoutDashboard },
        { label: 'Support Requests', to: '/support/requests', icon: LifeBuoy },
      ],
    },
    {
      group: 'Communication & Tools',
      items: [
        { label: 'Messages', to: '/support/messages', icon: MessageSquare },
        { label: 'Notifications', to: '/support/notifications', icon: Bell },
        { label: 'Accessibility Settings', to: '/support/accessibility', icon: Accessibility },
      ],
    },
  ],
  admin: [
    {
      group: 'Administration',
      items: [
        { label: 'Admin Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Student Management', to: '/admin/students', icon: GraduationCap },
        { label: 'Mentor Management', to: '/admin/mentors', icon: Users },
        { label: 'Faculty Management', to: '/admin/faculty', icon: UserCheck },
        { label: 'Departments', to: '/admin/departments', icon: Building2 },
        { label: 'Analytics & Reports', to: '/admin/reports', icon: BarChart3 },
        { label: 'Platform Settings', to: '/admin/settings', icon: Settings },
      ],
    },
    {
      group: 'Communication & Tools',
      items: [
        { label: 'Messages', to: '/admin/messages', icon: MessageSquare },
        { label: 'Notifications', to: '/admin/notifications', icon: Bell },
        { label: 'Accessibility Settings', to: '/admin/accessibility', icon: Accessibility },
      ],
    },
  ],
};

export default function DashboardLayout() {
  const { currentUser, logout } = useAuth();
  const { notifications, conversations } = useAppData();
  const { setToolbarOpen } = useAccessibility();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const role = currentUser?.role || 'student';
  const menuGroups = ROLE_MENUS[role] || ROLE_MENUS.student;

  const unreadNotifs = notifications.filter((n) => !n.read).length;
  const unreadMessages = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shrink-0">
        <UdaanLogo to="/" size="sm" />
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
          <Avatar name={currentUser?.name || 'UDAAN User'} color={currentUser?.avatarColor} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {currentUser?.name}
            </p>
            <p className="text-[11px] font-medium text-royal-600 dark:text-royal-400 truncate">
              {getRoleLabel(role)}
            </p>
          </div>
        </div>
      </div>

      <nav aria-label={`${getRoleLabel(role)} sidebar navigation`} className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {menuGroups.map((group) => (
          <div key={group.group}>
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              {group.group}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const badgeCount =
                  item.label === 'Notifications'
                    ? unreadNotifs
                    : item.label === 'Messages'
                    ? unreadMessages
                    : 0;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-royal-600 text-white shadow-sm font-semibold'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                        }`
                      }
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span className="truncate">{item.label}</span>
                      </span>
                      {badgeCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-400 text-navy-950">
                          {badgeCount}
                        </span>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5 shrink-0">
        <Link
          to="/login"
          onClick={() => setSidebarOpen(false)}
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <span>Switch Demo Role</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-68 xl:w-72 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-navy-950/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-white dark:bg-slate-900 h-full shadow-elevated z-10">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation sidebar"
              className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-royal-50 dark:bg-royal-950/60 text-royal-700 dark:text-royal-300 border border-royal-200 dark:border-royal-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
              <span>UDAAN Frontend Demo · {getRoleLabel(role)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setToolbarOpen(true)}
              className="btn-ghost text-xs border border-slate-200 dark:border-slate-700"
              aria-label="Open Accessibility Toolbar"
            >
              <Accessibility className="w-4 h-4 text-royal-600 dark:text-royal-400" />
              <span className="hidden md:inline">Accessibility</span>
            </button>

            <Link
              to={`/${role}/messages`}
              aria-label={`Messages, ${unreadMessages} unread`}
              className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <MessageSquare className="w-5 h-5" />
              {unreadMessages > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-royal-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadMessages}
                </span>
              )}
            </Link>

            <Link
              to={`/${role}/notifications`}
              aria-label={`Notifications, ${unreadNotifs} unread`}
              className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-500 text-navy-950 text-[10px] font-bold flex items-center justify-center">
                  {unreadNotifs}
                </span>
              )}
            </Link>
          </div>
        </header>

        <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
