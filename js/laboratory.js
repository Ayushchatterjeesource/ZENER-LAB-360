
/* =====================================================
   ZENER-LAB-360
   FILE: js/laboratory.js

   Main 3D Laboratory Controller
   Circuit Builder Integration
===================================================== */

import * as THREE from 'three';

import { OrbitControls } from
'three/addons/controls/OrbitControls.js';

import {
    createBreadboard,
    createComponent
} from './components.js';

import {
    createHoleMarkers
} from './breadboard.js';

import {
    CircuitBuilder
} from './circuit-builder.js';

import {
    ZenerSimulation
} from './simulation.js';

import {
    ExperimentGraph
} from './graph.js';

import {
    VivaModule
} from './viva.js';


class ZenerLaboratory {

    constructor() {

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;

        this.builder = null;
        this.simulation = null;
        this.graph = null;
        this.viva = null;

        this.components = [];

        this.holeMarkers = null;

        this.mode = this.detectMode();

        this.inputVoltage = 0;

        this.wireMode = false;

        this.wireColor = 'red';

        this.firstSelectedHole = null;

        this.dragging = false;

        this.init();
    }


    /* ================================================
       DETECT MODE
    ================================================ */

    detectMode() {

        const path =
            window.location.pathname.toLowerCase();

        if (path.includes('load-regulation')) {
            return 'load-regulation';
        }

        if (path.includes('reverse')) {
            return 'reverse';
        }

        return 'forward';
    }


    /* ================================================
       INITIALIZE
    ================================================ */

    init() {

        this.createScene();

        this.createCamera();

        this.createRenderer();

        this.createLighting();

        this.createLaboratory();

        this.createCircuitBuilder();

        this.createSimulation();

        this.createGraph();

        this.createViva();

        this.bindUI();

        this.animate();

        this.runSimulation();

        console.log(
            'ZENER-LAB-360 Ready:',
            this.mode
        );
    }


    /* ================================================
       SCENE
    ================================================ */

    createScene() {

        this.scene = new THREE.Scene();

        this.scene.background =
            new THREE.Color('#101827');

        this.scene.fog = new THREE.Fog(
            '#101827',
            15,
            40
        );
    }


    /* ================================================
       CAMERA
    ================================================ */

    createCamera() {

        const container =
            document.getElementById('three-container');

        const width =
            container.clientWidth || 800;

        const height =
            container.clientHeight || 500;

        this.camera =
            new THREE.PerspectiveCamera(
                45,
                width / height,
                0.1,
                100
            );

        this.camera.position.set(
            0,
            7,
            11
        );
    }


    /* ================================================
       RENDERER
    ================================================ */

    createRenderer() {

        const container =
            document.getElementById('three-container');

        if (!container) {

            throw new Error(
                'Three.js container not found.'
            );
        }

        this.renderer =
            new THREE.WebGLRenderer({

                antialias: true,

                alpha: true

            });

        this.renderer.setPixelRatio(
            Math.min(
                window.devicePixelRatio || 1,
                2
            )
        );

        this.renderer.setSize(
            container.clientWidth,
            container.clientHeight
        );

        this.renderer.shadowMap.enabled = true;

        this.renderer.outputColorSpace =
            THREE.SRGBColorSpace;

        container.innerHTML = '';

        container.appendChild(
            this.renderer.domElement
        );

        this.controls =
            new OrbitControls(
                this.camera,
                this.renderer.domElement
            );

        this.controls.enableDamping = true;

        this.controls.dampingFactor = 0.06;

        this.controls.target.set(0, 0, 0);

        this.controls.minDistance = 4;

        this.controls.maxDistance = 20;

        this.controls.maxPolarAngle =
            Math.PI / 2.05;
    }


    /* ================================================
       LIGHTING
    ================================================ */

    createLighting() {

        this.scene.add(
            new THREE.AmbientLight(
                '#ffffff',
                1.5
            )
        );

        const mainLight =
            new THREE.DirectionalLight(
                '#ffffff',
                2
            );

        mainLight.position.set(5, 10, 7);

        mainLight.castShadow = true;

        this.scene.add(mainLight);

        const fillLight =
            new THREE.PointLight(
                '#22d3ee',
                1.2,
                20
            );

        fillLight.position.set(-5, 4, -3);

        this.scene.add(fillLight);
    }


