import type { Activity, Client, FollowUp, Lead } from "@/services/types";

/**
 * ---------------------------------------------------------------------------
 * Sample CRM content — leads, clients, follow-ups, activity.
 *
 * Shaped exactly like the entities in the locked spec (Section G). Loaded once
 * into the in-memory crmStore; a later prompt swaps the seed for a real fetch
 * through `services/api.ts`. Nothing in the UI is hard-coded to these values.
 * ---------------------------------------------------------------------------
 */

const now = Date.now();
const days = (n: number) => new Date(now + n * 86_400_000).toISOString();
const daysAgoISO = (n: number) => new Date(now - n * 86_400_000).toISOString();
const hoursAgo = (n: number) => new Date(now - n * 3_600_000).toISOString();

export const LEAD_SOURCES = [
  "Referral",
  "Instagram",
  "Website enquiry",
  "Cold outreach",
  "WhatsApp",
  "Networking event",
  "Repeat client",
] as const;

export const SERVICES = [
  "Business website",
  "E-commerce store",
  "Landing page",
  "Website redesign",
  "Web app",
  "Branding + website",
  "Maintenance / AMC",
] as const;

export const SAMPLE_LEADS: Lead[] = [
  {
    id: "lead-01",
    name: "Raj Malhotra",
    business: "ABC Tuition Classes",
    phone: "+91 98200 41122",
    email: "raj@abctuition.in",
    location: "Andheri, Mumbai",
    source: "Referral",
    serviceRequired: "Business website",
    requirements: "5-page site, admissions enquiry form, gallery, mobile-first.",
    estimatedValue: 45000,
    stage: "interested",
    followUpDate: days(1),
    notes: "Wants to launch before the new academic term. Budget-conscious.",
    createdAt: daysAgoISO(9),
    updatedAt: hoursAgo(6),
  },
  {
    id: "lead-02",
    name: "Sana Kapadia",
    business: "Kapadia Interiors",
    phone: "+91 99303 55810",
    email: "hello@kapadiainteriors.com",
    location: "Bandra West, Mumbai",
    source: "Instagram",
    serviceRequired: "Branding + website",
    requirements: "Portfolio-led site, project case studies, contact + Calendly.",
    estimatedValue: 120000,
    stage: "proposal",
    followUpDate: days(0),
    notes: "Sent proposal on Friday. Decision-maker is the founder.",
    createdAt: daysAgoISO(14),
    updatedAt: daysAgoISO(2),
  },
  {
    id: "lead-03",
    name: "Vivek Nair",
    business: "Highfield Realty",
    phone: "+91 98670 20114",
    email: "vivek@highfieldrealty.in",
    location: "Lower Parel, Mumbai",
    source: "Networking event",
    serviceRequired: "Web app",
    requirements: "Property listings portal with agent logins and lead capture.",
    estimatedValue: 340000,
    stage: "negotiation",
    followUpDate: days(2),
    notes: "Negotiating scope. May phase the build. Wants a fixed timeline.",
    createdAt: daysAgoISO(21),
    updatedAt: hoursAgo(30),
  },
  {
    id: "lead-04",
    name: "Farhan Shaikh",
    business: "Shaikh Motors",
    phone: "+91 90040 71265",
    email: "farhan.shaikh@gmail.com",
    location: "Kurla, Mumbai",
    source: "WhatsApp",
    serviceRequired: "Landing page",
    requirements: "Single page for a used-car dealership with WhatsApp CTA.",
    estimatedValue: 18000,
    stage: "new",
    followUpDate: days(0),
    notes: "Enquired last night. Needs a quick turnaround.",
    createdAt: hoursAgo(14),
    updatedAt: hoursAgo(14),
  },
  {
    id: "lead-05",
    name: "Deepa Menon",
    business: "The Salt Table",
    phone: "+91 98195 33027",
    email: "deepa@thesalttable.in",
    location: "Powai, Mumbai",
    source: "Referral",
    serviceRequired: "E-commerce store",
    requirements: "Small-batch condiments store, ~20 SKUs, Razorpay, pickup + courier.",
    estimatedValue: 95000,
    stage: "contacted",
    followUpDate: days(3),
    notes: "Left a voicemail. Referred by Blue Fig Studio.",
    createdAt: daysAgoISO(4),
    updatedAt: daysAgoISO(1),
  },
  {
    id: "lead-06",
    name: "Arjun Rao",
    business: "Rao & Associates",
    phone: "+91 99209 88410",
    email: "arjun@raoassociates.co.in",
    location: "Fort, Mumbai",
    source: "Cold outreach",
    serviceRequired: "Website redesign",
    requirements: "Modernise a dated CA-firm site, add a resources section.",
    estimatedValue: 60000,
    stage: "lost",
    followUpDate: undefined,
    notes: "Went with a cheaper freelancer. Keep warm for AMC later.",
    createdAt: daysAgoISO(30),
    updatedAt: daysAgoISO(6),
  },
  {
    id: "lead-07",
    name: "Nikita Sharma",
    business: "Bloom Dental",
    phone: "+91 98338 12045",
    email: "front.desk@bloomdental.in",
    location: "Chembur, Mumbai",
    source: "Website enquiry",
    serviceRequired: "Business website",
    requirements: "Appointment booking, services, before/after gallery, reviews.",
    estimatedValue: 55000,
    stage: "new",
    followUpDate: days(1),
    notes: "Filled the enquiry form this morning.",
    createdAt: hoursAgo(5),
    updatedAt: hoursAgo(5),
  },
];

