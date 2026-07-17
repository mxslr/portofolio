import WordShell from "@/components/word/WordShell";
import ResumeSheets from "@/components/doc/ResumeSheets";
import { portfolio } from "@/lib/portfolio";

const NAV = [
  { id: "about", label: "Profile" },
  { id: "education", label: "Education" },
  { id: "skills", label: "Technical Skills" },
  { id: "experience", label: "Work Experience" },
  { id: "organizations", label: "Organizational Experience" },
  { id: "projects", label: "Projects" },
  { id: "awards", label: "Honors and Awards" },
  { id: "certifications", label: "Certifications" },
  { id: "brands", label: "Brands on My Journey" },
  { id: "connect", label: "Let's Connect" },
];

export default function Home() {
  const { meta } = portfolio;
  return (
    <WordShell
      docId="resume"
      nav={NAV}
      meta={{
        name: meta.name,
        initials: meta.initials,
        documentName: meta.documentName,
        cvPdf: meta.cvPdf,
        cvDocx: meta.cvDocx,
        email: meta.email,
      }}
    >
      <ResumeSheets />
    </WordShell>
  );
}
