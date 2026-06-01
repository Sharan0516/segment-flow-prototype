import { useEffect, useRef, useState } from 'react';
import {
  Sparkles, Pencil, Users, Building2, Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Lead } from '@/lib/types';

export interface AiBriefData {
  valueProp: string;
  tone: '' | 'professional' | 'conversational' | 'urgent' | 'casual';
  channel: '' | 'email' | 'linkedin' | 'both';
  stepCount: '' | '2' | '3' | '4' | '5';
}

interface AiSequenceBriefProps {
  brief: AiBriefData;
  onChange: (brief: AiBriefData) => void;
  leads: Lead[];
  segmentName: string;
  onGenerate?: () => void;
  generating?: boolean;
}

type ChatStep = 'context' | 'value-prop' | 'tone' | 'channel' | 'steps' | 'summary';

const STEP_ORDER: ChatStep[] = ['context', 'value-prop', 'tone', 'channel', 'steps', 'summary'];

const TONE_OPTIONS = [
  { value: 'professional' as const, label: 'Professional', desc: 'Polished and business-appropriate' },
  { value: 'conversational' as const, label: 'Conversational', desc: 'Friendly, like a warm intro' },
  { value: 'urgent' as const, label: 'Urgent', desc: 'Time-sensitive, action-oriented' },
  { value: 'casual' as const, label: 'Casual', desc: 'Relaxed peer-to-peer' },
];

const CHANNEL_OPTIONS = [
  { value: 'email' as const, label: 'Email only' },
  { value: 'linkedin' as const, label: 'LinkedIn only' },
  { value: 'both' as const, label: 'Email + LinkedIn' },
];

const STEP_OPTIONS = [
  { value: '2' as const, label: '2 steps', desc: 'Quick touch' },
  { value: '3' as const, label: '3 steps', desc: 'Standard cadence' },
  { value: '4' as const, label: '4 steps', desc: 'Thorough follow-up' },
  { value: '5' as const, label: '5 steps', desc: 'Extended nurture' },
];

function deriveAudienceInsights(leads: Lead[]) {
  const titles = leads.map((l) => l.title);
  const companies = [...new Set(leads.map((l) => l.company))];
  const locations = [...new Set(leads.map((l) => l.location))];
  const hasEmail = leads.filter((l) => l.email).length;
  const hasLinkedin = leads.filter((l) => l.linkedinUrl).length;

  const titleCounts = new Map<string, number>();
  titles.forEach((t) => {
    const key = t.split(/[,/]/)[0].trim();
    titleCounts.set(key, (titleCounts.get(key) ?? 0) + 1);
  });
  const topTitles = [...titleCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => t);

  return { companies, locations, hasEmail, hasLinkedin, topTitles, total: leads.length };
}

