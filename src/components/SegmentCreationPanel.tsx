import { useEffect, useMemo, useRef, useState } from 'react';
import {
  X, ChevronRight, ChevronLeft, Sparkles, Copy, Library,
  Building2, MapPin, Briefcase, Mail, Award,
  Check, ArrowRight, AlertTriangle, Lock, ArrowRightLeft, AtSign,
} from 'lucide-react';
import { LinkedinIcon } from './icons/LinkedinIcon';
import type { Lead, Segment, Sender, Sequence, SequenceSource, Variant } from '@/lib/types';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Checkbox } from './ui/Checkbox';
import { ABTestSection } from './ABTestSection';
import { cn } from '@/lib/utils';

interface SegmentCreationPanelProps {
  open: boolean;
  onClose: () => void;
  leads: Lead[];
  sequences: Sequence[];
  senders: Sender[];
  onSave: (segment: Omit<Segment, 'id'>, resolution: 'skip' | 'move') => void;
  existingSegments: Segment[];
}

type Step = 'name' | 'audience' | 'message' | 'variants' | 'senders' | 'preview';

interface FilterDraft {
  title: string;
  location: string;
  companies: string[];
  industries: string[];
  seniority: string[];
  channel: 'any' | 'has_email' | 'linkedin_only' | 'has_both';
  scoreMin?: number;
  scoreMax?: number;
}

const emptyFilter: FilterDraft = {
  title: '',
  location: '',
  companies: [],
  industries: [],
  seniority: [],
  channel: 'any',
};

const STEP_ORDER: Step[] = ['name', 'audience', 'message', 'variants', 'senders', 'preview'];

const seniorityOptions = ['C-Suite', 'VP / Director', 'Manager', 'IC / Individual'];
const industryOptions = ['Pharmaceuticals', 'Healthcare', 'Biotech', 'Technology', 'Financial Services'];

const sourceOptions: { value: SequenceSource; icon: typeof Library; title: string; subtitle: string }[] = [
  {
    value: 'use-existing',
    icon: Library,
    title: 'Use a message flow from the library',
    subtitle: 'Pick an existing flow. Edits propagate to every campaign using it.',
  },
  {
    value: 'clone',
    icon: Copy,
    title: 'Clone a flow and edit',
    subtitle: 'Copy an existing flow and tweak the steps just for this segment.',
  },
  {
    value: 'generate',
    icon: Sparkles,
    title: 'Generate a new flow with AI',
    subtitle: 'Draft a tailored multi-step message flow for this audience.',
  },
];

