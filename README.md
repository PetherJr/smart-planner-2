# Vida em Ordem — MVP (Next.js + Supabase + Hotmart Webhook)

Este MVP entrega:
- Login por **magic link** (Supabase Auth)
- Painel básico: **tarefas, hábitos, gastos e metas**
- Liberação automática via **Hotmart Webhook (Postback)**: ao receber `APPROVED/COMPLETE`, ativa o e-mail na tabela `licenses`.

## 1) Rodar local

```bash
npm i
cp .env.example .env.local
# preencha as variáveis
npm run dev
```

## 2) Criar projeto no Supabase

1. Crie um projeto
2. Vá em **SQL Editor** e rode `supabase/schema.sql`
3. Vá em **Project Settings → API** e copie:
   - `Project URL` -> NEXT_PUBLIC_SUPABASE_URL
   - `anon public key` -> NEXT_PUBLIC_SUPABASE_ANON_KEY
   - `service_role key` -> SUPABASE_SERVICE_ROLE_KEY

### Configurar Auth (Magic Link)
- Auth → Providers → Email
- Habilite **Email** e **Magic link**
- Em **URL Configuration**:
  - Site URL: `http://localhost:3000` (dev) e depois sua URL da Vercel (prod)

## 3) Subir no Vercel

1. Suba este projeto no GitHub
2. Na Vercel: **Add New → Project → Import**
3. Em **Environment Variables**, adicione as variáveis do `.env.example`
4. Deploy

## 4) Hotmart Webhook → liberar acesso automático

- URL do webhook: `https://SEU-DOMINIO.vercel.app/api/hotmart/webhook`
- Configure o token `HOTMART_HOTTOK` igual ao token (hottok) que a Hotmart usar para assinar as notificações.
- Selecione eventos (mínimo): **compra aprovada** e/ou **compra completa**.

> Importante: ajuste o parser do payload em `app/api/hotmart/webhook/route.ts` conforme o JSON real que você verá no Histórico de envios da Hotmart.

## 5) Fluxo do usuário (acesso na hora)

1. Hotmart aprova a compra → envia webhook → seu sistema ativa `licenses.email=status=active`.
2. Usuário entra em `/login` e informa o e-mail da compra.
3. O sistema valida `licenses` e envia magic link.
4. Usuário acessa o painel.

