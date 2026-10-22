import { useMemo, useState, type ReactNode } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useLocalCollection, type LocalRecord } from '../../lib/localStore';

export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'time' | 'select' | 'checkbox';

export interface FieldDef {
  name: string;
  label: string;
  type?: FieldType;
  options?: string[];
  required?: boolean;
  placeholder?: string;
  /** Default value for a new record (e.g. today's date). */
  initial?: () => string | boolean;
}

type Values = Record<string, string | number | boolean>;
export type ToolRecord = LocalRecord & Values;

export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function formatDate(iso: unknown) {
  if (typeof iso !== 'string' || !iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function emptyValues(fields: FieldDef[]): Values {
  const v: Values = {};
  for (const f of fields) v[f.name] = f.initial ? f.initial() : f.type === 'checkbox' ? false : f.options?.[0] ?? '';
  return v;
}

interface RecordToolProps<T extends ToolRecord> {
  storageKey: string;
  fields: FieldDef[];
  /** Field shown as a tick box on each row (e.g. "done", "paid"). */
  doneField?: string;
  itemLabel: string;
  emptyText: string;
  sort?: (a: T, b: T) => number;
  renderRow: (item: T) => ReactNode;
  summary?: (items: T[]) => ReactNode;
}

/** Add / edit / delete records saved on this device. Every Student and Health tool uses it. */
export function RecordTool<T extends ToolRecord>({
  storageKey,
  fields,
  doneField,
  itemLabel,
  emptyText,
  sort,
  renderRow,
  summary,
}: RecordToolProps<T>) {
  const { items, add, update, remove } = useLocalCollection<T>(storageKey);
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [values, setValues] = useState<Values>(() => emptyValues(fields));
  const [error, setError] = useState('');

  const sorted = useMemo(() => (sort ? [...items].sort(sort) : items), [items, sort]);

  const startNew = () => {
    setValues(emptyValues(fields));
    setError('');
    setEditing('new');
  };
  const startEdit = (item: T) => {
    const v: Values = {};
    for (const f of fields) v[f.name] = item[f.name] ?? (f.type === 'checkbox' ? false : '');
    setValues(v);
    setError('');
    setEditing(item.id);
  };
  const save = () => {
    const missing = fields.find((f) => f.required && String(values[f.name] ?? '').trim() === '');
    if (missing) {
      setError(`${missing.label} is required.`);
      return;
    }
    const clean: Values = {};
    for (const f of fields) {
      const raw = values[f.name];
      clean[f.name] = f.type === 'number' ? Number(raw) || 0 : typeof raw === 'string' ? raw.trim() : raw;
    }
    if (editing === 'new') add(clean as Omit<T, 'id' | 'createdAt'>);
    else if (editing) update(editing, clean as Partial<T>);
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      {summary && items.length > 0 && <div>{summary(items)}</div>}

      {editing ? (
        <div className="sg16-card p-4 sm:p-5 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            {fields.map((f) => (
              <label
                key={f.name}
                className={`flex flex-col gap-1 text-xs text-white/60 ${
                  f.type === 'textarea' ? 'sm:col-span-2' : ''
                } ${f.type === 'checkbox' ? '!flex-row items-center gap-2 pt-5' : ''}`}
              >
                {f.type !== 'checkbox' && (
                  <span>
                    {f.label}
                    {f.required && <span className="text-[#FF5CB8]"> *</span>}
                  </span>
                )}
                {f.type === 'select' ? (
                  <select
                    className="sg16-field"
                    value={String(values[f.name] ?? '')}
                    onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
                  >
                    {f.options?.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea
                    className="sg16-field min-h-[5.5rem] resize-y"
                    placeholder={f.placeholder}
                    value={String(values[f.name] ?? '')}
                    onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
                  />
                ) : f.type === 'checkbox' ? (
                  <>
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#FF168D]"
                      checked={Boolean(values[f.name])}
                      onChange={(e) => setValues({ ...values, [f.name]: e.target.checked })}
                    />
                    <span>{f.label}</span>
                  </>
                ) : (
                  <input
                    className="sg16-field"
                    type={f.type ?? 'text'}
                    step={f.type === 'number' ? 'any' : undefined}
                    placeholder={f.placeholder}
                    value={String(values[f.name] ?? '')}
                    onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
                  />
                )}
              </label>
            ))}
          </div>
          {error && <p className="text-xs text-[#FF8FB8]">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={save} className="sg16-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-sm">
              <Check className="w-4 h-4" /> Save
            </button>
            <button type="button" onClick={() => setEditing(null)} className="sg16-btn-secondary inline-flex items-center gap-1.5 px-4 py-2 text-sm">
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={startNew} className="sg16-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-sm">
          <Plus className="w-4 h-4" /> Add {itemLabel}
        </button>
      )}

      <div className="sg16-card overflow-hidden">
        {sorted.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-white/40">{emptyText}</p>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {sorted.map((item) => {
              const done = doneField ? Boolean(item[doneField]) : false;
              return (
                <li key={item.id} className="flex items-start gap-3 px-4 sm:px-5 py-3">
                  {doneField && (
                    <input
                      type="checkbox"
                      aria-label={`Mark ${itemLabel} done`}
                      className="mt-1 h-4 w-4 accent-[#FF168D] shrink-0"
                      checked={done}
                      onChange={(e) => update(item.id, { [doneField]: e.target.checked } as Partial<T>)}
                    />
                  )}
                  <div className={`min-w-0 flex-1 text-sm ${done ? 'opacity-50' : ''}`}>{renderRow(item)}</div>
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="p-1.5 rounded-lg text-white/45 hover:text-white hover:bg-white/[0.06]"
                    aria-label={`Edit ${itemLabel}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete this ${itemLabel}?`)) remove(item.id);
                    }}
                    className="p-1.5 rounded-lg text-white/45 hover:text-[#FF5CB8] hover:bg-white/[0.06]"
                    aria-label={`Delete ${itemLabel}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <p className="text-[11px] text-white/35">Saved on this device only.</p>
    </div>
  );
}

/** Small number tile for tool summaries. */
export function StatTile({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: string; tone?: string }) {
  return (
    <div className="sg16-card p-4 min-h-[6.5rem] flex flex-col">
      <div className="text-[11px] uppercase tracking-wider text-white/40">{label}</div>
      <div className={`text-2xl font-semibold mt-1.5 ${tone ?? 'text-white'}`}>{value}</div>
      {hint && <div className="text-xs text-white/45 mt-auto pt-1.5">{hint}</div>}
    </div>
  );
}
