import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

import { sendContactNotification } from './api/contact-shared.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const slackWebhookUrl = env.SLACK_FEEDBACK_WEBHOOK_URL

  return {
    plugins: [
      react(),
      {
        name: 'dev-contact-api',
        configureServer(server) {
          server.middlewares.use('/api/contact', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Method not allowed' }))
              return
            }

            let rawBody = ''
            req.on('data', (chunk) => {
              rawBody += chunk
            })

            req.on('end', async () => {
              try {
                const payload = rawBody ? JSON.parse(rawBody) : {}
                const result = await sendContactNotification({
                  email: payload.email,
                  name: payload.name,
                  message: payload.message,
                  language: payload.language,
                  webhookUrl: slackWebhookUrl,
                })

                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify(result))
              } catch (error) {
                const status = error?.message === 'Missing required fields.' ? 400 : 500
                res.statusCode = status
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  error: error?.message || 'Unexpected error while sending Slack notification.',
                }))
              }
            })
          })
        },
      },
    ],
  }
})
