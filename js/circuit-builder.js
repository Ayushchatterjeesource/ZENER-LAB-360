
/* =====================================================
   ZENER-LAB-360
   FILE: js/circuit-builder.js

   Interactive 3D Circuit Builder
   Component Placement
   Jumper Wire Connections
===================================================== */

import * as THREE from 'three';

import { BreadboardSystem } from './breadboard.js';


export class CircuitBuilder {

    constructor(scene, options = {}) {

        this.scene = scene;

        this.options = {

            snapDistance: 0.45,

            wireHeight: 0.34,

            defaultWireColor: '#ef4444',

            ...options

        };

        this.board =
            options.board || new BreadboardSystem();

        this.components = new Map();

        this.wires = new Map();

        this.selectedComponent = null;

        this.selectedHole = null;

        this.isDragging = false;

        this.dragPlane = new THREE.Plane(
            new THREE.Vector3(0, 1, 0),
            -0.25
        );

        this.raycaster = new THREE.Raycaster();

        this.pointer = new THREE.Vector2();

        this.dragOffset = new THREE.Vector3();

        this.callbacks = {};

        this.createWireMaterials();
    }


    /* ================================================
       WIRE MATERIALS
    ================================================ */

    createWireMaterials() {

        this.wireMaterials = {

            red: new THREE.MeshStandardMaterial({
                color: '#ef4444',
                roughness: 0.4
            }),

            black: new THREE.MeshStandardMaterial({
                color: '#171717',
                roughness: 0.4
            }),

            yellow: new THREE.MeshStandardMaterial({
                color: '#facc15',
                roughness: 0.4
            }),

            green: new THREE.MeshStandardMaterial({
                color: '#22c55e',
                roughness: 0.4
            })

        };
    }


    /* ================================================
       REGISTER COMPONENT
    ================================================ */

    addComponent(
        id,
        object,
        terminals = []
    ) {

        if (!id || !object) {
            return false;
        }

        const terminalList = terminals.map(
            (terminal, index) => ({

                id:
                    terminal.id ||
                    `terminal-${index + 1}`,

                localPosition:
                    terminal.localPosition
                        ? new THREE.Vector3(
                            ...terminal.localPosition
                        )
                        : new THREE.Vector3(
                            index === 0 ? -0.15 : 0.15,
                            0,
                            0
                        ),

                holeId: null

            })
        );

        const record = {

            id,

            object,

            terminals: terminalList,

            placed: false

        };

        this.components.set(id, record);

        object.userData.circuitComponentId = id;

        object.userData.selectable = true;

        this.scene.add(object);

        this.board.registerComponent(
            id,
            terminalList
        );

        return record;
    }


    /* ================================================
       SELECT COMPONENT
    ================================================ */

    selectComponent(id) {

        const component =
            this.components.get(id);

        if (!component) {
            return false;
        }

        this.selectedComponent = component;

        this.notify('componentSelected', component);

        return true;
    }


    /* ================================================
       START DRAG
    ================================================ */

    startDrag(
        event,
        camera,
        canvas
    ) {

        const component =
            this.getComponentFromPointer(
                event,
                camera,
                canvas
            );

        if (!component) {
            return false;
        }

        this.selectComponent(component.id);

        this.isDragging = true;

        const point =
            this.getPointerOnBoard(
                event,
                camera,
                canvas
            );

        if (point) {

            this.dragOffset.subVectors(
                component.object.position,
                point
            );

        }

        return true;
    }


    /* ================================================
       MOVE DRAGGED COMPONENT
    ================================================ */

    moveDrag(
        event,
        camera,
        canvas
    ) {

        if (
            !this.isDragging ||
            !this.selectedComponent
        ) {
            return false;
        }

        const point =
            this.getPointerOnBoard(
                event,
                camera,
                canvas
            );

        if (!point) {
            return false;
        }

        const component =
            this.selectedComponent;

        component.object.position.copy(
            point.add(this.dragOffset)
        );

        component.object.position.y = 0.28;

        this.notify(
            'componentMoved',
            component
        );

        return true;
    }


    /* ================================================
       END DRAG AND SNAP
    ================================================ */

    endDrag() {

        if (!this.isDragging) {
            return false;
        }

        this.isDragging = false;

        if (!this.selectedComponent) {
            return false;
        }

        const position =
            this.selectedComponent.object.position;

        const nearest =
            this.board.findNearestHole(
                position,
                this.options.snapDistance
            );

        if (nearest) {

            this.selectedComponent.object.position.set(
                nearest.x,
                0.28,
                nearest.z
            );

            this.selectedComponent.placed = true;

            this.notify(
                'componentSnapped',
                {
                    component: this.selectedComponent,
                    hole: nearest
                }
            );

        }

        return true;
    }


    /* ================================================
       POINTER RAYCAST
    ================================================ */

    updatePointer(event, canvas) {

        const rect =
            canvas.getBoundingClientRect();

        this.pointer.x =
            ((event.clientX - rect.left) /
            rect.width) * 2 - 1;

        this.pointer.y =
            -((event.clientY - rect.top) /
            rect.height) * 2 + 1;
    }


    getComponentFromPointer(
        event,
        camera,
        canvas
    ) {

        this.updatePointer(event, canvas);

        this.raycaster.setFromCamera(
            this.pointer,
            camera
        );

        const objects = [];

        for (const component of this.components.values()) {

            objects.push(component.object);

        }

        const hits =
            this.raycaster.intersectObjects(
                objects,
                true
            );

        if (!hits.length) {
            return null;
        }

        let object = hits[0].object;

        while (
            object &&
            !object.userData.circuitComponentId
        ) {

            object = object.parent;

        }

        if (!object) {
            return null;
        }

        return this.components.get(
            object.userData.circuitComponentId
        ) || null;
    }


