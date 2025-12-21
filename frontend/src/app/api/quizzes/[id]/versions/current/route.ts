import { NextResponse } from "next/server";
import { bffFetch } from "@/shared/api/bff/proxy";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;

    const res = await bffFetch(`/quizzes/${id}/versions/current`, { method: "GET" });
    const text = await res.text();

    return new NextResponse(text, {
        status: res.status,
        headers: { "content-type": "application/json" },
    });
}
