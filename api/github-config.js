export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido.' })
  const clientId = process.env.GITHUB_CLIENT_ID?.trim()
  const redirectUri = process.env.GITHUB_REDIRECT_URI?.trim() || 'https://dev-room-three.vercel.app/'
  if (!clientId || !process.env.GITHUB_CLIENT_SECRET?.trim()) {
    return res.status(503).json({ error: 'O login com GitHub ainda não foi configurado. Você pode continuar usando o Dev Room neste navegador.' })
  }
  return res.status(200).json({ clientId, redirectUri })
}
