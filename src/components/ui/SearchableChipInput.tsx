import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchableChipInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
}

export function SearchableChipInput({
  values,
  onChange,
  suggestions,
  placeholder,
  className,
}: SearchableChipInputProps) {
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = draft.trim()
    ? suggestions.filter(
        (s) =>
          s.toLowerCase().includes(draft.toLowerCase()) &&
          !values.includes(s),
      )
    : suggestions.filter((s) => !values.includes(s));

  const showDropdown = open && filtered.length > 0;

  useEffect(() => {
    setHighlightIdx(0);
  }, [draft]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (showDropdown && listRef.current) {
      const active = listRef.current.children[highlightIdx] as HTMLElement | undefined;
      active?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIdx, showDropdown]);

  const select = (val: string) => {
    if (!values.includes(val)) onChange([...values, val]);
    setDraft('');
    setOpen(false);
    inputRef.current?.focus();
  };

  const remove = (val: string) => onChange(values.filter((v) => v !== val));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (showDropdown) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIdx((i) => Math.min(i + 1, filtered.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIdx((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[highlightIdx]) select(filtered[highlightIdx]);
        return;
      }
    }
    if (e.key === 'Backspace' && draft === '' && values.length > 0) {
      onChange(values.slice(0, -1));
    }
    if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          'flex min-h-9 w-full flex-wrap items-center gap-1 rounded-lg border border-border bg-input px-2 py-1 text-sm',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background',
          className,
        )}
        onClick={() => inputRef.current?.focus()}
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
            placeholder={values.length === 0 ? placeholder : 'Search...'}
            className="flex-1 bg-transparent py-1 outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-card shadow-xl scrollbar-thin">
          <div ref={listRef}>
            {filtered.map((s, idx) => (
              <button
                key={s}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(s)}
                onMouseEnter={() => setHighlightIdx(idx)}
                className={cn(
                  'flex w-full items-center px-3 py-1.5 text-left text-xs',
                  idx === highlightIdx
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-accent',
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
