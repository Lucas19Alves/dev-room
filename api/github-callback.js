export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' })
  const { code, verifier, redirectUri } = req.body || {}
  const expectedRedirect = process.env.GITHUB_REDIRECT_URI?.trim() || 'https://dev-room-three.vercel.app/'
  const clientId = process.env.GITHUB_CLIENT_ID?.trim()
  const clientSecret = process.env.GITHUB_CLIENT_SECRET?.trim()
  if (typeof code !== 'string' || !code || code.length > 256 || typeof verifier !== 'string' || !/^[A-Za-z0-9._~-]{43,128}$/.test(verifier) || redirectUri !== expectedRedirect) {
    return res.status(400).json({ error: 'Solicitação inválida. Inicie o login novamente.' })
  }
  if (!clientId || !clientSecret) return res.status(503).json({ error: 'Login com GitHub indisponível. Tente novamente mais tarde.' })
  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, code_verifier: verifier, redirect_uri: expectedRedirect })
    })
    const data = await response.json()
    if (!response.ok || !data.access_token) {
      const errors = {
        incorrect_client_credentials: 'O GitHub recusou as credenciais do aplicativo. Confira GITHUB_CLIENT_ID e GITHUB_CLIENT_SECRET na Vercel e publique novamente.',
        bad_verification_code: 'O código de login expirou, já foi utilizado ou não corresponde a esta tentativa. Entre novamente com GitHub.',
        redirect_uri_mismatch: 'O endereço de retorno não corresponde ao callback configurado no aplicativo GitHub.',
        application_suspended: 'O aplicativo OAuth está suspenso no GitHub.',
        unverified_user_email: 'Verifique seu endereço de email no GitHub antes de entrar.'
      }
      const errorCode = Object.hasOwn(errors, data.error) ? data.error : 'oauth_exchange_failed'
      return res.status(401).json({ error: errors[errorCode] || 'Não foi possível concluir o login. Inicie uma nova tentativa.', errorCode })
    }
    return res.status(200).json({ access_token: data.access_token })
  } catch { return res.status(502).json({ error: 'Não foi possível conectar ao GitHub. Tente novamente.' }) }
}
