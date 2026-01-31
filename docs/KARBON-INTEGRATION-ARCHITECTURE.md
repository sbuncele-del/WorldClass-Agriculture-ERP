# KARBON AUTONOMOUS PRACTICE INTEGRATION ARCHITECTURE

**Vision:** Fusing Worldclass ERP with AI-powered Practice Management  
**Date:** November 7, 2025  
**Status:** 🏗️ **DESIGN PHASE**

---

## 🎯 EXECUTIVE VISION

Transform professional services firms by integrating **financial intelligence** (ERP) with **operational intelligence** (Practice Management), powered by **AI co-pilots** that predict, recommend, and automate.

### The Big Picture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      CLIENT EXPERIENCE LAYER                         │
│              Unified Portal • Mobile Apps • AI Chat                  │
└────────────┬────────────────────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────────────────────┐
│                   KARBON AUTONOMOUS PRACTICE                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Client Hub  │  │ Flow Engine  │  │ Insight AI   │              │
│  │  (360° View) │  │ (Workflows)  │  │ (Knowledge)  │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                  │                       │
│  ┌──────▼─────────────────▼──────────────────▼───────┐              │
│  │         PRACTICE DATA WAREHOUSE                    │              │
│  │  Projects • Tasks • Time • Documents • Comms       │              │
│  └──────┬─────────────────────────────────────────────┘              │
└─────────┼─────────────────────────────────────────────────────────────┘
          │
          │ Real-time Bidirectional Sync
          │
┌─────────▼─────────────────────────────────────────────────────────────┐
│                      WORLDCLASS ERP CORE                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │Financial │  │ Sales &  │  │Inventory │  │   HR &   │             │
│  │  (GL)    │  │   CRM    │  │Management│  │ Payroll  │             │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘             │
│                                                                        │
│  🔗 Existing: 28,070+ lines, 4 complete modules, Production Ready     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ INTEGRATION LAYERS

### Layer 1: **Shared Client Master Data**

**Objective:** Single source of truth for all client information

```typescript
// Unified Client Record
interface UnifiedClient {
  // From ERP (existing sales_invoices, customers)
  client_id: string;
  financial_data: {
    total_revenue_ytd: number;
    outstanding_balance: number;
    payment_terms: string;
    credit_limit: number;
    last_payment_date: Date;
    average_days_to_pay: number;
  };
  
  // From Practice Management (new)
  practice_data: {
    active_projects: number;
    total_projects_completed: number;
    primary_service_line: string;
    assigned_team: string[];
    relationship_manager: string;
    last_interaction_date: Date;
  };
  
  // AI-Generated (new)
  health_metrics: {
    overall_score: number; // 0-100
    profitability_trend: 'improving' | 'stable' | 'declining';
    engagement_score: number;
    churn_risk: 'low' | 'medium' | 'high';
    recommended_actions: string[];
  };
}
```

