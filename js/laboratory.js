
/* =====================================================
   ZENER-LAB-360
   FILE: js/laboratory.js

   Main Laboratory Controller
===================================================== */

import * as THREE from 'three';

import { OrbitControls } from
'three/addons/controls/OrbitControls.js';

import {
    createBreadboard,
    createComponent
} from './components.js';

import { createHoleMarkers } from './breadboard.js';

import { CircuitBuilder } from './circuit-builder.js';

import { ZenerSimulation } from './simulation.js';

import { ExperimentGraph } from './graph.js';

import { VivaModule } from './viva.js';


class ZenerLaboratory {

    constructor() {

        this.scene = null;

        this.camera = null;

        this.renderer = null;

        this.controls = null;

        this.clock = new THREE.Clock();

        this.components = [];

        this.selectedComponent = null;

        this.simulation = null;

        this.graph = null;

        this.viva = null;

        this.mode = this.detectMode();

        this.inputVoltage = 0;

        this.isRunning = false;

        this.init();
    }


    /* ================================================
       DETECT EXPERIMENT
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

        this.createControls();

        this.createSimulation();

        this.createGraph();

        this.createViva();

        this.bindUI();

        this.animate();

        this.updateMeters(
            this.simulation.run(0)
        );

        console.log(
            'ZENER-LAB-360 initialized:',
            this.mode
        );
    }


    /* ================================================
       THREE.JS SCENE
    ================================================ */

    createScene() {

        this.scene = new THREE.Scene();

        this.scene.background =
            new THREE.Color('#101827');

        this.scene.fog = new THREE.Fog(
            '#101827',
            12,
            35
        );
    }


    /* ================================================
       CAMERA
    ================================================ */

