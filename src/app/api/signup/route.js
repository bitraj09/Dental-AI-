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
        const confirmPassword = formData.get('confirmPassword');
        const collegeName = formData.get('collegeName');
        const collegeYear = formData.get('collegeYear');
        const collegeIdNumber = formData.get('collegeIdNumber');
        const idCard = formData.get('idCard'); // This is a File object

        if (!email || !password || !name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
        }

        // Password strength validation
        if (password.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
        }

        if (password !== confirmPassword) {
            return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
        }

        if (!idCard || idCard.size === 0) {
            return NextResponse.json({ error: 'College ID card is required' }, { status: 400 });
        }

        // Check if user exists before processing file upload
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        // Check for blocked college types
        const blockedConfig = await prisma.systemConfig.findUnique({ where: { key: 'BLOCKED_COLLEGES' } });
        if (blockedConfig && blockedConfig.value) {
            const blockedList = blockedConfig.value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
            const lowerClg = (collegeName || '').toLowerCase();
            const isBlocked = blockedList.some(block => lowerClg.includes(block));
            if (isBlocked) {
                return NextResponse.json({ error: 'Signups from this type of college are currently blocked by the Super Admin.' }, { status: 403 });
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Validate file type and size
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(idCard.type)) {
            return NextResponse.json({ error: 'Invalid file type. Please upload a JPG, PNG, or WebP image.' }, { status: 400 });
        }

        if (idCard.size > 5 * 1024 * 1024) { // 5MB limit
            return NextResponse.json({ error: 'File size too large. Max limit is 5MB.' }, { status: 400 });
        }

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
                role: 'USER',
                status: 'PENDING',
            }
        });

        return NextResponse.json({ message: 'User created successfully', user: { id: user.id, email: user.email } });
    } catch (error) {
        console.error('[Signup API Error]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
