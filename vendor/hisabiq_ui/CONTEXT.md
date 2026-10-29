# HisabIQ SaaS administration

These terms describe the platform's relationship with subscribing businesses. Sales, purchases and customer balances inside a business remain a separate ERP context.

## Language

**Tenant**:
A subscribing business whose members, subscriptions, usage and support records are kept separate from other businesses. A branch belongs to a tenant.
_Avoid_: tenet, platform employee, individual login.

**Tenant owner**:
The member responsible for the business's subscription and authorized administrative decisions.

**Platform staff**:
People operating HisabIQ across permitted tenants, with responsibilities such as support or payment verification. Platform authority is separate from a business member's ERP role.

**Staff role**:
A configurable bundle of platform permissions. An employee can hold several roles at once to combine responsibilities.

**Role assignment**:
The grant of a staff role to an employee for all tenants or a specified tenant set. Each grant retains its own scope when roles are combined.

**Effective permissions**:
The combined actions allowed by an employee's role assignments within each assignment's scope, subject to operational rules such as no self-approval.

**Plan**:
A published offer defining subscription pricing, entitlements and usage limits. Historical subscriptions and charges retain their applicable offer terms.

**Subscription**:
A tenant's time-bound agreement for a base plan and any recurring add-ons, with a billing period and lifecycle status.

**Entitlement**:
A feature or allowance a tenant is permitted to use under its current agreement.

**SaaS invoice**:
A bill issued by the platform to a tenant for subscriptions, messaging or services.
_Avoid_: merchant sales invoice, customer sale.

**Payment submission**:
A tenant or staff member's claim that a payment was made, with its reference and evidence. It is not itself verified receipt of money.

**Verified payment**:
A receipt confirmed by an authorized reviewer or trusted settlement process. Its original record is retained when later adjustments occur.

**Allocation**:
The amount of a verified payment or available credit applied to a particular SaaS invoice for the same tenant.

**Credit adjustment**:
A recorded increase or decrease to a tenant's financial credit, with a reason and linked source. Financial credit is distinct from messaging units.

**SMS credit**:
A messaging allowance consumed according to the configured charging rules, with its source, reservations and any expiration retained in a ledger.

**Service order**:
A tenant's request and delivery record for a platform service, including scope, assignment, progress and any linked charge.

**Support ticket**:
A tenant issue with a conversation, ownership, priority and resolution history. Public replies and internal notes have different audiences.

**Support access grant**:
Explicit, revocable permission to help within a tenant workspace for a stated purpose, scope and limited period.
