import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Is this service really free?",
    answer:
      "Yes! During our beta phase, all features are completely free with no limitations. No credit card required, no hidden fees. We want to gather feedback and improve the service before considering any pricing models.",
  },
  {
    question: "What languages are supported?",
    answer:
      "We support all languages that YouTube provides transcripts for. This includes auto-generated and manually uploaded transcripts in dozens of languages. You can specify your preferred language, or we'll use the default available transcript.",
  },
  {
    question: "How long does it take to get a transcript?",
    answer:
      "Most transcripts are retrieved in under 5 seconds. The speed depends on the video length and YouTube's response time. AI analysis (summaries, extractions) typically takes 10-30 seconds depending on the complexity and transcript length.",
  },
  {
    question: "Can I export the results?",
    answer:
      "Yes! You can export transcripts and AI-generated insights. Export functionality is currently in development, and we're adding support for multiple formats including TXT, JSON, and Markdown.",
  },
  {
    question: "Is my data private and secure?",
    answer:
      "Absolutely. We don't store your personal information or browsing history. Transcripts and AI analysis are cached temporarily to improve performance but are not associated with any user identity. We respect your privacy.",
  },
  {
    question: "What AI models do you use?",
    answer:
      "We use state-of-the-art language models including OpenAI GPT, Google Gemini, and Anthropic Claude. The specific model may vary depending on the task and availability, but we always strive to provide the best results.",
  },
  {
    question: "Can I use this for commercial purposes?",
    answer:
      "During the beta period, you can use the service for any purpose. However, please respect YouTube's Terms of Service and the copyright of video content creators. Always ensure you have the right to use and redistribute any content you extract.",
  },
  {
    question: "What happens after beta ends?",
    answer:
      "We're committed to keeping core features free for individual users. Premium features for teams and businesses may be introduced in the future, but we'll always maintain a generous free tier. Beta users will receive special benefits!",
  },
];

export function FAQSection() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about TranscriptAI
          </p>
        </div>

        {/* FAQ Accordion */}
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-lg font-semibold">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
