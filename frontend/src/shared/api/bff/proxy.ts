import { headers } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL;

if (!BACKEND_URL) {
    throw new Error("BACKEND_URL is not defined");
}

export async function bffFetch(
    path: string,
    init: RequestInit = {}
): Promise<Response> {
    const incomingHeaders = await headers();

    const res = await fetch(`${BACKEND_URL}${path}`, {
        ...init,
        headers: {
            ...Object.fromEntries(incomingHeaders),
            ...init.headers,
        },
        cache: "no-store",
    });

    return res;
}
