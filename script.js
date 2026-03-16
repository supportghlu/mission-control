// Mission Control — Boss Operations Hub

const REFRESH_INTERVAL = 60000; // 60 seconds
const TIMEZONE = 'Europe/London';

let data = {
  projects: [],
  tasks: [],
  overnight: [],
  decisions: []
};

// ── Data Loading ──

async function loadData() {
  try {
    const [projects, tasks, overnight, decisions] = await Promise.all([
      fetch('data/projects.json').then(r => r.json()),
      fetch('data/tasks.json').then(r => r.json()),
      fetch('data/overnight.json').then(r => r.json()),
      fetch('data/decisions.json').then(r => r.json())
    ]);
    data = { projects, tasks, overnight, decisions };
    render();
    updateRefreshTime();
  } catch (err) {
    console.error('Failed to load data:', err);
  }
}

// ── Clock ──

function updateClock() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-GB', { timeZone: TIMEZONE, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('en-GB', { timeZone: TIMEZONE, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  document.getElementById('clock').textContent = timeStr;
  document.getElementById('date').textContent = dateStr;
}

function updateRefreshTime() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-GB', { timeZone: TIMEZONE, hour: '2-digit', minute: '2-digit' });
  document.getElementById('refresh-time').textContent = `Last refresh: ${timeStr}`;
}

// ── Rendering ──

function render() {
  renderBriefing();
  renderProjects();
  renderTasks();
  renderDecisions();
}

// Morning Briefing
function renderBriefing() {
  const container = document.getElementById('briefing');
  
  if (!data.overnight.length) {
    container.innerHTML = '<div class="briefing empty">No overnight reports yet — first shift tonight 🫡</div>';
    return;
  }

  const latest = data.overnight[data.overnight.length - 1];
  
  container.innerHTML = `
    <div class="briefing">
      <div class="briefing-header" onclick="toggleBriefing()">
        <h3>📋 Overnight Report — ${latest.date}</h3>
        <button class="briefing-toggle" id="briefing-toggle">▼ Details</button>
      </div>
      <p style="margin-top: 8px; color: var(--text-secondary); font-size: 14px;">${latest.summary}</p>
      <div class="briefing-details" id="briefing-details" style="display: none;">
        ${latest.tasksCompleted.length ? `
          <div class="label" style="color: var(--accent-green); font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em;">Completed</div>
          <ul>${latest.tasksCompleted.map(t => `<li>${t}</li>`).join('')}</ul>
        ` : ''}
        ${latest.tasksStarted.length ? `
          <div class="label" style="color: var(--accent-blue); font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; margin-top: 10px;">Started</div>
          <ul>${latest.tasksStarted.map(t => `<li>${t}</li>`).join('')}</ul>
        ` : ''}
        ${latest.details ? `
          <div class="label" style="color: var(--text-muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; margin-top: 10px;">Details</div>
          <p style="white-space: pre-wrap;">${latest.details}</p>
        ` : ''}
      </div>
    </div>
  `;
}

function toggleBriefing() {
  const details = document.getElementById('briefing-details');
  const toggle = document.getElementById('briefing-toggle');
  if (details.style.display === 'none') {
    details.style.display = 'block';
    toggle.textContent = '▲ Hide';
  } else {
    details.style.display = 'none';
    toggle.textContent = '▼ Details';
  }
}

// Projects
function renderProjects() {
  const container = document.getElementById('projects');
  
  const sorted = [...data.projects].sort((a, b) => {
    const statusOrder = { 'in-progress': 0, 'blocked': 1, 'planning': 2, 'done': 3 };
    const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
    return (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9) 
      || (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9);
  });

  container.innerHTML = sorted.map(p => `
    <div class="card">
      <div class="card-header">
        <span class="card-title">${p.name}</span>
        <span>
          <span class="badge badge-${p.status}">${p.status.replace('-', ' ')}</span>
          <span class="priority priority-${p.priority}">${p.priority}</span>
        </span>
      </div>
      <div class="card-body">
        <p>${p.objective}</p>
        <p style="margin-top: 8px; color: var(--text-primary); font-size: 13px;">${p.currentStatus}</p>
        ${p.nextSteps.length ? `
          <div class="label">Next Steps</div>
          <ul>${p.nextSteps.map(s => `<li>${s}</li>`).join('')}</ul>
        ` : ''}
        ${p.blockers.length ? `
          <div class="label" style="color: var(--accent-red);">Blockers</div>
          <ul>${p.blockers.map(b => `<li style="color: var(--accent-amber);">${b}</li>`).join('')}</ul>
        ` : ''}
      </div>
    </div>
  `).join('');
}

// Tasks
function renderTasks() {
  const container = document.getElementById('tasks');
  
  const groups = {
    'in-progress': { title: '🔄 In Progress', tasks: [], highlight: false },
    'waiting-input': { title: '⏳ Waiting on Orien', tasks: [], highlight: true },
    'waiting-approval': { title: '✋ Waiting Approval', tasks: [], highlight: true },
    'queued': { title: '📋 Queued', tasks: [], highlight: false },
    'done': { title: '✅ Done (Recent)', tasks: [], highlight: false }
  };

  data.tasks.forEach(t => {
    if (groups[t.status]) {
      groups[t.status].tasks.push(t);
    }
  });

  let html = '';
  for (const [status, group] of Object.entries(groups)) {
    if (!group.tasks.length) continue;
    
    const projectName = (id) => {
      const proj = data.projects.find(p => p.id === id);
      return proj ? proj.name : '';
    };

    html += `
      <div class="task-group">
        <div class="task-group-title ${group.highlight ? 'highlight' : ''}">${group.title} (${group.tasks.length})</div>
        ${group.tasks.map(t => `
          <div class="task-item">
            <div class="task-title">
              <span class="badge badge-${t.status}">${t.status.replace('-', ' ')}</span>
              ${t.title}
              <span class="priority priority-${t.priority}">${t.priority}</span>
            </div>
            ${t.description ? `<div class="task-desc">${t.description}</div>` : ''}
            <div class="task-meta">
              ${t.project ? `Project: ${projectName(t.project)}` : ''}
              ${t.completedAt ? ` · Completed: ${new Date(t.completedAt).toLocaleDateString('en-GB')}` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  container.innerHTML = html || '<div class="empty-state">No tasks yet</div>';
}

// Decisions
function renderDecisions() {
  const container = document.getElementById('decisions');
  
  const sorted = [...data.decisions].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  container.innerHTML = sorted.map(d => `
    <div class="decision-item" onclick="toggleDecision('${d.id}')">
      <div class="decision-header">
        <span class="decision-title">${d.title}</span>
        <span class="decision-date">${d.date}</span>
      </div>
      <div class="decision-body" id="dec-${d.id}">
        <div class="dec-label">Context</div>
        <p>${d.context}</p>
        <div class="dec-label">Decision</div>
        <p>${d.decision}</p>
        <div class="dec-label">Reasoning</div>
        <p>${d.reasoning}</p>
      </div>
    </div>
  `).join('');
}

function toggleDecision(id) {
  const el = document.getElementById(`dec-${id}`);
  el.classList.toggle('open');
}

// ── Init ──

updateClock();
setInterval(updateClock, 1000);
loadData();
setInterval(loadData, REFRESH_INTERVAL);
