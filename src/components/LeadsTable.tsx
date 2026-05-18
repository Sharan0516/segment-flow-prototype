import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpDown, MoreHorizontal, ArrowRightLeft, X, Lock, Check,
} from 'lucide-react';
import type { Lead, Segment, Sequence } from '@/lib/types';
import { Checkbox } from './ui/Checkbox';
import { ScoreBadge } from './ScoreBadge';
import { VerificationCell } from './VerificationCell';
import { ColumnHeaderFilter } from './ColumnHeaderFilter';
import { cn } from '@/lib/utils';

interface LeadsTableProps {
  leads: Lead[];
  segments: Segment[];
  sequences: Sequence[];
  activeSegmentId: string | 'all';
  selectedIds: string[];
  onSelectedChange: (ids: string[]) => void;
  /** Move a single lead to a segment, or pass null to unassign. */
  onMoveLead?: (leadId: string, segmentId: string | null) => void;
  /** Which columns are visible. Controlled from outside so the toolbar Columns button can drive it. */
  visibleColumns: Set<ColumnId>;
}

type SortKey = 'name' | 'score' | 'company';
type SortDir = 'asc' | 'desc';

// All available columns. The toolbar Columns picker reads from this list.
export type ColumnId =
  | 'name'
  | 'title'
  | 'company'
  | 'location'
  | 'verification'
  | 'workEmail'
  | 'phone'
  | 'score'
  | 'outreach'
  | 'sequence'
  | 'source'
  | 'lastActivity'
  | 'segment';

export const COLUMN_SPEC: { id: ColumnId; label: string; defaultVisible: boolean; pinned?: boolean }[] = [
  { id: 'name', label: 'Name', defaultVisible: true, pinned: true },
  { id: 'title', label: 'Title', defaultVisible: true },
  { id: 'company', label: 'Company', defaultVisible: true },
  { id: 'location', label: 'Location', defaultVisible: true },
  { id: 'verification', label: 'Verification', defaultVisible: true },
  { id: 'workEmail', label: 'Work Email', defaultVisible: false },
  { id: 'phone', label: 'Phone', defaultVisible: false },
  { id: 'score', label: 'Score', defaultVisible: true },
  { id: 'outreach', label: 'Outreach', defaultVisible: true },
  { id: 'sequence', label: 'Sequence', defaultVisible: false },
  { id: 'source', label: 'Assignment source', defaultVisible: false },
  { id: 'lastActivity', label: 'Last activity', defaultVisible: false },
  { id: 'segment', label: 'Segment', defaultVisible: true },
];

export const defaultVisibleColumns = (): Set<ColumnId> =>
  new Set(COLUMN_SPEC.filter((c) => c.defaultVisible).map((c) => c.id));

