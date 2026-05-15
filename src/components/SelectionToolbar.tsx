import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Plus, Rocket, ChevronDown, ArrowRightLeft, Check, AlertCircle, ArrowRight } from 'lucide-react';
import type { Segment } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SelectionToolbarProps {
  selectedIds: string[];
  segments: Segment[];
  blockerText: string | null;
  onClear: () => void;
  onCreateSegment: () => void;
  onLaunch: () => void;
  onAddToSegment: (segmentId: string) => void;
  onFixBlocker: () => void;
}

export function SelectionToolbar({
  selectedIds,
  segments,
  blockerText,
  onClear,
  onCreateSegment,
  onLaunch,
  onAddToSegment,
  onFixBlocker,
}: SelectionToolbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const composition = useMemo(() => {
    const customSegments = segments.filter((s) => !s.isDefault);
    const defaultSegment = segments.find((s) => s.isDefault);
    const bySegment = new Map<string, { segment: Segment; ids: string[] }>();
    const inDefault: string[] = [];

    selectedIds.forEach((id) => {
      const cs = customSegments.find((s) => s.matchedLeadIds.includes(id));
      if (cs) {
        const entry = bySegment.get(cs.id) ?? { segment: cs, ids: [] };
        entry.ids.push(id);
        bySegment.set(cs.id, entry);
      } else {
        inDefault.push(id);
      }
    });

    const total = selectedIds.length;
    const defaultCount = inDefault.length;
    const allInDefault = defaultCount === total && total > 0;
    const allInSegments = defaultCount === 0 && bySegment.size > 0;
    const isMixed = !allInDefault && !allInSegments;

    return {
      bySegment: Array.from(bySegment.values()),
      defaultLeads: inDefault,
      defaultSegment,
      hasDefault: defaultCount > 0,
      allInSegments,
      allInDefault,
      isMixed,
      defaultCount,
      total,
    };
  }, [selectedIds, segments]);

  const defaultName = composition.defaultSegment?.name ?? 'Unassigned';

  // Launch is shown only when it acts on at least one selected lead.
  //  - all in segments: Launch sends to everyone selected → show
  //  - mixed: Launch sends to some → show with "skips N" label
  //  - all in Default: Launch skips 100% of selection → HIDE (selection is pointless for launch)
  //  - blocker (no senders): HIDE
  const launchPossible = !blockerText && !composition.allInDefault;

  const launchLabel = composition.hasDefault
    ? `Launch · skips ${composition.defaultCount}`
    : 'Launch campaign';

  const launchTooltip = composition.hasDefault
    ? `${composition.defaultCount} of ${composition.total} selected ${composition.defaultCount === 1 ? 'is' : 'are'} ${defaultName}. ${defaultName} leads will be skipped unless you enable ${defaultName} in the launch dialog.`
    : 'Launch the campaign.';

  // Special state: all selected leads are organized, but launch is blocked.
  // No organize action is useful (they're already in segments). The real
  // blocker is upstream (senders). Show a prominent fix-blocker CTA in the
  // primary slot instead of pretending an organize action is primary.
  const organizedButBlocked = !!blockerText && composition.allInSegments;

  // Whether the org actions get primary coral styling.
  //  - launch possible: no (Launch is the coral primary)
  //  - launch blocked + mixed or all-in-default: yes (organize IS the useful step)
  //  - launch blocked + all-in-segments: no (organize is not useful — show blocker CTA instead)
  const orgPrimaryColor = !launchPossible && !organizedButBlocked;

  // Order of org-action buttons.
  //  - all-in-segments: Move (curation) then Create (sub-group)
  //  - mixed / all-in-Default: Create (new group) then Add-to (file into existing)
  const orgPrimary: 'create' | 'move' = composition.allInSegments ? 'move' : 'create';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2">
      {/* Selection chip + composition + optional launch-ready hint */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/15 px-2 py-1 font-semibold text-primary">
          <Check className="h-3 w-3" />
          {composition.total} selected
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="flex flex-wrap items-center gap-1 text-foreground">
          {composition.bySegment.map((g, i) => (
            <span key={g.segment.id} className="inline-flex items-center gap-1">
              {i > 0 && <span className="text-muted-foreground">,</span>}
              <span className="font-medium">{g.ids.length}</span>
              <span className="text-muted-foreground">in</span>
              <span>{g.segment.name}</span>
            </span>
          ))}
          {composition.hasDefault && (
            <span className="inline-flex items-center gap-1">
              {composition.bySegment.length > 0 && <span className="text-muted-foreground">,</span>}
              <span className="font-medium text-warning">{composition.defaultCount}</span>
              <span className="text-warning">{defaultName}</span>
            </span>
          )}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {launchPossible && (
          <button
            onClick={onLaunch}
            title={launchTooltip}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Rocket className="h-3.5 w-3.5" />
            {launchLabel}
          </button>
        )}
        {organizedButBlocked && (
          <button
            onClick={onFixBlocker}
            className="group inline-flex items-center gap-1.5 rounded-lg border border-warning/40 bg-warning/15 px-3 py-1.5 text-xs font-medium text-warning hover:bg-warning/25"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            Ready to launch · Configure senders
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </button>
        )}

        {orgPrimary === 'create' ? (
          <>
            <button
              onClick={onCreateSegment}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium',
                orgPrimaryColor
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'border border-border bg-card text-foreground hover:bg-accent',
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              Create segment{composition.allInDefault ? ' from these' : composition.isMixed ? ' from these' : ''}
            </button>
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium',
                  menuOpen ? 'bg-accent text-foreground' : 'bg-card text-foreground hover:bg-accent',
                )}
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
                Add to segment
                <ChevronDown className={cn('h-3 w-3 transition-transform', menuOpen && 'rotate-180')} />
              </button>
              {menuOpen && (
                <SegmentMenu
                  segments={segments}
                  onPick={(id) => {
                    onAddToSegment(id);
                    setMenuOpen(false);
                  }}
                />
              )}
            </div>
          </>
        ) : (
          <>
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium',
                  menuOpen
                    ? 'border-border bg-accent text-foreground'
                    : orgPrimaryColor
                    ? 'border-primary/40 bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'border-border bg-card text-foreground hover:bg-accent',
                )}
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
                Move to
                <ChevronDown className={cn('h-3 w-3 transition-transform', menuOpen && 'rotate-180')} />
              </button>
              {menuOpen && (
                <SegmentMenu
                  segments={segments}
                  onPick={(id) => {
                    onAddToSegment(id);
                    setMenuOpen(false);
                  }}
                />
              )}
            </div>
            <button
              onClick={onCreateSegment}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
            >
              <Plus className="h-3.5 w-3.5" />
              Create new
            </button>
          </>
        )}

        <button
          onClick={onClear}
          title="Clear selection"
          className="ml-1 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function SegmentMenu({
  segments,
  onPick,
}: {
  segments: Segment[];
  onPick: (id: string) => void;
}) {
  const custom = segments.filter((s) => !s.isDefault);
  const def = segments.find((s) => s.isDefault);

  return (
    <div className="absolute right-0 top-full z-30 mt-1 w-64 rounded-lg border border-border bg-card p-1 shadow-2xl">
      {custom.length === 0 && def == null && (
        <div className="px-3 py-2 text-xs text-muted-foreground">No segments to pick from.</div>
      )}
      {custom.map((seg) => (
        <button
          key={seg.id}
          onClick={() => onPick(seg.id)}
          className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-xs hover:bg-accent"
        >
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-foreground">{seg.name}</span>
          </span>
          <span className="text-muted-foreground">{seg.matchedLeadIds.length}</span>
        </button>
      ))}
      {def && (
        <>
          {custom.length > 0 && <div className="my-1 border-t border-border" />}
          <button
            onClick={() => onPick(def.id)}
            className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-xs hover:bg-accent"
          >
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
              <span className="text-foreground">{def.name}</span>
              <span className="rounded bg-muted px-1 py-0 text-[10px] uppercase tracking-wider text-muted-foreground">Catch-all</span>
            </span>
            <span className="text-muted-foreground">remove from custom</span>
          </button>
        </>
      )}
    </div>
  );
}
