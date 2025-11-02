// Client-side auth utilities
'use client';

export async function checkAuthAndRedirect(): Promise<boolean> {
    try {
        const response = await fetch('/api/auth/me');

        if (response.status === 401) {
            // Not authenticated - redirect to login with current page as redirect
            const currentPath = window.location.pathname;
            window.location.href = `/admin/login?redirect=${encodeURIComponent(currentPath)}`;
            return false;
        }

        if (response.ok) {
            const data = await response.json();
            return data.role === 'ADMIN';
        }

        return false;
    } catch (error) {
        console.error('Auth check failed:', error);
        return false;
    }
}

export async function makeAuthenticatedRequest(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    try {
        // First check if we're authenticated
        const authResponse = await fetch('/api/auth/me');

        if (authResponse.status === 401) {
            // Not authenticated - redirect to login with current page as redirect
            const currentPath = window.location.pathname;
            window.location.href = `/admin/login?redirect=${encodeURIComponent(currentPath)}`;
            throw new Error('Authentication required');
        }

        if (!authResponse.ok) {
            throw new Error('Authentication check failed');
        }

        const authData = await authResponse.json();

        // Add CSRF token to headers for write operations
        const method = options.method || 'GET';
        const isWriteOperation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());

        if (isWriteOperation && authData.csrfToken) {
            options.headers = {
                ...options.headers,
                'x-csrf-token': authData.csrfToken
            };
        }

        // Make the actual request
        const response = await fetch(url, options);

        // If we get 401, redirect to login
        if (response.status === 401) {
            const currentPath = window.location.pathname;
            window.location.href = `/admin/login?redirect=${encodeURIComponent(currentPath)}`;
            throw new Error('Authentication required');
        }

        return response;
    } catch (error) {
        console.error('Authenticated request failed:', error);
        throw error;
    }
}

export function logout() {
    fetch('/api/auth/logout', { method: 'POST' })
        .then(() => {
            window.location.href = '/admin/login';
        })
        .catch(() => {
            // Even if logout fails, redirect to login
            window.location.href = '/admin/login';
        });
}