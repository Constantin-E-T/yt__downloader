import { NextRequest, NextResponse } from "next/server";

import { backendFetch } from "@/lib/server/backend-client";

type RouteParams = {
  params: Promise<{
    transcriptId: string;
  }>;
};

export async function POST(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const params = await context.params;
    const body = await request.text();
    const contentType =
      request.headers.get("content-type") ?? "application/json";

    const backendResponse = await backendFetch(
      `/api/v1/transcripts/${encodeURIComponent(params.transcriptId)}/qa`,
      {
        method: "POST",
        headers: {
          "Content-Type": contentType,
        },
        body,
      }
    );

    return await adaptBackendResponse(backendResponse);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json(
      { error: "Failed to reach backend", message },
      { status: 500 }
    );
  }
}

async function adaptBackendResponse(response: Response) {
  const contentType =
    response.headers.get("content-type") ?? "application/json";

  const text = await response.text();

  if (contentType.includes("application/json")) {
    try {
      const json = JSON.parse(text);
      return NextResponse.json(json, {
        status: response.status,
      });
    } catch {
      // fall through
    }
  }

  return new NextResponse(text, {
    status: response.status,
    headers: { "Content-Type": contentType },
  });
}
