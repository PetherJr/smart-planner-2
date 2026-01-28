'use client'

import { useEffect, useMemo, useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import Link from 'next/link'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function LoginPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle'|'checking'|'ready'|'blocked'|'sent'|'error'>('idle')
  const [message, setMessage] = useState<string>('')

  async function checkLicense(targetEmail: string) {
    setStatus('checking')
    setMessage('')
    const res = await fetch(`/api/license/check?email=${encodeURIComponent(targetEmail)}`)
    if (!res.ok) {
      setStatus('error')
      setMessage('Não consegui validar seu acesso agora. Tente novamente.')
      return false
    }
    const data = await res.json()
    if (data.active) {
      setStatus('ready')
      return true
    }
    setStatus('blocked')
    setMessage('Seu e-mail ainda não tem acesso ativo. Use o e-mail da compra na Hotmart.')
    return false
  }

  async function sendMagicLink() {
    const targetEmail = email.trim().toLowerCase()
    if (!isValidEmail(targetEmail)) {
      setStatus('error')
      setMessage('Digite um e-mail válido.')
      return
    }
    const ok = await checkLicense(targetEmail)
    if (!ok) return

    const { error } = await supabase.auth.signInWithOtp({
      email: targetEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    })

    if (error) {
      setStatus('error')
      setMessage(error.message)
      return
    }
    setStatus('sent')
    setMessage('Link de acesso enviado! Verifique seu e-mail.')
  }

  useEffect(() => {
    setStatus('idle')
    setMessage('')
  }, [email])

  return (
    <main className="container">
      <div className="nav">
        <Link className="brand" href="/">Vida em Ordem</Link>
        <Link className="btn" href="/">Voltar</Link>
      </div>

      <div className="card" style={{maxWidth: 560, margin: '0 auto'}}>
        <h1 className="h1" style={{fontSize: 26}}>Entrar</h1>
        <p className="p">Digite o e-mail usado na compra. Você recebe um link para entrar na hora.</p>

        <label className="small">E-mail</label>
        <input
          className="input"
          placeholder="seuemail@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div style={{height: 12}} />

        <button className="btn primary" onClick={sendMagicLink} disabled={status === 'checking'}>
          {status === 'checking' ? 'Validando…' : 'Enviar link de acesso'}
        </button>

        {message ? <p className="p" style={{marginTop: 12}}>{message}</p> : null}

        <hr />
        <p className="small">
          Comprou e não recebeu? Aguarde alguns minutos. O Webhook da Hotmart ativa seu e-mail automaticamente.
        </p>
      </div>
    </main>
  )
}
