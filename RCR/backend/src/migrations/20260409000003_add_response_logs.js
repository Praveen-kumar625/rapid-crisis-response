/**
 * 🛡️ AUDIT LOGS & RESPONSE TRACKING
 * Version: 1.2.0
 * Purpose: Track all state transitions for incidents and responder actions for liability auditing.
 */

exports.up = async function(knex) {
    // 1. Create response_logs table
    await knex.schema.createTable('response_logs', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('incident_id').references('id').inTable('incidents').onDelete('CASCADE').notNullable();
        table.string('user_id').references('id').inTable('users').onDelete('SET NULL');
        table.string('action').notNullable(); // e.g., 'ACKNOWLEDGED', 'SECURED', 'STATUS_CHANGE'
        table.string('previous_status');
        table.string('new_status');
        table.text('note');
        table.jsonb('metadata').defaultTo('{}');
        table.timestamp('created_at').defaultTo(knex.fn.now());

        // Performance Indices
        table.index('incident_id');
        table.index('user_id');
    });

    // 2. Ensure Tasks table is properly hardened (if not already handled in previous migrations)
    const hasTasks = await knex.schema.hasTable('tasks');
    if (!hasTasks) {
        await knex.schema.createTable('tasks', (table) => {
            table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
            table.uuid('incident_id').references('id').inTable('incidents').onDelete('CASCADE').notNullable();
            table.string('assigned_to').references('id').inTable('users').onDelete('SET NULL');
            table.string('assigned_role');
            table.text('instruction').notNullable();
            table.enu('status', ['PENDING', 'DISPATCHED', 'ACKNOWLEDGED', 'SECURED', 'CANCELLED']).defaultTo('PENDING');
            table.integer('floor_level');
            table.string('wing_id');
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());

            table.index('incident_id');
            table.index('assigned_to');
        });
    }
};

exports.down = async function(knex) {
    await knex.schema.dropTableIfExists('response_logs');
};
