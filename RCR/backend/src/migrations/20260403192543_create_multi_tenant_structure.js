/**
 * Multi-tenancy migration: Adds hotels table and hotel_id to users and incidents.
 */
exports.up = async function(knex) {
    // 1. Create Hotels table
    await knex.schema.createTable('hotels', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('name').notNullable();
        table.string('address');
        table.string('subscription_tier').defaultTo('ESSENTIAL'); // ESSENTIAL, INTELLIGENT, ENTERPRISE
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });

    // 2. Add hotel_id to Users
    await knex.schema.alterTable('users', (table) => {
        table.uuid('hotel_id').references('id').inTable('hotels').onDelete('SET NULL');
    });

    // 3. Add hotel_id to Incidents
    await knex.schema.alterTable('incidents', (table) => {
        table.uuid('hotel_id').references('id').inTable('hotels').onDelete('CASCADE');
        // Composite index for multi-tenant filtering
        table.index(['hotel_id', 'status'], 'incidents_hotel_status_idx');
    });

    // 4. Seed a default hotel for existing data (optional but recommended for hackathon robustness)
    const [defaultHotel] = await knex('hotels').insert({
        name: 'Grand Hackathon Resort',
        address: '123 Cloud Avenue',
        subscription_tier: 'ENTERPRISE'
    }).returning('id');

    // Update existing users and incidents to point to the default hotel
    await knex('users').update({ hotel_id: defaultHotel.id });
    await knex('incidents').update({ hotel_id: defaultHotel.id });
};

exports.down = async function(knex) {
    await knex.schema.alterTable('incidents', (table) => {
        table.dropIndex(['hotel_id', 'status'], 'incidents_hotel_status_idx');
        table.dropColumn('hotel_id');
    });
    await knex.schema.alterTable('users', (table) => {
        table.dropColumn('hotel_id');
    });
    await knex.schema.dropTableIfExists('hotels');
};
