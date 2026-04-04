/**
 * Knex migration – Standard PostgreSQL (No PostGIS extension required)
 */
exports.up = async function(knex) {
    // Users Table
    await knex.schema.createTable('users', (table) => {
        table.string('id').primary();
        table.string('email').unique().notNullable();
        table.string('name');
        table.enu('role', ['CITIZEN', 'RESPONDER', 'ADMIN']).defaultTo('CITIZEN');
        table.string('safety_status').defaultTo('SAFE');
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });

    // Incidents Table
    await knex.schema.createTable('incidents', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('title').notNullable();
        table.text('description');
        table.integer('severity').notNullable();
        table.string('category').notNullable();
        
        // 🚀 FIXED: Using standard float columns for maximum compatibility
        table.float('lat').notNullable();
        table.float('lng').notNullable();
        
        table.integer('floor_level').notNullable().defaultTo(1);
        table.string('room_number').notNullable().defaultTo('unknown');
        table.string('wing_id').notNullable().defaultTo('unknown');
        
        // Indoor coordinates
        table.float('indoor_lat');
        table.float('indoor_lng');

        table.string('reported_by').references('id').inTable('users');
        table.float('spam_score').defaultTo(0.0);
        table.integer('auto_severity').defaultTo(1);
        table.text('ai_action_plan');
        table.jsonb('ai_required_resources');
        table.string('hospitality_category');
        table.string('triage_method').defaultTo('Cloud AI');
        table.string('media_type');
        table.text('media_base64');
        
        table.enu('status', ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED']).defaultTo('OPEN');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};

exports.down = async function(knex) {
    await knex.schema.dropTableIfExists('incidents');
    await knex.schema.dropTableIfExists('users');
};
