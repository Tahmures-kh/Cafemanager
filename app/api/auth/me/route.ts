import { NextRequest, NextResponse } from "next/server";
import { getSessionAccount } from "../../../../lib/session";

export async function GET(request: NextRequest) {
    const account = getSessionAccount(request);

    if (!account) {
        return NextResponse.json({ error: "ورود لازم است." }, { status: 401 });
    }

    return NextResponse.json({
        username: account.username,
        role: account.role,
        displayName: account.displayName,
    });
}
