import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Vida em Ordem (MVP)',
  description: 'Painel web simples para organizar semana, hábitos e gastos.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
