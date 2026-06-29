import { useEffect, useState } from 'react';
import { supabase, type ConversationHistory, type Message } from '../lib/supabase';
import { MessageSquare, ChevronDown, ChevronRight, Trash2, Clock, RefreshCw } from 'lucide-react';

export default function History() {
  const [conversations, setConversations] = useState<ConversationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function fetchConversations() {
    setLoading(true);
    const { data } = await supabase
      .from('conversation_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    setConversations((data ?? []) as ConversationHistory[]);
    setLoading(false);
  }

  useEffect(() => { fetchConversations(); }, []);

  async function deleteConversation(id: string) {
    setDeleting(id);
    await supabase.from('conversation_history').delete().eq('id', id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (expanded === id) setExpanded(null);
    setDeleting(null);
  }

  function getPreview(messages: Message[]): string {
    const first = messages.find((m) => m.role === 'user');
    if (!first) return 'Empty conversation';
    return first.content.length > 80 ? first.content.slice(0, 80) + '…' : first.content;
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 1) return `${Math.round(diffMs / 60000)}m ago`;
    if (diffHours < 24) return `${Math.round(diffHours)}h ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  const userCount = (msgs: Message[]) => msgs.filter((m) => m.role === 'user').length;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Conversation History</h1>
          <p className="text-gray-500 text-sm">
            {loading ? 'Loading…' : `${conversations.length} conversations stored`}
          </p>
        </div>
        <button onClick={fetchConversations} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card h-20 animate-pulse bg-gray-900" />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="card p-12 text-center">
          <MessageSquare size={36} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No conversations yet</p>
          <p className="text-gray-700 text-sm mt-1">Start chatting to see your history here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <div key={conv.id} className="card overflow-hidden">
              <div
                className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-gray-800/50 transition-colors"
                onClick={() => setExpanded(expanded === conv.id ? null : conv.id)}
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-blue-900/30 border border-blue-800/40 flex items-center justify-center">
                  <MessageSquare size={16} className="text-blue-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 truncate font-medium">{getPreview(conv.messages)}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-gray-600 flex items-center gap-1">
                      <Clock size={10} />
                      {formatDate(conv.created_at)}
                    </span>
                    <span className="badge-gray text-xs">{userCount(conv.messages)} exchanges</span>
                    {(conv.metadata as Record<string, string>)?.model && (
                      <span className="badge-blue text-xs font-mono">
                        {String((conv.metadata as Record<string, string>).model).split('-')[0]}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                    disabled={deleting === conv.id}
                    className="p-1.5 rounded text-gray-700 hover:text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                  </button>
                  {expanded === conv.id ? (
                    <ChevronDown size={15} className="text-gray-500" />
                  ) : (
                    <ChevronRight size={15} className="text-gray-500" />
                  )}
                </div>
              </div>

              {expanded === conv.id && (
                <div className="border-t border-gray-800 px-4 py-4 space-y-3 bg-gray-950/30">
                  {conv.messages.length === 0 ? (
                    <p className="text-xs text-gray-600 text-center py-2">No messages</p>
                  ) : (
                    conv.messages.map((msg, i) => (
                      <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        <div
                          className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-blue-600/20 text-blue-200 border border-blue-700/30'
                              : msg.role === 'assistant'
                              ? 'bg-gray-800 text-gray-300 border border-gray-700'
                              : 'bg-yellow-900/20 text-yellow-300 border border-yellow-700/30'
                          }`}
                        >
                          <p className="text-[10px] font-semibold uppercase tracking-wider mb-1 opacity-60">
                            {msg.role}
                          </p>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
