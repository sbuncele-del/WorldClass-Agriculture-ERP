# SiyaBusa ERP
## Incident Post-Mortem Template

---

**Document Version:** 1.0  
**Department:** Engineering / Operations  
**Classification:** Internal

---

## Incident Overview

| Field | Value |
|-------|-------|
| **Incident ID** | INC-[YEAR]-[NUMBER] |
| **Incident Title** | [Brief descriptive title] |
| **Severity** | ☐ P1 Critical ☐ P2 High ☐ P3 Medium ☐ P4 Low |
| **Date of Incident** | [Date] |
| **Time Detected (SAST)** | [Time] |
| **Time Resolved (SAST)** | [Time] |
| **Total Duration** | [X hours Y minutes] |
| **Report Author** | [Name] |
| **Report Date** | [Date] |
| **Review Meeting Date** | [Date] |

---

## Executive Summary

*Write a 2-3 paragraph summary of the incident, suitable for executive stakeholders.*

### What Happened

[Brief description of the incident - what broke, what was affected]

### Business Impact

[Summary of customer/business impact - number of customers affected, revenue impact, etc.]

### Key Takeaways

[1-3 bullet points summarizing the most important learnings]

---

## Incident Timeline

*All times in SAST (South Africa Standard Time)*

| Time | Event | Actor |
|------|-------|-------|
| [Time] | **TRIGGER:** [What initiated the incident] | [System/Person] |
| [Time] | **DETECTION:** [How the incident was detected] | [Monitoring/Person] |
| [Time] | **ALERT:** [First alert triggered] | [System] |
| [Time] | **ACKNOWLEDGE:** [Incident acknowledged] | [Person] |
| [Time] | **ESCALATION:** [Escalation to additional team members] | [Person] |
| [Time] | **INVESTIGATION:** [Key investigation activities] | [Person] |
| [Time] | **ROOT CAUSE:** [Root cause identified] | [Person] |
| [Time] | **MITIGATION:** [Mitigation actions taken] | [Person] |
| [Time] | **RESOLUTION:** [Incident resolved] | [Person] |
| [Time] | **VERIFICATION:** [Resolution verified] | [Person] |
| [Time] | **ALL CLEAR:** [Incident closed] | [Person] |

---

## Impact Assessment

### Customer Impact

| Metric | Value |
|--------|-------|
| **Tenants Affected** | [Number / Percentage] |
| **Users Unable to Access** | [Number] |
| **Transactions Failed** | [Number] |
| **Data Loss** | ☐ Yes ☐ No |
| **Data Exposure** | ☐ Yes ☐ No |

### Service Impact

| Service/Module | Impact Level | Description |
|----------------|:------------:|-------------|
| Financial Accounting | ☐ Full ☐ Partial ☐ None | [Details] |
| Inventory | ☐ Full ☐ Partial ☐ None | [Details] |
| Sales & CRM | ☐ Full ☐ Partial ☐ None | [Details] |
| HR & Payroll | ☐ Full ☐ Partial ☐ None | [Details] |
| API | ☐ Full ☐ Partial ☐ None | [Details] |
| Reporting | ☐ Full ☐ Partial ☐ None | [Details] |
| [Other] | ☐ Full ☐ Partial ☐ None | [Details] |

### Business Impact

| Impact Type | Assessment |
|-------------|------------|
| **Revenue Impact** | R[Amount] or N/A |
| **SLA Breach** | ☐ Yes ☐ No |
| **Service Credits Owed** | R[Amount] or N/A |
| **Reputational Impact** | ☐ High ☐ Medium ☐ Low ☐ None |
| **Support Ticket Volume** | [Number] tickets created |
| **Customer Escalations** | [Number] escalations |

---

## Root Cause Analysis

### Contributing Factors

*List all factors that contributed to the incident*

| Factor | Category | Description |
|--------|----------|-------------|
| Factor 1 | ☐ Technical ☐ Process ☐ Human | [Description] |
| Factor 2 | ☐ Technical ☐ Process ☐ Human | [Description] |
| Factor 3 | ☐ Technical ☐ Process ☐ Human | [Description] |

### Root Cause

*Describe the root cause(s) using the 5 Whys technique*

**Problem Statement:** [What failed/happened]

1. **Why?** [First why]
2. **Why?** [Second why]
3. **Why?** [Third why]
4. **Why?** [Fourth why]
5. **Why?** [Root cause - the fundamental reason]

### Root Cause Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                      ROOT CAUSE SUMMARY                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Write a clear, concise statement of the root cause]           │
│                                                                 │
│  Example:                                                       │
│  "The database connection pool was exhausted due to a memory    │
│   leak in the query optimizer introduced in release v2.5.3.     │
│   This caused cascading failures in the API layer when          │
│   connections could not be obtained within the timeout period." │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Technical Details

*Include relevant technical information for engineering reference*

**Affected Components:**
- [Component 1]
- [Component 2]

