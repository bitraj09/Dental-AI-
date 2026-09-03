const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        console.log('Testing database connection...')
        const userCount = await prisma.user.count()
        console.log(`Connection successful! User count: ${userCount}`)
    } catch (e) {
        console.error('Connection failed!')
        console.error(e)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
