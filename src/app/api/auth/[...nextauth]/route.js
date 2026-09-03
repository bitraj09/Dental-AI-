import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { auditLog, AuditEvents } from "@/lib/audit-log";

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });

                if (!user) {
                    auditLog(AuditEvents.LOGIN_FAILURE, { email: credentials.email, reason: 'user_not_found' });
                    return null;
                }

                const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

                if (!isPasswordValid) {
                    auditLog(AuditEvents.LOGIN_FAILURE, { email: credentials.email, reason: 'invalid_password' });
                    return null;
                }

                auditLog(AuditEvents.LOGIN_SUCCESS, { userId: user.id, email: user.email, role: user.role });

                // Return user with role and status for session
                return {
                    id: user.id.toString(),
                    email: user.email,
                    name: user.name,
                    collegeName: user.collegeName,
                    role: user.role,
                    status: user.status,
                };
            }
        })
    ],
    session: {
        strategy: "jwt",
        maxAge: 8 * 60 * 60,     // 8 hours — appropriate for medical app
        updateAge: 60 * 60,       // Refresh token every hour
    },
    callbacks: {
        async jwt({ token, user }) {
            // First login — set initial values
            if (user) {
                token.id = user.id;
                token.collegeName = user.collegeName;
                token.role = user.role;
                token.status = user.status;
            }

            // On EVERY token refresh — re-fetch role/status from DB
            // so admin changes reflect immediately without re-login
            if (token.id) {
                try {
                    const freshUser = await prisma.user.findUnique({
                        where: { id: parseInt(token.id) },
                        select: { role: true, status: true, name: true },
                    });
                    if (freshUser) {
                        token.role = freshUser.role;
                        token.status = freshUser.status;
                        token.name = freshUser.name;
                    }
                } catch (e) {
                    // If DB is unreachable, keep existing token values
                    console.error('[JWT Refresh] DB error:', e.message);
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id;
                session.user.collegeName = token.collegeName;
                session.user.role = token.role;
                session.user.status = token.status;
            }
            return session;
        }
    },
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
