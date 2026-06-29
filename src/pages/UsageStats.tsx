import { useEffect, useState } from 'react';
import { supabase, type ApiUsage } from '../lib/supabase';
import { Zap, DollarSign, TrendingUp, BarChart3, RefreshCw, Calendar } from 'lucide-react';

type ModelStat = {
  model: string;
  requests: number;
  tokens: number;
  cost: number;
};

export default function UsageStats() {
  const [usage, setUsage] = useState<ApiUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');

  async function fetchUsage() {
    setLoading(true);
    let query = supabase.from('api_usage').select('*').order('created_at', { ascending: false });

    if (timeRange !== 'all') {
      const days = timeRange === '7d' ? 7 : 30;
      const since = new Date();
      since.setDate(since.getDate() - days);
      query = query.gte('created_at', since.toISOString());
    }

    const { data } = await query.limit(500);
    setUsage((data ?? []) as ApiUsage[]);
    setLoading(false);
  }

  useEffect(() => { fetchUsage(); }, [timeRange]);

  const totalTokens = usage.reduce((s, u) => s + u.tokens_used, 0);
  const totalCost = usage.reduce((s, u) => s + Number(u.cost), 0);
  const totalRequests = usage.length;
  const avgTokensPerRequest = totalRequests > 0 ? Math.round(totalTokens / totalRequests) : 0;

  const modelStats: ModelStat[] = Object.values(
    usage.reduce<Record<string, ModelStat>>((acc, u) => {
      if (!acc[u.model]) acc[u.model] = { model: u.model, requests: 0, tokens: 0, cost: 0 };
      acc[u.model].requests += 1;
      acc[u.model].tokens += u.tokens_used;
      acc[u.model].cost += Number(u.cost);
      return acc;
    }, {})
  ).sort((a, b) => b.requests - a.requests);

  // Group by day for simple chart
  const dailyData = usage.reduce<Record<string, { tokens: number; requests: number }>>((acc, u) => {
    const day = u.created_at.slice(0, 10);
    if (!acc[day]) acc[day] = { tokens: 0, requests: 0 };
    acc[day].tokens += u.tokens_used;
    acc[day].requests += 1;
    return acc;
  }, {});

  const sortedDays = Object.entries(dailyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14);

  const maxTokensDay = Math.max(...sortedDays.map(([, v]) => v.tokens), 1);

  const statCards = [
    { label: 'Total Requests', value: totalRequests.toLocaleString(), icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-800/40' },
    { label: 'Tokens Used', value: totalTokens >= 1000 ? `${(totalTokens / 1000).toFixed(1)}K` : totalTokens.toString(), icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-900/20', border: 'border-green-800/40' },
    { label: 'Avg Tokens/Req', value: avgTokensPerRequest.toLocaleString(), icon: BarChart3, color: 'text-blue-400', bg: 'bg-blue-900/20', border: 'border-blue-800/40' },
    { label: 'Total Cost', value: `$${totalCost.toFixed(4)}`, icon: DollarSign, color: 'text-orange-400', bg: 'bg-orange-900/20', border: 'border-orange-800/40' },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Usage Statistics</h1>
          <p className="text-gray-500 text-sm">Token usage and cost tracking across all models</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-700 overflow-hidden">
            {(['7d', '30d', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  timeRange === r ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                {r === 'all' ? 'All time' : r === '7d' ? '7 days' : '30 days'}
              </button>
            ))}
          </div>
          <button onClick={fetchUsage} className="btn-secondary flex items-center gap-1.5 text-sm">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={`card p-5 ${bg} ${border}`}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
              <Icon size={15} className={color} />
            </div>
            {loading ? (
              <div className="h-7 w-16 bg-gray-800 rounded animate-pulse" />
            ) : (
              <p className="text-2xl font-bold text-white">{value}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Daily bar chart */}
        <div className="card p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-300">Daily Token Usage</h2>
            <Calendar size={14} className="text-gray-600" />
          </div>
          {loading ? (
            <div className="h-40 bg-gray-800 rounded animate-pulse" />
          ) : sortedDays.length === 0 ? (
            <div className="h-40 flex items-center justify-center">
              <p className="text-sm text-gray-600">No data for this period</p>
            </div>
          ) : (
            <div className="flex items-end gap-1 h-40">
              {sortedDays.map(([day, { tokens }]) => {
                const pct = Math.max((tokens / maxTokensDay) * 100, 2);
                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div
                      className="w-full bg-blue-600/40 hover:bg-blue-500/60 rounded-sm transition-all"
                      style={{ height: `${pct}%` }}
                    />
                    <span className="text-[9px] text-gray-700 rotate-45 origin-left mt-1 whitespace-nowrap">
                      {day.slice(5)}
                    </span>
                    <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 whitespace-nowrap z-10">
                      {tokens.toLocaleString()} tokens
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Model breakdown */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">By Model</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-800 rounded animate-pulse" />)}
            </div>
          ) : modelStats.length === 0 ? (
            <p className="text-sm text-gray-600 text-center py-8">No data yet</p>
          ) : (
            <div className="space-y-3">
              {modelStats.map((m) => (
                <div key={m.model} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-gray-400 truncate max-w-[140px]">{m.model}</span>
                    <div className="flex items-center gap-2">
                      <span className="badge-gray text-xs">{m.requests} reqs</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(m.requests / totalRequests) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 w-12 text-right">${m.cost.toFixed(4)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent requests table */}
      <div className="card mt-6 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-gray-300">Recent Requests</h2>
        </div>
        {loading ? (
          <div className="p-5 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-8 bg-gray-800 rounded animate-pulse" />)}
          </div>
        ) : usage.length === 0 ? (
          <div className="p-10 text-center">
            <BarChart3 size={32} className="text-gray-700 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">No usage data yet — start chatting!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-600 uppercase tracking-wider">Model</th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-gray-600 uppercase tracking-wider">Tokens</th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-gray-600 uppercase tracking-wider">Cost</th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-gray-600 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {usage.slice(0, 20).map((u) => (
                  <tr key={u.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-2.5 font-mono text-xs text-gray-400">{u.model}</td>
                    <td className="px-5 py-2.5 text-right text-gray-300">{u.tokens_used.toLocaleString()}</td>
                    <td className="px-5 py-2.5 text-right text-gray-400">${Number(u.cost).toFixed(6)}</td>
                    <td className="px-5 py-2.5 text-right text-gray-600 text-xs">
                      {new Date(u.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
