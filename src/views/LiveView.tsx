import { Pause, Play, Activity, Mail, MessageSquare, AlertTriangle, ChevronRight } from 'lucide-react';
import type { LifecycleState, Segment, Sequence } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface LiveViewProps {
  state: LifecycleState;
  segments: Segment[];
  sequences: Sequence[];
  onResume: () => void;
  onPause: () => void;
}

export function LiveView({ state, segments, sequences, onResume, onPause }: LiveViewProps) {
  const isPaused = state === 'paused';
  const isPartial = state === 'partial';

  // Simulated metrics
  const sentToday = 12;
  const opened = 4;
  const replied = 1;
  const sendsScheduledToday = 8;

  return (
    <div className="p-6">
      {/* State banner */}
      {isPaused && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/20 text-warning">
              <Pause className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">Campaign paused</div>
              <div className="text-xs text-muted-foreground">Manually paused 1 hour ago. No new sends will go out until resumed.</div>
            </div>
          </div>
          <Button onClick={onResume}>
            <Play className="h-4 w-4" />
            Resume
          </Button>
        </div>
      )}

      {isPartial && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">Partial run</div>
              <div className="text-xs text-muted-foreground">3 leads completed all steps. 5 leads still in sequence.</div>
            </div>
          </div>
        </div>
      )}

      {/* Live metrics */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <MetricCard
          label="Sent today"
          value={sentToday}
          sublabel={`${sendsScheduledToday} more scheduled`}
          icon={Mail}
          tone="primary"
        />
        <MetricCard label="Opened" value={opened} sublabel={`${Math.round((opened / sentToday) * 100)}% open rate`} icon={Activity} tone="success" />
        <MetricCard label="Replied" value={replied} sublabel="1 positive sentiment" icon={MessageSquare} tone="success" />
        <MetricCard label="Bounced" value={0} sublabel="Healthy deliverability" icon={AlertTriangle} tone="muted" />
      </div>

      {/* Per-segment progress */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-foreground">Per-segment progress</h3>
          <span className="text-xs text-muted-foreground">{segments.length} active segment{segments.length === 1 ? '' : 's'}</span>
        </div>
        <div className="divide-y divide-border">
          {segments.map((seg) => {
            const seq = sequences.find((s) => s.id === seg.sequenceId);
            const total = seg.matchedLeadIds.length;
            const completed = isPartial ? Math.round(total * 0.4) : isPaused ? 0 : Math.round(total * 0.6);
            const inProgress = total - completed;
            return (
              <div key={seg.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn('h-1.5 w-1.5 rounded-full', seg.isDefault ? 'bg-muted-foreground' : 'bg-primary')} />
                    <span className="font-medium text-foreground">{seg.name}</span>
                    {seq && (
                      <span className="text-xs text-muted-foreground">· {seq.name}</span>
                    )}
                  </div>
                  <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="bg-success" style={{ width: `${(completed / total) * 100}%` }} />
                    <div className="bg-primary" style={{ width: `${(inProgress / total) * 100}%` }} />
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span><span className="text-success">{completed}</span> completed</span>
                    <span><span className="text-primary">{inProgress}</span> in progress</span>
                    <span>of {total}</span>
                  </div>
                </div>
                <button className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {!isPaused && (
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={onPause}>
            <Pause className="h-4 w-4" />
            Pause campaign
          </Button>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  sublabel,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  sublabel: string;
  icon: typeof Mail;
  tone: 'primary' | 'success' | 'warning' | 'muted';
}) {
  const toneClass = {
    primary: 'bg-primary/15 text-primary',
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    muted: 'bg-muted text-muted-foreground',
  }[tone];
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', toneClass)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{sublabel}</div>
    </div>
  );
}
