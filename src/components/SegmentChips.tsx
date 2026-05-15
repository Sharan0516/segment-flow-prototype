import { Plus, Layers } from 'lucide-react';
import type { Segment } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SegmentChipsProps {
  segments: Segment[];
  activeSegmentId: string | 'all';
  onChange: (id: string | 'all') => void;
  onCreate: () => void;
  totalLeads: number;
}

const dotColors = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-green-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-teal-500',
];

export function SegmentChips({ segments, activeSegmentId, onChange, onCreate, totalLeads }: SegmentChipsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <Layers className="h-3 w-3" />
        Group by segment
      </span>
      <button
        onClick={() => onChange('all')}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
          activeSegmentId === 'all'
            ? 'border-primary bg-primary/15 text-primary'
            : 'border-border bg-secondary text-muted-foreground hover:text-foreground',
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
        All leads
        <span className="rounded-full bg-background/30 px-1.5 py-0.5 text-[10px]">{totalLeads}</span>
      </button>
      {segments.map((seg, idx) => {
        const isActive = activeSegmentId === seg.id;
        return (
          <button
            key={seg.id}
            onClick={() => onChange(seg.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              isActive
                ? 'border-primary bg-primary/15 text-primary'
                : 'border-border bg-secondary text-muted-foreground hover:text-foreground',
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', seg.isDefault ? 'bg-muted-foreground' : dotColors[idx % dotColors.length])} />
            {seg.name}
            <span className="rounded-full bg-background/30 px-1.5 py-0.5 text-[10px]">{seg.matchedLeadIds.length}</span>
          </button>
        );
      })}
      <button
        onClick={onCreate}
        className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
      >
        <Plus className="h-3 w-3" />
        New segment
      </button>
    </div>
  );
}
