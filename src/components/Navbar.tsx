import React, { useState } from 'react';
import { History, Leaf, Layers, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenHistory: () => void;
  onReset: () => void;
  activeRunTitle?: string;
  isProcessing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenHistory,
  onReset,
  activeRunTitle,
  isProcessing
}) => {
  const { currentUser, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const getDisplayName = () => {
    if (!currentUser) return null;
    if (currentUser.isAnonymous) return 'Guest Engineer';
    if (currentUser.displayName) return currentUser.displayName;
    if (currentUser.email) return currentUser.email.split('@')[0];
    return 'Engineer';
  };

  const getInitial = () => {
    const name = getDisplayName();
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0B1220]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={onReset}>
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#0B1220]">
              <Leaf className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-xl font-bold tracking-tight text-white">
                CircuDesign
              </span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                Multi-Agent AI
              </span>
            </div>
          </div>
        </div>

        {/* SDG Badges & Active Status */}
        <div className="hidden md:flex items-center gap-2">
          {activeRunTitle && currentUser && (
            <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 border border-white/10 text-xs text-slate-300">
              <Layers className="h-3.5 w-3.5 text-cyan-400" />
              <span className="max-w-[180px] truncate font-medium">{activeRunTitle}</span>
              {isProcessing && (
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </div>
          )}
        </div>

        {/* User Auth & Actions */}
        <div className="flex items-center gap-3">
          {currentUser && (
            <button
              onClick={onOpenHistory}
              className="glass-button flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 hover:text-white"
              title="View Saved Optimization Runs"
            >
              <History className="h-4 w-4 text-cyan-400" />
              <span className="hidden sm:inline">Runs History</span>
            </button>
          )}

          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10 transition"
              >
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="Avatar" className="h-5 w-5 rounded-full object-cover" />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                    {getInitial()}
                  </div>
                )}
                <span className="max-w-[110px] truncate font-medium hidden sm:inline">
                  {getDisplayName()}
                </span>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-white/10 bg-[#0F172A] p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-white/5">
                    <p className="text-xs font-semibold text-white truncate">{getDisplayName()}</p>
                    <p className="text-[10px] text-slate-400 truncate">{currentUser.email || (currentUser.isAnonymous ? 'Guest Account' : '')}</p>
                  </div>
                  <button
                    onClick={async () => {
                      setShowDropdown(false);
                      await logout();
                      onReset();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-xl transition mt-1"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <UserIcon className="h-3.5 w-3.5 text-emerald-400" />
              <span>Secure Portal</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