export function LeadsTable({
  leads,
  segments,
  sequences,
  activeSegmentId,
  selectedIds,
  onSelectedChange,
  onMoveLead,
  visibleColumns,
}: LeadsTableProps) {
  const [menuLeadId, setMenuLeadId] = useState<string | null>(null);
  const anyOutreach = segments.some(
    (s) => !s.isDefault && (s.status === 'live' || s.status === 'paused' || s.status === 'done'),
  );
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'score', dir: 'desc' });
  const [filters, setFilters] = useState<Record<string, string[]>>({
    company: [],
    location: [],
    title: [],
  });

  const showCol = (id: ColumnId) => {
    if (!visibleColumns.has(id)) return false;
    // Outreach column only meaningful when something is in flight
    if (id === 'outreach' && !anyOutreach) return false;
    return true;
  };

  const visible = useMemo(() => {
    let rows = leads;
    if (activeSegmentId !== 'all') {
      const seg = segments.find((s) => s.id === activeSegmentId);
      if (seg) rows = rows.filter((l) => seg.matchedLeadIds.includes(l.id));
    }
    if (filters.company.length) rows = rows.filter((l) => filters.company.includes(l.company));
    if (filters.location.length) rows = rows.filter((l) => filters.location.includes(l.location));
    if (filters.title.length) rows = rows.filter((l) => filters.title.some((t) => l.title.includes(t)));

    rows = [...rows].sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1;
      if (sort.key === 'name') return a.name.localeCompare(b.name) * dir;
      if (sort.key === 'company') return a.company.localeCompare(b.company) * dir;
      return (a.score - b.score) * dir;
    });
    return rows;
  }, [leads, segments, activeSegmentId, sort, filters]);

  const companies = [...new Set(leads.map((l) => l.company))];
  const locations = [...new Set(leads.map((l) => l.location))];
  const titleKeywords = [...new Set(leads.map((l) => l.title.split(' ')[0]))];

  const allSelected = visible.length > 0 && visible.every((l) => selectedIds.includes(l.id));
  const someSelected = visible.some((l) => selectedIds.includes(l.id));

  const toggleAll = () => {
    if (allSelected) {
      onSelectedChange(selectedIds.filter((id) => !visible.some((l) => l.id === id)));
    } else {
      const next = [...new Set([...selectedIds, ...visible.map((l) => l.id)])];
      onSelectedChange(next);
    }
  };

  const toggleOne = (id: string) => {
    onSelectedChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  const setSortKey = (key: SortKey) => {
    setSort((s) => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }));
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30 text-xs uppercase tracking-wider text-muted-foreground">
              <th className="w-10 px-3 py-2.5">
                <Checkbox checked={allSelected} indeterminate={!allSelected && someSelected} onChange={toggleAll} />
              </th>
              {showCol('name') && (
                <th className="px-3 py-2.5 text-left font-medium">
                  <button onClick={() => setSortKey('name')} className="inline-flex items-center gap-1 hover:text-foreground">
                    Name <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
              )}
              {showCol('title') && (
                <th className="px-3 py-2.5 text-left font-medium">
                  <span className="inline-flex items-center gap-1">
                    Title
                    <ColumnHeaderFilter
                      label="title"
                      values={titleKeywords}
                      selected={filters.title}
                      onChange={(v) => setFilters((f) => ({ ...f, title: v }))}
                    />
                  </span>
                </th>
              )}
              {showCol('company') && (
                <th className="px-3 py-2.5 text-left font-medium">
                  <span className="inline-flex items-center gap-1">
                    Company
                    <ColumnHeaderFilter
                      label="company"
                      values={companies}
                      selected={filters.company}
                      onChange={(v) => setFilters((f) => ({ ...f, company: v }))}
                    />
                  </span>
                </th>
              )}
              {showCol('location') && (
                <th className="px-3 py-2.5 text-left font-medium">
                  <span className="inline-flex items-center gap-1">
                    Location
                    <ColumnHeaderFilter
                      label="location"
                      values={locations}
                      selected={filters.location}
                      onChange={(v) => setFilters((f) => ({ ...f, location: v }))}
                    />
                  </span>
                </th>
              )}
              {showCol('verification') && <th className="px-3 py-2.5 text-left font-medium">Verification</th>}
              {showCol('workEmail') && <th className="px-3 py-2.5 text-left font-medium">Work Email</th>}
              {showCol('phone') && <th className="px-3 py-2.5 text-left font-medium">Phone</th>}
              {showCol('score') && (
                <th className="px-3 py-2.5 text-left font-medium">
                  <button onClick={() => setSortKey('score')} className="inline-flex items-center gap-1 hover:text-foreground">
                    Score <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
              )}
              {showCol('outreach') && <th className="px-3 py-2.5 text-left font-medium">Outreach</th>}
              {showCol('sequence') && <th className="px-3 py-2.5 text-left font-medium">Sequence</th>}
              {showCol('source') && <th className="px-3 py-2.5 text-left font-medium">Source</th>}
              {showCol('lastActivity') && <th className="px-3 py-2.5 text-left font-medium">Last activity</th>}
              {showCol('segment') && <th className="px-3 py-2.5 text-left font-medium">Segment</th>}
              <th className="w-10 px-3 py-2.5" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {visible.map((lead) => {
              const isSelected = selectedIds.includes(lead.id);
              const segment = segments.find((s) => s.matchedLeadIds.includes(lead.id));
              const sequence = segment ? sequences.find((s) => s.id === segment.sequenceId) : undefined;
              const source = segment && !segment.isDefault ? 'Manual' : 'Filter';
              const lastActivity = lead.lastActivity ?? (lead.outreachStarted ? 'May 16, 11:22 PM' : '—');
              return (
                <tr
                  key={lead.id}
                  className={cn(
                    'border-b border-border/50 transition-colors hover:bg-accent/40',
                    isSelected && 'bg-primary/5',
                  )}
                >
                  <td className="px-3 py-3">
                    <Checkbox checked={isSelected} onChange={() => toggleOne(lead.id)} />
                  </td>
                  {showCol('name') && (
                    <td className="px-3 py-3">
                      <div className="font-medium text-foreground">{lead.name}</div>
                    </td>
                  )}
                  {showCol('title') && (
                    <td className="px-3 py-3 max-w-xs text-muted-foreground">
                      <div className="truncate" title={lead.title}>{lead.title}</div>
                    </td>
                  )}
                  {showCol('company') && <td className="px-3 py-3 text-foreground">{lead.company}</td>}
                  {showCol('location') && <td className="px-3 py-3 text-muted-foreground">{lead.location}</td>}
                  {showCol('verification') && (
                    <td className="px-3 py-3">
                      <VerificationCell
                        emailStatus={lead.emailStatus}
                        linkedinStatus={lead.linkedinStatus}
                        email={lead.email}
                        linkedinUrl={lead.linkedinUrl}
                      />
                    </td>
                  )}
                  {showCol('workEmail') && (
                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {lead.email ? (
                        <span className="truncate text-foreground" title={lead.email}>{lead.email}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  )}
                  {showCol('phone') && (
                    <td className="px-3 py-3 text-xs text-muted-foreground">—</td>
                  )}
                  {showCol('score') && (
                    <td className="px-3 py-3">
                      <ScoreBadge lead={lead} />
                    </td>
                  )}
                  {showCol('outreach') && (
                    <td className="px-3 py-3">
                      <OutreachCell lead={lead} segment={segment} />
                    </td>
                  )}
                  {showCol('sequence') && (
                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      <div className="max-w-[180px] truncate" title={sequence?.name}>
                        {sequence?.name ?? '—'}
                      </div>
                    </td>
                  )}
                  {showCol('source') && (
                    <td className="px-3 py-3">
                      <span className="inline-flex rounded bg-muted px-1.5 py-0 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {source}
                      </span>
                    </td>
                  )}
                  {showCol('lastActivity') && (
                    <td className="px-3 py-3 text-xs text-muted-foreground">{lastActivity}</td>
                  )}
                  {showCol('segment') && (
                    <td className="px-3 py-3">
                      {segment ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2 py-0.5 text-xs">
                          <span className={cn('h-1.5 w-1.5 rounded-full', segment.isDefault ? 'bg-muted-foreground' : 'bg-primary')} />
                          {segment.name}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Unassigned</span>
                      )}
                    </td>
                  )}
                  <td className="relative px-3 py-3">
                    <RowMenu
                      lead={lead}
                      currentSegment={segment}
                      segments={segments}
                      open={menuLeadId === lead.id}
                      onOpen={() => setMenuLeadId(lead.id)}
                      onClose={() => setMenuLeadId(null)}
                      onMove={(segId) => {
                        onMoveLead?.(lead.id, segId);
                        setMenuLeadId(null);
                      }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-border bg-card px-4 py-2.5 text-xs text-muted-foreground">
        <span>
          Showing {visible.length} of {leads.length} lead{leads.length === 1 ? '' : 's'}
          {selectedIds.length > 0 && ` · ${selectedIds.length} selected`}
        </span>
        <span className="inline-flex items-center gap-1">
          <span>Page 1 of 1</span>
        </span>
      </div>
    </div>
  );
}

function OutreachCell({ lead, segment }: { lead: Lead; segment?: Segment }) {
  const inFlight =
    segment && !segment.isDefault && (segment.status === 'live' || segment.status === 'paused' || segment.status === 'done');
  if (!inFlight || !lead.outreachStarted) {
    return <span className="text-[11px] text-muted-foreground">—</span>;
  }
  const currentStep = lead.currentStep ?? 2;
  const totalSteps = 5;
  const engagement = lead.engagement;
  const meta = engagement === 'replied'
    ? { dot: 'bg-success', label: 'Replied' }
    : engagement === 'bounced'
      ? { dot: 'bg-destructive-foreground', label: 'Bounced' }
      : { dot: 'bg-muted-foreground', label: 'Sent' };
  return (
    <div className="text-xs">
      <div className="font-medium text-foreground">Step {currentStep} of {totalSteps}</div>
      <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
        <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
        {meta.label}
      </div>
    </div>
  );
}

// ----- Columns picker popover ------------------------------------------------

export function ColumnsPicker({
  visible,
  onChange,
}: {
  visible: Set<ColumnId>;
  onChange: (next: Set<ColumnId>) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggle = (id: ColumnId) => {
    const next = new Set(visible);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  const setAll = (val: boolean) => {
    if (val) {
      onChange(new Set(COLUMN_SPEC.map((c) => c.id)));
    } else {
      onChange(new Set(COLUMN_SPEC.filter((c) => c.pinned).map((c) => c.id)));
    }
  };

  const resetToDefaults = () => onChange(defaultVisibleColumns());

  const visibleCount = visible.size;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors',
          open ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground hover:bg-accent',
        )}
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <line x1="21" y1="6" x2="3" y2="6" />
          <line x1="15" y1="12" x2="3" y2="12" />
          <line x1="17" y1="18" x2="3" y2="18" />
        </svg>
        Columns
        <span className="rounded-full bg-muted px-1.5 py-0 text-[10px] tabular-nums text-muted-foreground">{visibleCount}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-30 w-64 overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Visible columns
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={resetToDefaults}
                className="text-[10px] uppercase tracking-wider text-primary hover:underline"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="max-h-[360px] overflow-y-auto scrollbar-thin py-1">
            {COLUMN_SPEC.map((col) => {
              const checked = visible.has(col.id);
              return (
                <button
                  key={col.id}
                  disabled={col.pinned}
                  onClick={() => toggle(col.id)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs hover:bg-accent disabled:opacity-60',
                  )}
                >
                  <span className="text-foreground">{col.label}</span>
                  <div className="flex items-center gap-1.5">
                    {col.pinned && (
                      <span className="rounded bg-muted px-1 py-0 text-[9px] uppercase tracking-wider text-muted-foreground">
                        Pinned
                      </span>
                    )}
                    <span
                      className={cn(
                        'flex h-3.5 w-3.5 items-center justify-center rounded border',
                        checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card',
                      )}
                    >
                      {checked && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 border-t border-border bg-secondary/20 px-3 py-2 text-[10px]">
            <button onClick={() => setAll(true)} className="text-primary hover:underline">
              Show all
            </button>
            <span className="text-muted-foreground">·</span>
            <button onClick={() => setAll(false)} className="text-primary hover:underline">
              Hide all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ----- Row kebab menu ---------------------------------------------------------

function RowMenu({
  lead,
  currentSegment,
  segments,
  open,
  onOpen,
  onClose,
  onMove,
}: {
  lead: Lead;
  currentSegment?: Segment;
  segments: Segment[];
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onMove: (segmentId: string | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const locked = lead.outreachStarted;
  const inCustom = currentSegment && !currentSegment.isDefault;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={(e) => {
          e.stopPropagation();
          open ? onClose() : onOpen();
        }}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        aria-label="Row actions"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-30 w-56 overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
          <div className="border-b border-border bg-secondary/30 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {lead.name}
          </div>

          {locked ? (
            <div className="px-3 py-2 text-xs">
              <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
                <Lock className="h-3 w-3" />
                In active outreach
              </div>
              <div className="mt-1 text-muted-foreground">
                Moving could cause duplicate messages. Pause the segment first to make changes.
              </div>
            </div>
          ) : (
            <div className="py-1">
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Move to
              </div>
              {segments.filter((s) => !s.isDefault).map((seg) => {
                const isCurrent = currentSegment?.id === seg.id;
                return (
                  <button
                    key={seg.id}
                    disabled={isCurrent}
                    onClick={() => onMove(seg.id)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-accent disabled:opacity-40"
                  >
                    <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                    <span className="text-foreground">{seg.name}</span>
                    {isCurrent && <span className="ml-auto text-[10px] text-muted-foreground">current</span>}
                  </button>
                );
              })}

              {inCustom && (
                <>
                  <div className="my-1 h-px bg-border" />
                  <button
                    onClick={() => onMove(null)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-accent"
                  >
                    <X className="h-3 w-3 text-muted-foreground" />
                    <span className="text-foreground">Unassign</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
