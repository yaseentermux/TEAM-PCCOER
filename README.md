# Brightloop Software --- Subscription Management System

A full-stack subscription management platform for managing products,
pricing plans, quotations, subscriptions, recurring billing, payments,
and financial reporting in one place.

> **Hackathon project:** 4 members, 4 independently owned workstreams.\
> **Repository:** `subscription-mgmt`\
> **Primary goal:** Make the complete
> customer-to-quotation-to-subscription-to-invoice-to-payment journey
> work end to end.

------------------------------------------------------------------------

## 1. Project Overview

The system follows the billing journey of a business:

1.  A customer signs up and gets access to their customer portal.
2.  Admin/staff manage customers and launch products and subscription
    plans.
3.  A sales representative creates a quotation from a reusable template.
4.  The customer accepts the quotation and the staff activates the
    subscription.
5.  The billing module generates invoices automatically for active
    subscriptions.
6.  Payments are recorded and invoice balances/statuses are updated.
7.  The finance dashboard displays subscriptions, revenue, outstanding
    amounts, and overdue invoices.

### Main modules

  -----------------------------------------------------------------------
  Module                  Main responsibilities   Owner
  ----------------------- ----------------------- -----------------------
  Platform & Access       Repository setup,       Member 1
                          database schema,        
                          authentication, roles,  
                          users, customers,       
                          shared layouts/UI,      
                          integration             

  Catalog & Pricing Rules Products, variants,     Member 2
                          plans, taxes, discount  
                          rules                   

  Sales & Subscriptions   Quotation templates,    Member 3
                          subscriptions,          
                          lifecycle, auto-close   
                          job, customer           
                          subscription portal     

  Billing & Finance       Pricing engine,         Member 4
                          invoices, payments,     
                          PDF/email, overdue      
                          tracking, dashboard and 
                          reports                 
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 2. Technology Stack

  Layer                  Technology
  ---------------------- --------------------------------------
  Database               PostgreSQL 16
  ORM and migrations     Prisma 6
  Backend                Node.js 20+, Express 4, TypeScript
  Validation             Zod
  Authentication         bcryptjs + JWT in an httpOnly cookie
  Frontend               React + Vite + TypeScript
  Styling/UI             Tailwind CSS + shadcn/ui
  Data fetching          TanStack Query + Axios
  Forms                  react-hook-form + Zod
  Charts                 Recharts
  Scheduled jobs         node-cron
  PDF generation         PDFKit
  Email                  Nodemailer
  Development database   Docker Compose
  Version control        Git + GitHub

**Version note:** Keep Prisma on major version 6 as specified in the
team plan.

------------------------------------------------------------------------

## 3. Team Ownership and Branches

Each member owns their vertical slice (backend, frontend and seed data).
Do not edit another member's owned module without coordinating with its
owner.

  ---------------------------------------------------------------------------------------------------------
  Member            Role              Git branch                Main folders
  ----------------- ----------------- ------------------------- -------------------------------------------
  M1                Platform Lead &   `feat/m1-platform`        Shared setup, auth, users, customers, app
                    Integrator                                  shell, Prisma schema

  M2                Catalog & Pricing `feat/m2-catalog`         `server/src/modules/products`, `plans`,
                    Rules                                       `taxes`, `discounts`;
                                                                `client/src/features/catalog`

  M3                Sales &           `feat/m3-subscriptions`   `server/src/modules/quotation-templates`,
                    Subscriptions                               `subscriptions`, `portal-subscriptions`;
                                                                `client/src/features/sales`

  M4                Billing, Payments `feat/m4-billing`         `server/src/lib/pricing.ts`, billing
                    & Analytics                                 modules; `client/src/features/billing`
  ---------------------------------------------------------------------------------------------------------

### Shared ownership rules

-   Member 1 owns `server/prisma/schema.prisma`, migrations,
    `server/src/routes.ts`, shared middleware, shared app layouts and
    integration.
-   Member 2 owns catalog modules and catalog seed data.
-   Member 3 owns quotation templates, subscriptions, portal
    subscriptions and subscription seed data.
