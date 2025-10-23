import { NextRequest, NextResponse } from "next/server";

import { backendFetch } from "@/lib/server/backend-client";

type RouteParams = {
  params: Promise<{
    transcriptId: string;
  }>;
};

export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const params = await context.params;
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get("format") ?? "json";

    const backendResponse = await backendFetch(
      `/api/v1/transcripts/${encodeURIComponent(
        params.transcriptId
      )}/export?format=${encodeURIComponent(format)}`
    );

    if (!backendResponse.ok) {
      const text = await backendResponse.text();
      const contentType =
        backendResponse.headers.get("content-type") ?? "text/plain";

      if (contentType.includes("application/json")) {
        try {
          const payloadJson = JSON.parse(text);
          return NextResponse.json(payloadJson, {
            status: backendResponse.status,
          });
        } catch {
          // fall through
        }
      }

      return new NextResponse(text, {
        status: backendResponse.status,
        headers: { "Content-Type": contentType },
      });
    }

    const headers = new Headers();
    backendResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() === "content-length") {
        return;
      }
      headers.set(key, value);
    });

    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      headers,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json(
      { error: "Failed to reach backend", message },
      { status: 500 }
    );
  }
}
