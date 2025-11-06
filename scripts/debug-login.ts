import 'dotenv/config';
import { db } from '../src/db/client';
import { users } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword, hashPassword } from '../src/lib/auth';

async function debugLogin() {
    try {
        const email = process.env.ADMIN_EMAIL || 'admin@example.com';
        const password = process.env.ADMIN_PASSWORD || 'change-me';

        console.log('Debugging login for:', email);

        // Check if user exists
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (!user) {
            console.log('❌ User not found');
            return;
        }

        console.log('✅ User found:', {
            id: user.id,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            passwordHashLength: user.passwordHash.length
        });

        // Test password verification
        const isValid = await verifyPassword(password, user.passwordHash);
        console.log('Password verification result:', isValid);

        if (!isValid) {
            console.log('❌ Password verification failed');

            // Create new hash and update
            console.log('Creating new password hash...');
            const newHash = await hashPassword(password);

            await db
                .update(users)
                .set({ passwordHash: newHash })
                .where(eq(users.email, email));

            console.log('✅ Password hash updated');

            // Test again
            const testAgain = await verifyPassword(password, newHash);
            console.log('New password verification result:', testAgain);
        } else {
            console.log('✅ Password verification successful');
        }

    } catch (error) {
        console.error('Debug failed:', error);
    }
}

debugLogin();