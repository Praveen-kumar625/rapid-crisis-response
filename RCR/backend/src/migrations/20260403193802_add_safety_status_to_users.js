/**
 * Add safety_status and last_pulse_at to users table for real-time accountability.
 */
exports.up = function(knex) {
    return knex.schema.alterTable('users', (table) => {
        table.enu('safety_status', ['SAFE', 'UNKNOWN', 'UNSAFE']).defaultTo('UNKNOWN');
        table.timestamp('last_pulse_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
    return knex.schema.alterTable('users', (table) => {
        table.dropColumn('safety_status');
        table.dropColumn('last_pulse_at');
    });
};