export function AiSequenceBrief({ brief, onChange, leads, segmentName, onGenerate, generating }: AiSequenceBriefProps) {
  const briefComplete = !!(brief.valueProp && brief.tone && brief.channel && brief.stepCount);
  const [chatStep, setChatStep] = useState<ChatStep>(briefComplete ? 'summary' : 'context');
  const [typing, setTyping] = useState(!briefComplete);
  const [valueDraft, setValueDraft] = useState(brief.valueProp);
  const [editingField, setEditingField] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const insights = deriveAudienceInsights(leads);
  const currentIdx = STEP_ORDER.indexOf(chatStep);

  useEffect(() => {
    setTyping(true);
    const delay = chatStep === 'context' ? 600 : 400;
    const timer = setTimeout(() => {
      setTyping(false);
      if (chatStep === 'context') {
        setTimeout(() => setChatStep('value-prop'), 300);
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [chatStep]);

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 50);
    }
  }, [chatStep, typing]);

  useEffect(() => {
    if (!typing && chatStep === 'value-prop' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [typing, chatStep]);

  const advance = () => {
    const next = STEP_ORDER[currentIdx + 1];
    if (next) setChatStep(next);
  };

  const submitValueProp = () => {
    if (!valueDraft.trim()) return;
    onChange({ ...brief, valueProp: valueDraft.trim() });
    advance();
  };

  const selectTone = (v: AiBriefData['tone']) => {
    onChange({ ...brief, tone: v });
    setTimeout(advance, 200);
  };

  const selectChannel = (v: AiBriefData['channel']) => {
    onChange({ ...brief, channel: v });
    setTimeout(advance, 200);
  };

  const selectSteps = (v: AiBriefData['stepCount']) => {
    onChange({ ...brief, stepCount: v });
    setTimeout(advance, 200);
  };

  const isComplete = brief.valueProp && brief.tone && brief.channel && brief.stepCount;

  const handleSummaryEdit = (field: string) => {
    setEditingField(field);
    if (field === 'value-prop') {
      setValueDraft(brief.valueProp);
    }
  };

  const saveSummaryEdit = () => {
    if (editingField === 'value-prop') {
      onChange({ ...brief, valueProp: valueDraft.trim() });
    }
    setEditingField(null);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Chat header */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-card/50 px-6 py-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15">
          <Sparkles className="h-3 w-3 text-primary" />
        </div>
        <span className="text-xs font-medium text-foreground">Lumif AI</span>
        <span className="text-[10px] text-muted-foreground">sequence builder</span>
      </div>

      {/* Chat body */}
      <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-4 scrollbar-thin">
        <div className="flex-1" />
        <div className="mx-auto w-full max-w-xl space-y-4 pb-6">

          {/* Context card — always visible */}
          {currentIdx >= 0 && (
            <>
              <AiMessage visible={!typing || currentIdx > 0}>
                <span>
                  I see <span className="font-semibold text-foreground">{insights.total} leads</span> in
                  {segmentName ? ` "${segmentName}"` : ' this segment'}. Let me help you craft the right sequence for them.
                </span>
              </AiMessage>

              {(!typing || currentIdx > 0) && (
                <div className="ml-8 rounded-lg border border-border/60 bg-secondary/30 p-3">
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Audience snapshot
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-start gap-1.5">
                      <Briefcase className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                      <div>
                        <div className="text-muted-foreground">Top roles</div>
                        <div className="font-medium text-foreground">{insights.topTitles.join(', ')}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Building2 className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                      <div>
                        <div className="text-muted-foreground">Companies</div>
                        <div className="font-medium text-foreground">
                          {insights.companies.length <= 3
                            ? insights.companies.join(', ')
                            : `${insights.companies.slice(0, 2).join(', ')} +${insights.companies.length - 2} more`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Users className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                      <div>
                        <div className="text-muted-foreground">Reachable</div>
                        <div className="font-medium text-foreground">
                          {insights.hasEmail} email · {insights.hasLinkedin} LinkedIn
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Value prop question */}
          {currentIdx >= 1 && (
            <>
              <AiMessage visible={!typing || currentIdx > 1}>
                What angle should we lead with? Think about the core reason these{' '}
                {insights.topTitles[0] ? insights.topTitles[0] + 's' : 'leads'} should care.
              </AiMessage>

              {currentIdx === 1 && !typing && (
                <div className="ml-8">
                  <textarea
                    ref={inputRef}
                    value={valueDraft}
                    onChange={(e) => setValueDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        submitValueProp();
                      }
                    }}
                    placeholder="e.g., Help pharma procurement leaders reduce indirect travel spend by 20%..."
                    rows={2}
                    className="w-full rounded-lg border border-primary/30 bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Press Enter to send</span>
                    <button
                      onClick={submitValueProp}
                      disabled={!valueDraft.trim()}
                      className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground disabled:opacity-40"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}

              {currentIdx > 1 && brief.valueProp && (
                <UserMessage>{brief.valueProp}</UserMessage>
              )}
            </>
          )}

          {/* Tone question */}
          {currentIdx >= 2 && (
            <>
              <AiMessage visible={!typing || currentIdx > 2}>
                Great angle. What tone fits best for this audience?
              </AiMessage>

              {currentIdx === 2 && !typing && (
                <div className="ml-8 flex flex-wrap gap-1.5">
                  {TONE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => selectTone(opt.value)}
                      className="group flex flex-col items-start rounded-lg border border-border bg-secondary/40 px-3 py-2 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                    >
                      <span className="text-xs font-medium text-foreground">{opt.label}</span>
                      <span className="text-[10px] text-muted-foreground">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              )}

              {currentIdx > 2 && brief.tone && (
                <UserMessage>{TONE_OPTIONS.find((o) => o.value === brief.tone)?.label ?? brief.tone}</UserMessage>
              )}
            </>
          )}

          {/* Channel question */}
          {currentIdx >= 3 && (
            <>
              <AiMessage visible={!typing || currentIdx > 3}>
                {insights.hasEmail > 0 && insights.hasLinkedin > 0
                  ? `Your leads have both email (${insights.hasEmail}) and LinkedIn (${insights.hasLinkedin}) coverage. Which channels should we use?`
                  : insights.hasEmail > 0
                  ? `Most leads have email addresses. Want to go email-only or mix in LinkedIn?`
                  : `Looks like LinkedIn is the primary channel. What should we target?`}
              </AiMessage>

              {currentIdx === 3 && !typing && (
                <div className="ml-8 flex flex-wrap gap-1.5">
                  {CHANNEL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => selectChannel(opt.value)}
                      className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {currentIdx > 3 && brief.channel && (
                <UserMessage>{CHANNEL_OPTIONS.find((o) => o.value === brief.channel)?.label ?? brief.channel}</UserMessage>
              )}
            </>
          )}

          {/* Steps question */}
          {currentIdx >= 4 && (
            <>
              <AiMessage visible={!typing || currentIdx > 4}>
                Last one — how many touchpoints? More steps means more follow-up opportunities but a longer sequence.
              </AiMessage>

              {currentIdx === 4 && !typing && (
                <div className="ml-8 flex flex-wrap gap-1.5">
                  {STEP_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => selectSteps(opt.value)}
                      className="group flex flex-col items-start rounded-lg border border-border bg-secondary/40 px-3 py-2 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                    >
                      <span className="text-xs font-medium text-foreground">{opt.label}</span>
                      <span className="text-[10px] text-muted-foreground">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              )}

              {currentIdx > 4 && brief.stepCount && (
                <UserMessage>{STEP_OPTIONS.find((o) => o.value === brief.stepCount)?.label ?? brief.stepCount}</UserMessage>
              )}
            </>
          )}

          {/* Summary card */}
          {currentIdx >= 5 && !typing && isComplete && (
            <>
              <AiMessage visible>
                Here's your brief. Edit anything below, then generate your sequence.
              </AiMessage>

              <div className="ml-8 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                    Sequence brief
                  </span>
                </div>
                <div className="space-y-3">
                  <SummaryRow
                    label="Angle"
                    value={brief.valueProp}
                    editing={editingField === 'value-prop'}
                    onEdit={() => handleSummaryEdit('value-prop')}
                    onSave={saveSummaryEdit}
                    editContent={
                      <textarea
                        value={valueDraft}
                        onChange={(e) => setValueDraft(e.target.value)}
                        rows={2}
                        className="w-full rounded-md border border-primary/30 bg-input px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                        autoFocus
                      />
                    }
                  />
                  <SummaryRow
                    label="Tone"
                    value={TONE_OPTIONS.find((o) => o.value === brief.tone)?.label ?? ''}
                    onEdit={() => {}}
                    chips={TONE_OPTIONS.map((o) => ({
                      label: o.label,
                      active: brief.tone === o.value,
                      onClick: () => onChange({ ...brief, tone: o.value }),
                    }))}
                  />
                  <SummaryRow
                    label="Channel"
                    value={CHANNEL_OPTIONS.find((o) => o.value === brief.channel)?.label ?? ''}
                    onEdit={() => {}}
                    chips={CHANNEL_OPTIONS.map((o) => ({
                      label: o.label,
                      active: brief.channel === o.value,
                      onClick: () => onChange({ ...brief, channel: o.value }),
                    }))}
                  />
                  <SummaryRow
                    label="Steps"
                    value={`${brief.stepCount} steps`}
                    onEdit={() => {}}
                    chips={STEP_OPTIONS.map((o) => ({
                      label: o.label,
                      active: brief.stepCount === o.value,
                      onClick: () => onChange({ ...brief, stepCount: o.value }),
                    }))}
                  />
                  <div className="border-t border-border/50 pt-2">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {insights.total} leads in "{segmentName || 'this segment'}"
                    </div>
                  </div>
                </div>

                {onGenerate && (
                  <button
                    onClick={onGenerate}
                    disabled={generating}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                  >
                    {generating ? (
                      <>
                        <Sparkles className="h-4 w-4 animate-spin" />
                        Generating sequence...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate sequence
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          )}

          {/* Typing indicator */}
          {typing && (
            <div className="flex items-start gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15">
                <Sparkles className="h-3 w-3 text-primary" />
              </div>
              <div className="rounded-lg bg-secondary/60 px-3 py-2">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AiMessage({ children, visible }: { children: React.ReactNode; visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="flex items-start gap-2">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15">
        <Sparkles className="h-3 w-3 text-primary" />
      </div>
      <div className="max-w-[85%] rounded-lg rounded-tl-sm bg-secondary/60 px-3 py-2 text-sm text-muted-foreground">
        {children}
      </div>
    </div>
  );
}

function UserMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-lg rounded-tr-sm bg-primary/15 px-3 py-2 text-sm text-foreground">
        {children}
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  editing,
  onEdit,
  onSave,
  editContent,
  chips,
}: {
  label: string;
  value: string;
  editing?: boolean;
  onEdit: () => void;
  onSave?: () => void;
  editContent?: React.ReactNode;
  chips?: { label: string; active: boolean; onClick: () => void }[];
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        {editContent && !editing && (
          <button onClick={onEdit} className="text-[10px] text-primary hover:underline">
            <Pencil className="inline h-2.5 w-2.5" /> Edit
          </button>
        )}
        {editing && onSave && (
          <button onClick={onSave} className="text-[10px] font-medium text-primary hover:underline">
            Save
          </button>
        )}
      </div>
      {editing && editContent ? (
        editContent
      ) : chips ? (
        <div className="flex flex-wrap gap-1">
          {chips.map((c) => (
            <button
              key={c.label}
              onClick={c.onClick}
              className={cn(
                'rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors',
                c.active
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="text-xs text-foreground">{value}</div>
      )}
    </div>
  );
}
