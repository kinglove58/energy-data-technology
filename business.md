# Energy Data Network Assurance

Business strategy, operating model, codebase gap analysis, and full pitch deck

Date: 2026-04-02

## What this document is

This document is an inferred business analysis built from the current codebase, not from customer interviews, live utility data, or market research. It explains:

- what the product is already trying to be
- what business it should become if developed beyond MVP
- the business model that best fits the product
- the current technical and product gaps in the code
- a full pitch deck narrative that can be used for fundraising, partnership, or internal alignment

## Executive summary

Energy Data Network Assurance is best understood as a revenue assurance operating system for electric distribution utilities. The product combines executive visibility, anomaly detection, GIS mapping, theft case management, AI-generated reporting, and AI voice outreach into one platform designed to reduce non-technical losses and recover lost revenue.

The repo already proves the intended direction:

- executive dashboard for supplied vs billed energy, loss exposure, regional leakage, and theft pipeline
- analytics and reporting layer for trend analysis and downloadable reports
- GIS incident view for location-based case intelligence
- field operations console for theft case triage, outreach, and resolution workflow
- AI insight generation using Gemini
- AI voice outreach using Vapi
- authentication using Clerk

The strongest business reading is that this product is meant for distribution companies, especially in high-loss markets where energy theft, meter bypass, billing gaps, and weak field coordination materially affect collections. Because the code uses Lagos coordinates, `+234` phone numbers, and the package name `disco-revenue-assurance`, the most likely beachhead market is Nigerian and West African electric distribution companies.

The product is commercially promising, but the current codebase is still a demo-grade front end with thin server wrappers. It does not yet have the persistence, integrations, workflow depth, tenancy, compliance, or operational backbone required to operate as a real utility platform. The opportunity is real. The current implementation is not yet a sellable enterprise system.

## What the codebase already says the company is building

### Core company thesis

The platform is not just a dashboard. It is trying to become the operating layer between utility data, revenue leakage intelligence, field action, and executive recovery reporting.

### Product modules visible in code

1. Executive overview

- tracks energy supplied vs billed
- estimates revenue loss
- shows theft cases pipeline
- shows regional loss concentration
- generates AI insights
- generates executive markdown reports and PDF exports

2. GIS intelligence map

- plots theft or anomaly incidents on Google Maps
- supports basic spatial review of cases
- suggests future use for feeder-level and territory-level loss heatmaps

3. Field operations and theft response

- case list with severity, status, assignee, estimated loss, SLA, and context
- AI outreach flow for customer calls
- call status polling through Vapi
- manual field report entry
- case detail side panel with customer, meter, evidence, and timeline

4. Analytics and reports

- loss reduction trend charts
- theft source breakdown
- generated reports list
- downloadable monthly-style case reports

5. Admin and settings

- user list
- audit logs
- system health cards
- threshold slider
- profile management
- integration placeholders

### Inferred value proposition

The company is building a platform that helps utilities do four things better than they do today:

- detect leakage faster
- prioritize the highest-value revenue recovery opportunities
- coordinate field and customer engagement in one workflow
- explain financial impact to executives and regulators

## Full business definition

### Company mission

Reduce utility revenue leakage by turning fragmented technical, billing, geographic, and field signals into a closed-loop recovery system.

### Company vision

Become the default revenue assurance layer for electric utilities in high-loss markets, then expand into grid intelligence, collections optimization, and regulatory performance reporting.

### The problem

Electric distribution companies lose revenue in ways that are operationally obvious but digitally fragmented:

- power supplied and power billed do not reconcile cleanly
- non-technical losses hide inside theft, tampering, bypass, bad meter reads, data quality issues, and billing process failures
- field teams, analysts, call centers, GIS teams, and executives work in separate systems
- suspected cases are hard to rank by probable recovery value
- reporting is slow, manual, and often not trusted
- utilities know they have leakage, but they do not have a single operating system to detect, investigate, recover, and report on it

### Why utilities buy a product like this

Utilities do not buy dashboards. They buy recovered cash, better collections, lower AT&C loss, faster field response, fewer blind spots, and better executive control.

This product is attractive because it targets:

- direct revenue recovery
- operational efficiency
- field productivity
- auditability
- management visibility
- defensible ROI

