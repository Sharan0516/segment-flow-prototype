import { Layers, Lightbulb, Plus, Sparkles, ArrowRight } from 'lucide-react';

interface FirstRunEducationProps {
  leadCount: number;
  blockerText: string | null;
  onCreateSegment: () => void;
  onSendToAll: () => void;
}

const ATTRIBUTES = [
  'title',
  'seniority',
  'location',
  'industry',
  'company size',
  'channel',
];

export function FirstRunEducation({
  leadCount,
  blockerText,
  onCreateSegment,
  onSendToAll,
}: FirstRunEducationProps) {
  return (
    <div className="mb-1 rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-6">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
        <Layers className="h-3 w-3" />
        Personalize with segments
      </div>

      <div className="max-w-3xl space-y-3 text-sm leading-relaxed">
        <p className="text-foreground">
          A <span className="font-semibold text-foreground">segment</span> is a group of leads that gets its own tailored sequence.
          You can group leads by{' '}
          {ATTRIBUTES.map((a, i) => (
            <span key={a}>
              <span className="font-medium text-foreground">{a}</span>
              {i < ATTRIBUTES.length - 2 ? ', ' : i === ATTRIBUTES.length - 2 ? ', or ' : ''}
            </span>
          ))}
          {' '}— any attribute on your leads.
        </p>

        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">Why bother?</span> Audiences respond to different angles.
          Segmented sends see <span className="font-semibold text-primary">2-3× higher reply rates</span> than one-size-fits-all.
        </p>

        <div className="flex items-start gap-2 rounded-lg border border-border bg-card/60 p-3">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">The segment is who. The sequence is what you say.</span>{' '}
            Different segments can share the same sequence — you only need new copy when you actually want a different angle.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          onClick={onCreateSegment}
          className="group inline-flex h-10 items-center gap-2 rounded-xl border border-primary/40 bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Create your first segment
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
        <span className="text-xs text-muted-foreground">or</span>
        <button
          onClick={onSendToAll}
          disabled={!!blockerText}
          title={blockerText ? 'Add a mailbox in Settings before launching.' : undefined}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-secondary px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          Send the same message to all {leadCount}
        </button>
      </div>
    </div>
  );
}
