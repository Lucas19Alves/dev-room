import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import githubConfig from './api/github-config.js'
import githubCallback from './api/github-callback.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'GITHUB_')
  for (const key of ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'GITHUB_REDIRECT_URI']) {
    if (env[key]) process.env[key] = env[key]
  }
  return {
  plugins: [
    vue(),
    tailwindcss(),
    {
      name: 'dev-room-local-api',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const route = req.url?.split('?')[0]
          const handler = route === '/api/github-config' ? githubConfig : route === '/api/github-callback' ? githubCallback : null
          if (!handler) return next()
          const response = {
            setHeader: (key, value) => res.setHeader(key, value),
            status(code) { res.statusCode = code; return this },
            json(body) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)); return this }
          }
          try {
            let body = ''
            for await (const chunk of req) {
              body += chunk
              if (body.length > 4096) return response.status(413).json({ error: 'Solicitação muito grande.' })
            }
            req.body = body ? JSON.parse(body) : {}
            await handler(req, response)
          } catch { response.status(400).json({ error: 'Solicitação inválida.' }) }
        })
      }
    }
  ],
  }
})
