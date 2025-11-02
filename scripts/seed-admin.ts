import 'dotenv/config';
import { db } from '../src/db/client';
import { users } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../src/lib/auth';

async function seedAdmin() {
    try {
        console.log('Environment check:', {
            hasAdminEmail: !!process.env.ADMIN_EMAIL,
            hasAdminPassword: !!process.env.ADMIN_PASSWORD,
            nodeEnv: process.env.NODE_ENV
        });

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@vatdashboard.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'VatAdmin2024!';

        console.log('Using admin email:', adminEmail);

        // Check if admin already exists
        const existingAdmin = await db
            .select()
            .from(users)
            .where(eq(users.email, adminEmail.toLowerCase().trim()))
            .limit(1);

        if (existingAdmin.length > 0) {
            console.log('Admin user already exists:', adminEmail);
            return;
        }

        // Hash password
        const passwordHash = await hashPassword(adminPassword);

        // Create admin user
        const [newAdmin] = await db
            .insert(users)
            .values({
                email: adminEmail.toLowerCase().trim(),
                passwordHash,
                role: 'ADMIN',
                isActive: true
            })
            .returning();

        console.log('Admin user created successfully:', {
            id: newAdmin.id,
            email: newAdmin.email,
            role: newAdmin.role
        });
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    seedAdmin().then(() => process.exit(0));
}

export { seedAdmin };