-   Member 4 owns pricing logic, invoices, payments, billing, reports
    and billing seed data.
-   Shared UI components may be added by any member, but coordinate
    before changing shared components.
-   If a change is needed in another member's owned files, contact that
    member first.
-   Database schema changes must be proposed to Member 1. Do not
    independently edit the shared Prisma schema.

------------------------------------------------------------------------

## 4. Git and Contribution Workflow

### Branch model

-   `main`: latest integrated, demo-ready code.
-   `dev`: optional team integration branch if the team continues using
    the original plan's checkpoint workflow.
-   `feat/m1-platform`, `feat/m2-catalog`, `feat/m3-subscriptions`,
    `feat/m4-billing`: individual member work branches.

### Important hackathon submission rule

The hackathon requires: - Every member to push their own code at least
once every hour. - The latest code to be available in `main`. - Each
member to commit their own work so individual contribution is visible.

**This submission rule takes priority over the original plan's slower
`dev`-only integration schedule.** The original team plan describes
feature branches with PRs into `dev` and `main` kept demo-ready. To
satisfy the hackathon's explicit `main` requirement, use this adjusted
process:

1.  Each member works and commits on their own feature branch.
2.  Push the feature branch at least once every hour (preferably every
    30--45 minutes).
3.  Open a Pull Request from the feature branch into `main` and get it
    reviewed/merged promptly, so the latest working code is present in
    `main` within the required hour.
4.  Preserve individual commits. Avoid **Squash and Merge** unless the
    organizers explicitly say contribution attribution is unaffected.
5.  Keep `dev` only if the team finds it useful for staging/integration;
    do not let it delay required updates to `main`.
6.  Never force-push shared branches. Coordinate before rebasing
    branches that other people use.

### Example commands for a member

``` bash
# Check current branch and working tree
git status
git branch

# Switch to your own branch
git switch feat/m3-subscriptions

# Review and commit only your own changes
git add <your-files>
git commit -m "feat(m3): add subscription creation"

# Push your branch
git push -u origin feat/m3-subscriptions
```

After pushing, open a Pull Request on GitHub targeting `main`, request a
quick review, and merge it according to the team agreement. Repeat small
commits and pushes throughout the hackathon.

### Commit message convention

Use clear prefixes and member scope:

-   `feat(m3): add subscription creation`
-   `fix(m2): validate variant price`
-   `chore(m1): configure database`
-   `docs: add local setup instructions`
-   `test(m4): cover invoice pricing rules`

Each member must use their own GitHub account and Git commit identity.
Check with:

``` bash
git config user.name
git config user.email
```

Never commit `.env`, credentials, API keys, `node_modules`, build
output, or other secrets.

------------------------------------------------------------------------

## 5. Repository Structure

The intended monorepo structure is:

