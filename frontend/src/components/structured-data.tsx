export function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "TranscriptAI",
    "applicationCategory": "ProductivityApplication",
    "operatingSystem": "Any",
    "description": "AI-powered YouTube transcript analysis tool. Download transcripts, get summaries, extract code, quotes, and action items from any YouTube video.",
    "url": "https://transcriptai.conn.digital",
    "author": {
      "@type": "Organization",
      "name": "Conn.Digital",
      "url": "https://conn.digital"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5",
      "ratingCount": "1"
    },
    "featureList": [
      "AI-powered transcript summarization",
      "Code snippet extraction",
      "Quote extraction",
      "Action item identification",
      "Multiple export formats (TXT, JSON, MD, CSV)",
      "Q&A with AI about video content",
      "No sign-up required",
      "Free during beta"
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
