-- Drop auth.uid() based policies that block anon access
DROP POLICY IF EXISTS "Users can delete own conversations" ON conversation_history;
DROP POLICY IF EXISTS "Users can update own conversations" ON conversation_history;
DROP POLICY IF EXISTS "Users can insert own conversations" ON conversation_history;
DROP POLICY IF EXISTS "Users can view own conversations" ON conversation_history;
DROP POLICY IF EXISTS "Users can insert own usage" ON api_usage;
DROP POLICY IF EXISTS "Users can view own usage" ON api_usage;

-- conversation_history: allow anon + authenticated full access (no-auth app)
CREATE POLICY "anon_select_conversations" ON conversation_history
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon_insert_conversations" ON conversation_history
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "anon_update_conversations" ON conversation_history
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "anon_delete_conversations" ON conversation_history
  FOR DELETE TO anon, authenticated USING (true);

-- api_usage: allow anon + authenticated full access
CREATE POLICY "anon_select_api_usage" ON api_usage
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon_insert_api_usage" ON api_usage
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "anon_update_api_usage" ON api_usage
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "anon_delete_api_usage" ON api_usage
  FOR DELETE TO anon, authenticated USING (true);

-- Add prompt_templates table for the Templates page
CREATE TABLE IF NOT EXISTS prompt_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  template text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb,
  category text DEFAULT 'general',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_templates" ON prompt_templates
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon_insert_templates" ON prompt_templates
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "anon_update_templates" ON prompt_templates
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "anon_delete_templates" ON prompt_templates
  FOR DELETE TO anon, authenticated USING (true);

-- Seed some default templates
INSERT INTO prompt_templates (name, description, template, variables, category) VALUES
  ('Code Review', 'Review code for bugs and improvements', 'Review the following code and identify bugs, security issues, and improvement opportunities:\n\n```{language}\n{code}\n```\n\nProvide specific, actionable feedback.', '["language", "code"]', 'development'),
  ('Summarize Text', 'Summarize long text into key points', 'Summarize the following text in {length} bullet points, focusing on the most important information:\n\n{text}', '["length", "text"]', 'writing'),
  ('Few-Shot Classification', 'Classify text using examples', 'Given these examples:\n{examples}\n\nClassify the following text as one of these categories: {categories}\n\nText: {input}\n\nCategory:', '["examples", "categories", "input"]', 'classification'),
  ('Chain Step', 'Multi-step reasoning prompt', 'Step {step_number} of {total_steps}:\n\nBased on the previous result:\n{previous_result}\n\nNow {task_description}. Be thorough and precise.', '["step_number", "total_steps", "previous_result", "task_description"]', 'chaining')
ON CONFLICT DO NOTHING;
