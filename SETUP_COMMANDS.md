# VAT Dashboard Auth System Setup Commands

## Initial Setup

1. **Install dependencies:**

```bash
npm install jose argon2 cookie ua-parser-js
```

2. **Run auth migration:**

```bash
npm run auth:migrate
```

3. **Seed admin user:**

```bash
npm run auth:seed
```

4. **Or run both at once:**

```bash
npm run auth:setup
```

## Development

1. **Start development server:**

```bash
npm run dev
```

2. **Test auth system:**

```bash
npm run test:auth
```

3. **Build for production:**

```bash
npm run build
```

## Environment Variables

Add to your `.env.local`:

```env
# Authentication Configuration
JWT_SECRET=vat_dashboard_jwt_secret_change_in_production_2024
JWT_EXPIRES_IN=2h
COOKIE_NAME=auth
PEPPER=vat_dashboard_pepper_secret_2024

# Admin User (for seeding)
ADMIN_EMAIL=admin@vatdashboard.com
ADMIN_PASSWORD=VatAdmin2024!
```

## Testing

1. **Manual testing with cURL:**

```bash
chmod +x examples/curl-examples.sh
./examples/curl-examples.sh
```

2. **Automated testing:**

```bash
npx tsx scripts/test-auth-system.ts
```

## Admin Access

1. **Login page:** http://localhost:3000/admin/login
2. **Default credentials:**
   - Email: admin@vatdashboard.com
   - Password: VatAdmin2024!

## API Endpoints

### Public (No Auth)

- `GET /api/public/latest` - Latest sale data (cached 30s)

### Authentication

- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Check auth status

### Protected (Admin Only)

- `POST /api/sales` - Create sale
- `POST /api/products` - Create product
- `POST /api/customers` - Create customer
- `POST /api/treasury/challans` - Create treasury challan
- All other write operations (POST/PUT/PATCH/DELETE)

## Security Features

- JWT tokens in HTTP-only cookies
- CSRF protection for write operations
- Rate limiting on login attempts
- Audit logging for all write operations
- Password hashing with Argon2id + optional pepper
- Secure cookie flags in production
- CORS protection
