import { useEffect, useState } from 'react';
import { Rocket, Layers, Clock, AlertTriangle, CheckCircle2, Mail, Activity } from 'lucide-react';
import type { Lead, Segment, Sender, Sequence } from '@/lib/types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Checkbox } from './ui/Checkbox';
import { cn } from '@/lib/utils';

interface LaunchModalProps {
  open: boolean;
  onClose: () => void;
  /** Launches each picked segment (flips status draft to live). */
  onLaunchSegments: (segmentIds: string[]) => void;
  leads: Lead[];
  segments: Segment[];
  sequences: Sequence[];
  senders: Sender[];
}

export function LaunchModal({
  open,
  onClose,
  onLaunchSegments,
  leads,
  segments,
  sequences,
  senders,
}: LaunchModalProps) {
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const customSegments = segments.filter((s) => !s.isDefault);
  const draftSegments = customSegments.filter((s) => s.status === 'draft');
  const liveSegments = customSegments.filter((s) => s.status === 'live');
  const pausedSegments = customSegments.filter((s) => s.status === 'paused');

  useEffect(() => {
    if (!open) return;
    // Default: all draft segments checked
    setPicked(new Set(draftSegments.map((s) => s.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const activeSenders = senders.filter((s) => s.status === 'active');
  const hasSenders = activeSenders.length > 0;

  const toggleSegment = (id: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const pickedSegments = customSegments.filter((s) => picked.has(s.id));
  const pickedLeadCount = pickedSegments.reduce(
    (sum, s) => sum + s.matchedLeadIds.filter((id) => leads.find((l) => l.id === id && (l.email || l.linkedinUrl))).length,
    0,
  );
  const canLaunch = hasSenders && picked.size > 0;

  const handleLaunch = () => {
    onLaunchSegments(Array.from(picked));
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="px-6 py-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Rocket className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">Launch segments</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Pick the segments you want to start sending. You can launch more later.
            </p>
          </div>
        </div>
      </div>

      {/* Draft segments (selectable) */}
      <div className="space-y-2 border-t border-border bg-surface px-6 py-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Draft segments {draftSegments.length > 0 && `(${draftSegments.length})`}
        </div>

        {draftSegments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-secondary/30 px-3 py-6 text-center text-xs text-muted-foreground">
            No draft segments. Create one or wait for an existing segment to be paused.
          </div>
        ) : (
          draftSegments.map((segment) => (
            <SegmentLaunchRow
              key={segment.id}
              segment={segment}
              sequence={sequences.find((s) => s.id === segment.sequenceId)}
              senderCount={
                segment.senderMode === 'campaign-pool'
                  ? activeSenders.length
                  : segment.segmentSenderIds?.length ?? 0
              }
              checked={picked.has(segment.id)}
              onToggle={() => toggleSegment(segment.id)}
              status="draft"
            />
          ))
        )}
      </div>

      {/* Already-live / paused segments (read-only) */}
      {(liveSegments.length > 0 || pausedSegments.length > 0) && (
        <div className="space-y-2 border-t border-border bg-surface/50 px-6 py-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Already in flight
          </div>
          {liveSegments.map((segment) => (
            <SegmentLaunchRow
              key={segment.id}
              segment={segment}
              sequence={sequences.find((s) => s.id === segment.sequenceId)}
              senderCount={
                segment.senderMode === 'campaign-pool'
                  ? activeSenders.length
                  : segment.segmentSenderIds?.length ?? 0
              }
              status="live"
              readOnly
            />
          ))}
          {pausedSegments.map((segment) => (
            <SegmentLaunchRow
              key={segment.id}
              segment={segment}
              sequence={sequences.find((s) => s.id === segment.sequenceId)}
              senderCount={
                segment.senderMode === 'campaign-pool'
                  ? activeSenders.length
                  : segment.segmentSenderIds?.length ?? 0
              }
              status="paused"
              readOnly
            />
          ))}
        </div>
      )}

      {/* Sender + schedule recap */}
      <div className="space-y-2 border-t border-border bg-surface px-6 py-5">
        <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
          <div
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
              hasSenders ? 'bg-primary/15 text-primary' : 'bg-warning/15 text-warning',
            )}
          >
            <Mail className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1 text-sm">
            <div className="font-medium text-foreground">
              {hasSenders
                ? `Sending from ${activeSenders.length} mailbox${activeSenders.length === 1 ? '' : 'es'}`
                : 'No senders configured'}
            </div>
            <div className="mt-0.5 text-xs">
              {hasSenders ? (
                <>
                  <span className="text-foreground">{activeSenders.map((s) => s.email).join(', ')}</span>
                  <span className="text-muted-foreground">
                    {' '}· Round-robin · Daily cap: {activeSenders.reduce((a, s) => a + s.dailyCap, 0)}
                  </span>
                </>
              ) : (
                <span className="text-warning">Add a mailbox in Settings before launching.</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Clock className="h-3.5 w-3.5" />
          </div>
          <div className="text-sm">
            <div className="font-medium text-foreground">Send window</div>
            <div className="mt-0.5 text-xs">
              <span className="text-foreground">Mon to Fri, 9am to 5pm</span>
              <span className="text-muted-foreground"> in each recipient's local timezone</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border bg-card px-6 py-3">
        <span className="text-xs">
          {canLaunch ? (
            <span className="inline-flex items-center gap-1 text-success">
              <CheckCircle2 className="h-3 w-3" />
              Launching {picked.size} segment{picked.size === 1 ? '' : 's'} · {pickedLeadCount} lead{pickedLeadCount === 1 ? '' : 's'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-warning">
              <AlertTriangle className="h-3 w-3" />
              {!hasSenders ? 'Add a mailbox first' : 'Pick at least one segment'}
            </span>
          )}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleLaunch} disabled={!canLaunch}>
            <Rocket className="h-4 w-4" />
            {picked.size === 0 ? 'Pick a segment' : `Launch ${picked.size} segment${picked.size === 1 ? '' : 's'}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function SegmentLaunchRow({
  segment,
  sequence,
  senderCount,
  checked,
  onToggle,
  status,
  readOnly,
}: {
  segment: Segment;
  sequence?: Sequence;
  senderCount: number;
  checked?: boolean;
  onToggle?: () => void;
  status: 'draft' | 'live' | 'paused';
  readOnly?: boolean;
}) {
  const statusLabel = {
    draft: 'Draft',
    live: 'Live',
    paused: 'Paused',
  }[status];
  const statusTone = {
    draft: 'bg-muted text-muted-foreground',
    live: 'bg-success/10 text-success',
    paused: 'bg-warning/10 text-warning',
  }[status];

  const Wrap = readOnly ? 'div' : 'button';

  return (
    <Wrap
      type={readOnly ? undefined : 'button'}
      onClick={readOnly ? undefined : onToggle}
      className={cn(
        'block w-full rounded-lg border text-left transition-all',
        readOnly
          ? 'cursor-default border-border bg-card/40'
          : checked
          ? 'border-primary/40 bg-primary/5'
          : 'border-border bg-card opacity-80 hover:opacity-100',
      )}
    >
      <div className="flex items-start gap-3 p-3">
        {!readOnly && (
          <div className="mt-0.5">
            <Checkbox checked={!!checked} onChange={onToggle} />
          </div>
        )}
        <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', readOnly ? 'bg-muted text-muted-foreground' : checked ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')}>
          {status === 'live' ? <Activity className="h-3.5 w-3.5" /> : <Layers className="h-3.5 w-3.5" />}
        </div>
        <div className="min-w-0 flex-1 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-foreground">{segment.name}</span>
            <span className={cn('inline-flex rounded-full px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wider', statusTone)}>
              {statusLabel}
            </span>
            <span className="text-xs text-muted-foreground">
              · {segment.matchedLeadIds.length} lead{segment.matchedLeadIds.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="mt-0.5 text-xs">
            {sequence ? (
              <>
                via <span className="text-foreground">{sequence.name}</span>
                <span className="text-muted-foreground">
                  {' '}· {sequence.steps} step{sequence.steps === 1 ? '' : 's'} · {sequence.durationDays} days
                </span>
              </>
            ) : (
              <span className="text-warning">No sequence assigned</span>
            )}
            <span className={cn('ml-2', senderCount === 0 ? 'text-warning' : 'text-muted-foreground')}>
              · {senderCount} mailbox{senderCount === 1 ? '' : 'es'}
            </span>
          </div>
        </div>
      </div>
    </Wrap>
  );
}
