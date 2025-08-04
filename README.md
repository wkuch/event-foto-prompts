# Project Overview: Wedding Moments - Hochzeits-Foto-Aufgaben Service

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


# 📋 Project TODOs: Event Photo-Prompt Service

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