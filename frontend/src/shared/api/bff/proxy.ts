import { headers } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL;

if (!BACKEND_URL) throw new Error("BACKEND_URL is not defined");

export async function bffFetch(path: string, init: RequestInit = {}): Promise<Response> {
    const incomingHeaders = await headers();

    const xLocale = incomingHeaders.get("x-locale");

    const acceptLanguage = incomingHeaders.get("accept-language");

    const locale = xLocale ?? acceptLanguage;

    const res = await fetch(`${BACKEND_URL}${path}`, {
        ...init,
        headers: {
            ...Object.fromEntries(incomingHeaders),
            ...(locale ? { "accept-language": locale } : {}),
            ...init.headers,
        },
        cache: "no-store",
    });

    return res;
}
