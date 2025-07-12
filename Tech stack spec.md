# Tech Stack Decision Document: Event Photo-Prompt Service

## 🎯 Selection Criteria
- **AI-friendly**: Well-documented, popular tools that AI assistants can effectively help with
- **Cost-effective**: Free tiers and pay-as-you-grow pricing
- **Developer velocity**: Quick to prototype and iterate
- **Battle-tested**: Proven in production environments
- **Simple to deploy**: Minimal DevOps complexity

## 📚 Recommended Stack

### Frontend Framework
**Winner: Next.js 14+ (App Router)**
- ✅ Full-stack React framework with excellent AI support
- ✅ Built-in API routes reduce backend complexity
- ✅ Server Components for better performance
- ✅ Image optimization out of the box
- ✅ Excellent mobile performance (critical for your use case)

### CSS / Component Library
**Winner: Tailwind CSS + shadcn/ui**
- ✅ Utility-first CSS that AI understands extremely well
- ✅ shadcn/ui provides beautiful, accessible components
- ✅ Copy-paste components (no dependency bloat)
- ✅ Mobile-first by default
- ✅ Highly customizable for branding

### Backend Framework
**Winner: Next.js API Routes + Prisma ORM**
- ✅ Integrated with frontend (one deployment)
- ✅ TypeScript-first with excellent type safety
- ✅ Prisma is the most AI-friendly ORM
- ✅ Auto-generated types across stack

### Database
**Winner: PostgreSQL on Neon**
- ✅ Generous free tier (0.5 GB)
- ✅ Serverless with auto-scaling
- ✅ Branching for development
- ✅ Works perfectly with Prisma
- ✅ Built-in connection pooling

### Object Storage
**Winner: Cloudflare R2**
- ✅ No egress fees (huge cost savings)
- ✅ S3-compatible API
- ✅ 10GB free storage/month
- ✅ Excellent performance with Workers

### Hosting / CDN
**Winner: Vercel**
- ✅ Zero-config Next.js deployments
- ✅ Generous free tier
- ✅ Automatic preview deployments
- ✅ Built-in CDN and edge functions
- ✅ Excellent DX with git integration

### Authentication
**Winner: NextAuth.js (Auth.js)**
- ✅ Built for Next.js
- ✅ Support for magic links (perfect for events)
- ✅ OAuth providers if needed
- ✅ Database sessions with Prisma adapter
- ✅ Well-documented, AI-friendly

### QR Code Generation
**Winner: qrcode.js (client) + qr-server API (fallback)**
- ✅ Generate QR codes client-side for performance
- ✅ No external dependencies for basic QR codes
- ✅ Customizable styling options
- ✅ Server-side generation available if needed

### CI/CD & DevOps
**Winner: GitHub Actions + Vercel**
- ✅ Automatic deployments on push
- ✅ Preview deployments for PRs
- ✅ Built-in testing workflows
- ✅ Database migrations with Prisma
- ✅ Environment variable management

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel Edge Network                  │
├─────────────────────────────────────────────────────────┤
│                   Next.js Application                   │
│  ┌─────────────────┐        ┌──────────────────────┐    │
│  │  React Frontend │        │   API Routes         │    │
│  │  - Tailwind CSS │  ←───→ │   - NextAuth.js      │    │
│  │  - shadcn/ui    │        │   - Prisma Client    │    │
│  │  - qrcode.js    │        │   - R2 SDK           │    │
│  └─────────────────┘        └──────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                │                         │
                ↓                         ↓
    ┌──────────────────┐      ┌──────────────────────┐
    │   Neon Postgres  │      │   Cloudflare R2      │
    │   - User data    │      │   - Photo storage    │
    │   - Event data   │      │   - Optimized images │
    │   - Metadata     │      │                      │
    └──────────────────┘      └──────────────────────┘
```

## 💰 Cost Breakdown (Monthly)

### Free Tier Coverage
- **Vercel**: 100GB bandwidth, unlimited deployments
- **Neon**: 0.5GB storage, 100 compute hours
- **Cloudflare R2**: 10GB storage, 10M requests
- **GitHub**: Unlimited public repos, 2000 CI minutes

### Estimated Costs at Scale
- **100 events/month**: ~$0 (within free tiers)
- **1,000 events/month**: ~$20-30
- **10,000 events/month**: ~$100-200

## 🚀 Quick Start Commands

```bash
# Create Next.js app with TypeScript
npx create-next-app@latest photo-prompt-app --typescript --tailwind --app

# Install core dependencies
npm install @prisma/client prisma @auth/prisma-adapter next-auth
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
npm install qrcode.js sharp
npm install -D @types/qrcode

# Initialize Prisma
npx prisma init

# Install shadcn/ui
npx shadcn-ui@latest init
```

NOTE: DONE!

## 📝 Key Decisions & Rationale

### Why Next.js over separate frontend/backend?
- **Simplified deployment**: One app to deploy and monitor
- **Shared types**: TypeScript types flow seamlessly
- **Better SEO**: Server-side rendering for landing pages
- **API Routes**: Perfect for your simple CRUD operations

### Why PostgreSQL over NoSQL?
- **Relational data**: Events → Prompts → Photos naturally relational
- **ACID compliance**: Important for user uploads
- **Prisma support**: Best-in-class ORM experience
- **Future flexibility**: Can add complex queries later

### Why Cloudflare R2 over S3?
- **No egress fees**: Huge savings as photos are downloaded
- **S3 compatibility**: Easy migration if needed
- **Global performance**: Built on Cloudflare's network
- **Simple pricing**: Predictable costs

## 🎯 MVP Implementation Order

1. **Setup Next.js + Tailwind + shadcn/ui** (2 hours)
2. **Configure Prisma + Neon database** (1 hour)
3. **Implement basic auth with NextAuth.js** (2 hours)
4. **Create event CRUD operations** (3 hours)
5. **Build QR code generation** (1 hour)
6. **Implement photo upload to R2** (3 hours)
7. **Create guest prompt flow** (4 hours)
8. **Build organizer dashboard** (4 hours)
9. **Deploy to Vercel** (1 hour)

**Total MVP estimate**: ~21 hours of focused development

## 🤖 AI Development Tips

When working with AI assistants on this stack:
- Always specify "Next.js App Router" (not Pages Router)
- Request "Server Components by default" for better performance
- Ask for "Prisma schema first" when building features
- Use "shadcn/ui components" for consistent UI
- Specify "mobile-first Tailwind classes" for responsive design

This stack is extensively documented and AI assistants can provide detailed, working code for every component!