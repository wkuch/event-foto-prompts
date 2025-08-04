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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Eure Hochzeits-Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Verwaltet eure Hochzeits-Fotomomente
              </p>
            </div>
            <Link
              href="/dashboard/create"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
            >
              <Plus className="w-4 h-4 mr-2" />
Foto-Aufgaben erstellen
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-rose-100 rounded-full flex items-center justify-center">
              <Plus className="w-12 h-12 text-rose-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Noch keine Foto-Aufgaben erstellt
            </h3>
            <p className="text-gray-600 mb-6">
              Erstellt eure ersten Hochzeits-Foto-Aufgaben und sammelt unvergessliche Momente mit euren Gästen
            </p>
            <Link
              href="/dashboard/create"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700"
            >
              <Plus className="w-4 h-4 mr-2" />
Hochzeits-Foto-Aufgaben erstellen
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {event.name}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        event.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {event.isActive ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </div>
                  </div>
                  
                  {event.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {event.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>Slug: {event.slug}</span>
                    <span className="capitalize">{event.type}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                    <span>{event._count.prompts} Aufgaben</span>
                    <span>{event._count.uploads} Fotos</span>
                  </div>

                  <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 sm:gap-3">
                    <Link
                      href={`/dashboard/events/${event.slug}`}
                      className="text-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                    >
                      Verwalten
                    </Link>
                    <Link
                      href={`/event/${event.slug}`}
                      className="text-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                    >
                      Hochzeit anzeigen
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}