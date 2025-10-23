import { NextRequest, NextResponse } from "next/server";

import { backendFetch } from "@/lib/server/backend-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const contentType =
      request.headers.get("content-type") ?? "application/json";

    const backendResponse = await backendFetch(
      "/api/v1/transcripts/fetch",
      {
        method: "POST",
        headers: {
          "Content-Type": contentType,
        },
        body,
      }
    );

    const responseHeaders = new Headers();
    const backendContentType =
      backendResponse.headers.get("content-type") ?? "application/json";
    responseHeaders.set("Content-Type", backendContentType);

    const payloadText = await backendResponse.text();

    if (backendContentType.includes("application/json")) {
      try {
        const payloadJson = JSON.parse(payloadText);
        return NextResponse.json(payloadJson, {
          status: backendResponse.status,
          headers: responseHeaders,
        });
      } catch {
        // fall back to plain response below
      }
    }

    return new NextResponse(payloadText, {
      status: backendResponse.status,
      headers: responseHeaders,
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