    /* ================================================
       POINTER POSITION ON BOARD
    ================================================ */

    getPointerOnBoard(
        event,
        camera,
        canvas
    ) {

        this.updatePointer(event, canvas);

        this.raycaster.setFromCamera(
            this.pointer,
            camera
        );

        const point =
            new THREE.Vector3();

        const hit =
            this.raycaster.ray.intersectPlane(
                this.dragPlane,
                point
            );

        return hit ? point : null;
    }


    /* ================================================
       ROTATE COMPONENT
    ================================================ */

    rotateComponent(id, angle = Math.PI / 2) {

        const component =
            this.components.get(id);

        if (!component) {
            return false;
        }

        component.object.rotation.y += angle;

        this.notify(
            'componentRotated',
            component
        );

        return true;
    }


    /* ================================================
       PLACE TERMINAL
    ================================================ */

    placeTerminal(
        componentId,
        terminalId,
        holeId
    ) {

        const component =
            this.components.get(componentId);

        if (!component) {
            return {
                success: false,
                message: 'Component not found.'
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

        const hole =
            this.board.getHole(holeId);

        if (!hole) {
            return {
                success: false,
                message: 'Hole not found.'
            };
        }

        const result =
            this.board.placeTerminal(
                componentId,
                terminalId,
                holeId
            );

        if (result.success) {

            terminal.holeId = holeId;

        }

        return result;
    }


    /* ================================================
       CONNECT TWO HOLES
    ================================================ */

    connectHoles(
        startHoleId,
        endHoleId,
        color = 'red'
    ) {

        const id =
            `wire-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 7)}`;

        const result =
            this.board.connectHoles(
                id,
                startHoleId,
                endHoleId,
                color
            );

        if (!result.success) {
            return result;
        }

        const start =
            this.board.getHolePosition(
                startHoleId
            );

        const end =
            this.board.getHolePosition(
                endHoleId
            );

        const wire =
            this.createWire(
                start,
                end,
                color
            );

        wire.userData.connectionId = id;

        this.scene.add(wire);

        this.wires.set(id, wire);

        return {

            success: true,

            id,

            wire,

            ...result

        };
    }


    /* ================================================
       CREATE 3D WIRE
    ================================================ */

    createWire(start, end, color = 'red') {

        const startPoint =
            new THREE.Vector3(
                start.x,
                this.options.wireHeight,
                start.z
            );

        const endPoint =
            new THREE.Vector3(
                end.x,
                this.options.wireHeight,
                end.z
            );

        const middlePoint =
            new THREE.Vector3(
                (start.x + end.x) / 2,
                this.options.wireHeight + 0.22,
                (start.z + end.z) / 2
            );

        const curve =
            new THREE.QuadraticBezierCurve3(
                startPoint,
                middlePoint,
                endPoint
            );

        const geometry =
            new THREE.TubeGeometry(
                curve,
                32,
                0.025,
                8,
                false
            );

        const material =
            this.wireMaterials[color] ||
            this.wireMaterials.red;

        const wire =
            new THREE.Mesh(
                geometry,
                material
            );

        wire.userData.isJumperWire = true;

        return wire;
    }


    /* ================================================
       DELETE WIRE
    ================================================ */

    removeWire(id) {

        const wire =
            this.wires.get(id);

        if (!wire) {
            return false;
        }

        this.scene.remove(wire);

        wire.geometry.dispose();

        this.wires.delete(id);

        this.board.removeConnection(id);

        return true;
    }


    /* ================================================
       DELETE COMPONENT
    ================================================ */

    removeComponent(id) {

        const component =
            this.components.get(id);

        if (!component) {
            return false;
        }

        this.scene.remove(component.object);

        this.components.delete(id);

        if (this.selectedComponent?.id === id) {

            this.selectedComponent = null;

        }

        this.notify(
            'componentRemoved',
            id
        );

        return true;
    }


    /* ================================================
       CONNECTION INFORMATION
    ================================================ */

    getConnectionData() {

        return {

            components:
                Array.from(
                    this.components.values()
                ).map(component => ({

                    id: component.id,

                    placed: component.placed,

                    terminals:
                        component.terminals.map(terminal => ({

                            id: terminal.id,

                            holeId: terminal.holeId

                        }))

                })),

            wires:
                Array.from(
                    this.board.connections.values()
                ),

            board:
                this.board.getBoardData()

        };
    }


    /* ================================================
       EVENT CALLBACKS
    ================================================ */

    on(eventName, callback) {

        if (typeof callback === 'function') {

            this.callbacks[eventName] = callback;

        }
    }


    notify(eventName, data) {

        this.callbacks[eventName]?.(data);
    }


    /* ================================================
       RESET CIRCUIT
    ================================================ */

    reset() {

        for (const wire of this.wires.values()) {

            this.scene.remove(wire);

            wire.geometry.dispose();

        }

        this.wires.clear();

        for (const component of this.components.values()) {

            this.scene.remove(component.object);

        }

        this.components.clear();

        this.board.reset();

        this.selectedComponent = null;

        this.selectedHole = null;

        this.isDragging = false;

        this.notify('circuitReset', true);

    }


    /* ================================================
       DISPOSE
    ================================================ */

    dispose() {

        this.reset();

        for (const material of
            Object.values(this.wireMaterials)) {

            material.dispose();

        }

    }

}
