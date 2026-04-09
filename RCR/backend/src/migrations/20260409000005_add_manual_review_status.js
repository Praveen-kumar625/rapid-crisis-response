/**
 * 🛠️ SCHEMA REFINEMENT: MANUAL REVIEW STATE
 * Version: 1.4.0
 * Purpose: Add 'MANUAL_REVIEW' to incident status for graceful AI degradation.
 */

exports.up = async function(knex) {
    // PostgreSQL doesn't allow direct enum modification easily in a migration without dropping/recreating or using raw SQL
    // We will use raw SQL to add the value to the existing type
    try {
        await knex.raw(`ALTER TYPE "incidents_status_check" RENAME TO "incidents_status_check_old"`);
        // Note: Knex enus are actually check constraints on strings in many cases, or native enums.
        // Let's check how it was created.
    } catch (e) {
        // Fallback: Just update the check constraint if it's not a native type
    }

    // Safer approach for Hackathon: Add column flag or just use the string if type allows.
    // Initial migration used: table.enu('status', ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED']).defaultTo('OPEN');
    
    // In many PG setups, this is a check constraint. Let's try to replace it.
    await knex.raw(`ALTER TABLE incidents DROP CONSTRAINT IF EXISTS incidents_status_check`);
    await knex.raw(`ALTER TABLE incidents ADD CONSTRAINT incidents_status_check CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED', 'MANUAL_REVIEW'))`);
};

exports.down = async function(knex) {
    await knex.raw(`ALTER TABLE incidents DROP CONSTRAINT IF EXISTS incidents_status_check`);
    await knex.raw(`ALTER TABLE incidents ADD CONSTRAINT incidents_status_check CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'))`);
};
