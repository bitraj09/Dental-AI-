const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    const rawPassword = 'admin';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const emails = ['admin@gmail.com', 'admin@gmail'];

    for (const email of emails) {
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            const updated = await prisma.user.update({
                where: { email },
                data: {
                    password: hashedPassword,
                    role: 'ADMIN',
                    status: 'APPROVED'
                }
            });
            console.log(`User "${updated.name}" (${updated.email}) updated to ADMIN + APPROVED.`);
        } else {
            const created = await prisma.user.create({
                data: {
                    name: 'Admin User',
                    email: email,
                    password: hashedPassword,
                    collegeName: 'Dental College',
                    collegeYear: 'Final Year',
                    collegeIdNumber: 'ADMIN-001',
                    role: 'ADMIN',
                    status: 'APPROVED'
                }
            });
            console.log(`New user "${created.name}" (${created.email}) created with ADMIN + APPROVED role.`);
        }
    }
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());