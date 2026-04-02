const { v4: uuidv4 } = require('uuid');

/**
 * Simulate hotel IoT events as incidents.
 */
function generateHotelIoTEvents() {
    const samples = [{
            title: 'Smoke detector triggered',
            description: 'Smoke detector triggered in Room 304, Wing B, Floor 3.',
            category: 'FIRE',
            wingId: 'B',
            floorLevel: 3,
            roomNumber: '304',
            severity: 4,
        },
        {
            title: 'Unauthorized entry detected',
            description: 'Door forced open in Room 210, Wing A, Floor 2.',
            category: 'INTRUDER',
            wingId: 'A',
            floorLevel: 2,
            roomNumber: '210',
            severity: 4,
        },
        {
            title: 'Medical call button pressed',
            description: 'Guest in Room 512, Wing C, Floor 5 requests urgent assistance.',
            category: 'MEDICAL',
            wingId: 'C',
            floorLevel: 5,
            roomNumber: '512',
            severity: 5,
        },
        {
            title: 'HVAC failure alert',
            description: 'Critical HVAC sensor failure in Wing D, Floor 1.',
            category: 'INFRASTRUCTURE',
            wingId: 'D',
            floorLevel: 1,
            roomNumber: 'N/A',
            severity: 3,
        },
    ];

    const candidate = samples[Math.floor(Math.random() * samples.length)];

    return {
        id: uuidv4(),
        title: candidate.title,
        description: candidate.description,
        severity: candidate.severity,
        category: candidate.category,
        floorLevel: candidate.floorLevel,
        roomNumber: candidate.roomNumber,
        wingId: candidate.wingId,
        indoorLocation: { type: 'Point', coordinates: [0, 0] },
        reportedBy: 'HOTEL_IOT_FEED',
        status: 'OPEN',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        externalId: `HOTEL_IOT_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    };
}

module.exports = { generateHotelIoTEvents };