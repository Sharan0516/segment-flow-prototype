import { Mail, Check, Minus, X } from 'lucide-react';
import { LinkedinIcon } from './icons/LinkedinIcon';
import { Tooltip } from './ui/Tooltip';
import { cn } from '@/lib/utils';
import type { EmailStatus, LinkedinStatus } from '@/lib/types';

interface VerificationCellProps {
  emailStatus: EmailStatus;
  linkedinStatus: LinkedinStatus;
  email?: string;
  linkedinUrl?: string;
}

function emailTone(status: EmailStatus): { color: string; label: string; subicon: typeof Check } {
  if (status === 'verified') return { color: 'text-success', label: 'Verified', subicon: Check };
  if (status === 'unverified') return { color: 'text-muted-foreground', label: 'Pending validation', subicon: Minus };
  if (status === 'invalid') return { color: 'text-destructive-foreground', label: 'Invalid (bounced)', subicon: X };
  return { color: 'text-muted-foreground/40', label: 'No email on file', subicon: X };
}

function linkedinTone(status: LinkedinStatus): { color: string; label: string; subicon: typeof Check } {
  if (status === 'verified') return { color: 'text-success', label: 'Profile verified', subicon: Check };
  if (status === 'unverified') return { color: 'text-muted-foreground', label: 'Profile not yet verified', subicon: Minus };
  return { color: 'text-muted-foreground/40', label: 'No LinkedIn URL', subicon: X };
}

export function VerificationCell({ emailStatus, linkedinStatus, email, linkedinUrl }: VerificationCellProps) {
  const e = emailTone(emailStatus);
  const l = linkedinTone(linkedinStatus);
  const ESub = e.subicon;
  const LSub = l.subicon;

  return (
    <div className="inline-flex items-center gap-2">
      <Tooltip
        side="top"
        content={
          <div className="space-y-1">
            <div className={cn('font-semibold', e.color)}>Email: {e.label}</div>
            {email ? (
              <div className="text-foreground">{email}</div>
            ) : (
              <div className="text-muted-foreground">No email available</div>
            )}
          </div>
        }
      >
        <span className={cn('relative inline-flex h-6 w-6 items-center justify-center rounded-md border border-border', e.color)}>
          <Mail className="h-3 w-3" />
          <span className={cn('absolute -bottom-1 -right-1 inline-flex h-3 w-3 items-center justify-center rounded-full border border-card bg-card', e.color)}>
            <ESub className="h-2 w-2" strokeWidth={3} />
          </span>
        </span>
      </Tooltip>

      <Tooltip
        side="top"
        content={
          <div className="space-y-1">
            <div className={cn('font-semibold', l.color)}>LinkedIn: {l.label}</div>
            {linkedinUrl ? (
              <div className="text-foreground break-all">{linkedinUrl}</div>
            ) : (
              <div className="text-muted-foreground">No URL on file</div>
            )}
          </div>
        }
      >
        {linkedinUrl ? (
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noreferrer"
            className={cn(
              'relative inline-flex h-6 w-6 items-center justify-center rounded-md border border-border hover:bg-accent',
              l.color,
            )}
          >
            <LinkedinIcon className="h-3 w-3" />
            <span className={cn('absolute -bottom-1 -right-1 inline-flex h-3 w-3 items-center justify-center rounded-full border border-card bg-card', l.color)}>
              <LSub className="h-2 w-2" strokeWidth={3} />
            </span>
          </a>
        ) : (
          <span className={cn('relative inline-flex h-6 w-6 items-center justify-center rounded-md border border-border', l.color)}>
            <LinkedinIcon className="h-3 w-3" />
            <span className={cn('absolute -bottom-1 -right-1 inline-flex h-3 w-3 items-center justify-center rounded-full border border-card bg-card', l.color)}>
              <LSub className="h-2 w-2" strokeWidth={3} />
            </span>
          </span>
        )}
      </Tooltip>
    </div>
  );
}
