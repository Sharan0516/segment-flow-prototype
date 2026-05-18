import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Filter as FilterIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColumnHeaderFilterProps {
  label: string;
  values: string[];
  selected: string[];
  onChange: (vals: string[]) => void;
}

const POPOVER_WIDTH = 256;       // matches w-64
const VIEWPORT_MARGIN = 8;
const ESTIMATED_POPOVER_HEIGHT = 340; // header + max-h-60 list + footer

export function ColumnHeaderFilter({ label, values, selected, onChange }: ColumnHeaderFilterProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Compute popover position from trigger rect. Recompute on scroll/resize while open.
  useEffect(() => {
    if (!open) return;

    const update = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const r = trigger.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Horizontal: prefer left-aligned with trigger; flip to right-aligned if overflowing right edge.
      let left = r.left;
      if (left + POPOVER_WIDTH + VIEWPORT_MARGIN > vw) {
        left = Math.max(VIEWPORT_MARGIN, r.right - POPOVER_WIDTH);
      }

      // Vertical: prefer below trigger; flip above if there isn't room.
      let top = r.bottom + 4;
      if (top + ESTIMATED_POPOVER_HEIGHT + VIEWPORT_MARGIN > vh) {
        const flipped = r.top - ESTIMATED_POPOVER_HEIGHT - 4;
        if (flipped >= VIEWPORT_MARGIN) top = flipped;
      }

      setPos({ top, left });
    };

    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  // Outside-click: check both the trigger and the portal-rendered popover.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const inTrigger = triggerRef.current?.contains(target);
      const inPopover = popoverRef.current?.contains(target);
      if (!inTrigger && !inPopover) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = values.filter((v) => v.toLowerCase().includes(query.toLowerCase()));
  const toggle = (v: string) => {
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  };

  return (
    <>
      <button
        ref={triggerRef}
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

      {open && pos && createPortal(
        <div
          ref={popoverRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: POPOVER_WIDTH }}
          className="z-50 rounded-lg border border-border bg-card shadow-xl"
        >
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
        </div>,
        document.body
      )}
    </>
  );
}
