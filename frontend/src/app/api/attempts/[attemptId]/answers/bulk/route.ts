import { bffFetch } from "@/shared/api/bff/proxy";

export async function POST(req: Request, ctx: { params: Promise<{ attemptId: string }> }) {
    const { attemptId } = await ctx.params;

    const body = await req.text();

    const upstreamRes = await bffFetch(
        `/attempts/${encodeURIComponent(attemptId)}/answers/bulk`,
        {
            method: "POST",
            headers: {
                "content-type": req.headers.get("content-type") ?? "application/json",
            },
            body,
        }
    );

    const upstreamBody = await upstreamRes.text();

    return new Response(upstreamBody, {
        status: upstreamRes.status,
        headers: {
            "content-type": upstreamRes.headers.get("content-type") ?? "application/json",
        },
    });
}