    /* ================================================
       LABORATORY TABLE
    ================================================ */

    createLaboratory() {

        const floor =
            new THREE.Mesh(

                new THREE.PlaneGeometry(30, 30),

                new THREE.MeshStandardMaterial({

                    color: '#202d3e',

                    roughness: 0.85

                })

            );

        floor.rotation.x = -Math.PI / 2;

        floor.position.y = -0.65;

        floor.receiveShadow = true;

        this.scene.add(floor);


        const table =
            new THREE.Mesh(

                new THREE.BoxGeometry(
                    12,
                    0.35,
                    7
                ),

                new THREE.MeshStandardMaterial({

                    color: '#34465b',

                    roughness: 0.55

                })

            );

        table.position.y = -0.2;

        table.receiveShadow = true;

        table.castShadow = true;

        this.scene.add(table);


        this.breadboard = createBreadboard();

        this.breadboard.position.set(
            0,
            0.02,
            0
        );

        this.scene.add(this.breadboard);
    }


    /* ================================================
       CIRCUIT BUILDER
    ================================================ */

    createCircuitBuilder() {

        this.holeMarkers =
            createHoleMarkers(
                this.scene,
                {
                    visible: true
                }
            );

        this.builder =
            new CircuitBuilder(
                this.scene,
                {
                    board: this.holeMarkers.board,
                    snapDistance: 0.45,
                    wireHeight: 0.38
                }
            );

        this.createComponents();

        this.createInteractionHelpers();
    }


    /* ================================================
       ADD COMPONENTS
    ================================================ */

    createComponents() {

        const layout = [

            {
                id: 'dc-supply',
                type: 'dc-supply',
                position: [-4, 0.25, -1.5],
                terminals: [
                    {
                        id: 'positive',
                        localPosition: [-0.2, 0, 0]
                    },
                    {
                        id: 'negative',
                        localPosition: [0.2, 0, 0]
                    }
                ]
            },

            {
                id: 'ammeter',
                type: 'ammeter',
                position: [-2.5, 0.25, -1.5],
                terminals: [
                    { id: 'input' },
                    { id: 'output' }
                ]
            },

            {
                id: 'voltmeter',
                type: 'voltmeter',
                position: [2.8, 0.25, -1.5],
                terminals: [
                    { id: 'positive' },
                    { id: 'negative' }
                ]
            },

            {
                id: 'resistor',
                type: 'resistor',
                position: [-2, 0.25, 1.5],
                terminals: [
                    { id: 'left' },
                    { id: 'right' }
                ]
            },

            {
                id: 'zener-diode',
                type: 'zener-diode',
                position: [0, 0.25, 1.5],
                terminals: [
                    { id: 'anode' },
                    { id: 'cathode' }
                ]
            },

            {
                id: 'potentiometer',
                type: 'potentiometer',
                position: [2, 0.25, 1.5],
                terminals: [
                    { id: 'terminal-1' },
                    { id: 'terminal-2' },
                    { id: 'wiper' }
                ]
            }

        ];


        for (const item of layout) {

            try {

                const object =
                    createComponent(item.type);

                if (!object) {
                    continue;
                }

                object.position.set(
                    ...item.position
                );

                object.traverse(child => {

                    if (child.isMesh) {

                        child.castShadow = true;

                        child.receiveShadow = true;

                    }

                });

                this.builder.addComponent(
                    item.id,
                    object,
                    item.terminals
                );

                this.components.push(object);

            } catch (error) {

                console.error(
                    'Component creation failed:',
                    item.type,
                    error
                );

            }
        }
    }


    /* ================================================
       INTERACTION HELPERS
    ================================================ */

    createInteractionHelpers() {

        this.raycaster =
            new THREE.Raycaster();

        this.pointer =
            new THREE.Vector2();

        this.renderer.domElement.style.touchAction =
            'none';

        this.bindCanvasInteractions();
    }


    /* ================================================
       CANVAS INTERACTIONS
    ================================================ */

