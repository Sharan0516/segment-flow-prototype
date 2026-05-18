import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { CampaignHeader } from '@/components/CampaignHeader';
import { TabBar, type TabKey } from '@/components/TabBar';
import { DemoStateSwitcher, type DemoVariant } from '@/components/DemoStateSwitcher';
import { SetupView } from '@/views/SetupView';
import { SegmentsView } from '@/views/SegmentsView';
import { LiveView } from '@/views/LiveView';
import { AnalyticsView } from '@/views/AnalyticsView';
import { SettingsView } from '@/views/SettingsView';
import {
  campaign as initialCampaign,
  leads as initialLeads,
  configuredSegments,
  firstRunSegments,
  sequences as initialSequences,
  senders as initialSenders,
} from '@/lib/data';
import type { LifecycleState, Segment, Sender } from '@/lib/types';

const SAMPLE_SENDER: Sender = {
  id: 'sender-1',
  email: 'sharan@lumif.ai',
  name: 'Sharan JM',
  status: 'active',
  dailyCap: 50,
  sentToday: 0,
};

export default function App() {
  const [state, setState] = useState<LifecycleState>('setup');
  const [tab, setTab] = useState<TabKey>('leads');
  const [demoVariant, setDemoVariant] = useState<DemoVariant>('configured');
  const [segments, setSegments] = useState<Segment[]>(configuredSegments);
  const [senders, setSenders] = useState<Sender[]>(initialSenders);
  const [leadsFilterSegmentId, setLeadsFilterSegmentId] = useState<string | 'all'>('all');

  const campaign = { ...initialCampaign, state };

  const handleDemoVariantChange = (next: DemoVariant) => {
    setDemoVariant(next);
    setSegments(next === 'first-run' ? firstRunSegments : configuredSegments);
    setState('setup');
    setTab('leads');
  };

  const handleStateChange = (next: LifecycleState) => {
    setState(next);
    if (next === 'setup') setTab('leads');
    else if (next === 'running' || next === 'paused' || next === 'partial') setTab('live');
    else if (next === 'finished') setTab('analytics');
  };

  const addLeadsToSegment = (segmentId: string, leadIds: string[]) => {
    setSegments((prev) =>
      prev.map((seg) => {
        if (seg.id === segmentId) {
          const next = new Set([...seg.matchedLeadIds, ...leadIds]);
          return { ...seg, matchedLeadIds: Array.from(next) };
        }
        // Strip from other custom segments to maintain exclusivity
        if (seg.isDefault) return seg;
        const claimSet = new Set(leadIds);
        return {
          ...seg,
          matchedLeadIds: seg.matchedLeadIds.filter((id) => !claimSet.has(id)),
        };
      }),
    );
  };

  const moveLead = (leadId: string, segmentId: string | null) => {
    setSegments((prev) =>
      prev.map((seg) => {
        // First, strip the lead from this segment (we'll add it back to the target below)
        const without = seg.matchedLeadIds.filter((id) => id !== leadId);

        if (segmentId && seg.id === segmentId) {
          // Target custom segment receives the lead
          return { ...seg, matchedLeadIds: Array.from(new Set([...without, leadId])) };
        }
        if (segmentId === null && seg.isDefault) {
          // Unassign: lead goes back to the Default segment
          return { ...seg, matchedLeadIds: Array.from(new Set([...without, leadId])) };
        }
        // Otherwise: lead is removed from this segment
        return { ...seg, matchedLeadIds: without };
      }),
    );
  };

  const addSegment = (s: Omit<Segment, 'id'>, resolution: 'skip' | 'move') => {
    const newSeg: Segment = { ...s, id: `seg-${Date.now()}` };
    setSegments((prev) => {
      // If 'move' resolution: strip the claimed lead IDs from other custom segments
      const claimedIds = new Set(newSeg.matchedLeadIds);
      const updated =
        resolution === 'move'
          ? prev.map((seg) =>
              seg.isDefault
                ? seg
                : {
                    ...seg,
                    matchedLeadIds: seg.matchedLeadIds.filter((id) => !claimedIds.has(id)),
                  },
            )
          : prev;
      return [...updated, newSeg];
    });
  };

  const addSender = () => {
    setSenders((prev) => (prev.length === 0 ? [SAMPLE_SENDER] : prev));
  };

  const launchSegments = (segmentIds: string[]) => {
    const now = new Date().toISOString();
    setSegments((prev) =>
      prev.map((s) =>
        segmentIds.includes(s.id) && !s.isDefault
          ? { ...s, status: 'live' as const, launchedAt: s.launchedAt ?? now }
          : s,
      ),
    );
    // Promote campaign to running if any segment is live
    setState((curr) => (curr === 'setup' ? 'running' : curr));
  };

  const pauseSegment = (segmentId: string) => {
    setSegments((prev) =>
      prev.map((s) => (s.id === segmentId && !s.isDefault ? { ...s, status: 'paused' as const } : s)),
    );
  };

  const resumeSegment = (segmentId: string) => {
    setSegments((prev) =>
      prev.map((s) => (s.id === segmentId && !s.isDefault ? { ...s, status: 'live' as const } : s)),
    );
  };

  const updateSegment = (segmentId: string, patch: Partial<Segment>) => {
    setSegments((prev) => prev.map((s) => (s.id === segmentId ? { ...s, ...patch } : s)));
  };

  const deleteSegment = (segmentId: string) => {
    setSegments((prev) => prev.filter((s) => s.id !== segmentId));
  };

  const duplicateSegment = (segmentId: string) => {
    setSegments((prev) => {
      const src = prev.find((s) => s.id === segmentId);
      if (!src) return prev;
      const copy: Segment = {
        ...src,
        id: `seg-${Date.now()}`,
        name: `${src.name} (copy)`,
        status: 'draft',
        launchedAt: undefined,
        matchedLeadIds: [...src.matchedLeadIds],
      };
      return [...prev, copy];
    });
  };


  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <CampaignHeader campaign={campaign} state={state} segments={segments} onChangeState={handleStateChange} />
        <TabBar
          active={tab}
          onChange={setTab}
          state={state}
          leadCount={initialLeads.length}
          segmentCount={segments.filter((s) => !s.isDefault).length}
        />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          {tab === 'leads' && (
            <SetupView
              leads={initialLeads}
              segments={segments}
              sequences={initialSequences}
              senders={senders}
              state={state}
              initialActiveSegmentId={leadsFilterSegmentId}
              onAddSegment={addSegment}
              onAddLeadsToSegment={addLeadsToSegment}
              onMoveLead={moveLead}
              onConfigureSenders={() => setTab('settings')}
              onLaunchSegments={launchSegments}
            />
          )}
          {tab === 'segments' && (
            <SegmentsView
              leads={initialLeads}
              segments={segments}
              sequences={initialSequences}
              senders={senders}
              onAddSegment={addSegment}
              onUpdateSegment={updateSegment}
              onJumpToLeads={(segmentId) => {
                setLeadsFilterSegmentId(segmentId);
                setTab('leads');
              }}
              onLaunchSegment={(id) => launchSegments([id])}
              onPauseSegment={pauseSegment}
              onResumeSegment={resumeSegment}
              onDuplicateSegment={duplicateSegment}
              onDeleteSegment={(id) => {
                if (confirm('Delete this segment? Leads will move back to Unassigned.')) {
                  deleteSegment(id);
                }
              }}
            />
          )}
          {tab === 'live' && (
            <LiveView
              state={state}
              segments={segments}
              sequences={initialSequences}
              onPause={() => handleStateChange('paused')}
              onResume={() => handleStateChange('running')}
              onLaunchSegment={(id) => launchSegments([id])}
              onPauseSegment={pauseSegment}
              onResumeSegment={resumeSegment}
            />
          )}
          {tab === 'analytics' && <AnalyticsView segments={segments} sequences={initialSequences} />}
          {tab === 'settings' && (
            <SettingsView
              senders={senders}
              onAddSender={addSender}
              onRemoveSender={(id) => setSenders((prev) => prev.filter((s) => s.id !== id))}
            />
          )}
        </main>
      </div>
      <DemoStateSwitcher variant={demoVariant} onChange={handleDemoVariantChange} />
    </div>
  );
}
