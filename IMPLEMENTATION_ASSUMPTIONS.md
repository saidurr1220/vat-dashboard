# Implementation Assumptions - VAT Dashboard Auth System

## Core Assumptions

### 1. Latest Entity Definition

- **Assumption**: "Latest" refers to the most recent **Sale** record by `created_at` timestamp
- **Rationale**: Sales are the primary business entity and most frequently updated
- **Alternative**: Could be configured to return latest Product, Customer, or other entity
- **Implementation**: `/api/public/latest` returns newest sale with safe fields only

### 2. Write Endpoints Identification

- **Assumption**: All `POST`, `PUT`, `PATCH`, `DELETE` operations are considered "write" operations
- **Protected Routes**:
  - `/api/sales` (POST) - Sale creation
  - `/api/products` (POST) - Product creation
  - `/api/customers` (POST) - Customer creation
  - `/api/treasury/challans` (POST) - Treasury operations
  - All other write endpoints automatically protected by middleware
- **Read Operations**: `GET` requests remain public unless explicitly protected

### 3. Admin Role Model

- **Assumption**: Single admin role sufficient for initial implementation
- **Default Role**: All users created with 'ADMIN' role by default
- **Future**: Can be extended to support 'USER', 'MANAGER', etc.
- **Permissions**: ADMIN role has full write access to all endpoints

### 4. Database Schema Compatibility

- **Assumption**: Existing PostgreSQL database with Drizzle ORM
- **Migration Strategy**: Additive changes only (no breaking changes)
- **New Tables**: `users`, `audit_logs` added without affecting existing data
- **Optional Fields**: `created_by` in sales table is nullable for backward compatibility

### 5. Environment Configuration

- **Assumption**: Standard Next.js environment variable handling
- **Development**: Uses `.env.local` for local development
- **Production**: Environment variables set via deployment platform
- **Secrets**: JWT_SECRET and PEPPER should be changed in production

### 6. Session Management

- **Assumption**: Cookie-based sessions preferred over header-based tokens
- **Duration**: 2-hour default session timeout (configurable)
- **Storage**: Stateless JWT tokens (no server-side session storage)
- **Refresh**: No automatic token refresh (user must re-login)

### 7. CSRF Protection Scope

- **Assumption**: CSRF protection only needed for write operations
- **Implementation**: Double-submit cookie pattern
- **Exemptions**: Read operations and public endpoints exempt
- **Token Lifetime**: CSRF token tied to session lifetime

### 8. Rate Limiting Scope

- **Assumption**: Rate limiting primarily needed for login endpoint
- **Implementation**: Simple in-memory rate limiting for development
- **Production**: Can be upgraded to Redis or external service
- **Limits**: 10 login attempts per minute per IP address

### 9. Audit Logging Requirements

- **Assumption**: All write operations should be audited
- **Data Captured**: User ID, action, resource, metadata, IP, user agent
- **Storage**: PostgreSQL table with JSON metadata
- **Retention**: No automatic cleanup (manual policy needed)

### 10. Public Data Safety

- **Assumption**: Latest sale data is safe for public consumption
- **Excluded Fields**: No customer PII, internal IDs, or sensitive business data
- **Included Fields**: Invoice number, date, customer name, total value, amount type
- **Caching**: 30-second cache appropriate for public endpoint

## Technical Assumptions

### 11. Next.js Version Compatibility

- **Assumption**: Next.js 16+ with App Router
- **Cookie Handling**: Uses new async cookies() API
- **Middleware**: Standard Next.js middleware for CORS and redirects
- **Build System**: Turbopack compatible

### 12. Database Connection

- **Assumption**: Existing Neon PostgreSQL connection working
- **Pool Configuration**: Optimized for serverless deployment
- **SSL**: Required for production Neon connections
- **Migrations**: Manual SQL execution preferred over Drizzle Kit

### 13. Frontend Integration

- **Assumption**: Minimal frontend changes required initially
- **Login Page**: Simple React form for admin login
- **State Management**: No complex state management needed
- **UI Framework**: Uses existing Tailwind CSS setup

### 14. Deployment Environment

- **Assumption**: Vercel or similar serverless platform
- **Environment Variables**: Platform-specific configuration
- **Build Process**: Standard Next.js build pipeline
- **Domain**: Custom domain with proper CORS configuration

## Business Logic Assumptions

### 15. User Management

- **Assumption**: Single admin user sufficient initially
- **Registration**: No self-registration (admin-created accounts only)
- **Password Reset**: Not implemented (manual admin intervention)
- **User Roles**: Simple ADMIN/USER distinction

### 16. Access Control Granularity

- **Assumption**: Endpoint-level access control sufficient
- **Data Filtering**: No row-level security needed
- **Resource Ownership**: No user-specific data isolation
- **Permissions**: Binary admin/non-admin access model

### 17. Security Threat Model

- **Assumption**: Standard web application threats
- **Primary Concerns**: Unauthorized data modification, session hijacking, CSRF
- **Secondary Concerns**: Brute force attacks, data exposure
- **Out of Scope**: Advanced persistent threats, insider threats

### 18. Compliance Requirements

- **Assumption**: Basic audit trail sufficient for compliance
- **Data Protection**: Minimal PII collection and processing
- **Retention**: No specific data retention requirements
- **Reporting**: Manual audit log analysis acceptable

## Operational Assumptions

### 19. Monitoring and Alerting

- **Assumption**: Basic logging sufficient initially
- **Error Tracking**: Console logging for development
- **Performance**: No specific performance monitoring
- **Security Events**: Audit logs provide security visibility

### 20. Backup and Recovery

- **Assumption**: Platform-provided database backups sufficient
- **Recovery Time**: Standard database restore procedures
- **Data Loss**: Acceptable to lose recent audit logs in disaster
- **Testing**: Manual backup/restore testing

## Future Considerations

### 21. Scalability

- **Current**: Single-instance, in-memory rate limiting
- **Future**: Redis-based rate limiting, distributed sessions
- **Database**: Current connection pool suitable for moderate load
- **Caching**: Application-level caching may be needed

### 22. Feature Expansion

- **Authentication**: OAuth, SSO integration possible
- **Authorization**: Fine-grained permissions system
- **API**: RESTful API versioning strategy
- **Mobile**: API-first design supports mobile clients

### 23. Integration Points

- **External Systems**: No current integrations assumed
- **Webhooks**: Audit logs could trigger external notifications
- **APIs**: Public API could be expanded with proper authentication
- **Reporting**: Business intelligence integration possible

These assumptions guided the implementation decisions and can be revisited as requirements evolve.
