/**
 * 🛠️ SCHEMA REFINEMENT: MANUAL REVIEW STATE
 * Version: 1.4.0
 * Purpose: Add 'MANUAL_REVIEW' to incident status for graceful AI degradation.
 */

exports.up = async function(knex) {
    // 1. Drop the existing check constraint created by table.enu
    // We use raw SQL because the constraint name is predictable in Knex (table_column_check)
    await knex.raw(`ALTER TABLE incidents DROP CONSTRAINT IF EXISTS incidents_status_check`);

    // 2. Add the updated check constraint including MANUAL_REVIEW
    await knex.raw(`ALTER TABLE incidents ADD CONSTRAINT incidents_status_check CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED', 'MANUAL_REVIEW'))`);
};

exports.down = async function(knex) {
    await knex.raw(`ALTER TABLE incidents DROP CONSTRAINT IF EXISTS incidents_status_check`);
    await knex.raw(`ALTER TABLE incidents ADD CONSTRAINT incidents_status_check CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'))`);
};

