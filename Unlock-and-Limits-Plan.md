## Unlock and Limits Plan (tailored to current project)

### Goals
- **Enforce limits**: max 3 events per email; max 100 images per event.
- **Unlock capability**: certain emails can bypass both limits via an admin-distributed, unguessable code.
- **Security and ops**: codes are secure, auditable, rate-limited, and revocable.

## Current stack reference
- **Framework**: Next.js App Router APIs.
- **Auth**: next-auth email magic link with DB sessions (`src/lib/auth.ts`).
- **DB**: Prisma + Postgres (`prisma/schema.prisma`).
- **Endpoints in scope**:
  - Create event: `src/app/api/events/route.ts`
  - Direct upload: `src/app/api/events/[slug]/uploads/route.ts`
  - Presigned flow: `src/app/api/events/[slug]/upload-url/route.ts` + `src/app/api/events/[slug]/upload-complete/route.ts`
  - Dashboard pages: `src/app/dashboard/*`

## Data model changes (Prisma)
- Update `User`:
  - `isUnlocked Boolean @default(false)`
  - `unlockedAt DateTime?`
  - `unlockedSource String?` // `code` | `manual`
  - `unlockedCodeId String?`
- New model `UnlockCode`:
  - `id String @id @default(cuid())`
  - `codeHash String` // argon2/bcrypt; never store raw codes
  - `maxUses Int @default(1)`
  - `uses Int @default(0)`
  - `expiresAt DateTime?`
  - `revokedAt DateTime?`
  - `note String?`
  - `createdAt DateTime @default(now())`
- Optional concurrency helper (recommended): add `uploadsCount` to `Event`:
  - `uploadsCount Int @default(0)`

Migration notes:
- Backfill: set `isUnlocked=false` for all existing users.
- No data loss.

## Enforcement changes (server-side only)
- **Event creation** `src/app/api/events/route.ts`:
  - After resolving/creating `user` by email:
    - If `user.isUnlocked` → allow.
    - Else count events: `await prisma.event.count({ where: { userId: user.id } })`.
      - If `>= 3` → return 403 with friendly message and CTA to unlock.
- **Image uploads** in BOTH routes:
  - `src/app/api/events/[slug]/uploads/route.ts`
  - `src/app/api/events/[slug]/upload-complete/route.ts`
  - Load `event` by `slug` including `userId`. Load `user.isUnlocked` by `event.userId`.
    - If unlocked → allow.
    - Else enforce 100 uploads per event:
      - Minimal: `count` uploads and block if `>= 100`.
      - Recommended (race-safe): atomic gate on `Event.uploadsCount`:
        - `updateMany({ where: { id: event.id, uploadsCount: { lt: 100 } }, data: { uploadsCount: { increment: 1 } } })`.
        - If `count === 0` → 409 Conflict (cap reached).
        - Then create `Upload`. If creation fails, decrement in `finally`.
  - Optional: also pre-check in `upload-url` to avoid issuing URLs when capped; final check remains at completion.

## Unlock flow (new endpoints)
- `POST /api/unlock/claim` → `src/app/api/unlock/claim/route.ts`
  - Auth required via `getServerSession`.
  - Body: `{ code: string }`.
  - Validate: find an `UnlockCode` by matching `codeHash` (constant-time compare), ensure not expired/revoked and `uses < maxUses`.
  - On success: set `user.isUnlocked=true`, `unlockedAt`, `unlockedSource='code'`, `unlockedCodeId`, increment `uses`.
  - Response: `{ isUnlocked: true }`.
- Admin endpoints (guarded by token header):
  - `POST /api/internal/admin/unlock-codes` → generate a code
    - Header `x-admin-token: ${process.env.ADMIN_API_TOKEN}` must match.
    - Generate `randomBytes(32)`; store only `codeHash`; return raw code once plus metadata.
    - Payload accepts `maxUses?`, `expiresAt?`, `note?`.
  - `GET /api/internal/admin/unlock-codes` → list for audit.
  - `POST /api/internal/admin/unlock-codes/[id]/revoke` → set `revokedAt`.
- Optional: admin manual unlock/lock endpoints for a user by email (`POST /api/internal/admin/users/[email]/unlock|lock`).

## Dashboard and UI updates
- `src/app/dashboard/page.tsx`:
  - Compute "Events used: X of 3" via `prisma.event.count` unless `user.isUnlocked` → show "Unlimited".
  - If at 3 and not unlocked: inline unlock form posting to `/api/unlock/claim`.
- `src/app/dashboard/create/page.tsx`:
  - On 403 from `/api/events`, show friendly limit message and inline unlock form; on success, retry creation.
- `src/app/dashboard/events/[slug]/page.tsx`:
  - Show "Uploads: Y of 100" unless unlocked → "Unlimited". You already load `_count.uploads`.

## Security and abuse protection
- Store only hashed codes (argon2id preferred; bcrypt acceptable with pepper via `process.env.UNLOCK_CODE_PEPPER`).
- Constant-time comparison when checking code.
- Rate-limit `/api/unlock/claim` by IP and user (e.g., 10/hour). Log success/failure.
- Guard admin endpoints with `ADMIN_API_TOKEN`.
- CSRF-protect forms as applicable.

## Configuration
- `MAX_EVENTS_PER_EMAIL=3`
- `MAX_IMAGES_PER_EVENT=100`
- `ADMIN_API_TOKEN=...`
- `UNLOCK_HASH_ALGO=argon2id` (or imply via code)
- `UNLOCK_CODE_PEPPER=...` (if using bcrypt)

## Testing
- Integration tests:
  - Create 3 events for an email → 4th blocked.
  - Unlock then create 4th → allowed.
  - Upload 100 images to an event → 101st blocked (on both upload routes).
  - Unlock owner → subsequent uploads allowed.
- Unit tests:
  - Unlock claim: invalid, expired, revoked, max-uses exceeded.
  - Upload concurrency if using `uploadsCount` gate.

## Rollout & migration
- Add Prisma schema changes and migrate.
- Deploy backend with server checks first.
- Add UI for unlock after backend deploy (graceful when endpoint exists).
- Soft start: optionally provide manual unlock via admin endpoint before code-based flow.

## Open decisions
- Revocation behavior: dynamic (recommended). If a user is re-locked, future actions are limited; existing events over 100 remain but new uploads blocked.
- Email changes/ownership transfer: keep limits tied to `User` record; if changing email, require admin action to re-unlock.

## Appendix
- Example code generation (Node):
```ts
import crypto from 'crypto'
const code = crypto.randomBytes(32).toString('base64url') // 43 chars
```
- Example argon2 hashing:
```ts
import argon2 from 'argon2'
const codeHash = await argon2.hash(code, { type: argon2.argon2id })
// verify: await argon2.verify(codeHash, input)
```
- Example bcrypt hashing with pepper:
```ts
import bcrypt from 'bcryptjs'
const peppered = code + process.env.UNLOCK_CODE_PEPPER
const codeHash = await bcrypt.hash(peppered, 12)
// verify: await bcrypt.compare(input + process.env.UNLOCK_CODE_PEPPER, codeHash)
```


