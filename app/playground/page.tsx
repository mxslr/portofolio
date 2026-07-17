import type { Metadata } from "next";
import WordShell from "@/components/word/WordShell";
import PlaygroundSheets from "@/components/doc/PlaygroundSheets";
import { portfolio } from "@/lib/portfolio";

export const metadata: Metadata = {
  title: "Playground | " + portfolio.meta.siteTitle,
};

const NAV = [
  { id: "gallery", label: "Photo Gallery" },
  { id: "music", label: "Now Playing" },
  { id: "typing", label: "Typing Race" },
  { id: "faq", label: "FAQ" },
];

export default function Playground() {
  const { meta } = portfolio;
  return (
    <WordShell
      docId="playground"
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
      <PlaygroundSheets />
    </WordShell>
  );
}
