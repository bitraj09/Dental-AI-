/**
 * Seed Script — Make an existing user an ADMIN.
 * 
 * Usage:
 *   node scripts/make-admin.js <email>
 * 
 * Example:
 *   node scripts/make-admin.js admin@example.com
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = process.argv[2];

    if (!email) {
        console.error('❌ Usage: node scripts/make-admin.js <email>');
        process.exit(1);
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.error(`❌ User with email "${email}" not found.`);
        process.exit(1);
    }

    const updated = await prisma.user.update({
        where: { email },
        data: {
            role: 'ADMIN',
            status: 'APPROVED',
        },
    });

    console.log(`✅ User "${updated.name}" (${updated.email}) is now ADMIN + APPROVED.`);
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
