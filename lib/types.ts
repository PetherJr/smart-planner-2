export type Task = {
  id: string
  user_id: string
  title: string
  due_date: string | null
  done: boolean
  created_at: string
}

export type Habit = {
  id: string
  user_id: string
  title: string
  created_at: string
}

export type Expense = {
  id: string
  user_id: string
  description: string | null
  amount: number
  spent_on: string
  created_at: string
}

export type Goal = {
  id: string
  user_id: string
  title: string
  target_date: string | null
  progress: number
  created_at: string
}
