import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Github, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand Column */}
          <div className="space-y-4">
            <Image
              src="/logo.svg"
              alt="TranscriptAI Logo"
              width={120}
              height={120}
              className="h-auto"
              priority
            />
            <p className="text-sm text-muted-foreground">
              Transform YouTube videos into actionable insights with AI-powered
              analysis.
            </p>
            <Badge variant="secondary" className="w-fit">
              Free Beta
            </Badge>
            <p className="text-xs text-muted-foreground">
              by{" "}
              <a
                href="https://conn.digital"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-foreground hover:text-primary"
              >
                Conn.Digital
              </a>
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/how-to-use"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  How to Use
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal/Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Legal & Connect
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/privacy"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <a
                  href="mailto:contact@conn.digital"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Contact Us
                </a>
              </li>
            </ul>
            <div className="flex gap-4 pt-2">
              <a
                href="https://github.com/Constantin-E-T"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://uk.linkedin.com/in/constantin-emilian-tivlica-00a354206"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} TranscriptAI by Conn.Digital. All
            rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Built with Next.js, Go, and ❤️
          </p>
        </div>
      </div>
    </footer>
  );
}
