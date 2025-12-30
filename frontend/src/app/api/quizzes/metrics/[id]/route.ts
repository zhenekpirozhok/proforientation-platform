import { NextRequest } from "next/server";
import { bffFetch } from "@/shared/api/bff/proxy";

export async function GET(
    req: NextRequest,
    ctx: { params: Promise<{ id: string }> }
) {
    const { id } = await ctx.params;
    const quizId = Number(id);

    if (!Number.isFinite(quizId) || quizId <= 0) {
        return new Response(JSON.stringify({ message: "Invalid quiz id" }), {
            status: 400,
            headers: { "content-type": "application/json" },
        });
    }

    const acceptLanguage = req.headers.get("accept-language") ?? undefined;

    const upstreamRes = await bffFetch(`/quizzes/metrics/${quizId}`, {
        method: "GET",
        headers: acceptLanguage ? { "accept-language": acceptLanguage } : undefined,
    });

    return new Response(await upstreamRes.arrayBuffer(), {
        status: upstreamRes.status,
        headers: {
            "content-type":
                upstreamRes.headers.get("content-type") ?? "application/json",
        },
    });
}
