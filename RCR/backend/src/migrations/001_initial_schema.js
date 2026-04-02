/**
 * Knex migration – creates tables with PostGIS geometry support.
 */
exports.up = async function(knex) {
    // Enable PostGIS extension
    await knex.raw('CREATE EXTENSION IF NOT EXISTS postgis');

    // Users (minimal – used only for FK)
    await knex.schema.createTable('users', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('email').unique().notNullable();
        table.string('name');
        table
            .enu('role', ['CITIZEN', 'RESPONDER', 'ADMIN'])
            .defaultTo('CITIZEN');
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });

    // Incidents
    await knex.schema.createTable('incidents', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('title').notNullable();
        table.text('description');
        table.integer('severity').notNullable().checkBetween([1, 5]);
        table.string('category').notNullable();
        table
            .specificType('location', 'GEOMETRY(Point,4326)')
            .notNullable()
            .index('incidents_location_idx', null, 'GIST');
        table.integer('floor_level').notNullable().defaultTo(1);
        table.string('room_number').notNullable().defaultTo('unknown');
        table.string('wing_id').notNullable().defaultTo('unknown');
        table
            .specificType('indoor_location', 'GEOMETRY(Point,4326)')
            .notNullable()
            .index('incidents_indoor_location_idx', null, 'GIST');
        table.uuid('reported_by').references('id').inTable('users');
        table.float('spam_score').defaultTo(0.0);
        table.integer('auto_severity').defaultTo(1);
        table.text('ai_action_plan');
        table.jsonb('ai_required_resources');
        table.string('hospitality_category');
        table.string('media_type');
        table.text('media_base64');
        table
            .enu('status', ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])
            .defaultTo('OPEN');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.string('external_id'); // optional, used for deduplication
    });
};

exports.down = async function(knex) {
    await knex.schema.dropTableIfExists('incidents');
    await knex.schema.dropTableIfExists('users');
};