``` text
subscription-mgmt/
Γö£ΓöÇΓöÇ README.md
Γö£ΓöÇΓöÇ .gitignore
Γö£ΓöÇΓöÇ .editorconfig
Γö£ΓöÇΓöÇ docker-compose.yml
Γö£ΓöÇΓöÇ server/
Γöé   Γö£ΓöÇΓöÇ package.json
Γöé   Γö£ΓöÇΓöÇ tsconfig.json
Γöé   Γö£ΓöÇΓöÇ .env.example
Γöé   Γö£ΓöÇΓöÇ prisma/
Γöé   Γöé   Γö£ΓöÇΓöÇ schema.prisma
Γöé   Γöé   Γö£ΓöÇΓöÇ migrations/
Γöé   Γöé   ΓööΓöÇΓöÇ seed/
Γöé   Γöé       Γö£ΓöÇΓöÇ index.ts
Γöé   Γöé       Γö£ΓöÇΓöÇ users.seed.ts
Γöé   Γöé       Γö£ΓöÇΓöÇ catalog.seed.ts
Γöé   Γöé       Γö£ΓöÇΓöÇ subscriptions.seed.ts
Γöé   Γöé       Γö£ΓöÇΓöÇ billing.seed.ts
Γöé   Γöé       ΓööΓöÇΓöÇ bulk.seed.ts
Γöé   ΓööΓöÇΓöÇ src/
Γöé       Γö£ΓöÇΓöÇ index.ts
Γöé       Γö£ΓöÇΓöÇ app.ts
Γöé       Γö£ΓöÇΓöÇ routes.ts
Γöé       Γö£ΓöÇΓöÇ config/
Γöé       Γö£ΓöÇΓöÇ middleware/
Γöé       Γö£ΓöÇΓöÇ lib/
Γöé       Γö£ΓöÇΓöÇ jobs/
Γöé       ΓööΓöÇΓöÇ modules/
Γöé           Γö£ΓöÇΓöÇ auth/
Γöé           Γö£ΓöÇΓöÇ users/
Γöé           Γö£ΓöÇΓöÇ customers/
Γöé           Γö£ΓöÇΓöÇ products/
Γöé           Γö£ΓöÇΓöÇ plans/
Γöé           Γö£ΓöÇΓöÇ taxes/
Γöé           Γö£ΓöÇΓöÇ discounts/
Γöé           Γö£ΓöÇΓöÇ quotation-templates/
Γöé           Γö£ΓöÇΓöÇ subscriptions/
Γöé           Γö£ΓöÇΓöÇ portal-subscriptions/
Γöé           Γö£ΓöÇΓöÇ invoices/
Γöé           Γö£ΓöÇΓöÇ payments/
Γöé           Γö£ΓöÇΓöÇ billing/
Γöé           Γö£ΓöÇΓöÇ reports/
Γöé           ΓööΓöÇΓöÇ portal-invoices/
ΓööΓöÇΓöÇ client/
    Γö£ΓöÇΓöÇ package.json
    Γö£ΓöÇΓöÇ vite.config.ts
    ΓööΓöÇΓöÇ src/
        Γö£ΓöÇΓöÇ main.tsx
        Γö£ΓöÇΓöÇ app/
        Γö£ΓöÇΓöÇ context/
        Γö£ΓöÇΓöÇ lib/
        Γö£ΓöÇΓöÇ components/
        Γöé   Γö£ΓöÇΓöÇ ui/
        Γöé   Γö£ΓöÇΓöÇ layout/
        Γöé   ΓööΓöÇΓöÇ common/
        ΓööΓöÇΓöÇ features/
            Γö£ΓöÇΓöÇ auth/
            Γö£ΓöÇΓöÇ users/
            Γö£ΓöÇΓöÇ customers/
            Γö£ΓöÇΓöÇ profile/
            Γö£ΓöÇΓöÇ catalog/
            Γö£ΓöÇΓöÇ sales/
            ΓööΓöÇΓöÇ billing/
```

### Backend module pattern

Each backend module should follow this pattern:

``` text
module-name/
Γö£ΓöÇΓöÇ module-name.routes.ts
Γö£ΓöÇΓöÇ module-name.controller.ts
Γö£ΓöÇΓöÇ module-name.service.ts
ΓööΓöÇΓöÇ module-name.schema.ts
```

-   **routes:** URL definitions, middleware and controller wiring.
-   **controller:** Reads request data, calls service functions and
    returns JSON.
-   **service:** Business logic and Prisma database operations.
-   **schema:** Zod validation for request bodies, query parameters and
    route parameters.

### Frontend feature pattern

A feature folder generally contains:

``` text
feature-name/
Γö£ΓöÇΓöÇ routes.tsx
Γö£ΓöÇΓöÇ api.ts
Γö£ΓöÇΓöÇ pages/
ΓööΓöÇΓöÇ components/
```

------------------------------------------------------------------------

## 6. Local Development Setup

### Prerequisites

-   Node.js 20 LTS or newer
-   Git
-   Docker Desktop (recommended) or PostgreSQL 16 installed locally
-   npm
-   An editor such as VS Code or Antigravity

### Start PostgreSQL

Once Member 1 adds `docker-compose.yml`:

