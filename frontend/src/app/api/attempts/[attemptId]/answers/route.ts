import { bffFetch } from "@/shared/api/bff/proxy";

export async function POST(req: Request, ctx: { params: Promise<{ attemptId: string }> }) {
    const { attemptId } = await ctx.params;

    const body = await req.text();
    const contentType = req.headers.get("content-type") ?? "application/json";

    const upstreamRes = await bffFetch(
        `/attempts/${encodeURIComponent(attemptId)}/answers`,
        {
            method: "POST",
            headers: { "content-type": contentType },
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
