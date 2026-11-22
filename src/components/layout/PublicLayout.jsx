import React, { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Menu, X, Accessibility, ArrowRight, ShieldCheck } from 'lucide-react';
import UdaanLogo from '../common/UdaanLogo';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { getRoleDashboardPath } from '../../utils/helpers';

export default function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentUser } = useAuth();
  const { setToolbarOpen } = useAccessibility();

  const navItems = [
    { label: 'Home', to: '/' },
    { label: 'About UDAAN', to: '/about' },
    { label: 'How It Works', to: '/how-it-works' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <UdaanLogo to="/" showTagline />

          <nav aria-label="Public navigation" className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-royal-50 text-royal-700 dark:bg-royal-950/60 dark:text-royal-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setToolbarOpen(true)}
              className="btn-ghost text-xs border border-slate-200 dark:border-slate-700"
            >
              <Accessibility className="w-4 h-4 text-royal-600 dark:text-royal-400" />
              Accessibility
            </button>
            {currentUser ? (
              <Link to={getRoleDashboardPath(currentUser.role)} className="btn-primary">
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">
                  Login
                </Link>
                <Link to="/register" className="btn-primary">
                  Get Started <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="md:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                    isActive
                      ? 'bg-royal-50 text-royal-700 dark:bg-royal-950/60 dark:text-royal-300'
                      : 'text-slate-700 dark:text-slate-200'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              {currentUser ? (
                <Link
                  to={getRoleDashboardPath(currentUser.role)}
                  onClick={() => setMobileOpen(false)}
                  className="btn-primary w-full"
                >
                  Open Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-secondary w-full">
                    Login
                  </Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-primary w-full">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-navy-950 text-slate-300 border-t border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <UdaanLogo to="/" showTagline light />
              <p className="text-sm text-slate-400 mt-4 max-w-md">
                UDAAN – Student Mentorship Platform For Specially Abled Students. Empowering Abilities. Enabling Futures through personalized mentorship, assistive learning tools, and inclusive academic coordination.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 text-xs text-amber-300 bg-navy-900/90 border border-navy-700 px-3 py-1.5 rounded-full">
                <ShieldCheck className="w-4 h-4" />
                Frontend Demo Application · LocalStorage Simulated Data
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white mb-3">Platform</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="hover:text-white">Home</Link></li>
                <li><Link to="/about" className="hover:text-white">About UDAAN</Link></li>
                <li><Link to="/how-it-works" className="hover:text-white">How Mentorship Works</Link></li>
                <li><Link to="/login" className="hover:text-white">Demo Login</Link></li>
                <li><Link to="/register" className="hover:text-white">Student & Mentor Sign Up</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white mb-3">Accessibility & Roles</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/login?role=student" className="hover:text-white">Student Portal</Link></li>
                <li><Link to="/login?role=mentor" className="hover:text-white">Mentor Portal</Link></li>
                <li><Link to="/login?role=faculty" className="hover:text-white">Faculty Portal</Link></li>
                <li><Link to="/login?role=support" className="hover:text-white">Support Coordinator</Link></li>
                <li><Link to="/login?role=admin" className="hover:text-white">College Administrator</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-navy-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>© {new Date().getFullYear()} UDAAN – Student Mentorship Platform For Specially Abled Students.</p>
            <p>Designed with WCAG 2.2 AA accessibility principles.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