### Ideal customer profile

Primary customer:

- electric distribution companies
- regulated or semi-regulated utilities
- utilities with measurable AT&C or non-technical loss pressure
- utilities with fragmented AMI, billing, GIS, and field workflows

Beachhead market:

- Nigerian DISCOs
- West African utilities with similar loss and collections dynamics
- later expansion into other emerging-market utilities with similar conditions

Secondary customers:

- utility holding groups
- regulators who want oversight dashboards
- energy service firms and recovery contractors working on behalf of utilities

### User and buyer map

Daily users:

- revenue assurance analysts
- loss reduction teams
- field operations supervisors
- field investigators
- customer outreach or call center teams

Management users:

- chief commercial officers
- heads of revenue assurance
- heads of customer service
- field operations directors
- CFO and CEO office for recovery and loss dashboards

Economic buyer:

- COO
- CFO
- chief commercial officer
- managing director of the utility

Technical buyer:

- CIO or IT transformation lead
- head of digital transformation
- enterprise architecture team

### What the fully developed product should become

The full product should not stop at anomaly display. It should become a closed-loop utility assurance platform with seven major layers.

1. Data ingestion and utility intelligence layer

- ingest AMI, MDMS, billing, CIS, CRM, GIS, outage, feeder, transformer, payment, and work-order data
- normalize customer, meter, feeder, transformer, and account entities
- maintain an operational graph of asset, customer, and case relationships

2. Detection and scoring layer

- rules for known theft and tamper patterns
- anomaly detection on supply, billing, and consumption mismatch
- feeder and transformer loss analytics
- customer-level risk scoring
- recovery value scoring
- false-positive suppression and analyst review loop

3. Case orchestration layer

- automatic case creation
- SLA and escalation engine
- assignment by geography, severity, and workload
- evidence bundle per case
- supervisor queue and approval workflow
- task management across analyst, field, and customer teams

4. AI engagement layer

- AI summaries for analysts and executives
- voice AI for customer outreach, appointment confirmation, and resolution follow-up
- assisted report generation
- case narrative generation
- recommended next-best-action

5. Recovery and assurance finance layer

- confirmed theft valuation
- recovery tracking
- repayment or settlement workflow
- disputed case handling
- recovery forecast and realized revenue reconciliation

6. GIS and network intelligence layer

- feeder loss heatmaps
- hotspot clustering
- transformer anomaly concentration
- route planning for field teams
- territory performance maps

7. Enterprise layer

- multi-tenant architecture
- role-based access control
- audit trail
- regulatory exports
- benchmark dashboards
- secure API and webhook framework

## Proposed business model

### Revenue model

The strongest business model is hybrid, not pure SaaS.

1. Annual platform subscription

- priced by number of meters, service territory, or number of operational users
- covers dashboards, case management, AI reports, and admin controls

2. Implementation and integration fees

- one-time or phased onboarding fees
- covers data mapping, system integration, workflow configuration, and training

3. Performance-linked recovery fees

- optional share of recovered revenue from cases initiated or materially accelerated by the platform
- attractive in markets where utilities are skeptical of software-only contracts

4. Usage-based add-ons

- AI voice outreach minutes
- premium report generation
- geospatial analytics
- benchmark data products

5. Professional services

- revenue assurance process redesign
- audit support
- field ops optimization
- executive reporting and transformation advisory

### Why this model fits the product

- utilities want low-risk proof of value
- a recovery-share component aligns vendor incentives with the buyer's financial outcome
- implementation work is unavoidable because utility data is fragmented
- recurring subscription revenue becomes strong once the platform is embedded in operations

### Recommended commercial packaging

Platform package:

- core dashboarding
- case management
- AI summaries
- report generation
- admin and user controls

Operations package:

- field workflows
- assignment engine
- outreach workflows
- GIS queueing

Intelligence package:

- anomaly models
- hotspot detection
- recovery scoring
- benchmark views

Enterprise package:

- integrations
- SSO and RBAC
- audit and compliance
- multi-utility portfolio reporting

### Illustrative pricing logic

These are strategic assumptions, not validated pricing.

- setup fee for data onboarding and integration
- annual platform fee tied to utility size
- optional performance fee on validated recovered revenue
- usage pass-through for voice AI and heavy geospatial processing