**Error Messages/Logs:**
```
[Paste relevant error messages or log entries]
```

**Metrics/Graphs:**
*[Attach or reference relevant dashboards, graphs, or metrics]*

---

## Detection and Response

### Detection

| Question | Answer |
|----------|--------|
| **How was the incident detected?** | ☐ Monitoring Alert ☐ Customer Report ☐ Internal Discovery ☐ Other |
| **Detection Method** | [Specific alert/report that triggered detection] |
| **Time to Detect (TTD)** | [Time from incident start to detection] |
| **Was detection timely?** | ☐ Yes ☐ No - [Explain] |

### Response

| Question | Answer |
|----------|--------|
| **Time to Acknowledge** | [Minutes from alert to acknowledgment] |
| **Time to Mitigate** | [Time from detection to mitigation] |
| **Time to Resolve** | [Total time from detection to resolution] |
| **Response Team** | [List team members involved] |
| **Escalation Path** | [Was escalation needed? Who was escalated to?] |

### Response Evaluation

| Aspect | Rating | Notes |
|--------|:------:|-------|
| Detection Speed | ☐ Good ☐ Adequate ☐ Needs Improvement | [Notes] |
| Initial Response | ☐ Good ☐ Adequate ☐ Needs Improvement | [Notes] |
| Communication | ☐ Good ☐ Adequate ☐ Needs Improvement | [Notes] |
| Technical Response | ☐ Good ☐ Adequate ☐ Needs Improvement | [Notes] |
| Coordination | ☐ Good ☐ Adequate ☐ Needs Improvement | [Notes] |
| Documentation | ☐ Good ☐ Adequate ☐ Needs Improvement | [Notes] |

---

## Resolution and Recovery

### Mitigation Actions

*What was done to stop the immediate impact*

| # | Action | Time | Result |
|---|--------|------|--------|
| 1 | [Action taken] | [Time] | [Outcome] |
| 2 | [Action taken] | [Time] | [Outcome] |
| 3 | [Action taken] | [Time] | [Outcome] |

### Resolution Actions

*What was done to fully resolve the incident*

| # | Action | Time | Result |
|---|--------|------|--------|
| 1 | [Action taken] | [Time] | [Outcome] |
| 2 | [Action taken] | [Time] | [Outcome] |
| 3 | [Action taken] | [Time] | [Outcome] |

### Recovery Verification

| Check | Status | Verified By |
|-------|:------:|-------------|
| Service restored | ☐ Pass ☐ Fail | [Name] |
| Data integrity confirmed | ☐ Pass ☐ Fail ☐ N/A | [Name] |
| Performance normalized | ☐ Pass ☐ Fail | [Name] |
| Monitoring confirmed | ☐ Pass ☐ Fail | [Name] |
| Customer verification | ☐ Pass ☐ Fail ☐ N/A | [Name] |

---

## Communication

### Internal Communication

| Audience | Method | Time | Content |
|----------|--------|------|---------|
| On-call Engineer | PagerDuty | [Time] | Initial alert |
| Engineering Team | Slack | [Time] | Incident channel created |
| Management | Email | [Time] | Status update |
| Executive Team | Email | [Time] | Impact summary |

### External Communication

| Audience | Method | Time | Content |
|----------|--------|------|---------|
| Status Page | status.siyabusa.com | [Time] | [Status update] |
| Affected Customers | Email | [Time] | [Notification content] |
| All Customers | Email | [Time] | [Post-incident summary] |

### Communication Evaluation

| Question | Answer |
|----------|--------|
| Was communication timely? | ☐ Yes ☐ No - [Explain] |
| Was communication accurate? | ☐ Yes ☐ No - [Explain] |
| Were appropriate stakeholders informed? | ☐ Yes ☐ No - [Missing: X] |
| Any customer complaints about communication? | ☐ Yes ☐ No |

---

## What Went Well

*List things that worked well during the incident*

| # | What Went Well | Why It Helped |
|---|----------------|---------------|
| 1 | [Description] | [Impact] |
| 2 | [Description] | [Impact] |
| 3 | [Description] | [Impact] |
| 4 | [Description] | [Impact] |

---

## What Went Wrong

*List things that didn't work well or could be improved*

| # | What Went Wrong | Impact |
|---|-----------------|--------|
| 1 | [Description] | [Impact] |
| 2 | [Description] | [Impact] |
| 3 | [Description] | [Impact] |
| 4 | [Description] | [Impact] |

---

## Where We Got Lucky

*List things that could have made the incident worse but didn't*

| # | Lucky Factor | Potential Impact If Unlucky |
|---|--------------|----------------------------|
| 1 | [Description] | [What could have happened] |
| 2 | [Description] | [What could have happened] |

---

## Action Items

### Immediate Actions (Complete within 1 week)

