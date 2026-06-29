import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, History, ChartBar as BarChart3, FileText, Bot, Zap } from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/chat', icon: MessageSquare, label: 'Chat' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/usage', icon: BarChart3, label: 'Usage Stats' },
  { to: '/templates', icon: FileText, label: 'Templates' },
];

export default function Sidebar() {
  return (
    <aside className="w-60 flex flex-col bg-gray-900 border-r border-gray-800 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-800">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600">
          <Bot size={20} className="text-white" />
        </div>
        <div>
          <p className="font-semibold text-sm text-white leading-tight">AI Agent</p>
          <p className="text-xs text-gray-500 leading-tight">Framework</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-600/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-800">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Zap size={12} className="text-yellow-500" />
          <span>Production Ready</span>
        </div>
        <p className="text-xs text-gray-700 mt-1">v1.0.0 · Claude + OpenAI</p>
      </div>
    </aside>
  );
}
