import { portfolio } from "@/lib/portfolio";
import { CommentsCta, GalleryGrid, MusicPlayer } from "./widgets";
import TypingTest from "./TypingTest";

const p = portfolio;

function Sheet({ children }: { children: React.ReactNode }) {
  return <section className="word-page word-page-fit doc-body">{children}</section>;
}

export default function PlaygroundSheets() {
  return (
    <>
      <Sheet>
        <header className="mb-8 text-center">
          <h1 className="doc-h1">Playground</h1>
          <p className="mt-2 text-[13px] text-pagedim">
            The unprofessional appendix of an otherwise professional document.
          </p>
        </header>

        <h2 id="gallery" className="doc-h2">
          Photo Gallery
        </h2>
        <p className="mb-5 text-pagedim">{p.playground.gallery.intro}</p>
        <GalleryGrid photos={p.playground.gallery.photos} />
      </Sheet>

      <Sheet>
        <h2 id="music" className="doc-h2">
          Now Playing
        </h2>
        <p className="mb-5 text-pagedim">{p.playground.music.intro}</p>
        <MusicPlayer tracks={p.playground.music.tracks} spotifyEmbed={p.playground.music.spotifyEmbed} />
      </Sheet>

      <Sheet>
        <h2 id="typing" className="doc-h2">
          Typing Race
        </h2>
        <p className="mb-5 text-pagedim">{p.playground.typing.intro}</p>
        <TypingTest
          sentences={p.playground.typing.sentences}
          perRound={p.playground.typing.sentencesPerRound}
        />
      </Sheet>

      <Sheet>
        <h2 id="faq" className="doc-h2">
          Frequently Asked Questions
        </h2>
        <dl className="space-y-6">
          {p.playground.faq.map((f) => (
            <div key={f.q}>
              <dt className="mb-1 font-bold">Q: {f.q}</dt>
              <dd className="border-l-2 border-pageline pl-4 text-pagetext">{f.a}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-10">
          <CommentsCta />
        </div>
      </Sheet>
    </>
  );
}
