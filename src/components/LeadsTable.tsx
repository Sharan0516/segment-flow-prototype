import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpDown, MoreHorizontal, ArrowRightLeft, X, Lock } from 'lucide-react';
import type { Lead, Segment } from '@/lib/types';
import { Checkbox } from './ui/Checkbox';
import { ScoreBadge } from './ScoreBadge';
import { VerificationCell } from './VerificationCell';
import { ColumnHeaderFilter } from './ColumnHeaderFilter';
import { cn } from '@/lib/utils';

interface LeadsTableProps {
  leads: Lead[];
  segments: Segment[];
  activeSegmentId: string | 'all';
  selectedIds: string[];
  onSelectedChange: (ids: string[]) => void;
  /** Move a single lead to a segment, or pass null to unassign. */
  onMoveLead?: (leadId: string, segmentId: string | null) => void;
}

type SortKey = 'name' | 'score' | 'company';
type SortDir = 'asc' | 'desc';

export function LeadsTable({ leads, segments, activeSegmentId, selectedIds, onSelectedChange, onMoveLead }: LeadsTableProps) {
  const [menuLeadId, setMenuLeadId] = useState<string | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'score', dir: 'desc' });
  const [filters, setFilters] = useState<Record<string, string[]>>({
    company: [],
    location: [],
    title: [],
  });

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
              <th className="px-3 py-2.5 text-left font-medium">
                <button onClick={() => setSortKey('name')} className="inline-flex items-center gap-1 hover:text-foreground">
                  Name <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
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
              <th className="px-3 py-2.5 text-left font-medium">Verification</th>
              <th className="px-3 py-2.5 text-left font-medium">
                <button onClick={() => setSortKey('score')} className="inline-flex items-center gap-1 hover:text-foreground">
                  Score <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-3 py-2.5 text-left font-medium">Segment</th>
              <th className="w-10 px-3 py-2.5" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {visible.map((lead) => {
              const isSelected = selectedIds.includes(lead.id);
              const segment = segments.find((s) => s.matchedLeadIds.includes(lead.id));
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
                  <td className="px-3 py-3">
                    <div className="font-medium text-foreground">{lead.name}</div>
                  </td>
                  <td className="px-3 py-3 max-w-xs text-muted-foreground">
                    <div className="truncate" title={lead.title}>{lead.title}</div>
                  </td>
                  <td className="px-3 py-3 text-foreground">{lead.company}</td>
                  <td className="px-3 py-3 text-muted-foreground">{lead.location}</td>
                  <td className="px-3 py-3">
                    <VerificationCell
                      emailStatus={lead.emailStatus}
                      linkedinStatus={lead.linkedinStatus}
                      email={lead.email}
                      linkedinUrl={lead.linkedinUrl}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <ScoreBadge lead={lead} />
                  </td>
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
