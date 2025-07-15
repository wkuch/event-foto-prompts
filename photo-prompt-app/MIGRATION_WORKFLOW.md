# Database Migration Workflow

## Overview
This project uses Prisma for fully automated database migrations. Once set up, database schema changes are handled automatically during deployment.

## Files
- **`.env`**: Contains `DATABASE_URL` for Prisma CLI (required for migrations)
- **`.env.local`**: Contains all environment variables for Next.js application
- **`prisma/migrations/`**: Contains timestamped migration files (committed to Git)
- **`prisma/schema.prisma`**: Database schema definition

## Automated Deployment Process

### What Happens on Vercel Deployment
1. **Code pushed to Git** → Vercel deployment starts
2. **`npm run build`** executes:
   - `prisma migrate deploy` → Applies pending migrations to production database
   - `prisma generate` → Generates TypeScript client
   - `next build` → Builds the application
3. **Application deployed** with updated database schema

### Environment Variables for Vercel
Add these to your Vercel dashboard:
```
DATABASE_URL=postgres://neondb_owner:...@ep-morning-credit-a2u63k27-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
NEXTAUTH_URL=https://yourapp.vercel.app
NEXTAUTH_SECRET=your-production-secret
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://your_r2_public_url
```

## Development Workflow

### Making Schema Changes
1. **Edit `prisma/schema.prisma`** with your changes
2. **Run migration command**:
   ```bash
   npx prisma migrate dev --name "describe_your_changes"
   ```
3. **Commit the changes**:
   ```bash
   git add .
   git commit -m "Add user roles to schema"
   git push
   ```
4. **Deploy automatically** - Vercel will apply migrations on deployment

### Example: Adding a New Field
```prisma
model User {
  id            String    @id @default(cuid())
  email         String?   @unique
  name          String?
  role          String    @default("user")  // New field
  // ... other fields
}
```

Run:
```bash
npx prisma migrate dev --name "add_user_role"
```

### Local Development
```bash
# Start development server
npm run dev

# The app will use the database specified in .env.local
# Migrations are automatically applied during development
```

## Migration Commands Reference

### Development
```bash
# Create and apply new migration
npx prisma migrate dev --name "migration_name"

# Reset database (destructive - dev only)
npx prisma migrate reset

# View migration status
npx prisma migrate status
```

### Production
```bash
# Apply pending migrations (used in build process)
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

## Database Schema Consistency

### ✅ Guaranteed Consistency
- **Local ↔ Production**: Same migration files applied to both
- **Team Members**: Same schema through Git-tracked migrations
- **Rollbacks**: Git revert automatically rolls back schema changes

### ✅ Safety Features
- **Dry Run**: Prisma validates migrations before applying
- **Backup**: Always backup production data before major changes
- **Rollback**: Use Git to revert problematic migrations

## Troubleshooting

### Migration Failed
1. Check migration files in `prisma/migrations/`
2. Verify database connection in `.env`
3. Run `npx prisma migrate status` to see current state
4. If needed, run `npx prisma migrate resolve --rolled-back "migration_name"`

### Schema Drift
If database schema doesn't match Prisma schema:
```bash
npx prisma db push  # Push schema to database (use carefully)
```

### Environment Issues
- **Prisma CLI**: Uses `.env` file
- **Next.js App**: Uses `.env.local` file
- **Vercel**: Uses environment variables from dashboard

## Best Practices

1. **Always describe migrations clearly**:
   ```bash
   npx prisma migrate dev --name "add_user_authentication"
   ```

2. **Test migrations locally first**:
   ```bash
   npx prisma migrate dev --name "test_change"
   # Test the application
   # Then commit and deploy
   ```

3. **Keep migrations small and focused**:
   - One logical change per migration
   - Easier to debug and rollback

4. **Never edit migration files directly**:
   - Always use `prisma migrate dev` to create new migrations
   - Migration files are generated, not manually edited

## Summary

With this setup, you never manually touch the database again. The workflow is:
1. Change `schema.prisma`
2. Run `npx prisma migrate dev --name "description"`
3. Commit and push
4. Vercel automatically applies migrations during deployment

🎉 **Fully automated, zero-error database migrations!**