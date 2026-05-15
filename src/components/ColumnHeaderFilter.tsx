import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search, Filter as FilterIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColumnHeaderFilterProps {
  label: string;
  values: string[];
  selected: string[];
  onChange: (vals: string[]) => void;
}

export function ColumnHeaderFilter({ label, values, selected, onChange }: ColumnHeaderFilterProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = values.filter((v) => v.toLowerCase().includes(query.toLowerCase()));
  const toggle = (v: string) => {
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  };

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'inline-flex items-center gap-1 rounded p-0.5 transition-colors',
          selected.length > 0 ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
        )}
        title={`Filter ${label}`}
      >
        {selected.length > 0 ? <FilterIcon className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {selected.length > 0 && <span className="text-[10px] font-medium">{selected.length}</span>}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-64 rounded-lg border border-border bg-card shadow-xl">
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Filter ${label}…`}
                className="h-7 w-full rounded-md border border-border bg-input pl-7 pr-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto p-1 scrollbar-thin">
            {filtered.length === 0 && (
              <div className="px-2 py-3 text-center text-xs text-muted-foreground">No matches</div>
            )}
            {filtered.map((v) => {
              const isSel = selected.includes(v);
              return (
                <button
                  key={v}
                  onClick={() => toggle(v)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs',
                    isSel ? 'bg-primary/15 text-primary' : 'hover:bg-accent',
                  )}
                >
                  <span className="truncate">{v}</span>
                  {isSel && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                </button>
              );
            })}
          </div>
          {selected.length > 0 && (
            <div className="border-t border-border p-2">
              <button
                onClick={() => onChange([])}
                className="inline-flex w-full items-center justify-center gap-1 rounded-md py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-3 w-3" />
                Clear filter
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
