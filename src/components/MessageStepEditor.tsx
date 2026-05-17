import { useState, useMemo } from 'react';
import {
  Mail, Plus, Sparkles, Trash2, X, Check, ChevronDown,
  Bold, Italic, Link as LinkIcon, Image as ImageIcon, List, ListOrdered,
  Undo2, Redo2, Copy,
} from 'lucide-react';
import { LinkedinIcon } from './icons/LinkedinIcon';
import type { MessageStep, StepChannel, Lead, Sender } from '@/lib/types';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { cn } from '@/lib/utils';

interface MessageStepEditorProps {
  steps: MessageStep[];
  onChange: (steps: MessageStep[]) => void;
  previewLead?: Lead;
  previewLeads?: Lead[];
  onChangePreviewLead?: (id: string) => void;
  senders?: Sender[];
}

const channelMeta: Record<StepChannel, { label: string; Icon: typeof Mail; tone: string }> = {
  email: { label: 'Email', Icon: Mail, tone: 'text-primary' },
  linkedin_connection: { label: 'LinkedIn Connection', Icon: LinkedinIcon as unknown as typeof Mail, tone: 'text-[#0A66C2]' },
  linkedin_message: { label: 'LinkedIn Message', Icon: LinkedinIcon as unknown as typeof Mail, tone: 'text-[#0A66C2]' },
};

function bodyPreview(body: string, max = 90): string {
  const trimmed = body.replace(/\s+/g, ' ').trim();
  return trimmed.length > max ? trimmed.slice(0, max) + '…' : trimmed;
}

function renderForPreview(text: string, lead?: Lead): string {
  if (!text) return '';
  return text
    .replace(/\{\{\s*first_name\s*\}\}/g, lead?.name.split(' ')[0] ?? 'there')
    .replace(/\{\{\s*company\s*\}\}/g, lead?.company ?? '{{company}}');
}

function emptyStep(channel: StepChannel = 'email', dayOffset = 0): MessageStep {
  return {
    id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    channel,
    dayOffset,
    subject: channel === 'email' ? '' : undefined,
    body: '',
    aiGenerated: false,
    charLimit: channel === 'email' ? 300 : undefined,
  };
}

