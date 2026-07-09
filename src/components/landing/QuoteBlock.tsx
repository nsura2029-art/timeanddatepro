// src/components/landing/QuoteBlock.tsx
// "A whisper for the moment." One component = one purpose: render a
// single contemplative quote at the bottom of the landing page.
//
// Source: BrowseHome.quote from /api/v1/browse/home. The endpoint picks a
// quote deterministically based on the day so the same quote shows for
// 24h, then rotates.

interface Props {
  quote: {
    id: string;
    text: string;
    author?: string;
  } | null;
}

export function QuoteBlock({ quote }: Props) {
  return (
    <section className="tdp-section" aria-label="Quote of the day">
      <div className="tdp-quote">
        <div className="eyebrow">A whisper for the moment</div>
        <p className="text">
          {quote?.text || "Time is the most valuable thing a man can spend."}
        </p>
        {quote?.author ? (
          <div className="author">— {quote.author}</div>
        ) : (
          <div className="author">— Theophrastus</div>
        )}
      </div>
    </section>
  );
}