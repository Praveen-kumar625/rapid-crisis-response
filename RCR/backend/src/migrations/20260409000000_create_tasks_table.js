/**
 * 🛠️ Phase 1: Tactical Responder Mesh
 * Table: tasks
 */

exports.up = async function(knex) {
    await knex.schema.createTable('tasks', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('incident_id').notNullable().references('id').inTable('incidents').onDelete('CASCADE');
        table.text('instruction').notNullable();
        table.enu('assigned_role', ['SECURITY', 'MEDIC', 'INFRA', 'MANAGEMENT']).notNullable();
        table.enu('status', ['PENDING', 'DISPATCHED', 'ACKNOWLEDGED', 'SECURED']).defaultTo('PENDING');
        table.string('evidence_url').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());

        // Performance Indices
        table.index('incident_id', 'tasks_incident_id_idx');
        table.index('status', 'tasks_status_idx');
    });
};

exports.down = async function(knex) {
    await knex.schema.dropTableIfExists('tasks');
};
