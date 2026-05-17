import { useEffect, useMemo, useState } from 'react';
import { Rocket, Search, Settings2 } from 'lucide-react';
import type { Lead, LifecycleState, Segment, Sender, Sequence } from '@/lib/types';
import { ProgressiveDisclosureBar } from '@/components/ProgressiveDisclosureBar';
import { SenderStatusBar } from '@/components/SenderStatusBar';
import { FirstRunEducation } from '@/components/FirstRunEducation';
import { SegmentChips } from '@/components/SegmentChips';
import { LeadsTable } from '@/components/LeadsTable';
import { SegmentCreationPanel } from '@/components/SegmentCreationPanel';
import { SelectionToolbar } from '@/components/SelectionToolbar';
import { LaunchModal } from '@/components/LaunchModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface SetupViewProps {
  leads: Lead[];
  segments: Segment[];
  sequences: Sequence[];
  senders: Sender[];
  state: LifecycleState;
  /** Optional initial / synced active segment id. Updates when changed from outside. */
  initialActiveSegmentId?: string | 'all';
  onAddSegment: (s: Omit<Segment, 'id'>, resolution: 'skip' | 'move') => void;
  onAddLeadsToSegment: (segmentId: string, leadIds: string[]) => void;
  onConfigureSenders: () => void;
  onLaunch: () => void;
}

export function SetupView({
  leads,
  segments,
  sequences,
  senders,
  state,
  initialActiveSegmentId,
  onAddSegment,
  onAddLeadsToSegment,
  onConfigureSenders,
  onLaunch,
}: SetupViewProps) {
  const [activeSegment, setActiveSegment] = useState<string | 'all'>(initialActiveSegmentId ?? 'all');
  // Sync when parent pushes a new value (e.g., jumped from Segments tab)
  useEffect(() => {
    if (initialActiveSegmentId !== undefined) setActiveSegment(initialActiveSegmentId);
  }, [initialActiveSegmentId]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [segmentPanelOpen, setSegmentPanelOpen] = useState(false);
  const [panelPresetLeadIds, setPanelPresetLeadIds] = useState<string[] | null>(null);
  const [launchOpen, setLaunchOpen] = useState(false);

  const openPanelFromFilters = () => {
    setPanelPresetLeadIds(null);
    setSegmentPanelOpen(true);
  };
  const openPanelFromSelection = () => {
    setPanelPresetLeadIds([...selectedIds]);
    setSegmentPanelOpen(true);
  };
  const closePanel = () => {
    setSegmentPanelOpen(false);
    setPanelPresetLeadIds(null);
  };

  const filteredLeads = useMemo(
    () =>
      leads.filter((l) =>
        search ? `${l.name} ${l.company} ${l.title}`.toLowerCase().includes(search.toLowerCase()) : true,
      ),
    [leads, search],
  );

  const blockerText = senders.length === 0 ? 'No senders configured. Required before launch.' : null;
  const customSegmentCount = segments.filter((s) => !s.isDefault).length;
  const assignedLeadIds = new Set(
    segments.filter((s) => !s.isDefault).flatMap((s) => s.matchedLeadIds),
  );
  const unassignedCount = leads.filter((l) => !assignedLeadIds.has(l.id)).length;
  const isSetup = state === 'setup';
  const selectionActive = selectedIds.length > 0;

  return (
    <>
      {/* Sticky command surface: disclosure bar + (when senders exist) sender status */}
      <div className="sticky top-0 z-20 bg-background">
        {isSetup && (
          <ProgressiveDisclosureBar
            leadCount={leads.length}
            customSegmentCount={customSegmentCount}
            unassignedCount={unassignedCount}
            blockerText={blockerText}
            onFixBlocker={onConfigureSenders}
          />
        )}
        <SenderStatusBar senders={senders} onConfigure={onConfigureSenders} />
      </div>

      <div className="space-y-3 p-6">
        {isSetup && customSegmentCount === 0 && (
          <FirstRunEducation
            leadCount={leads.length}
            blockerText={blockerText}
            onCreateSegment={openPanelFromFilters}
            onSendToAll={() => setLaunchOpen(true)}
          />
        )}

        <div className="flex items-center justify-between gap-3">
          <SegmentChips
            segments={segments}
            activeSegmentId={activeSegment}
            onChange={setActiveSegment}
            onCreate={openPanelFromFilters}
            totalLeads={leads.length}
          />
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search leads…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-64 pl-8 text-xs"
              />
            </div>
            <Button variant="outline" size="sm">
              <Settings2 className="h-3.5 w-3.5" />
              Columns
            </Button>
            {!selectionActive && (
              <Button
                onClick={() => setLaunchOpen(true)}
                disabled={!!blockerText}
                title={blockerText ? 'Add a mailbox in Settings before launching.' : undefined}
              >
                <Rocket className="h-4 w-4" />
                Launch campaign
              </Button>
            )}
          </div>
        </div>

        {selectionActive && (
          <SelectionToolbar
            selectedIds={selectedIds}
            segments={segments}
            blockerText={blockerText}
            onClear={() => setSelectedIds([])}
            onCreateSegment={openPanelFromSelection}
            onLaunch={() => setLaunchOpen(true)}
            onAddToSegment={(segmentId) => {
              onAddLeadsToSegment(segmentId, selectedIds);
              setSelectedIds([]);
            }}
            onFixBlocker={onConfigureSenders}
          />
        )}

        <LeadsTable
          leads={filteredLeads}
          segments={segments}
          activeSegmentId={activeSegment}
          selectedIds={selectedIds}
          onSelectedChange={setSelectedIds}
        />
      </div>

      <SegmentCreationPanel
        open={segmentPanelOpen}
        onClose={closePanel}
        leads={leads}
        sequences={sequences}
        senders={senders}
        existingSegments={segments}
        presetLeadIds={panelPresetLeadIds}
        onSave={(seg, resolution) => {
          onAddSegment(seg, resolution);
          // If we opened from a selection, clear it after creation.
          if (panelPresetLeadIds) setSelectedIds([]);
        }}
      />

      <LaunchModal
        open={launchOpen}
        onClose={() => setLaunchOpen(false)}
        onLaunch={() => {
          setLaunchOpen(false);
          onLaunch();
        }}
        leads={leads}
        segments={segments}
        sequences={sequences}
        senders={senders}
        selectedIds={leads.map((l) => l.id)}
      />
    </>
  );
}
