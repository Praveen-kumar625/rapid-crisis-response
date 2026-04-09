/**
 * 🛠️ Phase 4: Resilience & Audit Hardening
 * Table: audit_logs
 */

exports.up = async function(knex) {
    await knex.schema.createTable('audit_logs', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('incident_id').nullable().references('id').inTable('incidents').onDelete('SET NULL');
        table.string('action_type').notNullable(); // e.g., 'STATUS_CHANGE', 'TASK_ASSIGNED', 'MASS_ALERT'
        table.string('actor_id').notNullable(); // User ID who performed the action
        table.jsonb('payload').defaultTo('{}'); // Raw data of the change
        table.text('description');
        table.timestamp('created_at').defaultTo(knex.fn.now());

        table.index('incident_id');
        table.index('action_type');
    });
};

exports.down = async function(knex) {
    await knex.schema.dropTableIfExists('audit_logs');
};
