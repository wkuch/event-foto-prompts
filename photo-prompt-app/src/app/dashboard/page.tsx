import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Plus } from 'lucide-react'

async function getEvents(userId: string) {
  return await prisma.event.findMany({
    where: { userId },
    include: {
      _count: {
        select: {
          prompts: true,
          uploads: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const events = await getEvents(session.user.id)

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/70 border-b border-stone-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-5">
            <div>
              <h1 className="font-serif text-3xl font-bold tracking-tight text-stone-900">Euer Dashboard</h1>
              <p className="mt-1 text-sm text-stone-700">Verwaltet eure Foto‑Aufgaben und Galerie</p>
            </div>
            <Link
              href="/dashboard/create"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-stone-900 text-white hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-300"
            >
              <Plus className="w-4 h-4" />
              Foto‑Aufgaben erstellen
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {events.length === 0 ? (
          <div className="max-w-2xl mx-auto text-center">
            <div className="glass-card">
              <div className="w-16 h-16 mx-auto mb-4 bg-rose-100 rounded-full flex items-center justify-center">
                <Plus className="w-7 h-7 text-rose-600" />
              </div>
              <h3 className="text-xl font-semibold text-stone-900">Noch keine Foto‑Aufgaben</h3>
              <p className="text-stone-700 mt-2">Startet eure erste Sammlung und macht eure Hochzeit interaktiv.</p>
              <div className="mt-6">
                <Link
                  href="/dashboard/create"
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 bg-stone-900 text-white hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-300"
                >
                  <Plus className="w-4 h-4" />
                  Hochzeits‑Event erstellen
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div key={event.id} className="glass-card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-stone-900 truncate">{event.name}</h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      event.isActive
                        ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                        : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {event.isActive ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </div>

                {event.description && (
                  <p className="text-sm text-stone-700 mb-4 line-clamp-2">{event.description}</p>
                )}

                <div className="flex items-center justify-between text-sm text-stone-600 mb-3">
                  <span>Link: /event/{event.slug}</span>
                  <span className="capitalize">{event.type}</span>
                </div>

                <div className="flex items-center justify-between text-sm text-stone-600 mb-5">
                  <span>{event._count.prompts} Aufgaben</span>
                  <span>{event._count.uploads} Fotos</span>
                </div>

                <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                  <Link
                    href={`/dashboard/events/${event.slug}`}
                    className="text-center px-3 py-2 rounded-xl ring-1 ring-stone-200 bg-white/80 text-stone-800 hover:bg-white focus:outline-none focus:ring-2 focus:ring-rose-300"
                  >
                    Verwalten
                  </Link>
                  <Link
                    href={`/event/${event.slug}`}
                    className="text-center px-3 py-2 rounded-xl bg-stone-900 text-white hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-300"
                  >
                    Aufgaben-Seite
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}