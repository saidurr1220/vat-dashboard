# VAT Dashboard

A comprehensive VAT management system built with Next.js, TypeScript, and PostgreSQL.

## Features

- 📊 Monthly VAT calculations and tracking
- 💰 Closing balance management (bank statement style)
- 📈 Sales data management
- 🧮 Automatic VAT computations
- 📋 Monthly reports and summaries
- 🔒 Data validation and integrity

## Tech Stack

- **Frontend**: Next.js 16, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Database**: PostgreSQL with Drizzle ORM
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or pnpm

### Local Development

1. Clone the repository:
   \`\`\`bash
   git clone <your-repo-url>
   cd vat-dashboard
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install

# or

pnpm install
\`\`\`

3. Set up environment variables:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

4. Update the \`.env\` file with your database URL:
   \`\`\`
   DATABASE_URL="postgresql://username:password@localhost:5432/database"
   \`\`\`

5. Set up the database:
   \`\`\`bash
   npm run db:push
   \`\`\`

6. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Database Setup

The application uses PostgreSQL with Drizzle ORM. The main tables include:

- \`closing_balance\` - VAT closing balance tracking
- \`monthly_sales\` - Monthly sales data
- \`vat_computations\` - VAT calculation results

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Set up a PostgreSQL database (recommended: Neon, Supabase, or Railway)
4. Add the \`DATABASE_URL\` environment variable in Vercel
5. Deploy!

### Environment Variables

- \`DATABASE_URL\` - PostgreSQL connection string

## Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run start\` - Start production server
- \`npm run db:push\` - Push database schema
- \`npm run db:generate\` - Generate migrations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is private and proprietary.
