import { Users, Activity, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LifecycleState } from '@/lib/types';

export type TabKey = 'leads' | 'live' | 'analytics' | 'settings';

interface TabBarProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
  state: LifecycleState;
  leadCount: number;
}

export function TabBar({ active, onChange, state, leadCount }: TabBarProps) {
  // Mode-aware: which tabs are "primary" for this state
  const isRunMode = state === 'running' || state === 'paused' || state === 'partial';
  const isReviewMode = state === 'finished';

  const tabs = [
    { key: 'leads' as TabKey, label: 'Leads', icon: Users, count: leadCount, suggested: state === 'setup' },
    { key: 'live' as TabKey, label: 'Live', icon: Activity, count: null, suggested: isRunMode },
    { key: 'analytics' as TabKey, label: 'Analytics', icon: BarChart3, count: null, suggested: isReviewMode },
    { key: 'settings' as TabKey, label: 'Settings', icon: Settings, count: null, suggested: false },
  ];

  return (
    <div className="border-b border-border bg-background px-6">
      <nav className="flex items-center gap-1">
        {tabs.map((tab) => {
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={cn(
                'relative inline-flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {tab.count}
                </span>
              )}
              {isActive && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
