import { NextRequest, NextResponse } from "next/server";

import { backendFetch } from "@/lib/server/backend-client";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ transcriptId: string }> }
) {
  try {
    const { transcriptId } = await context.params;

    const backendResponse = await backendFetch(
      `/api/v1/transcripts/${encodeURIComponent(transcriptId)}`
    );

    const contentType =
      backendResponse.headers.get("content-type") ?? "application/json";

    const payloadText = await backendResponse.text();

    if (contentType.includes("application/json")) {
      try {
        const payloadJson = JSON.parse(payloadText);
        return NextResponse.json(payloadJson, {
          status: backendResponse.status,
        });
      } catch {
        // fall back to plain response below
      }
    }

    return new NextResponse(payloadText, {
      status: backendResponse.status,
      headers: { "Content-Type": contentType },
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
