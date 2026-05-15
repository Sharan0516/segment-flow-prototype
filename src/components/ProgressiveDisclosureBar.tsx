import { ArrowRight, AlertCircle } from 'lucide-react';

interface ProgressiveDisclosureBarProps {
  leadCount: number;
  customSegmentCount: number;
  unassignedCount: number;
  blockerText: string | null;
  onFixBlocker: () => void;
}

export function ProgressiveDisclosureBar({
  leadCount,
  customSegmentCount,
  unassignedCount,
  blockerText,
  onFixBlocker,
}: ProgressiveDisclosureBarProps) {
  const segmentsConfigured = customSegmentCount > 0;

  return (
    <div className="border-b border-border bg-gradient-to-r from-primary/5 via-background to-background px-6 py-4">
      <div>
        {segmentsConfigured ? (
          <>
            <h2 className="text-base font-semibold text-foreground">
              <span className="text-primary">{customSegmentCount + 1}</span> segment
              {customSegmentCount + 1 === 1 ? '' : 's'} routing{' '}
              <span className="text-primary">{leadCount}</span> leads.
            </h2>
            {blockerText ? (
              <button
                onClick={onFixBlocker}
                className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-warning/15 px-2 py-1 text-xs font-medium text-warning hover:bg-warning/25"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                {blockerText}
                <ArrowRight className="h-3 w-3" />
              </button>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                {unassignedCount === 0
                  ? 'All leads routed. Ready to launch.'
                  : `${unassignedCount} lead${unassignedCount === 1 ? '' : 's'} not yet assigned to a segment. Launch now or split further.`}
              </p>
            )}
          </>
        ) : (
          <>
            <h2 className="text-base font-semibold text-foreground">
              You have <span className="text-primary">{leadCount} leads</span> ready to outreach.
            </h2>
            {blockerText ? (
              <button
                onClick={onFixBlocker}
                className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-warning/15 px-2 py-1 text-xs font-medium text-warning hover:bg-warning/25"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                {blockerText}
                <ArrowRight className="h-3 w-3" />
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
