# AI Agent Development Directives

## Project Context
You are helping develop an Event Photo-Prompt Service using the following tech stack:
- **Frontend/Backend**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL with Prisma ORM
- **File Storage**: Cloudflare R2
- **Hosting**: Vercel
- **Authentication**: NextAuth.js (Auth.js)

## Core Directives

### 1. Next.js Implementation
- **ALWAYS use App Router**, never Pages Router
- **Default to Server Components** unless client interactivity is needed
- **Use `"use client"` directive** only when necessary (useState, useEffect, onClick, etc.)
- **Implement API routes** in `app/api/` directory using Route Handlers
- **Use Next.js Image component** for all images with proper width/height
- **Leverage dynamic imports** for heavy client-side libraries

### 2. Database & Prisma
- **Start with Prisma schema** when implementing new features
- **Include all relations** in schema (one-to-many, many-to-many)
- **Use proper Prisma types** in TypeScript (never use 'any')
- **Implement database queries** with proper error handling
- **Use Prisma transactions** for operations that modify multiple tables
- **Include `@db.Text` for long strings** and `@default(now())` for timestamps

### 3. Styling & UI Components
- **Use mobile-first Tailwind classes** (start with base mobile styles)
- **Import shadcn/ui components** with: `import { Button } from "@/components/ui/button"`
- **Never use inline styles** - always use Tailwind utilities
- **Implement dark mode support** using Tailwind's dark: prefix
- **Use semantic HTML elements** for accessibility
- **Apply consistent spacing** using Tailwind's spacing scale (p-4, m-2, etc.)

### 4. File Upload & Storage
- **Generate presigned URLs** for direct uploads to R2
- **Implement client-side image optimization** before upload
- **Use multipart uploads** for files larger than 5MB
- **Store file metadata in database**, actual files in R2
- **Include proper CORS configuration** for R2 bucket
- **Implement progress indicators** for file uploads

### 5. Authentication Flow
- **Use NextAuth.js App Router configuration** in `app/api/auth/[...nextauth]/route.ts`
- **Implement magic link authentication** for guest users
- **Store sessions in database** using Prisma Adapter
- **Protect API routes** with `getServerSession()`
- **Create middleware** for protecting entire route groups
- **Handle authentication errors** gracefully with user-friendly messages

### 6. Mobile Optimization
- **Test all interactions on mobile viewport** (375px width minimum)
- **Implement touch-friendly tap targets** (minimum 44x44px)
- **Use responsive images** with srcset for different screen sizes
- **Optimize for slow networks** with loading states
- **Implement pull-to-refresh** where appropriate
- **Ensure forms are mobile-friendly** with proper input types

### 7. Performance Best Practices
- **Implement proper loading.tsx and error.tsx** files
- **Use Suspense boundaries** for async components
- **Optimize bundle size** with dynamic imports
- **Implement proper caching strategies** for API routes
- **Use React Server Components** for data fetching
- **Minimize client-side JavaScript** where possible

### 8. Error Handling & Validation
- **Use Zod for runtime validation** of API inputs
- **Implement proper error boundaries** in client components
- **Return consistent API error responses** with status codes
- **Log errors to console** in development, error service in production
- **Show user-friendly error messages** never raw errors
- **Validate file types and sizes** before upload

### 9. Code Organization
```
app/
├── (auth)/
│   ├── login/
│   └── register/
├── (dashboard)/
│   ├── events/
│   └── settings/
├── api/
│   ├── auth/[...nextauth]/
│   ├── events/
│   └── upload/
├── components/
│   ├── ui/           # shadcn/ui components
│   └── features/     # custom components
└── lib/
    ├── db.ts        # Prisma client
    ├── auth.ts      # NextAuth config
    └── utils.ts     # Helper functions
```

### 10. Type Safety
- **Never use `any` type** - use `unknown` if type is truly unknown
- **Export types from Prisma** for use across the application
- **Create explicit interfaces** for all API responses
- **Use const assertions** for literal types
- **Implement proper generic types** for reusable components
- **Validate environment variables** with type-safe schemas

### 11. Security Considerations
- **Sanitize all user inputs** before database storage
- **Implement rate limiting** on API routes
- **Use CSRF protection** for state-changing operations
- **Validate file uploads** (type, size, content)
- **Never expose sensitive data** in client components
- **Use environment variables** for all secrets

### 12. QR Code Implementation
- **Generate QR codes client-side** when possible for performance
- **Include error correction** level appropriate for printing
- **Make QR codes downloadable** as PNG/SVG
- **Test QR codes** with multiple mobile devices
- **Include human-readable backup** (short URL)
- **Style QR codes** to match event branding

## Example Implementations

### Server Component with Data Fetching
```typescript
// app/events/[id]/page.tsx
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'

export default async function EventPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      prompts: true,
      photos: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  })

  if (!event) notFound()

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Component content */}
    </div>
  )
}
```

### API Route with Validation
```typescript
// app/api/events/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const createEventSchema = z.object({
  name: z.string().min(1).max(100),
  date: z.string().datetime(),
  prompts: z.array(z.string()).min(1).max(50)
})

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const data = createEventSchema.parse(body)
    
    // Create event logic here
    
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## Testing Checklist
When implementing features, ensure:
- [ ] Works on mobile devices (iOS Safari, Chrome Android)
- [ ] Handles slow/offline connections gracefully  
- [ ] Accessible via keyboard navigation
- [ ] Includes proper loading states
- [ ] Shows meaningful error messages
- [ ] Validates all user inputs
- [ ] Follows TypeScript best practices
- [ ] Uses Server Components where possible
- [ ] Optimizes images and bundle size
- [ ] Implements proper SEO meta tags