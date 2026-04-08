const { v4: uuidv4 } = require('uuid');

/**
 * Simulate hotel IoT events as incidents.
 * Generates realistic fire, smoke, and CO2 sensor data across different floors.
 */
function generateHotelIoTEvent() {
    const wings = ['A', 'B', 'C', 'D'];
    const floors = [1, 2, 3, 4, 5];
    const roomPrefixes = ['1', '2', '3', '4', '5'];
    
    // Randomly select a location
    const wing = wings[Math.floor(Math.random() * wings.length)];
    const floor = floors[Math.floor(Math.random() * floors.length)];
    const room = `${roomPrefixes[floor - 1]}${Math.floor(Math.random() * 20 + 1).toString().padStart(2, '0')}`;

    // Sensor type distribution
    const eventTypes = [
        {
            type: 'FIRE',
            severity: 5,
            getDetails: () => {
                const temp = Math.floor(Math.random() * 40 + 60); // 60-100°C
                return {
                    title: `🔥 High Heat Alert: Floor ${floor}`,
                    description: `Thermal sensor in Room ${room} (Wing ${wing}) detected extreme temperature: ${temp}°C. Potential fire breakout.`,
                    sensor_data: { temperature: temp, unit: 'Celsius' }
                };
            }
        },
        {
            type: 'SMOKE',
            severity: 4,
            getDetails: () => {
                const density = (Math.random() * 0.5 + 0.5).toFixed(2); // 0.5-1.0 obscuration/m
                return {
                    title: `💨 Smoke Detected: Room ${room}`,
                    description: `Optical smoke sensor triggered in Wing ${wing}, Room ${room}. Density: ${density} obs/m.`,
                    sensor_data: { smoke_density: parseFloat(density), unit: 'obs/m' }
                };
            }
        },
        {
            type: 'CO2',
            severity: 3,
            getDetails: () => {
                const level = Math.floor(Math.random() * 3000 + 2000); // 2000-5000 ppm
                return {
                    title: `⚠️ CO2 Level Critical: Wing ${wing}`,
                    description: `Air quality sensor in Wing ${wing}, Floor ${floor} reports critical CO2 levels: ${level} ppm. Evacuate or ventilate immediately.`,
                    sensor_data: { co2_level: level, unit: 'ppm' }
                };
            }
        }
    ];

    // Pick a random event type
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const details = eventType.getDetails();

    // Mock coordinates within a bounding box (e.g., around a hotel site)
    const baseLat = 28.6139;
    const baseLng = 77.2090;
    const lat = baseLat + (Math.random() - 0.5) * 0.01;
    const lng = baseLng + (Math.random() - 0.5) * 0.01;

    return {
        id: uuidv4(),
        title: details.title,
        description: details.description,
        severity: eventType.severity,
        category: eventType.type === 'CO2' ? 'INFRASTRUCTURE' : 'FIRE',
        wing_id: wing,
        floor_level: floor,
        room_number: room,
        location: { type: 'Point', coordinates: [lng, lat] },
        reportedBy: 'SYSTEM_IOT',
        sensor_metadata: details.sensor_data,
        status: 'OPEN',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        external_id: `HOTEL_IOT_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    };
}

module.exports = { generateHotelIoTEvent };
