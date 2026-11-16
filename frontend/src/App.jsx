import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, CheckCircle2, Circle, Trash2, Pencil, LogOut, ListTodo, Clock3, CheckCheck, X, CalendarDays } from 'lucide-react';
import api from './api';

const blank = { title: '', description: '', priority: 'Medium', dueDate: '' };

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('taskflow_token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('taskflow_user') || 'null'));
  const [mode, setMode] = useState('login');
  const [credentials, setCredentials] = useState({ name: '', email: '', password: '' });
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [modal, setModal] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const logout = useCallback(() => {
    localStorage.removeItem('taskflow_token');
    localStorage.removeItem('taskflow_user');
    setToken(null); setUser(null); setTasks([]);
  }, []);

  const loadTasks = useCallback(async () => {
    if (!token) return;
    try { const { data } = await api.get('/tasks'); setTasks(data); }
    catch (err) {
      if (err.response?.status === 401) logout();
      else setError(err.response?.data?.message || 'Unable to load tasks');
    }
  }, [token, logout]);

  useEffect(() => {
    loadTasks();
    if (!token) return;
    const timer = setInterval(loadTasks, 10000);
    return () => clearInterval(timer);
  }, [loadTasks, token]);

  async function authenticate(e) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const { data } = await api.post(endpoint, credentials);
      localStorage.setItem('taskflow_token', data.token);
      localStorage.setItem('taskflow_user', JSON.stringify(data.user));
      setToken(data.token); setUser(data.user);
    } catch (err) { setError(err.response?.data?.message || 'Authentication failed'); }
    finally { setBusy(false); }
  }

  async function saveTask(e) {
    e.preventDefault(); setError('');
    try {
      const payload = { ...form, dueDate: form.dueDate || null };
      if (editing) await api.put(`/tasks/${editing}`, payload);
      else await api.post('/tasks', payload);
      setModal(false); setEditing(null); setForm(blank); await loadTasks();
    } catch (err) { setError(err.response?.data?.message || 'Could not save task'); }
  }

  function startEdit(task) {
    setEditing(task._id);
    setForm({
      title: task.title, description: task.description || '', priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : ''
    });
    setModal(true);
  }

  async function updateTask(task, changes) {
    try { await api.put(`/tasks/${task._id}`, changes); await loadTasks(); }
    catch (err) { setError(err.response?.data?.message || 'Could not update task'); }
  }

  async function removeTask(id) {
    if (!window.confirm('Delete this task?')) return;
    try { await api.delete(`/tasks/${id}`); await loadTasks(); }
    catch (err) { setError(err.response?.data?.message || 'Could not delete task'); }
  }

  const shown = useMemo(() => tasks.filter(task =>
    (filter === 'All' || task.status === filter) &&
    `${task.title} ${task.description}`.toLowerCase().includes(query.toLowerCase())
  ), [tasks, filter, query]);

  const counts = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'Pending').length,
    progress: tasks.filter(t => t.status === 'In Progress').length,
    done: tasks.filter(t => t.status === 'Completed').length
  };

  if (!token) return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand-mark"><ListTodo size={25}/></div>
        <p className="eyebrow">YOUR PERSONAL WORKSPACE</p>
        <h1>{mode === 'login' ? 'Welcome back.' : 'Create your account.'}</h1>
        <p className="muted">Plan your day, focus on what matters, and get things done.</p>
        {error && <div className="alert">{error}</div>}
        <form onSubmit={authenticate} className="auth-form">
          {mode === 'register' && <label>Full name<input required value={credentials.name} onChange={e=>setCredentials({...credentials,name:e.target.value})} placeholder="Your name"/></label>}
          <label>Email address<input required type="email" value={credentials.email} onChange={e=>setCredentials({...credentials,email:e.target.value})} placeholder="you@example.com"/></label>
          <label>Password<input required minLength="6" type="password" value={credentials.password} onChange={e=>setCredentials({...credentials,password:e.target.value})} placeholder="At least 6 characters"/></label>
          <button className="primary full" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
        </form>
        <p className="switch">{mode === 'login' ? 'New to Taskflow?' : 'Already have an account?'} <button onClick={()=>{setMode(mode==='login'?'register':'login');setError('')}}>{mode==='login'?'Create an account':'Sign in'}</button></p>
      </section>
    </main>
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark"><ListTodo size={22}/></span>taskflow<span className="brand-dot">.</span></div>
        <div className="side-label">WORKSPACE</div>
        {['All','Pending','In Progress','Completed'].map((item,i)=><button key={item} className={`nav-item ${filter===item?'active':''}`} onClick={()=>setFilter(item)}>
          {[<ListTodo/>,<Circle/>,<Clock3/>,<CheckCircle2/>][i]} {item==='All'?'All tasks':item} {item==='All'&&<span>{counts.total}</span>}
        </button>)}
        <div className="sidebar-bottom"><div className="avatar">{(user?.name||'U')[0].toUpperCase()}</div><div className="user-meta"><strong>{user?.name}</strong><small>{user?.email}</small></div><button className="icon-btn" title="Sign out" onClick={logout}><LogOut size={17}/></button></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div><p className="eyebrow">YOUR DAY, IN FOCUS</p><h1>Good to see you, {user?.name?.split(' ')[0] || 'there'} <span>✦</span></h1><p className="muted">Here's what's happening with your tasks today.</p></div><button className="primary" onClick={()=>{setEditing(null);setForm(blank);setModal(true)}}><Plus size={18}/> New task</button></header>
        {error && <div className="alert">{error}<button onClick={()=>setError('')}><X size={16}/></button></div>}
        <section className="stats-grid">
          <Stat icon={<ListTodo/>} label="Total tasks" value={counts.total} tone="violet"/>
          <Stat icon={<Circle/>} label="Pending" value={counts.pending} tone="orange"/>
          <Stat icon={<Clock3/>} label="In progress" value={counts.progress} tone="blue"/>
          <Stat icon={<CheckCheck/>} label="Completed" value={counts.done} tone="green"/>
        </section>
        <section className="task-section">
          <div className="section-heading"><div><h2>Your tasks</h2><p className="muted">{shown.length} tasks shown</p></div>
            <div className="tools"><div className="search"><Search size={17}/><input placeholder="Search tasks..." value={query} onChange={e=>setQuery(e.target.value)}/></div>
              <select value={filter} onChange={e=>setFilter(e.target.value)}><option>All</option><option>Pending</option><option>In Progress</option><option>Completed</option></select>
            </div>
          </div>
          {!shown.length ? <div className="empty"><div className="empty-icon"><CalendarDays size={28}/></div><h3>{tasks.length?'No matching tasks':'Your space is clear.'}</h3><p className="muted">{tasks.length?'Try another search or filter.':'Add a task to turn your plans into progress.'}</p>{!tasks.length&&<button className="primary" onClick={()=>setModal(true)}><Plus size={17}/> Create your first task</button>}</div> :
            <div className="task-list">{shown.map(task=><article className={`task-card ${task.status==='Completed'?'is-done':''}`} key={task._id}>
              <button className="check-btn" title="Toggle completion" onClick={()=>updateTask(task,{status:task.status==='Completed'?'Pending':'Completed'})}>{task.status==='Completed'?<CheckCircle2/>:<Circle/>}</button>
              <div className="task-info"><h3>{task.title}</h3>{task.description&&<p>{task.description}</p>}<div className="task-meta">
                <span className={`priority ${task.priority.toLowerCase()}`}>{task.priority} priority</span>
                <span className={`status ${task.status.toLowerCase().replace(' ','-')}`}>{task.status}</span>
                {task.dueDate&&<span className="due"><CalendarDays size={13}/>{new Date(task.dueDate).toLocaleDateString()}</span>}
              </div></div>
              <div className="task-actions"><button className="icon-btn" title="Edit" onClick={()=>startEdit(task)}><Pencil size={16}/></button><button className="icon-btn danger" title="Delete" onClick={()=>removeTask(task._id)}><Trash2 size={16}/></button></div>
              <select className="status-select" value={task.status} onChange={e=>updateTask(task,{status:e.target.value})}><option>Pending</option><option>In Progress</option><option>Completed</option></select>
            </article>)}</div>}
        </section>
        <footer>Made for focused days. <span>Taskflow © 2026</span></footer>
      </main>

      {modal&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(false)}}>
        <form className="task-modal" onSubmit={saveTask}>
          <div className="modal-head"><div><p className="eyebrow">{editing?'MAKE AN UPDATE':'MAKE IT HAPPEN'}</p><h2>{editing?'Edit task':'Create a task'}</h2></div><button type="button" className="icon-btn" onClick={()=>setModal(false)}><X/></button></div>
          <label>Task title<input autoFocus required maxLength="120" placeholder="e.g. Finish project presentation" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label>
          <label>Description<textarea rows="3" placeholder="Add a few details..." value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
          <div className="form-row"><label>Priority<select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option>Low</option><option>Medium</option><option>High</option></select></label><label>Due date<input type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}/></label></div>
          <div className="modal-actions"><button type="button" className="secondary" onClick={()=>setModal(false)}>Cancel</button><button className="primary">{editing?'Save changes':'Create task'}</button></div>
        </form>
      </div>}
    </div>
  );
}
function Stat({icon,label,value,tone}) { return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div><p>{label}</p><strong>{value}</strong></div></div>; }
