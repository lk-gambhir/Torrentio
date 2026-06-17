import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Home, Library, Settings as SettingsIcon, Zap, Menu, X } from 'lucide-react';

const NAV = [
  { path: '/', label: 'Dashboard', Icon: Home },
  { path: '/library', label: 'Library', Icon: Library },
  { path: '/settings', label: 'Settings', Icon: SettingsIcon },
];

export default function Layout() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-paper text-pencil font-hand relative overflow-hidden">

      {/* ── Mobile top bar ── */}
      <div className="flex items-center justify-between md:hidden px-6 py-4 bg-white border-b-[3px] border-dashed border-pencil">
        <h1 className="font-kalam text-3xl font-bold flex items-center gap-2">
          <Zap className="w-7 h-7 text-marker" strokeWidth={3} /> Torrentino
        </h1>
        <button onClick={() => setOpen(!open)} className="p-2">
          {open ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </button>
      </div>

      {/* ── Sidebar ── */}
      <aside className={`
        ${open ? 'block' : 'hidden'} md:block
        w-full md:w-64 bg-white border-b-[3px] md:border-b-0 md:border-r-[3px]
        border-dashed border-pencil shrink-0 z-30 md:min-h-screen
      `}>
        <div className="p-6 md:p-8">
          {/* Desktop logo */}
          <div className="hidden md:block mb-10 text-center relative">
            <h1 className="text-5xl font-kalam font-bold inline-block rotate-[-3deg] relative">
              <Zap className="w-8 h-8 text-marker inline -mt-2 mr-1" strokeWidth={3} />
              Torrentino
              <svg className="absolute -bottom-2 -left-2 w-full h-3 opacity-80" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path d="M0,10 Q50,20 100,5" stroke="#ff4d4d" fill="none" strokeWidth="3" />
              </svg>
            </h1>
          </div>

          <nav className="space-y-3">
            {NAV.map(({ path, label, Icon }) => {
              const active = pathname === path || (path !== '/' && pathname.startsWith(path));
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-xl transition-all duration-100 ${
                    active
                      ? 'bg-marker text-white shadow-hard-sm translate-x-[2px] rotate-1'
                      : 'hover:bg-erased'
                  }`}
                  style={{ borderRadius: 'var(--wobble-sm)' }}
                >
                  <Icon className="w-6 h-6 shrink-0" strokeWidth={active ? 3 : 2} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto md:h-screen relative z-10">
        <div className="max-w-5xl mx-auto pb-20">
          <Outlet />
        </div>
      </main>

      {/* Decorative background circle */}
      <div className="hidden md:block fixed bottom-10 right-10 opacity-10 pointer-events-none -z-10 rotate-12">
        <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
          <path d="M100 20C150 20 180 50 180 100C180 150 150 180 100 180C50 180 20 150 20 100C20 50 50 20 100 20" stroke="#2d2d2d" strokeWidth="4" strokeDasharray="10 10" />
        </svg>
      </div>
    </div>
  );
}
