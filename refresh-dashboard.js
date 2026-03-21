#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Simple dashboard refresh script
console.log('🚀 Refreshing Mission Control Dashboard...');

// Read all data files
const dataDir = path.join(__dirname, 'data');
const files = ['agents.json', 'business-metrics.json', 'projects.json', 'tasks.json', 'overnight.json', 'communications.json', 'decisions.json'];

let allData = {};
let errors = [];

files.forEach(file => {
  try {
    const filePath = path.join(dataDir, file);
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      allData[file.replace('.json', '')] = data;
      console.log(`✅ Loaded ${file}`);
    } else {
      console.log(`⚠️  ${file} not found`);
    }
  } catch (error) {
    errors.push(`❌ Error loading ${file}: ${error.message}`);
  }
});

// Calculate summary metrics
const summary = {
  timestamp: new Date().toISOString(),
  totalAgents: allData.agents ? allData.agents.length : 0,
  activeAgents: allData.agents ? allData.agents.filter(a => a.status === 'active').length : 0,
  criticalTasks: allData.tasks ? allData.tasks.filter(t => t.priority === 'CRITICAL').length : 0,
  highPriorityProjects: allData.projects ? allData.projects.filter(p => p.priority === 'HIGH').length : 0,
  totalResourceRequests: allData.tasks ? allData.tasks.filter(t => t.status === 'waiting_input').length : 0
};

// Financial impact calculation
let totalDailyImpact = 0;
if (allData.projects) {
  allData.projects.forEach(project => {
    if (project.financialImpact && project.financialImpact.currentLoss) {
      const loss = parseFloat(project.financialImpact.currentLoss);
      const timeframe = project.financialImpact.timeframe;
      
      switch (timeframe) {
        case 'daily': totalDailyImpact += loss; break;
        case 'weekly': totalDailyImpact += loss / 7; break;
        case 'monthly': totalDailyImpact += loss / 30; break;
      }
    }
  });
}

summary.totalDailyImpact = totalDailyImpact;

// Save combined dashboard data
const dashboardData = {
  ...allData,
  summary,
  lastRefresh: new Date().toISOString(),
  errors
};

fs.writeFileSync(path.join(__dirname, 'dashboard-state.json'), JSON.stringify(dashboardData, null, 2));

console.log('\n📊 Dashboard Summary:');
console.log(`   Active Agents: ${summary.activeAgents}/${summary.totalAgents}`);
console.log(`   Critical Tasks: ${summary.criticalTasks}`);
console.log(`   High Priority Projects: ${summary.highPriorityProjects}`);
console.log(`   Daily Financial Impact: $${summary.totalDailyImpact.toFixed(2)}`);
console.log(`   Resource Requests: ${summary.totalResourceRequests}`);

if (errors.length > 0) {
  console.log('\n⚠️  Errors:');
  errors.forEach(error => console.log(`   ${error}`));
}

console.log('\n✅ Dashboard refresh complete!');
console.log(`📍 View at: https://mission-control-vowh.onrender.com/`);