import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

/**
 * Hotmart Webhook (Postback)
 * - Verifica hottok (token) para reduzir fraudes.
 * - Ativa/desativa o acesso do comprador baseado no status.
 *
 * IMPORTANT: adapte o parser do payload conforme o modelo que você receber no "Histórico" do Webhook da Hotmart.
 */
function getHotTok(req: Request, body: any): string | null {
  // Hotmart docs citam "hottok" como token único da conta
  // Pode chegar em header ou no body, dependendo da configuração.
  const header =
    req.headers.get('hottok') ||
    req.headers.get('x-hotmart-hottok') ||
    req.headers.get('X-HOTMART-HOTTOK')
  return (header || body?.hottok || body?.hottok_key || null)
}

function extractEmail(body: any): string | null {
  // Tentativas comuns de campos (confira no payload real e ajuste)
  return (
    body?.buyer?.email ||
    body?.data?.buyer?.email ||
    body?.purchase?.buyer?.email ||
    body?.email ||
    null
  )
}

function extractStatus(body: any): string | null {
  return (
    body?.status ||
    body?.data?.status ||
    body?.purchase?.status ||
    body?.transaction_status ||
    null
  )
}

function extractPurchaseId(body: any): string | null {
  return (
    body?.purchase_id ||
    body?.data?.purchase_id ||
    body?.transaction ||
    body?.data?.transaction ||
    body?.purchase?.transaction ||
    null
  )
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any))

  const expectedTok = process.env.HOTMART_HOTTOK
  if (!expectedTok) {
    return NextResponse.json({ ok: false, error: 'missing_hotmart_hottok_env' }, { status: 500 })
  }

  const hottok = getHotTok(req, body)
  if (!hottok || hottok !== expectedTok) {
    return NextResponse.json({ ok: false, error: 'invalid_hottok' }, { status: 401 })
  }

  const email = extractEmail(body)?.toLowerCase()
  const status = (extractStatus(body) || '').toUpperCase()
  const purchaseId = extractPurchaseId(body)

  if (!email) {
    return NextResponse.json({ ok: false, error: 'missing_email' }, { status: 400 })
  }

  const supabase = createAdminSupabaseClient()

  // Status comuns: APPROVED, COMPLETE, REFUNDED, CANCELED, CHARGEBACK...
  const activate = status === 'APPROVED' || status === 'COMPLETE'

  // 1) Upsert licença
  const { error: licenseErr } = await supabase
    .from('licenses')
    .upsert({
      email,
      status: activate ? 'active' : 'inactive',
      hotmart_purchase_id: purchaseId
    })

  if (licenseErr) {
    return NextResponse.json({ ok: false, error: licenseErr.message }, { status: 500 })
  }

  // 2) (Opcional) criar usuário no Supabase Auth para facilitar "acesso na hora"
  // Obs: createUser não envia e-mail (ver docs). Usuário entra via magic link na tela de login.
  if (activate) {
    const randomPass = crypto.randomUUID()
    const { error: createUserErr } = await supabase.auth.admin.createUser({
      email,
      password: randomPass,
      email_confirm: true
    })
    // Se já existir, tudo bem. Evita quebrar o webhook.
    if (createUserErr && !String(createUserErr.message).toLowerCase().includes('already')) {
      // não falha o webhook por causa disso
      console.warn('createUser error:', createUserErr.message)
    }
  }

  return NextResponse.json({ ok: true })
}
