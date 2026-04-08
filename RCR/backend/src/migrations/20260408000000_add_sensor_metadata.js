/**
 * Add sensor_metadata column to incidents table for IoT integration.
 */
exports.up = async function(knex) {
    await knex.schema.alterTable('incidents', (table) => {
        table.jsonb('sensor_metadata').nullable();
    });
};

exports.down = async function(knex) {
    await knex.schema.alterTable('incidents', (table) => {
        table.dropColumn('sensor_metadata');
    });
};
