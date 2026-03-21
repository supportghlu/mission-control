// Mission Control — Boss Operations Hub (With Embedded Current Data)

const REFRESH_INTERVAL = 60000; // 60 seconds
const TIMEZONE = 'Europe/Amsterdam';

// Embedded current data (fallback while Render deploys)
const EMBEDDED_DATA = {
  agents: [
    {
      "id": "growth-agent",
      "name": "Growth Agent", 
      "domain": "Revenue Generation & Client Acquisition",
      "status": "active",
      "lastReport": "2026-03-21T08:30:00.000Z",
      "sessionKey": "agent:main:subagent:a640f6d6-68b8-4ea9-943b-69301583f629",
      "currentFocus": "AI-IFY-U campaign crisis ($50/day waste)",
      "activeProjects": ["Meta Ads AI Agent optimization", "AI-IFY-U campaign fix", "Cold email automation", "Demo generation system"],
      "blockers": ["Landing page admin access needed", "GHL API key refresh required"]
    },
    {
      "id": "operations-agent",
      "name": "Operations Agent",
      "domain": "Internal Infrastructure & Performance", 
      "status": "active",
      "lastReport": "2026-03-21T08:25:00.000Z",
      "sessionKey": "agent:main:subagent:7e7fb18a-dfe4-4833-8f6d-f3b0197e782a",
      "currentFocus": "Payment automation system implementation",
      "activeProjects": ["Payment tracking automation", "KPI dashboard systems", "SOP documentation"],
      "blockers": ["Stripe API credentials needed", "Google Sheets API permissions"]
    },
    {
      "id": "fulfilment-agent",
      "name": "Fulfilment Agent",
      "domain": "Client System Delivery & Technical Implementation",
      "status": "active",
      "lastReport": "2026-03-21T08:26:00.000Z",
      "sessionKey": "agent:main:subagent:6209d25b-c018-4c58-83be-d21fd2260faa",
      "currentFocus": "Personalized demo generation system", 
      "activeProjects": ["AI-generated client assets", "Personalized demo system", "Funding application automation"],
      "blockers": ["ElevenLabs API credentials", "Voice cloning guidelines", "Funding system requirements undefined"]
    },
    {
      "id": "client-success-agent",
      "name": "Client Success Agent",
      "domain": "Client Lifecycle Management & Retention",
      "status": "active",
      "lastReport": "2026-03-21T08:25:00.000Z",
      "sessionKey": "agent:main:subagent:cb96e10a-6838-435a-9d6d-8b9261b62647",
      "currentFocus": "Onboarding automation requirements gathering",
      "activeProjects": ["Client onboarding automation", "Retention monitoring system", "Support automation"],
      "blockers": ["Current onboarding documentation access", "At-risk client list needed", "GHL system access required"]
    },
    {
      "id": "qa-agent", 
      "name": "QA Agent",
      "domain": "Quality Assurance & Verification",
      "status": "active",
      "lastReport": "2026-03-21T08:25:00.000Z",
      "sessionKey": "agent:main:subagent:630b6020-40d9-4f94-8104-f61fcfe3325c",
      "currentFocus": "Ready for work verification",
      "activeProjects": ["Quality verification pipeline", "Agent work validation", "Process compliance monitoring"],
      "blockers": []
    }
  ],
  projects: [
    {
      "id": "ai-ify-u-campaign-fix",
      "name": "AI-IFY-U Campaign Crisis Fix",
      "status": "critical",
      "priority": "HIGH", 
      "agent": "Growth Agent",
      "progress": 25,
      "financialImpact": { "currentLoss": "350.00", "recoveryPotential": "350.00", "timeframe": "weekly" },
      "nextSteps": ["Get landing page admin access", "Fix broken booking URLs", "Restart campaign with working links"],
      "blockers": ["Landing page admin access required"]
    },
    {
      "id": "payment-automation-system",
      "name": "Payment Automation System", 
      "status": "in-progress",
      "priority": "HIGH",
      "agent": "Operations Agent",
      "progress": 60,
      "financialImpact": { "currentLoss": "5680.00", "recoveryPotential": "5680.00", "timeframe": "immediate" },
      "nextSteps": ["Deploy payment automation workers", "Integrate with Stripe API"],
      "blockers": ["Stripe API credentials needed"]
    },
    {
      "id": "demo-generation-system",
      "name": "AI Demo Generation System",
      "status": "ready",
      "priority": "MEDIUM",
      "agent": "Fulfilment Agent",
      "progress": 80, 
      "financialImpact": { "currentBaseline": "15", "improvementPotential": "30-45", "metric": "demo-to-close conversion %" },
      "nextSteps": ["Get ElevenLabs API credentials", "Deploy Phase 1 implementation"],
      "blockers": ["ElevenLabs API credentials needed"]
    }
  ],
  tasks: [
    { "id": "get-ghl-api-refresh", "title": "Get GHL API key refresh", "priority": "CRITICAL", "status": "waiting_input", "assignee": "Orien", "impact": "HIGH - Blocks $5k+ automation deployment" },
    { "id": "landing-page-admin-access", "title": "Get landing page admin access for AI-IFY-U", "priority": "HIGH", "status": "waiting_input", "assignee": "Orien", "impact": "HIGH - $350/week revenue recovery" },
    { "id": "stripe-api-credentials", "title": "Provide Stripe API credentials", "priority": "HIGH", "status": "waiting_input", "assignee": "Orien", "impact": "HIGH - $5,680 immediate recovery" },
    { "id": "elevenlabs-api-credentials", "title": "Get ElevenLabs API credentials", "priority": "MEDIUM", "status": "waiting_input", "assignee": "Orien", "impact": "MEDIUM - 2-3x demo conversion improvement" }
  ],
  overnight: {
    "title": "Architecture Transformation Complete", 
    "summary": "5 persistent agents deployed and active. Critical issues identified requiring immediate attention.",
    "criticalIssues": [
      { "title": "AI-IFY-U Campaign Crisis", "impact": "$350+/week revenue recovery potential", "status": "ESCALATED to Boss", "agent": "Growth Agent" },
      { "title": "Overdue Payment Recovery", "impact": "$5,680 immediate cash flow recovery", "status": "Payment automation system workers spawned", "agent": "Operations Agent" }
    ]
  }
};

