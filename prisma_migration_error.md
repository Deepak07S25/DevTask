# Prisma Migration Error & Resolution Guide

## Problem Description
After pulling in new schema changes involving the `Sprint` model, the frontend board started failing to load with the following error:
> **"Failed to load board. Please try again."**

On checking the browser console, requests to `/api/tasks` and `/api/sprints` were failing with a **500 Internal Server Error**.

## Root Cause
When we add new models or relationships to `prisma/schema.prisma` (like our new `Sprint` model and `sprintId` on `Task`), we must undergo two vital steps:
1. **Updating the Database Structure**: We ran `npx prisma db push`, which successfully created the new tables in PostgreSQL.
2. **Generating the Client**: We **didn't** correctly run `npx prisma generate`. The Prisma Client is the auto-generated query builder that lives inside `node_modules/@prisma/client`. Because the client wasn't regenerated, the Node.js backend still thought the database didn't have a `Sprint` model. 

When the backend tried to do `prisma.sprint.findMany(...)` or include the `sprint` relation in tasks, Prisma panicked and threw an internal error because the code didn't match its cached schema definitions, leading to the 500 errors.

## Resolution Steps

Whenever you modify the `schema.prisma` file, always perform these steps in the `backend` folder to ensure both your database and your Node.js code are perfectly in sync:

1. **Stop the running server**
   Press `Ctrl + C` in the terminal running `npm run dev`.

2. **Sync the Database Schema**
   *If you're in development and want to quickly force the schema:*
   ```bash
   npx prisma db push
   ```
   *If you want to track the migration in version control (Recommended):*
   ```bash
   npx prisma migrate dev --name describe_your_change
   ```

3. **Regenerate the Prisma Client Code**
   Even though `migrate dev` or `db push` *often* runs this automatically, it can sometimes fail or get cached heavily by `nodemon`. To be 100% safe, manually generate the client:
   ```bash
   npx prisma generate
   ```

4. **Restart the Server**
   ```bash
   npm run dev
   ```

5. **Refresh the Frontend**
   Refresh the board in your browser. The app will now successfully query the new models without throwing 500 errors.