``` bash
docker compose up -d
```

The planned database is `subscription_db`, exposed locally on port
`5432`.

### Backend setup

Run these commands after the backend scaffold and `.env.example` have
been added:

``` bash
cd server
cp .env.example .env
npm install
npx prisma migrate dev
npm run seed
npm run dev
```

On Windows PowerShell, use:

``` powershell
Copy-Item .env.example .env
```

Planned API address: `http://localhost:4000`

### Frontend setup

Open a second terminal:

``` bash
cd client
npm install
npm run dev
```

Planned frontend address: `http://localhost:5173`

The Vite development server should proxy `/api` requests to the backend.

> **Current repository status:** The repository is currently empty.
> These commands will work only after the relevant scaffold files,
> package manifests, environment example and database configuration have
> been committed. Do not assume the application is runnable yet.

### Useful database commands

``` bash
# Open Prisma Studio
npx prisma studio

# Apply/generate migrations during development
npx prisma migrate dev

# Regenerate Prisma Client after pulling schema changes
npx prisma generate

# Reset database and re-seed (destructive: deletes local data)
npx prisma migrate reset
```

Only run destructive reset commands when the team agrees and local data
can be discarded.

------------------------------------------------------------------------

## 7. API Conventions

-   Base API path: `/api`
-   JSON request and response bodies.
-   Authentication: JWT in an httpOnly cookie.
-   Frontend Axios requests should use `withCredentials: true`.
-   List endpoints should support pagination and return:

``` json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0
  }
}
```

-   Single-item responses should use:

``` json
{
  "data": {}
}
```

-   Errors should use:

``` json
{
  "error": {
    "message": "Readable error message",
    "details": null
  }
}
```

-   Expected status codes include `400` validation error, `401`
    unauthenticated, `403` forbidden, `404` not found and `409`
    conflict.
-   Use action endpoints for state transitions, for example
    `POST /api/subscriptions/:id/confirm`, rather than allowing
    arbitrary status changes through PATCH.
-   Use server-side pagination and select only fields needed by the
    screen.

------------------------------------------------------------------------

## 8. Roles and Access Control

  -----------------------------------------------------------------------
  Feature           ADMIN             INTERNAL (staff)  CUSTOMER
  ----------------- ----------------- ----------------- -----------------
  Staff users       Create/edit       No                No

  Customers         Full access       Full access       Own profile only

  Products,         Full access       Read              Read public plans
  variants, plans                                       

  Taxes and         Full access       Read              No
  discount rules                                        

  Quotation         Full access       Full access       No
  templates                                             

  Subscriptions     Full access       Full access       Own subscriptions
                                                        only; actions
                                                        subject to plan
                                                        rules

  Invoices          Full access       Full access       Own invoices only

  Payments          Full access       Record payments   Pay own invoices

  Dashboard and     Full access       Full access       No
  reports                                               
  -----------------------------------------------------------------------

**Security rule:** Enforce permissions in backend middleware/services,
not only by hiding frontend buttons. Customer portal queries must always
be scoped to the authenticated customer's own ID.

------------------------------------------------------------------------

## 9. Workstream Details

### Member 1 --- Platform, Authentication and Integration

**Mission:** Build the foundation and ensure all modules work together.

Main responsibilities: - Repository and application scaffold. - Docker
Compose and PostgreSQL setup. - Shared Prisma schema and initial
migration. - Express app bootstrap, middleware and common error
handling. - Authentication: signup, login, logout, forgot password,
reset password and change password. - Role-based access control: ADMIN,
INTERNAL and CUSTOMER. - User and customer APIs and pages. - Shared
app/portal layouts, navigation and UI building blocks. - Shared helpers
such as Prisma client, pagination, sequence numbering and mailer. -
Route registration, cron-job registration, integration, final build and
deployment.

### Member 2 --- Catalog and Pricing Rules

**Mission:** Let admins configure the products, plans, taxes and
discounts used by subscriptions and billing.

