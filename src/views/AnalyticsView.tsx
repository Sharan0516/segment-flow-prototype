import { useMemo, useState } from 'react';
import {
  ChevronDown, ChevronRight, Pause, Play, Rocket, Mail, Activity,
  MessageSquare, CheckCircle2, ArrowUpRight, ArrowDownRight, TrendingUp,
} from 'lucide-react';
import type { LifecycleState, MessageStep, Segment, Sequence } from '@/lib/types';
import { LinkedinIcon } from '@/components/icons/LinkedinIcon';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

type Range = '7d' | '30d' | '90d';

interface AnalyticsViewProps {
  state: LifecycleState;
  segments: Segment[];
  sequences: Sequence[];
  onLaunchSegment: (segmentId: string) => void;
  onPauseSegment: (segmentId: string) => void;
  onResumeSegment: (segmentId: string) => void;
}

export function AnalyticsView({
  state,
  segments,
  sequences,
  onLaunchSegment,
  onPauseSegment,
  onResumeSegment,
}: AnalyticsViewProps) {
  const [range, setRange] = useState<Range>('30d');
  const [intentOpen, setIntentOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const customSegments = segments.filter((s) => !s.isDefault);
  const liveSegments = customSegments.filter((s) => s.status === 'live');
  const pausedSegments = customSegments.filter((s) => s.status === 'paused');
  const isFinished = state === 'finished';

  // Synthetic numbers derived from in-flight lead volume so they react to launches/pauses.
  const inFlight = [...liveSegments, ...pausedSegments].reduce(
    (sum, s) => sum + s.matchedLeadIds.length,
    0,
  );
  const rangeMultiplier = range === '7d' ? 0.3 : range === '30d' ? 1 : 2.6;

  // Email metrics
  const emailSentAll = Math.round(inFlight * 1.5 * (isFinished ? 1.4 : 1));
  const emailSentNew = Math.round(emailSentAll * 0.6 * rangeMultiplier);
  const emailBounced = Math.round(emailSentAll * 0.3);
  const emailBounceRate = emailSentAll > 0 ? (emailBounced / emailSentAll) * 100 : 0;
  const emailResponses = Math.round(emailSentAll * 0.05);
  const emailResponseRate = emailSentAll > 0 ? (emailResponses / emailSentAll) * 100 : 0;

  // LinkedIn metrics
  const liRequests = Math.round(inFlight * 0.4 * (isFinished ? 1.4 : 1));
  const liAccepted = Math.round(liRequests * 0.4);
  const liAcceptedRate = liRequests > 0 ? (liAccepted / liRequests) * 100 : 0;
  const liMessaged = Math.round(liAccepted * 0.8);
  const liMessagedRate = liAccepted > 0 ? (liMessaged / liAccepted) * 100 : 0;
  const liResponses = Math.round(liMessaged * 0.1);
  const liResponseRate = liMessaged > 0 ? (liResponses / liMessaged) * 100 : 0;

  // Activity trend points (30 days, spike near the end if there's any activity)
  const trendPoints = useMemo(() => buildTrendPoints(emailSentAll, emailResponses, liRequests, liResponses), [
    emailSentAll, emailResponses, liRequests, liResponses,
  ]);

  if (customSegments.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <div className="text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Activity className="h-5 w-5" />
          </div>
          <div className="mt-3 text-sm font-semibold text-foreground">Nothing to report yet</div>
          <div className="mt-1 max-w-sm text-xs text-muted-foreground">
            Create a segment from the Leads tab to start a campaign.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header + range toggle */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Performance</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Email and LinkedIn outreach analytics</p>
        </div>
        <RangeToggle range={range} onChange={setRange} />
      </div>

      {/* Email section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-medium text-foreground">
          <Mail className="h-3.5 w-3.5" />
          Email
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricCard label="Sent (New)" value={emailSentNew} />
          <MetricCard label="Sent (All)" value={emailSentAll} />
          <MetricCard label="Bounced" value={emailBounced} pct={emailBounceRate} tone={emailBounceRate > 5 ? 'warning' : 'muted'} />
          <MetricCard label="Responses" value={emailResponses} pct={emailResponseRate} tone="success" />
        </div>
        <button
          onClick={() => setIntentOpen((o) => !o)}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          {intentOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          Intent breakdown
        </button>
        {intentOpen && (
          <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-4 text-xs text-muted-foreground">
            Positive / Neutral / Negative intent classification will appear here once responses come in.
          </div>
        )}
      </section>

      {/* LinkedIn section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-medium text-foreground">
          <LinkedinIcon className="h-3.5 w-3.5" />
          LinkedIn
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricCard label="Requests Sent" value={liRequests} />
          <MetricCard label="Accepted" value={liAccepted} pct={liAcceptedRate} tone="success" />
          <MetricCard label="Messaged" value={liMessaged} pct={liMessagedRate} tone="primary" />
          <MetricCard label="Responses" value={liResponses} pct={liResponseRate} tone="success" />
        </div>
      </section>

      {/* Activity Trend chart */}
      <section className="space-y-2">
        <div className="text-xs font-medium text-foreground">Activity Trend</div>
        <ActivityTrendChart points={trendPoints} />
      </section>

      {/* Performance by segment — expandable rows */}
      <section>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-5 py-3">
            <h3 className="text-sm font-semibold text-foreground">Performance by segment</h3>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Click a row for per-step funnel
            </span>
          </div>
          <div className="divide-y divide-border">
            {customSegments.map((seg) => (
              <SegmentRow
                key={seg.id}
                segment={seg}
                sequence={sequences.find((s) => s.id === seg.sequenceId)}
                expanded={expandedId === seg.id}
                isFinished={isFinished}
                onToggleExpand={() => setExpandedId((cur) => (cur === seg.id ? null : seg.id))}
                onLaunch={() => onLaunchSegment(seg.id)}
                onPause={() => onPauseSegment(seg.id)}
                onResume={() => onResumeSegment(seg.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Retrospective only in finished state */}
      {isFinished && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/15 text-success">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">What worked</h3>
            </div>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <ArrowUpRight className="mt-0.5 h-3 w-3 shrink-0 text-success" />
                Senior Leaders segment had 2.3x higher reply rate than Default
              </li>
              <li className="flex items-start gap-2">
                <ArrowUpRight className="mt-0.5 h-3 w-3 shrink-0 text-success" />
                Step 2 follow-up drove the majority of replies
              </li>
              <li className="flex items-start gap-2">
                <ArrowUpRight className="mt-0.5 h-3 w-3 shrink-0 text-success" />
                Bounce rate stayed under 5% — sender deliverability healthy
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning/15 text-warning">
                <MessageSquare className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">What to try next</h3>
            </div>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <ArrowDownRight className="mt-0.5 h-3 w-3 shrink-0 text-warning" />
                Procurement segment underperformed on replies — test new subject lines
              </li>
              <li className="flex items-start gap-2">
                <ArrowDownRight className="mt-0.5 h-3 w-3 shrink-0 text-warning" />
                25% of leads had no email — build LinkedIn-only segment next campaign
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                Clone the Senior Leaders sequence as a template for the next Pharma campaign
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ----- Range toggle ----------------------------------------------------------

function RangeToggle({ range, onChange }: { range: Range; onChange: (r: Range) => void }) {
  const options: Range[] = ['7d', '30d', '90d'];
  return (
    <div className="inline-flex h-8 items-center rounded-lg border border-border bg-card p-0.5 text-xs">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cn(
            'rounded-md px-2.5 py-1 font-medium transition-colors',
            range === opt
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ----- Metric card -----------------------------------------------------------

function MetricCard({
  label,
  value,
  pct,
  tone = 'muted',
}: {
  label: string;
  value: number;
  pct?: number;
  tone?: 'primary' | 'success' | 'warning' | 'muted';
}) {
  const pctTone = {
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    muted: 'text-muted-foreground',
  }[tone];
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="text-2xl font-semibold tabular-nums text-foreground">{value}</div>
        {pct !== undefined && (
          <span className={cn('text-xs font-medium tabular-nums', pctTone)}>
            {pct.toFixed(1)}%
          </span>
        )}
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

// ----- Activity trend chart --------------------------------------------------

interface TrendPoint {
  day: number;            // 0..N-1
  emailSent: number;
  emailReplies: number;
  liSent: number;
  liReplies: number;
}

function buildTrendPoints(
  emailTotal: number,
  emailReplies: number,
  liTotal: number,
  liReplies: number,
): TrendPoint[] {
  const days = 30;
  const points: TrendPoint[] = [];
  // Activity concentrated in the last 7 days, peak ~day 25
  for (let d = 0; d < days; d++) {
    const peakDist = Math.abs(d - 25);
    const weight = Math.exp(-Math.pow(peakDist / 4, 2)); // gaussian around day 25
    const emailSent = Math.round(emailTotal * weight * 0.15);
    const eReplies = Math.round(emailReplies * weight * 0.2);
    const lSent = Math.round(liTotal * weight * 0.15);
    const lReplies = Math.round(liReplies * weight * 0.2);
    points.push({ day: d, emailSent, emailReplies: eReplies, liSent: lSent, liReplies: lReplies });
  }
  return points;
}

function ActivityTrendChart({ points }: { points: TrendPoint[] }) {
  const w = 760, h = 200, padX = 32, padY = 12;
  const maxY = Math.max(
    1,
    ...points.flatMap((p) => [p.emailSent, p.emailReplies, p.liSent, p.liReplies]),
  );
  const xFor = (d: number) => padX + (d / (points.length - 1)) * (w - padX * 2);
  const yFor = (v: number) => h - padY - (v / maxY) * (h - padY * 2);

  const toPath = (key: keyof Omit<TrendPoint, 'day'>) =>
    points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(p.day).toFixed(1)} ${yFor(p[key]).toFixed(1)}`).join(' ');

  const series = [
    { key: 'emailSent' as const,    label: 'Email Sent',     color: '#E94D35' },
    { key: 'emailReplies' as const, label: 'Email Replies',  color: '#F97316' },
    { key: 'liSent' as const,       label: 'LinkedIn Sent',  color: '#3B82F6' },
    { key: 'liReplies' as const,    label: 'LinkedIn Replies', color: '#6366F1' },
  ];

  // X-axis tick labels (every 5 days approximated)
  const tickIdx = [0, 5, 10, 15, 20, 25, 29];
  const dayLabel = (i: number) => {
    const monthDay = i + 1; // synthetic — Apr 18 + i in screenshot, but prototype label is fine
    return `${monthDay}`;
  };

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-[200px] w-full">
        {/* gridlines */}
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line key={g} x1={padX} x2={w - padX} y1={h - padY - g * (h - padY * 2)} y2={h - padY - g * (h - padY * 2)} stroke="hsl(var(--border))" strokeDasharray="2 4" />
        ))}
        {/* y-axis labels */}
        <text x={4} y={yFor(maxY)} dy="4" className="fill-muted-foreground" fontSize="10">{maxY}</text>
        <text x={4} y={yFor(maxY / 2)} dy="4" className="fill-muted-foreground" fontSize="10">{Math.round(maxY / 2)}</text>
        <text x={4} y={yFor(0)} dy="4" className="fill-muted-foreground" fontSize="10">0</text>
        {/* x-axis labels */}
        {tickIdx.map((i) => (
          <text key={i} x={xFor(i)} y={h - 1} textAnchor="middle" className="fill-muted-foreground" fontSize="10">
            d{dayLabel(i)}
          </text>
        ))}
        {/* series */}
        {series.map((s) => (
          <path
            key={s.key}
            d={toPath(s.key)}
            fill="none"
            stroke={s.color}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[11px] text-muted-foreground">
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 rounded-full" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ----- Per-segment row -------------------------------------------------------

function SegmentRow({
  segment,
  sequence,
  expanded,
  isFinished,
  onToggleExpand,
  onLaunch,
  onPause,
  onResume,
}: {
  segment: Segment;
  sequence?: Sequence;
  expanded: boolean;
  isFinished: boolean;
  onToggleExpand: () => void;
  onLaunch: () => void;
  onPause: () => void;
  onResume: () => void;
}) {
  const total = segment.matchedLeadIds.length;
  const isDraft = segment.status === 'draft';
  const isLive = segment.status === 'live';
  const isPaused = segment.status === 'paused';
  const isDone = segment.status === 'done' || isFinished;

  const stepFunnel = useMemo(() => {
    if (!sequence?.messageSteps) return [];
    const baseFalloff = isLive ? 0.85 : isPaused ? 0.7 : isDone ? 1 : 0;
    return sequence.messageSteps.map((step, idx) => {
      const reach = baseFalloff > 0 ? Math.max(0, Math.round(total * Math.pow(baseFalloff, idx + 1))) : 0;
      const replied = Math.round(reach * 0.08);
      const bounced = Math.round(reach * 0.05);
      return { step, reach, replied, bounced };
    });
  }, [sequence, total, isLive, isPaused, isDone]);

  const totalSent = stepFunnel.reduce((sum, s) => sum + s.reach, 0);
  const totalReplied = stepFunnel.reduce((sum, s) => sum + s.replied, 0);
  const totalBounced = stepFunnel.reduce((sum, s) => sum + s.bounced, 0);

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
            <span className="text-xs text-muted-foreground">· {total} lead{total === 1 ? '' : 's'}</span>
            {sequence && <span className="text-xs text-muted-foreground">· {sequence.name}</span>}
          </div>

          {isDraft ? (
            <div className="mt-1.5 text-xs text-muted-foreground">
              Not launched yet. Press Launch to begin outreach for this segment.
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-4">
              <ProgressBar
                sent={totalSent}
                replied={totalReplied}
                total={total * (sequence?.messageSteps?.length ?? 1)}
              />
              <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                <span><span className="text-foreground tabular-nums">{totalSent}</span> sent</span>
                <span><span className="text-foreground tabular-nums">{totalReplied}</span> replied</span>
                {totalBounced > 0 && (
                  <span><span className="text-warning tabular-nums">{totalBounced}</span> bounced</span>
                )}
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
              {stepFunnel.map(({ step, reach, replied, bounced }, idx) => (
                <StepRow
                  key={step.id}
                  step={step}
                  idx={idx}
                  reach={reach}
                  replied={replied}
                  bounced={bounced}
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
  step, idx, reach, replied, bounced, total, active,
}: {
  step: MessageStep;
  idx: number;
  reach: number;
  replied: number;
  bounced: number;
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
          <FunnelStat label="sent" value={reach} total={total} active={active} />
          <FunnelStat label="replied" value={replied} total={reach || 1} active={active} tone="success" />
          <FunnelStat label="bounced" value={bounced} total={reach || 1} active={active} tone="warning" />
        </div>
      </div>
    </div>
  );
}

function FunnelStat({
  label, value, total, active, tone,
}: {
  label: string;
  value: number;
  total: number;
  active: boolean;
  tone?: 'success' | 'warning';
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="text-center">
      <div
        className={cn(
          'tabular-nums font-semibold',
          tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : 'text-foreground',
        )}
      >
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label} {active && pct > 0 ? `· ${pct}%` : ''}
      </div>
    </div>
  );
}

function ProgressBar({ sent, replied, total }: { sent: number; replied: number; total: number }) {
  const pctSent = total > 0 ? (sent / total) * 100 : 0;
  const pctReplied = total > 0 ? (replied / total) * 100 : 0;
  return (
    <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
      <div className="absolute inset-y-0 left-0 bg-primary" style={{ width: `${pctSent}%` }} />
      <div className="absolute inset-y-0 left-0 bg-success" style={{ width: `${pctReplied}%` }} />
    </div>
  );
}
