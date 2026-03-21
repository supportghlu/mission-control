// Enhanced Mission Control Dashboard with Real-time Features
// Adds: live updates, financial impact tracking, resource requests, auto-refresh

class EnhancedMissionControl {
  constructor() {
    this.dataDir = './data/';
    this.refreshInterval = 5 * 60 * 1000; // 5 minutes
    this.lastUpdate = new Date().toISOString();
    this.setupAutoRefresh();
  }

  // Auto-refresh mechanism
  setupAutoRefresh() {
    setInterval(() => {
      this.refreshDashboard();
    }, this.refreshInterval);
  }

  // Real-time agent communication updates
  async updateAgentStatus(agentId, statusData) {
    const agents = await this.loadJSON('agents.json');
    const agentIndex = agents.findIndex(a => a.id === agentId);
    
    if (agentIndex >= 0) {
      agents[agentIndex] = {
        ...agents[agentIndex],
        ...statusData,
        lastReport: new Date().toISOString(),
        communicationStatus: 'active'
      };
      
      await this.saveJSON('agents.json', agents);
      this.broadcastUpdate('agent-status', { agentId, status: statusData });
    }
  }

  // Financial impact tracking
  calculateFinancialImpact() {
    const projects = this.loadJSON('projects.json');
    const tasks = this.loadJSON('tasks.json');
    
    let totalDailyImpact = 0;
    let totalRecoveryPotential = 0;
    let criticalIssues = [];

    projects.forEach(project => {
      if (project.financialImpact) {
        const impact = project.financialImpact;
        
        if (impact.currentLoss) {
          const dailyLoss = this.calculateDailyImpact(
            parseFloat(impact.currentLoss), 
            impact.timeframe
          );
          totalDailyImpact += dailyLoss;
          
          if (project.priority === 'HIGH' || project.priority === 'CRITICAL') {
            criticalIssues.push({
              project: project.name,
              dailyImpact: dailyLoss,
              recoveryPotential: impact.recoveryPotential || impact.currentLoss,
              priority: project.priority
            });
          }
        }
        
        if (impact.recoveryPotential) {
          totalRecoveryPotential += parseFloat(impact.recoveryPotential);
        }
      }
    });

    return {
      totalDailyImpact,
      totalRecoveryPotential,
      criticalIssues,
      lastCalculated: new Date().toISOString()
    };
  }

  calculateDailyImpact(amount, timeframe) {
    switch (timeframe) {
      case 'daily': return amount;
      case 'weekly': return amount / 7;
      case 'monthly': return amount / 30;
      case 'immediate': return amount; // One-time impact
      default: return 0;
    }
  }

  // Resource request dashboard
  getResourceRequests() {
    const tasks = this.loadJSON('tasks.json');
    const agents = this.loadJSON('agents.json');
    
    let resourceRequests = [];
    let blockerSummary = {};

    // From task queue
    tasks
      .filter(task => task.status === 'waiting_input')
      .forEach(task => {
        resourceRequests.push({
          type: 'task',
          title: task.title,
          description: task.description,
          priority: task.priority,
          assignee: task.assignee,
          estimatedTime: task.estimatedTime,
          impact: task.impact,
          dueDate: task.dueDate,
          project: task.project
        });
      });

    // From agent blockers
    agents.forEach(agent => {
      if (agent.blockers && agent.blockers.length > 0) {
        agent.blockers.forEach(blocker => {
          resourceRequests.push({
            type: 'blocker',
            title: `${agent.name}: ${blocker}`,
            agent: agent.name,
            priority: this.determineBlockerPriority(agent.domain, blocker),
            impact: this.determineBlockerImpact(agent.domain)
          });
          
          // Count blocker types
          blockerSummary[blocker] = (blockerSummary[blocker] || 0) + 1;
        });
      }
    });

    return {
      requests: resourceRequests.sort((a, b) => this.priorityValue(a.priority) - this.priorityValue(b.priority)),
      blockerSummary,
      totalRequests: resourceRequests.length,
      criticalRequests: resourceRequests.filter(r => r.priority === 'CRITICAL').length,
      lastUpdated: new Date().toISOString()
    };
  }

