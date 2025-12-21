import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./shared/i18n/lib/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
        return NextResponse.next();
    }

    return intlMiddleware(req);
}

export const config = {
    matcher: [
        '/((?!api/|api$|_next/|_next$|.*\\..*).*)',
    ],
};
