# Vercel Deployment Setup

## Environment Variables Required

আপনার Vercel dashboard এ যেয়ে এই environment variable add করতে হবে:

### 1. Vercel Dashboard এ যান

- https://vercel.com/dashboard
- আপনার project select করুন
- Settings > Environment Variables এ যান

### 2. Add Environment Variable

```
Name: DATABASE_URL
Value: postgresql://neondb_owner:npg_IgwU4kOpXKC9@ep-super-wildflower-ae724kk0-pooler.c-2.us-east-2.aws.neon.tech/mydb?sslmode=require&channel_binding=require
Environment: Production, Preview, Development
```

### 3. Redeploy

- Deployments tab এ যান
- Latest deployment এর পাশে "..." click করুন
- "Redeploy" select করুন

## Database Connection Test

Deployment এর পর এই URL দিয়ে test করুন:

```
https://your-app.vercel.app/api/test-db
```

এটি database connection status দেখাবে।

## Troubleshooting

যদি এখনও data না আসে:

1. Vercel logs check করুন
2. Database connection string verify করুন
3. Neon database active আছে কিনা check করুন

## Current Database Info

- **Database**: Neon PostgreSQL
- **Products**: 17 items
- **Imports**: 9 BoE entries
- **Stock System**: Fully functional
