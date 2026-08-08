/* ============================================================
   Shared data source for Asher Aw site.
   Both Story mode and Play mode import from here so content
   stays in sync automatically.
   ============================================================ */

export type Role = {
  role: string;
  years: string;
  note: string;
  ongoing?: boolean;
  link?: string;
  linkLabel?: string;
};

export const ROLES: Role[] = [
  {
    role: "Jesus Christ",
    years: "Ongoing since 2015",
    note: "Portrayed across multiple years for live Easter audiences.",
    ongoing: true,
    link: "https://www.youtube.com/watch?v=9JMw49sn2qg",
    linkLabel: "Watch my 1st performance as Jesus on YouTube",
  },
  {
    role: "Lead Dramatic Roles",
    years: "Since 2005",
    note: "Performing dramatic roles for live ensemble audiences.",
  },
  {
    role: "Director & Contributor",
    years: "Ongoing since 2014",
    note: "Directing and contributing to church drama productions.",
    ongoing: true,
  },
];

export type Stat = { value: string; label: string; detail?: string };

export const STAGE_STATS: Stat[] = [
  { value: "20+", label: "Years on Stage" },
  { value: "10+", label: "Years as Jesus (Easter)" },
  { value: "50+", label: "Live Performances" },
  { value: "Multiple", label: "Productions Directed" },
];

export const GLANCE_STATS: Stat[] = [
  { value: "15+", label: "Years in Marketing" },
  { value: "20+", label: "Years on Stage" },
  { value: "10+", label: "Years as Jesus" },
  { value: "100+", label: "Workshops Facilitated" },
];

export const BRANDS = ["Lexus", "OCBC", "Bayer", "Nas Academy", "*SCAPE Singapore", "Singapore Police Force", "Singapore Heart Foundation"];

export type Topic = { title: string; body: string };

export const COACHING_TOPICS: Topic[] = [
  { title: "Personal Branding", body: "A brand voice that feels like you — not a louder version of someone else." },
  { title: "Storytelling", body: "Structuring ideas as stories. Finding the hook, the turn, the line that lands." },
  { title: "Content Creation", body: "From idea to published. Practical systems for creators who want to ship consistently." },
  { title: "Social Media Strategy", body: "Choosing platforms and formats that fit your voice — and ignoring the rest without guilt." },
  { title: "Confidence on Camera", body: "On-camera presence for introverts. Calm, grounded, and quietly magnetic." },
  { title: "Presentation Skills", body: "From boardroom to keynote. Owning the room without performing for it." },
  { title: "Authentic Communication", body: "Communicating in a way that feels natural, instead of imitating louder personalities." },
  { title: "AI-Assisted Content", body: "Using generative AI as a thinking partner — prompting, editing, scaling your voice." },
];

export type Credential = { label: string; value: string };

export const COACHING_CREDENTIALS: Credential[] = [
  { label: "Current Trainer", value: "Nas Academy" },
  { label: "Multiple Winner", value: "Trainer of the Month" },
  { label: "Corporate Trainer", value: "Workshops & Facilitation" },
  { label: "1:1 Coach", value: "Founders & Creators" },
];

export const FAITH_VALUES = ["Integrity", "Humility", "Service", "Compassion", "Excellence"];

export const PRINCIPLES = [
  "Stories connect people more deeply than information alone.",
  "Great communication is a skill that can be learned.",
  "Authenticity creates more lasting influence than performance alone.",
  "Most people are sitting on experience they've forgotten — and it could help someone else.",
  "Confidence grows through action and repetition.",
  "Growth means learning, unlearning, and relearning — especially through life's hardest seasons.",
];

export const PERSONALITY = [
  "Curious", "Analytical", "Creative", "Approachable", "Encouraging", "Observant",
];

export const COACHING_PHILOSOPHY_QUOTE =
  "Communicate in a way that feels natural. Don't try to imitate louder personalities — find the version of you that the room actually wants to hear.";

// Shared between Philosophy.tsx (Story mode) and PlaySections.tsx (Play
// mode) -- previously each hardcoded its own near-identical copy, which is
// exactly how the "Not rules. Not a manifesto." wording drifted into only
// one of the two. One string now, imported by both.
export const PHILOSOPHY_CLOSING_NOTE =
  "He enjoys understanding why people think the way they do, and finding better ways to communicate complex ideas simply. These are the beliefs that quietly shape how Asher chooses projects, runs workshops, and answers the question every coach gets asked sooner or later — “What should I say?”";

// Shared between CoachingSection.tsx and PlaySections.tsx for the same
// reason -- one line instead of two copies that can quietly say different
// things.
export const COACHING_INTRO =
  "You learn to communicate as yourself, only clearer. Practical, encouraging, and built on one idea: confidence comes from doing the rep, not from hearing the theory.";

export const CONTACT_INFO = {
  email: "hello@asheraw.com",
  whatsapp: "+65 9188 1944",
  whatsappUrl: "https://wa.me/6591881944",
};

export const SOCIALS = [
  { label: "YouTube", href: "https://www.youtube.com/@itsAsherAw" },
  { label: "Instagram", href: "https://www.instagram.com/itsAsherAw" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/itsAsherAw" },
  { label: "TikTok", href: "https://www.tiktok.com/@itsAsherAw" },
  { label: "X", href: "https://x.com/AsherAw" },
];

export const STAGE_PILLARS = [
  { title: "Performance", body: "Stage roles combining emotional depth, storytelling, and meaningful themes for live audiences." },
  { title: "Portrayal", body: "Portraying Jesus Christ in Easter productions across multiple years — currently ongoing." },
  { title: "Direction", body: "Directing and contributing to church drama productions, leading ensembles from rehearsal to stage." },
];
