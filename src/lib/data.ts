import type { Campaign, Lead, Segment, Sender, Sequence } from './types';

export const campaign: Campaign = {
  id: 'camp-001',
  name: 'South Africa Pharma Targeting',
  state: 'setup',
  companiesCount: 12,
  contactsCount: 28,
  inOutreachCount: 0,
  createdAt: '2026-05-13',
  plan: 'Leads were obtained from a campaign targeting pharmaceutical companies in South Africa with 11 to 1,000 employees. The focus is on engaging C-Level executives, VPs, and Directors involved in procurement, finance, and travel management.',
  outreachPlan: 'Target persona: Senior leaders (C-Level, VP, Director) in Travel, Procurement, and Finance. Value Proposition: Satguru Travel provides tailored corporate travel programs designed to reduce costs, ensure traveler safety, and optimize expenses.',
};

export const leads: Lead[] = [
  {
    id: 'lead-1',
    name: 'Dilson Fernandes',
    title: 'Associate Director - PMO Procurement Direct Materials Team',
    email: 'dilson.fernandes@organon.com',
    linkedinUrl: 'http://www.linkedin.com/in/dilson-fernandes-73030424',
    company: 'Organon',
    location: 'Brazil',
    score: 20,
    scoreBreakdown: [
      { label: 'Title match', points: 10 },
      { label: 'Seniority', points: 10 },
      { label: 'Geo match', points: 0 },
      { label: 'Industry fit', points: 0 },
    ],
    emailStatus: 'unverified',
    segmentId: null,
    outreachStarted: false,
  },
  {
    id: 'lead-2',
    name: 'Liesbeth Drutti',
    title: 'Associate Director Capital Procurement & Supplier Management',
    email: undefined,
    linkedinUrl: 'http://www.linkedin.com/in/liesbethdrutti',
    company: 'Organon',
    location: 'Belgium',
    score: 20,
    scoreBreakdown: [
      { label: 'Title match', points: 15 },
      { label: 'Seniority', points: 5 },
      { label: 'Geo match', points: 0 },
      { label: 'Industry fit', points: 0 },
    ],
    emailStatus: 'missing',
    segmentId: null,
    outreachStarted: false,
  },
  {
    id: 'lead-3',
    name: 'Dan Fetzer',
    title: 'Vice President Finance, Business Planning & Corporate Financial Services',
    email: 'dan.fetzer@organon.com',
    linkedinUrl: 'http://www.linkedin.com/in/dan-fetzer-3927728',
    company: 'Organon',
    location: 'Jersey City, United States',
    score: 20,
    scoreBreakdown: [
      { label: 'Title match', points: 5 },
      { label: 'Seniority', points: 15 },
      { label: 'Geo match', points: 0 },
      { label: 'Industry fit', points: 0 },
    ],
    emailStatus: 'unverified',
    segmentId: 'seg-senior-leaders',
    outreachStarted: true,
  },
  {
    id: 'lead-4',
    name: 'TS Ganesh',
    title: 'Executive Director, Finance and Procurement Services',
    email: 't.s.ganesh@organon.com',
    linkedinUrl: 'http://www.linkedin.com/in/ts-ganesh-3385674',
    company: 'Organon',
    location: 'Bedford Hills, United States',
    score: 20,
    scoreBreakdown: [
      { label: 'Title match', points: 10 },
      { label: 'Seniority', points: 10 },
      { label: 'Geo match', points: 0 },
      { label: 'Industry fit', points: 0 },
    ],
    emailStatus: 'unverified',
    segmentId: 'seg-senior-leaders',
    outreachStarted: false,
  },
  {
    id: 'lead-5',
    name: 'Leonardo Patino',
    title: 'Regional CFO Spanish Latam',
    email: undefined,
    linkedinUrl: 'http://www.linkedin.com/in/leonardo-patino-7098b446',
    company: 'Aspen Pharma Group',
    location: 'Mexico',
    score: 100,
    scoreBreakdown: [
      { label: 'Title match', points: 30 },
      { label: 'Seniority', points: 30 },
      { label: 'Geo match', points: 20 },
      { label: 'Industry fit', points: 20 },
    ],
    emailStatus: 'missing',
    segmentId: 'seg-senior-leaders',
    outreachStarted: true,
  },
  {
    id: 'lead-6',
    name: 'Arvind Rao',
    title: 'Director Finance, Technical R&D, Cell & Gene',
    email: 'arvind.rao@novartis.com',
    linkedinUrl: 'http://www.linkedin.com/in/arvind-rao-461ab15',
    company: 'Novartis',
    location: 'East Hanover, United States',
    score: 20,
    scoreBreakdown: [
      { label: 'Title match', points: 10 },
      { label: 'Seniority', points: 10 },
      { label: 'Geo match', points: 0 },
      { label: 'Industry fit', points: 0 },
    ],
    emailStatus: 'unverified',
    segmentId: 'seg-senior-leaders',
    outreachStarted: false,
  },
  {
    id: 'lead-7',
    name: 'Maria Brekhova',
    title: 'Chief Financial Officer',
    email: 'maria.brekhova@novartis.com',
    linkedinUrl: 'http://www.linkedin.com/in/maria-brekhova-artyushkina-23b47133',
    company: 'Novartis',
    location: 'Russia',
    score: 20,
    scoreBreakdown: [
      { label: 'Title match', points: 5 },
      { label: 'Seniority', points: 15 },
      { label: 'Geo match', points: 0 },
      { label: 'Industry fit', points: 0 },
    ],
    emailStatus: 'unverified',
    segmentId: 'seg-senior-leaders',
    outreachStarted: true,
  },
  {
    id: 'lead-8',
    name: 'Marco Magrassi',
    title: 'Chief Financial Officer',
    email: 'marco.magrassi@fresenius-kabi.com',
    linkedinUrl: 'http://www.linkedin.com/in/marco-magrassi-74a6158',
    company: 'Fresenius Kabi',
    location: 'Verona, Italy',
    score: 20,
    scoreBreakdown: [
      { label: 'Title match', points: 5 },
      { label: 'Seniority', points: 15 },
      { label: 'Geo match', points: 0 },
      { label: 'Industry fit', points: 0 },
    ],
    emailStatus: 'unverified',
    segmentId: 'seg-senior-leaders',
    outreachStarted: false,
  },
  ...generateAdditionalLeads(),
];

