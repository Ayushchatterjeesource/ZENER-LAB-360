
/* =====================================================
   ZENER-LAB-360
   FILE: js/breadboard.js

   Breadboard Coordinates
   Electrical Nodes
   Three.js Hole Markers
===================================================== */

import * as THREE from 'three';

export class BreadboardSystem {

    constructor(options = {}) {

        this.config = {

            rows: 30,
            columns: 10,

            holeSpacingX: 0.25,
            holeSpacingZ: 0.25,

            centerGap: 0.55,
            railSpacing: 0.25,

            startX: -1.125,
            startZ: -3.625,

            ...options

        };

        this.holes = new Map();
        this.nodes = new Map();
        this.components = new Map();
        this.connections = new Map();

        this.initialize();
    }


    initialize() {

        this.holes.clear();
        this.nodes.clear();

        this.createTerminalRows();
        this.createPowerRails();
    }


    /* ================================================
       TERMINAL ROWS
    ================================================ */

    createTerminalRows() {

        const {
            rows,
            holeSpacingX,
            holeSpacingZ,
            centerGap,
            startX,
            startZ
        } = this.config;

        const groups = [
            {
                name: 'upper',
                columns: [0, 1, 2, 3, 4],
                zOffset: 0
            },
            {
                name: 'lower',
                columns: [5, 6, 7, 8, 9],
                zOffset: centerGap
            }
        ];

        for (const group of groups) {

            for (let row = 0; row < rows; row++) {

                const nodeId =
                    `${group.name}-row-${row + 1}`;

                this.nodes.set(nodeId, {

                    id: nodeId,
                    type: 'terminal-row',
                    holes: []

                });

                const z =
                    startZ +
                    row * holeSpacingZ +
                    group.zOffset;

                for (const column of group.columns) {

                    const x =
                        startX +
                        column * holeSpacingX;

                    this.addHole({

                        id: `${group.name}-r${row + 1}-c${column + 1}`,

                        x,
                        y: 0.22,
                        z,

                        nodeId,

                        section: group.name,
                        row: row + 1,
                        column: column + 1,

                        type: 'terminal'

                    });
                }
            }
        }
    }


    /* ================================================
       POWER RAILS
    ================================================ */

    createPowerRails() {

        const {
            rows,
            railSpacing,
            holeSpacingX,
            holeSpacingZ,
            centerGap,
            startX,
            startZ
        } = this.config;

        const bottomZ =
            startZ +
            (rows - 1) * holeSpacingZ +
            centerGap;

        const rails = [

            {
                name: 'positive-top',
                z: startZ - railSpacing,
                polarity: 'positive'
            },

            {
                name: 'negative-top',
                z: startZ - railSpacing * 2,
                polarity: 'negative'
            },

            {
                name: 'positive-bottom',
                z: bottomZ + railSpacing,
                polarity: 'positive'
            },

            {
                name: 'negative-bottom',
                z: bottomZ + railSpacing * 2,
                polarity: 'negative'
            }

        ];

        for (const rail of rails) {

            this.nodes.set(rail.name, {

                id: rail.name,
                type: 'power-rail',
                polarity: rail.polarity,
                holes: []

            });

            for (let column = 0; column < 5; column++) {

                this.addHole({

                    id: `rail-${rail.name}-${column + 1}`,

                    x: startX + column * holeSpacingX,

                    y: 0.22,

                    z: rail.z,

                    nodeId: rail.name,

                    type: 'power',

                    polarity: rail.polarity,

                    column: column + 1

                });
            }
        }
    }


    /* ================================================
       ADD HOLE
    ================================================ */

    addHole(hole) {

        this.holes.set(hole.id, hole);

        this.nodes.get(hole.nodeId)?.holes.push(
            hole.id
        );
    }


    /* ================================================
       GET HOLE
    ================================================ */

    getHole(id) {

        return this.holes.get(id) || null;
    }


    getHolePosition(id) {

        const hole = this.getHole(id);

        if (!hole) return null;

        return {
            x: hole.x,
            y: hole.y,
            z: hole.z
        };
    }


    /* ================================================
       FIND NEAREST HOLE
    ================================================ */

    findNearestHole(position, maxDistance = 0.25) {

        let nearest = null;
        let nearestDistance = Infinity;

        for (const hole of this.holes.values()) {

            const dx = position.x - hole.x;
            const dy = position.y - hole.y;
            const dz = position.z - hole.z;

            const distance = Math.sqrt(
                dx * dx + dy * dy + dz * dz
            );

            if (distance < nearestDistance) {

                nearestDistance = distance;
                nearest = hole;

            }
        }

        if (!nearest || nearestDistance > maxDistance) {
            return null;
        }

        return {
            ...nearest,
            distance: nearestDistance
        };
    }


    /* ================================================
       COMPONENT REGISTRATION
    ================================================ */

