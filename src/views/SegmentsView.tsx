import { Layers, Users, Mail, Send, Workflow, Eye, Pencil, MoreHorizontal, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';
import type { Segment, Sequence, Sender } from '@/lib/types';

interface SegmentsViewProps {
  segments: Segment[];
  sequences: Sequence[];
  senders: Sender[];
  onJumpToLeads?: (segmentId: string) => void;
}

export function SegmentsView({ segments, sequences, senders, onJumpToLeads }: SegmentsViewProps) {
  const customSegments = segments.filter((s) => !s.isDefault);
  const defaultSegment = segments.find((s) => s.isDefault);
  const totalLeads = segments.reduce((sum, s) => sum + s.matchedLeadIds.length, 0);

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-end justify-between">
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
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Each segment is a group of leads that gets its own message flow and senders. Leads belong to exactly one segment.
            Anything not matched falls into the Unassigned fallback.
          </p>
        </div>
      </div>

      {customSegments.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-3">
          {customSegments.map((seg) => (
            <SegmentCard
              key={seg.id}
              segment={seg}
              sequences={sequences}
              senders={senders}
              onJumpToLeads={onJumpToLeads}
            />
          ))}
        </div>
      )}

      {defaultSegment && (
        <div className="pt-2">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Fallback
          </div>
          <SegmentCard
            segment={defaultSegment}
            sequences={sequences}
            senders={senders}
            onJumpToLeads={onJumpToLeads}
          />
        </div>
      )}

      <div className="rounded-lg border border-dashed border-border bg-secondary/30 px-4 py-3 text-xs text-muted-foreground">
        <span className="text-foreground">Coming next:</span> per-segment launch state (Draft / Live / Paused),
        editing existing segments, single-lead unassign, and per-segment progress.
      </div>
    </div>
  );
}

function SegmentCard({
  segment,
  sequences,
  senders,
  onJumpToLeads,
}: {
  segment: Segment;
  sequences: Sequence[];
  senders: Sender[];
  onJumpToLeads?: (segmentId: string) => void;
}) {
  const sequence = sequences.find((s) => s.id === segment.sequenceId);
  const segmentSenderCount = segment.segmentSenderIds?.length ?? 0;
  const isDefault = segment.isDefault;

  return (
    <div
      className={cn(
        'group rounded-xl border bg-card p-4 transition-colors',
        isDefault ? 'border-border/60' : 'border-border hover:border-primary/40',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: name + status + lead count */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('inline-flex items-center gap-1.5 text-base font-semibold', isDefault ? 'text-muted-foreground' : 'text-foreground')}>
              {!isDefault && <span className="h-2 w-2 rounded-full bg-primary" />}
              {segment.name}
            </span>
            {isDefault ? (
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Fallback bucket
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                <Sparkles className="h-2.5 w-2.5" />
                Configured
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {segment.matchedLeadIds.length} lead{segment.matchedLeadIds.length === 1 ? '' : 's'}
            </span>
          </div>

          {/* Three info chips: Flow / Senders / Variants */}
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <InfoChip
              Icon={Workflow}
              label="Message flow"
              value={sequence?.name ?? '— No flow assigned —'}
              sub={
                sequence
                  ? `${sequence.steps} step${sequence.steps === 1 ? '' : 's'} · ${sequence.durationDays} days`
                  : undefined
              }
              source={segment.sequenceSource}
            />
            <InfoChip
              Icon={Mail}
              label="Senders"
              value={
                segment.senderMode === 'campaign-pool'
                  ? `Campaign pool · ${senders.length} mailbox${senders.length === 1 ? '' : 'es'}`
                  : `Segment-specific · ${segmentSenderCount} mailbox${segmentSenderCount === 1 ? '' : 'es'}`
              }
              sub={senders.length === 0 ? 'No mailboxes attached yet' : undefined}
              warn={senders.length === 0}
            />
            <InfoChip
              Icon={Send}
              label="Outreach"
              value="Not launched"
              sub="Per-segment launch ships in Phase B"
            />
          </div>
        </div>

        {/* Right: row actions */}
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onJumpToLeads?.(segment.id)}
          >
            <Eye className="h-3.5 w-3.5" />
            View leads
          </Button>
          <Tooltip
            content={
              <div className="space-y-1">
                <div className="font-semibold text-foreground">Edit coming in Phase C</div>
                <div className="text-muted-foreground">
                  Editing name, message, and senders for existing segments ships in the next update.
                </div>
              </div>
            }
          >
            <Button variant="outline" size="sm" disabled>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </Tooltip>
          <Tooltip
            content={
              <div className="space-y-1">
                <div className="font-semibold text-foreground">Per-segment actions coming</div>
                <div className="text-muted-foreground">
                  Launch, pause, duplicate, delete ship with per-segment launch state.
                </div>
              </div>
            }
          >
            <button
              disabled
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground opacity-50"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

function InfoChip({
  Icon,
  label,
  value,
  sub,
  source,
  warn,
}: {
  Icon: typeof Workflow;
  label: string;
  value: string;
  sub?: string;
  source?: 'use-existing' | 'clone' | 'generate' | 'scratch';
  warn?: boolean;
}) {
  const sourceLabel = source
    ? {
        'use-existing': 'Linked',
        clone: 'Cloned',
        generate: 'AI',
        scratch: 'Custom',
      }[source]
    : null;

  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
        {sourceLabel && (
          <span className="ml-auto rounded bg-muted px-1.5 py-0 text-[9px] font-medium normal-case tracking-normal text-muted-foreground">
            {sourceLabel}
          </span>
        )}
      </div>
      <div className={cn('mt-1 text-sm font-medium', warn ? 'text-warning' : 'text-foreground')}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-8 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Layers className="h-5 w-5" />
      </div>
      <div className="mt-3 text-sm font-semibold text-foreground">No custom segments yet</div>
      <div className="mt-1 text-xs text-muted-foreground">
        Create your first segment from the Leads tab to start grouping leads with different messaging.
      </div>
    </div>
  );
}
