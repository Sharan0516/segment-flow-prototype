import { TrendingUp, Trophy, MessageSquare, CheckCircle2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { Segment, Sequence } from '@/lib/types';
import { cn } from '@/lib/utils';

interface AnalyticsViewProps {
  segments: Segment[];
  sequences: Sequence[];
}

export function AnalyticsView({ segments, sequences }: AnalyticsViewProps) {
  // Simulated final metrics
  const totalSent = 38;
  const totalOpened = 22;
  const totalReplied = 6;
  const totalMeetings = 2;

  return (
    <div className="p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground">Campaign performance</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Final results from 8 leads across {segments.length} segment{segments.length === 1 ? '' : 's'}.</p>
      </div>

      <div className="mb-5 grid grid-cols-4 gap-3">
        <SummaryStat label="Total sends" value={totalSent} change="+12%" trend="up" />
        <SummaryStat label="Open rate" value={`${Math.round((totalOpened / totalSent) * 100)}%`} change="+8%" trend="up" sublabel={`${totalOpened} of ${totalSent}`} />
        <SummaryStat label="Reply rate" value={`${Math.round((totalReplied / totalSent) * 100)}%`} change="-2%" trend="down" sublabel={`${totalReplied} replies`} />
        <SummaryStat label="Meetings booked" value={totalMeetings} change="+1" trend="up" />
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-foreground">Performance by segment</h3>
          <span className="text-xs text-muted-foreground">Click to drill into variant performance</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30 text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-2 text-left font-medium">Segment</th>
              <th className="px-3 py-2 text-left font-medium">Sequence</th>
              <th className="px-3 py-2 text-right font-medium">Sent</th>
              <th className="px-3 py-2 text-right font-medium">Open</th>
              <th className="px-3 py-2 text-right font-medium">Reply</th>
              <th className="px-3 py-2 text-right font-medium">Booked</th>
              <th className="px-3 py-2 text-left font-medium">Winner</th>
            </tr>
          </thead>
          <tbody>
            {segments.map((seg, idx) => {
              const seq = sequences.find((s) => s.id === seg.sequenceId);
              const sent = 15 + idx * 5;
              const open = Math.floor(sent * (0.5 + idx * 0.1));
              const reply = Math.floor(sent * (0.1 + idx * 0.05));
              const booked = idx;
              const isWinner = idx === 0 && seq && seq.variants.length > 1;
              return (
                <tr key={seg.id} className="border-b border-border/50 hover:bg-accent/40">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className={cn('h-1.5 w-1.5 rounded-full', seg.isDefault ? 'bg-muted-foreground' : 'bg-primary')} />
                      <span className="font-medium text-foreground">{seg.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{seq?.name}</td>
                  <td className="px-3 py-3 text-right text-foreground">{sent}</td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-foreground">{open}</span>
                    <span className="ml-1 text-xs text-muted-foreground">({Math.round((open / sent) * 100)}%)</span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-foreground">{reply}</span>
                    <span className="ml-1 text-xs text-muted-foreground">({Math.round((reply / sent) * 100)}%)</span>
                  </td>
                  <td className="px-3 py-3 text-right text-foreground">{booked}</td>
                  <td className="px-3 py-3">
                    {isWinner ? (
                      <span className="inline-flex items-center gap-1 rounded bg-success/15 px-1.5 py-0.5 text-xs text-success">
                        <Trophy className="h-3 w-3" />
                        Variant A
                      </span>
                    ) : seq && seq.variants.length > 1 ? (
                      <span className="text-xs text-muted-foreground">Inconclusive (n &lt; 100)</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No A/B</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/15 text-success">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">What worked</h3>
          </div>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <ArrowUpRight className="mt-0.5 h-3 w-3 shrink-0 text-success" />
              C-Suite segment had 2.3x higher reply rate than Default
            </li>
            <li className="flex items-start gap-2">
              <ArrowUpRight className="mt-0.5 h-3 w-3 shrink-0 text-success" />
              Variant A's "compliance risk" angle outperformed "ROI" by 18%
            </li>
            <li className="flex items-start gap-2">
              <ArrowUpRight className="mt-0.5 h-3 w-3 shrink-0 text-success" />
              No bounces · sender deliverability healthy
            </li>
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning/15 text-warning">
              <MessageSquare className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">What to try next</h3>
          </div>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <ArrowDownRight className="mt-0.5 h-3 w-3 shrink-0 text-warning" />
              Procurement segment underperformed on opens — test new subject lines
            </li>
            <li className="flex items-start gap-2">
              <ArrowDownRight className="mt-0.5 h-3 w-3 shrink-0 text-warning" />
              25% of leads had no email — build LinkedIn-only segment for similar campaigns
            </li>
            <li className="flex items-start gap-2">
              <TrendingUp className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
              Clone the C-Suite sequence as a template for the next Pharma campaign
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  change,
  trend,
  sublabel,
}: {
  label: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down';
  sublabel?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <div className="text-2xl font-semibold tracking-tight text-foreground">{value}</div>
        <span
          className={cn(
            'inline-flex items-center gap-0.5 rounded px-1.5 py-0 text-[10px] font-semibold',
            trend === 'up' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning',
          )}
        >
          {trend === 'up' ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
          {change}
        </span>
      </div>
      {sublabel && <div className="mt-0.5 text-xs text-muted-foreground">{sublabel}</div>}
    </div>
  );
}
