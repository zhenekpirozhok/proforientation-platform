import { NextRequest } from "next/server";
import { bffFetch } from "@/shared/api/bff/proxy";

export async function POST(req: NextRequest, ctx: { params: Promise<{ attemptId: string }> }) {
    const { attemptId } = await ctx.params;

    const bodyText = await req.text();

    // 🔎 Логи (в консоль next dev)
    console.log("[BFF answers] attemptId=", attemptId);
    console.log("[BFF answers] x-guest-token=", req.headers.get("x-guest-token"));
    console.log("[BFF answers] authorization=", req.headers.get("authorization") ? "present" : "missing");
    console.log("[BFF answers] body=", bodyText);

    const upstreamRes = await bffFetch(`/attempts/${attemptId}/answers`, {
        method: "POST",
        headers: {
            "content-type": req.headers.get("content-type") ?? "application/json",
            // остальные заголовки bffFetch прокинет сам (authorization/x-guest-token/accept-language)
        },
        body: bodyText,
    });

    const upstreamBody = await upstreamRes.text();

    return new Response(upstreamBody, {
        status: upstreamRes.status,
        headers: {
            "content-type": upstreamRes.headers.get("content-type") ?? "application/json",
        },
    });
}
