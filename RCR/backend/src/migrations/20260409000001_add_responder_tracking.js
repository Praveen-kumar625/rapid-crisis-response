/**
 * 🛠️ Phase 3: Resource Command & Control
 * Adds responder status and location tracking to users.
 */

exports.up = async function(knex) {
    await knex.schema.table('users', (table) => {
        table.enu('responder_status', ['AVAILABLE', 'BUSY', 'OFF_DUTY']).defaultTo('OFF_DUTY');
        table.string('responder_role'); // Specific role like 'HEAD_SECURITY', 'TRAUMA_MEDIC'
        table.integer('current_floor').defaultTo(1);
        table.string('current_wing').defaultTo('unknown');
        table.timestamp('last_location_update');
    });
};

exports.down = async function(knex) {
    await knex.schema.table('users', (table) => {
        table.dropColumn('responder_status');
        table.dropColumn('responder_role');
        table.dropColumn('current_floor');
        table.dropColumn('current_wing');
        table.dropColumn('last_location_update');
    });
};
