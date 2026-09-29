export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' })
  const { code, verifier, redirectUri } = req.body || {}
  const expectedRedirect = process.env.GITHUB_REDIRECT_URI || 'https://dev-room-three.vercel.app/'
  if (typeof code !== 'string' || !code || code.length > 256 || typeof verifier !== 'string' || !/^[A-Za-z0-9._~-]{43,128}$/.test(verifier) || redirectUri !== expectedRedirect) {
    return res.status(400).json({ error: 'Solicitação inválida. Inicie o login novamente.' })
  }
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) return res.status(503).json({ error: 'Login com GitHub indisponível. Tente novamente mais tarde.' })
  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({ client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, code, code_verifier: verifier, redirect_uri: expectedRedirect })
    })
    const data = await response.json()
    if (!response.ok || !data.access_token) return res.status(401).json({ error: 'Não foi possível concluir o login. Inicie uma nova tentativa.' })
    return res.status(200).json({ access_token: data.access_token })
  } catch { return res.status(502).json({ error: 'Não foi possível conectar ao GitHub. Tente novamente.' }) }
}
