
/* =====================================================
   ZENER-LAB-360
   FILE: js/breadboard.js

   Interactive Breadboard Coordinate & Node System
===================================================== */

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


    /* ================================================
       INITIALIZE BOARD
    ================================================ */

    initialize() {

        this.holes.clear();

        this.nodes.clear();

        this.components.clear();

        this.connections.clear();

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

                const rowId =
                    `${group.name}-row-${row + 1}`;

                const nodeId = rowId;

                const z =
                    startZ +
                    row * holeSpacingZ +
                    group.zOffset;

                this.nodes.set(nodeId, {

                    id: nodeId,

                    type: 'terminal-row',

                    holes: [],

                    connections: new Set()

                });


                for (const column of group.columns) {

                    const x =
                        startX +
                        column * holeSpacingX;

                    const holeId =
                        this.getHoleId(
                            group.name,
                            row + 1,
                            column + 1
                        );

                    this.addHole({

                        id: holeId,

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
            startX,
            startZ
        } = this.config;

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
                z:
                    startZ +
                    (rows - 1) *
                    this.config.holeSpacingZ +
                    this.config.centerGap +
                    railSpacing,
                polarity: 'positive'
            },

            {
                name: 'negative-bottom',
                z:
                    startZ +
                    (rows - 1) *
                    this.config.holeSpacingZ +
                    this.config.centerGap +
                    railSpacing * 2,
                polarity: 'negative'
            }

        ];


        for (const rail of rails) {

            const nodeId = rail.name;

            this.nodes.set(nodeId, {

                id: nodeId,

                type: 'power-rail',

                polarity: rail.polarity,

                holes: [],

                connections: new Set()

            });


            for (let column = 0; column < 5; column++) {

                const x =
                    startX +
                    column * holeSpacingX;

                const holeId =
                    `rail-${rail.name}-${column + 1}`;

                this.addHole({

                    id: holeId,

                    x,

                    y: 0.22,

                    z: rail.z,

                    nodeId,

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

        const node =
            this.nodes.get(hole.nodeId);

        if (node) {

            node.holes.push(hole.id);

        }
    }


    /* ================================================
       HOLE ID
    ================================================ */

    getHoleId(section, row, column) {

        return `${section}-r${row}-c${column}`;
    }


    /* ================================================
       GET HOLE
    ================================================ */

    getHole(holeId) {

        return this.holes.get(holeId) || null;
    }


    /* ================================================
       GET HOLE POSITION
    ================================================ */

    getHolePosition(holeId) {

        const hole =
            this.getHole(holeId);

        if (!hole) {
            return null;
        }

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
                dx * dx +
                dy * dy +
                dz * dz
            );

            if (distance < nearestDistance) {

                nearestDistance = distance;

                nearest = hole;

            }
        }

        if (
            nearest &&
            nearestDistance <= maxDistance
        ) {

            return {

                ...nearest,

                distance: nearestDistance

            };
        }

        return null;
    }


    /* ================================================
       REGISTER COMPONENT
    ================================================ */

    registerComponent(
        componentId,
        terminals = []
    ) {

        if (!componentId) {
            return false;
        }

        this.components.set(componentId, {

            id: componentId,

            terminals: terminals.map(
                (terminal, index) => ({

                    id:
                        terminal.id ||
                        `terminal-${index + 1}`,

                    holeId:
                        terminal.holeId || null,

                    nodeId: null

                })
            )

        });

        return true;
    }


    /* ================================================
       PLACE COMPONENT TERMINAL
    ================================================ */

    placeTerminal(
        componentId,
        terminalId,
        holeId
    ) {

        const component =
            this.components.get(componentId);

        const hole =
            this.getHole(holeId);

        if (!component || !hole) {

            return {

                success: false,

                message: 'Invalid component or breadboard hole.'

            };
        }

        const terminal =
            component.terminals.find(
                item => item.id === terminalId
            );

        if (!terminal) {

            return {

                success: false,

                message: 'Component terminal not found.'

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
       CREATE JUMPER WIRE
    ================================================ */

    connectHoles(
        connectionId,
        startHoleId,
        endHoleId,
        color = 'red'
    ) {

        const start =
            this.getHole(startHoleId);

        const end =
            this.getHole(endHoleId);

        if (!start || !end) {

            return {

                success: false,

                message: 'One or both holes do not exist.'

            };
        }

        if (startHoleId === endHoleId) {

            return {

                success: false,

                message: 'Cannot connect a hole to itself.'

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
       REMOVE CONNECTION
    ================================================ */

    removeConnection(connectionId) {

        return this.connections.delete(
            connectionId
        );
    }


    /* ================================================
       GET NODE CONNECTIONS
    ================================================ */

    getNodeConnections(nodeId) {

        const result = [];

        for (const component of this.components.values()) {

            for (const terminal of component.terminals) {

                if (terminal.nodeId === nodeId) {

                    result.push({

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

                result.push({

                    type: 'wire',

                    connectionId: wire.id

                });
            }
        }

        return result;
    }


    /* ================================================
       ELECTRICAL NODE CHECK
    ================================================ */

    areSameNode(firstHoleId, secondHoleId) {

        const first =
            this.getHole(firstHoleId);

        const second =
            this.getHole(secondHoleId);

        if (!first || !second) {
            return false;
        }

        return first.nodeId === second.nodeId;
    }


    /* ================================================
       GET BOARD DATA
    ================================================ */

    getBoardData() {

        return {

            totalHoles: this.holes.size,

            totalNodes: this.nodes.size,

            totalComponents:
                this.components.size,

            totalConnections:
                this.connections.size

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
   CREATE THREE.JS HOLE MARKERS
===================================================== */

export function createHoleMarkers(
    scene,
    options = {}
) {

    const board =
        new BreadboardSystem();

    const group =
        new THREE_GROUP_PLACEHOLDER();

    return {
        board,
        group
    };
}