    bindCanvasInteractions() {

        const canvas =
            this.renderer.domElement;

        canvas.addEventListener(
            'pointerdown',
            event => this.handlePointerDown(event)
        );

        canvas.addEventListener(
            'pointermove',
            event => this.handlePointerMove(event)
        );

        canvas.addEventListener(
            'pointerup',
            event => this.handlePointerUp(event)
        );

        canvas.addEventListener(
            'pointercancel',
            () => this.handlePointerUp()
        );
    }


    /* ================================================
       POINTER COORDINATES
    ================================================ */

    updatePointer(event) {

        const rect =
            this.renderer.domElement
                .getBoundingClientRect();

        this.pointer.x =
            ((event.clientX - rect.left) /
            rect.width) * 2 - 1;

        this.pointer.y =
            -((event.clientY - rect.top) /
            rect.height) * 2 + 1;

        this.raycaster.setFromCamera(
            this.pointer,
            this.camera
        );
    }


    /* ================================================
       POINTER DOWN
    ================================================ */

    handlePointerDown(event) {

        this.updatePointer(event);

        if (this.wireMode) {

            this.selectBreadboardHole();

            return;
        }

        const started =
            this.builder.startDrag(
                event,
                this.camera,
                this.renderer.domElement
            );

        if (started) {

            this.dragging = true;

            this.controls.enabled = false;

            this.renderer.domElement.setPointerCapture(
                event.pointerId
            );

        }
    }


    /* ================================================
       POINTER MOVE
    ================================================ */

    handlePointerMove(event) {

        if (!this.dragging) {
            return;
        }

        this.builder.moveDrag(
            event,
            this.camera,
            this.renderer.domElement
        );
    }


    /* ================================================
       POINTER UP
    ================================================ */

    handlePointerUp(event) {

        if (this.dragging) {

            this.builder.endDrag();

            this.dragging = false;

            this.controls.enabled = true;

            if (
                event?.pointerId !== undefined &&
                this.renderer.domElement.hasPointerCapture(
                    event.pointerId
                )
            ) {

                this.renderer.domElement.releasePointerCapture(
                    event.pointerId
                );

            }
        }
    }


    /* ================================================
       SELECT BREADBOARD HOLE
    ================================================ */

    selectBreadboardHole() {

        const markers =
            this.holeMarkers.group.children;

        const hits =
            this.raycaster.intersectObjects(
                markers,
                false
            );

        if (!hits.length) {
            return;
        }

        const holeId =
            hits[0].object.userData.holeId;

        if (!holeId) {
            return;
        }

        if (!this.firstSelectedHole) {

            this.firstSelectedHole = holeId;

            this.setStatus(
                `First hole selected: ${holeId}. Select another hole.`
            );

            this.highlightHole(holeId);

            return;
        }

        if (this.firstSelectedHole === holeId) {

            this.firstSelectedHole = null;

            this.setStatus(
                'Selection cancelled.'
            );

            return;
        }

        const result =
            this.builder.connectHoles(
                this.firstSelectedHole,
                holeId,
                this.wireColor
            );

        if (result.success) {

            this.setStatus(
                `Wire connected: ${this.firstSelectedHole} → ${holeId}`
            );

        } else {

            this.setStatus(
                result.message
            );

        }

        this.firstSelectedHole = null;

        this.clearHoleHighlight();
    }


    /* ================================================
       HOLE HIGHLIGHT
    ================================================ */

    highlightHole(holeId) {

        this.clearHoleHighlight();

        const marker =
            this.holeMarkers.getMarker(holeId);

        if (marker) {

            marker.material.color.set('#facc15');

            this.selectedMarker = marker;

        }
    }


    clearHoleHighlight() {

        if (this.selectedMarker) {

            this.selectedMarker.material.color.set(
                '#94a3b8'
            );

            this.selectedMarker = null;
        }
    }


    /* ================================================
       WIRE MODE
    ================================================ */

    toggleWireMode() {

        this.wireMode = !this.wireMode;

        this.firstSelectedHole = null;

        this.clearHoleHighlight();

        this.controls.enabled = !this.wireMode;

        this.setStatus(
            this.wireMode
                ? 'Wire mode active. Select two breadboard holes.'
                : 'Wire mode disabled.'
        );

        return this.wireMode;
    }