Main responsibilities: - Product CRUD and product variants. - Recurring
plans with billing period, price, minimum quantity, dates and behavior
flags. - Tax CRUD. - Discount rules: fixed or percentage, scope,
conditions, validity and usage limits. - Catalog frontend pages and
public pricing page. - Seed catalog data, including GST examples,
products, variants, plans and discounts.

### Member 3 --- Sales and Subscriptions

**Mission:** A sales representative turns a reusable template into a
quotation and then into an active subscription. Customers can manage
their own subscriptions through the portal.

Backend folders: - `server/src/modules/quotation-templates/` -
`server/src/modules/subscriptions/` -
`server/src/modules/portal-subscriptions/`

Frontend folder: - `client/src/features/sales/`

Seed file: - `server/prisma/seed/subscriptions.seed.ts`

#### Quotation templates

CRUD API at `/api/quotation-templates`.

A template contains: - Name - Validity days - Plan - Notes - Product
lines (product, optional variant and quantity)

When updating template lines, replace them inside a Prisma transaction.

#### Subscription APIs

Implement: - `GET /api/subscriptions` with status, customer, plan,
search and pagination filters. - `GET /api/subscriptions/stats` with
counts per status. - `GET /api/subscriptions/:id` with customer, plan,
lines, product/variant/taxes, event history and linked invoice
information. - `POST /api/subscriptions` to create a subscription. -
`PATCH /api/subscriptions/:id` only while status is DRAFT or QUOTATION;
otherwise return `409`. -
`POST /api/subscriptions/from-template/:templateId` to create a
subscription from a template. - `GET /api/subscriptions/:id/preview` to
calculate a live pricing preview using the shared pricing function.

#### Subscription lifecycle

Implement the lifecycle centrally in `subscriptions.service.ts`.

  ---------------------------------------------------------------------------------
  Action                  Transition                Main rules and side effects
  ----------------------- ------------------------- -------------------------------
  Send quotation          DRAFT ΓåÆ QUOTATION         Requires at least one line; set
                                                    quote validity to today +
                                                    template validity days (default
                                                    30); optionally email customer

  Confirm                 QUOTATION ΓåÆ CONFIRMED     Staff can confirm or customer
                                                    can accept in portal; reject
                                                    expired quotation

  Activate                CONFIRMED ΓåÆ ACTIVE        Set
                                                    `nextInvoiceDate = startDate`

  Pause                   ACTIVE ΓåÆ PAUSED           Allowed only when
                                                    `plan.pausable`; paused
                                                    subscriptions are not billed

  Resume                  PAUSED ΓåÆ ACTIVE           If next invoice date is in the
                                                    past, set it to today; do not
                                                    back-bill

  Close                   ACTIVE/PAUSED/QUOTATION ΓåÆ Require a reason note; plan
                          CLOSED                    must be closable except
                                                    quotation can always be closed

  Renew                   ACTIVE/CLOSED ΓåÆ ACTIVE    Only when `plan.renewable`;
                                                    extend expiry by one billing
                                                    period or create a copy for a
                                                    closed subscription

  Automatic close         ACTIVE ΓåÆ CLOSED           Daily at 00:10 when
                                                    `plan.autoClose` is true and
                                                    expiry date is before today
  ---------------------------------------------------------------------------------

Every lifecycle transition must create a `SubscriptionEvent` (from
status, to status, user and note) in the same Prisma transaction.

The auto-close job should be exported from `subscriptions.jobs.ts` and
registered by Member 1 in the central jobs index. Provide an admin demo
endpoint:

`POST /api/subscriptions/jobs/auto-close`

#### Subscription line and pricing rules

-   Default unit price = product sales price + selected variant extra
    price.
-   Staff may override unit price where allowed.
-   Line amount = quantity ├ù unit price.
-   Quantity must be at least `plan.minQuantity`.
-   Default line taxes come from the selected product's taxes.
-   Assign subscription number using `formatNumber("SUB", id)`
    immediately after insert, inside the transaction.
-   Use Member 4's shared `priceLines(...)` function for the totals
    preview.

#### Customer portal