let data = EMBEDDED_DATA;

// ── Data Loading ──

async function loadData() {
  try {
    // Try to load from server first, fallback to embedded data
    const [projects, tasks, overnight] = await Promise.all([
      fetch('data/projects.json').then(r => r.ok ? r.json() : EMBEDDED_DATA.projects),
      fetch('data/tasks.json').then(r => r.ok ? r.json() : EMBEDDED_DATA.tasks),
      fetch('data/overnight.json').then(r => r.ok ? r.json() : EMBEDDED_DATA.overnight)
    ]);
    
    // Try to load new files, but don't fail if they're missing
    let agents = EMBEDDED_DATA.agents;
    try {
      const agentsResponse = await fetch('data/agents.json');
      if (agentsResponse.ok) agents = await agentsResponse.json();
    } catch (e) {
      console.log('Using embedded agent data');
    }

    data = { agents, projects, tasks, overnight };
    render();
    updateRefreshTime();
  } catch (err) {
    console.error('Failed to load data, using embedded:', err);
    data = EMBEDDED_DATA;
    render();
    updateRefreshTime();
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
  renderAgents();
  renderProjects();
  renderTasks();
}

function renderBriefing() {
  const briefing = document.getElementById('briefing');
  const overnight = data.overnight || {};
  
  briefing.innerHTML = `
    <div class="briefing-card">
      <div class="briefing-title">${overnight.title || 'Daily Briefing'}</div>
      <div class="briefing-summary">${overnight.summary || 'Loading...'}</div>
      
      ${overnight.criticalIssues ? `
        <div class="critical-issues">
          <h4>🚨 Critical Issues:</h4>
          ${overnight.criticalIssues.map(issue => `
            <div class="critical-issue">
              <strong>${issue.title}</strong> - ${issue.impact}<br>
              <small>Agent: ${issue.agent} | Status: ${issue.status}</small>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${data.agents ? `
        <div class="agent-summary">
          <h4>🤖 Agent Status:</h4>
          <div class="agent-grid">
            ${data.agents.map(agent => `
              <div class="agent-card ${agent.status}">
                <div class="agent-name">${agent.name}</div>
                <div class="agent-focus">${agent.currentFocus}</div>
                ${agent.blockers && agent.blockers.length > 0 ? `
                  <div class="agent-blockers">⚠️ ${agent.blockers.length} blockers</div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderAgents() {
  // Agents rendered in briefing section
}

function renderProjects() {
  const projects = document.getElementById('projects');
  const projectList = data.projects || [];
  
  projects.innerHTML = projectList.map(project => `
    <div class="project-card ${project.status} ${project.priority?.toLowerCase()}">
      <div class="project-header">
        <div class="project-title">${project.name}</div>
        <div class="project-status ${project.status}">${project.status}</div>
      </div>
      <div class="project-agent">${project.agent}</div>
      <div class="project-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${project.progress || 0}%"></div>
        </div>
        <span>${project.progress || 0}%</span>
      </div>
      ${project.financialImpact ? `
        <div class="financial-impact">
          💰 Impact: ${project.financialImpact.currentLoss ? `$${project.financialImpact.currentLoss} ${project.financialImpact.timeframe}` : 'TBD'}
        </div>
      ` : ''}
      ${project.blockers && project.blockers.length > 0 ? `
        <div class="blockers">
          ⚠️ Blockers: ${project.blockers.join(', ')}
        </div>
      ` : ''}
    </div>
  `).join('');
}

function renderTasks() {
  const tasks = document.getElementById('tasks');
  const taskList = data.tasks || [];
  
  const waitingTasks = taskList.filter(t => t.status === 'waiting_input');
  const otherTasks = taskList.filter(t => t.status !== 'waiting_input');
  
  tasks.innerHTML = `
    ${waitingTasks.length > 0 ? `
      <div class="task-section">
        <h4>⏳ Waiting on Orien (${waitingTasks.length})</h4>
        ${waitingTasks.map(task => `
          <div class="task-card ${task.priority?.toLowerCase()}">
            <div class="task-title">${task.title}</div>
            <div class="task-impact">${task.impact}</div>
            <div class="task-priority">${task.priority}</div>
          </div>
        `).join('')}
      </div>
    ` : ''}
    
    ${otherTasks.length > 0 ? `
      <div class="task-section">
        <h4>📋 Other Tasks (${otherTasks.length})</h4>
        ${otherTasks.map(task => `
          <div class="task-card ${task.status}">
            <div class="task-title">${task.title}</div>
            <div class="task-status">${task.status}</div>
          </div>
        `).join('')}
      </div>
    ` : ''}
  `;
}

// ── Initialize ──

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  updateClock();
  setInterval(updateClock, 1000);
  setInterval(loadData, REFRESH_INTERVAL);
});