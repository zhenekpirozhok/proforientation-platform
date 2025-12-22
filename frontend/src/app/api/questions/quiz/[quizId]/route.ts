import { NextRequest } from "next/server";
import { bffFetch } from "@/shared/api/bff/proxy";

export async function GET(req: NextRequest, ctx: { params: Promise<{ quizId: string }> }) {
    const { quizId } = await ctx.params;

    const search = req.nextUrl.search;
    const upstreamRes = await bffFetch(`/questions/quiz/${encodeURIComponent(quizId)}${search}`, {
        method: "GET",
    });

    const body = await upstreamRes.text();

    return new Response(body, {
        status: upstreamRes.status,
        headers: {
            "content-type": upstreamRes.headers.get("content-type") ?? "application/json",
        },
    });
}
