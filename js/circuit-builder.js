
/* =========================================
   ZENER-LAB-360
   FILE: circuit-builder.js

   Component Placement & Circuit Connections
========================================= */

import * as THREE from
    'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

import {
    getHolePosition,
    isValidHole,
    areHolesConnected
} from './breadboard.js';

import {
    createComponent
} from './components.js';


/* ---------- Circuit Builder ---------- */

export class CircuitBuilder {

    constructor(scene) {

        this.scene = scene;

        // All placed components
        this.components = new Map();

        // All jumper wires
        this.wires = new Map();

        // Electrical connection records
        this.connections = [];

        // Selected component
        this.selectedComponent = null;

        // Wire counter
        this.wireCounter = 0;

        // Component counter
        this.componentCounter = 0;

        // Wire materials
        this.wireMaterials = {
            red: new THREE.MeshStandardMaterial({
                color: 0xe74c3c,
                roughness: 0.45
            }),

            black: new THREE.MeshStandardMaterial({
                color: 0x20242b,
                roughness: 0.45
            }),

            blue: new THREE.MeshStandardMaterial({
                color: 0x2980b9,
                roughness: 0.45
            }),

            yellow: new THREE.MeshStandardMaterial({
                color: 0xf1c40f,
                roughness: 0.45
            }),

            green: new THREE.MeshStandardMaterial({
                color: 0x27ae60,
                roughness: 0.45
            })
        };
    }


    /* =====================================
       1. ADD COMPONENT
    ===================================== */

    addComponent(
        type,
        position = new THREE.Vector3(0, 0.3, 0),
        options = {}
    ) {

        const model = createComponent(type);

        if (!model) {
            console.warn(
                `Unable to create component: ${type}`
            );

            return null;
        }

        const id = options.id ||
            `component-${++this.componentCounter}`;

        if (this.components.has(id)) {
            console.warn(
                `Component ID already exists: ${id}`
            );

            return null;
        }

        model.position.copy(position);

        model.userData = {
            ...model.userData,
            id,
            type,
            placed: true
        };

        this.scene.add(model);

        const record = {
            id,
            type,
            model,
            position: position.clone(),
            terminals: options.terminals || [],
            metadata: model.userData
        };

        this.components.set(id, record);

        return record;
    }


    /* =====================================
       2. PLACE COMPONENT ON BREADBOARD
    ===================================== */

    placeOnBreadboard(
        type,
        row,
        column,
        options = {}
    ) {

        if (!isValidHole(row, column)) {
            console.warn(
                'Invalid breadboard hole.'
            );

            return null;
        }

        const holePosition = getHolePosition(
            row,
            column
        );

        const position = holePosition.clone();

        position.y += options.height || 0.35;

        const record = this.addComponent(
            type,
            position,
            options
        );

        if (!record) {
            return null;
        }

        record.placement = {
            row,
            column
        };

        record.model.userData.placement = {
            row,
            column
        };

        return record;
    }


    /* =====================================
       3. REMOVE COMPONENT
    ===================================== */

    removeComponent(id) {

        const record = this.components.get(id);

        if (!record) {
            return false;
        }

        this.scene.remove(record.model);

        record.model.traverse(object => {

            if (object.geometry) {
                object.geometry.dispose();
            }

            if (object.material) {

                const materials = Array.isArray(
                    object.material
                )
                    ? object.material
                    : [object.material];

                materials.forEach(material => {
                    material.dispose();
                });
            }
        });

        this.components.delete(id);

        // Remove wires attached to this component
        for (const [wireId, wire] of this.wires) {

            if (
                wire.start.componentId === id ||
                wire.end.componentId === id
            ) {
                this.removeWire(wireId);
            }
        }

        return true;
    }


    /* =====================================
       4. CREATE JUMPER WIRE
    ===================================== */

    createWire(
        start,
        end,
        color = 'red'
    ) {

        if (!start || !end) {
            console.warn(
                'Wire requires start and end terminals.'
            );

            return null;
        }

        const startPosition = this.resolveTerminal(
            start
        );

        const endPosition = this.resolveTerminal(
            end
        );

        if (!startPosition || !endPosition) {
            console.warn(
                'Invalid wire terminal.'
            );

            return null;
        }

        const wireId = `wire-${++this.wireCounter}`;

        const curve = this.createWireCurve(
            startPosition,
            endPosition
        );

        const points = curve.getPoints(32);

        const geometry = new THREE.TubeGeometry(
            curve,
            32,
            0.035,
            8,
            false
        );

        const material =
            this.wireMaterials[color] ||
            this.wireMaterials.red;

        const mesh = new THREE.Mesh(
            geometry,
            material
        );

        mesh.castShadow = true;

        this.scene.add(mesh);

        const wireRecord = {
            id: wireId,
            mesh,
            start: structuredClone(start),
            end: structuredClone(end),
            color,
            points
        };

        this.wires.set(
            wireId,
            wireRecord
        );

        this.connections.push({
            wireId,
            start,
            end,
            color
        });

        return wireRecord;
    }


