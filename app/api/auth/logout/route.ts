import { NextRequest, NextResponse } from "next/server";
import { deleteSession, getSessionId, SESSION_COOKIE_NAME } from "../../../../lib/session";

export async function POST(request: NextRequest) {
    const sessionId = getSessionId(request);
    if (sessionId) deleteSession(sessionId);

    const response = NextResponse.json({ success: true });
    response.cookies.delete(SESSION_COOKIE_NAME);

    return response;
}
