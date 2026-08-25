import assistant from "@/data/assistant.json";
import { portfolio } from "@/lib/portfolio";

/**
 * Everything the assistant is allowed to know, built straight from the same
 * JSON the site renders. Editing data/portfolio.json updates the chat too, so
 * the two can never drift apart. Personal details that are not on the page
 * live in data/assistant.json.
 */

const p = portfolio;

function list(strings: string[]) {
  return strings.filter(Boolean).join(" ");
}

export function knowledgeBase(): string[] {
  const facts: string[] = [];

  /* ------------------------------------------------------------ identity */
  facts.push(
    `Full name ${p.meta.name}, usually called ${p.meta.shortName}. ${p.meta.headline}. Based in ${p.meta.location}.`
  );
  facts.push(`About him, in his own words: ${list(p.about.paragraphs)}`);

  /* ----------------------------------------------------------- education */
  const e = p.about.education;
  facts.push(
    `Education: ${e.degree} at ${e.school}, ${e.period}, GPA ${e.gpa}. ${e.notes}`
  );

  /* -------------------------------------------------------------- skills */
  facts.push(
    "Skills and technologies he actually works with. If a visitor asks whether he can do something on this list, the answer is yes."
  );
  for (const s of p.about.skills) facts.push(`Skill area, ${s.label}: ${s.items}`);

  /* ---------------------------------------------------------- experience */
  for (const x of p.experience) {
    facts.push(
      `Experience: ${x.role} at ${x.company}, ${x.type}, ${x.period}${
        x.location ? `, ${x.location}` : ""
      }${x.status ? `, status ${x.status}` : ""}. ${x.summary}`
    );
  }

  /* ------------------------------------------------------------ projects */
  for (const pr of p.projects) {
    facts.push(
      `Project ${pr.name}, ${pr.role}, ${pr.period}. ${pr.tagline}. Stack: ${pr.stack.join(
        ", "
      )}. ${list(pr.points)}${pr.link ? ` Link: ${pr.link}` : ""}`
    );
  }

  /* -------------------------------------------------------- publications */
  for (const pub of p.publications) {
    facts.push(
      `Publication: "${pub.title}", published in ${pub.publisher}, ${pub.issue}, ${pub.date}. Marshall is ${pub.role}. Authors: ${pub.authors}. The full PDF can be read on this site in the Publication section of the resume document. Summary: ${pub.description}`
    );
  }

  /* -------------------------------------------------- awards and certs */
  facts.push(
    `Honors and awards: ${p.awards
      .map((a) => `${a.title} at ${a.event} by ${a.org}, ${a.date}`)
      .join("; ")}.`
  );
  facts.push(
    `Certifications: ${p.certifications
      .map((c) => `${c.title} from ${c.issuer}, issued ${c.date}`)
      .join("; ")}.`
  );
  facts.push(
    `Brands and companies on his journey: ${p.brands.items.map((b) => b.name).join(", ")}.`
  );

  /* ------------------------------------------------------------ contact */
  facts.push(
    `Contact: email ${p.meta.email}, phone ${p.meta.phone}, website ${
      p.meta.website
    }. Links: ${p.socials.map((s) => `${s.label} ${s.url}`).join(", ")}.`
  );

  /* --------------------------------------------------------- this site */
  facts.push(
    "This website is his portfolio, built to look and behave like Microsoft Word. The Resume document holds profile, education, skills, work and organizational experience, projects, publication, awards, certifications, brands, and contact links. The Playground document holds a photo gallery, a typing race with a shared leaderboard, and an FAQ. Visitors can switch to Editing mode and restyle the text, leave comments, and download his CV from the Save button or the File menu."
  );
  facts.push(
    `FAQ he already answered on the site: ${p.playground.faq
      .map((f) => `${f.q} ${f.a}`)
      .join(" ")}`
  );

  /* --------------------------------------------- personal, off the page */
  facts.push(...assistant.facts);

  return facts;
}
