import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ConversationHistory = {
  id: string;
  user_id: string;
  messages: Message[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
};

export type ApiUsage = {
  id: string;
  user_id: string;
  model: string;
  tokens_used: number;
  cost: number;
  created_at: string;
};

export type PromptTemplate = {
  id: string;
  name: string;
  description: string | null;
  template: string;
  variables: string[];
  category: string;
  created_at: string;
  updated_at: string;
};
