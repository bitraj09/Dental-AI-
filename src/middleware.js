import { withAuth } from "next-auth/middleware";

export default withAuth({
    callbacks: {
        authorized: ({ token }) => !!token,
    },
});

export const config = {
    matcher: [
        "/diagnosis/:path*",
        "/landmarks/:path*",
        "/forensics/:path*",
        "/compare/:path*",
        "/records/:path*",
    ],
};
