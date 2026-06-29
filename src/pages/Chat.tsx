import { useState, useRef, useEffect } from 'react';
import { supabase, type Message } from '../lib/supabase';
import { Send, Bot, User, Loader2, Plus, Trash2, ChevronDown } from 'lucide-react';

const MODELS = [
  { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', provider: 'anthropic' },
  { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku', provider: 'anthropic' },
  { value: 'gpt-4o', label: 'GPT-4o', provider: 'openai' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'openai' },
];

const DEMO_RESPONSES: Record<string, string> = {
  default: "I'm a demo response from the AI Agent Framework. To enable real LLM responses, configure your API keys (CLAUDE_API_KEY or OPENAI_API_KEY) and connect the backend service.",
};

function getDemoResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('مرحبا') || lower.includes('هلو'))
    return "Hello! I'm the AI Agent Framework assistant. How can I help you today?";
  if (lower.includes('template') || lower.includes('prompt'))
    return "The framework supports prompt templates with variable substitution. Check the Templates page to browse and manage your templates!";
  if (lower.includes('model') || lower.includes('claude') || lower.includes('openai') || lower.includes('gpt'))
    return "This framework supports multiple LLM providers including Anthropic Claude (claude-3-5-sonnet, claude-3-haiku) and OpenAI GPT (gpt-4o, gpt-4o-mini) via a factory pattern.";
  if (lower.includes('token') || lower.includes('cost') || lower.includes('usage'))
    return "The framework includes a token counter and cost tracker. Check the Usage Stats page to see your historical usage and costs across different models.";
  return DEMO_RESPONSES.default;
}

const SESSION_USER_ID = 'demo-user-' + Math.random().toString(36).slice(2, 8);

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(MODELS[0].value);
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectedModelObj = MODELS.find((m) => m.value === selectedModel) ?? MODELS[0];

  async function saveConversation(msgs: Message[]) {
    const data = {
      user_id: SESSION_USER_ID,
      messages: msgs,
      metadata: { model: selectedModel, session: 'web-ui' },
    };

    if (conversationId) {
      await supabase
        .from('conversation_history')
        .update({ messages: msgs, updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    } else {
      const result = await supabase
        .from('conversation_history')
        .insert(data)
        .select('id')
        .single();
      if (result.data) setConversationId(result.data.id);
    }
  }

  async function logUsage(tokensEstimate: number) {
    const costPerToken = selectedModelObj.provider === 'anthropic' ? 0.000003 : 0.000002;
    await supabase.from('api_usage').insert({
      user_id: SESSION_USER_ID,
      model: selectedModel,
      tokens_used: tokensEstimate,
      cost: tokensEstimate * costPerToken,
    });
  }

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const userMsg: Message = {
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setSending(true);

    // Simulate latency
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 800));

    const responseText = getDemoResponse(trimmed);
    const assistantMsg: Message = {
      role: 'assistant',
      content: responseText,
      timestamp: new Date().toISOString(),
    };

    const finalMessages = [...newMessages, assistantMsg];
    setMessages(finalMessages);
    setSending(false);

    const tokenEstimate = Math.ceil((trimmed.length + responseText.length) / 4);
    await Promise.all([saveConversation(finalMessages), logUsage(tokenEstimate)]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function startNewChat() {
    setMessages([]);
    setConversationId(null);
    setInput('');
    inputRef.current?.focus();
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/50">
        <div>
          <h1 className="text-base font-semibold text-white">Chat</h1>
          <p className="text-xs text-gray-500">
            {messages.length === 0 ? 'Start a new conversation' : `${messages.length} messages`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Model picker */}
          <div className="relative">
            <button
              onClick={() => setShowModelPicker((v) => !v)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm text-gray-300 transition-colors"
            >
              <span className="text-xs text-gray-500">
                {selectedModelObj.provider === 'anthropic' ? '🟠' : '🟢'}
              </span>
              <span className="max-w-[120px] truncate">{selectedModelObj.label}</span>
              <ChevronDown size={13} />
            </button>
            {showModelPicker && (
              <div className="absolute right-0 top-full mt-1 w-56 card shadow-xl z-10 py-1">
                {MODELS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => { setSelectedModel(m.value); setShowModelPicker(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-800 transition-colors ${selectedModel === m.value ? 'text-blue-400' : 'text-gray-300'}`}
                  >
                    <span className="mr-2">{m.provider === 'anthropic' ? '🟠' : '🟢'}</span>
                    {m.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {messages.length > 0 && (
            <button onClick={startNewChat} className="btn-secondary flex items-center gap-1.5 text-sm py-1.5">
              <Plus size={14} />
              New
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-600/30 flex items-center justify-center mb-4">
              <Bot size={26} className="text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-300 mb-2">Start a conversation</h2>
            <p className="text-sm text-gray-600 max-w-sm mb-6">
              Ask anything — the framework handles prompt engineering, rate limiting, caching, and usage tracking automatically.
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {[
                'What models are supported?',
                'How do prompt templates work?',
                'Explain token tracking',
                'Hello!',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => { setInput(suggestion); inputRef.current?.focus(); }}
                  className="px-3 py-1.5 rounded-full text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-600/30 flex items-center justify-center">
                    <Bot size={16} className="text-blue-400" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-bl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.timestamp && (
                    <p className={`text-xs mt-1.5 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-600'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center">
                    <User size={16} className="text-gray-300" />
                  </div>
                )}
              </div>
            ))}
            {sending && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-600/30 flex items-center justify-center">
                  <Bot size={16} className="text-blue-400" />
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <div className="px-6 pb-6 pt-2 border-t border-gray-800 bg-gray-900/30">
        <div className="flex gap-3 items-end">
          {messages.length > 0 && (
            <button
              onClick={startNewChat}
              className="flex-shrink-0 p-2.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-900/20 transition-colors"
              title="Clear conversation"
            >
              <Trash2 size={16} />
            </button>
          )}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
              rows={1}
              style={{ resize: 'none', minHeight: '44px', maxHeight: '180px' }}
              className="input pr-12 py-3 font-sans text-sm leading-relaxed overflow-y-auto"
              disabled={sending}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = 'auto';
                t.style.height = `${Math.min(t.scrollHeight, 180)}px`;
              }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="flex-shrink-0 w-11 h-11 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            {sending ? (
              <Loader2 size={17} className="text-white animate-spin" />
            ) : (
              <Send size={17} className="text-white" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-700 mt-2 text-center">
          Demo mode — configure API keys to enable real LLM responses
        </p>
      </div>
    </div>
  );
}