function generateAdditionalLeads(): Lead[] {
  const titles = [
    'Chief Financial Officer',
    'VP Procurement',
    'Director of Travel & Mobility',
    'Senior Director, Strategic Sourcing',
    'Head of Indirect Procurement',
    'VP Finance',
    'Director, Global Travel Programs',
    'Senior Manager, Category Procurement',
    'Director Finance Operations',
    'VP Corporate Services',
  ];
  const firstNames = ['Andre', 'Priya', 'Markus', 'Yuki', 'Sofia', 'Rahul', 'Elena', 'Carlos', 'Amara', 'Lin', 'Henrik', 'Aisha', 'Lukas', 'Mei', 'Tariq', 'Camila', 'Diego', 'Nadia', 'Kenji', 'Anais'];
  const lastNames = ['Müller', 'Singh', 'Schmidt', 'Tanaka', 'Rossi', 'Patel', 'Volkov', 'Mendez', 'Okonkwo', 'Chen', 'Sørensen', 'Khan', 'Weber', 'Wang', 'Hassan', 'Silva', 'Costa', 'Petrov', 'Nakamura', 'Dubois'];
  const companies = [
    { name: 'Adcock Ingram', location: 'Johannesburg, South Africa' },
    { name: 'Aspen Pharmacare', location: 'Durban, South Africa' },
    { name: 'Cipla Medpro', location: 'Cape Town, South Africa' },
    { name: 'GlaxoSmithKline SA', location: 'Johannesburg, South Africa' },
    { name: 'Sanofi SA', location: 'Midrand, South Africa' },
    { name: 'Lupin Healthcare', location: 'Pretoria, South Africa' },
    { name: 'Pharma Dynamics', location: 'Cape Town, South Africa' },
    { name: 'Litha Pharma', location: 'Johannesburg, South Africa' },
  ];

  return Array.from({ length: 20 }, (_, i) => {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[(i + 3) % lastNames.length];
    const co = companies[i % companies.length];
    const title = titles[i % titles.length];
    const isCSuite = title.toLowerCase().includes('chief') || title.toLowerCase().startsWith('vp');
    const score = isCSuite ? 80 + (i % 20) : 30 + (i % 40);
    const hasEmail = i % 5 !== 0;
    return {
      id: `lead-${9 + i}`,
      name: `${fn} ${ln}`,
      title,
      email: hasEmail ? `${fn.toLowerCase()}.${ln.toLowerCase().replace(/[^a-z]/g, '')}@${co.name.toLowerCase().replace(/[^a-z]/g, '')}.com` : undefined,
      linkedinUrl: `http://www.linkedin.com/in/${fn.toLowerCase()}-${ln.toLowerCase().replace(/[^a-z]/g, '')}-${i}`,
      company: co.name,
      location: co.location,
      score,
      scoreBreakdown: [
        { label: 'Title match', points: isCSuite ? 30 : 10 },
        { label: 'Seniority', points: isCSuite ? 30 : 10 },
        { label: 'Geo match', points: 20 },
        { label: 'Industry fit', points: 20 },
      ],
      emailStatus: hasEmail ? 'unverified' : 'missing',
      segmentId: null,
      outreachStarted: false,
    };
  });
}