Base path: `/api/portal/subscriptions`.

-   Customer can list and view only their own subscriptions.
-   Customer can accept their own quotation.
-   Customer can pause, resume, close or renew only when the plan
    permits it.
-   `POST /api/portal/subscriptions/subscribe` supports self-service
    subscription creation.

Every portal endpoint must filter by the authenticated customer ID.

#### Member 3 frontend

-   Subscription list with status tabs/counts, search and customer/plan
    filters.
-   Subscription detail/form with an Odoo-like status bar and
    context-sensitive actions.
-   Header fields: customer, plan, template, start/expiry dates, payment
    terms and discount.
-   Order line editor: product, variant, quantity, unit price, taxes and
    amount.
-   Live totals from the preview API.
-   Other Info, History timeline and Invoices tabs.
-   Create-from-template dialog.
-   Quotation template list and editor.
-   Customer portal: My Subscriptions list/detail, accept quotation card
    and subscribe checkout page.
-   Export `<CustomerSubscriptionsTab customerId />` for Member 1's
    customer detail page.

#### Member 3 seed data

Create: - Two templates: `Starter Monthly` and
`Enterprise Yearly 25 seats`. - Approximately 15 subscriptions across
all statuses and customers. - Some ACTIVE subscriptions with
`nextInvoiceDate` today or in the past so Member 4 can demonstrate
billing.

Commit the subscription seed early so Member 4 can test against it.

#### Member 3 definition of done

-   Create a subscription from a template.
-   Send quotation, accept/confirm it and activate it.
-   Pause and resume it.
-   Close it with history recorded.
-   Respect plan flags for pause, close, renew and auto-close.
-   Customer can accept and manage only their own subscriptions in the
    portal.
-   Auto-close job and admin Run Now endpoint work.

### Member 4 --- Billing, Payments and Analytics

**Mission:** Generate correct invoices automatically, prevent duplicate
billing, record payments and provide finance reporting.

Main responsibilities: - Implement shared pricing engine with taxes and
discounts and unit tests. - Generate invoices from active subscriptions
using database transactions. - Prevent duplicate invoices for the same
subscription and billing period. - Daily billing job and manual Run
Billing Now endpoint. - Invoice list/detail APIs,
confirmation/cancellation/email/PDF. - Payment recording, partial/full
payment handling and recalculated balances. - Reports: MRR, revenue,
invoiced amount, outstanding, overdue, revenue trend and top plans. -
Finance dashboard and customer invoice portal. - Billing seeds and
optional bulk performance seed.

------------------------------------------------------------------------

## 10. Shared Business Rules

The following rules are shared across subscription and billing modules:

1.  Money values use `Decimal(12,2)` in the database. Convert to numbers
    and round to two decimals when returning JSON.
2.  Store dates as UTC `DateTime`; use a date utility such as dayjs for
    period calculations.
3.  Subscription and invoice numbers are generated from their
    auto-increment IDs, e.g.┬á`SUB-00042` and `INV-00042`.
4.  An invoice must be unique for a subscription and billing period. The
    database unique constraint is the protection against double billing.
5.  An invoice is overdue when its status is CONFIRMED and its due date
    is before the current time; overdue is derived, not stored as a
    separate status.
6.  Plan billing periods: DAILY = +1 day, WEEKLY = +7 days, MONTHLY = +1
    month, YEARLY = +1 year.
7.  Payment terms: IMMEDIATE = +0 days, NET_7 = +7 days, NET_15 = +15
    days, NET_30 = +30 days.
8.  If `plan.price > 0`, billing adds a recurring plan-fee line.
9.  Discounts are applied before tax.
10. Use transactions for lifecycle event writes, invoice generation and
    payment updates.

------------------------------------------------------------------------

## 11. Timeline and Checkpoints