    /* =====================================
       5. RESOLVE TERMINAL POSITION
    ===================================== */

    resolveTerminal(terminal) {

        // Breadboard terminal
        if (terminal.type === 'hole') {

            const position = getHolePosition(
                terminal.row,
                terminal.column
            );

            if (!position) {
                return null;
            }

            return position.clone();
        }

        // Component terminal
        if (terminal.type === 'component') {

            const record = this.components.get(
                terminal.componentId
            );

            if (!record) {
                return null;
            }

            const localPosition =
                terminal.position ||
                new THREE.Vector3(0, 0, 0);

            return record.model.localToWorld(
                localPosition.clone()
            );
        }

        // World coordinate
        if (terminal.type === 'world') {

            return new THREE.Vector3(
                terminal.x,
                terminal.y,
                terminal.z
            );
        }

        return null;
    }


    /* =====================================
       6. WIRE CURVE
    ===================================== */

    createWireCurve(start, end) {

        const middle = start.clone().add(end)
            .multiplyScalar(0.5);

        // Raise wire above the breadboard surface
        middle.y += 0.45;

        const points = [
            start.clone(),
            middle,
            end.clone()
        ];

        return new THREE.CatmullRomCurve3(
            points
        );
    }


    /* =====================================
       7. REMOVE WIRE
    ===================================== */

    removeWire(wireId) {

        const wire = this.wires.get(wireId);

        if (!wire) {
            return false;
        }

        this.scene.remove(wire.mesh);

        wire.mesh.geometry.dispose();

        this.wires.delete(wireId);

        this.connections =
            this.connections.filter(
                connection =>
                    connection.wireId !== wireId
            );

        return true;
    }


    /* =====================================
       8. CLEAR ALL WIRES
    ===================================== */

    clearWires() {

        const ids = [
            ...this.wires.keys()
        ];

        ids.forEach(id => {
            this.removeWire(id);
        });
    }


    /* =====================================
       9. CHECK BREADBOARD CONNECTION
    ===================================== */

    checkBreadboardConnection(
        first,
        second
    ) {

        if (
            first.type !== 'hole' ||
            second.type !== 'hole'
        ) {
            return false;
        }

        return areHolesConnected(
            first,
            second
        );
    }


    /* =====================================
       10. CHECK DIRECT WIRE CONNECTION
    ===================================== */

    hasDirectConnection(
        first,
        second
    ) {

        return this.connections.some(
            connection => {

                const forward =
                    connection.start.type === first.type &&
                    connection.end.type === second.type;

                const backward =
                    connection.start.type === second.type &&
                    connection.end.type === first.type;

                return (
                    forward || backward
                );
            }
        );
    }


    /* =====================================
       11. COMPONENT SELECTION
    ===================================== */

    selectComponent(id) {

        const record = this.components.get(id);

        if (!record) {
            return null;
        }

        this.selectedComponent = id;

        return record;
    }


    deselectComponent() {

        this.selectedComponent = null;
    }


    /* =====================================
       12. COMPONENT POSITION UPDATE
    ===================================== */

    moveComponent(id, position) {

        const record = this.components.get(id);

        if (!record) {
            return false;
        }

        record.model.position.copy(position);

        record.position.copy(position);

        return true;
    }


    /* =====================================
       13. ROTATE COMPONENT
    ===================================== */

    rotateComponent(id, angle) {

        const record = this.components.get(id);

        if (!record) {
            return false;
        }

        record.model.rotation.y = angle;

        return true;
    }


    /* =====================================
       14. GET CIRCUIT STATUS
    ===================================== */

    getCircuitStatus() {

        return {
            componentCount:
                this.components.size,

            wireCount:
                this.wires.size,

            components:
                [...this.components.values()].map(
                    record => ({
                        id: record.id,
                        type: record.type,
                        position: {
                            x: record.model.position.x,
                            y: record.model.position.y,
                            z: record.model.position.z
                        }
                    })
                ),

            connections:
                this.connections.length
        };
    }


    /* =====================================
       15. RESET CIRCUIT
    ===================================== */

    reset() {

        this.clearWires();

        const ids = [
            ...this.components.keys()
        ];

        ids.forEach(id => {
            this.removeComponent(id);
        });

        this.connections = [];

        this.selectedComponent = null;
    }
}


/* =========================================
   HELPER: CREATE CIRCUIT BUILDER
========================================= */

export function createCircuitBuilder(scene) {

    return new CircuitBuilder(scene);
}

