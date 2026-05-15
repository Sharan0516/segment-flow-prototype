import { useEffect, useState } from 'react';
import { Rocket, Users, Mail, Layers, Clock, AlertTriangle, CheckCircle2, Beaker } from 'lucide-react';
import type { Lead, Segment, Sender, Sequence } from '@/lib/types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Checkbox } from './ui/Checkbox';
import { cn } from '@/lib/utils';

interface LaunchModalProps {
  open: boolean;
  onClose: () => void;
  onLaunch: () => void;
  leads: Lead[];
  segments: Segment[];
  sequences: Sequence[];
  senders: Sender[];
  selectedIds: string[];
}

export function LaunchModal({ open, onClose, onLaunch, leads, segments, sequences, senders, selectedIds }: LaunchModalProps) {
  // Segment-launch toggles. Default unchecked (Nandita's no-auto-fallback rule).
  const [enabledSegments, setEnabledSegments] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    // On open, default to all custom segments enabled, Default disabled
    const initial = new Set(segments.filter((s) => !s.isDefault).map((s) => s.id));
    setEnabledSegments(initial);
  }, [open, segments]);

  const inLaunch = leads.filter((l) => selectedIds.includes(l.id));
  const activeSenders = senders.filter((s) => s.status === 'active');
  const hasSenders = activeSenders.length > 0;

  // Routing: first-match-wins. Non-default segments win over Default.
  const customSegments = segments.filter((s) => !s.isDefault);
  const defaultSegment = segments.find((s) => s.isDefault);
  const claimed = new Set<string>();
  const breakdownCustom = customSegments.map((seg) => {
    const inSeg = inLaunch.filter((l) => seg.matchedLeadIds.includes(l.id) && !claimed.has(l.id));
    inSeg.forEach((l) => claimed.add(l.id));
    return { segment: seg, leads: inSeg, sequence: sequences.find((s) => s.id === seg.sequenceId) };
  });
  const defaultLeads = defaultSegment
    ? inLaunch.filter((l) => defaultSegment.matchedLeadIds.includes(l.id) && !claimed.has(l.id))
    : [];
  const segmentBreakdown = [
    ...breakdownCustom,
    ...(defaultSegment ? [{ segment: defaultSegment, leads: defaultLeads, sequence: sequences.find((s) => s.id === defaultSegment.sequenceId) }] : []),
  ];

  // Leads actually going out (only from enabled segments + with channel + sender attached)
  const enabledLeadIds = new Set<string>();
  segmentBreakdown.forEach(({ segment, leads: segLeads }) => {
    if (enabledSegments.has(segment.id)) {
      segLeads.forEach((l) => enabledLeadIds.add(l.id));
    }
  });
  const launchable = inLaunch.filter((l) => enabledLeadIds.has(l.id) && (l.email || l.linkedinUrl));
  const skippedNoChannel = inLaunch.filter((l) => enabledLeadIds.has(l.id) && !l.email && !l.linkedinUrl);
  const notInAnyEnabledSegment = inLaunch.filter((l) => !enabledLeadIds.has(l.id));

  const toggleSegment = (id: string) => {
    setEnabledSegments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canLaunch = hasSenders && launchable.length > 0;

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="px-6 py-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Rocket className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">Launch campaign</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {launchable.length > 0
                ? `Outreach will begin sending to ${launchable.length} lead${launchable.length === 1 ? '' : 's'} immediately.`
                : 'Pick at least one segment to launch.'}
            </p>
          </div>
        </div>
      </div>

      {/* Segment selector */}
      <div className="space-y-2 border-t border-border bg-surface px-6 py-5">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Which segments to launch?</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              Tick each segment you want to send right now. Skip any you're still reviewing.
            </div>
          </div>
        </div>

        {segmentBreakdown.map(({ segment, leads: segLeads, sequence }) => {
          const ab = segment.abTest;
          const variants = ab.enabled && ab.variants.length > 1 ? ab.variants : null;
          const enabled = enabledSegments.has(segment.id);

          return (
            <button
              key={segment.id}
              type="button"
              onClick={() => toggleSegment(segment.id)}
              className={cn(
                'block w-full overflow-hidden rounded-lg border text-left transition-all',
                enabled
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-border bg-card opacity-70 hover:opacity-100',
              )}
            >
              <div className="flex items-start gap-3 p-3">
                <div className="mt-0.5">
                  <Checkbox checked={enabled} onChange={() => toggleSegment(segment.id)} />
                </div>
                <div
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                    enabled ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Layers className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{segment.name}</span>
                    {segment.isDefault && (
                      <span className="rounded-full bg-muted px-1.5 py-0 text-[10px] uppercase tracking-wider text-muted-foreground">
                        Catch-all
                      </span>
                    )}
                    <span className="text-xs font-normal text-muted-foreground">
                      · {segLeads.length} lead{segLeads.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs">
                    {sequence ? (
                      <>
                        via <span className="text-foreground">{sequence.name}</span>
                        <span className="text-muted-foreground"> · {sequence.steps} steps · {sequence.durationDays} days</span>
                        {variants && (
                          <span className="ml-1 inline-flex items-center gap-0.5 rounded bg-primary/15 px-1.5 py-0 text-[10px] font-medium text-primary">
                            <Beaker className="h-2.5 w-2.5" />
                            A/B · {variants.length} variants
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-warning">No sequence assigned</span>
                    )}
                  </div>
                </div>
              </div>
              {enabled && variants && (
                <div className="border-t border-border bg-secondary/20 px-3 py-2">
                  <div className="mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    Split for this segment
                  </div>
                  <div className="mb-1.5 flex h-1.5 overflow-hidden rounded-full bg-muted">
                    {variants.map((v, idx) => {
                      const colors = ['bg-primary', 'bg-blue-500', 'bg-purple-500'];
                      return (
                        <div key={v.id} className={colors[idx % colors.length]} style={{ width: `${v.weight * 100}%` }} />
                      );
                    })}
                  </div>
                  <div className="space-y-1">
                    {variants.map((v, idx) => {
                      const colors = ['bg-primary', 'bg-blue-500', 'bg-purple-500'];
                      const count = Math.round(segLeads.length * v.weight);
                      return (
                        <div key={v.id} className="flex items-center gap-2 text-xs">
                          <span
                            className={cn(
                              'flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white',
                              colors[idx % colors.length],
                            )}
                          >
                            {v.label}
                          </span>
                          <span className="flex-1 truncate text-foreground">{v.angle}</span>
                          <span className="text-muted-foreground">
                            {count} lead{count === 1 ? '' : 's'} · {Math.round(v.weight * 100)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </button>
          );
        })}

        {/* Unassigned warning */}
        {notInAnyEnabledSegment.length > 0 && (
          <div className="mt-2 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
            <div className="text-xs">
              <div className="font-medium text-warning">
                {notInAnyEnabledSegment.length} lead{notInAnyEnabledSegment.length === 1 ? '' : 's'} will not be contacted
              </div>
              <div className="mt-0.5 text-muted-foreground">
                {defaultSegment && !enabledSegments.has(defaultSegment.id) && defaultLeads.length > 0
                  ? `${defaultLeads.length} are on the ${defaultSegment.name} catch-all (unchecked). Tick ${defaultSegment.name} to include them, or assign them to a custom segment first.`
                  : 'These leads aren\'t in any selected segment.'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sender + schedule */}
      <div className="space-y-3 border-t border-border bg-surface px-6 py-5">
        <RecapRow
          icon={Mail}
          title={hasSenders ? `Sending from ${activeSenders.length} mailbox${activeSenders.length === 1 ? '' : 'es'}` : 'No senders configured'}
          subtitle={
            hasSenders ? (
              <>
                <span className="text-foreground">{activeSenders.map((s) => s.email).join(', ')}</span>
                <span className="text-muted-foreground">
                  {' '}
                  · Round-robin · Daily cap: {activeSenders.reduce((a, s) => a + s.dailyCap, 0)}
                </span>
              </>
            ) : (
              <span className="text-warning">Add a mailbox before launching.</span>
            )
          }
          tone={hasSenders ? 'ok' : 'warn'}
        />

        <RecapRow
          icon={Clock}
          title="Send window"
          subtitle={
            <>
              <span className="text-foreground">Mon–Fri, 9am to 5pm</span>
              <span className="text-muted-foreground"> in each recipient's local timezone</span>
            </>
          }
        />
      </div>

      {/* Warnings */}
      {(skippedNoChannel.length > 0 || !hasSenders) && (
        <div className="border-t border-border bg-warning/5 px-6 py-3">
          <div className="text-xs font-medium uppercase tracking-wider text-warning">Heads up</div>
          <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
            {!hasSenders && (
              <li className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-warning" />
                Campaign has no senders. Add a mailbox in Settings before launching.
              </li>
            )}
            {skippedNoChannel.length > 0 && (
              <li className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-destructive-foreground" />
                {skippedNoChannel.length} lead{skippedNoChannel.length === 1 ? ' has' : 's have'} no contactable channel and will be skipped.
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-border bg-card px-6 py-3">
        <span className="text-xs text-muted-foreground">
          {canLaunch ? (
            <span className="inline-flex items-center gap-1 text-success">
              <CheckCircle2 className="h-3 w-3" /> All set
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-warning">
              <AlertTriangle className="h-3 w-3" /> Action required
            </span>
          )}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={onLaunch} disabled={!canLaunch}>
            <Rocket className="h-4 w-4" />
            {launchable.length === 0
              ? 'Pick a segment'
              : `Launch ${launchable.length} lead${launchable.length === 1 ? '' : 's'}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function RecapRow({
  icon: Icon,
  title,
  subtitle,
  tone = 'ok',
  naked = false,
}: {
  icon: typeof Users;
  title: React.ReactNode;
  subtitle: React.ReactNode;
  tone?: 'ok' | 'warn';
  naked?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3',
        naked ? '' : 'rounded-lg border border-border bg-card',
      )}
    >
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
          tone === 'warn' ? 'bg-warning/15 text-warning' : 'bg-primary/15 text-primary',
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1 text-sm">
        <div className="font-medium text-foreground">{title}</div>
        <div className="mt-0.5 text-xs">{subtitle}</div>
      </div>
    </div>
  );
}