**Database Design:**
```sql
-- Extend existing customers table
ALTER TABLE customers ADD COLUMN practice_client_id UUID;
ALTER TABLE customers ADD COLUMN relationship_manager_id INTEGER;
ALTER TABLE customers ADD COLUMN service_tier VARCHAR(20); -- Platinum, Gold, Silver, Bronze
ALTER TABLE customers ADD COLUMN health_score INTEGER; -- 0-100
ALTER TABLE customers ADD COLUMN churn_risk VARCHAR(10); -- low, medium, high
ALTER TABLE customers ADD COLUMN last_health_check_date TIMESTAMP;

-- New Practice Integration Tables
CREATE TABLE client_projects (
  project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id INTEGER REFERENCES customers(customer_id),
  project_number VARCHAR(50) UNIQUE NOT NULL,
  project_name VARCHAR(200) NOT NULL,
  project_type VARCHAR(50), -- Audit, Tax, Advisory, Compliance
  status VARCHAR(20), -- Planning, Active, On Hold, Completed, Cancelled
  start_date DATE,
  target_end_date DATE,
  actual_end_date DATE,
  budget_hours DECIMAL(10,2),
  actual_hours DECIMAL(10,2),
  budget_amount DECIMAL(15,2),
  actual_cost DECIMAL(15,2),
  billed_amount DECIMAL(15,2),
  project_manager_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project_team_members (
  assignment_id SERIAL PRIMARY KEY,
  project_id UUID REFERENCES client_projects(project_id),
  employee_id INTEGER REFERENCES employees(employee_id),
  role VARCHAR(50), -- Lead, Senior, Staff, Admin
  allocated_hours DECIMAL(8,2),
  hourly_rate DECIMAL(10,2),
  assignment_date DATE,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE time_entries (
  entry_id SERIAL PRIMARY KEY,
  project_id UUID REFERENCES client_projects(project_id),
  employee_id INTEGER REFERENCES employees(employee_id),
  entry_date DATE NOT NULL,
  hours DECIMAL(5,2) NOT NULL,
  billable BOOLEAN DEFAULT true,
  activity_code VARCHAR(50),
  description TEXT,
  status VARCHAR(20), -- Draft, Submitted, Approved, Rejected, Billed
  suggested_by_ai BOOLEAN DEFAULT false, -- Ambient time tracking flag
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP,
  approved_by INTEGER
);

CREATE TABLE client_interactions (
  interaction_id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(customer_id),
  project_id UUID REFERENCES client_projects(project_id),
  interaction_type VARCHAR(50), -- Email, Call, Meeting, Document
  interaction_date TIMESTAMP,
  employee_id INTEGER REFERENCES employees(employee_id),
  subject VARCHAR(200),
  summary TEXT,
  sentiment_score DECIMAL(3,2), -- -1.0 to 1.0 (AI-analyzed)
  action_items TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE client_health_log (
  log_id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(customer_id),
  check_date DATE NOT NULL,
  health_score INTEGER, -- 0-100
  profitability_score INTEGER,
  engagement_score INTEGER,
  payment_score INTEGER,
  factors JSONB, -- Detailed breakdown
  recommendations TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### Layer 2: **Financial Intelligence API**

**Objective:** Expose ERP financial data to Practice Management layer

```typescript
// New API Endpoints for Practice Integration
interface PracticeFinancialAPI {
  
  // Client Financial Health
  '/api/practice/clients/:id/financial-health': {
    revenue_trend: TimeSeriesData[];
    payment_reliability: {
      average_days_to_pay: number;
      on_time_payment_rate: number;
      current_aging: AgingBucket[];
    };
    profitability: {
      total_revenue: number;
      total_cost: number;
      gross_margin: number;
      margin_trend: 'up' | 'down' | 'stable';
    };
  };
  
  // Project Profitability (Real-time)
  '/api/practice/projects/:id/profitability': {
    budget_vs_actual: {
      budget_hours: number;
      actual_hours: number;
      variance_hours: number;
      variance_percentage: number;
    };
    financial: {
      budget_amount: number;
      actual_cost: number;
      billed_amount: number;
      profit_margin: number;
      roi: number;
    };
    alerts: Alert[];
  };
  
  // Resource Cost Rates
  '/api/practice/employees/:id/cost-rate': {
    employee_id: number;
    base_salary: number;
    loaded_cost_rate: number; // Including benefits, overhead
    standard_billing_rate: number;
    actual_utilization: number;
  };
}
```

---

### Layer 3: **AI Co-Pilot Engine**

**Objective:** Predictive analytics and intelligent automation

#### 3.1 Client Health Scoring Algorithm

```typescript
interface ClientHealthEngine {
  calculateHealthScore(clientId: number): Promise<HealthScore>;
}

class HealthScore {
  overall: number; // 0-100
  
