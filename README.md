# Project Overview: Event Photo-Prompt Service

## 1. Vision  
Build a lightweight web platform that turns event photography into an interactive game—encouraging guests to mingle, capture candid moments, and help organizers collect memorable photos effortlessly.

## 2. Problem Statement  
• Guests at weddings, parties or conferences often stick to familiar faces or default to individual selfies.  
• Organizers struggle to spark spontaneous interactions and end up with scattered, unorganized photo collections.

## 3. Proposed Solution  
• Generate stable, human-readable URLs (printed as QR codes) for each event.  
• Present guests with fun, predefined photo “prompts” (e.g. “Take a picture with someone in your favorite color”).  
• Allow instant mobile uploads against each prompt.  
• Provide hosts a unified gallery to review, share and download all photos.

## 4. Unique Value  
• Ice-breaker mechanics: nudges guests to approach new people.  
• Seamless, mobile-first flow—no app install required.  
• Customizable prompts tailored to any occasion.  
• One central gallery: no more chasing down scattered image files.

## 5. Key Features (High Level)  
- Event setup: choose a short URL slug and select or edit a set of prompts.  
- QR-code generation: print-ready codes for table cards or wristbands.  
- Prompt delivery: guests scan → see one prompt at a time → upload photo + optional caption.  
- Photo management: hosts view collected images in a single, shareable gallery.  
- Privacy options: anonymous vs. named uploads; public vs. invite-only galleries.

## 6. User Roles & Flows  
1. Organizer  
   - Create event link  
   - Customize prompt list  
   - Distribute QR codes  
   - Review and share final photo gallery  
2. Guest  
   - Scan QR code  
   - Read prompt, snap/upload photo  
   - Optionally add name/caption and move to next prompt  

## 7. Success Metrics  
- Number of events created  
- Guest participation rate (% of scans resulting in uploads)  
- Average photos per guest  
- Host satisfaction and reuse rate  

## 8. High-Level Phases  
1. **MVP** – core flows: event creation, QR code, prompt display, photo upload, simple gallery  
2. **Enhancements** – moderation queue, analytics dashboard, bulk exports  
3. **Polish & Growth** – gamification (badges, leaderboards), branding options, multi-language support  


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
- [ ] Public gallery page (grid of uploads)

### 2.4 Deployment & Testing
- [ ] Deploy MVP to staging & production  
- [ ] Mobile-first QA & cross-browser testing  
- [ ] Soft launch with pilot users  
- [ ] Collect initial feedback & bug reports  

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