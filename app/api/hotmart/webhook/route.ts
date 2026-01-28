import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

/**
 * Hotmart Webhook (Postback)
 * - Valida o Hottok (token) corretamente via Authorization: Bearer <HOTMART_HOTTOK>
 * - Ativa/desativa o acesso do comprador baseado no status/evento.
 *
 * IMPORTANT: ajuste os extractors conforme o payload real do "Histórico" da Hotmart.
 */

function getHotTok(req: Request, body: any): string | null {
  // ✅ Hotmart: use Authorization: Bearer <token>
  const auth = req.headers.get('authorization')
  if (auth && auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim()
  }

  // 🔁 Fallbacks (alguns exemplos antigos / testes manuais)
  const header =
    req.headers.get('hottok') ||
    req.headers.get('x-hotmart-hottok') ||
    req.headers.get('x-hottok') ||
    req.headers.get('X-HOTMART-HOTTOK')
  return header || body?.hottok || body?.hottok_key || null
}

function extractEmail(body: any): string | null {
  return (
    body?.buyer?.email ||
    body?.data?.buyer?.email ||
    body?.purchase?.buyer?.email ||
    body?.data?.purchase?.buyer?.email ||
    body?.email ||
    null
  )
}

function extractStatus(body: any): string | null {
  return (
    body?.status ||
    body?.data?.status ||
    body?.purchase?.status ||
    body?.data?.purchase?.status ||
    body?.transaction_status ||
    body?.data?.transaction_status ||
    null
  )
}

function extractEvent(body: any): string | null {
  return body?.event || body?.data?.event || null
}

function extractPurchaseId(body: any): string | null {
  return (
    body?.purchase_id ||
    body?.data?.purchase_id ||
    body?.transaction ||
    body?.data?.transaction ||
    body?.purchase?.transaction ||
    body?.data?.purchase?.transaction ||
    null
  )
}

function isActivate(status: string, event: string) {
  // Eventos/status mais comuns (varia por produto/conta)
  // ✅ ativação
  const okStatus = new Set(['APPROVED', 'COMPLETE', 'COMPLETED', 'PAID'])
  const okEvent = new Set(['PURCHASE_APPROVED', 'PURCHASE_COMPLETE'])

  // ❌ desativação
  const badStatus = new Set(['REFUNDED', 'CANCELED', 'CANCELLED', 'CHARGEBACK', 'DISPUTE', 'EXPIRED'])
  const badEvent = new Set([
    'PURCHASE_REFUNDED',
    'PURCHASE_CANCELED',
    'PURCHASE_CANCELLED',
    'PURCHASE_CHARGEBACK',
    'PURCHASE_DISPUTE'
  ])

  if (badEvent.has(event)) return false
  if (okEvent.has(event)) return true
  if (badStatus.has(status)) return false
  if (okStatus.has(status)) return true

  // padrão seguro: não ativa
  return false
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any))

  const expectedTok = process.env.HOTMART_HOTTOK
  if (!expectedTok) {
    return NextResponse.json(
      { ok: false, error: 'missing_hotmart_hottok_env' },
      { status: 500 }
    )
  }

  const hottok = getHotTok(req, body)
  if (!hottok || hottok !== expectedTok) {
    return NextResponse.json({ ok: false, error: 'invalid_hottok' }, { status: 401 })
  }

  const email = extractEmail(body)?.toLowerCase()
  const status = String(extractStatus(body) || '').toUpperCase()
  const event = String(extractEvent(body) || '').toUpperCase()
  const purchaseId = extractPurchaseId(body)

  if (!email) {
    return NextResponse.json({ ok: false, error: 'missing_email' }, { status: 400 })
  }

  const supabase = createAdminSupabaseClient()
  const activate = isActivate(status, event)

  // 1) Upsert licença
  const { error: licenseErr } = await supabase.from('licenses').upsert({
    email,
    status: activate ? 'active' : 'inactive',
    hotmart_purchase_id: purchaseId,
    // opcional: guardar últimos campos para debug
    //hotmart_event: event || null,
    hotmart_status: status || null
  })

  if (licenseErr) {
    return NextResponse.json({ ok: false, error: licenseErr.message }, { status: 500 })
  }

  // 2) (Opcional) criar usuário no Supabase Auth (não falhar o webhook se já existir)
  if (activate) {
    const randomPass = crypto.randomUUID()
    const { error: createUserErr } = await supabase.auth.admin.createUser({
      email,
      password: randomPass,
      email_confirm: true
    })

    if (createUserErr && !String(createUserErr.message).toLowerCase().includes('already')) {
      console.warn('createUser error:', createUserErr.message)
    }
  }

  return NextResponse.json({ ok: true })
}