The commercial story should emphasize guaranteed visibility, faster case throughput, and recovery uplift, not just software seats.

## Operating model

### How delivery should work

1. Discovery and data audit

- identify existing AMI, billing, GIS, customer, and field systems
- assess data quality and available identifiers

2. Data onboarding

- build connectors
- define entity resolution rules
- create baseline leakage and recovery metrics

3. Workflow deployment

- set case thresholds
- configure assignment rules
- define escalation and resolution paths
- train analyst and field teams

4. Prove value

- run on one district, region, or business unit first
- measure detected value, confirmed theft, recovery, and cycle-time reduction

5. Expand

- roll out across zones
- connect more upstream systems
- add regulator and executive reporting

### Internal team required for the business

- utility domain lead
- product manager
- data integration engineers
- ML and analytics engineers
- full-stack product engineers
- GIS specialist
- customer success and implementation team
- revenue assurance subject-matter experts

## Why this company can win

### Moat potential

1. Workflow moat

Once analysts, field teams, and executives all operate inside one system, replacement becomes painful.

2. Data moat

The more cases, feeder signals, billing anomalies, and recovery outcomes the platform sees, the better its prioritization can become.

3. Integration moat

Utility integrations are difficult and sticky. Once connected, the product becomes part of operational infrastructure.

4. Outcome moat

If the platform can prove measurable recovery uplift, it stops being a "nice dashboard" and becomes a cash engine.

### What differentiates the product if executed well

- not only detection, but also response and recovery orchestration
- executive, GIS, and field operations in one product
- AI-generated summaries and reports for non-technical users
- voice AI outreach tied directly to case workflow

## Codebase maturity assessment

### What is real enough to count

- authentication and protected route structure
- server-side route handlers for insights, report generation, and PDF export
- Gemini integration for AI insights and report drafting
- Vapi call start and status polling
- map rendering with Google Maps
- coherent information architecture across dashboard modules

### What is still demo-level

- core business data
- case persistence
- report persistence
- analytics inputs
- admin and user management
- role enforcement
- field workflow updates
- most operational metrics

## Code and product gaps

### Critical gaps

1. There is no persistent data layer

The repo has no database, ORM, or storage model for cases, users, reports, audits, settings, or webhook outcomes. Most domain data lives in client-side arrays. That means the product currently cannot operate as a system of record.

Business impact:

- no customer can trust the platform operationally
- no auditability
- no recovery history
- no longitudinal learning loop

2. The production build currently fails

The app does not currently ship cleanly because `app/api/auth/[...clerk]/route.ts` re-exports `GET` and `POST` from `@clerk/nextjs/server`, but those exports are not available in the installed Clerk package. This is an immediate delivery blocker.

Business impact:

- the current product cannot be reliably deployed as-is
- even a demo handoff is at risk

3. There is no multi-tenant or enterprise access model

Any signed-in user can reach admin pages. There is no meaningful RBAC, org scoping, environment-level policy enforcement, or customer data partitioning visible in the app.

Business impact:

- not enterprise-safe
- not regulator-safe
- not usable across business units or multiple utilities

4. There are no real utility system integrations

No billing, meter, GIS, CRM, MDMS, payment, outage, or work-order integrations are present.

Business impact:

- the product has no reliable source of truth
- value claims are not yet tied to actual utility operations

### High-priority gaps

5. Most business metrics are mocked or randomly generated

Executive overview creates synthetic trend data with `Math.random()`. Field ops cases are hardcoded. Analytics charts are static. Admin health cards are hardcoded.

Business impact:

- the current product demonstrates concept, not operational capability
- ROI cannot be proven from the software itself

6. Case workflow is not truly functional

Manual report submission triggers a browser alert instead of creating a case. Resolve and escalate actions are also alerts. Search UI is present but not connected. "Pull Next Assignment" is a dead-end card.

Business impact:

- field teams cannot actually run work through the system
- no cycle-time or throughput measurement is possible

7. Voice AI orchestration is incomplete

Start call and poll status are implemented, but stop is only acknowledged and not executed through REST. Webhook events are logged but not persisted. No transcript handling, outcome classification, retry policy, consent tracking, or customer follow-up state exists.

