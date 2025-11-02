import 'dotenv/config';
import { db } from '../src/db/client';
import { users } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../src/lib/auth';

async function updateAdmin() {
    try {
        console.log('Environment check:', {
            hasAdminEmail: !!process.env.ADMIN_EMAIL,
            hasAdminPassword: !!process.env.ADMIN_PASSWORD,
            nodeEnv: process.env.NODE_ENV
        });

        const adminEmail = 'saidurr1256@gmail.com';
        const adminPassword = 'Rahman2155';

        console.log('Updating admin user:', adminEmail);

        // Hash new password
        const passwordHash = await hashPassword(adminPassword);

        // Check if user exists
        const existingAdmin = await db
            .select()
            .from(users)
            .where(eq(users.email, adminEmail.toLowerCase().trim()))
            .limit(1);

        if (existingAdmin.length > 0) {
            // Update existing user
            const [updatedAdmin] = await db
                .update(users)
                .set({
                    passwordHash,
                    isActive: true,
                    updatedAt: new Date()
                })
                .where(eq(users.email, adminEmail.toLowerCase().trim()))
                .returning();

            console.log('Admin user updated successfully:', {
                id: updatedAdmin.id,
                email: updatedAdmin.email,
                role: updatedAdmin.role
            });
        } else {
            // Create new user
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
        }
    } catch (error) {
        console.error('Error updating admin:', error);
        process.exit(1);
    }
}

updateAdmin();