import { NextRequest, NextResponse } from "next/server";

const N8N_WEBHOOK_URL =
  process.env.N8N_WEBHOOK_URL ||
  process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ||
  "https://cpkku.app.n8n.cloud/webhook-test/pharmacy-ai-analysis";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const configuredUrl =
      process.env.N8N_WEBHOOK_URL ||
      process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ||
      "https://cpkku.app.n8n.cloud/webhook/pharmacy-ai-analysis";

    // URLs to try: configured URL, and its production/test counterparts
    const urlsToTry = [configuredUrl];
    if (configuredUrl.includes("webhook-test/")) {
      urlsToTry.push(configuredUrl.replace("webhook-test/", "webhook/"));
    } else if (configuredUrl.includes("webhook/")) {
      urlsToTry.push(configuredUrl.replace("webhook/", "webhook-test/"));
    }

    let response: Response | null = null;
    let responseText = "";

    for (const targetUrl of urlsToTry) {
      try {
        response = await fetch(targetUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        responseText = await response.text();

        // If successful, or if it's not a 404 webhook-not-registered error, break
        if (response.ok || !responseText.includes("not registered")) {
          break;
        }
      } catch (fetchErr) {
        console.warn(`Failed to fetch from ${targetUrl}:`, fetchErr);
      }
    }

    if (!response || !response.ok) {
      console.error("n8n responded with error:", responseText);
      return NextResponse.json(
        {
          error: `n8n webhook error: ${response?.statusText || response?.status || "Unknown"}`,
          details: responseText,
        },
        { status: response?.status || 500 }
      );
    }

    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data);
    } catch {
      // If n8n returned plain text / string
      return NextResponse.json({ output: responseText, summary: responseText });
    }
  } catch (error: any) {
    console.error("API /api/n8n/analysis error:", error);
    return NextResponse.json(
      {
        error: "ไม่สามารถเชื่อมต่อกับ n8n Webhook ได้",
        message: error?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