export const SAMPLE_CLIENTS: Client[] = [
  {
    id: "client-01",
    name: "Ananya Rao",
    company: "Blue Fig Studio",
    phone: "+91 98201 77450",
    email: "ananya@bluefigstudio.com",
    location: "Versova, Mumbai",
    website: "bluefigstudio.com",
    status: "active",
    sourceLeadId: undefined,
    notes: "Design studio. Referred The Salt Table. Prompt payer.",
    createdAt: daysAgoISO(120),
    updatedAt: daysAgoISO(5),
  },
  {
    id: "client-02",
    name: "Imran Qureshi",
    company: "Sea Salt Cafe",
    phone: "+91 99872 30061",
    email: "imran@seasaltcafe.in",
    location: "Juhu, Mumbai",
    website: "seasaltcafe.in",
    status: "active",
    sourceLeadId: undefined,
    notes: "Cafe + events space. Website + booking in progress.",
    createdAt: daysAgoISO(64),
    updatedAt: hoursAgo(20),
  },
  {
    id: "client-03",
    name: "Meera Kadam",
    company: "Kadam & Co.",
    phone: "+91 98330 55219",
    email: "meera@kadamandco.in",
    location: "Dadar, Mumbai",
    website: "kadamandco.in",
    status: "active",
    sourceLeadId: undefined,
    notes: "Boutique law firm. Landing page refresh nearly done.",
    createdAt: daysAgoISO(38),
    updatedAt: daysAgoISO(3),
  },
  {
    id: "client-04",
    name: "Sunil Bhatia",
    company: "Bhatia Textiles",
    phone: "+91 98195 66302",
    email: "sunil@bhatiatextiles.com",
    location: "Bhiwandi",
    website: "bhatiatextiles.com",
    status: "inactive",
    sourceLeadId: undefined,
    notes: "Delivered a catalogue site last year. Due for an AMC conversation.",
    createdAt: daysAgoISO(300),
    updatedAt: daysAgoISO(90),
  },
];

/**
 * Cross-module context for the client list/profile — this data is OWNED by the
 * Projects (Prompt 06) and Finance (Prompt 07) modules. Kept here as a labelled
 * placeholder so the Clients table can show project/invoice context now.
 */
export interface ClientContext {
  activeProject?: string;
  overdueInvoice?: boolean;
}

export const SAMPLE_CLIENT_CONTEXT: Record<string, ClientContext> = {
  "client-01": { activeProject: "Brand website", overdueInvoice: true },
  "client-02": { activeProject: "Website + booking", overdueInvoice: false },
  "client-03": { activeProject: "Landing page refresh", overdueInvoice: false },
  "client-04": { activeProject: undefined, overdueInvoice: false },
};

export const SAMPLE_FOLLOW_UPS: FollowUp[] = [
  {
    id: "fu-01",
    parentType: "lead",
    parentId: "lead-02",
    dueDate: days(0),
    note: "Call Sana about the proposal — check timeline and any scope questions.",
    status: "pending",
  },
  {
    id: "fu-02",
    parentType: "lead",
    parentId: "lead-04",
    dueDate: days(0),
    note: "Send Shaikh Motors a rough quote + 2 reference sites.",
    status: "pending",
  },
  {
    id: "fu-03",
    parentType: "lead",
    parentId: "lead-01",
    dueDate: days(1),
    note: "Follow up with ABC Tuition on the revised estimate.",
    status: "pending",
  },
  {
    id: "fu-04",
    parentType: "lead",
    parentId: "lead-03",
    dueDate: days(2),
    note: "Highfield Realty — confirm phase 1 scope in writing.",
    status: "pending",
  },
  {
    id: "fu-05",
    parentType: "lead",
    parentId: "lead-05",
    dueDate: daysAgoISO(1),
    note: "The Salt Table — chase the voicemail, try WhatsApp.",
    status: "pending",
  },
  {
    id: "fu-06",
    parentType: "client",
    parentId: "client-04",
    dueDate: daysAgoISO(3),
    note: "Bhatia Textiles — AMC renewal conversation.",
    status: "pending",
  },
  {
    id: "fu-07",
    parentType: "client",
    parentId: "client-02",
    dueDate: days(4),
    note: "Sea Salt Cafe — review homepage revisions together.",
    status: "pending",
  },
];

export const SAMPLE_ACTIVITIES: Activity[] = [
  {
    id: "act-01",
    type: "lead_created",
    entityType: "lead",
    entityId: "lead-07",
    summary: "Lead added — Bloom Dental (Website enquiry)",
    createdAt: hoursAgo(5),
  },
  {
    id: "act-02",
    type: "lead_created",
    entityType: "lead",
    entityId: "lead-04",
    summary: "Lead added — Shaikh Motors (WhatsApp)",
    createdAt: hoursAgo(14),
  },
  {
    id: "act-03",
    type: "stage_changed",
    entityType: "lead",
    entityId: "lead-03",
    summary: "Highfield Realty moved to Negotiation",
    createdAt: hoursAgo(30),
  },
  {
    id: "act-04",
    type: "note_logged",
    entityType: "lead",
    entityId: "lead-02",
    summary: "Call logged — Kapadia Interiors: proposal sent, awaiting decision",
    createdAt: daysAgoISO(2),
  },
  {
    id: "act-05",
    type: "client_updated",
    entityType: "client",
    entityId: "client-02",
    summary: "Sea Salt Cafe — homepage revision approved",
    createdAt: hoursAgo(20),
  },
];
