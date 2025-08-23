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

// Ensure a friendly display name is used while preserving the email address
const rawFromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@localhost'
const fromAddress = rawFromEmail.includes('<') ? rawFromEmail : `Traumtag Momente <${rawFromEmail}>`

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
      from: fromAddress,
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
            subject: 'Dein Login-Link für Traumtag Momente',
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fafaf9; padding: 24px;">
                <div style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">
                  Mit einem Klick einloggen und euer Hochzeits‑Event verwalten.
                </div>
                <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e7e5e4; border-radius: 16px; padding: 28px;">
                  <div style="text-align: center; margin-bottom: 20px;">
                    <div style="display: inline-flex; align-items: center; gap: 8px; color: #e11d48; font-weight: 700; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase;">
                      <span>Traumtag Momente</span>
                    </div>
                  </div>

                  <h1 style="margin: 0 0 12px 0; color: #1c1917; font-size: 22px; line-height: 1.3;">
                    Willkommen zurück
                  </h1>
                  <p style="margin: 0 0 20px 0; color: #44403c; font-size: 16px; line-height: 1.6;">
                    Mit diesem sicheren Link kannst du dich bei <strong>Traumtag Momente</strong> anmelden und euer Hochzeits‑Event verwalten.
                  </p>

                  <div style="text-align: center; margin: 28px 0;">
                    <a href="${url}" style="display: inline-block; background-color: #1f2937; color: #ffffff; padding: 12px 22px; text-decoration: none; border-radius: 9999px; font-weight: 600;">
                      Jetzt einloggen
                    </a>
                  </div>

                  <p style="margin: 0 0 8px 0; color: #57534e; font-size: 14px; line-height: 1.6;">
                    Falls der Button nicht funktioniert, klicke oder kopiere diesen Link:
                  </p>
                  <p style="margin: 0 0 20px 0; color: #1c1917; font-size: 14px; line-height: 1.4; word-break: break-all;">
                    <a href="${url}" style="color: #e11d48; text-decoration: underline;">${url}</a>
                  </p>

                  <p style="margin: 0; color: #78716c; font-size: 12px; line-height: 1.6;">
                    Der Link läuft in 24 Stunden ab. Wenn du diese E‑Mail nicht angefordert hast, kannst du sie ignorieren.
                  </p>

                  <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 24px 0;" />
                  <p style="margin: 0; color: #a8a29e; font-size: 12px; line-height: 1.6; text-align: center;">
                    Hochzeiten unvergesslicher machen – ein Herzensmoment nach dem anderen
                  </p>
                </div>
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