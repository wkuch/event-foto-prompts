import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import EmailProvider from 'next-auth/providers/email'
import { Resend } from 'resend'
import { prisma } from './db'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: 'database',
  },
  pages: {
    signIn: '/auth/signin',
  },
  providers: [
    EmailProvider({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@localhost',
      sendVerificationRequest: async ({ identifier: email, url, provider }) => {
        // Development mode - log to console (only if no Resend API key)
        if (!resend) {
          console.log('\n🔗 Magic Link Authentication')
          console.log('================================')
          console.log(`Email: ${email}`)
          console.log(`Magic Link: ${url}`)
          console.log('================================\n')
          console.log('📧 In production, this would be sent via email')
          console.log('For local development, copy the magic link above to your browser\n')
          return
        }

        // Production mode - send via Resend
        try {
          console.log(`📧 Attempting to send magic link email to: ${email}`)
          console.log(`🔗 Magic link URL: ${url}`)
          console.log(`🔑 Resend API key configured: ${!!process.env.RESEND_API_KEY}`)
          console.log(`📮 From email: ${provider.from}`)
          
          const emailResult = await resend.emails.send({
            from: provider.from,
            to: email,
            subject: 'Anmelden bei Event Photo Prompts',
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #2563eb; margin-bottom: 24px;">Anmelden bei Event Photo Prompts</h1>
                <p style="color: #374151; margin-bottom: 24px; font-size: 16px;">
                  Klicken Sie auf den Link unten, um sich anzumelden und Ihre Events zu verwalten:
                </p>
                <a href="${url}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                  Jetzt anmelden
                </a>
                <p style="color: #6b7280; margin-top: 24px; font-size: 14px;">
                  Dieser Link läuft in 24 Stunden ab. Falls Sie diese E-Mail nicht angefordert haben, können Sie sie ignorieren.
                </p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
                <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                  Event Photo Prompts - Events unvergesslicher machen, ein Foto nach dem anderen
                </p>
              </div>
            `,
          })
          
          console.log(`✅ Email sent successfully! Email ID: ${emailResult.data?.id}`)
          
        } catch (error) {
          console.error('❌ Failed to send email - Full error details:', {
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined,
            email,
            fromEmail: provider.from,
            hasApiKey: !!process.env.RESEND_API_KEY,
            apiKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 10) + '...',
          })
          
          // More specific error messages
          if (error instanceof Error) {
            if (error.message.includes('API key')) {
              console.error('🔑 API key issue - check RESEND_API_KEY environment variable')
            } else if (error.message.includes('domain')) {
              console.error('🌐 Domain issue - check if sender domain is verified in Resend')
            } else if (error.message.includes('rate limit')) {
              console.error('⏰ Rate limit exceeded - too many emails sent')
            }
          }
          
          throw new Error(`Failed to send verification email: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      },
    }),
  ],
  callbacks: {
    session: async ({ session, user }) => {
      if (session?.user) {
        session.user.id = user.id
      }
      return session
    },
  },
}