---
name: audit-a11y
description: Check a frontend or website for accessibility issues using a self-contained audit flow. Use when the user asks for an accessibility audit, a11y check, WCAG review, compliance scan, or wants specific accessibility concerns verified.
---

# Accessibility Audit

Run accessibility audits on frontend projects using a self-contained workflow that combines automated checks, manual review prompts, WCAG mapping, and structured reporting.

## Core Principles

1. **Self-Contained** — The audit should work without assuming the target project already has accessibility tooling installed.
2. **Check Specific Things** — Always ask what the user wants checked: full audit, specific pages, specific components, or specific concerns.
3. **Automated + Manual** — Automation finds many issues, but it is never enough on its own. Always call out what still needs manual verification.
4. **Evidence Over Vibes** — Report concrete findings, affected pages, impacted elements, severity, and relevant WCAG criteria.
5. **Do Not Fix Automatically** — This skill audits and reports. It does not modify source code unless the user separately asks for remediation help.

## What to Ask First

Before running the audit, ask the user to clarify the scope in one message:

- What should be checked: full site, specific routes, or specific components
- Whether they want a quick scan or a full audit
- Whether they want WCAG 2.1 AA as the default standard
- Whether there are specific concerns to prioritize, such as:
  - keyboard navigation
  - focus states
  - screen reader support
  - color contrast
  - forms and validation
  - modals and dialogs
  - tables
  - motion / reduced motion
  - heading structure / landmarks
  - ARIA usage
- Whether they want output as:
  - markdown report
  - markdown + JSON
  - markdown + issue list

If the user does not specify a standard, default to **WCAG 2.1 AA**.

---

## Phase 0: Detect Mode

Determine what the user wants:

- **Mode A: Quick Check** — Run a limited scan on selected pages or components and summarize findings in conversation.
- **Mode B: Full Audit** — Run a broader audit with structured report output.
- **Mode C: Follow-Up Check** — Re-check known issues, compare against a previous audit, or verify whether specific fixes worked.

---

## Phase 1: Scope and Environment Discovery

**Purpose:** Understand what is being audited before scanning.

1. Identify the target:
   - local app
   - staging site
   - production site
   - static HTML
   - specific components or flows

2. Identify scan scope:
   - full site
   - representative routes
   - user-provided URL list
   - specific feature areas

3. Check the project environment:
   - runtime URL
   - available scripts
   - router structure
   - whether browser automation is possible

4. Ask before installing any missing dependencies.

5. Summarize the proposed audit scope before proceeding.

**Output:** A short audit plan that confirms:
- what will be scanned
- what standards will be used
- what concerns will be prioritized
- what output format will be produced

---

## Phase 2: Automated Scanning

**Purpose:** Run automated accessibility checks against live pages.

Prefer a reusable, self-contained scanner using browser automation plus axe-core. Use Lighthouse accessibility scoring when available, but do not block the audit on Lighthouse.

For each target page:

1. Navigate to the page
2. Wait until the page is stable
3. Inject axe-core
4. Run the audit
5. Collect the results
6. Store raw results in JSON

If Lighthouse is available, also collect:

- accessibility score
- failed audits
- relevant details for failed checks

### Result Structure

For each page, collect:

- `url`
- `violations`
- `impact`
- `description`
- `help`
- `helpUrl`
- `tags`
- `affected nodes / selectors`
- `passes`
- `incomplete`
- `lighthouseScore` if available
- `lighthouseAudits` if available

### Scope Control

- Default to the routes identified in Phase 1
- If the site is large, scan representative routes instead of blindly scanning everything
- If the user provides a list of URLs, use that list
- If the audit is component-focused, limit scanning to relevant pages or states

---

## Phase 3: Compliance Mapping

**Purpose:** Map findings to WCAG criteria.

Map automated findings to **WCAG 2.1 AA** by default.

For each issue:

