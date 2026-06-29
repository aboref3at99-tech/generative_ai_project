-- conversation_history: stores chat conversations
CREATE TABLE conversation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  messages jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- api_usage: tracks token usage and costs
CREATE TABLE api_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  model text NOT NULL,
  tokens_used integer NOT NULL,
  cost numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- prompt_templates: reusable prompt templates
CREATE TABLE prompt_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  template text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb,
  category text DEFAULT 'general',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE conversation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversation_history (anon + authenticated)
CREATE POLICY "anon_select_conversations" ON conversation_history
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon_insert_conversations" ON conversation_history
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "anon_update_conversations" ON conversation_history
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "anon_delete_conversations" ON conversation_history
  FOR DELETE TO anon, authenticated USING (true);

-- RLS policies for api_usage
CREATE POLICY "anon_select_api_usage" ON api_usage
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon_insert_api_usage" ON api_usage
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "anon_update_api_usage" ON api_usage
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "anon_delete_api_usage" ON api_usage
  FOR DELETE TO anon, authenticated USING (true);

-- RLS policies for prompt_templates
CREATE POLICY "anon_select_templates" ON prompt_templates
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon_insert_templates" ON prompt_templates
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "anon_update_templates" ON prompt_templates
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "anon_delete_templates" ON prompt_templates
  FOR DELETE TO anon, authenticated USING (true);

-- Indexes for performance
CREATE INDEX idx_conversation_history_user_id ON conversation_history(user_id);
CREATE INDEX idx_conversation_history_created_at ON conversation_history(created_at DESC);
CREATE INDEX idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX idx_api_usage_created_at ON api_usage(created_at DESC);
CREATE INDEX idx_prompt_templates_category ON prompt_templates(category);

-- Seed default templates
INSERT INTO prompt_templates (name, description, template, variables, category) VALUES
  ('Code Review', 'Review code for bugs and improvements', 'Review the following code and identify bugs, security issues, and improvement opportunities:

```{language}
{code}
```

Provide specific, actionable feedback.', '["language", "code"]', 'development'),
  ('Summarize Text', 'Summarize long text into key points', 'Summarize the following text in {length} bullet points, focusing on the most important information:

{text}', '["length", "text"]', 'writing'),
  ('Few-Shot Classification', 'Classify text using examples', 'Given these examples:
{examples}

Classify the following text as one of these categories: {categories}

Text: {input}

Category:', '["examples", "categories", "input"]', 'classification'),
  ('Chain Step', 'Multi-step reasoning prompt', 'Step {step_number} of {total_steps}:

Based on the previous result:
{previous_result}

Now {task_description}. Be thorough and precise.', '["step_number", "total_steps", "previous_result", "task_description"]', 'chaining')
ON CONFLICT DO NOTHING;
