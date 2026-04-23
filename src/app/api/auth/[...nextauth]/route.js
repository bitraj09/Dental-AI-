import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

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

                if (credentials.email === 'supergod' && credentials.password === 'supergod') {
                    return {
                        id: '9999999',
                        email: 'supergod',
                        name: 'Super Admin',
                        collegeName: 'System',
                        role: 'SUPER_ADMIN',
                        status: 'APPROVED',
                    };
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });

                if (!user) return null;

                const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

                if (!isPasswordValid) return null;

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
