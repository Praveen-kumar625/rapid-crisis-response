/**
 * 🏨 GUESTS & RESIDENCY TRACKING
 * Version: 1.3.0
 * Purpose: Track hotel guests, their stay duration, and assigned rooms for precise crisis response.
 */

exports.up = async function(knex) {
    // 1. Create guests table
    await knex.schema.createTable('guests', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('user_id').references('id').inTable('users').onDelete('CASCADE').unique();
        table.uuid('hotel_id').references('id').inTable('hotels').onDelete('CASCADE').notNullable();
        table.string('room_number').notNullable();
        table.string('wing_id').defaultTo('A');
        table.integer('floor_level').defaultTo(1);
        table.timestamp('check_in_at').defaultTo(knex.fn.now());
        table.timestamp('check_out_at');
        table.enu('guest_status', ['CHECKED_IN', 'CHECKED_OUT', 'EMERGENCY_EVACUATED']).defaultTo('CHECKED_IN');
        table.jsonb('metadata').defaultTo('{}');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());

        // Performance Indices
        table.index(['hotel_id', 'room_number']);
        table.index('guest_status');
    });

    // 2. Add phone number to users if missing (for Twilio integration)
    const hasPhone = await knex.schema.hasColumn('users', 'phone');
    if (!hasPhone) {
        await knex.schema.table('users', (table) => {
            table.string('phone');
        });
    }
};

exports.down = async function(knex) {
    await knex.schema.dropTableIfExists('guests');
};
