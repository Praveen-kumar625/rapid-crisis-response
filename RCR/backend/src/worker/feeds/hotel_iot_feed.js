const { v4: uuidv4 } = require('uuid');

/**
 * Simulate hotel IoT events as incidents.
 */
function generateHotelIoTEvent() {
    const samples = [{
            title: 'Smoke detector triggered',
            description: 'Smoke detector triggered in Room 304, Wing B, Floor 3.',
            category: 'FIRE',
            wingId: 'B',
            floorLevel: 3,
            roomNumber: '304',
            severity: 4,
            coordinates: [77.0, 28.5],
        },
        {
            title: 'Unauthorized entry detected',
            description: 'Door forced open in Room 210, Wing A, Floor 2.',
            category: 'INTRUDER',
            wingId: 'A',
            floorLevel: 2,
            roomNumber: '210',
            severity: 4,
            coordinates: [77.001, 28.501],
        },
        {
            title: 'Medical call button pressed',
            description: 'Guest in Room 512, Wing C, Floor 5 requests urgent assistance.',
            category: 'MEDICAL',
            wingId: 'C',
            floorLevel: 5,
            roomNumber: '512',
            severity: 5,
            coordinates: [77.002, 28.502],
        },
        {
            title: 'HVAC failure alert',
            description: 'Critical HVAC sensor failure in Wing D, Floor 1.',
            category: 'INFRASTRUCTURE',
            wingId: 'D',
            floorLevel: 1,
            roomNumber: 'N/A',
            severity: 3,
            coordinates: [77.003, 28.503],
        },
    ];

    const sample = samples[Math.floor(Math.random() * samples.length)];
    return {
        id: uuidv4(),
        title: sample.title,
        description: sample.description,
        severity: sample.severity,
        category: sample.category,
        wing_id: sample.wingId,
        floor_level: sample.floorLevel,
        room_number: sample.roomNumber,
        location: { type: 'Point', coordinates: sample.coordinates },
        indoor_location: { type: 'Point', coordinates: sample.coordinates },
        reportedBy: 'HOTEL_IOT_FEED',
        status: 'OPEN',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        external_id: `HOTEL_IOT_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    };
}

module.exports = { generateHotelIoTEvent };