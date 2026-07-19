const SITE_URL = "https://asheraw.com";

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Asher Aw",
  url: SITE_URL,
  image: `${SITE_URL}/asher/hero-stage.png`,
  jobTitle: "Theatre Actor, Communications Coach, Storyteller",
  description: "Singapore-based theatre actor, communications coach, and storyteller with 15+ years in marketing and 10+ years on stage.",
  address: { "@type": "PostalAddress", addressLocality: "Singapore", addressCountry: "SG" },
  nationality: "Singaporean",
  knowsAbout: ["Theatre Acting", "Public Speaking", "Storytelling", "Personal Branding", "Content Creation", "Corporate Training", "Communication Skills", "AI-Assisted Content Creation"],
  sameAs: [
    "https://www.youtube.com/@itsAsherAw",
    "https://www.instagram.com/itsAsherAw",
    "https://www.linkedin.com/in/itsAsherAw",
    "https://www.tiktok.com/@itsAsherAw",
    "https://x.com/AsherAw",
  ],
  contactPoint: { "@type": "ContactPoint", contactType: "booking", email: "asher@asheraw.com", telephone: "+6591881944", availableLanguage: ["English"] },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Asher Aw",
  url: SITE_URL,
  description: "Singapore-based theatre actor, communications coach, and storyteller.",
  publisher: { "@type": "Person", name: "Asher Aw" },
  potentialAction: { "@type": "SearchAction", target: `${SITE_URL}/blog?q={search_term_string}`, "query-input": "required name=search_term_string" },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE_URL }],
};

export function StructuredData() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </>
  );
}
