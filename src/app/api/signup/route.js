import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(req) {
    try {
        const formData = await req.formData();
        const name = formData.get('name');
        const email = formData.get('email');
        const password = formData.get('password');
        const collegeName = formData.get('collegeName');
        const collegeYear = formData.get('collegeYear');
        const collegeIdNumber = formData.get('collegeIdNumber');
        const idCard = formData.get('idCard'); // This is a File object

        if (!email || !password || !name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Handle ID Card Upload
        let idCardPath = null;
        if (idCard && idCard.size > 0) {
            const bytes = await idCard.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const uploadDir = join(process.cwd(), 'public', 'uploads');
            try {
                await mkdir(uploadDir, { recursive: true });
            } catch (e) { }

            const filename = `${Date.now()}-${idCard.name.replace(/\s+/g, '-')}`;
            const path = join(uploadDir, filename);
            await writeFile(path, buffer);
            idCardPath = `/uploads/${filename}`;
        }

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                collegeName: collegeName || '',
                collegeYear: collegeYear || '',
                collegeIdNumber: collegeIdNumber || '',
                idCardPath,
            }
        });

        return NextResponse.json({ message: 'User created successfully', user: { id: user.id, email: user.email } });
    } catch (error) {
        console.error('[Signup API Error]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
