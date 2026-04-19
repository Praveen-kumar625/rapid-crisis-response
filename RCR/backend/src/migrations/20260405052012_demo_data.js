exports.up = async function(knex) {
    const hotel = await knex('hotels').first();
    if (!hotel) {
        console.warn('[Migration] No hotel found to attach demo incidents to. Skipping.');
        return;
    }

    const demoIncidents = [
        {
            title: 'Cardiac Arrest - Suite 402',
            description: 'Guest collapsed in room. Automated AED request triggered by room sensor. High urgency.',
            severity: 5,
            category: 'MEDICAL',
            lat: 28.6139,
            lng: 77.2090,
            floor_level: 4,
            room_number: '402',
            wing_id: 'NORTH',
            hospitality_category: 'MEDICAL',
            auto_severity: 5,
            spam_score: 0.01,
            ai_action_plan: '1. Dispatch Paramedics to Room 402 immediately.\n2. Enable elevator priority for responder team.\n3. Notify Duty Manager.',
            ai_required_resources: JSON.stringify(['Paramedics', 'Duty Manager', 'Security']),
            triage_method: 'Distributed Cloud Gemini',
            status: 'IN_PROGRESS',
            hotel_id: hotel.id
        },
        {
            title: 'Uncontained Fire - Kitchen Level 1',
            description: 'Thermal sensors detected 400C in deep fry station. Suppression system malfunction reported.',
            severity: 5,
            category: 'FIRE',
            lat: 28.6145,
            lng: 77.2095,
            floor_level: 1,
            room_number: 'KITCHEN-01',
            wing_id: 'WEST',
            hospitality_category: 'FIRE',
            auto_severity: 5,
            spam_score: 0.05,
            ai_action_plan: '1. Initiate Zone B Evacuation.\n2. Manual suppression override requested.\n3. Fire Department dispatched via Auto-Call.',
            ai_required_resources: JSON.stringify(['Fire Team', 'Evacuation Marshals']),
            triage_method: 'Edge AI (WASM NLP)',
            status: 'OPEN',
            hotel_id: hotel.id
        },
        {
            title: 'Suspicious Package - Lobby Entrance',
            description: 'Unattended metallic suitcase left near main concierge. Visual AI flagged anomalous heat signature.',
            severity: 4,
            category: 'SECURITY',
            lat: 28.6130,
            lng: 77.2085,
            floor_level: 0,
            room_number: 'LOBBY',
            wing_id: 'MAIN',
            hospitality_category: 'SECURITY',
            auto_severity: 4,
            spam_score: 0.1,
            ai_action_plan: '1. Cordon off 50m radius around Concierge.\n2. Deploy EOD unit.\n3. Review CCTV feed for individual who left the package.',
            ai_required_resources: JSON.stringify(['Security Officers', 'Bomb Squad']),
            triage_method: 'Distributed Cloud Gemini',
            status: 'IN_PROGRESS',
            hotel_id: hotel.id
        },
        {
            title: 'Major Water Leak - Floor 12',
            description: 'Pipe burst in maintenance shaft. Significant flooding in hallway. Risk of structural short-circuit.',
            severity: 3,
            category: 'INFRASTRUCTURE',
            lat: 28.6135,
            lng: 77.2100,
            floor_level: 12,
            room_number: 'MAINT-SHAFT-3',
            wing_id: 'EAST',
            hospitality_category: 'INFRASTRUCTURE',
            auto_severity: 3,
            spam_score: 0.02,
            ai_action_plan: '1. Shut off main riser for East Wing.\n2. Deploy maintenance engineers.\n3. Relocate guests from impacted floor.',
            ai_required_resources: JSON.stringify(['Maintenance Team', 'Housekeeping']),
            triage_method: 'Cloud AI',
            status: 'RESOLVED',
            hotel_id: hotel.id
        },
        {
            title: 'Anaphylaxis - Breakfast Buffet',
            description: 'Guest reported severe allergic reaction to peanuts. EpiPen deployed by staff.',
            severity: 4,
            category: 'MEDICAL',
            lat: 28.6140,
            lng: 77.2080,
            floor_level: 1,
            room_number: 'RESTAURANT',
            wing_id: 'SOUTH',
            hospitality_category: 'MEDICAL',
            auto_severity: 4,
            spam_score: 0.01,
            ai_action_plan: '1. Maintain airway until medical arrives.\n2. Incident report logged for kitchen cross-contamination audit.',
            ai_required_resources: JSON.stringify(['First Aid Staff', 'Medical Response']),
            triage_method: 'Distributed Cloud Gemini',
            status: 'RESOLVED',
            hotel_id: hotel.id
        }
    ];

    await knex('incidents').insert(demoIncidents);
};

exports.down = async function(knex) {
    await knex('incidents').del();
};
