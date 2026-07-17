import raw from "@/data/portfolio.json";

export interface SkillGroup {
  label: string;
  items: string;
}

export interface Social {
  label: string;
  url: string;
  icon: "linkedin" | "github" | "instagram" | "mail" | string;
}

export interface Experience {
  company: string;
  role: string;
  type: string;
  period: string;
  location: string;
  logo: string;
  url: string;
  summary: string;
  points: string[];
  images: string[];
}

export interface Project {
  name: string;
  tagline: string;
  period: string;
  role: string;
  link: string;
  stack: string[];
  points: string[];
  images: string[];
  videos: string[];
}

export interface Award {
  title: string;
  event: string;
  org: string;
  date: string;
  logo: string;
  image: string;
}

export interface Certification {
  title: string;
  issuer: string;
  date: string;
  credentialId: string;
  url: string;
  logo: string;
  image: string;
}

export interface Brand {
  name: string;
  logo: string;
}

export interface GalleryPhoto {
  src: string;
  caption: string;
}

export interface Track {
  title: string;
  artist: string;
  src: string;
  cover: string;
}

export interface Faq {
  q: string;
  a: string;
}

export interface Portfolio {
  meta: {
    name: string;
    shortName: string;
    initials: string;
    headline: string;
    location: string;
    email: string;
    phone: string;
    website: string;
    documentName: string;
    cvPdf: string;
    cvDocx: string;
    profilePhoto: string;
    siteTitle: string;
    siteDescription: string;
  };
  about: {
    greeting: string;
    paragraphs: string[];
    education: {
      school: string;
      degree: string;
      period: string;
      gpa: string;
      notes: string;
    };
    skills: SkillGroup[];
  };
  socials: Social[];
  linkedinBadge: { vanity: string; profileUrl: string };
  experience: Experience[];
  projects: Project[];
  awards: Award[];
  certifications: Certification[];
  brands: { title: string; items: Brand[] };
  playground: {
    gallery: { intro: string; photos: GalleryPhoto[] };
    music: { intro: string; tracks: Track[]; spotifyEmbed: string };
    typing: { intro: string; sentences: string[] };
    faq: Faq[];
  };
}

export const portfolio = raw as Portfolio;
