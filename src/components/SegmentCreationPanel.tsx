import { useEffect, useMemo, useRef, useState } from 'react';
import {
  X, ChevronRight, ChevronLeft, Sparkles, Library, FilePlus2,
  Building2, MapPin, Briefcase, Mail, Award,
  Check, ArrowRight, AlertTriangle, AlertCircle, Lock, ArrowRightLeft, AtSign,
} from 'lucide-react';
import { LinkedinIcon } from './icons/LinkedinIcon';
import type { Lead, MessageStep, Segment, Sender, Sequence, SequenceSource } from '@/lib/types';
import { Input } from './ui/Input';
import { ChipInput } from './ui/ChipInput';
import { SearchableChipInput } from './ui/SearchableChipInput';
import { Button } from './ui/Button';
import { Checkbox } from './ui/Checkbox';
import { MessageStepEditor } from './MessageStepEditor';
import { AiSequenceBrief, type AiBriefData } from './AiSequenceBrief';
import { cn } from '@/lib/utils';

interface SegmentCreationPanelProps {
  open: boolean;
  onClose: () => void;
  leads: Lead[];
  sequences: Sequence[];
  senders: Sender[];
  onSave: (segment: Omit<Segment, 'id'>, resolution: 'skip' | 'move') => void;
  /**
   * Update callback fired in edit mode. Receives the full segment with its
   * existing id and the new field values.
   */
  onUpdate?: (segmentId: string, patch: Partial<Segment>) => void;
  existingSegments: Segment[];
  /**
   * If provided, the panel opens in "selection mode": the Audience step skips
   * filters entirely and shows the locked list of these lead IDs. The user just
   * confirms (and resolves conflicts if any) before moving on.
   */
  presetLeadIds?: string[] | null;
  /**
   * If provided, the panel opens in "edit mode": all fields pre-filled from
   * the given segment, Save button updates instead of creates.
   */
  editSegmentId?: string | null;
}

type Step = 'name' | 'audience' | 'message' | 'senders' | 'preview';

interface FilterDraft {
  // Multi-keyword fields: OR within the field (lead matches if any keyword matches)
  title: string[];
  location: string[];
  companyName: string[];
  companies: string[];
  industries: string[];
  seniority: string[];
  channel: 'any' | 'has_email' | 'linkedin_only' | 'has_both';
  verification: 'any' | 'email' | 'linkedin' | 'both';
  scoreMin?: number;
  scoreMax?: number;
}

const emptyFilter: FilterDraft = {
  title: [],
  location: [],
  companyName: [],
  companies: [],
  industries: [],
  seniority: [],
  channel: 'any',
  verification: 'any',
};

const STEP_ORDER: Step[] = ['name', 'audience', 'message', 'senders', 'preview'];

const seniorityOptions = ['C-Suite', 'VP / Director', 'Manager', 'IC / Individual'];
const industryOptions = ['Pharmaceuticals', 'Healthcare', 'Biotech', 'Technology', 'Financial Services'];

const sourceOptions: { value: SequenceSource; icon: typeof Library; title: string; subtitle: string }[] = [
  {
    value: 'use-existing',
    icon: Library,
    title: 'Use Existing Sequence',
    subtitle: 'Pick a sequence from your library. You can also clone it to customize for this segment.',
  },
  {
    value: 'scratch',
    icon: FilePlus2,
    title: 'Create a New Blank Sequence',
    subtitle: 'Start from scratch and write each step yourself.',
  },
  {
    value: 'generate',
    icon: Sparkles,
    title: 'Generate a Sequence with AI',
    subtitle: 'Describe your goals and AI drafts a tailored multi-step sequence.',
  },
];

