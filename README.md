# Traumtag Momente – Wedding Photo Prompt Service

A beautiful, romantic web platform that transforms wedding photography into an interactive experience—encouraging guests to capture heartfelt moments and help couples collect unforgettable memories.

## 🌟 Features

- **Wedding-Specific Photo Prompts**: Generate romantic, meaningful photo challenges for wedding guests
- **QR Code Generation**: Beautiful, print-ready QR codes for table cards and wedding programs
- **Mobile-First Experience**: Seamless photo upload experience without app installation
- **Real-Time Gallery**: Elegant, unified gallery for couples to view all wedding memories
- **Guest Engagement**: Transform shy guests into active participants in the love story
- **Instant Sharing**: Share galleries and individual photos with friends and family

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (we recommend [Neon](https://neon.tech))
- Cloudflare R2 or S3-compatible storage
- Email service (Resend recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/event-foto-prompts.git
   cd event-foto-prompts/photo-prompt-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your database URL, storage credentials, and email service configuration.

4. **Initialize the database**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Tech Stack

- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with magic link support
- **File Storage**: Cloudflare R2 (S3-compatible)
- **Deployment**: Vercel
- **Email**: Resend for transactional emails
- **Testing**: Vitest for unit and integration tests

## 📱 Usage

### For Wedding Couples

1. **Create an Event**: Sign up and create your wedding photo challenge
2. **Customize Prompts**: Add romantic photo prompts for your guests
3. **Generate QR Codes**: Download beautiful QR codes for your wedding materials
4. **Share & Enjoy**: Watch as guests upload photos throughout your special day

### For Wedding Guests

1. **Scan QR Code**: Use any camera app to scan the QR code at the wedding
2. **View Prompt**: See the romantic photo challenge
3. **Upload Photo**: Take and upload your photo with an optional caption
4. **Add Your Name**: Let the couple know who captured the moment

## 🧪 Testing

Run the test suite:
```bash
npm run test
```

Watch mode for development:
```bash
npm run test:watch
```

## 🚀 Deployment

The application is designed to be deployed on Vercel with zero configuration:

1. **Connect your repository** to Vercel
2. **Set environment variables** in your Vercel dashboard
3. **Deploy**: Vercel will automatically build and deploy your application

## 📁 Project Structure

```
photo-prompt-app/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # Reusable UI components
│   ├── lib/                 # Utility functions and configurations
│   └── hooks/               # Custom React hooks
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Database migrations
└── public/                  # Static assets
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Prisma](https://prisma.io/) for the excellent database toolkit
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library

---

# Project Overview: Traumtag Momente – Hochzeits‑Foto‑Aufgaben Service

## 1. Vision  
Build a beautiful, romantic web platform specifically for weddings that transforms wedding photography into an interactive experience—encouraging guests to capture heartfelt moments, connect with each other, and help couples collect unforgettable memories effortlessly.

## 2. Problem Statement  
• Wedding guests often stick to familiar faces or take generic photos, missing opportunities to capture unique perspectives.  
• Couples struggle to collect all the special moments from their wedding day and end up with scattered photo collections from different guests.  
• Traditional wedding photography focuses on formal shots, missing candid interactions and guest perspectives.

## 3. Proposed Solution  
• Generate elegant, shareable URLs (printed as QR codes) for wedding photo challenges.  
• Present guests with romantic, wedding-specific photo prompts (e.g. "Capture the couple's first dance" or "Photo with someone you just met").  
• Allow instant mobile uploads with personal captions and guest names.  
• Provide couples with a beautiful, unified gallery to cherish and share all their wedding memories.

## 4. Unique Value  
• **Romance-focused**: Every interaction is designed for the wedding experience with elegant, loving language.  
• **Guest engagement**: Transforms shy guests into active participants in the couple's love story.  
• **Seamless experience**: Mobile-first flow with no app installation—perfect for all wedding guests.  
• **Curated memories**: Pre-designed wedding-specific prompts capture moments professional photographers might miss.  
• **Unified love album**: One beautiful gallery containing every guest's perspective of the special day.

## 5. Key Features (High Level)  
- **Wedding setup**: Create romantic photo challenges with wedding-specific prompts.  
- **Elegant QR codes**: Print-ready codes for table cards, wedding programs, or signage.  
- **Romantic prompts**: Guests scan → see heartfelt photo challenges → upload with love.  
- **Beautiful gallery**: Couples view all wedding photos in an elegant, shareable album.  
- **Personal touches**: Guest names, captions, and romantic messaging throughout.

## 6. User Roles & Flows  
1. **Couple (Wedding Hosts)**  
   - Create wedding photo challenge  
   - Customize romantic prompt list  
   - Distribute QR codes to guests  
   - Enjoy beautiful gallery of all wedding memories  
2. **Wedding Guest**  
   - Scan QR code at reception  
   - Read romantic photo prompt  
   - Capture moment, upload with optional caption and name  
   - Become part of the couple's love story  

## 7. Success Metrics  
- Number of weddings using the service  
- Guest participation rate (% of guests who upload photos)  
- Average photos per wedding  
- Couple satisfaction and referral rate  
- Repeat usage for anniversaries/related celebrations

## 8. High-Level Phases  
1. **MVP** – core wedding flows: photo challenge creation, QR codes, romantic prompts, uploads, elegant gallery  
2. **Wedding Enhancements** – anniversary reminders, guest book integration, professional photographer collaboration  
3. **Love & Growth** – wedding vendor partnerships, anniversary celebrations, family event expansion  


# 📋 Project TODOs: Traumtag Momente Service

## 1. Determine Tech Stack
Goal: Get to a good MVP fast, with a tech stack that is easy to maintain and scale. Choose cheap and well tested options. Choose tools that are well understood by AI so that AI can help us with the development.
- [x] Frontend framework  
- [x] CSS / component library  
- [x] Backend framework  
- [x] Database  
- [x] Object storage  
- [x] Hosting / CDN  
- [x] Authentication  
- [x] QR-code generation  
- [x] CI/CD & DevOps  
- [x] Documentation of final decisions
Note see "Tech stack spec.md" for more details

## 2. Build & Ship MVP (Goal: ship in 2–4 weeks)
### 2.1 Project Setup
- [x] Initialize Git repos (frontend & backend)  
- [x] Configure CI/CD pipelines  (done later, or maybe not needed when using Vercel)
- [x] Provision database & object storage (done locally for now) 

### 2.2 Backend API
- [x] `POST /events` → create event (slug, type, settings)
- [x] `POST /events/:slug/prompts` → create new prompt
- [x] `PUT /events/:slug/prompts/:promptId` → update prompt
- [x] `DELETE /events/:slug/prompts/:promptId` → delete prompt
- [x] `GET /events/:slug/prompts` → fetch next prompt  
- [x] `POST /events/:slug/uploads` → handle image + metadata  
- [x] Serve generated QR as SVG/PNG  

### 2.3 Frontend
- [x] Organizer Dashboard (list/create events)  
- [x] Event-creation wizard (slug, type, prompts)  
- [x] Guest upload page (prompt display + upload form)  
- [x] Public gallery page (grid of uploads)

### 2.4 Deployment & Testing
- [x] Deploy MVP to staging & production  
- [x] Mobile-first QA & cross-browser testing  
- [x] Soft launch with pilot users  
- [x] Collect initial feedback & bug reports  

### 2.5 Testing Feedback
- URL-Slug is a technical term, we should use a more user friendly term for it, and also make it mor clear what it is (also maybe shwo the whole url)
- clicking on "Create Event" should show a loading indicator
- clicking on "create event" should, if successful redirect to the event dashboard, on mobile (on desktop, at least just now, it worked). I think it does but in the actually deployed version Im redirected to the auth/signin page, even though I should be logged in
- magic link email is not sent in deployed state (maybe we need more logs to debug this)
   - I created an api key, put it into the env vars on vercel
- newly created events are not visible in the dashboard (I see in the db that these events were created and are correctly associated with the email)

## 3. Post-MVP Features & Polishing
- [ ] Moderation & approval queue  
- [ ] Analytics dashboard (scans, uploads, per-prompt stats)  
- [ ] Bulk export (ZIP of images, PDF of QR cards)  
- [ ] Social-share integrations (pre-formatted cards)  
- [ ] Gamification: badges, leaderboards, point system  
- [ ] Custom branding & white-label domains  
- [ ] Multilingual UI support  
- [ ] Public API & third-party webhooks  
- [ ] UI/UX refinements & accessibility audit  
- [ ] Performance optimizations & caching  
- [ ] Comprehensive user onboarding & docs  

---

**Next Steps:**  
1. Assign owners & rough timelines to each sub-task.  
2. Kick off Tech-Stack evaluation sprint.  
3. Schedule weekly syncs to track MVP progress.