export function MessageStepEditor({
  steps,
  onChange,
  previewLead,
  previewLeads = [],
  onChangePreviewLead,
  senders = [],
}: MessageStepEditorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(steps[0]?.id ?? null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const selected = useMemo(
    () => steps.find((s) => s.id === selectedId) ?? steps[0],
    [steps, selectedId],
  );

  // Keep selectedId valid as steps change
  if (steps.length > 0 && !steps.find((s) => s.id === selectedId)) {
    setSelectedId(steps[0].id);
  }

  const updateStep = (id: string, patch: Partial<MessageStep>) => {
    onChange(steps.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const addStep = () => {
    const lastDay = steps.length > 0 ? steps[steps.length - 1].dayOffset : 0;
    const newStep = emptyStep('email', lastDay + 3);
    onChange([...steps, newStep]);
    setSelectedId(newStep.id);
    setEditingId(newStep.id);
  };

  const removeStep = (id: string) => {
    onChange(steps.filter((s) => s.id !== id));
    if (selectedId === id) {
      const remaining = steps.filter((s) => s.id !== id);
      setSelectedId(remaining[0]?.id ?? null);
    }
    if (editingId === id) setEditingId(null);
  };

  return (
    <div className="flex h-full">
      {/* LEFT: Steps list */}
      <div className="flex w-1/2 flex-col border-r border-border">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="text-sm font-semibold text-foreground">Steps ({steps.length})</div>
          {steps.length > 0 && (
            <button
              onClick={addStep}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-foreground hover:bg-accent"
            >
              <Plus className="h-3 w-3" />
              Add step
            </button>
          )}
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto scrollbar-thin p-3">
          {steps.length === 0 && (
            <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-8 text-center">
              <div className="text-sm font-medium text-foreground">No steps yet</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Add your first outreach step to get started.
              </div>
              <Button size="sm" onClick={addStep} className="mt-3">
                <Plus className="h-3.5 w-3.5" />
                Add step
              </Button>
            </div>
          )}

          {steps.map((step, idx) => {
            const isEditing = editingId === step.id;
            const isSelected = selectedId === step.id;
            const meta = channelMeta[step.channel];
            return (
              <div
                key={step.id}
                className={cn(
                  'rounded-lg border transition-all',
                  isEditing
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : isSelected
                    ? 'border-primary/40 bg-card'
                    : 'border-border bg-card hover:border-primary/30',
                )}
              >
                {isEditing ? (
                  <StepEditor
                    step={step}
                    index={idx}
                    onChange={(patch) => updateStep(step.id, patch)}
                    onDone={() => setEditingId(null)}
                    onCancel={() => setEditingId(null)}
                    onDelete={() => removeStep(step.id)}
                  />
                ) : (
                  <button
                    onClick={() => {
                      setSelectedId(step.id);
                      setEditingId(step.id);
                    }}
                    className="block w-full p-3 text-left"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">Step {idx + 1}</span>
                        <span className={cn('inline-flex items-center gap-1 text-xs', meta.tone)}>
                          <meta.Icon className="h-3 w-3" />
                          {meta.label}
                        </span>
                        <span className="text-xs text-muted-foreground">· Day {step.dayOffset}</span>
                        {step.aiGenerated && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-primary/15 px-1 py-0 text-[10px] font-semibold text-primary">
                            <Sparkles className="h-2.5 w-2.5" />
                            AI
                          </span>
                        )}
                      </div>
                    </div>
                    {step.subject && (
                      <div className="mt-1.5 truncate text-xs font-medium text-foreground">
                        Subject: {step.subject}
                      </div>
                    )}
                    <div className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {bodyPreview(step.body, 140) || '(empty)'}
                    </div>
                  </button>
                )}
              </div>
            );
          })}

          {steps.length > 0 && (
            <button
              onClick={addStep}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-secondary/30 px-3 py-2.5 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              Add another step
            </button>
          )}
        </div>
      </div>

      {/* RIGHT: Live preview */}
      <div className="flex w-1/2 flex-col bg-secondary/20">
        <div className="border-b border-border px-4 py-3">
          <div className="text-sm font-semibold text-foreground">Live Preview</div>
        </div>

        {!selected ? (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
            Pick a step on the left to preview.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {/* Preview Settings */}
            <div className="border-b border-border bg-card/40 p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preview Settings</div>
              <div className="mt-2 space-y-2">
                <PreviewSelect
                  label="To (Recipient)"
                  value={previewLead?.id ?? ''}
                  onChange={(v) => onChangePreviewLead?.(v)}
                  options={previewLeads.map((l) => ({ value: l.id, label: `${l.name} - ${l.company}` }))}
                />
                <PreviewSelect
                  label="From (Email Sender)"
                  value={senders[0]?.id ?? 'fallback'}
                  onChange={() => {}}
                  options={
                    senders.length > 0
                      ? senders.map((s) => ({ value: s.id, label: s.email }))
                      : [{ value: 'fallback', label: 'sharan@lumif.ai' }]
                  }
                />
                <PreviewSelect
                  label="From (LinkedIn Account)"
                  value="default-li"
                  onChange={() => {}}
                  options={[{ value: 'default-li', label: 'Sharan JM' }]}
                />
              </div>
            </div>

            {/* Rendered message */}
            <div className="p-4">
              <RenderedMessage step={selected} previewLead={previewLead} senders={senders} />
            </div>
          </div>
        )}

        {/* Bottom action bar */}
        <div className="flex items-center justify-between border-t border-border bg-card px-4 py-2">
          <div className="text-[11px] text-muted-foreground">
            {selected ? `Previewing step ${steps.findIndex((s) => s.id === selected.id) + 1} of ${steps.length}` : ''}
          </div>
          <div className="flex items-center gap-1">
            <button className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-foreground hover:bg-accent">
              <Copy className="h-3 w-3" />
              Clone
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="text-[11px] text-muted-foreground">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-0.5 h-8 w-full appearance-none rounded-md border border-border bg-card px-2.5 pr-7 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  );
}

function RenderedMessage({
  step,
  previewLead,
  senders,
}: {
  step: MessageStep;
  previewLead?: Lead;
  senders: Sender[];
}) {
  const isEmail = step.channel === 'email';
  const sender = senders[0];
  const senderName = sender?.name ?? 'Sharan JM';
  const senderEmail = sender?.email ?? 'sharan@lumif.ai';
  const renderedSubject = renderForPreview(step.subject ?? '', previewLead);
  const renderedBody = renderForPreview(step.body, previewLead);

  if (step.channel === 'linkedin_connection') {
    return (
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">LinkedIn connection request</div>
        <div className="mt-1.5 whitespace-pre-wrap text-sm text-foreground">{renderedBody || '(no note)'}</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      {isEmail && renderedSubject && (
        <div className="border-b border-border pb-2.5">
          <div className="text-sm font-semibold text-foreground">{renderedSubject}</div>
        </div>
      )}
      <div className="mt-2.5 flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
          {senderName.split(' ').map((p) => p[0]).join('').slice(0, 2)}
        </div>
        <div className="flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-xs text-foreground">
              <span className="font-semibold">{senderName}</span>{' '}
              <span className="text-muted-foreground">&lt;{senderEmail}&gt;</span>
            </div>
            <div className="text-[11px] text-muted-foreground">just now</div>
          </div>
          {previewLead && (
            <div className="text-[11px] text-muted-foreground">
              to {previewLead.name}
            </div>
          )}
          <div className="mt-2 whitespace-pre-wrap text-sm text-foreground">{renderedBody || '(empty)'}</div>
        </div>
      </div>
    </div>
  );
}

function StepEditor({
  step,
  index,
  onChange,
  onDone,
  onCancel,
  onDelete,
}: {
  step: MessageStep;
  index: number;
  onChange: (patch: Partial<MessageStep>) => void;
  onDone: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const meta = channelMeta[step.channel];
  const isEmail = step.channel === 'email';

  return (
    <div className="p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">Step {index + 1}</span>
          <span className={cn('inline-flex items-center gap-1 text-xs', meta.tone)}>
            <meta.Icon className="h-3 w-3" />
          </span>
          {step.aiGenerated && (
            <span className="inline-flex items-center gap-0.5 rounded bg-primary/15 px-1 py-0 text-[10px] font-semibold text-primary">
              <Sparkles className="h-2.5 w-2.5" />
              AI
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onDone} className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:opacity-90">
            <Check className="h-3 w-3" />
            Done
          </button>
          <button onClick={onCancel} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground hover:bg-accent">
            <X className="h-3 w-3" />
            Cancel
          </button>
          <button onClick={onDelete} className="inline-flex items-center justify-center rounded-md border border-border bg-card p-1 text-destructive-foreground hover:bg-destructive/10">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Channel</label>
          <select
            value={step.channel}
            onChange={(e) =>
              onChange({
                channel: e.target.value as StepChannel,
                subject: e.target.value === 'email' ? step.subject ?? '' : undefined,
                charLimit: e.target.value === 'email' ? step.charLimit ?? 300 : undefined,
              })
            }
            className="mt-0.5 h-8 w-full rounded-md border border-border bg-input px-2 text-xs"
          >
            <option value="email">Email</option>
            <option value="linkedin_connection">LinkedIn Connection</option>
            <option value="linkedin_message">LinkedIn Message</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Day</label>
          <Input
            type="number"
            min={0}
            value={step.dayOffset}
            onChange={(e) => onChange({ dayOffset: Number(e.target.value) || 0 })}
            className="mt-0.5 h-8 text-xs"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Char Limit</label>
          <Input
            type="number"
            min={0}
            value={step.charLimit ?? ''}
            onChange={(e) => onChange({ charLimit: e.target.value ? Number(e.target.value) : undefined })}
            className="mt-0.5 h-8 text-xs"
            disabled={!isEmail}
          />
        </div>
      </div>

      {isEmail && (
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Subject Line</label>
            <div className="flex items-center gap-1.5">
              <button className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline">
                <Sparkles className="h-2.5 w-2.5" />
                Generate
              </button>
              <button
                onClick={() => onChange({ aiGenerated: !step.aiGenerated })}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium',
                  step.aiGenerated
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground',
                )}
              >
                <Sparkles className="h-2.5 w-2.5" />
                AI {step.aiGenerated ? 'On' : 'Off'}
              </button>
            </div>
          </div>
          <Input
            value={step.subject ?? ''}
            onChange={(e) => onChange({ subject: e.target.value })}
            placeholder="Subject line"
            className="mt-0.5 h-8 text-xs"
          />
        </div>
      )}

      <div className="mt-3">
        <div className="flex items-center justify-between">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Message Body</label>
          <button className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline">
            <Sparkles className="h-2.5 w-2.5" />
            Generate
          </button>
        </div>
        <div className="mt-0.5 overflow-hidden rounded-md border border-border bg-input">
          <div className="flex items-center gap-1 border-b border-border bg-card/50 px-2 py-1 text-muted-foreground">
            <ToolbarBtn Icon={Bold} />
            <ToolbarBtn Icon={Italic} />
            <ToolbarBtn Icon={LinkIcon} />
            <ToolbarBtn Icon={ImageIcon} />
            <ToolbarBtn Icon={List} />
            <ToolbarBtn Icon={ListOrdered} />
            <ToolbarBtn Icon={Undo2} />
            <ToolbarBtn Icon={Redo2} />
            <span className="ml-1 text-[10px] text-muted-foreground">/ variables · Shift+Enter line break</span>
          </div>
          <textarea
            value={step.body}
            onChange={(e) => onChange({ body: e.target.value })}
            placeholder="Write the message body"
            className="block min-h-[120px] w-full resize-y bg-input p-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
          />
        </div>
      </div>
    </div>
  );
}

function ToolbarBtn({ Icon }: { Icon: typeof Bold }) {
  return (
    <button className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-accent hover:text-foreground">
      <Icon className="h-3 w-3" />
    </button>
  );
}
