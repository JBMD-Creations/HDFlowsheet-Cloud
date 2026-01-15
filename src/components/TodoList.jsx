import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function TodoList() {
  const [todos, setTodos] = useState([])
  const [newTask, setNewTask] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchTodos()
  }, [])

  async function fetchTodos() {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('inserted_at', { ascending: false })

      if (error) throw error

      setTodos(data || [])
    } catch (error) {
      console.error('Error fetching todos:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function addTodo(e) {
    e.preventDefault()

    if (!newTask.trim()) return

    try {
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()

      const { data, error } = await supabase
        .from('todos')
        .insert([
          {
            task: newTask.trim(),
            user_id: user?.id || null,
            is_complete: false
          }
        ])
        .select()

      if (error) throw error

      if (data) {
        setTodos([data[0], ...todos])
      }

      setNewTask('')
    } catch (error) {
      console.error('Error adding todo:', error)
      setError(error.message)
    }
  }

  async function toggleComplete(id, currentStatus) {
    try {
      setError(null)

      const { error } = await supabase
        .from('todos')
        .update({ is_complete: !currentStatus })
        .eq('id', id)

      if (error) throw error

      setTodos(todos.map(todo =>
        todo.id === id ? { ...todo, is_complete: !currentStatus } : todo
      ))
    } catch (error) {
      console.error('Error updating todo:', error)
      setError(error.message)
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <p>Loading todos...</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>My Todos</h1>

      {error && (
        <div style={styles.error}>
          Error: {error}
        </div>
      )}

      <form onSubmit={addTodo} style={styles.form}>
        <input
          type="text"
          placeholder="Enter a new task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          style={styles.input}
        />
        <button type="submit" style={styles.button}>
          Add Todo
        </button>
      </form>

      <div style={styles.todoList}>
        {todos.length === 0 ? (
          <p style={styles.emptyMessage}>No todos yet. Add one above!</p>
        ) : (
          todos.map((todo) => (
            <div key={todo.id} style={styles.todoItem}>
              <input
                type="checkbox"
                checked={todo.is_complete}
                onChange={() => toggleComplete(todo.id, todo.is_complete)}
                style={styles.checkbox}
              />
              <span style={{
                ...styles.todoText,
                ...(todo.is_complete ? styles.todoTextComplete : {})
              }}>
                {todo.task}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  title: {
    fontSize: '2rem',
    marginBottom: '1.5rem',
    color: '#333',
  },
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
  form: {
    display: 'flex',
    gap: '10px',
    marginBottom: '2rem',
  },
  input: {
    flex: 1,
    padding: '10px',
    fontSize: '1rem',
    border: '2px solid #ddd',
    borderRadius: '4px',
  },
  button: {
    padding: '10px 20px',
    fontSize: '1rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  todoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  todoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '15px',
    backgroundColor: '#f9fafb',
    borderRadius: '4px',
    border: '1px solid #e5e7eb',
  },
  checkbox: {
    width: '20px',
    height: '20px',
    cursor: 'pointer',
  },
  todoText: {
    fontSize: '1rem',
    color: '#333',
  },
  todoTextComplete: {
    textDecoration: 'line-through',
    color: '#999',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#999',
    fontSize: '1rem',
  },
}
