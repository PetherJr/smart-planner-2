'use client'

import { useEffect, useMemo, useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import type { Task, Habit, Expense, Goal } from '@/lib/types'
import Link from 'next/link'

export default function DashboardPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])
  const [userEmail, setUserEmail] = useState<string>('')
  const [loading, setLoading] = useState(true)

  const [tasks, setTasks] = useState<Task[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [goals, setGoals] = useState<Goal[]>([])

  const [taskTitle, setTaskTitle] = useState('')
  const [habitTitle, setHabitTitle] = useState('')
  const [expenseDesc, setExpenseDesc] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [goalTitle, setGoalTitle] = useState('')

  async function loadAll() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    setUserEmail(user?.email ?? '')

    const [t, h, e, g] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('habits').select('*').order('created_at', { ascending: false }),
      supabase.from('expenses').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('goals').select('*').order('created_at', { ascending: false }).limit(10),
    ])

    if (t.data) setTasks(t.data as any)
    if (h.data) setHabits(h.data as any)
    if (e.data) setExpenses(e.data as any)
    if (g.data) setGoals(g.data as any)

    setLoading(false)
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  async function addTask() {
    const title = taskTitle.trim()
    if (!title) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('tasks').insert({ title, user_id: user.id })
    setTaskTitle('')
    await loadAll()
  }

  async function toggleTask(task: Task) {
    await supabase.from('tasks').update({ done: !task.done }).eq('id', task.id)
    await loadAll()
  }

  async function addHabit() {
    const title = habitTitle.trim()
    if (!title) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('habits').insert({ title, user_id: user.id })
    setHabitTitle('')
    await loadAll()
  }

  async function addExpense() {
    const amount = Number(expenseAmount.replace(',', '.'))
    if (!isFinite(amount) || amount <= 0) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('expenses').insert({
      user_id: user.id,
      description: expenseDesc.trim() || null,
      amount,
      spent_on: new Date().toISOString().slice(0,10),
    })
    setExpenseDesc('')
    setExpenseAmount('')
    await loadAll()
  }

  async function addGoal() {
    const title = goalTitle.trim()
    if (!title) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('goals').insert({ title, user_id: user.id, progress: 0 })
    setGoalTitle('')
    await loadAll()
  }

  async function bumpGoal(goal: Goal, delta: number) {
    const next = Math.max(0, Math.min(100, (goal.progress ?? 0) + delta))
    await supabase.from('goals').update({ progress: next }).eq('id', goal.id)
    await loadAll()
  }

  return (
    <main className="container">
      <div className="nav">
        <Link className="brand" href="/">Vida em Ordem</Link>
        <div className="row">
          <span className="badge">{userEmail || '…'}</span>
          <button className="btn" onClick={signOut}>Sair</button>
        </div>
      </div>

      <h1 className="h1">Seu painel</h1>
      <p className="p">MVP focado em clareza: tarefas, hábitos, gastos e metas.</p>

      {loading ? <p className="p">Carregando…</p> : null}

      <div className="grid">
        <div className="card span6">
          <div className="row" style={{justifyContent:'space-between'}}>
            <div className="badge">✅ Tarefas</div>
            <button className="btn" onClick={loadAll}>Atualizar</button>
          </div>

          <div style={{height: 12}} />
          <div className="row">
            <input className="input" value={taskTitle} onChange={(e)=>setTaskTitle(e.target.value)} placeholder="Nova tarefa..." />
            <button className="btn primary" onClick={addTask}>Adicionar</button>
          </div>

          <div className="list">
            {tasks.map(t => (
              <div key={t.id} className="item">
                <div>
                  <div style={{textDecoration: t.done ? 'line-through' : 'none'}}>{t.title}</div>
                  <div className="small">{new Date(t.created_at).toLocaleString()}</div>
                </div>
                <button className="btn" onClick={()=>toggleTask(t)}>{t.done ? 'Desfazer' : 'Concluir'}</button>
              </div>
            ))}
            {tasks.length === 0 ? <div className="small">Sem tarefas ainda.</div> : null}
          </div>
        </div>

        <div className="card span6">
          <div className="badge">🔥 Hábitos</div>

          <div style={{height: 12}} />
          <div className="row">
            <input className="input" value={habitTitle} onChange={(e)=>setHabitTitle(e.target.value)} placeholder="Novo hábito..." />
            <button className="btn primary" onClick={addHabit}>Adicionar</button>
          </div>

          <div className="list">
            {habits.map(h => (
              <div key={h.id} className="item">
                <div>
                  <div>{h.title}</div>
                  <div className="small">criado em {new Date(h.created_at).toLocaleDateString()}</div>
                </div>
                <span className="badge">MVP</span>
              </div>
            ))}
            {habits.length === 0 ? <div className="small">Sem hábitos ainda.</div> : null}
          </div>
        </div>

        <div className="card span6">
          <div className="badge">💸 Gastos (últimos 20)</div>

          <div style={{height: 12}} />
          <div className="row">
            <input className="input" value={expenseDesc} onChange={(e)=>setExpenseDesc(e.target.value)} placeholder="Descrição (opcional)" />
            <input className="input" value={expenseAmount} onChange={(e)=>setExpenseAmount(e.target.value)} placeholder="Valor (ex: 19,90)" />
            <button className="btn primary" onClick={addExpense}>Salvar</button>
          </div>

          <div className="list">
            {expenses.map(ex => (
              <div key={ex.id} className="item">
                <div>
                  <div>{ex.description || 'Sem descrição'}</div>
                  <div className="small">{ex.spent_on} • R$ {Number(ex.amount).toFixed(2)}</div>
                </div>
                <span className="badge">OK</span>
              </div>
            ))}
            {expenses.length === 0 ? <div className="small">Sem gastos ainda.</div> : null}
          </div>
        </div>

        <div className="card span6">
          <div className="badge">🎯 Metas</div>

          <div style={{height: 12}} />
          <div className="row">
            <input className="input" value={goalTitle} onChange={(e)=>setGoalTitle(e.target.value)} placeholder="Nova meta..." />
            <button className="btn primary" onClick={addGoal}>Adicionar</button>
          </div>

          <div className="list">
            {goals.map(g => (
              <div key={g.id} className="item">
                <div>
                  <div>{g.title}</div>
                  <div className="small">Progresso: {g.progress ?? 0}%</div>
                </div>
                <div className="row">
                  <button className="btn" onClick={()=>bumpGoal(g, -10)}>-10</button>
                  <button className="btn" onClick={()=>bumpGoal(g, +10)}>+10</button>
                </div>
              </div>
            ))}
            {goals.length === 0 ? <div className="small">Sem metas ainda.</div> : null}
          </div>
        </div>
      </div>
    </main>
  )
}