    /* ================================================
       WIRE COLOR
    ================================================ */

    setWireColor(color) {

        const validColors = [
            'red',
            'black',
            'yellow',
            'green'
        ];

        if (validColors.includes(color)) {

            this.wireColor = color;

        }
    }


    /* ================================================
       DELETE LAST WIRE
    ================================================ */

    deleteLastWire() {

        const ids =
            Array.from(
                this.builder.wires.keys()
            );

        if (!ids.length) {
            return false;
        }

        const lastId =
            ids[ids.length - 1];

        const result =
            this.builder.removeWire(lastId);

        this.setStatus(
            result
                ? 'Last wire removed.'
                : 'Unable to remove wire.'
        );

        return result;
    }


    /* ================================================
       STATUS MESSAGE
    ================================================ */

    setStatus(message) {

        const element =
            document.getElementById('circuitStatus');

        if (element) {

            element.textContent = message;

        }

        console.log(message);
    }


    /* ================================================
       SIMULATION
    ================================================ */

    createSimulation() {

        this.simulation =
            new ZenerSimulation({

                seriesResistance: 1000,

                loadResistance: 1000,

                zenerVoltage: 5.1,

                forwardVoltage: 0.7,

                zenerResistance: 8,

                maxCurrent: 0.02

            });

        this.simulation.setMode(this.mode);
    }


    runSimulation() {

        const result =
            this.simulation.run(
                this.inputVoltage
            );

        this.updateMeters(result);

        this.generateGraph();

        return result;
    }


    /* ================================================
       GRAPH
    ================================================ */

    createGraph() {

        const canvas =
            document.getElementById('viGraph');

        if (!canvas) return;

        this.graph =
            new ExperimentGraph(canvas);

        this.generateGraph();
    }


    generateGraph() {

        if (!this.graph) return;

        if (this.mode === 'load-regulation') {

            this.graph
                .setGraphType('load')
                .setData(
                    this.simulation.generateLoadData()
                );

        } else {

            this.graph
                .setGraphType('vi')
                .setData(
                    this.simulation.generateVIData(
                        0,
                        12,
                        60
                    )
                );
        }
    }


    /* ================================================
       DIGITAL METERS
    ================================================ */

    updateMeters(result) {

        if (!result) return;

        this.setText(
            'voltageReading',
            `${(result.outputVoltage ??
                result.diodeVoltage ??
                0).toFixed(3)} V`
        );

        this.setText(
            'currentReading',
            `${(result.loadCurrentMilliampere ??
                result.currentMilliampere ??
                0).toFixed(3)} mA`
        );

        this.setText(
            'powerReading',
            `${(result.powerMilliwatt ?? 0).toFixed(3)} mW`
        );

        this.setText(
            'operatingRegion',
            result.region ?? 'Standby'
        );
    }


    setText(id, value) {

        const element =
            document.getElementById(id);

        if (element) {
            element.textContent = value;
        }
    }


    /* ================================================
       OBSERVATION TABLE
    ================================================ */

    recordObservation() {

        const observation =
            this.simulation.recordObservation();

        if (!observation) return;

        const tbody =
            document.getElementById('observationBody');

        if (!tbody) return;

        const row =
            document.createElement('tr');

        const values = [

            observation.observationNumber,

            `${observation.inputVoltage.toFixed(2)} V`,

            `${(observation.outputVoltage ??
                observation.diodeVoltage ??
                0).toFixed(3)} V`,

            `${(observation.loadCurrentMilliampere ??
                observation.currentMilliampere ??
                0).toFixed(3)} mA`,

            `${(observation.powerMilliwatt ?? 0).toFixed(3)} mW`,

            observation.region

        ];

        for (const value of values) {

            const cell =
                document.createElement('td');

            cell.textContent = value;

            row.appendChild(cell);
        }

        tbody.appendChild(row);
    }


    /* ================================================
       VIVA
    ================================================ */

