import React from 'react';
import { Cloud, User, LogOut, CheckCircle2 } from 'lucide-react';
import { UserSession } from '../types';

interface HeaderProps {
  currentTab: 'drive' | 'wiki' | 'code' | 'github';
  setCurrentTab: (tab: 'drive' | 'wiki' | 'code' | 'github') => void;
  session: UserSession;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  session,
  onLogout,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
          <Cloud className="w-5 h-5" />
        </div>
        <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
          Cloud Studio Pro
        </span>
      </div>

      {/* Zone 2: 4 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
        <button
          onClick={() => setCurrentTab('drive')}
          className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            currentTab === 'drive'
              ? 'text-indigo-400 font-semibold border-b-2 border-indigo-500'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Meu Drive
        </button>
        <button
          onClick={() => setCurrentTab('wiki')}
          className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            currentTab === 'wiki'
              ? 'text-indigo-400 font-semibold border-b-2 border-indigo-500'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Wiki Assistant Pro
        </button>
        <button
          onClick={() => setCurrentTab('code')}
          className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            currentTab === 'code'
              ? 'text-indigo-400 font-semibold border-b-2 border-indigo-500'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Código Python Corrigido
        </button>
        <button
          onClick={() => setCurrentTab('github')}
          className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            currentTab === 'github'
              ? 'text-indigo-400 font-semibold border-b-2 border-indigo-500'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Enviar para GitHub
        </button>
      </nav>

      {/* Zone 3: 1 primary action / user state */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
          <User className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-medium truncate max-w-[120px]">{session.username}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Online" />
        </div>
        <button
          onClick={onLogout}
          className="px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-rose-400 bg-neutral-900 hover:bg-rose-500/10 border border-neutral-800 hover:border-rose-500/30 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
          title="Encerrar sessão ou trocar usuário"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  );
};
