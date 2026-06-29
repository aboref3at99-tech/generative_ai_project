import { useEffect, useState } from 'react';
import { supabase, type ApiUsage } from '../lib/supabase';
import {
  MessageSquare,
  Zap,
  DollarSign,
  TrendingUp,
  Bot,
  Clock,
  Database,
  Shield,
} from 'lucide-react';

type Stats = {
  totalConversations: number;
  totalTokens: number;
  totalCost: number;
  totalRequests: number;
  recentModels: { model: string; count: number }[];
};

const features = [
  { icon: Bot, title: 'Multi-Provider LLM', desc: 'Claude and OpenAI support with factory pattern', color: 'text-blue-400', bg: 'bg-blue-900/20 border-blue-800/40' },
  { icon: Zap, title: 'Prompt Engineering', desc: 'Templates, few-shot learning, and chaining', color: 'text-yellow-400', bg: 'bg-yellow-900/20 border-yellow-800/40' },
  { icon: Clock, title: 'Rate Limiting', desc: 'Configurable requests/min with retry backoff', color: 'text-green-400', bg: 'bg-green-900/20 border-green-800/40' },
  { icon: Database, title: 'Response Cache', desc: '24-hour TTL caching for faster responses', color: 'text-purple-400', bg: 'bg-purple-900/20 border-purple-800/40' },
  { icon: TrendingUp, title: 'Token Tracking', desc: 'Real-time usage and cost monitoring', color: 'text-orange-400', bg: 'bg-orange-900/20 border-orange-800/40' },
  { icon: Shield, title: 'Row-Level Security', desc: 'Supabase RLS on all data tables', color: 'text-cyan-400', bg: 'bg-cyan-900/20 border-cyan-800/40' },
];

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalConversations: 0,
    totalTokens: 0,
    totalCost: 0,
    totalRequests: 0,
    recentModels: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const [convResult, usageResult] = await Promise.all([
        supabase.from('conversation_history').select('id', { count: 'exact', head: true }),
        supabase.from('api_usage').select('*'),
      ]);

      const usage = (usageResult.data ?? []) as ApiUsage[];
      const totalTokens = usage.reduce((sum, u) => sum + u.tokens_used, 0);
      const totalCost = usage.reduce((sum, u) => sum + Number(u.cost), 0);

      const modelCounts: Record<string, number> = {};
      usage.forEach((u) => {
        modelCounts[u.model] = (modelCounts[u.model] ?? 0) + 1;
      });
      const recentModels = Object.entries(modelCounts)
        .map(([model, count]) => ({ model, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      setStats({
        totalConversations: convResult.count ?? 0,
        totalTokens,
        totalCost,
        totalRequests: usage.length,
        recentModels,
      });
      setLoading(false);
    }

    fetchStats();
  }, []);

  const statCards = [
    {
      label: 'Conversations',
      value: stats.totalConversations.toLocaleString(),
      icon: MessageSquare,
      color: 'text-blue-400',
      bg: 'bg-blue-900/20',
      border: 'border-blue-800/40',
    },
    {
      label: 'Total Requests',
      value: stats.totalRequests.toLocaleString(),
      icon: Zap,
      color: 'text-yellow-400',
      bg: 'bg-yellow-900/20',
      border: 'border-yellow-800/40',
    },
    {
      label: 'Tokens Used',
      value: stats.totalTokens >= 1000
        ? `${(stats.totalTokens / 1000).toFixed(1)}K`
        : stats.totalTokens.toLocaleString(),
      icon: TrendingUp,
      color: 'text-green-400',
      bg: 'bg-green-900/20',
      border: 'border-green-800/40',
    },
    {
      label: 'Total Cost',
      value: `$${stats.totalCost.toFixed(4)}`,
      icon: DollarSign,
      color: 'text-orange-400',
      bg: 'bg-orange-900/20',
      border: 'border-orange-800/40',
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
        <p className="text-gray-500 text-sm">AI Agent Framework overview and statistics</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={`card p-5 ${bg} ${border}`}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
              <Icon size={16} className={color} />
            </div>
            {loading ? (
              <div className="h-7 w-16 bg-gray-800 rounded animate-pulse" />
            ) : (
              <p className="text-2xl font-bold text-white">{value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Model breakdown */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Models Used</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 bg-gray-800 rounded animate-pulse" />
              ))}
            </div>
          ) : stats.recentModels.length === 0 ? (
            <p className="text-sm text-gray-600 text-center py-6">No usage recorded yet</p>
          ) : (
            <div className="space-y-3">
              {stats.recentModels.map(({ model, count }) => (
                <div key={model} className="flex items-center justify-between">
                  <span className="text-sm text-gray-400 font-mono truncate">{model}</span>
                  <span className="badge-blue ml-2 shrink-0">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick start */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Quick Start</h2>
          <div className="space-y-3">
            {[
              { step: '1', text: 'Navigate to Chat to start a conversation with an AI model' },
              { step: '2', text: 'Browse Templates to find and customize prompt templates' },
              { step: '3', text: 'View History to revisit past conversations' },
              { step: '4', text: 'Check Usage Stats to monitor tokens and costs' },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600/20 border border-blue-600/30 text-blue-400 text-xs flex items-center justify-center font-semibold">
                  {step}
                </span>
                <p className="text-sm text-gray-400 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature grid */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Framework Features</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, desc, color, bg }) => (
            <div key={title} className={`card p-4 ${bg} border`}>
              <div className="flex items-center gap-3 mb-2">
                <Icon size={17} className={color} />
                <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