export function SegmentCreationPanel({
  open,
  onClose,
  leads,
  sequences,
  senders,
  onSave,
  existingSegments,
}: SegmentCreationPanelProps) {
  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [sequenceSource, setSequenceSource] = useState<SequenceSource | null>(null);
  const [sequenceId, setSequenceId] = useState<string>('');
  const flowPickerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<FilterDraft>(emptyFilter);
  const [abEnabled, setAbEnabled] = useState(false);
  const [abVariants, setAbVariants] = useState<Variant[]>([]);
  const [resolution, setResolution] = useState<'skip' | 'move' | null>(null);
  const [senderMode, setSenderMode] = useState<'campaign-pool' | 'segment-specific'>('campaign-pool');
  const [segmentSenderIds, setSegmentSenderIds] = useState<string[]>([]);

  const selectedSequence = sequences.find((s) => s.id === sequenceId);

  // Scroll to the flow picker when a source is picked
  useEffect(() => {
    if (sequenceSource && flowPickerRef.current) {
      const id = setTimeout(() => {
        flowPickerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return () => clearTimeout(id);
    }
  }, [sequenceSource]);

  // Pre-fill variants from the selected flow when sequence changes
  useEffect(() => {
    if (!selectedSequence) return;
    const hasMulti = selectedSequence.variants.length > 1;
    setAbEnabled(hasMulti);
    setAbVariants(
      hasMulti
        ? selectedSequence.variants.map((v) => ({ ...v }))
        : selectedSequence.variants[0]
        ? [{ ...selectedSequence.variants[0] }]
        : [],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sequenceId]);

  const matched = useMemo(() => {
    return leads.filter((l) => {
      if (filter.title && !l.title.toLowerCase().includes(filter.title.toLowerCase())) return false;
      if (filter.location && !l.location.toLowerCase().includes(filter.location.toLowerCase())) return false;
      if (filter.companies.length && !filter.companies.includes(l.company)) return false;
      if (filter.channel === 'has_email' && !l.email) return false;
      if (filter.channel === 'linkedin_only' && !!l.email) return false;
      if (filter.channel === 'has_both' && (!l.email || !l.linkedinUrl)) return false;
      if (filter.scoreMin !== undefined && l.score < filter.scoreMin) return false;
      if (filter.scoreMax !== undefined && l.score > filter.scoreMax) return false;
      return true;
    });
  }, [leads, filter]);

  // Conflict analysis: which matched leads are claimed by other CUSTOM (non-default) segments?
  const conflicts = useMemo(() => {
    const customSegments = existingSegments.filter((s) => !s.isDefault);
    const claimed = new Map<string, Segment>();
    customSegments.forEach((seg) => {
      seg.matchedLeadIds.forEach((id) => {
        if (!claimed.has(id)) claimed.set(id, seg);
      });
    });

    const inOtherSegment: { lead: Lead; segment: Segment; locked: boolean }[] = [];
    const movable: { lead: Lead; segment: Segment }[] = [];
    const locked: { lead: Lead; segment: Segment }[] = [];
    matched.forEach((l) => {
      const seg = claimed.get(l.id);
      if (!seg) return;
      const isLocked = l.outreachStarted;
      inOtherSegment.push({ lead: l, segment: seg, locked: isLocked });
      if (isLocked) locked.push({ lead: l, segment: seg });
      else movable.push({ lead: l, segment: seg });
    });

    // Group by segment for display
    const bySegment = new Map<
      string,
      { segment: Segment; movableLeads: Lead[]; lockedLeads: Lead[] }
    >();
    inOtherSegment.forEach(({ lead, segment, locked: l }) => {
      const entry =
        bySegment.get(segment.id) ?? { segment, movableLeads: [], lockedLeads: [] };
      if (l) entry.lockedLeads.push(lead);
      else entry.movableLeads.push(lead);
      bySegment.set(segment.id, entry);
    });

    return {
      inOtherSegment,
      movable,
      locked,
      bySegment: Array.from(bySegment.values()),
    };
  }, [matched, existingSegments]);

  // Effective leads after applying resolution: always excludes locked; excludes movable if Skip or unresolved
  const effectiveMatched = useMemo(() => {
    const lockedIds = new Set(conflicts.locked.map((c) => c.lead.id));
    if (resolution === 'move') {
      return matched.filter((l) => !lockedIds.has(l.id));
    }
    const movableIds = new Set(conflicts.movable.map((c) => c.lead.id));
    return matched.filter((l) => !lockedIds.has(l.id) && !movableIds.has(l.id));
  }, [matched, conflicts, resolution]);

  const conflictBySegmentLeadId = useMemo(() => {
    const map = new Map<string, { segment: Segment; locked: boolean }>();
    conflicts.inOtherSegment.forEach((c) => map.set(c.lead.id, { segment: c.segment, locked: c.locked }));
    return map;
  }, [conflicts]);

  if (!open) return null;

  const steps: { key: Step; label: string }[] = [
    { key: 'name', label: 'Name' },
    { key: 'audience', label: 'Audience' },
    { key: 'message', label: 'Message' },
    { key: 'variants', label: 'Variants' },
    { key: 'senders', label: 'Senders' },
    { key: 'preview', label: 'Preview' },
  ];

  const currentStepIdx = steps.findIndex((s) => s.key === step);

  const canAdvance = () => {
    if (step === 'name') return name.trim().length > 0;
    if (step === 'audience') {
      if (effectiveMatched.length === 0 && conflicts.movable.length === 0) return false;
      if (conflicts.movable.length > 0 && resolution === null) return false;
      return effectiveMatched.length > 0 || resolution === 'move';
    }
    if (step === 'message') {
      if (sequenceSource === null) return false;
      if (sequenceSource === 'generate') return true;
      return !!sequenceId;
    }
    if (step === 'variants') return true; // optional
    if (step === 'senders') {
      if (senderMode === 'segment-specific' && senders.length > 0) {
        return segmentSenderIds.length > 0;
      }
      return true;
    }
    return true;
  };

  const advance = () => {
    const next = STEP_ORDER[STEP_ORDER.indexOf(step) + 1];
    if (next) setStep(next);
    else handleSave();
  };

  const back = () => {
    const prev = STEP_ORDER[STEP_ORDER.indexOf(step) - 1];
    if (prev) setStep(prev);
  };

  const handleSave = () => {
    onSave(
      {
        name: name.trim() || 'New segment',
        isDefault: false,
        rules: [],
        sequenceId,
        sequenceSource: sequenceSource ?? 'use-existing',
        senderMode,
        segmentSenderIds: senderMode === 'segment-specific' ? segmentSenderIds : undefined,
        matchedLeadIds: effectiveMatched.map((l) => l.id),
        abTest: { enabled: abEnabled && abVariants.length > 1, variants: abVariants },
      },
      resolution ?? 'skip',
    );
    setStep('name');
    setName('');
    setAbEnabled(false);
    setAbVariants([]);
    setResolution(null);
    setSenderMode('campaign-pool');
    setSegmentSenderIds([]);
    setSequenceSource(null);
    setSequenceId('');
    setFilter(emptyFilter);
    onClose();
  };

  const unresolvedConflict =
    step === 'audience' && conflicts.movable.length > 0 && resolution === null;

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[920px] max-w-[95vw] border-l border-border bg-card shadow-2xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">New segment</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Group leads who should get different messaging. Step {currentStepIdx + 1} of {steps.length}.
              </p>
            </div>
            <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-1 border-b border-border bg-surface px-6 py-3 overflow-x-auto scrollbar-thin">
            {steps.map((s, idx) => {
              const isActive = s.key === step;
              const isDone = idx < currentStepIdx;
              return (
                <div key={s.key} className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => idx <= currentStepIdx && setStep(s.key)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium',
                      isActive
                        ? 'bg-primary/15 text-primary'
                        : isDone
                        ? 'text-foreground hover:bg-accent'
                        : 'text-muted-foreground',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold',
                        isActive ? 'bg-primary text-primary-foreground' : isDone ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {isDone ? <Check className="h-2.5 w-2.5" /> : idx + 1}
                    </span>
                    {s.label}
                  </button>
                  {idx < steps.length - 1 && <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />}
                </div>
              );
            })}
          </div>

          {/* Body */}
          <div className="flex flex-1 overflow-hidden">
            {step === 'name' && (
              <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
                <div className="mx-auto max-w-md space-y-6">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">What audience is this for?</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Give your segment a short, human name. You'll see it everywhere in the campaign.
                    </p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Segment name
                    </label>
                    <Input
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Senior Leaders, LinkedIn-only, LATAM Region"
                    />
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {['Senior Leaders', 'LinkedIn-only', 'LATAM Region', 'No email'].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setName(preset)}
                          className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground hover:text-foreground"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 'audience' && (
              <>
                {/* Filters column */}
                <div className="w-[340px] shrink-0 overflow-y-auto border-r border-border p-6 scrollbar-thin">
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Who matches this segment?</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Filters AND together. Preview updates live on the right.
                      </p>
                    </div>

                    <FilterField icon={Briefcase} label="Job title contains">
                      <Input
                        value={filter.title}
                        onChange={(e) => setFilter({ ...filter, title: e.target.value })}
                        placeholder="e.g., CFO, VP, Director"
                      />
                    </FilterField>

                    <FilterField icon={Award} label="Seniority">
                      <div className="flex flex-wrap gap-1.5">
                        {seniorityOptions.map((s) => {
                          const active = filter.seniority.includes(s);
                          return (
                            <button
                              key={s}
                              onClick={() =>
                                setFilter({
                                  ...filter,
                                  seniority: active ? filter.seniority.filter((x) => x !== s) : [...filter.seniority, s],
                                })
                              }
                              className={cn(
                                'rounded-full border px-2.5 py-0.5 text-xs',
                                active ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:text-foreground',
                              )}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    </FilterField>

                    <FilterField icon={MapPin} label="Location contains">
                      <Input
                        value={filter.location}
                        onChange={(e) => setFilter({ ...filter, location: e.target.value })}
                        placeholder="e.g., United States, India"
                      />
                    </FilterField>

                    <FilterField icon={Building2} label="Industry">
                      <div className="flex flex-wrap gap-1.5">
                        {industryOptions.map((s) => {
                          const active = filter.industries.includes(s);
                          return (
                            <button
                              key={s}
                              onClick={() =>
                                setFilter({
                                  ...filter,
                                  industries: active ? filter.industries.filter((x) => x !== s) : [...filter.industries, s],
                                })
                              }
                              className={cn(
                                'rounded-full border px-2.5 py-0.5 text-xs',
                                active ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:text-foreground',
                              )}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    </FilterField>

                    <FilterField icon={Mail} label="Channel availability">
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { v: 'any' as const, label: 'Any' },
                          { v: 'has_email' as const, label: 'Has email' },
                          { v: 'linkedin_only' as const, label: 'LinkedIn only' },
                          { v: 'has_both' as const, label: 'Email + LinkedIn' },
                        ].map(({ v, label }) => {
                          const active = filter.channel === v;
                          return (
                            <button
                              key={v}
                              onClick={() => setFilter({ ...filter, channel: v })}
                              className={cn(
                                'rounded-md border px-2 py-1 text-xs',
                                active ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:text-foreground',
                              )}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </FilterField>

                    <FilterField icon={Award} label="Score range">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={filter.scoreMin ?? ''}
                          onChange={(e) =>
                            setFilter({ ...filter, scoreMin: e.target.value ? Number(e.target.value) : undefined })
                          }
                        />
                        <span className="text-xs text-muted-foreground">to</span>
                        <Input
                          type="number"
                          placeholder="Max"
                          value={filter.scoreMax ?? ''}
                          onChange={(e) =>
                            setFilter({ ...filter, scoreMax: e.target.value ? Number(e.target.value) : undefined })
                          }
                        />
                      </div>
                    </FilterField>
                  </div>
                </div>

                {/* Live preview column */}
                <div className="flex flex-1 flex-col overflow-hidden">
                  <div className="sticky top-0 z-10 border-b border-border bg-gradient-to-r from-primary/10 to-transparent px-6 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Will join this segment</div>
                        <div className="mt-0.5 text-xl font-semibold text-foreground">
                          {effectiveMatched.length}{' '}
                          <span className="text-sm font-normal text-muted-foreground">
                            of {matched.length} matched · {leads.length} total
                          </span>
                        </div>
                      </div>
                      {matched.length === 0 && (
                        <div className="rounded-md bg-warning/15 px-2 py-1 text-xs font-medium text-warning">
                          No leads match. Loosen filters.
                        </div>
                      )}
                      {matched.length > 0 && (
                        <div className="text-right text-xs text-muted-foreground">
                          <div>
                            <span className="text-foreground">{effectiveMatched.filter((l) => l.email).length}</span> with email
                          </div>
                          <div>
                            <span className="text-foreground">{effectiveMatched.filter((l) => l.linkedinUrl).length}</span> with LinkedIn
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto scrollbar-thin">
                    {/* Conflict resolution — the action surface for this step */}
                    {conflicts.inOtherSegment.length > 0 && (
                      <div className="border-b border-border bg-warning/5 p-5">
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-warning/15">
                            <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-foreground">
                              {conflicts.inOtherSegment.length} matched lead{conflicts.inOtherSegment.length === 1 ? ' is' : 's are'} already in another segment
                            </div>
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              A lead can only be in one segment at a time. Decide what to do with the movable ones below.
                            </div>

                            {/* Conflicted lead names, grouped by source segment */}
                            <div className="mt-3 space-y-3">
                              {conflicts.bySegment.map(({ segment, movableLeads, lockedLeads }) => (
                                <div key={segment.id} className="rounded-lg border border-border/80 bg-card/50 p-3">
                                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    From <span className="text-foreground">{segment.name}</span>
                                  </div>

                                  {movableLeads.length > 0 && (
                                    <div className="mb-2">
                                      <div className="mb-1 text-[11px] font-medium text-foreground">
                                        {movableLeads.length} can move
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {movableLeads.map((l) => (
                                          <span
                                            key={l.id}
                                            className={cn(
                                              'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] transition-colors',
                                              resolution === 'move'
                                                ? 'border-primary/40 bg-primary/10 text-primary'
                                                : resolution === 'skip'
                                                ? 'border-border bg-secondary text-muted-foreground line-through opacity-60'
                                                : 'border-border bg-background text-foreground',
                                            )}
                                            title={l.title}
                                          >
                                            {resolution === 'move' && <ArrowRightLeft className="h-2.5 w-2.5" />}
                                            {l.name}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {lockedLeads.length > 0 && (
                                    <div>
                                      <div className="mb-1 flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                                        <Lock className="h-2.5 w-2.5" />
                                        {lockedLeads.length} locked — outreach in progress, can't move
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {lockedLeads.map((l) => (
                                          <span
                                            key={l.id}
                                            className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
                                            title={l.title}
                                          >
                                            <Lock className="h-2.5 w-2.5" />
                                            {l.name}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Action cards — primary decision surface */}
                            {conflicts.movable.length > 0 && (
                              <div className="mt-4">
                                <div
                                  className={cn(
                                    'mb-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-wider',
                                    resolution === null
                                      ? 'bg-warning/15 text-warning'
                                      : 'text-success',
                                  )}
                                >
                                  {resolution === null ? (
                                    <>
                                      <AlertTriangle className="h-3 w-3" />
                                      Pick one to continue
                                    </>
                                  ) : (
                                    <>
                                      <Check className="h-3 w-3" />
                                      Resolution chosen
                                    </>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    onClick={() => setResolution('skip')}
                                    className={cn(
                                      'group flex flex-col items-start gap-1 rounded-lg border-2 p-3 text-left transition-all',
                                      resolution === 'skip'
                                        ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/20'
                                        : 'border-border bg-background hover:border-primary/50 hover:bg-primary/5',
                                    )}
                                  >
                                    <div className="flex w-full items-center justify-between">
                                      <span className="text-sm font-semibold text-foreground">Skip them</span>
                                      {resolution === 'skip' && (
                                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                                          <Check className="h-2.5 w-2.5 text-primary-foreground" />
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[11px] text-muted-foreground">
                                      Leave the {conflicts.movable.length} in their current segment
                                    </span>
                                  </button>
                                  <button
                                    onClick={() => setResolution('move')}
                                    className={cn(
                                      'group flex flex-col items-start gap-1 rounded-lg border-2 p-3 text-left transition-all',
                                      resolution === 'move'
                                        ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/20'
                                        : 'border-border bg-background hover:border-primary/50 hover:bg-primary/5',
                                    )}
                                  >
                                    <div className="flex w-full items-center justify-between">
                                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                                        <ArrowRightLeft className="h-3.5 w-3.5" />
                                        Move {conflicts.movable.length} here
                                      </span>
                                      {resolution === 'move' && (
                                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                                          <Check className="h-2.5 w-2.5 text-primary-foreground" />
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[11px] text-muted-foreground">
                                      Pull them out of their current segment
                                    </span>
                                  </button>
                                </div>
                              </div>
                            )}
                            {conflicts.movable.length === 0 && conflicts.locked.length > 0 && (
                              <div className="mt-3 text-[11px] text-muted-foreground">
                                All conflicting leads are locked. They'll stay in their current segment.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Lead table — non-conflicting matched leads */}
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-secondary/30 text-xs uppercase text-muted-foreground">
                          <th className="px-4 py-2 text-left font-medium">Name</th>
                          <th className="px-4 py-2 text-left font-medium">Company</th>
                          <th className="px-4 py-2 text-left font-medium">Channel</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matched.map((l) => {
                          const conflict = conflictBySegmentLeadId.get(l.id);
                          const isLocked = conflict?.locked;
                          const willBeSkipped = conflict && (isLocked || resolution !== 'move');
                          return (
                            <tr
                              key={l.id}
                              className={cn(
                                'border-b border-border/50 hover:bg-accent/40',
                                willBeSkipped && 'opacity-50',
                              )}
                            >
                              <td className="px-4 py-2.5">
                                <div className="font-medium text-foreground">{l.name}</div>
                                <div className="truncate text-xs text-muted-foreground" title={l.title}>{l.title}</div>
                              </td>
                              <td className="px-4 py-2.5 text-sm text-foreground">
                                {l.company}
                                <div className="text-xs text-muted-foreground">{l.location}</div>
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="flex flex-col items-start gap-1">
                                  <div className="flex items-center gap-1.5">
                                    {l.email ? (
                                      <span className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-[10px] text-foreground">
                                        <Mail className="h-2.5 w-2.5" /> email
                                      </span>
                                    ) : null}
                                    {l.linkedinUrl ? (
                                      <span className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-[10px] text-foreground">
                                        <LinkedinIcon className="h-2.5 w-2.5" /> linkedin
                                      </span>
                                    ) : null}
                                  </div>
                                  {conflict && (
                                    <span
                                      className={cn(
                                        'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium',
                                        isLocked
                                          ? 'bg-muted text-muted-foreground'
                                          : resolution === 'move'
                                          ? 'bg-primary/15 text-primary'
                                          : 'bg-secondary text-muted-foreground',
                                      )}
                                      title={
                                        isLocked
                                          ? `Locked: outreach in progress in ${conflict.segment.name}`
                                          : resolution === 'move'
                                          ? `Will move from ${conflict.segment.name}`
                                          : `Stays in ${conflict.segment.name}`
                                      }
                                    >
                                      {isLocked ? (
                                        <Lock className="h-2.5 w-2.5" />
                                      ) : resolution === 'move' ? (
                                        <ArrowRightLeft className="h-2.5 w-2.5" />
                                      ) : (
                                        <ChevronLeft className="h-2.5 w-2.5" />
                                      )}
                                      {conflict.segment.name}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {matched.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-4 py-12 text-center text-sm text-muted-foreground">
                              No leads match current filters
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {step === 'message' && (
              <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
                <div className="mx-auto max-w-2xl space-y-6">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">What messages should this segment receive?</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      A <span className="text-foreground">message flow</span> is the multi-step outreach (your library calls these "Sequences"). Pick where it comes from.
                    </p>
                  </div>

                  <div>
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Source
                    </div>
                    <div className="grid gap-3">
                      {sourceOptions.map((opt) => {
                        const active = sequenceSource === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => {
                              setSequenceSource(opt.value);
                              if (opt.value !== sequenceSource) setSequenceId('');
                            }}
                            className={cn(
                              'group flex items-start gap-3 rounded-xl border p-4 text-left transition-colors',
                              active
                                ? 'border-primary bg-primary/10'
                                : 'border-border bg-secondary/40 hover:border-primary/40',
                            )}
                          >
                            <div
                              className={cn(
                                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                                active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                              )}
                            >
                              <opt.icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">{opt.title}</span>
                                {active && (
                                  <span className="inline-flex items-center rounded-full bg-primary px-1.5 py-0 text-[10px] font-semibold uppercase text-primary-foreground">
                                    Selected
                                  </span>
                                )}
                              </div>
                              <div className="mt-0.5 text-xs text-muted-foreground">{opt.subtitle}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {sequenceSource !== null && (
                    <div
                      ref={flowPickerRef}
                      className="animate-in fade-in slide-in-from-top-2 duration-300"
                    >
                      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {sequenceSource === 'generate' ? 'What will be drafted' : sequenceSource === 'clone' ? 'Flow to clone from' : 'Flow to use'}
                      </div>

                      {sequenceSource === 'generate' ? (
                        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                          <div className="flex items-start gap-3">
                            <Sparkles className="h-5 w-5 shrink-0 text-primary" />
                            <div>
                              <div className="text-sm font-medium text-foreground">A tailored message flow will be drafted</div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                Using the {effectiveMatched.length} leads in this segment and the campaign plan, Copilot will create a multi-step flow.
                                You'll review before launch.
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {sequences.map((s) => {
                            const active = sequenceId === s.id;
                            return (
                              <button
                                key={s.id}
                                onClick={() => setSequenceId(s.id)}
                                className={cn(
                                  'flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors',
                                  active ? 'border-primary bg-primary/10' : 'border-border bg-secondary/40 hover:border-primary/40',
                                )}
                              >
                                <div>
                                  <div className="text-sm font-medium text-foreground">{s.name}</div>
                                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{s.steps} steps · {s.durationDays} days</span>
                                    <span className="rounded bg-muted px-1.5 py-0 text-[10px]">{s.channel.replace(/_/g, ' → ')}</span>
                                    {s.variants.length > 1 && (
                                      <span className="inline-flex items-center rounded bg-primary/15 px-1.5 py-0 text-[10px] text-primary">
                                        A/B · {s.variants.length} variants
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {active && <Check className="h-4 w-4 text-primary" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 'variants' && (
              <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
                <div className="mx-auto max-w-2xl space-y-5">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Test message variations?</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Run an A/B test on the message for this segment. Optional — leave off if everyone should get the same version.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-secondary/40 p-4">
                    <ABTestSection
                      enabled={abEnabled}
                      variants={abVariants}
                      matchedCount={effectiveMatched.length}
                      sequenceHasVariants={(selectedSequence?.variants.length ?? 0) > 1}
                      onToggle={(v) => {
                        setAbEnabled(v);
                        if (v && abVariants.length < 2) {
                          const base = abVariants[0] ?? selectedSequence?.variants[0];
                          const newB: Variant = {
                            id: `v-new-b-${Date.now()}`,
                            label: 'B',
                            angle: 'Try a contrasting angle',
                            subjectPreview: '',
                            bodyPreview: '',
                            weight: 0.5,
                          };
                          setAbVariants(
                            base
                              ? [{ ...base, label: 'A', weight: 0.5 }, newB]
                              : [
                                  {
                                    id: 'v-new-a-' + Date.now(),
                                    label: 'A',
                                    angle: 'Primary angle',
                                    subjectPreview: '',
                                    bodyPreview: '',
                                    weight: 0.5,
                                  },
                                  newB,
                                ],
                          );
                        }
                      }}
                      onChange={setAbVariants}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 'senders' && (
              <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
                <div className="mx-auto max-w-2xl space-y-5">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Who sends to this segment?</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Pick which mailboxes send to leads in this segment. Multiple senders rotate round-robin.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-secondary/40 p-4">
                    <SendersConfig
                      senders={senders}
                      senderMode={senderMode}
                      segmentSenderIds={segmentSenderIds}
                      onModeChange={(m) => {
                        setSenderMode(m);
                        if (m === 'segment-specific' && segmentSenderIds.length === 0 && senders.length > 0) {
                          setSegmentSenderIds([senders[0].id]);
                        }
                      }}
                      onIdsChange={setSegmentSenderIds}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 'preview' && (
              <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
                <div className="mx-auto max-w-md space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Ready to add this segment?</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Review and confirm. You can edit anything later.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-secondary/40 p-4">
                    <div className="space-y-3 text-sm">
                      <ReviewRow label="Name" value={name || '(unnamed segment)'} />
                      <ReviewRow
                        label="Audience"
                        value={`${effectiveMatched.length} leads${
                          conflicts.movable.length > 0 && resolution === 'move'
                            ? ` (incl. ${conflicts.movable.length} moved)`
                            : conflicts.movable.length > 0 && resolution === 'skip'
                            ? ` (${conflicts.movable.length} kept in their current segment)`
                            : ''
                        }`}
                      />
                      <ReviewRow
                        label="Messaging"
                        value={
                          sequenceSource === 'generate'
                            ? 'AI-generated (will draft on save)'
                            : `${sequenceSource === 'clone' ? 'Cloned from' : 'Linked to'}: ${
                                sequences.find((s) => s.id === sequenceId)?.name
                              }`
                        }
                      />
                      <ReviewRow
                        label="A/B test"
                        value={
                          abEnabled && abVariants.length > 1
                            ? `${abVariants.length} variants · ${abVariants
                                .map((v) => `${v.label} ${Math.round(v.weight * 100)}%`)
                                .join(' · ')}`
                            : 'Off · single message'
                        }
                      />
                      <ReviewRow
                        label="Senders"
                        value={
                          senderMode === 'campaign-pool'
                            ? `Campaign pool (${senders.length} mailbox${senders.length === 1 ? '' : 'es'})`
                            : segmentSenderIds.length === 1
                            ? senders.find((s) => s.id === segmentSenderIds[0])?.email ?? 'Specific senders'
                            : `${segmentSenderIds.length} specific senders (round-robin)`
                        }
                      />
                    </div>
                  </div>

                  {abEnabled && abVariants.length > 1 && (
                    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                      <div className="text-xs font-medium uppercase tracking-wider text-primary mb-2">
                        Variants being tested
                      </div>
                      <div className="space-y-2">
                        {abVariants.map((v) => (
                          <div key={v.id} className="flex items-start gap-2 text-xs">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                              {v.label}
                            </span>
                            <div className="flex-1">
                              <div className="font-medium text-foreground">{v.angle}</div>
                              {v.subjectPreview && (
                                <div className="mt-0.5 text-muted-foreground">Subject: {v.subjectPreview}</div>
                              )}
                            </div>
                            <div className="text-muted-foreground">{Math.round(v.weight * 100)}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border bg-card px-6 py-3">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <div className="flex items-center gap-3">
              {unresolvedConflict && (
                <span className="inline-flex items-center gap-1 text-xs text-warning">
                  <ChevronLeft className="h-3 w-3" />
                  Pick Skip or Move above
                </span>
              )}
              {step !== 'name' && (
                <Button variant="outline" onClick={back}>
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
              <Button onClick={advance} disabled={!canAdvance()}>
                {step === 'preview' ? 'Create segment' : 'Continue'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterField({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Building2;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </label>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

function SendersConfig({
  senders,
  senderMode,
  segmentSenderIds,
  onModeChange,
  onIdsChange,
}: {
  senders: Sender[];
  senderMode: 'campaign-pool' | 'segment-specific';
  segmentSenderIds: string[];
  onModeChange: (mode: 'campaign-pool' | 'segment-specific') => void;
  onIdsChange: (ids: string[]) => void;
}) {
  const noSenders = senders.length === 0;

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onModeChange('campaign-pool')}
          className={cn(
            'flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-left transition-colors',
            senderMode === 'campaign-pool'
              ? 'border-primary bg-primary/10'
              : 'border-border bg-card hover:border-primary/40',
          )}
        >
          <Checkbox checked={senderMode === 'campaign-pool'} readOnly />
          <div className="text-xs">
            <div className="font-medium text-foreground">Use campaign pool</div>
            <div className="mt-0.5 text-muted-foreground">
              {noSenders ? 'No mailboxes yet' : `All ${senders.length} mailbox${senders.length === 1 ? '' : 'es'} rotate`}
            </div>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onModeChange('segment-specific')}
          className={cn(
            'flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-left transition-colors',
            senderMode === 'segment-specific'
              ? 'border-primary bg-primary/10'
              : 'border-border bg-card hover:border-primary/40',
          )}
        >
          <Checkbox checked={senderMode === 'segment-specific'} readOnly />
          <div className="text-xs">
            <div className="font-medium text-foreground">Pick specific senders</div>
            <div className="mt-0.5 text-muted-foreground">A subset of the pool for just this segment</div>
          </div>
        </button>
      </div>

      {senderMode === 'segment-specific' && (
        <div className="mt-3">
          {noSenders ? (
            <div className="rounded-md bg-warning/10 px-3 py-2.5 text-xs">
              <div className="font-medium text-warning">No mailboxes attached</div>
              <div className="mt-0.5 text-muted-foreground">
                Add a mailbox in Settings before picking segment-specific senders.
              </div>
            </div>
          ) : (
            <>
              <div className="mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                Pick mailboxes ({segmentSenderIds.length} selected)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {senders.map((s) => {
                  const checked = segmentSenderIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() =>
                        onIdsChange(
                          checked
                            ? segmentSenderIds.filter((id) => id !== s.id)
                            : [...segmentSenderIds, s.id],
                        )
                      }
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                        checked
                          ? 'border-primary bg-primary/15 text-primary'
                          : 'border-border bg-card text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {checked ? <Check className="h-3 w-3" /> : <AtSign className="h-3 w-3" />}
                      {s.email}
                    </button>
                  );
                })}
              </div>
              {segmentSenderIds.length === 0 && (
                <div className="mt-1.5 text-[11px] text-warning">Pick at least one mailbox for this segment.</div>
              )}
              {segmentSenderIds.length > 1 && (
                <div className="mt-1.5 text-[11px] text-muted-foreground">
                  {segmentSenderIds.length} mailboxes rotate round-robin within this segment.
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
