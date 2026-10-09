// Health check para ferramentas externas que sondam localhost (dev server/preview).
// Diagnóstico temporário: o servidor de dev cai logo após um GET /health — o log abaixo
// identifica quem faz a chamada. Sem dados, sem auth — não expõe nada além de "ok".
export function GET(request: Request) {
  const headers = Object.fromEntries(request.headers.entries())
  delete headers.cookie
  delete headers.authorization
  console.log('[health] chamada recebida:', JSON.stringify(headers))

  return Response.json({ status: 'ok' })
}
