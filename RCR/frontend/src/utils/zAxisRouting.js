/**
 * Rapid Crisis Response - Z-Axis Spatial Routing Engine (Ultra Level)
 * Provides real-time hazard-aware evacuation paths.
 */

const EXITS = [
    { id: 'EXIT_A', x: 50, y: 5, label: 'EVAC_STAIRS_A', wing: 'NORTH' },
    { id: 'EXIT_B', x: 50, y: 95, label: 'EVAC_STAIRS_B', wing: 'SOUTH' }
];

const ROOM_COORDS = {
    '01': { x: 10, y: 15 },
    '02': { x: 40, y: 15 },
    '03': { x: 65, y: 15 },
    '04': { x: 10, y: 45 },
    '05': { x: 70, y: 45 },
    '06': { x: 35, y: 75 },
};

/**
 * Calculates the safest route based on current incident and live IoT hazards.
 */
export function getDynamicSafeRoute(activeFloor, startRoomId, liveHazards = []) {
    const startPoint = ROOM_COORDS[startRoomId] || { x: 35, y: 65 };
    
    // 1. Identify critical hazards on the current floor
    const floorHazards = liveHazards.filter(h => h.floorLevel === activeFloor && h.severity >= 3);

    // 2. Weight each exit based on hazard proximity
    const exitScoring = EXITS.map(exit => {
        let hazardScore = 0;
        floorHazards.forEach(hazard => {
            const hazardRoomId = hazard.roomNumber.toString().slice(-2);
            const hazardCoord = ROOM_COORDS[hazardRoomId];
            if (hazardCoord) {
                const dist = Math.sqrt(Math.pow(exit.x - hazardCoord.x, 2) + Math.pow(exit.y - hazardCoord.y, 2));
                // Higher severity and closer distance = higher hazard score
                hazardScore += (hazard.severity * 100) / (dist + 1);
            }
        });
        return { ...exit, hazardScore };
    });

    // 3. Select the exit with the lowest hazard score
    const bestExit = exitScoring.reduce((prev, curr) => 
        prev.hazardScore <= curr.hazardScore ? prev : curr
    );

    // 4. Build SVG Path (Standardized Hallway at X=50)
    const hallwayX = 50;
    const svgPath = `M ${startPoint.x} ${startPoint.y} L ${hallwayX} ${startPoint.y} L ${hallwayX} ${bestExit.y} L ${bestExit.x} ${bestExit.y}`;

    // 5. Generate Textual Instructions
    let instructions = `FROM ROOM ${activeFloor}${startRoomId}: Proceed to central hallway. `;
    if (bestExit.id === 'EXIT_A') {
        instructions += `Move NORTH towards ${bestExit.label}.`;
    } else {
        instructions += `Move SOUTH towards ${bestExit.label}.`;
    }

    const highHeatHazards = floorHazards.filter(h => h.sensorMetadata?.temperature > 60);
    const recommendations = [];
    if (highHeatHazards.length > 0) {
        recommendations.push(`AVOID ZONE ${bestExit.wing === 'NORTH' ? 'SOUTH' : 'NORTH'} - High thermal activity detected.`);
        recommendations.push('Stay low to avoid smoke inhalation.');
    }

    return {
        exitId: bestExit.id,
        exitLabel: bestExit.label,
        svgPath,
        instructions,
        recommendations,
        hazardLevel: floorHazards.length > 0 ? 'ELEVATED' : 'OPTIMAL'
    };
}

// Keep legacy support for static incident objects
export function getSafeRoute(incident) {
    const { floorLevel, wingId, category, severity } = incident;
    const route = {
        primaryPath: floorLevel > 1 ? `Descend via Staircase ${wingId}.` : `Exit via Ground Lobby ${wingId}.`,
        hazards: severity >= 4 ? ['High priority hazard in vicinity.'] : [],
        estimatedTime: '4-6 Minutes',
        recommendations: category === 'FIRE' ? ['Stay low', 'No elevators'] : []
    };
    return route;
}