Business impact:

- AI outreach cannot yet be trusted as part of a real collections or theft-response workflow

8. Reporting is partially real but not productized

Executive report generation works through server routes and PDF rendering, but analytics reports are fake downloads generated in the browser. There is no report library, scheduling, retention, permissions, or regulatory export workflow.

Business impact:

- reporting is still demo-grade
- executive and regulator value is under-realized

9. GIS is present but shallow

Incidents are hardcoded. There are no feeders, transformers, zones, routes, asset layers, clustering, polygons, or geospatial analytics workflows.

Business impact:

- GIS is currently visualization, not operational intelligence

10. Settings are not actually system settings

Thresholds, notification toggles, and integration displays are not persisted into platform behavior. The Vapi connection state is effectively decorative.

Business impact:

- the platform cannot be configured in a controlled way by customers

### Medium-priority gaps

11. Observability, resilience, and rate limiting are thin

Rate limiting is in-memory only. Errors are only logged locally outside production. There is no durable event store, retry system, queue, tracing, alerting, or uptime reporting beyond a simple health endpoint.

Business impact:

- weak production reliability
- weak enterprise trust

12. Compliance and governance are not ready

There is no evidence of consent management for AI calling, no audit-grade workflow logs, no case evidence retention model, and no clear data governance approach.

Business impact:

- hard to sell into regulated utility environments

13. Branding is inconsistent

The repo uses multiple names: `disco-revenue-assurance`, Energy Data Network Assurance, Energy Data Network, EDN AI, and DisCoShield AI System.

Business impact:

- weakens sales story
- makes investor and customer messaging less credible

14. There is no test or release discipline visible

No test suite, no CI workflow, and at least one production build blocker are present.

Business impact:

- delivery confidence is low
- enterprise procurement will be harder

## What "full product" should mean

If the goal is "not MVP", then the finished version of this company should look like this:

- real-time or daily ingest from utility systems
- persistent case graph linking customer, account, meter, transformer, feeder, geography, and billing history
- anomaly scoring engine with configurable thresholds and analyst review
- field dispatch with mobile-first workflow and offline support
- AI voice and agent-assist tied to case state and customer contact history
- collections and recovery tracking with proof of recovered revenue
- executive, board, and regulator reporting packs
- multi-tenant enterprise security and audit controls
- measurable value dashboard showing recovery generated by the platform

The highest-value strategic positioning is:

Revenue assurance operating system for electric utilities, not AI dashboard for power theft.

## Recommended roadmap from current code to full product

### Phase 1: Foundation and credibility

- fix production build blockers
- choose a canonical product name
- add a real database and domain schema
- persist users, roles, cases, case history, reports, and settings
- implement real RBAC
- replace hardcoded cases and charts with seeded database data

### Phase 2: Real operational loop

- implement case creation, assignment, escalation, resolution, and audit trail
- persist manual field reports
- persist Vapi call outcomes, transcripts, and webhook results
- connect report generation to saved report records
- make search, filters, and queues functional

### Phase 3: Utility integration and intelligence

- ingest AMI, billing, GIS, and customer data
- build feeder and transformer hierarchy
- calculate actual supplied vs billed reconciliation
- implement anomaly detection and recovery scoring from real data
- create hotspot maps and operational routing

### Phase 4: Enterprise productization

- multi-tenant org model
- role templates by utility department
- scheduled reporting and benchmark dashboards
- observability, queues, retries, and compliance logging
- regulator and board-ready exports

## Recommended north-star metrics

- recovered revenue attributable to platform
- reduction in non-technical loss
- case confirmation rate
- average days from detection to field action
- average days from confirmation to recovery
- revenue recovered per field team
- false-positive rate
- AI outreach completion and conversion rate

## Suggested go-to-market strategy

### Initial wedge

Sell into one pain, not the whole transformation story on day one:

- theft and non-technical loss reduction for one district or zone

### Land motion

- start with one utility unit
- run a 60-90 day proof of value
- prove case prioritization and recovery uplift

### Expand motion

- add field operations module
- add GIS hotspot intelligence
- add executive and board reporting
- expand from one district to full territory

### Strategic message

Do not pitch this as "AI for utilities." Pitch it as:

