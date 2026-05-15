import { useState, useRef, useEffect } from 'react';
import { Layers, Plus, ChevronDown, X, ArrowRight } from 'lucide-react';
import type { Segment } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SelectionActionBarProps {
  selectedCount: number;
  existingSegments: Segment[];
  onClear: () => void;
  onCreateFromSelection: () => void;
  onAddToSegment: (segmentId: string) => void;
}

export function SelectionActionBar({
  selectedCount,
  existingSegments,
  onClear,
  onCreateFromSelection,
  onAddToSegment,
}: SelectionActionBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  if (selectedCount === 0) return null;

  const customSegments = existingSegments.filter((s) => !s.isDefault);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-border bg-card/95 px-3 py-2 shadow-2xl backdrop-blur-md">
        <span className="inline-flex items-center gap-2 px-2 text-sm">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
            {selectedCount}
          </span>
          <span className="text-foreground">selected</span>
        </span>
        <div className="h-5 w-px bg-border" />
        <button
          onClick={onCreateFromSelection}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" />
          Create segment from these
          <ArrowRight className="h-3 w-3" />
        </button>
        <div ref={ref} className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium',
              menuOpen ? 'bg-accent text-foreground' : 'bg-secondary text-foreground hover:bg-accent',
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            Add to existing
            <ChevronDown className={cn('h-3 w-3 transition-transform', menuOpen && 'rotate-180')} />
          </button>
          {menuOpen && (
            <div className="absolute bottom-full right-0 mb-2 w-64 rounded-lg border border-border bg-card p-1 shadow-2xl">
              {customSegments.length === 0 && (
                <div className="px-3 py-2 text-xs text-muted-foreground">No custom segments yet.</div>
              )}
              {customSegments.map((seg) => (
                <button
                  key={seg.id}
                  onClick={() => {
                    onAddToSegment(seg.id);
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-xs hover:bg-accent"
                >
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span className="text-foreground">{seg.name}</span>
                  </span>
                  <span className="text-muted-foreground">{seg.matchedLeadIds.length}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={onClear}
          className="ml-1 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          title="Clear selection"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
