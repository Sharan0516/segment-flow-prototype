import { Eye, Pencil, MoreHorizontal, Plus, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { SegmentCreationPanel } from '@/components/SegmentCreationPanel';
import { cn } from '@/lib/utils';
import type { Lead, LifecycleState, Segment, Sequence, Sender } from '@/lib/types';

interface SegmentsViewProps {
  leads: Lead[];
  segments: Segment[];
  sequences: Sequence[];
  senders: Sender[];
  state: LifecycleState;
  onAddSegment: (s: Omit<Segment, 'id'>, resolution: 'skip' | 'move') => void;
  onJumpToLeads?: (segmentId: string) => void;
}

type StatusKey = 'draft' | 'scheduled' | 'sending' | 'paused' | 'done' | 'fallback';

const statusMeta: Record<StatusKey, { label: string; tone: string; dotTone: string }> = {
  draft: { label: 'Draft', tone: 'text-muted-foreground', dotTone: 'bg-muted-foreground' },
  scheduled: { label: 'Scheduled', tone: 'text-warning', dotTone: 'bg-warning' },
  sending: { label: 'Sending', tone: 'text-success', dotTone: 'bg-success' },
  paused: { label: 'Paused', tone: 'text-warning', dotTone: 'bg-warning' },
  done: { label: 'Done', tone: 'text-muted-foreground', dotTone: 'bg-muted-foreground/60' },
  fallback: { label: '—', tone: 'text-muted-foreground/70', dotTone: 'bg-muted-foreground/30' },
};

function statusFor(segment: Segment, state: LifecycleState, sendersCount: number): StatusKey {
  if (segment.isDefault) return 'fallback';
  if (state === 'finished') return 'done';
  if (state === 'paused') return 'paused';
  if (state === 'running' || state === 'partial') {
    return sendersCount > 0 ? 'sending' : 'scheduled';
  }
  // setup state
  return sendersCount > 0 ? 'scheduled' : 'draft';
}

export function SegmentsView({
  leads,
  segments,
  sequences,
  senders,
  state,
  onAddSegment,
  onJumpToLeads,
}: SegmentsViewProps) {
  const [panelOpen, setPanelOpen] = useState(false);

  const customSegments = segments.filter((s) => !s.isDefault);
  const defaultSegment = segments.find((s) => s.isDefault);
  const totalLeads = segments.reduce((sum, s) => sum + s.matchedLeadIds.length, 0);

  const rows: Segment[] = [...customSegments];
  if (defaultSegment) rows.push(defaultSegment);

  return (
    <>
      <div className="space-y-4 p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Segments
            </div>
            <h1 className="mt-1 text-xl font-semibold text-foreground">
              {customSegments.length} custom segment{customSegments.length === 1 ? '' : 's'}{' '}
              <span className="text-base font-normal text-muted-foreground">
                routing {totalLeads} lead{totalLeads === 1 ? '' : 's'}
              </span>
            </h1>
          </div>
          <Button onClick={() => setPanelOpen(true)}>
            <Plus className="h-4 w-4" />
            New segment
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30 text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5 text-left font-medium">Segment</th>
                <th className="px-4 py-2.5 text-left font-medium">Type</th>
                <th className="px-4 py-2.5 text-right font-medium">Leads</th>
                <th className="px-4 py-2.5 text-left font-medium">Message flow</th>
                <th className="px-4 py-2.5 text-left font-medium">Senders</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No segments yet.{' '}
                    <button
                      onClick={() => setPanelOpen(true)}
                      className="font-medium text-primary hover:underline"
                    >
                      Create your first segment
                    </button>
                  </td>
                </tr>
              ) : (
                rows.map((seg) => (
                  <SegmentRow
                    key={seg.id}
                    segment={seg}
                    sequences={sequences}
                    senders={senders}
                    state={state}
                    onJumpToLeads={onJumpToLeads}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-md border border-dashed border-border bg-secondary/30 px-4 py-2.5 text-xs text-muted-foreground">
          <span className="text-foreground">Coming next:</span> per-segment launch state, in-row edit, and live progress
          (sent / opened / replied) per segment.
        </div>
      </div>

      <SegmentCreationPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        leads={leads}
        sequences={sequences}
        senders={senders}
        existingSegments={segments}
        onSave={(seg, resolution) => {
          onAddSegment(seg, resolution);
          setPanelOpen(false);
        }}
      />
    </>
  );
}

function SegmentRow({
  segment,
  sequences,
  senders,
  state,
  onJumpToLeads,
}: {
  segment: Segment;
  sequences: Sequence[];
  senders: Sender[];
  state: LifecycleState;
  onJumpToLeads?: (segmentId: string) => void;
}) {
  const sequence = sequences.find((s) => s.id === segment.sequenceId);
  const isDefault = segment.isDefault;
  const senderMode = segment.senderMode;
  const sendersCount =
    senderMode === 'campaign-pool' ? senders.length : segment.segmentSenderIds?.length ?? 0;
  const status = statusFor(segment, state, sendersCount);
  const s = statusMeta[status];

  return (
    <tr className="border-b border-border/50 hover:bg-accent/30">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full', isDefault ? 'bg-muted-foreground/40' : 'bg-primary')} />
          <span className={cn('font-medium', isDefault ? 'text-muted-foreground' : 'text-foreground')}>
            {segment.name}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={cn(
            'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
            isDefault ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary',
          )}
        >
          {isDefault ? 'Fallback' : 'Custom'}
        </span>
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-foreground">
        {segment.matchedLeadIds.length}
      </td>
      <td className="px-4 py-3">
        {sequence ? (
          <div className="text-foreground">
            <div className="truncate" title={sequence.name}>
              {sequence.name}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {sequence.steps} steps · {sequence.durationDays} days
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className={cn(senders.length === 0 ? 'text-warning' : 'text-foreground')}>
          {senderMode === 'campaign-pool'
            ? `Campaign pool · ${senders.length}`
            : `Segment-specific · ${sendersCount}`}
        </div>
        {senders.length === 0 && (
          <div className="text-[11px] text-warning">No mailboxes attached</div>
        )}
      </td>
      <td className="px-4 py-3">
        <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', s.tone)}>
          <span className={cn('h-1.5 w-1.5 rounded-full', s.dotTone)} />
          {s.label}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <Tooltip content="View this segment's leads in the Leads tab">
            <button
              onClick={() => onJumpToLeads?.(segment.id)}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-card px-2 text-xs text-foreground hover:bg-accent"
            >
              <Eye className="h-3 w-3" />
              View
              <ArrowUpRight className="h-3 w-3" />
            </button>
          </Tooltip>
          <Tooltip
            content={
              <div className="space-y-1">
                <div className="font-semibold text-foreground">Edit ships in Phase C</div>
                <div className="text-muted-foreground">
                  Editing name, message, and senders for existing segments comes with per-segment launch state.
                </div>
              </div>
            }
          >
            <button
              disabled
              className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-card px-2 text-xs text-muted-foreground opacity-50"
            >
              <Pencil className="h-3 w-3" />
              Edit
            </button>
          </Tooltip>
          <Tooltip content="Launch, pause, duplicate, delete ship with per-segment launch state.">
            <button
              disabled
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground opacity-50"
            >
              <MoreHorizontal className="h-3 w-3" />
            </button>
          </Tooltip>
        </div>
      </td>
    </tr>
  );
}