"We help utilities find, prioritize, and recover lost revenue faster by connecting analytics, field operations, customer outreach, and executive reporting in one system."

## Full pitch deck

### Slide 1: Cover

Energy Data Network Assurance

Revenue assurance operating system for electric utilities

One-line pitch:

We help distribution utilities detect leakage, prioritize the highest-value cases, coordinate field response, and convert lost energy into recovered revenue.

### Slide 2: The problem

- utilities lose material revenue to theft, tampering, bypass, billing leakage, and weak operational coordination
- the data exists, but it is fragmented across meters, billing, GIS, and field teams
- most utilities can see the loss problem, but cannot run a fast closed-loop recovery process

### Slide 3: Why current tools fail

- dashboards stop at visibility
- field teams operate outside the analytics workflow
- executive reporting is manual and backward-looking
- customer engagement is disconnected from detection and recovery

### Slide 4: The solution

Energy Data Network Assurance is a unified revenue assurance platform that:

- detects suspicious revenue leakage patterns
- maps them geographically
- turns them into prioritized cases
- helps teams contact customers and dispatch field action
- measures financial recovery and management impact

### Slide 5: Product today

- executive overview dashboard
- AI-generated insights and reports
- GIS intelligence map
- field operations console
- AI voice outreach integration
- analytics and admin modules

### Slide 6: Product tomorrow

- live utility system integrations
- persistent case graph and workflow engine
- recovery valuation and collections workflows
- feeder and transformer hotspot intelligence
- multi-tenant enterprise controls
- regulator and board reporting

### Slide 7: Target customer

- electric distribution companies in high-loss markets
- first focus on Nigerian and West African DISCOs
- economic buyers are CFO, COO, and chief commercial officer
- daily users are analysts, field teams, and operations leaders

### Slide 8: Why customers buy

- more recovered revenue
- faster case resolution
- better field productivity
- clearer executive visibility
- stronger audit trail and accountability

### Slide 9: Business model

- annual platform subscription
- integration and implementation fees
- optional recovery-share component
- usage-based AI voice and premium analytics add-ons
- expansion from one district to enterprise-wide deployment

### Slide 10: Why we win

- not only detection, but action and recovery
- combines executive, GIS, field ops, and AI in one workflow
- outcome-aligned commercial model
- defensible data and workflow moat as more cases are processed

### Slide 11: Go-to-market

- land with one high-loss district
- prove measurable recovery uplift in 60-90 days
- expand into adjacent districts, then full utility deployment
- cross-sell executive reporting, GIS, and outreach automation

### Slide 12: Implementation strategy

- connect billing, AMI, GIS, and field data
- configure detection and prioritization rules
- launch analyst and field workflow
- measure recovery and cycle-time improvements

### Slide 13: Traction story to aim for

The codebase is early, so the traction story should be built around pilot outcomes:

- percentage reduction in non-technical loss in pilot zone
- number of high-value cases identified
- recovery uplift per month
- reduction in time from alert to field action

### Slide 14: Roadmap

- foundation: persistence, RBAC, deployable build
- operations: full case workflow and report library
- intelligence: real data integrations and scoring
- enterprise: compliance, multi-tenancy, regulatory exports

### Slide 15: The ask

We are building the operating system for utility revenue assurance.

Funding or partner support will be used to:

- complete enterprise-grade product foundations
- integrate live utility systems
- deploy pilot programs with measurable recovery targets
- turn a strong product concept into a production utility platform

## Final strategic conclusion

This repo already contains the bones of a serious utility product. The strongest business interpretation is not "AI dashboard for power theft." It is "revenue assurance operating system for distribution utilities."

That distinction matters:

- dashboards are discretionary software
- operating systems that recover cash can become budget-priority systems

The commercial opportunity is strongest if the company focuses on one clear promise:

Find lost revenue, operationalize recovery, and prove financial impact.

## Immediate next decisions

1. Pick one permanent product name and use it everywhere.

2. Commit to one beachhead customer profile: Nigerian DISCOs first is the clearest fit.

3. Build the platform around persistent cases, audit trails, and recovery tracking before adding more surface area.

4. Treat field workflow and real integrations as the core product, not the charts.

5. Fix deployability and enterprise controls before selling beyond design partnerships or pilots.
