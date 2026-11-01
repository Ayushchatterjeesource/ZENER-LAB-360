import * as THREE from 'three';
import { BreadboardSystem } from './breadboard.js';

export class CircuitBuilder {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.board = options.board || new BreadboardSystem();

        this.components = new Map();
        this.wires = new Map();

        this.selectedComponent = null;
        this.selectedTerminal = null;
        this.draggedComponent = null;

        this.wireCounter = 0;
        this.listeners = new Map();

        this.wireMaterialDefaults = {
            red: 0xef4444,
            black: 0x202938,
            blue: 0x2563eb,
            yellow: 0xfacc15,
            green: 0x22c55e
        };

        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();

        this.dragPlane = new THREE.Plane(
            new THREE.Vector3(0, 1, 0),
            0
        );

        this.dragOffset = new THREE.Vector3();
    }

    /* =====================================
       COMPONENT REGISTRATION
       ===================================== */

    addComponent(id, object, terminals = []) {
        if (!id || !object) {
            throw new Error('Component ID and object are required.');
        }

        object.userData.componentId = id;
        object.userData.isCircuitComponent = true;

        if (!this.scene.children.includes(object)) {
            this.scene.add(object);
        }

        const terminalMap = new Map();

        object.traverse(child => {
            if (child.userData?.isTerminal) {
                child.userData.componentId = id;

                terminalMap.set(
                    child.userData.terminalId,
                    child
                );
            }
        });

        // Also accept terminal descriptions supplied by laboratory.js.
        terminals.forEach(terminal => {
            if (terminal?.id && terminal?.object) {
                terminal.object.userData.isTerminal = true;
                terminal.object.userData.componentId = id;
                terminal.object.userData.terminalId = terminal.id;

                terminalMap.set(terminal.id, terminal.object);
            }
        });

        this.components.set(id, {
            id,
            object,
            terminals: terminalMap,
            placed: false
        });

        this.notify('componentAdded', { id, object });

        return object;
    }

    getComponent(id) {
        return this.components.get(id) || null;
    }

    getTerminal(componentId, terminalId) {
        const component = this.components.get(componentId);

        if (!component) return null;

        return component.terminals.get(terminalId) || null;
    }

    getTerminalPosition(componentId, terminalId) {
        const terminal = this.getTerminal(componentId, terminalId);

        if (!terminal) return null;

        const position = new THREE.Vector3();
        terminal.getWorldPosition(position);

        return position;
    }

    /* =====================================
       COMPONENT SELECTION
       ===================================== */

    selectComponent(id) {
        const component = this.components.get(id);

        if (!component) return false;

        this.selectedComponent = id;

        this.notify('componentSelected', {
            id,
            object: component.object
        });

        return true;
    }

    selectTerminal(componentId, terminalId) {
        const terminal = this.getTerminal(componentId, terminalId);

        if (!terminal) {
            this.notify('error', {
                message: 'Terminal not found.'
            });

            return false;
        }

        this.selectedTerminal = {
            type: 'terminal',
            componentId,
            terminalId
        };

        this.notify('terminalSelected', this.selectedTerminal);

        return true;
    }

    selectHole(holeId) {
        const hole = this.board.getHole(holeId);

        if (!hole) {
            this.notify('error', {
                message: 'Breadboard hole not found.'
            });

            return false;
        }

        this.selectedTerminal = {
            type: 'hole',
            holeId
        };

        this.notify('holeSelected', this.selectedTerminal);

        return true;
    }

    clearSelection() {
        this.selectedTerminal = null;
        this.selectedComponent = null;

        this.notify('selectionCleared', {});
    }

    /* =====================================
       ENDPOINT HELPERS
       ===================================== */

    getEndpointPosition(endpoint) {
        if (!endpoint) return null;

        if (endpoint.type === 'hole') {
            return this.board.getHolePosition(endpoint.holeId);
        }

        if (endpoint.type === 'terminal') {
            return this.getTerminalPosition(
                endpoint.componentId,
                endpoint.terminalId
            );
        }

        return null;
    }

    createTerminalEndpoint(componentId, terminalId) {
        return {
            type: 'terminal',
            componentId,
            terminalId
        };
    }

    createHoleEndpoint(holeId) {
        return {
            type: 'hole',
            holeId
        };
    }

    endpointsAreSame(a, b) {
        if (!a || !b || a.type !== b.type) return false;

        if (a.type === 'hole') {
            return a.holeId === b.holeId;
        }

        return (
            a.componentId === b.componentId &&
            a.terminalId === b.terminalId
        );
    }

    /* =====================================
       WIRE CONNECTIONS
       ===================================== */

    connectTerminals(
        componentA,
        terminalA,
        componentB,
        terminalB,
        color = 'red'
    ) {
        return this.connectEndpoints(
            this.createTerminalEndpoint(componentA, terminalA),
            this.createTerminalEndpoint(componentB, terminalB),
            color
        );
    }

    connectTerminalToHole(
        componentId,
        terminalId,
        holeId,
        color = 'red'
    ) {
        return this.connectEndpoints(
            this.createTerminalEndpoint(componentId, terminalId),
            this.createHoleEndpoint(holeId),
            color
        );
    }

    connectHoles(startHoleId, endHoleId, color = 'red') {
        return this.connectEndpoints(
            this.createHoleEndpoint(startHoleId),
            this.createHoleEndpoint(endHoleId),
            color
        );
    }

    connectEndpoints(start, end, color = 'red') {
        if (this.endpointsAreSame(start, end)) {
            this.notify('error', {
                message: 'A wire needs two different endpoints.'
            });

            return null;
        }

        const startPosition = this.getEndpointPosition(start);
        const endPosition = this.getEndpointPosition(end);

        if (!startPosition || !endPosition) {
            this.notify('error', {
                message: 'One or both connection points are invalid.'
            });

            return null;
        }

        // Prevent duplicate direct connections.
        const duplicate = [...this.wires.values()].some(wire => {
            return (
                (
                    this.endpointsAreSame(wire.start, start) &&
                    this.endpointsAreSame(wire.end, end)
                ) ||
                (
                    this.endpointsAreSame(wire.start, end) &&
                    this.endpointsAreSame(wire.end, start)
                )
            );
        });

        if (duplicate) {
            this.notify('error', {
                message: 'These two points are already connected.'
            });

            return null;
        }

        const wireId = `wire-${++this.wireCounter}`;

        const wire = this.createWire(
            wireId,
            startPosition,
            endPosition,
            color
        );

        if (!wire) return null;

        wire.userData.start = start;
        wire.userData.end = end;

        this.wires.set(wireId, {
            id: wireId,
            object: wire,
            start,
            end,
            color
        });

        // Register a breadboard-to-breadboard connection in the board model.
        if (start.type === 'hole' && end.type === 'hole') {
            this.board.connectHoles(start.holeId, end.holeId);
        }

        this.notify('wireAdded', {
            id: wireId,
            start,
            end,
            color
        });

        this.notify('circuitChanged', this.getConnectionData());

        return wireId;
    }

    createWire(id, startPosition, endPosition, color = 'red') {
        const start = startPosition.clone();
        const end = endPosition.clone();

        const distance = start.distanceTo(end);

        if (distance < 0.001) return null;

        const lift = Math.max(0.12, distance * 0.12);

        const middle = start.clone().add(end).multiplyScalar(0.5);
        middle.y += lift;

        const curve = new THREE.QuadraticBezierCurve3(
            start,
            middle,
            end
        );

        const geometry = new THREE.TubeGeometry(
            curve,
            24,
            0.025,
            8,
            false
        );

        const wireColor =
            this.wireMaterialDefaults[color] ??
            (typeof color === 'number' ? color : 0xef4444);

        const material = new THREE.MeshStandardMaterial({
            color: wireColor,
            metalness: 0.15,
            roughness: 0.35
        });

        const wire = new THREE.Mesh(geometry, material);

        wire.name = id;
        wire.userData.isWire = true;

        this.scene.add(wire);

        return wire;
    }

    removeWire(id) {
        const wire = this.wires.get(id);

        if (!wire) return false;

        this.scene.remove(wire.object);

        wire.object.geometry.dispose();
        wire.object.material.dispose();

        if (
            wire.start.type === 'hole' &&
            wire.end.type === 'hole'
        ) {
            this.board.removeConnection(
                wire.start.holeId,
                wire.end.holeId
            );
        }

        this.wires.delete(id);

        this.notify('wireRemoved', { id });
        this.notify('circuitChanged', this.getConnectionData());

        return true;
    }

    removeLastWire() {
        const ids = [...this.wires.keys()];

        if (!ids.length) return false;

        return this.removeWire(ids[ids.length - 1]);
    }

    /* =====================================
       WIRE SELECTION WORKFLOW
       ===================================== */

    connectSelectedEndpoint(endpoint, color = 'red') {
        if (!this.selectedTerminal) {
            this.selectedTerminal = endpoint;

            this.notify('endpointSelected', endpoint);

            return {
                success: true,
                waitingForSecondPoint: true
            };
        }

        const first = this.selectedTerminal;

        const wireId = this.connectEndpoints(
            first,
            endpoint,
            color
        );

        this.selectedTerminal = null;

        return {
            success: Boolean(wireId),
            wireId
        };
    }

    /* =====================================
       DRAG AND DROP
       ===================================== */

    getPointer(event, canvas) {
        const rect = canvas.getBoundingClientRect();

        this.pointer.x =
            ((event.clientX - rect.left) / rect.width) * 2 - 1;

        this.pointer.y =
            -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    getComponentFromPointer(event, camera, canvas) {
        this.getPointer(event, canvas);

        this.raycaster.setFromCamera(this.pointer, camera);

        const objects = [...this.components.values()]
            .map(item => item.object);

        const hits = this.raycaster.intersectObjects(objects, true);

        for (const hit of hits) {
            let object = hit.object;

            while (object && !object.userData?.componentId) {
                object = object.parent;
            }

            if (object?.userData?.componentId) {
                return object;
            }
        }

        return null;
    }

    startDrag(event, camera, canvas) {
        const component = this.getComponentFromPointer(
            event,
            camera,
            canvas
        );

        if (!component) return false;

        this.draggedComponent = component;

        const hit = this.getPointerOnBoard(event, camera, canvas);

        if (hit) {
            this.dragOffset
                .copy(component.position)
                .sub(hit);
        } else {
            this.dragOffset.set(0, 0, 0);
        }

        this.notify('dragStart', {
            id: component.userData.componentId
        });

        return true;
    }

    getPointerOnBoard(event, camera, canvas) {
        this.getPointer(event, canvas);

        this.raycaster.setFromCamera(this.pointer, camera);

        const point = new THREE.Vector3();

        const plane = new THREE.Plane(
            new THREE.Vector3(0, 1, 0),
            -0.12
        );

        const hit = this.raycaster.ray.intersectPlane(
            plane,
            point
        );

        return hit ? point : null;
    }

    moveDrag(event, camera, canvas) {
        if (!this.draggedComponent) return false;

        const point = this.getPointerOnBoard(
            event,
            camera,
            canvas
        );

        if (!point) return false;

        this.draggedComponent.position.copy(
            point.add(this.dragOffset)
        );

        return true;
    }

    endDrag() {
        if (!this.draggedComponent) return false;

        const id = this.draggedComponent.userData.componentId;
        const component = this.components.get(id);

        if (component) {
            component.placed = true;
        }

        this.notify('dragEnd', { id });

        this.draggedComponent = null;

        return true;
    }

    rotateComponent(id, angle = Math.PI / 2) {
        const component = this.components.get(id);

        if (!component) return false;

        component.object.rotation.y += angle;

        this.notify('componentRotated', { id, angle });

        return true;
    }

    /* =====================================
       COMPONENT REMOVAL
       ===================================== */

    removeComponent(id) {
        const component = this.components.get(id);

        if (!component) return false;

        const attachedWires = [...this.wires.values()]
            .filter(wire => {
                return (
                    (wire.start.type === 'terminal' &&
                        wire.start.componentId === id) ||
                    (wire.end.type === 'terminal' &&
                        wire.end.componentId === id)
                );
            })
            .map(wire => wire.id);

        attachedWires.forEach(wireId => this.removeWire(wireId));

        this.scene.remove(component.object);

        component.object.traverse(child => {
            if (child.geometry) child.geometry.dispose();
        });

        this.components.delete(id);

        this.notify('componentRemoved', { id });

        return true;
    }

    /* =====================================
       CIRCUIT DATA
       ===================================== */

    getConnectionData() {
        return [...this.wires.values()].map(wire => ({
            id: wire.id,
            start: { ...wire.start },
            end: { ...wire.end },
            color: wire.color
        }));
    }

    getComponentData() {
        return [...this.components.values()].map(component => ({
            id: component.id,
            type: component.object.userData.componentType,
            terminals: [...component.terminals.keys()],
            placed: component.placed
        }));
    }

    getCircuitSummary() {
        return {
            componentCount: this.components.size,
            wireCount: this.wires.size,
            components: this.getComponentData(),
            connections: this.getConnectionData()
        };
    }

    /* =====================================
       EVENT SYSTEM
       ===================================== */

    on(eventName, callback) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }

        this.listeners.get(eventName).push(callback);

        return () => {
            const callbacks = this.listeners.get(eventName) || [];

            this.listeners.set(
                eventName,
                callbacks.filter(item => item !== callback)
            );
        };
    }

    notify(eventName, data) {
        const callbacks = this.listeners.get(eventName) || [];

        callbacks.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(
                    `CircuitBuilder event error (${eventName}):`,
                    error
                );
            }
        });
    }

    /* =====================================
       RESET AND DISPOSE
       ===================================== */

    reset() {
        [...this.wires.keys()].forEach(id => this.removeWire(id));

        this.selectedComponent = null;
        this.selectedTerminal = null;
        this.draggedComponent = null;

        this.notify('reset', {});
    }

    dispose() {
        this.reset();

        this.components.forEach(component => {
            this.scene.remove(component.object);
        });

        this.components.clear();
        this.listeners.clear();
    }
}
