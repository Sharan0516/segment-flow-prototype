import { Eye, Pencil, Plus, ArrowUpRight, Rocket, Pause, Play, Copy, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { SegmentCreationPanel } from '@/components/SegmentCreationPanel';
import { cn } from '@/lib/utils';
import type { Lead, Segment, Sequence, Sender, SegmentStatus } from '@/lib/types';

interface SegmentsViewProps {
  leads: Lead[];
  segments: Segment[];
  sequences: Sequence[];
  senders: Sender[];
  onAddSegment: (s: Omit<Segment, 'id'>, resolution: 'skip' | 'move') => void;
  onUpdateSegment?: (segmentId: string, patch: Partial<Segment>) => void;
  onJumpToLeads?: (segmentId: string) => void;
  onLaunchSegment?: (segmentId: string) => void;
  onPauseSegment?: (segmentId: string) => void;
  onResumeSegment?: (segmentId: string) => void;
  onDuplicateSegment?: (segmentId: string) => void;
  onDeleteSegment?: (segmentId: string) => void;
}

const statusMeta: Record<SegmentStatus | 'fallback', { label: string; tone: string; dotTone: string }> = {
  draft: { label: 'Draft', tone: 'text-muted-foreground', dotTone: 'bg-muted-foreground' },
  live: { label: 'Live', tone: 'text-success', dotTone: 'bg-success animate-pulse' },
  paused: { label: 'Paused', tone: 'text-warning', dotTone: 'bg-warning' },
  done: { label: 'Done', tone: 'text-muted-foreground', dotTone: 'bg-muted-foreground/60' },
  fallback: { label: '—', tone: 'text-muted-foreground/70', dotTone: 'bg-muted-foreground/30' },
};

export function SegmentsView({
  leads,
  segments,
  sequences,
  senders,
  onAddSegment,
  onUpdateSegment,
  onJumpToLeads,
  onLaunchSegment,
  onPauseSegment,
  onResumeSegment,
  onDuplicateSegment,
  onDeleteSegment,
}: SegmentsViewProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);

  const openCreatePanel = () => {
    setEditingSegmentId(null);
    setPanelOpen(true);
  };
  const openEditPanel = (segmentId: string) => {
    setEditingSegmentId(segmentId);
    setPanelOpen(true);
  };
  const closePanel = () => {
    setPanelOpen(false);
    setEditingSegmentId(null);
  };

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
          <Button onClick={() => openCreatePanel()}>
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
                      onClick={() => openCreatePanel()}
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
                    onJumpToLeads={onJumpToLeads}
                    onEdit={openEditPanel}
                    onLaunch={onLaunchSegment}
                    onPause={onPauseSegment}
                    onResume={onResumeSegment}
                    onDuplicate={onDuplicateSegment}
                    onDelete={onDeleteSegment}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      <SegmentCreationPanel
        open={panelOpen}
        onClose={closePanel}
        leads={leads}
        sequences={sequences}
        senders={senders}
        existingSegments={segments}
        editSegmentId={editingSegmentId}
        onSave={(seg, resolution) => {
          onAddSegment(seg, resolution);
          closePanel();
        }}
        onUpdate={(id, patch) => {
          onUpdateSegment?.(id, patch);
          closePanel();
        }}
      />
    </>
  );
}

function SegmentRow({
  segment,
  sequences,
  senders,
  onJumpToLeads,
  onEdit,
  onLaunch,
  onPause,
  onResume,
  onDuplicate,
  onDelete,
}: {
  segment: Segment;
  sequences: Sequence[];
  senders: Sender[];
  onJumpToLeads?: (segmentId: string) => void;
  onEdit?: (segmentId: string) => void;
  onLaunch?: (segmentId: string) => void;
  onPause?: (segmentId: string) => void;
  onResume?: (segmentId: string) => void;
  onDuplicate?: (segmentId: string) => void;
  onDelete?: (segmentId: string) => void;
}) {
  const sequence = sequences.find((s) => s.id === segment.sequenceId);
  const isDefault = segment.isDefault;
  const senderMode = segment.senderMode;
  const sendersCount =
    senderMode === 'campaign-pool' ? senders.length : segment.segmentSenderIds?.length ?? 0;
  const statusKey = isDefault ? 'fallback' : segment.status;
  const s = statusMeta[statusKey];
  const hasMailbox = senders.length > 0;

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
          {/* Primary status action: Launch / Pause / Resume */}
          {!isDefault && segment.status === 'draft' && (
            <Tooltip content={hasMailbox ? undefined : 'Add a mailbox in Settings before launching.'}>
              <Button
                size="sm"
                disabled={!hasMailbox}
                onClick={() => onLaunch?.(segment.id)}
              >
                <Rocket className="h-3 w-3" />
                Launch
              </Button>
            </Tooltip>
          )}
          {!isDefault && segment.status === 'live' && (
            <Button variant="outline" size="sm" onClick={() => onPause?.(segment.id)}>
              <Pause className="h-3 w-3" />
              Pause
            </Button>
          )}
          {!isDefault && segment.status === 'paused' && (
            <Button size="sm" onClick={() => onResume?.(segment.id)}>
              <Play className="h-3 w-3" />
              Resume
            </Button>
          )}

          <Tooltip content="View this segment's leads">
            <button
              onClick={() => onJumpToLeads?.(segment.id)}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-card px-2 text-xs text-foreground hover:bg-accent"
            >
              <Eye className="h-3 w-3" />
              View
              <ArrowUpRight className="h-3 w-3" />
            </button>
          </Tooltip>

          {!isDefault && (
            <Tooltip
              content={
                segment.status === 'live'
                  ? 'Pause this segment to edit audience. Name, message, and senders are editable at any time.'
                  : 'Edit this segment'
              }
            >
              <button
                onClick={() => onEdit?.(segment.id)}
                className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-card px-2 text-xs text-foreground hover:bg-accent"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
            </Tooltip>
          )}

          {!isDefault && (
            <Tooltip content="Duplicate this segment">
              <button
                onClick={() => onDuplicate?.(segment.id)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Copy className="h-3 w-3" />
              </button>
            </Tooltip>
          )}

          {!isDefault && (
            <Tooltip content={segment.status === 'live' ? 'Pause the segment before deleting it.' : 'Delete this segment'}>
              <button
                onClick={() => onDelete?.(segment.id)}
                disabled={segment.status === 'live'}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:bg-destructive/10 hover:text-destructive-foreground disabled:opacity-40"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </Tooltip>
          )}
        </div>
      </td>
    </tr>
  );
}
