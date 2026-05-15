import { CheckCircle2, AlertCircle, XCircle, MinusCircle } from 'lucide-react';
import type { EmailStatus } from '@/lib/types';
import { Tooltip } from './ui/Tooltip';
import { cn } from '@/lib/utils';

interface EmailStatusCellProps {
  status: EmailStatus;
  email?: string;
}

const config: Record<EmailStatus, { Icon: typeof CheckCircle2; label: string; tone: string; desc: string }> = {
  verified: { Icon: CheckCircle2, label: 'Verified', tone: 'text-success', desc: 'Confirmed deliverable via ZeroBounce.' },
  unverified: { Icon: AlertCircle, label: 'Pending', tone: 'text-warning', desc: 'Not yet validated. Will run at launch.' },
  invalid: { Icon: XCircle, label: 'Invalid', tone: 'text-destructive-foreground', desc: 'Bounced or marked invalid by validator.' },
  missing: { Icon: MinusCircle, label: 'No email', tone: 'text-muted-foreground', desc: 'No email on file. LinkedIn-only outreach possible.' },
};

export function EmailStatusCell({ status, email }: EmailStatusCellProps) {
  const c = config[status];
  return (
    <Tooltip
      side="top"
      content={
        <div className="space-y-1">
          <div className={cn('font-semibold', c.tone)}>{c.label}</div>
          <div className="text-muted-foreground">{c.desc}</div>
          {email && <div className="text-foreground">{email}</div>}
        </div>
      }
    >
      <span className={cn('inline-flex items-center gap-1.5 text-xs', c.tone)}>
        <c.Icon className="h-3.5 w-3.5" />
        {status === 'missing' ? 'no email' : email ? email.split('@')[0].slice(0, 12) + (email.length > 20 ? '…' : '') : c.label}
      </span>
    </Tooltip>
  );
}