- identify the related WCAG success criteria where possible
- distinguish between:
  - confirmed automated failures
  - possible issues needing manual verification
  - criteria not testable through automation

Do not claim full conformance based on automated checks alone.

---

## Phase 4: Manual Check Guidance

**Purpose:** Ask for and generate targeted manual checks for what automation cannot verify.

Always include manual review guidance. Prioritize it based on the automated findings.

Organize manual checks by area:

- **Keyboard Navigation**
  - tab order
  - focus visibility
  - keyboard traps
  - interactive element reachability

- **Screen Reader**
  - landmark structure
  - heading hierarchy
  - accessible names
  - announcements for dynamic changes
  - form field labeling and errors

- **Visual Inspection**
  - contrast
  - zoom / reflow
  - visible states
  - non-text contrast
  - content hidden by overlays or motion

- **Forms and Validation**
  - labels
  - instructions
  - required fields
  - error identification
  - error recovery

- **Motion / Timing**
  - autoplay
  - moving content
  - reduced motion behavior
  - timeout or interruption risks

- **Complex Components**
  - modals
  - menus
  - tabs
  - accordions
  - tables
  - carousels
  - drag-and-drop or custom widgets

### Dynamic Prioritization

Use the scan results to focus manual effort:

- If contrast issues are found, prioritize color and visual checks
- If ARIA or landmark issues are found, prioritize screen reader checks
- If structure issues are found, prioritize headings, landmarks, and navigation order
- If form issues are found, prioritize labels, instructions, and validation behavior
- Always include keyboard and motion checks even if automation passes

---

## Phase 5: Reporting

**Purpose:** Produce a structured report.

The report should include:

1. **Executive Summary**
   - pages scanned
   - total issue count
   - severity breakdown
   - major patterns
   - whether Lighthouse was run

2. **Methodology**
   - tools used
   - scan scope
   - URLs checked
   - standards used
   - limitations of the audit

3. **Findings by Page**
   - issue
   - severity
   - affected element
   - explanation
   - WCAG mapping
   - suggested remediation direction

4. **Cross-Cutting Issues**
   - recurring problems across multiple pages
   - shared component failures
   - systemic design or implementation patterns

5. **Manual Testing Recommendations**
   - prioritized checklist based on actual findings

6. **Compliance Summary**
   - what clearly fails
   - what appears acceptable from automation
   - what still requires manual validation

### Output Modes

| Mode | Output | Use Case |
|------|--------|----------|
| `markdown` | Markdown report only | Human review |
| `markdown+json` | Markdown report + machine-readable JSON | CI, dashboards, tracking |
| `markdown+issues` | Markdown report + issue-ready breakdown | Remediation planning |

If the user does not specify, default to `markdown`.

---

## Phase 6: Issue Creation Prep (Optional)

If the user wants issues generated from findings:

1. Group related findings into actionable remediation items
2. Remove duplicates
3. Assign a rough priority based on severity and user impact
4. Show the user how many issues would be created before proceeding

Do not create tickets automatically without explicit confirmation.

---

## Verification

After the audit, verify:

1. The scanned URLs match the intended scope
2. Automated results were collected successfully
3. The report includes both automated findings and manual follow-up guidance
4. WCAG mappings are present where applicable
5. Output files match the requested format
6. No claim of full accessibility conformance is made based only on automation

---

## What This Skill Does NOT Do

- It does not guarantee full WCAG conformance
- It does not replace real assistive technology testing
- It does not test real screen readers or mobile assistive tech directly
- It does not fix source code automatically
- It does not audit PDFs or non-web content unless explicitly adapted
- It does not create tracker tickets without approval

---

## Supporting Behavior

When deciding how to run the audit:

- Prefer a smaller, high-signal scan over a noisy unfocused one
- Ask what the user specifically wants checked
- Prioritize likely user-impacting issues over low-value output
- Keep findings concrete and actionable
- Be explicit about what was tested and what was not
- Treat automation as evidence, not proof
