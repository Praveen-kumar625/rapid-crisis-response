/**
 * Add triage_method column to incidents table.
 */
exports.up = function(knex) {
    return knex.schema.alterTable('incidents', (table) => {
        table.string('triage_method').defaultTo('Cloud AI (Gemini)');
    });
};

exports.down = function(knex) {
    return knex.schema.alterTable('incidents', (table) => {
        table.dropColumn('triage_method');
    });
};
