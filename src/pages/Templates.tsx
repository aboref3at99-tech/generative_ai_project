import { useEffect, useState } from 'react';
import { supabase, type PromptTemplate } from '../lib/supabase';
import { FileText, Plus, Trash2, CreditCard as Edit3, Copy, Check, X, RefreshCw, Tag } from 'lucide-react';

const CATEGORIES = ['all', 'general', 'development', 'writing', 'classification', 'chaining'];

type FormState = {
  name: string;
  description: string;
  template: string;
  category: string;
};

const emptyForm: FormState = { name: '', description: '', template: '', category: 'general' };

export default function Templates() {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchTemplates() {
    setLoading(true);
    const { data } = await supabase
      .from('prompt_templates')
      .select('*')
      .order('created_at', { ascending: false });
    setTemplates((data ?? []) as PromptTemplate[]);
    setLoading(false);
  }

  useEffect(() => { fetchTemplates(); }, []);

  const filtered = filterCat === 'all'
    ? templates
    : templates.filter((t) => t.category === filterCat);

  function startCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function startEdit(t: PromptTemplate) {
    setForm({
      name: t.name,
      description: t.description ?? '',
      template: t.template,
      category: t.category,
    });
    setEditingId(t.id);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function saveTemplate() {
    if (!form.name.trim() || !form.template.trim()) return;
    setSaving(true);

    const vars = Array.from(form.template.matchAll(/\{(\w+)\}/g)).map((m) => m[1]);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      template: form.template.trim(),
      variables: [...new Set(vars)],
      category: form.category,
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      await supabase.from('prompt_templates').update(payload).eq('id', editingId);
    } else {
      await supabase.from('prompt_templates').insert(payload);
    }

    await fetchTemplates();
    cancelForm();
    setSaving(false);
  }

  async function deleteTemplate(id: string) {
    setDeletingId(id);
    await supabase.from('prompt_templates').delete().eq('id', id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    setDeletingId(null);
  }

  async function copyTemplate(t: PromptTemplate) {
    await navigator.clipboard.writeText(t.template);
    setCopiedId(t.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const categoryColor: Record<string, string> = {
    development: 'badge-blue',
    writing: 'badge-green',
    classification: 'badge-yellow',
    chaining: 'badge-gray',
    general: 'badge-gray',
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Prompt Templates</h1>
          <p className="text-gray-500 text-sm">Reusable prompt templates with variable substitution</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchTemplates} className="btn-secondary p-2">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={startCreate} className="btn-primary flex items-center gap-1.5 text-sm">
            <Plus size={15} />
            New Template
          </button>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
              filterCat === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700 border border-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <div className="card p-6 mb-6 border-blue-800/40 bg-blue-900/5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-200">
              {editingId ? 'Edit Template' : 'New Template'}
            </h2>
            <button onClick={cancelForm} className="text-gray-600 hover:text-gray-300">
              <X size={16} />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Code Review"
                className="input"
              />
            </div>
            <div>
              <label className="label">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="input"
              >
                {CATEGORIES.filter((c) => c !== 'all').map((c) => (
                  <option key={c} value={c} className="bg-gray-900 capitalize">{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="label">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Optional description…"
              className="input"
            />
          </div>

          <div className="mb-4">
            <label className="label">
              Template * <span className="text-gray-600 font-normal">(use {'{'} variable {'}'} for substitution)</span>
            </label>
            <textarea
              value={form.template}
              onChange={(e) => setForm((f) => ({ ...f, template: e.target.value }))}
              placeholder="Write your prompt template here. Use {variable_name} for dynamic values."
              rows={6}
              className="input font-mono text-xs leading-relaxed resize-y"
            />
            {form.template && (() => {
              const vars = [...new Set(Array.from(form.template.matchAll(/\{(\w+)\}/g)).map((m) => m[1]))];
              if (vars.length === 0) return null;
              return (
                <p className="text-xs text-gray-600 mt-1.5">
                  Variables detected: {vars.map((v) => (
                    <code key={v} className="mx-0.5 px-1 rounded bg-gray-800 text-blue-400">{v}</code>
                  ))}
                </p>
              );
            })()}
          </div>

          <div className="flex gap-2 justify-end">
            <button onClick={cancelForm} className="btn-secondary text-sm">Cancel</button>
            <button
              onClick={saveTemplate}
              disabled={!form.name.trim() || !form.template.trim() || saving}
              className="btn-primary text-sm"
            >
              {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Template'}
            </button>
          </div>
        </div>
      )}

      {/* Template grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card h-40 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText size={36} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No templates found</p>
          <p className="text-gray-700 text-sm mt-1">
            {filterCat !== 'all' ? `No templates in "${filterCat}" category` : 'Create your first template above'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((t) => (
            <div key={t.id} className="card p-5 flex flex-col gap-3 hover:border-gray-700 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-200 truncate">{t.name}</h3>
                  {t.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{t.description}</p>
                  )}
                </div>
                <span className={`${categoryColor[t.category] ?? 'badge-gray'} shrink-0 capitalize`}>
                  {t.category}
                </span>
              </div>

              <pre className="text-xs font-mono text-gray-400 bg-gray-950/50 rounded-lg p-3 leading-relaxed overflow-hidden line-clamp-4 whitespace-pre-wrap border border-gray-800">
                {t.template}
              </pre>

              {t.variables && t.variables.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center">
                  <Tag size={11} className="text-gray-600" />
                  {t.variables.map((v) => (
                    <code key={v} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700 text-blue-400">
                      {'{' + v + '}'}
                    </code>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1 border-t border-gray-800">
                <button
                  onClick={() => copyTemplate(t)}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-200 transition-colors"
                >
                  {copiedId === t.id ? (
                    <><Check size={12} className="text-green-400" /><span className="text-green-400">Copied!</span></>
                  ) : (
                    <><Copy size={12} />Copy</>
                  )}
                </button>
                <button
                  onClick={() => startEdit(t)}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-200 transition-colors"
                >
                  <Edit3 size={12} />Edit
                </button>
                <button
                  onClick={() => deleteTemplate(t.id)}
                  disabled={deletingId === t.id}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors ml-auto disabled:opacity-50"
                >
                  <Trash2 size={12} />Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