  components: {
    financial: {
      score: number;
      factors: {
        payment_reliability: number; // On-time payment rate
        revenue_trend: number; // Growing, stable, declining
        profitability: number; // Margin on services
      };
    };
    
    engagement: {
      score: number;
      factors: {
        interaction_frequency: number; // Regular touchpoints
        sentiment_analysis: number; // Positive/negative communications
        project_activity: number; // Active projects count
      };
    };
    
    operational: {
      score: number;
      factors: {
        project_completion_rate: number;
        scope_change_frequency: number;
        dispute_history: number;
      };
    };
  };
  
  predictions: {
    churn_risk: 'low' | 'medium' | 'high';
    churn_probability: number; // 0-1
    revenue_forecast_12m: number;
    recommended_actions: Action[];
  };
}

// Example Calculation
function calculateHealthScore(client: UnifiedClient): number {
  const weights = {
    financial: 0.40,
    engagement: 0.35,
    operational: 0.25
  };
  
  const financialScore = (
    client.payment_reliability * 0.4 +
    client.revenue_growth * 0.3 +
    client.profitability * 0.3
  );
  
  const engagementScore = (
    client.interaction_score * 0.5 +
    client.sentiment_score * 0.3 +
    client.project_activity_score * 0.2
  );
  
  const operationalScore = (
    client.delivery_quality * 0.6 +
    (1 - client.scope_changes) * 0.2 +
    (1 - client.disputes) * 0.2
  );
  
  return (
    financialScore * weights.financial +
    engagementScore * weights.engagement +
    operationalScore * weights.operational
  ) * 100;
}
```

#### 3.2 AI-Based Resource Allocation

```typescript
interface TalentGraph {
  employee_id: number;
  skills: Skill[];
  certifications: Certification[];
  experience_years: number;
  current_utilization: number; // % of capacity
  current_projects: number;
  career_goals: string[];
  performance_rating: number;
  preference_scores: {
    industry: Record<string, number>;
    project_type: Record<string, number>;
  };
}

interface StaffingRecommendation {
  recommended_team: TeamMember[];
  confidence_score: number;
  reasoning: {
    skill_match: string;
    capacity_available: string;
    development_opportunity: string;
  };
  alternatives: TeamMember[][];
}

// AI Staffing Algorithm
async function recommendTeam(
  project: ClientProject,
  requiredSkills: Skill[]
): Promise<StaffingRecommendation> {
  
  // 1. Find employees with matching skills
  const candidates = await findCandidatesBySkills(requiredSkills);
  
  // 2. Score each candidate
  const scored = candidates.map(emp => ({
    employee: emp,
    score: calculateFitScore(emp, project, requiredSkills)
  }));
  
  // 3. Optimize for team composition
  const optimalTeam = optimizeTeam(scored, {
    balanceSeniorJunior: true,
    considerWorkload: true,
    includeDevelopment: true
  });
  
  return {
    recommended_team: optimalTeam,
    confidence_score: calculateConfidence(optimalTeam),
    reasoning: generateReasoning(optimalTeam, project)
  };
}

function calculateFitScore(
  employee: TalentGraph,
  project: ClientProject,
  skills: Skill[]
): number {
  const skillMatch = calculateSkillMatch(employee.skills, skills);
  const capacityScore = 1 - employee.current_utilization;
  const industryFit = employee.preference_scores.industry[project.industry] || 0.5;
  const developmentValue = calculateDevelopmentValue(employee, project);
  
  return (
    skillMatch * 0.40 +
    capacityScore * 0.25 +
    industryFit * 0.20 +
    developmentValue * 0.15
  );
}
```

#### 3.3 Bottleneck Prediction

```typescript
interface BottleneckPredictor {
  analyzeProject(projectId: string): Promise<BottleneckAnalysis>;
}

interface BottleneckAnalysis {
  predicted_bottlenecks: Bottleneck[];
  risk_level: 'low' | 'medium' | 'high';
  recommended_mitigations: Mitigation[];
}

interface Bottleneck {
  task_name: string;
  predicted_delay_days: number;
  probability: number;
  root_cause: string;
  impact: {
    timeline: string;
    budget: string;
    quality: string;
  };
}

