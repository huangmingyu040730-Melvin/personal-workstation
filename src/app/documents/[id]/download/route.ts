import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.redirect(new URL(`/dashboard/documents/${id}/download`, request.url));
}
