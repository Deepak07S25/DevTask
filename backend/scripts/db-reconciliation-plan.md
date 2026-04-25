# Safe Database Reconciliation Plan

## The Problem (Schema Drift)
The live Postgres database currently contains undocumented tables prefixed with `ai_` (e.g., `ai_models`, `ai_requests`, `ai_usage_daily`). These tables are NOT defined in the current `schema.prisma` file.

Simultaneously, we have recently added new required fields and primitives to the Prisma schema (e.g., `Project.key`, `Task.taskNumber`, `Task.parentId`, `Task.rank`, `Label`, `TaskLabel`). 

If you run `prisma db push` or `prisma migrate dev` natively right now, **Prisma will detect the `ai_*` tables as "unmanaged" and drop them**, permanently destroying the production AI observability data.

## Safe Reconciliation Steps

Do **NOT** deploy the new backend code until you have completed the following steps:

### 1. Introspect the Missing Tables (Locally)
Pull the live structure of the `ai_*` tables into your schema:
```bash
# Pull the exact schema from the live/staging database down to your local schema
npx prisma db pull
```
*Note: This will modify your local `schema.prisma` to include the `ai_*` models.*

### 2. Merge and Review
* Review the modified `schema.prisma`. 
* Ensure all the Phase 2/3 additions (`Project.key`, `Task.taskNumber`, etc.) are still present.
* If `db pull` overwrote your recent additions, simply manually copy the `ai_*` models into your versioned `schema.prisma` file.

### 3. Generate a Migration Safely
Once `schema.prisma` accurately reflects **both** the new Phase 2/3 fields AND the existing `ai_*` tables, you can safely generate a migration:
```bash
npx prisma migrate dev --name "add_phase2_primitives_and_ai_models"
```
*Review the generated SQL file (`prisma/migrations/.../migration.sql`) to ensure no `DROP TABLE` statements target the `ai_*` models.*

### 4. Project Key Backfill
Because the new `Project.key` field is required, existing projects in the live database will cause the migration to fail if they lack keys.
* Before or immediately after creating the column (as nullable initially, or providing a default), run the safe backfill script:
```bash
npm run db:backfill-keys
```

### 5. Finalize Deployment
Once the database matches the unified schema, you can safely deploy the backend and run `npx prisma migrate deploy` during your CI/CD process.