export function SegmentCreationPanel({
  open,
  onClose,
  leads,
  sequences,
  senders,
  onSave,
  onUpdate,
  existingSegments,
  presetLeadIds,
  editSegmentId,
}: SegmentCreationPanelProps) {
  const selectionMode = !!(presetLeadIds && presetLeadIds.length > 0);
  const editingSegment = editSegmentId ? existingSegments.find((s) => s.id === editSegmentId) : null;
  const editMode = !!editingSegment;
  const audienceLocked = editMode && editingSegment.status !== 'draft';

  const companySuggestions = useMemo(
    () => [...new Set(leads.map((l) => l.company))].sort(),
    [leads],
  );

  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [sequenceSource, setSequenceSource] = useState<SequenceSource | null>(null);
  const [sequenceId, setSequenceId] = useState<string>('');
  const flowPickerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<FilterDraft>(emptyFilter);
  const [messageSteps, setMessageSteps] = useState<MessageStep[]>([]);
  const [previewLeadId, setPreviewLeadId] = useState<string | null>(null);
  const [resolution, setResolution] = useState<'skip' | 'move' | null>(null);
  const [showConflictNames, setShowConflictNames] = useState(false);
  const [senderMode, setSenderMode] = useState<'campaign-pool' | 'segment-specific'>('campaign-pool');
  const [segmentSenderIds, setSegmentSenderIds] = useState<string[]>([]);

  const [aiBrief, setAiBrief] = useState<AiBriefData>({
    valueProp: '',
    tone: '',
    channel: '',
    stepCount: '',
  });
  const [aiGenerated, setAiGenerated] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  // When entering edit mode (or switching segments to edit), pre-fill all fields.
  // When opening in create mode, reset state so leftover values from a previous
  // cancelled session don't leak into a fresh create.
  useEffect(() => {
    if (!open) return;
    if (editingSegment) {
      setName(editingSegment.name);
      setSequenceSource(editingSegment.sequenceSource);
      setSequenceId(editingSegment.sequenceId);
      setSenderMode(editingSegment.senderMode);
      setSegmentSenderIds(editingSegment.segmentSenderIds ?? []);
      const seq = sequences.find((s) => s.id === editingSegment.sequenceId);
      if (seq?.messageSteps) {
        setMessageSteps(seq.messageSteps.map((s) => ({ ...s })));
      }
      setStep('name');
    } else {
      // Fresh create: reset to defaults
      setName('');
      setSequenceSource(null);
      setSequenceId('');
      setSenderMode('campaign-pool');
      setSegmentSenderIds([]);
      setMessageSteps([]);
      setFilter(emptyFilter);
      setResolution(null);
      setPreviewLeadId(null);
      setAiBrief({ valueProp: '', tone: '', channel: '', stepCount: '' });
      setAiGenerated(false);
      setAiGenerating(false);
      setStep('name');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingSegment?.id, open]);

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

  // Populate message steps based on source + sequence
  useEffect(() => {
    if (sequenceSource === 'scratch') {
      // Start with one empty step
      setMessageSteps([
        {
          id: `step-${Date.now()}`,
          channel: 'email',
          dayOffset: 0,
          subject: '',
          body: '',
          aiGenerated: false,
          charLimit: 300,
        },
      ]);
    } else if (sequenceSource === 'generate' && !aiGenerated) {
      setMessageSteps([]);
    } else if (sequenceSource === 'use-existing' && selectedSequence?.messageSteps) {
      setMessageSteps(selectedSequence.messageSteps.map((s) => ({ ...s })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sequenceSource, sequenceId]);

  const matched = useMemo(() => {
    if (editMode && editingSegment) {
      const idSet = new Set(editingSegment.matchedLeadIds);
      return editingSegment.matchedLeadIds
        .map((id) => leads.find((l) => l.id === id))
        .filter((l): l is Lead => !!l && idSet.has(l.id));
    }
    const baseLeads = selectionMode
      ? presetLeadIds!.map((id) => leads.find((l) => l.id === id)).filter((l): l is Lead => !!l)
      : leads;
    return baseLeads.filter((l) => {
      if (filter.title.length) {
        const lc = l.title.toLowerCase();
        const matchesAny = filter.title.some((kw) => lc.includes(kw.toLowerCase()));
        if (!matchesAny) return false;
      }
      if (filter.location.length) {
        const lc = l.location.toLowerCase();
        const matchesAny = filter.location.some((kw) => lc.includes(kw.toLowerCase()));
        if (!matchesAny) return false;
      }
      if (filter.companyName.length) {
        const lc = l.company.toLowerCase();
        const matchesAny = filter.companyName.some((kw) => lc.includes(kw.toLowerCase()));
        if (!matchesAny) return false;
      }
      if (filter.companies.length && !filter.companies.includes(l.company)) return false;
      if (filter.channel === 'has_email' && !l.email) return false;
      if (filter.channel === 'linkedin_only' && !!l.email) return false;
      if (filter.channel === 'has_both' && (!l.email || !l.linkedinUrl)) return false;
      if (filter.verification === 'email' && l.emailStatus !== 'verified') return false;
      if (filter.verification === 'linkedin' && l.linkedinStatus !== 'verified') return false;
      if (filter.verification === 'both' && (l.emailStatus !== 'verified' || l.linkedinStatus !== 'verified')) return false;
      if (filter.scoreMin !== undefined && l.score < filter.scoreMin) return false;
      if (filter.scoreMax !== undefined && l.score > filter.scoreMax) return false;
      return true;
    });
  }, [leads, filter, selectionMode, presetLeadIds, editMode, editingSegment]);

  // Conflict analysis: which matched leads are claimed by other CUSTOM (non-default) segments?
  // In edit mode, the segment being edited is excluded from the conflict source.
  const conflicts = useMemo(() => {
    const customSegments = existingSegments.filter(
      (s) => !s.isDefault && s.id !== editingSegment?.id,
    );
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
  }, [matched, existingSegments, editingSegment?.id]);

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

  const generateAiSteps = () => {
    setAiGenerating(true);
    const count = parseInt(aiBrief.stepCount) || 3;
    const ch = aiBrief.channel;
    const angle = aiBrief.valueProp;
    const dayGaps = count <= 2 ? [0, 4] : count === 3 ? [0, 3, 7] : count === 4 ? [0, 2, 5, 9] : [0, 2, 4, 7, 11];

    const emailBody = (i: number) => {
      if (i === 0)
        return `Hi {{first_name}},\n\n${angle}\n\nAt ${name || 'our company'}, we help teams like yours tackle this head-on. Would love to share how.\n\nFree for a quick chat this week?\n\nBest regards`;
      if (i === 1)
        return `Hi {{first_name}},\n\nJust bumping this up. Wanted to see if ${angle.toLowerCase().slice(0, 60)}... resonates with what you're seeing at {{company}}.\n\nHappy to share a one-pager if useful.\n\nBest,`;
      return `Hi {{first_name}},\n\nLast note from me. If this isn't on your radar this quarter, totally understand. Happy to reconnect when timing is better.\n\nBest,`;
    };
    const linkedinBody = (i: number) => {
      if (i === 0)
        return `Hi {{first_name}}, came across your work at {{company}}. Would love to connect.`;
      return `Hi {{first_name}}, thanks for connecting. Quick question: ${angle.toLowerCase().slice(0, 80)}... is this something you're seeing at {{company}}?`;
    };

    const steps: MessageStep[] = [];
    for (let i = 0; i < count; i++) {
      const day = dayGaps[i] ?? i * 3;
      if (ch === 'email') {
        steps.push({ id: `ai-${Date.now()}-${i}`, channel: 'email', dayOffset: day, subject: i === 0 ? angle.slice(0, 60) : i === 1 ? `Re: ${angle.slice(0, 50)}` : 'Closing the loop', body: emailBody(i), aiGenerated: true });
      } else if (ch === 'linkedin') {
        steps.push({ id: `ai-${Date.now()}-${i}`, channel: i === 0 ? 'linkedin_connection' : 'linkedin_message', dayOffset: day, body: linkedinBody(i), aiGenerated: true });
      } else {
        if (i === 0) steps.push({ id: `ai-${Date.now()}-${i}`, channel: 'email', dayOffset: day, subject: angle.slice(0, 60), body: emailBody(0), aiGenerated: true });
        else if (i === count - 1) steps.push({ id: `ai-${Date.now()}-${i}`, channel: 'linkedin_message', dayOffset: day, body: linkedinBody(1), aiGenerated: true });
        else if (i === 1 && count >= 4) steps.push({ id: `ai-${Date.now()}-${i}`, channel: 'email', dayOffset: day, subject: `Re: ${angle.slice(0, 50)}`, body: emailBody(1), aiGenerated: true });
        else if (i === 2 && count >= 4) steps.push({ id: `ai-${Date.now()}-${i}`, channel: 'linkedin_connection', dayOffset: day, body: linkedinBody(0), aiGenerated: true });
        else steps.push({ id: `ai-${Date.now()}-${i}`, channel: i % 2 === 0 ? 'email' : 'linkedin_message', dayOffset: day, subject: i % 2 === 0 ? `Re: ${angle.slice(0, 50)}` : undefined, body: i % 2 === 0 ? emailBody(Math.min(i, 2)) : linkedinBody(1), aiGenerated: true });
      }
    }

    setTimeout(() => {
      setMessageSteps(steps);
      setAiGenerating(false);
      setAiGenerated(true);
    }, 1200);
  };

  if (!open) return null;

  const steps: { key: Step; label: string }[] = [
    { key: 'name', label: 'Name' },
    { key: 'audience', label: 'Audience' },
    { key: 'message', label: 'Sequence' },
    { key: 'senders', label: 'Senders' },
    { key: 'preview', label: 'Preview' },
  ];

  const currentStepIdx = steps.findIndex((s) => s.key === step);

  const nameError = (() => {
    const trimmed = name.trim();
    if (trimmed.length === 0) return null;
    const dup = existingSegments.find(
      (s) =>
        s.id !== editingSegment?.id &&
        s.name.trim().toLowerCase() === trimmed.toLowerCase(),
    );
    return dup ? `A segment named "${dup.name}" already exists` : null;
  })();

  const canAdvance = () => {
    if (step === 'name') return name.trim().length > 0 && !nameError;
    if (step === 'audience') {
      if (effectiveMatched.length === 0 && conflicts.movable.length === 0) return false;
      if (conflicts.movable.length > 0 && resolution === null) return false;
      return effectiveMatched.length > 0 || resolution === 'move';
    }
    if (step === 'message') {
      if (sequenceSource === null) return false;
      if (sequenceSource === 'generate') return aiGenerated && messageSteps.length > 0 && messageSteps.every((s) => s.body.trim().length > 0);
      if (sequenceSource === 'scratch') return messageSteps.length > 0 && messageSteps.every((s) => s.body.trim().length > 0);
      return !!sequenceId;
    }
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
    if (editMode && editingSegment) {
      // Update existing segment in place
      const patch: Partial<Segment> = {
        name: name.trim() || editingSegment.name,
        sequenceId,
        sequenceSource: sequenceSource ?? editingSegment.sequenceSource,
        senderMode,
        segmentSenderIds: senderMode === 'segment-specific' ? segmentSenderIds : undefined,
      };
      // Only update audience if not locked
      if (!audienceLocked) {
        patch.matchedLeadIds = effectiveMatched.map((l) => l.id);
      }
      onUpdate?.(editingSegment.id, patch);
    } else {
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
          status: 'draft',
          abTest: { enabled: false, variants: [] },
        },
        resolution ?? 'skip',
      );
    }
    setStep('name');
    setName('');
    setResolution(null);
    setSenderMode('campaign-pool');
    setSegmentSenderIds([]);
    setSequenceSource(null);
    setSequenceId('');
    setFilter(emptyFilter);
    setMessageSteps([]);
    setPreviewLeadId(null);
    setAiBrief({ valueProp: '', tone: '', channel: '', stepCount: '' });
    setAiGenerated(false);
    setAiGenerating(false);
    onClose();
  };

  const unresolvedConflict =
    step === 'audience' && conflicts.movable.length > 0 && resolution === null;

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-[920px] max-w-[95vw] border-l border-border bg-card shadow-2xl">
        <div className="flex h-full min-h-0 flex-col">
          {/* Header */}
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {editMode ? `Edit segment: ${editingSegment?.name}` : 'New segment'}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {editMode
                  ? audienceLocked
                    ? 'This segment is in flight, so the audience is locked. Name, message, and senders are editable.'
                    : 'Edit any field. Click a step to jump to it.'
                  : `Group leads who should get different messaging. Step ${currentStepIdx + 1} of ${steps.length}.`}
              </p>
            </div>
            <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Stepper */}
          <div className="flex shrink-0 items-center gap-1 border-b border-border bg-surface px-6 py-3 overflow-x-auto scrollbar-thin">
            {steps.map((s, idx) => {
              const isActive = s.key === step;
              const isDone = idx < currentStepIdx;
              return (
                <div key={s.key} className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => (editMode || idx <= currentStepIdx) && setStep(s.key)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium',
                      isActive
                        ? 'bg-primary/15 text-primary'
                        : isDone || editMode
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
          <div className="flex min-h-0 flex-1 overflow-hidden">
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
                      className={nameError ? 'border-destructive-foreground focus:ring-destructive-foreground' : undefined}
                    />
                    {nameError && (
                      <div className="mt-1.5 flex items-center gap-1 text-xs text-destructive-foreground">
                        <AlertCircle className="h-3 w-3" />
                        {nameError}
                      </div>
                    )}
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
                {/* Filters column — hidden in edit mode when audience is locked */}
                {!editMode && (
                <div className="w-[340px] shrink-0 overflow-y-auto border-r border-border p-6 scrollbar-thin">
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Who matches this segment?</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Filters AND together. Preview updates live on the right.
                      </p>
                    </div>

                    <FilterField
                      icon={Briefcase}
                      label="Job title contains"
                      hint={filter.title.length > 1 ? `Any of ${filter.title.length} keywords` : 'Press Enter or comma to add'}
                    >
                      <ChipInput
                        values={filter.title}
                        onChange={(v) => setFilter({ ...filter, title: v })}
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

                    <FilterField
                      icon={MapPin}
                      label="Location contains"
                      hint={filter.location.length > 1 ? `Any of ${filter.location.length} keywords` : 'Press Enter or comma to add'}
                    >
                      <ChipInput
                        values={filter.location}
                        onChange={(v) => setFilter({ ...filter, location: v })}
                        placeholder="e.g., United States, India"
                      />
                    </FilterField>

                    <FilterField
                      icon={Building2}
                      label="Company"
                      hint={filter.companyName.length > 0 ? `${filter.companyName.length} selected` : 'Search and select companies'}
                    >
                      <SearchableChipInput
                        values={filter.companyName}
                        onChange={(v) => setFilter({ ...filter, companyName: v })}
                        suggestions={companySuggestions}
                        placeholder="Search companies..."
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

                    <FilterField icon={Award} label="Profile verification">
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { v: 'any' as const, label: 'Any' },
                          { v: 'email' as const, label: 'Email verified' },
                          { v: 'linkedin' as const, label: 'LinkedIn verified' },
                          { v: 'both' as const, label: 'Both verified' },
                        ].map(({ v, label }) => {
                          const active = filter.verification === v;
                          return (
                            <button
                              key={v}
                              onClick={() => setFilter({ ...filter, verification: v })}
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
                )}

                {/* Live preview column (in filter mode) or the locked-list column (in selection mode) */}
                <div className="flex flex-1 flex-col overflow-hidden">
                  <div className="sticky top-0 z-10 border-b border-border bg-gradient-to-r from-primary/10 to-transparent px-6 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">
                          {editMode
                            ? 'Leads currently in this segment'
                            : selectionMode
                            ? 'These leads will be in this segment'
                            : 'Will join this segment'}
                        </div>
                        <div className="mt-0.5 text-xl font-semibold text-foreground">
                          {effectiveMatched.length}{' '}
                          <span className="text-sm font-normal text-muted-foreground">
                            {editMode
                              ? `lead${effectiveMatched.length === 1 ? '' : 's'}${audienceLocked ? ' · audience locked' : ''}`
                              : selectionMode
                              ? `selected${conflicts.locked.length > 0 || (resolution !== 'move' && conflicts.movable.length > 0) ? ` · ${matched.length} from your selection` : ''}`
                              : `of ${matched.length} matched · ${leads.length} total`}
                          </span>
                        </div>
                      </div>
                      {!selectionMode && !editMode && matched.length === 0 && (
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

                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                                    {movableLeads.length > 0 && (
                                      <span className="font-medium text-foreground">{movableLeads.length} can move</span>
                                    )}
                                    {movableLeads.length > 0 && lockedLeads.length > 0 && (
                                      <span className="text-muted-foreground/40">&middot;</span>
                                    )}
                                    {lockedLeads.length > 0 && (
                                      <span className="inline-flex items-center gap-1 font-medium text-muted-foreground">
                                        <Lock className="h-2.5 w-2.5" />
                                        {lockedLeads.length} locked
                                      </span>
                                    )}
                                    <span className="text-muted-foreground/40">&middot;</span>
                                    <button
                                      onClick={() => setShowConflictNames((v) => !v)}
                                      className="font-medium text-primary hover:underline"
                                    >
                                      {showConflictNames ? 'Hide' : 'Show names'}
                                    </button>
                                  </div>

                                  {showConflictNames && (
                                    <div className="mt-2 flex flex-wrap gap-1">
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
                                      <span className="text-sm font-semibold text-foreground">
                                        Skip them{' '}
                                        <span className="text-xs font-medium text-muted-foreground">
                                          &middot; {matched.length - conflicts.movable.length - conflicts.locked.length} leads
                                        </span>
                                      </span>
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
                                        Move {conflicts.movable.length} here{' '}
                                        <span className="text-xs font-medium text-muted-foreground">
                                          &middot; {matched.length - conflicts.locked.length} leads
                                        </span>
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
                                          ? `In active outreach via ${conflict.segment.name}. Moving could cause duplicate messages.`
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
              <div className="flex w-full flex-1 flex-col overflow-hidden">
                {/* Top: source picker + (when picker not done) sequence list */}
                {sequenceSource === null ? (
                  <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
                    <div className="mx-auto max-w-2xl space-y-6">
                      <div>
                        <h3 className="text-base font-semibold text-foreground">What sequence should this segment receive?</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          A <span className="text-foreground">sequence</span> is the multi-step outreach this segment will get. Pick where it comes from.
                        </p>
                      </div>

                      <div>
                        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Source
                        </div>
                        <div className="grid gap-3">
                          {sourceOptions.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => {
                                setSequenceSource(opt.value);
                                setSequenceId('');
                              }}
                              className="group flex items-start gap-3 rounded-xl border border-border bg-secondary/40 p-4 text-left transition-colors hover:border-primary/40"
                            >
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground">
                                <opt.icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-foreground">{opt.title}</div>
                                <div className="mt-0.5 text-xs text-muted-foreground">{opt.subtitle}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : sequenceSource === 'use-existing' && !sequenceId ? (
                  <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
                    <div className="mx-auto max-w-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-foreground">
                          Choose a sequence
                        </h3>
                        <button
                          onClick={() => setSequenceSource(null)}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Change source
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {sequences.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => setSequenceId(s.id)}
                            className="flex w-full items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2.5 text-left hover:border-primary/40"
                          >
                            <div>
                              <div className="text-sm font-medium text-foreground">{s.name}</div>
                              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{s.steps} steps · {s.durationDays} days</span>
                                <span className="rounded bg-muted px-1.5 py-0 text-[10px]">{s.channel.replace(/_/g, ' → ')}</span>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : sequenceSource === 'generate' && !aiGenerated ? (
                  <div className="flex flex-1 flex-col overflow-hidden">
                    <div className="flex shrink-0 items-center justify-end border-b border-border bg-card/50 px-4 py-1.5">
                      <button
                        onClick={() => {
                          setSequenceSource(null);
                          setAiBrief({ valueProp: '', tone: '', channel: '', stepCount: '' });
                          setAiGenerated(false);
                          setAiGenerating(false);
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Change source
                      </button>
                    </div>
                    <AiSequenceBrief
                      brief={aiBrief}
                      onChange={setAiBrief}
                      leads={effectiveMatched}
                      segmentName={name}
                      onGenerate={generateAiSteps}
                      generating={aiGenerating}
                    />
                  </div>
                ) : (
                  // sequenceSource is scratch, use-existing, or generate (after AI generation): show the two-pane editor
                  <>
                    <div className="flex items-center justify-between border-b border-border bg-card/50 px-4 py-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {sequenceSource === 'generate'
                            ? `${name || 'New sequence'} (AI-generated)`
                            : sequenceSource === 'scratch'
                            ? `${name || 'New sequence'} (from scratch)`
                            : selectedSequence?.name}
                        </span>
                        {sequenceSource === 'generate' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                            <Sparkles className="h-2.5 w-2.5" /> AI
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          if (sequenceSource === 'generate') {
                            setAiGenerated(false);
                            setMessageSteps([]);
                          } else {
                            setSequenceSource(null);
                            setSequenceId('');
                            setMessageSteps([]);
                          }
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        {sequenceSource === 'generate' ? 'Edit brief' : 'Change source'}
                      </button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <MessageStepEditor
                        steps={messageSteps}
                        onChange={setMessageSteps}
                        previewLead={
                          previewLeadId
                            ? effectiveMatched.find((l) => l.id === previewLeadId)
                            : effectiveMatched[0]
                        }
                        previewLeads={effectiveMatched}
                        onChangePreviewLead={setPreviewLeadId}
                        senders={senders}
                      />
                    </div>
                  </>
                )}
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
                        label="Sequence"
                        value={
                          sequenceSource === 'generate'
                            ? `AI-generated · ${messageSteps.length} step${messageSteps.length === 1 ? '' : 's'}`
                            : sequenceSource === 'scratch'
                            ? `New sequence · ${messageSteps.length} step${messageSteps.length === 1 ? '' : 's'}`
                            : `Linked to: ${
                                sequences.find((s) => s.id === sequenceId)?.name
                              }`
                        }
                      />
                      <ReviewRow
                        label="Steps"
                        value={
                          messageSteps.length > 0
                            ? `${messageSteps.length} · ${messageSteps[messageSteps.length - 1].dayOffset} day${messageSteps[messageSteps.length - 1].dayOffset === 1 ? '' : 's'} total`
                            : '—'
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
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-between border-t border-border bg-card px-6 py-3">
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
              {editMode ? (
                <Button onClick={handleSave} disabled={!canAdvance()}>
                  Save changes
                  <Check className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={advance} disabled={!canAdvance()}>
                  {step === 'preview' ? 'Create segment' : 'Continue'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
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
  hint,
  children,
}: {
  icon: typeof Building2;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </label>
      {children}
      {hint && <div className="mt-1 text-[10px] text-muted-foreground">{hint}</div>}
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
