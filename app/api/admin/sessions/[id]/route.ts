import { NextRequest, NextResponse } from "next/server";
import { deleteSession, requireAuth } from "../../../../../lib/session";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = requireAuth(request, ["admin"]);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    deleteSession(id);

    return NextResponse.json({ success: true });
}