export const sequences: Sequence[] = [
  {
    id: 'seq-1',
    name: 'Satguru Pharma Senior Leaders — South Africa',
    channel: 'email_then_linkedin',
    steps: 5,
    durationDays: 15,
    variants: [
      {
        id: 'v-1a',
        label: 'A',
        angle: 'Lead with cost savings',
        subjectPreview: 'Cutting your global travel spend by 15-20%',
        bodyPreview: 'Hi {{first_name}}, noticed Organon runs an extensive international travel program. We help pharma companies reduce per-trip cost by 15-20% without sacrificing traveler safety…',
        weight: 1,
      },
    ],
    locked: true,
  },
  {
    id: 'seq-2',
    name: 'LinkedIn-only Procurement Cold',
    channel: 'linkedin',
    steps: 4,
    durationDays: 10,
    variants: [
      {
        id: 'v-2a',
        label: 'A',
        angle: 'Soft intro via connection',
        subjectPreview: '(LinkedIn connection note)',
        bodyPreview: 'Hi {{first_name}}, came across your role at {{company}} — would love to connect with fellow procurement leaders in pharma.',
        weight: 1,
      },
    ],
  },
  {
    id: 'seq-3',
    name: 'C-Suite Authority Pitch v3',
    channel: 'email',
    steps: 3,
    durationDays: 7,
    variants: [
      {
        id: 'v-3a',
        label: 'A',
        angle: 'Strategic ROI angle',
        subjectPreview: 'Strategic travel ROI for {{company}}',
        bodyPreview: 'Hi {{first_name}}, when your finance and procurement teams compare against industry benchmarks, corporate travel is often the 3rd-largest indirect spend after IT and marketing…',
        weight: 0.5,
      },
      {
        id: 'v-3b',
        label: 'B',
        angle: 'Compliance / duty-of-care angle',
        subjectPreview: 'Duty-of-care gaps in your travel program',
        bodyPreview: 'Hi {{first_name}}, with the new ISO 31030 duty-of-care standard, most corporate travel programs have audit gaps that surface only after an incident…',
        weight: 0.5,
      },
    ],
  },
];

const seniorLeaderLeadIds = leads.filter((l) => l.segmentId === 'seg-senior-leaders').map((l) => l.id);

export const configuredSegments: Segment[] = [
  {
    id: 'seg-senior-leaders',
    name: 'Senior Leaders',
    isDefault: false,
    rules: [],
    sequenceId: 'seq-3',
    sequenceSource: 'clone',
    senderMode: 'campaign-pool',
    matchedLeadIds: seniorLeaderLeadIds,
    abTest: { enabled: false, variants: [] },
  },
  {
    id: 'seg-default',
    name: 'Unassigned',
    isDefault: true,
    rules: [],
    sequenceId: 'seq-1',
    sequenceSource: 'use-existing',
    senderMode: 'campaign-pool',
    matchedLeadIds: leads.filter((l) => l.segmentId !== 'seg-senior-leaders').map((l) => l.id),
    abTest: { enabled: false, variants: [] },
  },
];

export const firstRunSegments: Segment[] = [
  {
    id: 'seg-default',
    name: 'Unassigned',
    isDefault: true,
    rules: [],
    sequenceId: 'seq-1',
    sequenceSource: 'use-existing',
    senderMode: 'campaign-pool',
    matchedLeadIds: leads.map((l) => l.id),
    abTest: { enabled: false, variants: [] },
  },
];

// Keep the old export name for any unconverted imports.
export const initialSegments = configuredSegments;

export const senders: Sender[] = [];
