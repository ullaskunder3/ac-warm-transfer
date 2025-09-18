import { type NextRequest, NextResponse } from "next/server";

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

export async function POST(request: NextRequest) {
  if (!DEEPGRAM_API_KEY) {
    return NextResponse.json(
      { error: "Deepgram API key not configured" },
      { status: 500 }
    );
  }

  try {
    const { action } = await request.json();

    if (action === "start") {
      // Return WebSocket URL with token for client to connect
      return NextResponse.json({
        websocketUrl: `wss://api.deepgram.com/v1/listen?model=nova-3`,
        token: DEEPGRAM_API_KEY,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Transcription API error:", error);
    return NextResponse.json(
      { error: "Failed to process transcription request" },
      { status: 500 }
    );
  }
}
