import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

/**
 * Next.js 16 proxy (formerly middleware).
 * Handles authentication AND approval status checks.
 */
export async function proxy(request) {
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    const { pathname } = request.nextUrl;

    // ─── Public routes (no auth needed) ───
    const publicRoutes = [
        "/",
        "/about",
        "/login",
        "/signup",
        "/pending-approval",
    ];

    if (
        publicRoutes.includes(pathname) ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/signup") ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon") ||
        pathname.startsWith("/icons") ||
        pathname.startsWith("/uploads") ||
        pathname === "/manifest.json" ||
        pathname === "/sw.js"
    ) {
        return NextResponse.next();
    }

    // ─── No token → redirect to login ───
    if (!token) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // ─── Admin routes — only ADMIN role ───
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
        if (token.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/", request.url));
        }
        return NextResponse.next();
    }

    // ─── PENDING users → redirect to pending-approval page ───
    if (token.status === "PENDING") {
        return NextResponse.redirect(new URL("/pending-approval", request.url));
    }

    // ─── REJECTED users → redirect to pending-approval with rejected flag ───
    if (token.status === "REJECTED") {
        const rejectedUrl = new URL("/pending-approval", request.url);
        rejectedUrl.searchParams.set("status", "rejected");
        return NextResponse.redirect(rejectedUrl);
    }

    // ─── APPROVED users → allow access ───
    return NextResponse.next();
}

export const config = {
    matcher: [
        "/diagnosis/:path*",
        "/landmarks/:path*",
        "/forensics/:path*",
        "/compare/:path*",
        "/records/:path*",
        "/history/:path*",
        "/tooth-chart/:path*",
        "/admin/:path*",
        "/api/admin/:path*",
        "/api/records/:path*",
        "/api/gemini-diagnose/:path*",
        "/api/gemini-forensics/:path*",
        "/api/gemini-landmarks/:path*",
        "/api/ml-forensics/:path*",
        "/education/:path*",
        "/landmark-practice/:path*",
    ],
};
