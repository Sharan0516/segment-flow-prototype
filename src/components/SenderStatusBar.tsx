import { AtSign, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import type { Sender } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SenderStatusBarProps {
  senders: Sender[];
  onConfigure: () => void;
}

export function SenderStatusBar({ senders, onConfigure }: SenderStatusBarProps) {
  const activeSenders = senders.filter((s) => s.status === 'active');
  const totalCap = senders.reduce((acc, s) => acc + (s.status === 'active' ? s.dailyCap : 0), 0);
  const isEmpty = senders.length === 0;
  const isHealthy = activeSenders.length > 0 && senders.every((s) => s.status !== 'blocked');

  // Hide entirely when empty — the blocker already lives in the command bar above.
  if (isEmpty) return null;

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-b border-border px-6 py-2 text-xs',
        isHealthy ? 'bg-background' : 'bg-destructive/10',
      )}
    >
      <div className="flex items-center gap-2">
        {isHealthy ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
        ) : (
          <AlertTriangle className="h-3.5 w-3.5 text-destructive-foreground" />
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          <AtSign className="h-3 w-3 text-muted-foreground" />
          <span className="font-medium">
            Sending from {activeSenders[0]?.email}
            {activeSenders.length > 1 && ` + ${activeSenders.length - 1} more`}
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{activeSenders.length} mailbox{activeSenders.length === 1 ? '' : 'es'} rotating</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">Daily cap: {totalCap}</span>
        </div>
      </div>
      <button
        onClick={onConfigure}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-foreground hover:bg-accent"
      >
        Manage senders
        <ChevronRight className="h-3 w-3" />
      </button>
    </div>
  );
}
