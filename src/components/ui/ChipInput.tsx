import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChipInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function ChipInput({ values, onChange, placeholder, className }: ChipInputProps) {
  const [draft, setDraft] = useState('');

  const commit = () => {
    const v = draft.trim();
    if (!v) return;
    if (values.includes(v)) {
      setDraft('');
      return;
    }
    onChange([...values, v]);
    setDraft('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Backspace' && draft === '' && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };

  const remove = (v: string) => onChange(values.filter((x) => x !== v));

  return (
    <div
      className={cn(
        'flex min-h-9 w-full flex-wrap items-center gap-1 rounded-lg border border-border bg-input px-2 py-1 text-sm',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background',
        className,
      )}
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
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        placeholder={values.length === 0 ? placeholder : ''}
        className="min-w-[120px] flex-1 bg-transparent px-1 py-1 outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
