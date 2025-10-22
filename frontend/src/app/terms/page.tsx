import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale, AlertCircle, CheckCircle, XCircle, Mail } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service - TranscriptAI",
  description:
    "Read the terms and conditions for using TranscriptAI, an AI-powered YouTube transcript analysis service by Conn.Digital.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <Badge variant="outline" className="mb-4">
          <Scale className="mr-1 h-3 w-3" />
          Terms of Service
        </Badge>
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Terms of Service
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Last Updated: October 22, 2025
        </p>
      </div>

      {/* Introduction */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Agreement to Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            These Terms of Service (&quot;Terms&quot;) constitute a legally
            binding agreement between you and Conn.Digital, operated by
            Constantin Emilian Tivlica (&quot;Company,&quot; &quot;we,&quot;
            &quot;us,&quot; or &quot;our&quot;), concerning your access to and
            use of the TranscriptAI service at{" "}
            <span className="font-mono text-sm text-foreground">
              transcriptai.conn.digital
            </span>{" "}
            (the &quot;Service&quot;).
          </p>
          <p>
            By accessing or using our Service, you agree to be bound by these
            Terms. If you disagree with any part of these Terms, you may not
            access the Service.
          </p>
        </CardContent>
      </Card>

      {/* Service Description */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Service Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>TranscriptAI provides the following services:</p>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                Fetching and displaying publicly available YouTube video
                transcripts
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                AI-powered analysis of transcripts (summaries, extractions,
                Q&amp;A)
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                Search functionality within transcripts and historical access to
                previously processed videos
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Beta Service Notice */}
      <Card className="mb-8 border-amber-500/50 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Beta Service Notice
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            TranscriptAI is currently in <strong>beta testing</strong>. This
            means:
          </p>
          <ul className="space-y-2">
            <li className="flex gap-2">
              <span className="text-amber-500">•</span>
              <span>
                The Service may be unstable, contain bugs, or be temporarily
                unavailable
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-amber-500">•</span>
              <span>
                Features may be added, modified, or removed without notice
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-amber-500">•</span>
              <span>
                Data retention policies may change as we transition out of beta
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-amber-500">•</span>
              <span>
                The Service is provided free of charge during beta, with no
                guarantees of continued free access after beta ends
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* User Responsibilities */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Acceptable Use
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You agree to use the Service only for lawful purposes and in
            accordance with these Terms. You agree NOT to use the Service:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-green-500">✓</span>
              <span>
                <strong>Permitted:</strong> Analyzing publicly available YouTube
                videos for personal, educational, or commercial research
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-green-500">✓</span>
              <span>
                <strong>Permitted:</strong> Extracting insights, summaries, and
                information from video transcripts
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-green-500">✓</span>
              <span>
                <strong>Permitted:</strong> Using the Service within reasonable
                fair-use limits
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Prohibited Use */}
      <Card className="mb-8 border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            Prohibited Use
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-destructive">✗</span>
              <span>
                <strong>Prohibited:</strong> Violating any applicable laws or
                regulations
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-destructive">✗</span>
              <span>
                <strong>Prohibited:</strong> Attempting to circumvent rate
                limits or security measures
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-destructive">✗</span>
              <span>
                <strong>Prohibited:</strong> Using automated tools (bots,
                scrapers) to access the Service in bulk without permission
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-destructive">✗</span>
              <span>
                <strong>Prohibited:</strong> Reverse engineering, decompiling,
                or attempting to extract source code
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-destructive">✗</span>
              <span>
                <strong>Prohibited:</strong> Uploading viruses, malware, or
                malicious code
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-destructive">✗</span>
              <span>
                <strong>Prohibited:</strong> Harassing, abusing, or harming
                others through the Service
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-destructive">✗</span>
              <span>
                <strong>Prohibited:</strong> Violating YouTube&apos;s Terms of
                Service or copyright laws
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-destructive">✗</span>
              <span>
                <strong>Prohibited:</strong> Reselling or redistributing the
                Service without written permission
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Intellectual Property */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Intellectual Property Rights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <div>
            <h3 className="mb-2 font-semibold text-foreground">
              Our Intellectual Property
            </h3>
            <p className="text-sm">
              The Service, including its original content, features, and
              functionality, is owned by Conn.Digital and is protected by
              international copyright, trademark, patent, trade secret, and
              other intellectual property laws.
            </p>
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-foreground">
              Third-Party Content
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>
                  <strong>YouTube Content:</strong> All video transcripts,
                  titles, and metadata remain the property of their respective
                  owners
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>
                  <strong>AI-Generated Content:</strong> AI summaries and
                  analyses are generated based on your input and YouTube&apos;s
                  publicly available transcripts
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-foreground">Your Content</h3>
            <p className="text-sm">
              You retain all rights to any custom prompts or queries you submit.
              By using the Service, you grant us a limited license to process
              your inputs to provide the Service.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer of Warranties */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Disclaimer of Warranties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">
            THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS
            AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND.
          </p>
          <p>
            We disclaim all warranties, express or implied, including but not
            limited to:
          </p>
          <ul className="space-y-2">
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Merchantability and fitness for a particular purpose</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                Accuracy, reliability, or completeness of AI-generated content
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Uninterrupted or error-free operation</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                Security of data transmission (though we implement industry
                standards)
              </span>
            </li>
          </ul>
          <p>
            AI-generated summaries and extractions may contain errors or
            inaccuracies. Always verify important information against the
            original source.
          </p>
        </CardContent>
      </Card>

      {/* Limitation of Liability */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Limitation of Liability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, CONN.DIGITAL SHALL NOT BE
            LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
            PUNITIVE DAMAGES.
          </p>
          <p>This includes but is not limited to:</p>
          <ul className="space-y-2">
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Loss of profits, data, or business opportunities</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                Reliance on AI-generated content that proves inaccurate
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Service interruptions or data loss</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Unauthorized access to your data</span>
            </li>
          </ul>
          <p>
            Our total liability to you for any claims arising from your use of
            the Service shall not exceed the amount you paid us (if any) in the
            12 months before the event giving rise to the claim.
          </p>
        </CardContent>
      </Card>

      {/* Third-Party Services */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Third-Party Services and Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            The Service relies on third-party services including YouTube,
            OpenAI, Anthropic, and Google Gemini. Your use of the Service is
            also subject to:
          </p>
          <ul className="space-y-2">
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                <a
                  href="https://www.youtube.com/t/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  YouTube Terms of Service
                </a>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                <a
                  href="https://openai.com/policies/terms-of-use"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  OpenAI Terms of Use
                </a>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                <a
                  href="https://www.anthropic.com/legal/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Anthropic Terms of Service
                </a>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                <a
                  href="https://policies.google.com/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Google Terms of Service
                </a>
              </span>
            </li>
          </ul>
          <p>
            We are not responsible for the content, privacy policies, or
            practices of any third-party services.
          </p>
        </CardContent>
      </Card>

      {/* Termination */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Termination</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            We reserve the right to terminate or suspend your access to the
            Service immediately, without prior notice or liability, for any
            reason, including:
          </p>
          <ul className="space-y-2">
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Breach of these Terms</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Suspected fraudulent, abusive, or illegal activity</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>At our sole discretion</span>
            </li>
          </ul>
          <p>
            Upon termination, your right to use the Service will cease
            immediately.
          </p>
        </CardContent>
      </Card>

      {/* Governing Law */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Governing Law and Jurisdiction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            These Terms shall be governed by and construed in accordance with
            the laws of England and Wales, United Kingdom, without regard to its
            conflict of law provisions.
          </p>
          <p>
            Any disputes arising from or relating to these Terms or the Service
            shall be subject to the exclusive jurisdiction of the courts of
            England and Wales.
          </p>
        </CardContent>
      </Card>

      {/* Changes to Terms */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Changes to These Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            We reserve the right to modify or replace these Terms at any time at
            our sole discretion. We will provide notice of significant changes
            by:
          </p>
          <ul className="space-y-2">
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Updating the &quot;Last Updated&quot; date</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Posting a notice on our homepage</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                Sending notification through the Service (if technically
                feasible)
              </span>
            </li>
          </ul>
          <p>
            Your continued use of the Service after any changes constitutes
            acceptance of the new Terms.
          </p>
        </CardContent>
      </Card>

      {/* Severability */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Severability and Waiver</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            <strong>Severability:</strong> If any provision of these Terms is
            found to be unenforceable or invalid, that provision shall be
            limited or eliminated to the minimum extent necessary so that these
            Terms shall otherwise remain in full force and effect.
          </p>
          <p>
            <strong>Waiver:</strong> No waiver of any term of these Terms shall
            be deemed a further or continuing waiver of such term or any other
            term.
          </p>
        </CardContent>
      </Card>

      {/* Entire Agreement */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Entire Agreement</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            These Terms, together with our{" "}
            <Link
              href="/privacy"
              className="text-primary underline-offset-4 hover:underline"
            >
              Privacy Policy
            </Link>
            , constitute the entire agreement between you and Conn.Digital
            regarding the Service and supersede all prior agreements and
            understandings.
          </p>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact Us
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>If you have any questions about these Terms, please contact us:</p>
          <ul className="space-y-2">
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:contact@conn.digital"
                  className="font-mono text-primary underline-offset-4 hover:underline"
                >
                  contact@conn.digital
                </a>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong>Legal:</strong>{" "}
                <a
                  href="mailto:legal@conn.digital"
                  className="font-mono text-primary underline-offset-4 hover:underline"
                >
                  legal@conn.digital
                </a>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong>Website:</strong>{" "}
                <a
                  href="https://conn.digital"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-primary underline-offset-4 hover:underline"
                >
                  conn.digital
                </a>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong>Service:</strong>{" "}
                <span className="font-mono text-foreground">
                  transcriptai.conn.digital
                </span>
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
