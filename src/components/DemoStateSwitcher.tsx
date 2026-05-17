import { useEffect, useRef, useState } from 'react';
import { Wand2, ChevronUp, Check, Users, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DemoVariant = 'configured' | 'first-run';

interface DemoStateSwitcherProps {
  variant: DemoVariant;
  onChange: (variant: DemoVariant) => void;
}

const VARIANTS: { value: DemoVariant; label: string; description: string; icon: typeof Users }[] = [
  {
    value: 'configured',
    label: 'Configured',
    description: 'Senior Leaders + Unassigned segments pre-seeded.',
    icon: Users,
  },
  {
    value: 'first-run',
    label: 'First-run',
    description: 'No custom segments yet. Shows the onboarding hero.',
    icon: Sparkles,
  },
];

export function DemoStateSwitcher({ variant, onChange }: DemoStateSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const current = VARIANTS.find((v) => v.value === variant) ?? VARIANTS[0];

  return (
    <div ref={ref} className="fixed bottom-4 right-4 z-30">
      {open && (
        <div className="mb-2 w-72 rounded-xl border border-border bg-card p-1 shadow-2xl">
          <div className="border-b border-border px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Prototype demo states
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              Switch to preview different campaign configurations.
            </div>
          </div>
          {VARIANTS.map((v) => {
            const active = v.value === variant;
            return (
              <button
                key={v.value}
                onClick={() => {
                  onChange(v.value);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-start gap-2 rounded-md px-3 py-2.5 text-left transition-colors',
                  active ? 'bg-primary/10' : 'hover:bg-accent',
                )}
              >
                <div
                  className={cn(
                    'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md',
                    active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                  )}
                >
                  <v.icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={cn('text-xs font-semibold', active ? 'text-primary' : 'text-foreground')}>
                      {v.label}
                    </span>
                    {active && <Check className="h-3 w-3 text-primary" />}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{v.description}</div>
                </div>
              </button>
            );
          })}
          <div className="border-t border-border px-3 py-2 text-[10px] text-muted-foreground">
            Switching resets segments to the variant's seed.
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'group inline-flex items-center gap-2 rounded-full border border-dashed bg-card/90 px-3 py-2 text-xs font-medium shadow-lg backdrop-blur-md transition-colors',
          open
            ? 'border-primary text-primary'
            : 'border-border text-muted-foreground hover:border-primary/60 hover:text-foreground',
        )}
      >
        <Wand2 className="h-3.5 w-3.5" />
        Demo: <span className="text-foreground">{current.label}</span>
        <ChevronUp className={cn('h-3 w-3 transition-transform', !open && 'rotate-180')} />
      </button>
    </div>
  );
}
