import { Beaker, Plus, Trash2, Sparkles, AlertTriangle, Info } from 'lucide-react';
import type { Variant } from '@/lib/types';
import { Input } from './ui/Input';
import { cn } from '@/lib/utils';

interface ABTestSectionProps {
  enabled: boolean;
  variants: Variant[];
  matchedCount: number;
  sequenceHasVariants: boolean;
  onToggle: (enabled: boolean) => void;
  onChange: (variants: Variant[]) => void;
}

const variantColors = ['bg-primary', 'bg-blue-500', 'bg-purple-500'];
const variantBg = ['bg-primary/10 border-primary/30', 'bg-blue-500/10 border-blue-500/30', 'bg-purple-500/10 border-purple-500/30'];

const newVariantTemplate = (index: number): Variant => ({
  id: `v-new-${index}-${Date.now()}`,
  label: String.fromCharCode(65 + index), // A, B, C
  angle: 'New angle',
  subjectPreview: '',
  bodyPreview: '',
  weight: 0,
});

function rebalance(variants: Variant[]): Variant[] {
  const n = variants.length;
  if (n === 0) return variants;
  const equal = 1 / n;
  return variants.map((v) => ({ ...v, weight: equal }));
}

export function ABTestSection({
  enabled,
  variants,
  matchedCount,
  sequenceHasVariants,
  onToggle,
  onChange,
}: ABTestSectionProps) {
  // Sample size logic
  const minSampleSize = 20;
  const moderateSampleSize = 50;
  const blocked = matchedCount < minSampleSize;
  const warned = !blocked && matchedCount < moderateSampleSize;

  const addVariant = () => {
    if (variants.length >= 3) return;
    const next = [...variants, newVariantTemplate(variants.length)];
    onChange(rebalance(next));
  };

  const removeVariant = (id: string) => {
    const next = variants.filter((v) => v.id !== id);
    onChange(rebalance(next));
  };

  const updateVariant = (id: string, patch: Partial<Variant>) => {
    onChange(variants.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  };

  const setWeight = (id: string, newWeightPct: number) => {
    const others = variants.filter((v) => v.id !== id);
    const newWeight = Math.max(0.1, Math.min(0.9, newWeightPct / 100));
    const remainingWeight = 1 - newWeight;
    const eachOther = remainingWeight / others.length;
    onChange(
      variants.map((v) => (v.id === id ? { ...v, weight: newWeight } : { ...v, weight: eachOther })),
    );
  };

  const totalWeight = variants.reduce((acc, v) => acc + v.weight, 0);

  return (
    <div className="rounded-xl border border-border bg-secondary/40">
      {/* Header / toggle */}
      <div className="flex items-start justify-between gap-4 p-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
              enabled ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
            )}
          >
            <Beaker className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">Test message variations</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {enabled
                ? `Splitting ${matchedCount} lead${matchedCount === 1 ? '' : 's'} across ${variants.length} variant${variants.length === 1 ? '' : 's'} to measure what lands best.`
                : sequenceHasVariants
                ? 'This sequence already has variants. Turn on to use them, or send the primary only.'
                : 'Everyone in this segment gets the same version. Turn on to compare two angles.'}
            </div>
          </div>
        </div>
        <ToggleSwitch checked={enabled} onChange={onToggle} disabled={blocked} />
      </div>

      {/* Sample size warnings */}
      {blocked && (
        <div className="mx-4 mb-3 flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-2.5">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
          <div className="text-xs">
            <div className="font-medium text-warning">Too few leads to A/B test</div>
            <div className="mt-0.5 text-muted-foreground">
              Need at least {minSampleSize} leads. This segment has {matchedCount}. Will send the primary version only.
            </div>
          </div>
        </div>
      )}

      {enabled && !blocked && warned && (
        <div className="mx-4 mb-3 flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-2.5">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
          <div className="text-xs">
            <div className="font-medium text-warning">Small sample</div>
            <div className="mt-0.5 text-muted-foreground">
              Wide confidence intervals expected with {matchedCount} leads. Recommend {moderateSampleSize}+ per variant for reliable directional results.
            </div>
          </div>
        </div>
      )}

      {/* Variant cards */}
      {enabled && !blocked && variants.length > 0 && (
        <div className="space-y-3 border-t border-border p-4">
          {/* Distribution bar */}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>Split</span>
              <span>{variants.map((v) => `${v.label} ${Math.round(v.weight * 100)}%`).join(' · ')}</span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-muted">
              {variants.map((v, idx) => (
                <div
                  key={v.id}
                  className={cn('transition-all', variantColors[idx % variantColors.length])}
                  style={{ width: `${v.weight * 100}%` }}
                  title={`Variant ${v.label}: ${Math.round(v.weight * 100)}%`}
                />
              ))}
            </div>
            {Math.abs(totalWeight - 1) > 0.001 && (
              <div className="mt-1 text-[10px] text-warning">Weights total {Math.round(totalWeight * 100)}% (should be 100%)</div>
            )}
          </div>

          {/* Variant cards grid */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {variants.map((v, idx) => (
              <div
                key={v.id}
                className={cn(
                  'rounded-lg border p-3 transition-colors',
                  variantBg[idx % variantBg.length],
                )}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white',
                        variantColors[idx % variantColors.length],
                      )}
                    >
                      {v.label}
                    </span>
                    <div className="text-xs font-semibold text-foreground">Variant {v.label}</div>
                  </div>
                  {variants.length > 1 && (
                    <button
                      onClick={() => removeVariant(v.id)}
                      className="rounded p-1 text-muted-foreground hover:bg-destructive/15 hover:text-destructive-foreground"
                      title="Remove variant"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">Angle</label>
                    <Input
                      value={v.angle}
                      onChange={(e) => updateVariant(v.id, { angle: e.target.value })}
                      className="h-7 text-xs"
                      placeholder="e.g., Lead with cost savings"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">First-email subject</label>
                    <Input
                      value={v.subjectPreview}
                      onChange={(e) => updateVariant(v.id, { subjectPreview: e.target.value })}
                      className="h-7 text-xs"
                      placeholder="e.g., Cutting your travel spend by 15-20%"
                    />
                  </div>
                  {v.bodyPreview && (
                    <div className="rounded border border-border bg-background/40 p-2 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                      {v.bodyPreview}
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Weight</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={10}
                        max={90}
                        step={10}
                        value={Math.round(v.weight * 100)}
                        onChange={(e) => setWeight(v.id, Number(e.target.value))}
                        className="h-1 w-20 accent-primary"
                      />
                      <span className="w-8 text-right text-xs font-semibold text-foreground">{Math.round(v.weight * 100)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Add variant button */}
            {variants.length < 3 && (
              <button
                onClick={addVariant}
                className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Plus className="h-4 w-4" />
                Add Variant {String.fromCharCode(65 + variants.length)}
                <span className="text-[10px] text-muted-foreground">{variants.length + 1} of 3 max</span>
              </button>
            )}
          </div>

          {/* AI suggest helper */}
          <button className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-primary/30 bg-primary/5 py-1.5 text-xs text-primary hover:bg-primary/10">
            <Sparkles className="h-3 w-3" />
            Generate a contrasting angle with AI
          </button>
        </div>
      )}
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-10 shrink-0 rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-muted',
        disabled && 'opacity-40 cursor-not-allowed',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-[18px]' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}
