import React, { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquareCode,
  Search,
  Layers,
  Menu,
  X,
  Compass,
  Image
} from "lucide-react";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard, index: "01" },
    { name: "NL Query", path: "/nl-query", icon: MessageSquareCode, index: "02" },
    { name: "Product Search", path: "/search", icon: Search, index: "03" },
    { name: "Finished Goods", path: "/finished-goods", icon: Layers, index: "04" },
    { name: "Image Search", path: "/image-search", icon: Image, index: "05" },
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const currentTitle = navItems.find((item) => item.path === location.pathname)?.name || "Explorer";

  return (
    <div className="min-h-screen flex text-stone-100 font-sans">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 md:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-[#0a0e1a]/95 backdrop-blur-xl border-r border-white/5 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative p-2 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20">
              <Compass className="h-4 w-4 text-stone-950" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[10px] font-bold tracking-[0.25em] text-amber-400 uppercase">
                WFX
              </span>
              <span className="text-base font-display font-semibold text-stone-100 tracking-tight mt-0.5">
                Explorer
              </span>
            </div>
          </Link>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-white/5 md:hidden text-stone-400 hover:text-stone-100 transition-all"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Section label */}
        <div className="px-6 pt-7 pb-2">
          <span className="text-eyebrow-muted">Navigation</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`relative flex items-center gap-4 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 group overflow-hidden ${
                  isActive
                    ? "bg-amber-500/[0.06] text-amber-300"
                    : "text-stone-400 hover:text-stone-100 hover:bg-white/[0.03]"
                }`}
              >
                {/* Gold left bar for active item */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-[3px] bg-amber-400 rounded-r-full shadow-[0_0_12px_rgba(245,184,0,0.6)]" />
                )}

                <Icon
                  className={`h-[18px] w-[18px] shrink-0 transition-all duration-300 ${
                    isActive
                      ? "text-amber-400"
                      : "text-stone-500 group-hover:text-stone-300"
                  }`}
                  strokeWidth={isActive ? 2.4 : 2}
                />
                <span className="flex-1 tracking-wide">{item.name}</span>
                <span
                  className={`text-[10px] font-mono font-semibold tracking-wider ${
                    isActive ? "text-amber-400/70" : "text-stone-600"
                  }`}
                >
                  {item.index}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-5 border-t border-white/5">
          <div className="inner-panel p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-eyebrow-muted">System</span>
              <span className="chip-status-live">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
            <div className="text-[11px] text-stone-500 font-medium">
              WFX Core v1.0.0
            </div>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-6 md:px-10 bg-[#0a0e1a]/60 backdrop-blur-xl border-b border-white/5 sticky top-0 z-30">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={toggleSidebar}
              className="p-2.5 rounded-lg hover:bg-white/5 md:hidden text-stone-400 hover:text-stone-100 transition-all border border-white/5"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-eyebrow hidden sm:block mb-1">
                Workspace
              </span>
              <h1 className="text-xl md:text-2xl font-display font-semibold text-stone-100 truncate">
                {currentTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span className="text-[10px] font-bold text-stone-400 tracking-[0.18em] uppercase">
                Real-time
              </span>
            </div>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-stone-950 font-display font-semibold text-sm shadow-lg shadow-amber-500/20">
              A
            </div>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-10 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
