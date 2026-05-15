import { Sparkles, Info } from 'lucide-react';
import type { Lead } from '@/lib/types';
import { Tooltip } from './ui/Tooltip';
import { cn } from '@/lib/utils';

interface ScoreBadgeProps {
  lead: Lead;
}

function scoreLabel(score: number): { label: string; tone: string } {
  if (score >= 80) return { label: 'Exceptional fit', tone: 'bg-success/15 text-success border-success/30' };
  if (score >= 60) return { label: 'Strong fit', tone: 'bg-primary/15 text-primary border-primary/30' };
  if (score >= 40) return { label: 'Moderate fit', tone: 'bg-warning/15 text-warning border-warning/30' };
  return { label: 'Weak fit', tone: 'bg-muted text-muted-foreground border-border' };
}

export function ScoreBadge({ lead }: ScoreBadgeProps) {
  const { label, tone } = scoreLabel(lead.score);
  return (
    <Tooltip
      side="bottom"
      content={
        <div className="w-56 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">{label}</span>
            <span className="text-primary">{lead.score} / 100</span>
          </div>
          <div className="border-t border-border pt-1.5">
            <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Breakdown</div>
            <div className="space-y-0.5">
              {lead.scoreBreakdown.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className={cn('font-medium', item.points > 0 ? 'text-foreground' : 'text-muted-foreground')}>
                    +{item.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <button
        className={cn(
          'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium',
          tone,
        )}
      >
        <Sparkles className="h-3 w-3" />
        {lead.score}
        <Info className="h-3 w-3 opacity-60" />
      </button>
    </Tooltip>
  );
}
