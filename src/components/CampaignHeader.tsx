import { ChevronLeft, Sparkles, Sun, Bell, Building2, Users, Mail } from 'lucide-react';
import { Badge } from './ui/Badge';
import type { Campaign, LifecycleState } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CampaignHeaderProps {
  campaign: Campaign;
  state: LifecycleState;
  onChangeState: (state: LifecycleState) => void;
}

const stateLabels: Record<LifecycleState, string> = {
  setup: 'Setup',
  running: 'Running',
  paused: 'Paused',
  partial: 'Partial run',
  finished: 'Finished',
};

const stateColors: Record<LifecycleState, string> = {
  setup: 'bg-muted text-muted-foreground border-border',
  running: 'bg-success/15 text-success border-success/30',
  paused: 'bg-warning/15 text-warning border-warning/30',
  partial: 'bg-primary/15 text-primary border-primary/30',
  finished: 'bg-secondary text-secondary-foreground border-border',
};

export function CampaignHeader({ campaign, state, onChangeState }: CampaignHeaderProps) {
  return (
    <header className="border-b border-border bg-background">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <a href="#" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
            Campaigns
          </a>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={state}
            onChange={(e) => onChangeState(e.target.value as LifecycleState)}
            className="h-8 rounded-lg border border-border bg-input px-2 text-xs"
            title="Prototype: switch campaign lifecycle state"
          >
            <option value="setup">Setup</option>
            <option value="running">Running</option>
            <option value="paused">Paused</option>
            <option value="partial">Partial run</option>
            <option value="finished">Finished</option>
          </select>
          <button className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 text-xs font-medium hover:bg-accent">
            <Sparkles className="h-3.5 w-3.5" />
            Copilot
          </button>
          <button className="rounded-lg p-2 hover:bg-accent" title="Theme">
            <Sun className="h-4 w-4" />
          </button>
          <button className="rounded-lg p-2 hover:bg-accent" title="Notifications">
            <Bell className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              S
            </div>
            <span className="text-xs">sharan+test</span>
          </div>
        </div>
      </div>

      <div className="px-6 pb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight">{campaign.name}</h1>
          <Badge className={cn('border', stateColors[state])}>{stateLabels[state]}</Badge>
        </div>
        <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            {campaign.companiesCount} companies
          </span>
          <span className="text-border">•</span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {campaign.contactsCount} contacts
          </span>
          <span className="text-border">•</span>
          <span className="inline-flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            {campaign.inOutreachCount} in outreach
          </span>
        </div>
      </div>
    </header>
  );
}
