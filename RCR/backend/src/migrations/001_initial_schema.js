/**
 * 🛡️ CONSOLIDATED MASTER MIGRATION
 * Version: 1.0.0
 * Includes: Users, Hotels, Incidents (Standard PG, No PostGIS required)
 */

exports.up = async function(knex) {
    // 0. Clean up existing tables to prevent "Already Exists" errors during initial deployment fixes
    await knex.schema.dropTableIfExists('incidents');
    await knex.schema.dropTableIfExists('users');
    await knex.schema.dropTableIfExists('hotels');

    // 1. Create Hotels Table (Multi-tenancy root)
    await knex.schema.createTable('hotels', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('name').notNullable();
        table.string('address');
        table.string('subscription_tier').defaultTo('ESSENTIAL'); 
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });

    // 2. Create Users Table
    await knex.schema.createTable('users', (table) => {
        table.string('id').primary(); // Firebase UID
        table.string('email').unique().notNullable();
        table.string('name');
        table.enu('role', ['CITIZEN', 'RESPONDER', 'ADMIN']).defaultTo('CITIZEN');
        table.string('safety_status').defaultTo('SAFE');
        table.uuid('hotel_id').references('id').inTable('hotels').onDelete('SET NULL');
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });

    // 3. Create Incidents Table
    await knex.schema.createTable('incidents', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('title').notNullable();
        table.text('description');
        table.integer('severity').notNullable().defaultTo(3);
        table.string('category').notNullable();
        
        // Location (Standard Float for compatibility)
        table.float('lat').notNullable();
        table.float('lng').notNullable();
        
        // Hotel Indoor Context
        table.integer('floor_level').notNullable().defaultTo(1);
        table.string('room_number').notNullable().defaultTo('unknown');
        table.string('wing_id').notNullable().defaultTo('unknown');
        table.float('indoor_lat');
        table.float('indoor_lng');

        // Metadata & AI
        table.string('reported_by').references('id').inTable('users');
        table.uuid('hotel_id').references('id').inTable('hotels').onDelete('CASCADE');
        table.float('spam_score').defaultTo(0.0);
        table.integer('auto_severity').defaultTo(1);
        table.text('ai_action_plan');
        table.jsonb('ai_required_resources').defaultTo('[]');
        table.string('hospitality_category').defaultTo('INFRASTRUCTURE');
        table.string('triage_method').defaultTo('Cloud AI (Gemini)');
        
        // Media
        table.string('media_type');
        table.text('media_base64');
        
        // Status
        table.enu('status', ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED']).defaultTo('OPEN');
        
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());

        // Indices for Performance
        table.index('hotel_id', 'incidents_hotel_id_idx');
        table.index(['hotel_id', 'status'], 'incidents_hotel_status_idx');
    });

    // 4. Seed Default Data for Hackathon
    const [defaultHotel] = await knex('hotels').insert({
        name: 'Grand Hackathon Resort',
        address: '123 Tech Avenue',
        subscription_tier: 'ENTERPRISE'
    }).returning('*');

    console.log(`[Migration] ✅ Seeded default hotel: ${defaultHotel.name} (${defaultHotel.id})`);
};

exports.down = async function(knex) {
    await knex.schema.dropTableIfExists('incidents');
    await knex.schema.dropTableIfExists('users');
    await knex.schema.dropTableIfExists('hotels');
};
