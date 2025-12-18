import { NextRequest, NextResponse } from "next/server";

interface IncomingRow {
  user_id: string;
  tenant?: string | null;
}

interface KnockMember {
  user: { id: string };
  tenant?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ audience_key: string }> }
) {
  const knockApiKey = process.env.KNOCK_API_KEY;
  const knockBaseUrl = process.env.KNOCK_BASE_URL || "https://api.knock.app";

  if (!knockApiKey) {
    return NextResponse.json(
      { error: "KNOCK_API_KEY environment variable is not set" },
      { status: 500 }
    );
  }

  const { audience_key: audienceKey } = await params;

  if (!audienceKey) {
    return NextResponse.json(
      { error: "audience_key is required in the URL path" },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Log incoming request body from Segment
  console.log("[ADD] audienceKey:", audienceKey);
  console.log("[ADD] body:", JSON.stringify(body, null, 2));

  // Normalize to array
  const rows: IncomingRow[] = Array.isArray(body) ? body : [body];

  // Build members array
  const members: KnockMember[] = [];

  for (const row of rows) {
    const { user_id, tenant } = row;

    if (!user_id) {
      continue; // Skip invalid rows
    }

    const member: KnockMember = { user: { id: user_id } };
    if (tenant != null && tenant !== "") {
      member.tenant = tenant;
    }

    members.push(member);
  }

  if (members.length === 0) {
    return NextResponse.json(
      { error: "No valid members to add" },
      { status: 400 }
    );
  }

  // Call Knock
  const url = `${knockBaseUrl}/v1/audiences/${encodeURIComponent(
    audienceKey
  )}/members`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${knockApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ members }),
  });

  let responseBody: unknown;
  try {
    responseBody = await res.json();
  } catch {
    responseBody = null;
  }

  // Log Knock response
  console.log("[ADD] knockStatus:", res.status);
  console.log("[ADD] knockResponse:", JSON.stringify(responseBody, null, 2));

  return NextResponse.json(
    {
      audience_key: audienceKey,
      members_processed: members.length,
      status: res.status,
      response: responseBody,
    },
    { status: res.status >= 400 ? res.status : 200 }
  );
}
