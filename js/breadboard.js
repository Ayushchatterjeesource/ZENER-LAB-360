

/* =========================================
   ZENER-LAB-360
   FILE: breadboard.js

   Breadboard Layout & Connection Mapping
========================================= */

import * as THREE from
    'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';


/* ---------- Breadboard Configuration ---------- */

export const BREADBOARD_CONFIG = {
    rows: 30,
    columns: 10,

    spacingX: 0.36,
    spacingZ: 0.34,

    surfaceY: 0.285,

    centerGap: 0.45,

    width: 12,
    depth: 7,

    powerRails: {
        positive: [-2.9, 2.9],
        negative: [-2.5, 2.5]
    }
};


/* ---------- Coordinate Helpers ---------- */

export function getHolePosition(row, column) {

    const config = BREADBOARD_CONFIG;

    if (
        row < 1 ||
        row > config.rows ||
        column < 1 ||
        column > config.columns
    ) {
        return null;
    }

    const z =
        (column - 5.5) * config.spacingZ;

    // The center channel has no connection holes.
    if (Math.abs(z) < config.centerGap / 2) {
        return null;
    }

    return new THREE.Vector3(
        (row - 15.5) * config.spacingX,
        config.surfaceY,
        z
    );
}


/* ---------- Terminal Identification ---------- */

export function getTerminalName(row, column) {

    if (
        row < 1 ||
        row > BREADBOARD_CONFIG.rows ||
        column < 1 ||
        column > BREADBOARD_CONFIG.columns
    ) {
        return null;
    }

    const position = getHolePosition(row, column);

    if (!position) {
        return null;
    }

    const side = column <= 5
        ? 'upper'
        : 'lower';

    return `${side}-${row}-${column}`;
}


/* ---------- Breadboard Connection Groups ---------- */

/*
    Standard breadboard layout:

    Each row of five holes on one side
    is electrically connected internally.

    The center gap separates the two sides.

    Power rails run lengthwise.
*/

export function getConnectedGroup(row, column) {

    const position = getHolePosition(row, column);

    if (!position) {
        return null;
    }

    const side = column <= 5
        ? 'upper'
        : 'lower';

    return {
        id: `${side}-row-${row}`,
        row,
        side,
        columns: side === 'upper'
            ? [1, 2, 3, 4, 5]
            : [6, 7, 8, 9, 10]
    };
}


/* ---------- Electrical Connectivity ---------- */

export function areHolesConnected(
    first,
    second
) {

    if (!first || !second) {
        return false;
    }

    // Same physical hole
    if (
        first.row === second.row &&
        first.column === second.column
    ) {
        return true;
    }

    const firstGroup = getConnectedGroup(
        first.row,
        first.column
    );

    const secondGroup = getConnectedGroup(
        second.row,
        second.column
    );

    if (!firstGroup || !secondGroup) {
        return false;
    }

    // Same internal terminal strip
    return firstGroup.id === secondGroup.id;
}


/* ---------- Hole Validation ---------- */

export function isValidHole(row, column) {

    return Boolean(
        getHolePosition(row, column)
    );
}


/* ---------- Generate All Hole Coordinates ---------- */

export function generateHoleMap() {

    const holes = [];

    for (
        let row = 1;
        row <= BREADBOARD_CONFIG.rows;
        row++
    ) {

        for (
            let column = 1;
            column <= BREADBOARD_CONFIG.columns;
            column++
        ) {

            const position = getHolePosition(
                row,
                column
            );

            if (!position) {
                continue;
            }

            holes.push({
                id: `R${row}-C${column}`,

                row,
                column,

                position: {
                    x: position.x,
                    y: position.y,
                    z: position.z
                },

                group: getConnectedGroup(
                    row,
                    column
                ).id
            });
        }
    }

    return holes;
}


/* ---------- Power Rail Coordinates ---------- */

export function getPowerRailPosition(
    rail,
    row
) {

    const config = BREADBOARD_CONFIG;

    if (
        row < 1 ||
        row > config.rows
    ) {
        return null;
    }

    const railPositions = {
        positiveTop: -2.9,
        negativeTop: -2.5,
        negativeBottom: 2.5,
        positiveBottom: 2.9
    };

    const z = railPositions[rail];

    if (z === undefined) {
        return null;
    }

    return new THREE.Vector3(
        (row - 15.5) * config.spacingX,
        config.surfaceY,
        z
    );
}


/* ---------- Create Breadboard Hole Markers ---------- */

export function createHoleMarkers(
    scene,
    options = {}
) {

    const {
        radius = 0.045,
        color = 0x073d32,
        visible = false
    } = options;

    const group = new THREE.Group();

    const geometry = new THREE.CylinderGeometry(
        radius,
        radius,
        0.018,
        12
    );

    const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.85
    });

    const holeMap = generateHoleMap();

    holeMap.forEach(hole => {

        const marker = new THREE.Mesh(
            geometry,
            material
        );

        marker.position.set(
            hole.position.x,
            hole.position.y + 0.015,
            hole.position.z
        );

        marker.userData = {
            type: 'breadboard-hole',
            holeId: hole.id,
            row: hole.row,
            column: hole.column,
            group: hole.group
        };

        group.add(marker);
    });

    group.visible = visible;

    if (scene) {
        scene.add(group);
    }

    return group;
}


/* ---------- Find Holes in Same Row ---------- */

export function getRowHoles(row, side = 'upper') {

    const columns = side === 'upper'
        ? [1, 2, 3, 4, 5]
        : [6, 7, 8, 9, 10];

    return columns.map(column => {

        const position = getHolePosition(
            row,
            column
        );

        if (!position) {
            return null;
        }

        return {
            row,
            column,
            position
        };

    }).filter(Boolean);
}


/* ---------- Breadboard Connection Checker ---------- */

export function checkConnection(
    first,
    second
) {

    const connected = areHolesConnected(
        first,
        second
    );

    return {
        connected,

        message: connected
            ? 'These holes belong to the same internal terminal strip.'
            : 'These holes are electrically separate.'
    };
}


/* ---------- Export Breadboard API ---------- */

export const Breadboard = {

    config: BREADBOARD_CONFIG,

    getHolePosition,

    getTerminalName,

    getConnectedGroup,

    areHolesConnected,

    isValidHole,

    generateHoleMap,

    getPowerRailPosition,

    createHoleMarkers,

    getRowHoles,

    checkConnection
};

export default Breadboard;