    createCamera() {

        const container =
            document.getElementById('three-container');

        const width =
            container?.clientWidth || 800;

        const height =
            container?.clientHeight || 500;

        this.camera = new THREE.PerspectiveCamera(
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

        this.renderer = new THREE.WebGLRenderer({

            antialias: true,

            alpha: true

        });

        this.renderer.setPixelRatio(
            Math.min(window.devicePixelRatio, 2)
        );

        this.renderer.setSize(
            container.clientWidth,
            container.clientHeight
        );

        this.renderer.shadowMap.enabled = true;

        this.renderer.shadowMap.type =
            THREE.PCFSoftShadowMap;

        this.renderer.outputColorSpace =
            THREE.SRGBColorSpace;

        container.innerHTML = '';

        container.appendChild(
            this.renderer.domElement
        );

        this.controls = new OrbitControls(
            this.camera,
            this.renderer.domElement
        );

        this.controls.enableDamping = true;

        this.controls.dampingFactor = 0.06;

        this.controls.target.set(
            0,
            0,
            0
        );

        this.controls.minDistance = 4;

        this.controls.maxDistance = 20;

        this.controls.maxPolarAngle =
            Math.PI / 2.05;
    }


    /* ================================================
       LIGHTING
    ================================================ */

    createLighting() {

        const ambient = new THREE.AmbientLight(
            '#ffffff',
            1.5
        );

        this.scene.add(ambient);

        const mainLight = new THREE.DirectionalLight(
            '#ffffff',
            2
        );

        mainLight.position.set(
            5,
            10,
            7
        );

        mainLight.castShadow = true;

        this.scene.add(mainLight);

        const fillLight = new THREE.PointLight(
            '#22d3ee',
            1.2,
            20
        );

        fillLight.position.set(
            -5,
            4,
            -3
        );

        this.scene.add(fillLight);
    }


    /* ================================================
       LABORATORY TABLE
    ================================================ */

    createLaboratory() {

        const floor = new THREE.Mesh(

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


        const table = new THREE.Mesh(

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


        const breadboard = createBreadboard();

        breadboard.position.set(
            0,
            0.02,
            0
        );

        breadboard.scale.setScalar(1);

        this.scene.add(breadboard);

        this.breadboard = breadboard;


        try {

            this.holeMarkers =
                createHoleMarkers(this.scene, {
                    visible: false
                });

        } catch (error) {

            console.warn(
                'Breadboard markers could not be initialized:',
                error
            );

        }


        this.createLabComponents();
    }


    /* ================================================
       COMPONENTS
    ================================================ */

    createLabComponents() {

        const layout = [

            {
                type: 'dc-supply',
                position: [-4, 0.25, -1.5]
            },

            {
                type: 'ammeter',
                position: [-2.5, 0.25, -1.5]
            },

            {
                type: 'voltmeter',
                position: [2.8, 0.25, -1.5]
            },

            {
                type: 'resistor',
                position: [-2, 0.25, 1.5]
            },

            {
                type: 'zener-diode',
                position: [0, 0.25, 1.5]
            },

            {
                type: 'potentiometer',
                position: [2, 0.25, 1.5]
            }

        ];


        for (const item of layout) {

            try {

                const component =
                    createComponent(item.type);

                if (!component) {
                    continue;
                }

                component.position.set(
                    ...item.position
                );

                component.userData.componentType =
                    item.type;

                component.userData.selectable = true;

                component.traverse(child => {

                    if (child.isMesh) {

                        child.castShadow = true;

                        child.receiveShadow = true;

                    }

                });

                this.scene.add(component);

                this.components.push(component);

            } catch (error) {

                console.warn(
                    'Component creation failed:',
                    item.type,
                    error
                );

            }
        }
    }


    /* ================================================
       SIMULATION
    ================================================ */

    createSimulation() {

        this.simulation = new ZenerSimulation({

            seriesResistance: 1000,

            loadResistance: 1000,

            zenerVoltage: 5.1,

            forwardVoltage: 0.7,

            zenerResistance: 8,

            maxCurrent: 0.02

        });

        this.simulation.setMode(this.mode);
    }


    /* ================================================
       GRAPH
    ================================================ */

    createGraph() {

        const canvas =
            document.getElementById('viGraph');

        if (!canvas) {
            return;
        }

        this.graph =
            new ExperimentGraph(canvas);

        this.graph.setGraphType(
            this.mode === 'load-regulation'
                ? 'load'
                : 'vi'
        );

        this.generateGraph();
    }


    generateGraph() {

        if (!this.graph) {
            return;
        }

        if (this.mode === 'load-regulation') {

            const data =
                this.simulation.generateLoadData();

            this.graph
                .setGraphType('load')
                .setData(data);

        } else {

            const data =
                this.simulation.generateVIData(
                    0,
                    12,
                    60
                );

            this.graph
                .setGraphType('vi')
                .setData(data);

        }
    }


    /* ================================================
       VIVA
    ================================================ */

    createViva() {

        const container =
            document.getElementById('vivaContainer');

        if (!container) {
            return;
        }

        this.viva =
            new VivaModule(container);
    }


    /* ================================================
       UI EVENT LISTENERS
    ================================================ */

    bindUI() {

        const voltageSlider =
            document.getElementById('voltageSlider');

        const voltageValue =
            document.getElementById('voltageValue');

        const runButton =
            document.getElementById('runBtn');

        const resetButton =
            document.getElementById('resetBtn');

        const recordButton =
            document.getElementById('recordBtn');

        const loadResistance =
            document.getElementById('loadResistance');


        if (voltageSlider) {

            this.inputVoltage =
                Number(voltageSlider.value);

            voltageSlider.addEventListener(
                'input',
                () => {

                    this.inputVoltage =
                        Number(voltageSlider.value);

                    if (voltageValue) {

                        voltageValue.textContent =
                            `${this.inputVoltage.toFixed(1)} V`;

                    }

                    this.runSimulation();

                }
            );
        }


        if (runButton) {

            runButton.addEventListener(
                'click',
                () => this.runSimulation()
            );
        }


        if (resetButton) {

            resetButton.addEventListener(
                'click',
                () => this.resetExperiment()
            );
        }


        if (recordButton) {

            recordButton.addEventListener(
                'click',
                () => this.recordObservation()
            );
        }


        if (loadResistance) {

            loadResistance.addEventListener(
                'input',
                () => {

                    this.simulation.updateParameters({

                        loadResistance:
                            Number(loadResistance.value)

                    });

                    this.runSimulation();

                }
            );
        }


        window.addEventListener(
            'resize',
            () => this.handleResize()
        );


        this.bind3DInteraction();
    }


    /* ================================================
       RUN SIMULATION
    ================================================ */

    runSimulation() {

        if (!this.simulation) {
            return;
        }

        const result =
            this.simulation.run(
                this.inputVoltage
            );

        this.updateMeters(result);

        this.generateGraph();

        this.isRunning = true;

        return result;
    }


    /* ================================================
       UPDATE DIGITAL METERS
    ================================================ */

    updateMeters(result) {

        if (!result) {
            return;
        }

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

        if (!observation) {
            return;
        }

        const tbody =
            document.getElementById('observationBody');

        if (!tbody) {
            return;
        }

        const row =
            document.createElement('tr');

        const voltage =
            observation.outputVoltage ??
            observation.diodeVoltage ??
            0;

        const current =
            observation.loadCurrentMilliampere ??
            observation.currentMilliampere ??
            0;

        const power =
            observation.powerMilliwatt ?? 0;

        const values = [

            observation.observationNumber,

            `${observation.inputVoltage.toFixed(2)} V`,

            `${voltage.toFixed(3)} V`,

            `${current.toFixed(3)} mA`,

            `${power.toFixed(3)} mW`,

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
       RESET EXPERIMENT
    ================================================ */

    resetExperiment() {

        this.inputVoltage = 0;

        this.simulation.reset();

        this.setText(
            'voltageValue',
            '0.0 V'
        );

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

        if (this.graph) {
            this.graph.clear();
        }

        this.updateMeters(
            this.simulation.run(0)
        );

        this.generateGraph();

        this.isRunning = false;
    }


    /* ================================================
       3D COMPONENT INTERACTION
    ================================================ */

    bind3DInteraction() {

        const canvas =
            this.renderer.domElement;

        this.raycaster =
            new THREE.Raycaster();

        this.pointer =
            new THREE.Vector2();

        canvas.addEventListener(
            'pointerdown',
            event => {

                const rect =
                    canvas.getBoundingClientRect();

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

                const hits =
                    this.raycaster.intersectObjects(
                        this.components,
                        true
                    );

                if (!hits.length) {
                    return;
                }

                let object = hits[0].object;

                while (
                    object.parent &&
                    !this.components.includes(object)
                ) {
                    object = object.parent;
                }

                this.selectComponent(object);
            }
        );
    }


    selectComponent(component) {

        if (!component) {
            return;
        }

        this.selectedComponent = component;

        const type =
            component.userData.componentType ||
            'Laboratory Component';

        this.setText(
            'selectedComponent',
            type.replaceAll('-', ' ').toUpperCase()
        );

        console.log(
            'Selected component:',
            type
        );
    }


    /* ================================================
       CAMERA CONTROLS
    ================================================ */

    handleCameraAction(action) {

        if (!this.camera || !this.controls) {
            return;
        }

        switch (action) {

            case 'reset':

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

                break;


            case 'top':

                this.camera.position.set(
                    0,
                    13,
                    0
                );

                break;


            case 'front':

                this.camera.position.set(
                    0,
                    4,
                    13
                );

                break;


            case 'rotate-left':

                this.camera.position.applyAxisAngle(
                    new THREE.Vector3(0, 1, 0),
                    0.25
                );

                break;


            case 'rotate-right':

                this.camera.position.applyAxisAngle(
                    new THREE.Vector3(0, 1, 0),
                    -0.25
                );

                break;

        }

        this.controls.update();
    }


    /* ================================================
       RESPONSIVE RESIZE
    ================================================ */

    handleResize() {

        const container =
            document.getElementById('three-container');

        if (!container) {
            return;
        }

        const width =
            container.clientWidth;

        const height =
            container.clientHeight;

        if (!width || !height) {
            return;
        }

        this.camera.aspect =
            width / height;

        this.camera.updateProjectionMatrix();

        this.renderer.setSize(
            width,
            height
        );
    }


    /* ================================================
       ANIMATION LOOP
    ================================================ */

    animate() {

        requestAnimationFrame(
            () => this.animate()
        );

        if (this.controls) {

            this.controls.update();

        }

        if (this.renderer && this.scene && this.camera) {

            this.renderer.render(
                this.scene,
                this.camera
            );

        }
    }


    /* ================================================
       CLEANUP
    ================================================ */

    destroy() {

        if (this.graph) {
            this.graph.destroy();
        }

        if (this.controls) {
            this.controls.dispose();
        }

        if (this.renderer) {

            this.renderer.dispose();

        }

        window.removeEventListener(
            'resize',
            this.handleResize
        );
    }

}


/* =====================================================
   START LABORATORY
===================================================== */

function startLaboratory() {

    try {

        window.zenerLab =
            new ZenerLaboratory();

    } catch (error) {

        console.error(
            'Zener Laboratory initialization failed:',
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