// Machine Learning Model
class BottleneckML {
  async predict(project: ClientProject): Promise<BottleneckAnalysis> {
    // Historical analysis
    const similarProjects = await findSimilarProjects(project);
    const taskCompletionHistory = await getTaskCompletionData(similarProjects);
    
    // Current project analysis
    const currentProgress = await analyzeCurrentProgress(project);
    const resourceConstraints = await analyzeResourceAvailability(project);
    
    // Predict delays
    const predictions = taskCompletionHistory.map(task => {
      const estimatedDuration = task.estimated_hours;
      const historicalAverage = task.actual_hours_average;
      const variance = historicalAverage - estimatedDuration;
      
      if (variance > estimatedDuration * 0.2) {
        return {
          task_name: task.name,
          predicted_delay_days: Math.ceil(variance / 8), // 8 hours/day
          probability: task.delay_frequency,
          root_cause: identifyRootCause(task)
        };
      }
    });
    
    return {
      predicted_bottlenecks: predictions.filter(Boolean),
      risk_level: calculateRiskLevel(predictions),
      recommended_mitigations: generateMitigations(predictions)
    };
  }
}
```

---

### Layer 4: **Ambient Intelligence Features**

#### 4.1 Ambient Time Tracking

```typescript
interface AmbientTimeTracker {
  suggestTimeEntries(employeeId: number, date: Date): Promise<SuggestedEntry[]>;
}

interface SuggestedEntry {
  project_id: string;
  hours: number;
  activity_code: string;
  description: string;
  confidence: number; // 0-1
  evidence: Evidence[];
}

interface Evidence {
  type: 'calendar' | 'email' | 'document' | 'commit';
  timestamp: Date;
  summary: string;
}

// Implementation
class AmbientTracker {
  async analyzeDayActivity(employeeId: number, date: Date) {
    const calendar = await getCalendarEvents(employeeId, date);
    const emails = await getEmailActivity(employeeId, date);
    const documents = await getDocumentActivity(employeeId, date);
    
    const suggestions: SuggestedEntry[] = [];
    
    // 1. Calendar events linked to projects
    for (const event of calendar) {
      const project = await inferProjectFromEvent(event);
      if (project) {
        suggestions.push({
          project_id: project.id,
          hours: calculateDuration(event.start, event.end),
          activity_code: inferActivityCode(event.title),
          description: event.title,
          confidence: 0.9,
          evidence: [{ type: 'calendar', timestamp: event.start, summary: event.title }]
        });
      }
    }
    
    // 2. Email analysis
    const emailsByProject = groupEmailsByProject(emails);
    for (const [projectId, projectEmails] of Object.entries(emailsByProject)) {
      const estimatedHours = projectEmails.length * 0.15; // 9 min per email
      suggestions.push({
        project_id: projectId,
        hours: estimatedHours,
        activity_code: 'COMM',
        description: `Email correspondence (${projectEmails.length} emails)`,
        confidence: 0.7,
        evidence: projectEmails.map(e => ({
          type: 'email',
          timestamp: e.sent_at,
          summary: e.subject
        }))
      });
    }
    
    return suggestions;
  }
}
```

#### 4.2 Insight Engine - Collective Intelligence

```typescript
interface InsightEngine {
  findRelevantKnowledge(query: string, context: Context): Promise<Insights>;
}

interface Insights {
  similar_projects: Project[];
  best_practices: BestPractice[];
  templates: Template[];
  subject_matter_experts: Employee[];
  research_notes: Document[];
}

