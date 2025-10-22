import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Database, Lock, Eye, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy - TranscriptAI",
  description:
    "Learn how TranscriptAI protects your privacy and handles your data when using our AI-powered YouTube transcript analysis service.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <Badge variant="outline" className="mb-4">
          <Shield className="mr-1 h-3 w-3" />
          Privacy Policy
        </Badge>
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Your Privacy Matters
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Last Updated: October 22, 2025
        </p>
      </div>

      {/* Introduction */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Introduction
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            Welcome to TranscriptAI, operated by Conn.Digital, a service by
            Constantin Emilian Tivlica (&quot;we,&quot; &quot;us,&quot; or
            &quot;our&quot;). This Privacy Policy explains how we collect, use,
            disclose, and safeguard your information when you use our service at{" "}
            <span className="font-mono text-sm text-foreground">
              transcriptai.conn.digital
            </span>{" "}
            (the &quot;Service&quot;).
          </p>
          <p>
            By using our Service, you agree to the collection and use of
            information in accordance with this policy. If you do not agree with
            our policies and practices, please do not use our Service.
          </p>
        </CardContent>
      </Card>

      {/* Information We Collect */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Information We Collect
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="mb-3 font-semibold text-foreground">
              1. Information You Provide
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>
                  <strong>YouTube URLs:</strong> The video URLs you submit for
                  transcript analysis
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>
                  <strong>AI Prompts:</strong> Custom questions or prompts you
                  submit for AI analysis
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>
                  <strong>Preferences:</strong> Settings such as language
                  preferences and theme selection
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-foreground">
              2. Automatically Collected Information
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>
                  <strong>Usage Data:</strong> Information about how you
                  interact with our Service (pages visited, features used,
                  timestamps)
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>
                  <strong>Device Information:</strong> Browser type, operating
                  system, device type
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>
                  <strong>IP Address:</strong> For security, fraud prevention,
                  and rate limiting
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>
                  <strong>Cookies:</strong> Session cookies for functionality
                  (see Cookie Policy)
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-foreground">
              3. Third-Party Data
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>
                  <strong>YouTube:</strong> We fetch publicly available video
                  transcripts and metadata from YouTube
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>
                  <strong>AI Providers:</strong> Your prompts and transcripts
                  are sent to OpenAI, Anthropic, or Google Gemini for processing
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* How We Use Your Information */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>How We Use Your Information</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong>Provide the Service:</strong> Fetch transcripts, process
                AI requests, and display results
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong>Improve the Service:</strong> Analyze usage patterns to
                enhance features and performance
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong>Security:</strong> Detect and prevent abuse, fraud, and
                security threats
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong>Rate Limiting:</strong> Ensure fair usage and prevent
                service degradation
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong>Legal Compliance:</strong> Comply with applicable laws
                and regulations
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Data Storage and Security */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Data Storage and Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <div>
            <h3 className="mb-2 font-semibold text-foreground">
              Storage Duration
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>
                  <strong>Transcripts:</strong> Cached temporarily (7-30 days)
                  to improve performance
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>
                  <strong>AI Summaries:</strong> Stored for 30 days to serve
                  repeat requests efficiently
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>
                  <strong>Usage Logs:</strong> Retained for 90 days for security
                  and debugging
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-foreground">
              Security Measures
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>HTTPS/TLS encryption for all data transmission</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Encrypted database storage</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>
                  Regular security audits and vulnerability assessments
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Rate limiting and DDoS protection</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Secure API key management for third-party services</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Third-Party Services */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Third-Party Services</CardTitle>
          <CardDescription>
            We use the following third-party services to provide our
            functionality:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="mb-2 font-semibold text-foreground">
              AI Processing Providers
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>
                  <strong>OpenAI (ChatGPT):</strong> For AI summaries and
                  analysis. Subject to{" "}
                  <a
                    href="https://openai.com/policies/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    OpenAI Privacy Policy
                  </a>
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>
                  <strong>Anthropic (Claude):</strong> For AI summaries and
                  analysis. Subject to{" "}
                  <a
                    href="https://www.anthropic.com/legal/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Anthropic Privacy Policy
                  </a>
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>
                  <strong>Google Gemini:</strong> For AI summaries and analysis.
                  Subject to{" "}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Google Privacy Policy
                  </a>
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-foreground">
              YouTube Data API
            </h3>
            <p className="text-sm text-muted-foreground">
              We use YouTube&apos;s public APIs to fetch video transcripts and
              metadata. This is subject to{" "}
              <a
                href="https://www.youtube.com/t/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                YouTube Terms of Service
              </a>
              .
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Your Rights */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Privacy Rights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p className="text-sm">
            Depending on your location, you may have the following rights:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong>Access:</strong> Request a copy of your data
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong>Deletion:</strong> Request deletion of your data (we
                don&apos;t collect personal accounts, but can delete cached
                transcripts)
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong>Correction:</strong> Request correction of inaccurate
                data
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong>Portability:</strong> Request your data in a
                machine-readable format
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong>Opt-Out:</strong> Stop using the service at any time
              </span>
            </li>
          </ul>
          <p className="text-sm">
            To exercise these rights, contact us at{" "}
            <a
              href="mailto:privacy@conn.digital"
              className="font-mono text-primary underline-offset-4 hover:underline"
            >
              privacy@conn.digital
            </a>
          </p>
        </CardContent>
      </Card>

      {/* Children's Privacy */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Children&apos;s Privacy</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Our Service is not intended for children under 13 years of age. We
            do not knowingly collect personal information from children under
            13. If you are a parent or guardian and believe your child has
            provided us with personal information, please contact us at{" "}
            <a
              href="mailto:privacy@conn.digital"
              className="font-mono text-primary underline-offset-4 hover:underline"
            >
              privacy@conn.digital
            </a>
            .
          </p>
        </CardContent>
      </Card>

      {/* GDPR Compliance */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>GDPR Compliance (European Users)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p className="text-sm">
            If you are located in the European Economic Area (EEA), you have
            additional rights under the General Data Protection Regulation
            (GDPR):
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong>Legal Basis:</strong> We process your data based on
                legitimate interests (service provision) and your consent
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong>Data Controller:</strong> Conn.Digital (Constantin
                Emilian Tivlica), Portsmouth, United Kingdom
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong>Data Protection Officer:</strong> Contact{" "}
                <a
                  href="mailto:dpo@conn.digital"
                  className="font-mono text-primary underline-offset-4 hover:underline"
                >
                  dpo@conn.digital
                </a>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                <strong>Right to Lodge a Complaint:</strong> You have the right
                to lodge a complaint with your local supervisory authority
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Changes to This Policy */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Changes to This Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            We may update our Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on this page
            and updating the &quot;Last Updated&quot; date.
          </p>
          <p>
            You are advised to review this Privacy Policy periodically for any
            changes. Changes to this Privacy Policy are effective when they are
            posted on this page.
          </p>
        </CardContent>
      </Card>

      {/* Contact Us */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact Us
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            If you have any questions about this Privacy Policy, please contact
            us:
          </p>
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
                <strong>Privacy Email:</strong>{" "}
                <a
                  href="mailto:privacy@conn.digital"
                  className="font-mono text-primary underline-offset-4 hover:underline"
                >
                  privacy@conn.digital
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
