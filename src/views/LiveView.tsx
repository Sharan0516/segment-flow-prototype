import { useMemo, useState } from 'react';
import { Pause, Play, Activity, Mail, MessageSquare, AlertTriangle, ChevronDown, ChevronRight, Rocket } from 'lucide-react';
import type { LifecycleState, MessageStep, Segment, Sequence } from '@/lib/types';
import { LinkedinIcon } from '@/components/icons/LinkedinIcon';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface LiveViewProps {
  state: LifecycleState;
  segments: Segment[];
  sequences: Sequence[];
  onResume: () => void;
  onPause: () => void;
  onLaunchSegment: (segmentId: string) => void;
  onPauseSegment: (segmentId: string) => void;
  onResumeSegment: (segmentId: string) => void;
}

export function LiveView({
  state,
  segments,
  sequences,
  onLaunchSegment,
  onPauseSegment,
  onResumeSegment,
}: LiveViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const customSegments = segments.filter((s) => !s.isDefault);
  const liveSegments = customSegments.filter((s) => s.status === 'live');
  const pausedSegments = customSegments.filter((s) => s.status === 'paused');
  const draftSegments = customSegments.filter((s) => s.status === 'draft');

  // Aggregate metrics across live + paused segments (synthetic for prototype)
  const totalLeadsInFlight = [...liveSegments, ...pausedSegments].reduce(
    (sum, s) => sum + s.matchedLeadIds.length,
    0,
  );
  const sentToday = Math.round(totalLeadsInFlight * 0.45);
  const opened = Math.round(sentToday * 0.32);
  const replied = Math.round(sentToday * 0.08);
  const bounced = Math.round(sentToday * 0.02);

  if (customSegments.length === 0) {
    return (
      <EmptyState message="No custom segments yet. Create a segment from the Leads tab to get started." />
    );
  }

  return (
    <div className="space-y-4 p-6">
      {/* Top metrics — only meaningful when something is live/paused */}
      {(liveSegments.length > 0 || pausedSegments.length > 0) && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricCard
            label="Sent today"
            value={sentToday}
            sublabel={`${liveSegments.length + pausedSegments.length} segment${liveSegments.length + pausedSegments.length === 1 ? '' : 's'} in flight`}
            icon={Mail}
            tone="primary"
          />
          <MetricCard
            label="Opened"
            value={opened}
            sublabel={sentToday > 0 ? `${Math.round((opened / sentToday) * 100)}% open rate` : '—'}
            icon={Activity}
            tone="success"
          />
          <MetricCard
            label="Replied"
            value={replied}
            sublabel={sentToday > 0 ? `${Math.round((replied / sentToday) * 100)}% reply rate` : '—'}
            icon={MessageSquare}
            tone="success"
          />
          <MetricCard
            label="Bounced"
            value={bounced}
            sublabel={bounced === 0 ? 'Healthy deliverability' : 'Watch sender reputation'}
            icon={AlertTriangle}
            tone={bounced > 0 ? 'warning' : 'muted'}
          />
        </div>
      )}

      {/* Per-segment rows */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-5 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            Segments
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {liveSegments.length} live · {pausedSegments.length} paused · {draftSegments.length} draft
            </span>
          </h3>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {state === 'paused' && 'Campaign paused'}
            {state === 'finished' && 'Campaign finished'}
          </span>
        </div>

        <div className="divide-y divide-border">
          {customSegments.map((seg) => (
            <SegmentRow
              key={seg.id}
              segment={seg}
              sequence={sequences.find((s) => s.id === seg.sequenceId)}
              expanded={expandedId === seg.id}
              onToggleExpand={() => setExpandedId((cur) => (cur === seg.id ? null : seg.id))}
              onLaunch={() => onLaunchSegment(seg.id)}
              onPause={() => onPauseSegment(seg.id)}
              onResume={() => onResumeSegment(seg.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SegmentRow({
  segment,
  sequence,
  expanded,
  onToggleExpand,
  onLaunch,
  onPause,
  onResume,
}: {
  segment: Segment;
  sequence?: Sequence;
  expanded: boolean;
  onToggleExpand: () => void;
  onLaunch: () => void;
  onPause: () => void;
  onResume: () => void;
}) {
  const total = segment.matchedLeadIds.length;
  const isDraft = segment.status === 'draft';
  const isLive = segment.status === 'live';
  const isPaused = segment.status === 'paused';
  const isDone = segment.status === 'done';

  // Synthetic per-step metrics for prototype
  const stepFunnel = useMemo(() => {
    if (!sequence?.messageSteps) return [];
    const baseFalloff = isLive ? 0.85 : isPaused ? 0.7 : isDone ? 1 : 0;
    return sequence.messageSteps.map((step, idx) => {
      const reach = baseFalloff > 0 ? Math.max(0, Math.round(total * Math.pow(baseFalloff, idx + 1))) : 0;
      const opened = Math.round(reach * 0.4);
      const replied = Math.round(reach * 0.08);
      return { step, reach, opened, replied };
    });
  }, [sequence, total, isLive, isPaused, isDone]);

  const totalSent = stepFunnel.reduce((sum, s) => sum + s.reach, 0);
  const totalOpened = stepFunnel.reduce((sum, s) => sum + s.opened, 0);
  const totalReplied = stepFunnel.reduce((sum, s) => sum + s.replied, 0);

  const statusPill = isLive
    ? { label: 'Live', bg: 'bg-success/15 text-success', dot: 'bg-success animate-pulse' }
    : isPaused
    ? { label: 'Paused', bg: 'bg-warning/15 text-warning', dot: 'bg-warning' }
    : isDone
    ? { label: 'Done', bg: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' }
    : { label: 'Draft', bg: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground/60' };

  return (
    <div className={cn('transition-colors', expanded && 'bg-secondary/20')}>
      <div className="flex items-center gap-4 px-5 py-3.5">
        <button
          onClick={onToggleExpand}
          aria-label={expanded ? 'Collapse' : 'Expand'}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-foreground">{segment.name}</span>
            <span className={cn('inline-flex items-center gap-1 rounded-full px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wider', statusPill.bg)}>
              <span className={cn('h-1.5 w-1.5 rounded-full', statusPill.dot)} />
              {statusPill.label}
            </span>
            <span className="text-xs text-muted-foreground">
              · {total} lead{total === 1 ? '' : 's'}
            </span>
            {sequence && (
              <span className="text-xs text-muted-foreground">· {sequence.name}</span>
            )}
          </div>

          {isDraft ? (
            <div className="mt-1.5 text-xs text-muted-foreground">
              Not launched yet. Press Launch to begin outreach for this segment.
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-4">
              <ProgressBar sent={totalSent} opened={totalOpened} replied={totalReplied} total={total * (sequence?.messageSteps?.length ?? 1)} />
              <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                <span><span className="text-foreground tabular-nums">{totalSent}</span> sent</span>
                <span><span className="text-foreground tabular-nums">{totalOpened}</span> opened</span>
                <span><span className="text-foreground tabular-nums">{totalReplied}</span> replied</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {isDraft && (
            <Button size="sm" onClick={onLaunch}>
              <Rocket className="h-3.5 w-3.5" />
              Launch
            </Button>
          )}
          {isLive && (
            <Button variant="outline" size="sm" onClick={onPause}>
              <Pause className="h-3.5 w-3.5" />
              Pause
            </Button>
          )}
          {isPaused && (
            <Button size="sm" onClick={onResume}>
              <Play className="h-3.5 w-3.5" />
              Resume
            </Button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border bg-card px-5 py-4">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Per-step funnel
          </div>
          {stepFunnel.length === 0 ? (
            <div className="rounded-md border border-dashed border-border bg-secondary/30 px-3 py-4 text-center text-xs text-muted-foreground">
              No step details available for this segment yet.
            </div>
          ) : (
            <div className="space-y-2">
              {stepFunnel.map(({ step, reach, opened, replied }, idx) => (
                <StepRow
                  key={step.id}
                  step={step}
                  idx={idx}
                  reach={reach}
                  opened={opened}
                  replied={replied}
                  total={total}
                  active={isLive}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StepRow({
  step,
  idx,
  reach,
  opened,
  replied,
  total,
  active,
}: {
  step: MessageStep;
  idx: number;
  reach: number;
  opened: number;
  replied: number;
  total: number;
  active: boolean;
}) {
  const channelIcon = step.channel === 'email' ? Mail : LinkedinIcon;
  const channelLabel = step.channel === 'email' ? 'Email' : step.channel === 'linkedin_connection' ? 'LinkedIn Connection' : 'LinkedIn Message';
  const Icon = channelIcon as unknown as typeof Mail;

  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-foreground">Step {idx + 1}</span>
            <span className="text-muted-foreground">· {channelLabel}</span>
            <span className="text-muted-foreground">· Day {step.dayOffset}</span>
          </div>
          {step.subject && (
            <div className="mt-0.5 truncate text-xs text-foreground">Subject: {step.subject}</div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3 text-xs">
          <FunnelStat label="reached" value={reach} total={total} active={active} />
          <FunnelStat label="opened" value={opened} total={reach || 1} active={active} />
          <FunnelStat label="replied" value={replied} total={reach || 1} active={active} tone="success" />
        </div>
      </div>
    </div>
  );
}

function FunnelStat({
  label,
  value,
  total,
  active,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  active: boolean;
  tone?: 'success';
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="text-center">
      <div className={cn('tabular-nums font-semibold', tone === 'success' ? 'text-success' : 'text-foreground')}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label} {active && pct > 0 ? `· ${pct}%` : ''}
      </div>
    </div>
  );
}

function ProgressBar({ sent, opened, replied, total }: { sent: number; opened: number; replied: number; total: number }) {
  const pctSent = total > 0 ? (sent / total) * 100 : 0;
  const pctOpen = total > 0 ? (opened / total) * 100 : 0;
  const pctReplied = total > 0 ? (replied / total) * 100 : 0;
  return (
    <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
      <div className="absolute inset-y-0 left-0 bg-primary/40" style={{ width: `${pctSent}%` }} />
      <div className="absolute inset-y-0 left-0 bg-primary" style={{ width: `${pctOpen}%` }} />
      <div className="absolute inset-y-0 left-0 bg-success" style={{ width: `${pctReplied}%` }} />
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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center p-12">
      <div className="text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Activity className="h-5 w-5" />
        </div>
        <div className="mt-3 text-sm font-semibold text-foreground">Nothing live yet</div>
        <div className="mt-1 max-w-sm text-xs text-muted-foreground">{message}</div>
      </div>
    </div>
  );
}