    registerComponent(componentId, terminals = []) {

        if (!componentId) return false;

        this.components.set(componentId, {

            id: componentId,

            terminals: terminals.map((terminal, index) => ({

                id: terminal.id || `terminal-${index + 1}`,

                holeId: null,

                nodeId: null

            }))

        });

        return true;
    }


    /* ================================================
       PLACE COMPONENT TERMINAL
    ================================================ */

    placeTerminal(componentId, terminalId, holeId) {

        const component =
            this.components.get(componentId);

        const hole =
            this.getHole(holeId);

        if (!component || !hole) {

            return {
                success: false,
                message: 'Invalid component or hole.'
            };
        }

        const terminal =
            component.terminals.find(
                item => item.id === terminalId
            );

        if (!terminal) {

            return {
                success: false,
                message: 'Terminal not found.'
            };
        }

        terminal.holeId = holeId;
        terminal.nodeId = hole.nodeId;

        return {
            success: true,
            componentId,
            terminalId,
            holeId,
            nodeId: hole.nodeId
        };
    }


    /* ================================================
       WIRE CONNECTION
    ================================================ */

    connectHoles(
        connectionId,
        startHoleId,
        endHoleId,
        color = 'red'
    ) {

        const start = this.getHole(startHoleId);
        const end = this.getHole(endHoleId);

        if (!start || !end) {

            return {
                success: false,
                message: 'Invalid hole selection.'
            };
        }

        if (startHoleId === endHoleId) {

            return {
                success: false,
                message: 'Select two different holes.'
            };
        }

        if (this.connections.has(connectionId)) {

            return {
                success: false,
                message: 'Connection ID already exists.'
            };
        }

        this.connections.set(connectionId, {

            id: connectionId,

            startHoleId,
            endHoleId,

            startNode: start.nodeId,
            endNode: end.nodeId,

            color,
            type: 'jumper-wire'

        });

        return {
            success: true,
            connectionId,
            startNode: start.nodeId,
            endNode: end.nodeId
        };
    }


    /* ================================================
       REMOVE WIRE
    ================================================ */

    removeConnection(connectionId) {

        return this.connections.delete(connectionId);
    }


    /* ================================================
       CHECK SAME NODE
    ================================================ */

    areSameNode(firstHoleId, secondHoleId) {

        const first = this.getHole(firstHoleId);
        const second = this.getHole(secondHoleId);

        if (!first || !second) return false;

        return first.nodeId === second.nodeId;
    }


    /* ================================================
       GET NODE CONNECTIONS
    ================================================ */

    getNodeConnections(nodeId) {

        const results = [];

        for (const component of this.components.values()) {

            for (const terminal of component.terminals) {

                if (terminal.nodeId === nodeId) {

                    results.push({

                        type: 'component',

                        componentId: component.id,

                        terminalId: terminal.id

                    });
                }
            }
        }

        for (const wire of this.connections.values()) {

            if (
                wire.startNode === nodeId ||
                wire.endNode === nodeId
            ) {

                results.push({

                    type: 'wire',

                    connectionId: wire.id

                });
            }
        }

        return results;
    }


    /* ================================================
       BOARD INFORMATION
    ================================================ */

    getBoardData() {

        return {

            totalHoles: this.holes.size,

            totalNodes: this.nodes.size,

            totalComponents: this.components.size,

            totalConnections: this.connections.size

        };
    }


    /* ================================================
       RESET
    ================================================ */

    reset() {

        this.components.clear();
        this.connections.clear();

        this.initialize();
    }

}


/* =====================================================
   THREE.JS HOLE MARKERS
===================================================== */

export function createHoleMarkers(
    scene,
    options = {}
) {

    const board =
        options.board || new BreadboardSystem();

    const group = new THREE.Group();

    group.name = 'BreadboardHoleMarkers';

    const geometry =
        new THREE.CylinderGeometry(
            0.035,
            0.035,
            0.012,
            12
        );

    const material =
        new THREE.MeshBasicMaterial({

            color: options.color || '#94a3b8',

            transparent: true,

            opacity: options.opacity ?? 0.75

        });

    const markers = new Map();

    for (const hole of board.holes.values()) {

        const marker =
            new THREE.Mesh(
                geometry,
                material.clone()
            );

        marker.position.set(
            hole.x,
            hole.y,
            hole.z
        );

        marker.rotation.x =
            Math.PI / 2;

        marker.userData.holeId = hole.id;

        marker.userData.nodeId = hole.nodeId;

        marker.userData.isBreadboardHole = true;

        marker.visible =
            options.visible ?? true;

        group.add(marker);

        markers.set(hole.id, marker);
    }

    scene.add(group);

    return {

        board,

        group,

        markers,

        setVisible(visible) {

            group.visible = Boolean(visible);

        },

        getMarker(holeId) {

            return markers.get(holeId) || null;

        },

        dispose() {

            scene.remove(group);

            geometry.dispose();

            for (const marker of markers.values()) {

                marker.material.dispose();

            }

            markers.clear();
        }

    };
}