  priorityValue(priority) {
    const priorities = { 'CRITICAL': 1, 'HIGH': 2, 'MEDIUM': 3, 'LOW': 4 };
    return priorities[priority] || 5;
  }

  determineBlockerPriority(domain, blocker) {
    if (blocker.includes('API') && domain.includes('Revenue')) return 'CRITICAL';
    if (blocker.includes('access') && domain.includes('Revenue')) return 'HIGH';
    if (blocker.includes('credentials')) return 'HIGH';
    return 'MEDIUM';
  }

  determineBlockerImpact(domain) {
    if (domain.includes('Revenue')) return 'HIGH - Revenue generation blocked';
    if (domain.includes('Operations')) return 'MEDIUM - Operational efficiency impact';
    return 'LOW - Process improvement delayed';
  }

  // Live agent communication tracking
  trackAgentCommunication(agentId, messageType, data) {
    const timestamp = new Date().toISOString();
    const communication = {
      agentId,
      timestamp,
      messageType, // 'report', 'request', 'completion', 'escalation'
      data,
      id: `${agentId}-${Date.now()}`
    };
    
    // Store in communication log
    const commLog = this.loadJSON('communications.json') || [];
    commLog.unshift(communication);
    
    // Keep only last 100 communications
    if (commLog.length > 100) {
      commLog.splice(100);
    }
    
    this.saveJSON('communications.json', commLog);
    this.broadcastUpdate('agent-communication', communication);
    
    return communication;
  }

  // Dashboard refresh with all enhancements
  refreshDashboard() {
    const dashboardData = {
      timestamp: new Date().toISOString(),
      agents: this.loadJSON('agents.json'),
      projects: this.loadJSON('projects.json'),
      tasks: this.loadJSON('tasks.json'),
      businessMetrics: this.loadJSON('business-metrics.json'),
      overnight: this.loadJSON('overnight.json'),
      financialImpact: this.calculateFinancialImpact(),
      resourceRequests: this.getResourceRequests(),
      recentCommunications: (this.loadJSON('communications.json') || []).slice(0, 10)
    };
    
    this.lastUpdate = dashboardData.timestamp;
    this.broadcastUpdate('dashboard-refresh', dashboardData);
    
    return dashboardData;
  }

  // WebSocket broadcasting (placeholder for real-time updates)
  broadcastUpdate(eventType, data) {
    console.log(`Broadcasting ${eventType}:`, data);
    // In real implementation, this would use WebSockets
    // to push updates to connected dashboard clients
  }

  // Utility methods
  loadJSON(filename) {
    try {
      const fs = require('fs');
      return JSON.parse(fs.readFileSync(this.dataDir + filename, 'utf8'));
    } catch (error) {
      console.error(`Error loading ${filename}:`, error);
      return null;
    }
  }

  saveJSON(filename, data) {
    try {
      const fs = require('fs');
      fs.writeFileSync(this.dataDir + filename, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error saving ${filename}:`, error);
    }
  }
}

// Enhanced dashboard initialization
const enhanced = new EnhancedMissionControl();

// Example API endpoints for real-time updates
const dashboardAPI = {
  // Get current dashboard state
  getDashboard: () => enhanced.refreshDashboard(),
  
  // Agent status update endpoint
  updateAgent: (agentId, statusData) => enhanced.updateAgentStatus(agentId, statusData),
  
  // Financial impact summary
  getFinancialImpact: () => enhanced.calculateFinancialImpact(),
  
  // Resource requests summary  
  getResourceRequests: () => enhanced.getResourceRequests(),
  
  // Track agent communication
  logCommunication: (agentId, type, data) => enhanced.trackAgentCommunication(agentId, type, data)
};

module.exports = {
  EnhancedMissionControl,
  dashboardAPI
};