The source team plan is based on a 24-hour hackathon; scale the phases
proportionally for a different duration.

  -----------------------------------------------------------------------
  Time                                Focus
  ----------------------------------- -----------------------------------
  0:00--1:00                          Phase 0 setup, schema,
                                      state-machine design, validation
                                      schemas and pricing tests

  1:00--5:00                          Core APIs and seed data

  5:00                                CP1: integrate working APIs, sync
                                      branches and run the app

  5:00--10:00                         Core frontend screens

  10:00                               CP2: integrate frontend and test

  10:00--15:00                        Lifecycle actions, history,
                                      auto-close, portals, reports and
                                      billing

  15:00                               CP3: full integration and app-start
                                      check

  15:00--19:00                        End-to-end demo testing and bug
                                      fixes

  19:00--22:00                        README, screenshots, polish and
                                      optional deployment

  22:00--24:00                        Final integration, demo rehearsal
                                      and release tag
  -----------------------------------------------------------------------

### Team communication

Use one team chat (WhatsApp/Discord) and keep messages clear:

-   `MERGED` --- changes have been merged; teammates should pull.
-   `SCHEMA` --- request for a shared database schema change.
-   `BLOCKED` --- a dependency or issue needs help.

If another member's API is not ready, use clearly marked mock JSON in
your own `api.ts` temporarily and continue UI work. Replace the mock
when the real API is available.

------------------------------------------------------------------------

## 12. Demo Flow

The planned 5--7 minute demo follows this sequence:

1.  Customer signup and password validation; show forgot-password flow.
2.  Admin dashboard, staff creation and role-based read-only access.
3.  Admin creates a product with an Odoo variant (+560), GST 18% and a
    monthly plan with pausable/auto-close options.
4.  M3 creates a subscription from the Enterprise Yearly template,
    adjusts it to 12 seats and sends a quotation.
5.  Customer accepts the quotation in the portal; staff activates it;
    show subscription history.
6.  Admin creates a bulk discount; M4 runs billing and shows
    taxes/discount on the invoice.
7.  Run billing again and show that no duplicate invoice is created.
8.  Record a partial UPI payment and then the remaining amount; show
    PAID status.
9.  Show customer invoice portal and finance dashboard.
10. Close with architecture, ER diagram and future improvements.

------------------------------------------------------------------------

## 13. Final Judging Checklist

### Completeness

-   Every main user journey works end to end on a freshly seeded
    database.

### Data integrity

-   Unique customer emails.
-   Unique invoice per subscription and billing period.
-   Transactions around billing, payments and subscription lifecycle
    events.
-   Zod validation on endpoints.
-   Friendly error messages.

### Security

-   Passwords and reset tokens are hashed.
-   JWT is stored in an httpOnly cookie.
-   Backend role checks are enforced.
-   Customers can access only their own subscriptions and invoices.
-   No secrets are committed.

### Performance

-   Database indexes are present.
-   Lists use server-side pagination and select only required fields.
-   Bulk seed can demonstrate performance.
-   Response-time header is available.

### UI/UX

-   Consistent layouts and status badges.
-   Odoo-style status bars where relevant.
-   Empty states and loading skeletons.
-   Responsive laptop and tablet layouts.

### Code quality and teamwork

-   Consistent module structure.
-   TypeScript strict mode.
-   README setup instructions are clear.
-   Commits from all four GitHub accounts throughout the event.
-   Pull Requests include descriptions and test instructions.
-   Latest working code is synchronized to `main` at least hourly, as
    required by the hackathon.

------------------------------------------------------------------------

## 14. Current Project Status

The GitHub repository is currently empty. This README is the initial
project brief and implementation reference.

**Do not assume that backend, frontend, database, routes, migrations,
seed files or environment files already exist.** Member 1 must create
and push the initial scaffold before the team can run the full
application.

### Before implementation

1.  Confirm all four GitHub collaborators have repository access.
2.  Agree on the branch and hourly `main` integration workflow.
3.  Member 1 creates the initial monorepo scaffold, shared Prisma schema
    and common contracts.
4.  Each member checks out their own feature branch and begins their
    assigned work.
5.  Use this README and the detailed hackathon team plan as the source
    of project requirements. If a requirement is unclear or two
    instructions conflict, discuss it with the team before changing
    shared contracts.