    createViva() {

        const container =
            document.getElementById('vivaContainer');

        if (container) {

            this.viva =
                new VivaModule(container);

        }
    }


    /* ================================================
       UI EVENTS
    ================================================ */

    bindUI() {

        const slider =
            document.getElementById('voltageSlider');

        const runButton =
            document.getElementById('runBtn');

        const resetButton =
            document.getElementById('resetBtn');

        const recordButton =
            document.getElementById('recordBtn');

        const loadResistance =
            document.getElementById('loadResistance');


        slider?.addEventListener(
            'input',
            () => {

                this.inputVoltage =
                    Number(slider.value);

                this.setText(
                    'voltageValue',
                    `${this.inputVoltage.toFixed(1)} V`
                );

                this.runSimulation();

            }
        );


        runButton?.addEventListener(
            'click',
            () => this.runSimulation()
        );


        resetButton?.addEventListener(
            'click',
            () => this.resetExperiment()
        );


        recordButton?.addEventListener(
            'click',
            () => this.recordObservation()
        );


        loadResistance?.addEventListener(
            'input',
            () => {

                this.simulation.updateParameters({

                    loadResistance:
                        Number(loadResistance.value)

                });

                this.runSimulation();

            }
        );


        document.getElementById('wireModeBtn')
            ?.addEventListener(
                'click',
                () => this.toggleWireMode()
            );


        document.getElementById('wireColor')
            ?.addEventListener(
                'change',
                event => this.setWireColor(
                    event.target.value
                )
            );


        document.getElementById('deleteWireBtn')
            ?.addEventListener(
                'click',
                () => this.deleteLastWire()
            );


        document.getElementById('resetCameraBtn')
            ?.addEventListener(
                'click',
                () => this.handleCameraAction('reset')
            );


        window.addEventListener(
            'resize',
            () => this.handleResize()
        );
    }


    /* ================================================
       CAMERA ACTIONS
    ================================================ */

    handleCameraAction(action) {

        if (action === 'reset') {

            this.camera.position.set(
                0,
                7,
                11
            );

            this.controls.target.set(
                0,
                0,
                0
            );

            this.controls.update();
        }
    }


    /* ================================================
       RESET
    ================================================ */

    resetExperiment() {

        this.inputVoltage = 0;

        this.simulation.reset();

        this.builder.reset();

        this.firstSelectedHole = null;

        this.clearHoleHighlight();

        const slider =
            document.getElementById('voltageSlider');

        if (slider) {
            slider.value = 0;
        }

        const tbody =
            document.getElementById('observationBody');

        if (tbody) {
            tbody.innerHTML = '';
        }

        this.setText(
            'voltageValue',
            '0.0 V'
        );

        this.setStatus(
            'Experiment reset. Circuit components need to be placed again.'
        );

        this.runSimulation();

    }


    /* ================================================
       RESIZE
    ================================================ */

    handleResize() {

        const container =
            document.getElementById('three-container');

        if (!container) return;

        const width = container.clientWidth;

        const height = container.clientHeight;

        if (!width || !height) return;

        this.camera.aspect =
            width / height;

        this.camera.updateProjectionMatrix();

        this.renderer.setSize(
            width,
            height
        );
    }


    /* ================================================
       ANIMATION
    ================================================ */

    animate() {

        this.animationFrame =
            requestAnimationFrame(
                () => this.animate()
            );

        this.controls?.update();

        this.renderer.render(
            this.scene,
            this.camera
        );
    }


    /* ================================================
       CLEANUP
    ================================================ */

    destroy() {

        cancelAnimationFrame(
            this.animationFrame
        );

        this.builder?.dispose();

        this.holeMarkers?.dispose();

        this.graph?.destroy();

        this.controls?.dispose();

        this.renderer?.dispose();
    }

}


/* =====================================================
   START
===================================================== */

function startLaboratory() {

    try {

        window.zenerLab =
            new ZenerLaboratory();

    } catch (error) {

        console.error(
            'Laboratory initialization failed:',
            error
        );

    }
}


if (document.readyState === 'loading') {

    document.addEventListener(
        'DOMContentLoaded',
        startLaboratory,
        { once: true }
    );

} else {

    startLaboratory();

}
