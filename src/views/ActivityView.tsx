import { Inbox, Mail, MessageSquare } from 'lucide-react';

export function ActivityView() {
  return (
    <div className="p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">Activity</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Inbox of all emails, LinkedIn messages, and replies across this campaign.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-border bg-card p-12">
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
            <Inbox className="h-5 w-5" />
          </div>
          <div className="mt-4 text-sm font-semibold text-foreground">
            Activity feed — out of scope for this prototype
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            In production this tab shows the full timeline of sent / received emails and
            LinkedIn messages, with filters by step, sender, and engagement.
          </p>

          <div className="mt-6 grid w-full grid-cols-2 gap-3 text-left">
            <div className="rounded-lg border border-border bg-secondary/30 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Mail className="h-3 w-3" />
                Email events
              </div>
              <p className="text-[11px] text-muted-foreground">
                Sent, bounced, replied — threaded per contact.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/30 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-foreground">
                <MessageSquare className="h-3 w-3" />
                LinkedIn events
              </div>
              <p className="text-[11px] text-muted-foreground">
                Connection requests, acceptances, message replies.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
