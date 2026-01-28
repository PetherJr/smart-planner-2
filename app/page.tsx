import Link from 'next/link'

export default function Home() {
  return (
    <main className="container">
      <div className="nav">
        <div className="brand">Vida em Ordem</div>
        <div className="row">
          <Link className="btn" href="/login">Entrar</Link>
          <Link className="btn primary" href="/login">Começar</Link>
        </div>
      </div>

      <h1 className="h1">Organize sua semana em 10 minutos.</h1>
      <p className="p">
        MVP: tarefas, hábitos e gastos — com login via Supabase e liberação automática via Hotmart Webhook.
      </p>

      <div className="grid">
        <div className="card span6">
          <div className="badge">✅ Tarefas</div>
          <p className="p">Liste tarefas da semana, marque como concluídas e mantenha o foco.</p>
        </div>
        <div className="card span6">
          <div className="badge">🔥 Hábitos</div>
          <p className="p">Crie hábitos e marque o dia. Simples e rápido.</p>
        </div>
        <div className="card span6">
          <div className="badge">💸 Gastos</div>
          <p className="p">Registre despesas e mantenha controle básico do mês.</p>
        </div>
        <div className="card span6">
          <div className="badge">🎯 Metas</div>
          <p className="p">Crie metas e acompanhe seu progresso.</p>
        </div>
      </div>

      <hr />
      <p className="small">
        Dica: para “acesso na hora”, use o Webhook da Hotmart para ativar o e-mail do comprador automaticamente.
      </p>
    </main>
  )
}
