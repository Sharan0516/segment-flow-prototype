import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { X, Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TitleOption {
  value: string;
  count: number;
}

interface TitleMultiSelectProps {
  values: string[];
  onChange: (values: string[]) => void;
  options: TitleOption[];
  placeholder?: string;
  className?: string;
}

/**
 * Job-title filter: searchable, multi-select dropdown of the distinct titles in
 * the lead pool, each with its lead count. Type a keyword (e.g. "procurement")
 * to narrow the list, tick specific titles, or "Select all matching" to add
 * every title that contains the keyword in one click. Free-typing a value and
 * pressing Enter still adds a raw keyword chip (contains-match) for power users.
 */
export function TitleMultiSelect({
  values,
  onChange,
  options,
  placeholder,
  className,
}: TitleMultiSelectProps) {
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(() => new Set(values), [values]);

  const filtered = useMemo(() => {
    const q = draft.trim().toLowerCase();
    const list = q ? options.filter((o) => o.value.toLowerCase().includes(q)) : options;
    return list;
  }, [draft, options]);

  // Leads covered by the current keyword (distinct titles partition the pool, so counts sum cleanly)
  const matchTitleCount = filtered.length;
  const matchLeadCount = filtered.reduce((sum, o) => sum + o.count, 0);
  const allMatchedSelected = filtered.length > 0 && filtered.every((o) => selected.has(o.value));

  const showDropdown = open && (filtered.length > 0 || draft.trim().length > 0);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggle = (val: string) => {
    if (selected.has(val)) onChange(values.filter((v) => v !== val));
    else onChange([...values, val]);
    inputRef.current?.focus();
  };

  const selectAllMatching = () => {
    if (allMatchedSelected) {
      // Deselect everything in the current match set
      const drop = new Set(filtered.map((o) => o.value));
      onChange(values.filter((v) => !drop.has(v)));
    } else {
      const additions = filtered.map((o) => o.value).filter((v) => !selected.has(v));
      onChange([...values, ...additions]);
    }
    inputRef.current?.focus();
  };

  const addKeyword = () => {
    const v = draft.trim();
    if (!v) return;
    if (!selected.has(v)) onChange([...values, v]);
    setDraft('');
  };

  const remove = (val: string) => onChange(values.filter((v) => v !== val));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && draft.trim()) {
      e.preventDefault();
      addKeyword();
      return;
    }
    if (e.key === 'Backspace' && draft === '' && values.length > 0) {
      onChange(values.slice(0, -1));
    }
    if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          'flex min-h-9 w-full flex-wrap items-center gap-1 rounded-lg border border-border bg-input px-2 py-1 text-sm',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background',
          className,
        )}
        onClick={() => {
          inputRef.current?.focus();
          setOpen(true);
        }}
      >
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary"
          >
            {v}
            <button
              type="button"
              onClick={() => remove(v)}
              className="rounded-full hover:bg-primary/20"
              aria-label={`Remove ${v}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <div className="flex min-w-[120px] flex-1 items-center gap-1">
          <Search className="h-3 w-3 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder={values.length === 0 ? placeholder : 'Search titles...'}
            className="flex-1 bg-transparent py-1 outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 z-50 mt-1 rounded-lg border border-border bg-card shadow-xl">
          {/* Select-all-matching action */}
          {filtered.length > 0 && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={selectAllMatching}
              className="flex w-full items-center justify-between gap-2 border-b border-border px-3 py-2 text-left hover:bg-accent"
            >
              <span className="text-xs font-semibold text-primary">
                {allMatchedSelected
                  ? `Deselect all${draft.trim() ? ` matching “${draft.trim()}”` : ''}`
                  : draft.trim()
                    ? `Select all matching “${draft.trim()}”`
                    : `Select all ${matchTitleCount} titles`}
              </span>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {matchLeadCount} {matchLeadCount === 1 ? 'lead' : 'leads'} · {matchTitleCount}{' '}
                {matchTitleCount === 1 ? 'title' : 'titles'}
              </span>
            </button>
          )}

          {/* Title list with counts + checkboxes */}
          <div className="max-h-56 overflow-y-auto scrollbar-thin">
            {filtered.map((o) => {
              const checked = selected.has(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => toggle(o.value)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-accent"
                >
                  <span
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                      checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                    )}
                  >
                    {checked && <Check className="h-3 w-3" />}
                  </span>
                  <span className={cn('flex-1 truncate text-xs', checked ? 'text-primary' : 'text-foreground')}>
                    {o.value}
                  </span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{o.count}</span>
                </button>
              );
            })}

            {/* Free keyword fallback when the typed text isn't an exact title */}
            {draft.trim() && !options.some((o) => o.value.toLowerCase() === draft.trim().toLowerCase()) && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={addKeyword}
                className="flex w-full items-center gap-2 border-t border-border px-3 py-1.5 text-left text-xs text-muted-foreground hover:bg-accent"
              >
                <Search className="h-3 w-3 shrink-0" />
                Add keyword “<span className="font-medium text-foreground">{draft.trim()}</span>” (matches any title containing it)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
