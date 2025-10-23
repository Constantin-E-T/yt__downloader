import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link2, FileText, Brain, Search, Download } from "lucide-react";

export const metadata: Metadata = {
  title: "How to Use - TranscriptAI by Conn.Digital",
  description:
    "Step-by-step guide on how to download and analyze YouTube transcripts with AI. Learn how to get the most out of TranscriptAI.",
};

export default function HowToUsePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <Badge variant="secondary" className="mb-4">
          Guide
        </Badge>
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          How to Use TranscriptAI
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Everything you need to know to get started with downloading and
          analyzing YouTube transcripts
        </p>
      </div>

      {/* Quick Start */}
      <Card className="mb-12 border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl">Quick Start (30 seconds)</CardTitle>
          <CardDescription>
            The fastest way to get your first transcript
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            <li className="flex gap-4">
              <Badge
                variant="outline"
                className="h-8 w-8 shrink-0 rounded-full p-0 text-base font-bold"
              >
                1
              </Badge>
              <div>
                <p className="font-medium">Copy any YouTube video URL</p>
                <p className="text-sm text-muted-foreground">
                  Right-click on any YouTube video and select &quot;Copy link
                  address&quot;
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <Badge
                variant="outline"
                className="h-8 w-8 shrink-0 rounded-full p-0 text-base font-bold"
              >
                2
              </Badge>
              <div>
                <p className="font-medium">Paste it on our homepage</p>
                <p className="text-sm text-muted-foreground">
                  Navigate to the homepage and paste the URL in the input field
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <Badge
                variant="outline"
                className="h-8 w-8 shrink-0 rounded-full p-0 text-base font-bold"
              >
                3
              </Badge>
              <div>
                <p className="font-medium">
                  Click &quot;Get Transcript&quot; and you&apos;re done!
                </p>
                <p className="text-sm text-muted-foreground">
                  Your transcript will load in seconds with full timestamps
                </p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Detailed Guide */}
      <div className="space-y-8">
        <h2 className="text-3xl font-bold">Detailed Feature Guide</h2>

        {/* Feature 1 */}
        <Card>
          <CardHeader>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
              <Link2 className="h-6 w-6 text-blue-500" />
            </div>
            <CardTitle className="text-xl">Getting Transcripts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <div>
              <h4 className="mb-2 font-semibold text-foreground">
                Supported URL Formats
              </h4>
              <ul className="ml-6 list-disc space-y-1 text-sm">
                <li>
                  <code className="text-xs">
                    https://youtube.com/watch?v=VIDEO_ID
                  </code>
                </li>
                <li>
                  <code className="text-xs">https://youtu.be/VIDEO_ID</code>
                </li>
                <li>
                  <code className="text-xs">
                    https://youtube.com/embed/VIDEO_ID
                  </code>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-semibold text-foreground">
                Language Options
              </h4>
              <p className="text-sm">
                Leave the language field empty to use the video&apos;s default
                language (usually auto-detected). For specific languages, enter
                the language code (e.g., &quot;en&quot; for English, &quot;es&quot; for Spanish).
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold text-foreground">
                What if a transcript isn&apos;t available?
              </h4>
              <p className="text-sm">
                If a video doesn&apos;t have transcripts (captions disabled), you&apos;ll
                see an error message. Unfortunately, we can only access videos
                with available transcripts or auto-generated captions.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Feature 2 */}
        <Card>
          <CardHeader>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
              <FileText className="h-6 w-6 text-purple-500" />
            </div>
            <CardTitle className="text-xl">Reading Transcripts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              Once loaded, you&apos;ll see the full transcript with timestamps. Click
              any timestamp to jump to that moment in the embedded video player.
            </p>
            <div>
              <h4 className="mb-2 font-semibold text-foreground">
                Navigation Tips
              </h4>
              <ul className="ml-6 list-disc space-y-1 text-sm">
                <li>
                  Use the tabs to switch between Transcript, AI Analysis,
                  Search, and Export
                </li>
                <li>
                  The video player stays in sync with your current position
                </li>
                <li>Timestamps are clickable - jump to any moment instantly</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Feature 3 */}
        <Card>
          <CardHeader>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
              <Brain className="h-6 w-6 text-amber-500" />
            </div>
            <CardTitle className="text-xl">AI Analysis Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <div>
              <h4 className="mb-2 font-semibold text-foreground">Summaries</h4>
              <p className="text-sm">Generate three types of summaries:</p>
              <ul className="ml-6 list-disc space-y-1 text-sm">
                <li>
                  <strong>Brief Overview:</strong> Quick recap in a few
                  sentences
                </li>
                <li>
                  <strong>Detailed Synopsis:</strong> Comprehensive narrative
                  summary
                </li>
                <li>
                  <strong>Key Takeaways:</strong> Bullet-pointed main points
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-semibold text-foreground">
                Extractions
              </h4>
              <p className="text-sm">Automatically identify and extract:</p>
              <ul className="ml-6 list-disc space-y-1 text-sm">
                <li>
                  <strong>Code Snippets:</strong> Programming code mentioned in
                  the video
                </li>
                <li>
                  <strong>Quotes:</strong> Important statements and who said
                  them
                </li>
                <li>
                  <strong>Action Items:</strong> Tasks, next steps, and
                  responsibilities
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-semibold text-foreground">Q&A</h4>
              <p className="text-sm">
                Ask questions about the video content and get AI-powered answers
                based on the transcript. Perfect for finding specific
                information without watching the entire video.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Feature 4 */}
        <Card>
          <CardHeader>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
              <Search className="h-6 w-6 text-green-500" />
            </div>
            <CardTitle className="text-xl">Searching Transcripts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              Use the Search tab to find specific keywords or phrases in the
              transcript. Results are highlighted and you can click to jump to
              that moment.
            </p>
            <div>
              <h4 className="mb-2 font-semibold text-foreground">
                Search Tips
              </h4>
              <ul className="ml-6 list-disc space-y-1 text-sm">
                <li>Search is case-insensitive</li>
                <li>Use quotes for exact phrase matching</li>
                <li>
                  Results show surrounding context for better understanding
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Feature 5 */}
        <Card>
          <CardHeader>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10">
              <Download className="h-6 w-6 text-red-500" />
            </div>
            <CardTitle className="text-xl">Exporting Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              Export functionality is coming soon! You&apos;ll be able to download
              transcripts and AI analysis in multiple formats including:
            </p>
            <ul className="ml-6 list-disc space-y-1 text-sm">
              <li>Plain text (.txt)</li>
              <li>JSON format (.json)</li>
              <li>Markdown (.md)</li>
              <li>PDF with formatting</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-12" />

      {/* Best Practices */}
      <div className="rounded-lg bg-muted/50 p-8">
        <h2 className="mb-6 text-2xl font-bold">Best Practices & Tips</h2>
        <div className="space-y-4 text-muted-foreground">
          <div>
            <h3 className="mb-2 font-semibold text-foreground">
              ⚡ Performance
            </h3>
            <p className="text-sm">
              Transcripts are cached, so requesting the same video again is
              instant. AI analysis is also cached per transcript.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-foreground">🎯 Accuracy</h3>
            <p className="text-sm">
              AI summaries are based on transcript text. For best results, use
              videos with high-quality manually-created captions rather than
              auto-generated ones.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-foreground">💡 Use Cases</h3>
            <p className="text-sm">
              Great for tutorials, lectures, interviews, podcasts, conference
              talks, and any long-form content where you need to reference
              specific moments or extract key information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
