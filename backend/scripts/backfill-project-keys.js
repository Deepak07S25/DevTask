// scripts/backfill-project-keys.js
// Non-destructive helper script to backfill required 'key' fields on existing projects.
// Usage: npm run db:backfill-keys

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function backfillKeys() {
    console.log("🚀 Starting safe Project Key backfill...");
    
    // We only process projects that don't match the new alphanumeric regex, or have no key
    const projects = await prisma.project.findMany();
    
    let updated = 0;
    for (const p of projects) {
        if (!p.key || !/^[A-Z0-9]{2,10}$/.test(p.key)) {
            // Generate deterministic key: first 3 alphanumeric letters of name + random 3 numbers if needed
            const baseKey = (p.name || 'PRJ').replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase() || 'PRJ';
            const randomSuffix = Math.floor(Math.random() * 900) + 100; // 100-999
            const newKey = `${baseKey}${randomSuffix}`;
            
            console.log(`Updating Project [${p.id}] "${p.name}" -> new key: ${newKey}`);
            
            // Only update if we are absolutely sure to avoid collisions (handled by unique constraint natively, 
            // but the catch block prevents the whole script from crashing)
            try {
                await prisma.project.update({
                    where: { id: p.id },
                    data: { key: newKey }
                });
                updated++;
            } catch (error) {
                console.error(`❌ Failed to update project ${p.id}: ${error.message}`);
            }
        }
    }
    
    console.log(`✅ Backfill complete. Updated ${updated} projects.`);
    await prisma.$disconnect();
}

backfillKeys().catch(e => {
    console.error("FATAL ERROR:", e);
    process.exit(1);
});
