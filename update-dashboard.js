// Mission Control Dashboard Update System
// Integrates agent reports with existing dashboard

const fs = require('fs');
const path = require('path');

class MissionControlIntegration {
  constructor() {
    this.dataDir = path.join(__dirname, 'data');
    this.agentsFile = path.join(this.dataDir, 'agents.json');
    this.metricsFile = path.join(this.dataDir, 'business-metrics.json');
    this.projectsFile = path.join(this.dataDir, 'projects.json');
  }

  // Update agent status from Boss coordination reports
  updateAgentStatus(agentId, statusUpdate) {
    const agents = this.loadJSON(this.agentsFile);
    const agentIndex = agents.findIndex(a => a.id === agentId);
    
    if (agentIndex >= 0) {
      agents[agentIndex] = {
        ...agents[agentIndex],
        ...statusUpdate,
        lastReport: new Date().toISOString()
      };
      this.saveJSON(this.agentsFile, agents);
      console.log(`Updated ${agentId} status`);
    }
  }

  // Update business metrics from agent reports
  updateBusinessMetrics(category, metricName, value, trend = 'stable') {
    const data = this.loadJSON(this.metricsFile);
    const categoryData = data.find(c => c.category === category);
    
    if (categoryData) {
      const metric = categoryData.metrics.find(m => m.name === metricName);
      if (metric) {
        metric.value = value.toString();
        metric.trend = trend;
        metric.lastUpdated = new Date().toISOString();
      }
    }
    
    this.saveJSON(this.metricsFile, data);
    console.log(`Updated ${category}.${metricName} = ${value}`);
  }

  // Process hourly agent reports
  processAgentReport(agentId, reportData) {
    // Update agent status
    this.updateAgentStatus(agentId, {
      status: 'active',
      currentFocus: reportData.currentFocus || 'Active',
      blockers: reportData.blockers || []
    });

    // Update relevant metrics based on agent domain
    if (agentId === 'growth-agent' && reportData.metrics) {
      if (reportData.metrics.costPerLead) {
        this.updateBusinessMetrics('revenue', 'Cost Per Lead', reportData.metrics.costPerLead);
      }
      if (reportData.metrics.dailySpend) {
        this.updateBusinessMetrics('revenue', 'Meta Ads Daily Spend', reportData.metrics.dailySpend);
      }
    }

    if (agentId === 'operations-agent' && reportData.metrics) {
      if (reportData.metrics.overduePayments) {
        this.updateBusinessMetrics('operations', 'Overdue Payments', reportData.metrics.overduePayments, 'critical');
      }
      if (reportData.metrics.disputeRate) {
        this.updateBusinessMetrics('operations', 'Dispute Rate', reportData.metrics.disputeRate);
      }
    }

    if (agentId === 'client-success-agent' && reportData.metrics) {
      if (reportData.metrics.averageLifetime) {
        this.updateBusinessMetrics('clients', 'Average Customer Lifetime', reportData.metrics.averageLifetime);
      }
    }
  }

  // Update project status from agent work
  updateProjectStatus(projectId, statusUpdate) {
    const projects = this.loadJSON(this.projectsFile);
    const projectIndex = projects.findIndex(p => p.id === projectId);
    
    if (projectIndex >= 0) {
      projects[projectIndex] = {
        ...projects[projectIndex],
        ...statusUpdate,
        updatedAt: new Date().toISOString()
      };
      this.saveJSON(this.projectsFile, projects);
      console.log(`Updated project ${projectId}`);
    }
  }

  // Generate dashboard summary from all agent data
  generateDashboardSummary() {
    const agents = this.loadJSON(this.agentsFile);
    const metrics = this.loadJSON(this.metricsFile);
    
    const summary = {
      timestamp: new Date().toISOString(),
      agentHealth: {
        total: agents.length,
        active: agents.filter(a => a.status === 'active').length,
        blocked: agents.filter(a => a.blockers?.length > 0).length
      },
      criticalMetrics: [],
      recentUpdates: []
    };

    // Identify critical metrics (not meeting targets)
    metrics.forEach(category => {
      category.metrics.forEach(metric => {
        const value = parseFloat(metric.value);
        const target = parseFloat(metric.target);
        
        if (metric.trend === 'critical' || 
           (metric.name.includes('Rate') && value > target) ||
           (metric.name.includes('Payments') && value > 0)) {
          summary.criticalMetrics.push({
            name: metric.name,
            value: metric.value,
            target: metric.target,
            category: category.category
          });
        }
      });
    });

    return summary;
  }

  // Utility methods
  loadJSON(filePath) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      console.error(`Error loading ${filePath}:`, error);
      return [];
    }
  }

  saveJSON(filePath, data) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error saving ${filePath}:`, error);
    }
  }
}

// Example usage for Boss integration
function updateDashboardFromAgentReports(reports) {
  const dashboard = new MissionControlIntegration();
  
  // Process reports from each agent
  reports.forEach(report => {
    dashboard.processAgentReport(report.agentId, report.data);
  });
  
  // Generate and log summary
  const summary = dashboard.generateDashboardSummary();
  console.log('Dashboard Summary:', summary);
  
  return summary;
}

// Export for use in OpenClaw agent coordination
module.exports = {
  MissionControlIntegration,
  updateDashboardFromAgentReports
};