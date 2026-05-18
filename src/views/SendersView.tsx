import { AtSign, Plus, Trash2 } from 'lucide-react';
import type { Sender } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface SendersViewProps {
  senders: Sender[];
  onAddSender: () => void;
  onRemoveSender: (id: string) => void;
}

export function SendersView({ senders, onAddSender, onRemoveSender }: SendersViewProps) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Sender mailboxes</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Outreach rotates across all active mailboxes round-robin. Add at least one before launch.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card">
        {senders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/15 text-warning">
              <AtSign className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">No senders yet</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Connect a mailbox to send from. Gmail, Outlook, or any SMTP.
              </div>
            </div>
            <Button onClick={onAddSender}>
              <Plus className="h-4 w-4" />
              Add a mailbox
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <span className="text-sm font-medium text-foreground">{senders.length} mailbox{senders.length === 1 ? '' : 'es'} attached</span>
              <Button size="sm" variant="outline" onClick={onAddSender}>
                <Plus className="h-3.5 w-3.5" />
                Add another
              </Button>
            </div>
            <div className="divide-y divide-border">
              {senders.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-foreground">
                      <AtSign className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{s.email}</div>
                      <div className="text-xs text-muted-foreground">{s.name} · Daily cap: {s.dailyCap}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={s.status === 'active' ? 'success' : s.status === 'paused' ? 'warning' : 'destructive'}>
                      {s.status}
                    </Badge>
                    <button
                      onClick={() => onRemoveSender(s.id)}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/15 hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