// Knowledge Graph
class KnowledgeGraph {
  async query(intent: string, context: Context): Promise<Insights> {
    // Natural language processing
    const parsedIntent = await parseIntent(intent);
    
    // Vector similarity search
    const embedding = await generateEmbedding(intent);
    const similarProjects = await vectorSearch('projects', embedding, {
      filters: {
        industry: context.client.industry,
        service_type: context.service_type
      },
      limit: 10
    });
    
    // Extract patterns from successful projects
    const successfulPatterns = await analyzeSuccessfulProjects(similarProjects);
    
    // Find experts who've worked on similar engagements
    const experts = await findExperts({
      skills: parsedIntent.required_skills,
      experience: similarProjects.map(p => p.id)
    });
    
    return {
      similar_projects: similarProjects,
      best_practices: successfulPatterns.best_practices,
      templates: successfulPatterns.winning_proposals,
      subject_matter_experts: experts,
      research_notes: await findRelatedResearch(parsedIntent.topics)
    };
  }
}
```

---

## 🔄 DATA SYNCHRONIZATION PATTERNS

### Pattern 1: **Event-Driven Sync**

```typescript
// When invoice is created in ERP
eventBus.on('invoice.created', async (invoice) => {
  // Update practice client data
  await updateClientFinancials(invoice.customer_id);
  await recalculateClientHealth(invoice.customer_id);
  
  // Trigger AI analysis
  if (invoice.days_overdue > 30) {
    await aiCoPilot.alertAccountManager({
      client: invoice.customer_id,
      issue: 'payment_delay',
      recommendation: 'schedule_review_call'
    });
  }
});

// When project completes in Practice
eventBus.on('project.completed', async (project) => {
  // Update ERP for revenue recognition
  await createRevenueRecognitionEntry(project);
  
  // Analyze project profitability
  const analysis = await analyzeFinalProfitability(project);
  
  // Learn from outcomes
  await mlEngine.trainFromProject(project, analysis);
});
```

### Pattern 2: **Real-time Dashboard Sync**

```typescript
// WebSocket updates for live data
class RealtimeSyncService {
  subscribeToClient(clientId: number) {
    // Subscribe to ERP changes
    erpEventStream.on(`client.${clientId}.*`, (event) => {
      websocket.send({
        type: 'client_update',
        data: event
      });
    });
    
    // Subscribe to practice changes
    practiceEventStream.on(`client.${clientId}.*`, (event) => {
      websocket.send({
        type: 'practice_update',
        data: event
      });
    });
  }
}
```

---

## 🚀 IMPLEMENTATION ROADMAP

### **Phase 1: Foundation** (Weeks 1-2)
- [ ] Create shared client schema
- [ ] Build Practice Management database tables
- [ ] Create Financial Intelligence API endpoints
- [ ] Implement basic client health scoring

### **Phase 2: Core Features** (Weeks 3-4)
- [ ] Build Project Management module
- [ ] Implement Time Entry system
- [ ] Create Client Hub UI (360° view)
- [ ] Build basic workflow engine

### **Phase 3: AI Features** (Weeks 5-6)
- [ ] Implement predictive client health
- [ ] Build AI staffing recommendations
- [ ] Create bottleneck prediction
- [ ] Implement ambient time tracking

### **Phase 4: Intelligence** (Weeks 7-8)
- [ ] Build Insight Engine knowledge graph
- [ ] Implement document/email analysis
- [ ] Create sentiment analysis
- [ ] Build learning algorithms

---

## 💡 QUICK WINS TO START

1. **Extend Customers Table** - Add practice fields (30 min)
2. **Create Client Projects Table** - Foundation for practice tracking (1 hour)
3. **Build Financial Health API** - Expose ERP data (2 hours)
4. **Simple Health Score** - Basic calculation without AI (2 hours)
5. **Client Hub Dashboard** - Unified view prototype (4 hours)

**Total to MVP:** ~10 hours of focused development

---

## 🎯 SUCCESS METRICS

- **Client Retention:** Improve by 15% via early churn prediction
- **Project Profitability:** Increase by 20% via better resource allocation
- **Time Entry Accuracy:** 95% adoption via ambient tracking
- **Knowledge Reuse:** 40% faster project planning via Insight Engine

---

*This architecture bridges world-class financial management with autonomous practice intelligence, creating an unstoppable platform for professional services firms.*
