import Image from "next/image";
import { Github, Instagram, Linkedin, Mail } from "lucide-react";
import { portfolio, type Experience, type Project } from "@/lib/portfolio";
import { BrandStrip, CommentsCta, LinkedInBadge, Logo, ProjectMedia } from "./widgets";

const p = portfolio;

/* ------------------------------------------------------------- pieces */

function Sheet({ children }: { children: React.ReactNode }) {
  return <section className="word-page doc-body">{children}</section>;
}

function ImagesGrid({ images, alt }: { images: string[]; alt: string }) {
  if (images.length === 0) return null;
  return (
    <div className={`mt-4 grid gap-2 ${images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
      {images.map((src, i) => (
        <span key={src} className="block border border-pageline">
          <Image
            src={src}
            alt={`${alt} screenshot ${i + 1}`}
            width={720}
            height={450}
            className="h-auto w-full"
            sizes="(max-width: 880px) 50vw, 350px"
          />
        </span>
      ))}
    </div>
  );
}

function ExperienceEntry({ e }: { e: Experience }) {
  return (
    <article className="flex gap-4">
      <Logo src={e.logo} name={e.company} size={46} className="mt-1" />
      <div className="min-w-0 flex-1">
        <h3 className="text-[16px] font-bold leading-snug">{e.role}</h3>
        <p className="text-[13.5px]">
          {e.url ? (
            <a href={e.url} target="_blank" rel="noreferrer">
              {e.company}
            </a>
          ) : (
            e.company
          )}
          {" · "}
          {e.type}
        </p>
        <p className="mb-2 text-[12.5px] text-pagedim">
          {e.period}
          {e.location ? ` · ${e.location}` : ""}
        </p>
        <p>{e.summary}</p>
        <ImagesGrid images={e.images} alt={e.company} />
      </div>
    </article>
  );
}

function ProjectEntry({ pr }: { pr: Project }) {
  return (
    <article>
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h3 className="text-[16px] font-bold leading-snug">
          {pr.link ? (
            <a href={pr.link} target="_blank" rel="noreferrer">
              {pr.name}
            </a>
          ) : (
            pr.name
          )}
        </h3>
        <span className="text-[12.5px] text-pagedim">
          {pr.role} · {pr.period}
        </span>
      </div>
      <p className="mb-1.5 italic text-pagedim">{pr.tagline}</p>
      <ul className="list-disc space-y-1 pl-5 marker:text-pagedim">
        {pr.points.map((pt) => (
          <li key={pt}>{pt}</li>
        ))}
      </ul>
      <p className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[12px] text-pagedim">
        {pr.stack.map((s, i) => (
          <span key={s}>
            {s}
            {i < pr.stack.length - 1 ? " /" : ""}
          </span>
        ))}
      </p>
      <ProjectMedia name={pr.name} images={pr.images} videos={pr.videos} link={pr.link} />
    </article>
  );
}

/* -------------------------------------------------------------- sheets */

export default function ResumeSheets() {
  const work = p.experience.filter((e) => e.type === "Internship");
  const orgs = p.experience.filter((e) => e.type !== "Internship");

  return (
    <>
      {/* -------------------------------------------------- page 1: about */}
      <Sheet>
        <header className="mb-8 text-center">
          <h1 className="doc-h1 uppercase tracking-wide">{p.meta.name}</h1>
          <p className="mt-2 text-[13px] text-pagedim">
            {p.meta.location} | {p.meta.phone} |{" "}
            <a href={`mailto:${p.meta.email}`}>{p.meta.email}</a>
          </p>
          <p className="mt-1 text-[13px]">
            <a href="https://www.linkedin.com/in/mxslr/" target="_blank" rel="noreferrer">
              linkedin.com/in/mxslr
            </a>{" "}
            |{" "}
            <a href={p.meta.website} target="_blank" rel="noreferrer">
              {p.meta.website.replace("https://", "")}
            </a>
          </p>
        </header>

        <h2 id="about" className="doc-h2">
          Profile
        </h2>
        <div className="mb-8">
          <span className="float-right mb-2 ml-5 block w-32 border border-pageline sm:w-40">
            <Image
              src={p.meta.profilePhoto}
              alt={p.meta.name}
              width={320}
              height={400}
              priority
              className="h-auto w-full"
              sizes="160px"
            />
          </span>
          <p className="mb-3 text-[16px] font-bold">{p.about.greeting}</p>
          {p.about.paragraphs.map((para) => (
            <p key={para.slice(0, 24)} className="mb-3">
              {para}
            </p>
          ))}
          <span className="clear-both block" />
        </div>

        <h2 id="education" className="doc-h2">
          Education
        </h2>
        <div className="mb-8">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4">
            <p>
              <strong>{p.about.education.school}</strong> | {p.about.education.degree}
            </p>
            <p className="text-[13px] text-pagedim">{p.about.education.period}</p>
          </div>
          <p className="mt-1">Current GPA: {p.about.education.gpa}</p>
          <p className="mt-1 text-pagedim">{p.about.education.notes}</p>
        </div>

        <h2 id="skills" className="doc-h2">
          Technical Skills
        </h2>
        <ul className="space-y-2">
          {p.about.skills.map((s) => (
            <li key={s.label}>
              <strong>{s.label}:</strong> {s.items}
            </li>
          ))}
        </ul>
      </Sheet>

      {/* -------------------------------------------- page 2: work experience */}
      <Sheet>
        <h2 id="experience" className="doc-h2">
          Work Experience
        </h2>
        <div className="space-y-8">
          {work.map((e) => (
            <ExperienceEntry key={e.company + e.role} e={e} />
          ))}
        </div>
      </Sheet>

      {/* ------------------------------------- page 3: organizational experience */}
      <Sheet>
        <h2 id="organizations" className="doc-h2">
          Organizational Experience
        </h2>
        <div className="space-y-8">
          {orgs.map((e) => (
            <ExperienceEntry key={e.company + e.role} e={e} />
          ))}
        </div>
      </Sheet>

      {/* ------------------------------------------------- pages 4-6: projects */}
      {[0, 2, 4].map((start) => (
        <Sheet key={start}>
          {start === 0 && (
            <h2 id="projects" className="doc-h2">
              Projects
            </h2>
          )}
          <div className="space-y-9">
            {p.projects.slice(start, start + 2).map((pr) => (
              <ProjectEntry key={pr.name} pr={pr} />
            ))}
          </div>
        </Sheet>
      ))}

      {/* --------------------------------------- page 7: awards + certifications */}
      <Sheet>
        <h2 id="awards" className="doc-h2">
          Honors and Awards
        </h2>
        <ul className="mb-10 space-y-4">
          {p.awards.map((a) => (
            <li key={a.event} className="flex items-start gap-3.5">
              <Logo src={a.logo} name={a.org} size={28} round className="mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <p>
                    <strong>{a.title}</strong> | {a.event}
                  </p>
                  <p className="text-[13px] text-pagedim">{a.date}</p>
                </div>
                <p className="text-pagedim">{a.org}</p>
                {a.image && (
                  <span className="mt-2 block max-w-xs border border-pageline">
                    <Image src={a.image} alt={a.event} width={480} height={340} className="h-auto w-full" />
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>

        <h2 id="certifications" className="doc-h2">
          Certifications
        </h2>
        <ul className="space-y-5">
          {p.certifications.map((c) => (
            <li key={c.credentialId} className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <Logo src={c.logo} name={c.issuer} size={28} round className="mt-0.5 hidden sm:block" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2.5">
                  <Logo src={c.logo} name={c.issuer} size={22} round className="sm:hidden" />
                  <span>
                    <strong>{c.title}</strong> | {c.issuer}
                  </span>
                </p>
                <p className="text-[13px] text-pagedim">
                  Issued {c.date} · Credential {c.credentialId}
                  {c.url && (
                    <>
                      {" · "}
                      <a href={c.url} target="_blank" rel="noreferrer">
                        Verify
                      </a>
                    </>
                  )}
                </p>
              </div>
              {c.image && (
                <span className="block w-full shrink-0 border border-pageline sm:w-52">
                  <Image
                    src={c.image}
                    alt={`${c.title} certificate`}
                    width={480}
                    height={340}
                    className="h-auto w-full"
                    sizes="(max-width: 640px) 100vw, 208px"
                  />
                </span>
              )}
            </li>
          ))}
        </ul>
      </Sheet>

      {/* ------------------------------------------------ page 8: brands + connect */}
      <Sheet>
        <h2 id="brands" className="doc-h2">
          Brands on My Journey
        </h2>
        <p className="mb-5 text-pagedim">{p.brands.title}.</p>
        <div className="mb-12">
          <BrandStrip items={p.brands.items} />
        </div>

        <h2 id="connect" className="doc-h2">
          Let&apos;s Connect
        </h2>
        <p className="mb-5">
          The fastest ways to reach me. I reply faster than my models converge.
        </p>
        <ul className="mb-8 space-y-2.5">
          {p.socials.map((s) => {
            const Icon =
              s.icon === "linkedin"
                ? Linkedin
                : s.icon === "github"
                  ? Github
                  : s.icon === "instagram"
                    ? Instagram
                    : Mail;
            return (
              <li key={s.label} className="flex items-center gap-3">
                <Icon size={16} strokeWidth={1.6} className="shrink-0 text-pagedim" />
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.label === "Email" ? p.meta.email : s.url.replace(/^https:\/\/(www\.)?/, "")}
                </a>
              </li>
            );
          })}
        </ul>

        <div className="mb-10">
          <LinkedInBadge
            vanity={p.linkedinBadge.vanity}
            profileUrl={p.linkedinBadge.profileUrl}
            name={p.meta.name}
          />
        </div>

        <CommentsCta />
      </Sheet>
    </>
  );
}
