import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import archiver from 'archiver'
import pLimit from 'p-limit'
import { Readable } from 'stream'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CONCURRENCY = 6
const FETCH_TIMEOUT_MS = 25000
const MAX_FILES = 2000

function formatDateForName(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const yyyy = date.getFullYear()
  const mm = pad(date.getMonth() + 1)
  const dd = pad(date.getDate())
  const hh = pad(date.getHours())
  const min = pad(date.getMinutes())
  return `${yyyy}${mm}${dd}-${hh}${min}`
}

function sanitizePart(input: string, maxLen = 40): string {
  const cleaned = input
    .normalize('NFKD')
    .replace(/[^\w\d\-\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-/g, '')
    .replace(/-$/g, '')
    .slice(0, maxLen)
  return cleaned || 'x'
}

function buildZipName(event: { slug: string | null; id: string }): string {
  const base = `gallery-${event.slug || event.id}`
  return `${base}.zip`
}

function buildEntryName(params: {
  createdAt: Date
  promptText?: string | null
  uploaderName?: string | null
  id: string
  ext?: string
}): string {
  const timestamp = formatDateForName(params.createdAt)
  const promptShort = sanitizePart(params.promptText || 'aufgabe', 32)
  const uploader = sanitizePart(params.uploaderName || 'anonym', 32)
  const idPart = sanitizePart(params.id, 24)
  const ext = params.ext || 'jpg'

  const raw = `${timestamp}__${promptShort}__${uploader}__${idPart}.${ext}`
  return raw.length > 140 ? raw.slice(0, 140) : raw
}

async function fetchWithTimeout(url: string, timeoutMs: number, externalSignal?: AbortSignal): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  if (externalSignal) {
    externalSignal.addEventListener('abort', () => controller.abort(), { once: true })
  }
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params
  const { searchParams } = new URL(request.url)
  const promptId = searchParams.get('promptId') || undefined

  // Load event (public by UUID)
  const event = await prisma.event.findUnique({
    where: { id: uuid },
    select: { id: true, slug: true, isActive: true }
  })

  if (!event) {
    return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404, headers: { 'content-type': 'application/json' } })
  }
  if (!event.isActive) {
    return new Response(JSON.stringify({ error: 'Event is not active' }), { status: 403, headers: { 'content-type': 'application/json' } })
  }

  // Query approved uploads, optionally filtered by promptId
  const where = {
    eventId: event.id,
    isApproved: true as const,
    ...(promptId ? { promptId } : {}),
  }

  const uploads = await prisma.upload.findMany({
    where,
    include: {
      prompt: { select: { id: true, text: true } }
    },
    orderBy: { createdAt: 'asc' },
    take: MAX_FILES + 1, // read one more to detect limit exceeded
  })

  if (uploads.length === 0) {
    return new Response(JSON.stringify({ error: 'No approved uploads' }), { status: 404, headers: { 'content-type': 'application/json' } })
  }

  const trimmed = uploads.slice(0, MAX_FILES)
  const overLimit = uploads.length > MAX_FILES

  // Prepare archive stream
  const archive = archiver('zip', { zlib: { level: 0 } })
  const webStream = Readable.toWeb(archive as unknown as Readable) as unknown as ReadableStream

  const filename = buildZipName(event)

  // Kick off work on next microtask; return response immediately to start download
  queueMicrotask(async () => {
    const limit = pLimit(CONCURRENCY)
    const failed: string[] = []

    archive.on('warning', (err) => {
      console.warn('archiver warning', err)
    })
    archive.on('error', (err) => {
      console.error('archiver error', err)
      try { archive.abort() } catch {}
    })
    try {
      request.signal.addEventListener('abort', () => {
        try { archive.abort() } catch {}
      }, { once: true })
    } catch {}

    try {
      // Schedule appends with concurrency control
      const tasks = trimmed.map((u) =>
        limit(async () => {
          try {
            const resp = await fetchWithTimeout(u.r2Url, FETCH_TIMEOUT_MS, request.signal)
            if (!resp.ok || !resp.body) {
              failed.push(u.id)
              return
            }
            // Convert web stream body to Node stream for archiver
            const nodeStream = Readable.fromWeb(resp.body as unknown as ReadableStream)

            // Wait until the source stream finishes to respect concurrency/backpressure
            await new Promise<void>((resolve, reject) => {
              nodeStream.once('error', (e) => { failed.push(u.id); reject(e) })
              nodeStream.once('end', () => resolve())
              const entryName = buildEntryName({
                createdAt: u.createdAt,
                promptText: u.prompt?.text ?? undefined,
                uploaderName: u.uploaderName ?? undefined,
                id: u.id,
                ext: (() => {
                  const fromName = (u.fileName || u.originalName || '').split('.').pop()?.toLowerCase()
                  if (fromName && fromName.length <= 5) return fromName
                  const mt = (u as any).mimeType as string | undefined
                  if (!mt) return 'jpg'
                  if (mt.includes('jpeg')) return 'jpg'
                  if (mt.includes('png')) return 'png'
                  if (mt.includes('webp')) return 'webp'
                  if (mt.includes('heic')) return 'heic'
                  if (mt.includes('heif')) return 'heif'
                  return 'jpg'
                })(),
              })
              try {
                archive.append(nodeStream, { name: entryName, store: true })
              } catch (e) {
                failed.push(u.id)
                reject(e as Error)
              }
            })
          } catch (e) {
            failed.push(u.id)
          }
        })
      )

      await Promise.allSettled(tasks)

      if (overLimit) {
        const msg = `WARNING: The number of files exceeds the current limit (${MAX_FILES}). The archive contains only the first ${MAX_FILES} files.\n`
        archive.append(msg, { name: 'WARNING-LIMIT.txt' })
      }

      if (failed.length > 0) {
        const content = `Some files could not be downloaded and were skipped.\nFailed IDs:\n${failed.join('\n')}\n`
        archive.append(content, { name: 'FAILED.txt' })
      }

      await archive.finalize()
    } catch (err) {
      console.error('ZIP building failed', err)
      try { archive.abort() } catch {}
    }
  })

  return new Response(webStream, {
    headers: {
      'content-type': 'application/zip',
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'no-store',
    },
  })
}


