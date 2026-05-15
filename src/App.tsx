import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { CampaignHeader } from '@/components/CampaignHeader';
import { TabBar, type TabKey } from '@/components/TabBar';
import { DemoStateSwitcher, type DemoVariant } from '@/components/DemoStateSwitcher';
import { SetupView } from '@/views/SetupView';
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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <CampaignHeader campaign={campaign} state={state} onChangeState={handleStateChange} />
        <TabBar active={tab} onChange={setTab} state={state} leadCount={initialLeads.length} />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          {tab === 'leads' && (
            <SetupView
              leads={initialLeads}
              segments={segments}
              sequences={initialSequences}
              senders={senders}
              state={state}
              onAddSegment={addSegment}
              onAddLeadsToSegment={addLeadsToSegment}
              onConfigureSenders={() => setTab('settings')}
              onLaunch={() => handleStateChange('running')}
            />
          )}
          {tab === 'live' && (
            <LiveView
              state={state}
              segments={segments}
              sequences={initialSequences}
              onPause={() => handleStateChange('paused')}
              onResume={() => handleStateChange('running')}
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
