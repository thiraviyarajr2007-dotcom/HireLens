import React from 'react';

export default function Sidebar({ currentRoute, onNavigate, mobileOpen, setMobileOpen, user, onSignOut }) {
  const navItems = [
    { label: "Dashboard", route: "/dashboard", icon: "dashboard" },
    { label: "Analyze Resume", route: "/analyze", icon: "psychology" },
    { label: "Bulk Analyze", route: "/bulk-analyze", icon: "cloud_upload" },
    { label: "Candidates", route: "/candidates", icon: "groups" },
    { label: "Rankings", route: "/rankings", icon: "leaderboard" },
    { label: "History", route: "/history", icon: "history" },
    { label: "Settings", route: "/settings", icon: "settings" }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full py-6 text-primary-fixed-dim">
      {/* Brand Header */}
      <div className="px-6 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('/')}>
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-md">
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>lens_blur</span>
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-white leading-none">HireLens</h1>
            <p className="text-[11px] font-label-sm text-primary-fixed-dim mt-1 uppercase tracking-wider">AI Intelligence</p>
          </div>
        </div>
        {mobileOpen && (
          <button 
            className="md:hidden text-white/70 hover:text-white"
            onClick={() => setMobileOpen(false)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <div className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = currentRoute === item.route || (item.route === '/rankings' && currentRoute === '/comparison');
          return (
            <button
              key={item.label + item.route}
              onClick={() => {
                onNavigate(item.route);
                if (setMobileOpen) setMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                isActive
                  ? 'border-l-4 border-primary bg-white/10 text-white font-semibold shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className={`material-symbols-outlined ${isActive ? 'text-white' : 'text-white/70'}`}>
                {item.icon}
              </span>
              <span className="font-label-md text-sm">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Quick Action & Footer */}
      <div className="px-6 mt-auto space-y-4">
        <button 
          onClick={() => { onNavigate('/analyze'); if (setMobileOpen) setMobileOpen(false); }}
          className="w-full bg-primary/20 hover:bg-primary/30 text-primary-fixed-dim font-label-md text-sm py-2.5 rounded-lg border border-primary/30 transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span>New Analysis</span>
        </button>

        <div className="pt-4 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between text-white/70">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>
              <span className="text-xs font-semibold text-white truncate">{user?.displayName || user?.email || 'System Online'}</span>
            </div>
            <button 
              onClick={onSignOut}
              className="text-white/60 hover:text-white p-1 rounded hover:bg-white/10"
              title="Sign Out"
            >
              <span className="material-symbols-outlined text-base">logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:block w-[280px] h-screen fixed left-0 top-0 bg-[#0B1C30] z-50 shadow-xl">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside className={`md:hidden fixed left-0 top-0 h-screen w-[280px] bg-[#0B1C30] z-50 transition-transform duration-300 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {sidebarContent}
      </aside>
    </>
  );
}