| # | Action Item | Owner | Due Date | Status |
|---|-------------|-------|----------|--------|
| 1 | [Action description] | [Name] | [Date] | ☐ Open ☐ In Progress ☐ Complete |
| 2 | [Action description] | [Name] | [Date] | ☐ Open ☐ In Progress ☐ Complete |
| 3 | [Action description] | [Name] | [Date] | ☐ Open ☐ In Progress ☐ Complete |

### Short-Term Actions (Complete within 30 days)

| # | Action Item | Owner | Due Date | Status |
|---|-------------|-------|----------|--------|
| 1 | [Action description] | [Name] | [Date] | ☐ Open ☐ In Progress ☐ Complete |
| 2 | [Action description] | [Name] | [Date] | ☐ Open ☐ In Progress ☐ Complete |
| 3 | [Action description] | [Name] | [Date] | ☐ Open ☐ In Progress ☐ Complete |

### Long-Term Actions (Complete within 90 days)

| # | Action Item | Owner | Due Date | Status |
|---|-------------|-------|----------|--------|
| 1 | [Action description] | [Name] | [Date] | ☐ Open ☐ In Progress ☐ Complete |
| 2 | [Action description] | [Name] | [Date] | ☐ Open ☐ In Progress ☐ Complete |
| 3 | [Action description] | [Name] | [Date] | ☐ Open ☐ In Progress ☐ Complete |

### Prevention Actions

| Category | Action | Owner | Priority |
|----------|--------|-------|:--------:|
| **Monitoring** | [Improve detection] | [Name] | ☐ High ☐ Medium ☐ Low |
| **Automation** | [Automate response] | [Name] | ☐ High ☐ Medium ☐ Low |
| **Documentation** | [Update runbooks] | [Name] | ☐ High ☐ Medium ☐ Low |
| **Training** | [Team training needed] | [Name] | ☐ High ☐ Medium ☐ Low |
| **Architecture** | [System improvements] | [Name] | ☐ High ☐ Medium ☐ Low |
| **Process** | [Process improvements] | [Name] | ☐ High ☐ Medium ☐ Low |

---

## Lessons Learned

### Key Learnings

*What should the team take away from this incident?*

1. **[Learning 1 Title]**
   - [Detailed explanation]
   - [How this will change our approach]

2. **[Learning 2 Title]**
   - [Detailed explanation]
   - [How this will change our approach]

3. **[Learning 3 Title]**
   - [Detailed explanation]
   - [How this will change our approach]

### Process Improvements

| Current State | Recommended Change | Expected Benefit |
|---------------|-------------------|------------------|
| [Current process] | [New process] | [Benefit] |
| [Current process] | [New process] | [Benefit] |

---

## Supporting Documentation

### Related Documents

| Document | Link/Location |
|----------|---------------|
| Incident Ticket | [Link] |
| Related Tickets | [Links] |
| Monitoring Dashboards | [Link] |
| Runbook Used | [Link] |
| Change Request (if applicable) | [Link] |

### Attachments

- [ ] Timeline diagram
- [ ] Architecture diagram
- [ ] Relevant logs
- [ ] Monitoring screenshots
- [ ] Communication samples

---

## Post-Mortem Review

### Review Meeting

| Field | Value |
|-------|-------|
| **Date** | [Date] |
| **Attendees** | [List of attendees] |
| **Duration** | [X] minutes |

### Review Outcomes

*Summary of decisions made during the post-mortem review*

1. [Decision/Outcome 1]
2. [Decision/Outcome 2]
3. [Decision/Outcome 3]

### Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| **Incident Commander** | | | |
| **Engineering Lead** | | | |
| **Operations Lead** | | | |
| **Product Owner** | | | |

---

## Appendix

### A. Severity Definitions

| Severity | Definition | Response Time |
|----------|------------|:-------------:|
| **P1 - Critical** | Service completely unavailable; major business impact | 15 minutes |
| **P2 - High** | Major feature unavailable; significant impact | 1 hour |
| **P3 - Medium** | Feature degraded; moderate impact | 4 hours |
| **P4 - Low** | Minor issue; minimal impact | 8 hours |

### B. Post-Mortem Process

1. **Incident Resolved** → Document immediate findings
2. **Within 24 hours** → Draft post-mortem document
3. **Within 48 hours** → Complete technical analysis
4. **Within 5 business days** → Conduct post-mortem review meeting
5. **Within 7 business days** → Finalize document and action items
6. **Ongoing** → Track action items to completion

### C. Blameless Culture

This post-mortem follows a **blameless** approach:
- Focus on systems and processes, not individuals
- Assume everyone acted with the best intentions
- Look for systemic improvements, not punishments
- Create a safe environment to share information
- Use incidents as learning opportunities

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| Draft | [Date] | [Name] | Initial draft |
| 1.0 | [Date] | [Name] | Finalized after review |

---

*SiyaBusa ERP - Powering African Business*

**© 2026 Masaphokati Technologies (Pty) Ltd. All Rights Reserved.**
