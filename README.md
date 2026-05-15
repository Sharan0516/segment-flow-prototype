# Segment Flow Prototype

Pixel-matched React/TypeScript prototype of the proposed segment flow for Lumif Outreach. Built against the live UAT app's design tokens (HSL `0 0% 12%` dark, HSL `7 81% 57%` coral primary, Inter font, 12px radius, shadcn/Tailwind structure).

## Run

```bash
cd /Users/sharan/claude-outputs/designs/segment-flow-prototype
npm run dev
# Open http://localhost:5180
```

## What this prototype tests

The 10 JTBD findings from the live walkthrough (`~/claude-outputs/research/segment-flow-walkthrough/JTBD-FINDINGS.md`), implemented as a working flow.

| Finding | Resolution in this prototype |
|---|---|
| #1 Overview front-loads system state | Killed. Land on Leads. Top bar carries the only two decisions: "Send same message to all 8" or "Tailor by segment." |
| #2 Segment name = Sequence name | Segment names are short ("Default", "Senior Leaders"). Sequences live in their own library with separate names. Distinct in data model + UI. |
| #3 9 fields, no preview, count below fold | Segment creation is a 4-step panel (Name → Audience → Message → Review). Audience step uses two-column layout: filters left, live leads table right, count pinned top right. Includes Industry + Channel filters. |
| #4 Three counters (Matched/Assigned/Launchable) | One number: "X leads ready to launch." Skip reasons surfaced inline in Launch modal. |
| #5 Sender pool 0, silent cross-tab gap | Sender status bar across top. Empty state shows warning + Fix link. Launch button disabled with reason. Settings tab consolidates senders. |
| #6 Activate auto-selects all | All leads start checked; user unchecks to exclude. Launch modal shows final count before commit. |
| #7 Lock + clone hidden mid-form | Sequence source is step 3 (Use existing / Clone / Generate). Surfaced upfront, not buried below 9 filter fields. |
| #8 Score without legend | Score badge has hover tooltip with breakdown: "Title +30, Seniority +30, Geo +20, Industry +20." |
| #9 17 columns, 9 dead pre-launch | Setup-mode column set: Name, Title, Company, Location, Email, LinkedIn, Score, Segment. Runtime columns hidden until launch. |
| #10 Filter chip needs 2 clicks | Column-header funnels: click chevron on column header → multi-select dropdown. Excel-style. |

## Flow to walk

1. **Land on Leads (Setup state).** Note the progressive disclosure bar at top: only two CTAs, no metrics scoreboards. The sender status bar shows "No senders configured" as the actionable blocker.
2. **Click "Tailor by segment".** 4-step panel opens. Type a name. Continue.
3. **Audience step.** Set a Job title filter or click "C-Suite" seniority. Watch the right-hand leads preview shrink. Industry and Channel availability are first-class filter fields.
4. **Message step.** Choose Use existing / Clone / Generate. Sequence list shows steps, days, channels, and A/B variant counts.
5. **Review step.** Confirm. Save.
6. **Go to Settings → Add a mailbox.** Sender status bar turns green.
7. **Click Launch.** Lemlist-style recap modal: per-segment breakdown, sender info, send window, skip-reason warnings, one button.
8. **Switch lifecycle state (top header dropdown).** Prototype-only control to walk all 5 states:
   - Setup → Leads (with disclosure bar)
   - Running → Live (per-segment progress, metric cards)
   - Paused → Live with pause banner + Resume CTA
   - Partial run → Live with partial banner
   - Finished → Analytics (per-segment performance, what worked / what to try next)

## File map

```
src/
├── App.tsx                              # Shell + state router
├── lib/
│   ├── types.ts                         # Lead, Segment, Sequence, Sender, LifecycleState
│   └── data.ts                          # The 8 leads from the live walkthrough
├── components/
│   ├── Sidebar.tsx                      # Left nav (Home/Campaigns/Sequences/etc.)
│   ├── CampaignHeader.tsx               # Title + state pill + lifecycle dropdown
│   ├── TabBar.tsx                       # 4 tabs (was 6): Leads / Live / Analytics / Settings
│   ├── ProgressiveDisclosureBar.tsx     # "You have 8 leads. Send all or tailor."
│   ├── SenderStatusBar.tsx              # Cross-tab health: empty/healthy/blocked
│   ├── SegmentChips.tsx                 # Group-by-segment affordance (NOT a separate tab)
│   ├── ColumnHeaderFilter.tsx           # Excel-style column funnels
│   ├── LeadsTable.tsx                   # Setup-mode columns, score breakdown, email tooltips
│   ├── ScoreBadge.tsx                   # Hover legend with score breakdown
│   ├── EmailStatusCell.tsx              # Verified/Pending/Invalid/Missing with explanations
│   ├── SegmentCreationPanel.tsx         # 4-step wizard, live preview, Industry + Channel filters
│   ├── LaunchModal.tsx                  # Lemlist-style pre-flight recap
│   └── ui/                              # Button, Badge, Input, Checkbox, Modal, Tooltip
└── views/
    ├── SetupView.tsx                    # Leads landing (setup state)
    ├── LiveView.tsx                     # Run/Paused/Partial states
    ├── AnalyticsView.tsx                # Finished state
    └── SettingsView.tsx                 # Sender pool management
```

## Design tokens

Extracted from running app via `getComputedStyle`:
- Font: Inter
- Background: `hsl(0 0% 12%)` (dark mode native)
- Primary: `hsl(7 81% 57%)` (coral, matches Lumif `#E94D35`)
- Border: `hsl(0 0% 20%)`
- Radius: `0.75rem` (12px)
- Sidebar width: 256px

## Screenshots

In `screenshots/`:
- `01-setup-leads-landing.png` — Setup state with empty sender warning
- `02-segment-create-step1-name.png` — Name step
- `03-segment-create-step2-audience.png` — Audience step (all 8 matched)
- `03b-segment-audience-filtered.png` — Live filter (CFO + C-Suite → 1 of 8, no email warning)
- `04-segment-create-step3-message.png` — Sequence source decision
- `05-segment-create-step4-review.png` — Pre-save review
- `06-setup-after-segment-added.png` — Senior Leaders segment chip now visible
- `07-settings-no-senders.png` — Settings empty state
- `08-setup-with-sender.png` — Sender bar turns green
- `09-launch-modal.png` — Lemlist-style launch recap
- `10-live-running.png` — Running state with progress bars
- `11-live-paused.png` — Paused state with Resume CTA
- `12-live-partial.png` — Partial-run state
- `13-analytics-finished.png` — Finished state with per-segment performance
