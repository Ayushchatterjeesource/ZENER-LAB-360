
/* =========================================
   ZENER-LAB-360
   FILE: laboratory.js

   Main Laboratory Controller
========================================= */

import * as THREE from
    'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

import { OrbitControls } from
    'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js';

import {
    createBreadboard
} from './components.js';

import {
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


/* =========================================
   1. LABORATORY CONTROLLER
========================================= */

class ZenerLaboratory {

    constructor() {

        this.container =
            document.getElementById('three-container');

        if (!this.container) {
            console.error(
                '3D viewport #three-container not found.'
            );

            return;
        }

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;

        this.circuitBuilder = null;
        this.simulation = null;
        this.graph = null;
        this.viva = null;

        this.components = {};

        this.observations = [];

        this.mode = this.detectExperimentMode();

        this.isRunning = false;

        this.animationFrame = null;

        this.raycaster = new THREE.Raycaster();

        this.pointer = new THREE.Vector2();

        this.selectedObject = null;

        this.clock = new THREE.Clock();

        this.initialize();
    }


    /* =====================================
       2. DETECT EXPERIMENT MODE
    ===================================== */

    detectExperimentMode() {

        const path = window.location.pathname.toLowerCase();

        if (path.includes('reverse')) {
            return 'reverse';
        }

        if (
            path.includes('load-regulation') ||
            path.includes('load_regulation')
        ) {
            return 'load-regulation';
        }

        return 'forward';
    }


    /* =====================================
       3. INITIALIZE APPLICATION
    ===================================== */

    initialize() {

        this.createScene();

        this.createCamera();

        this.createRenderer();

        this.createLights();

        this.createEnvironment();

        this.createLaboratoryComponents();

        this.createCircuitBuilder();

        this.createSimulation();

        this.createGraph();

        this.createViva();

        this.setupControls();

        this.setupInteractions();

        this.setupResize();

        this.updateExperimentHeading();

        this.hideLoadingScreen();

        this.animate();

        console.log(
            'ZENER-LAB-360 initialized:',
            this.mode
        );
    }


    /* =====================================
       4. CREATE SCENE
    ===================================== */

    createScene() {

        this.scene = new THREE.Scene();

        this.scene.background =
            new THREE.Color(0x101a2a);

        this.scene.fog = new THREE.Fog(
            0x101a2a,
            22,
            55
        );
    }


    /* =====================================
       5. CREATE CAMERA
    ===================================== */

    createCamera() {

        const width =
            this.container.clientWidth || 800;

        const height =
            this.container.clientHeight || 500;

        this.camera = new THREE.PerspectiveCamera(
            45,
            width / height,
            0.1,
            100
        );

        this.camera.position.set(
            10,
            9,
            12
        );

        this.camera.lookAt(
            0,
            0,
            0
        );
    }


    /* =====================================
       6. CREATE RENDERER
    ===================================== */

    createRenderer() {

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false
        });

        this.renderer.setPixelRatio(
            Math.min(
                window.devicePixelRatio || 1,
                2
            )
        );

        this.renderer.setSize(
            this.container.clientWidth || 800,
            this.container.clientHeight || 500
        );

        this.renderer.shadowMap.enabled = true;

        this.renderer.shadowMap.type =
            THREE.PCFSoftShadowMap;

        this.renderer.outputColorSpace =
            THREE.SRGBColorSpace;

        this.renderer.toneMapping =
            THREE.ACESFilmicToneMapping;

        this.renderer.toneMappingExposure = 1.15;

        this.container.appendChild(
            this.renderer.domElement
        );

        this.renderer.domElement.style.display =
            'block';

        this.renderer.domElement.style.width =
            '100%';

        this.renderer.domElement.style.height =
            '100%';
    }


    /* =====================================
       7. CREATE LIGHTS
    ===================================== */

    createLights() {

        const ambient = new THREE.AmbientLight(
            0xffffff,
            1.5
        );

        this.scene.add(ambient);

        const mainLight = new THREE.DirectionalLight(
            0xffffff,
            2.5
        );

        mainLight.position.set(
            8,
            15,
            10
        );

        mainLight.castShadow = true;

        mainLight.shadow.mapSize.set(
            2048,
            2048
        );

        this.scene.add(mainLight);

        const fillLight = new THREE.PointLight(
            0x27d9cf,
            35,
            30
        );

        fillLight.position.set(
            -8,
            6,
            -5
        );

        this.scene.add(fillLight);

        const backLight = new THREE.DirectionalLight(
            0x568bff,
            1.1
        );

        backLight.position.set(
            -5,
            8,
            8
        );

        this.scene.add(backLight);
    }


    /* =====================================
       8. CREATE ENVIRONMENT
    ===================================== */

    createEnvironment() {

        const floorGeometry =
            new THREE.PlaneGeometry(60, 60);

        const floorMaterial =
            new THREE.MeshStandardMaterial({
                color: 0x172438,
                roughness: 0.85
            });

        const floor = new THREE.Mesh(
            floorGeometry,
            floorMaterial
        );

        floor.rotation.x = -Math.PI / 2;

        floor.position.y = -0.65;

        floor.receiveShadow = true;

        this.scene.add(floor);

        // Laboratory table
        const tableGeometry =
            new THREE.BoxGeometry(17, 0.45, 12);

        const tableMaterial =
            new THREE.MeshStandardMaterial({
                color: 0x28384b,
                roughness: 0.55
            });

        const table = new THREE.Mesh(
            tableGeometry,
            tableMaterial
        );

        table.position.set(
            0,
            -0.35,
            0
        );

        table.receiveShadow = true;

        table.castShadow = true;

        this.scene.add(table);

        // Grid helper
        const grid = new THREE.GridHelper(
            50,
            50,
            0x34506b,
            0x26394f
        );

        grid.position.y = -0.11;

        grid.material.transparent = true;

        grid.material.opacity = 0.18;

        this.scene.add(grid);
    }


    /* =====================================
       9. CREATE COMPONENTS
    ===================================== */

    createLaboratoryComponents() {

        // Breadboard
        const breadboard = createBreadboard();

        breadboard.position.set(
            0,
            0,
            0
        );

        this.scene.add(breadboard);

        this.components.breadboard =
            breadboard;


        // Zener diode
        const diode = createComponent('zener');

        diode.position.set(
            -1.1,
            0.35,
            0
        );

        this.scene.add(diode);

        this.components.zener = diode;


        // Series resistor
        const resistor = createComponent('resistor');

        resistor.position.set(
            1.1,
            0.35,
            0
        );

        this.scene.add(resistor);

        this.components.resistor = resistor;


        // Potentiometer
        const potentiometer =
            createComponent('potentiometer');

        potentiometer.position.set(
            3,
            0.35,
            1.5
        );

        this.scene.add(potentiometer);

        this.components.potentiometer =
            potentiometer;


        // DC power supply
        const supply =
            createComponent('dcSupply');

        supply.position.set(
            -7,
            0,
            -1
        );

        this.scene.add(supply);

        this.components.dcSupply = supply;


        // Ammeter
        const ammeter =
            createComponent('ammeter');

        ammeter.position.set(
            -5.5,
            0,
            3
        );

        this.scene.add(ammeter);

        this.components.ammeter = ammeter;


        // Voltmeter
        const voltmeter =
            createComponent('voltmeter');

        voltmeter.position.set(
            5.5,
            0,
            3
        );

        this.scene.add(voltmeter);

        this.components.voltmeter = voltmeter;


        // Hole markers
        this.holeMarkers = createHoleMarkers(
            this.scene,
            {
                visible: false
            }
        );
    }


    /* =====================================
       10. CIRCUIT BUILDER
    ===================================== */

    createCircuitBuilder() {

        this.circuitBuilder =
            new CircuitBuilder(this.scene);

        /*
          The initial scene shows component models.
          Circuit Builder can create additional
          components and jumper wires.

          Actual circuit wiring will be configured
          in the circuit-building interface.
        */
    }


    /* =====================================
       11. SIMULATION
    ===================================== */

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

        this.simulation.setMode(
            this.mode
        );
    }


    /* =====================================
       12. GRAPH
    ===================================== */

    createGraph() {

        const canvas =
            document.getElementById('viGraph');

        if (!canvas) {
            console.warn(
                'Graph canvas #viGraph not found.'
            );

            return;
        }

        this.graph = new ExperimentGraph(
            canvas
        );

        if (this.mode === 'load-regulation') {

            this.graph.setGraphType('load');
        }

        else {

            this.graph.setGraphType('vi');
        }

        this.graph.draw();
    }


    /* =====================================
       13. VIVA
    ===================================== */

    createViva() {

        const vivaContainer =
            document.getElementById('vivaContainer') ||
            document.getElementById('viva-content') ||
            document.querySelector('.viva-content');

        if (!vivaContainer) {
            return;
        }

        this.viva = new VivaModule(
            vivaContainer
        );
    }


    /* =====================================
       14. FIND ELEMENT BY SELECTORS
    ===================================== */

    findElement(...selectors) {

        for (const selector of selectors) {

            const element =
                document.querySelector(selector);

            if (element) {
                return element;
            }
        }

        return null;
    }


    /* =====================================
       15. SETUP UI CONTROLS
    ===================================== */

    setupControls() {

        this.voltageSlider = this.findElement(
            '#voltageSlider',
            '#supplyVoltage',
            '#voltageRange',
            'input[type="range"]'
        );

        this.voltageValue = this.findElement(
            '#voltageValue',
            '#voltageDisplay',
            '[data-voltage-value]'
        );

        this.ammeterDisplay = this.findElement(
            '#currentReading',
            '#ammeterValue',
            '[data-meter="current"]'
        );

        this.voltmeterDisplay = this.findElement(
            '#voltageReading',
            '#voltmeterValue',
            '[data-meter="voltage"]'
        );

        this.powerDisplay = this.findElement(
            '#powerReading',
            '#powerValue',
            '[data-meter="power"]'
        );

        this.regionDisplay = this.findElement(
            '#operatingRegion',
            '#regionValue',
            '[data-operating-region]'
        );


        if (this.voltageSlider) {

            this.voltageSlider.min = '0';

            this.voltageSlider.max = '12';

            this.voltageSlider.step = '0.1';

            this.voltageSlider.addEventListener(
                'input',
                () => {

                    const voltage =
                        Number(this.voltageSlider.value);

                    this.updateVoltageLabel(voltage);

                    this.runSimulation(voltage);
                }
            );
        }


        // Initial voltage
        const initialVoltage =
            this.voltageSlider
                ? Number(this.voltageSlider.value)
                : 0;

        this.updateVoltageLabel(initialVoltage);

        this.runSimulation(initialVoltage);


        // Button actions
        this.bindButton(
            ['#runBtn', '#startSimulation', '[data-action="run"]'],
            () => this.runSimulation()
        );

        this.bindButton(
            ['#recordBtn', '#recordReading', '[data-action="record"]'],
            () => this.recordObservation()
        );

        this.bindButton(
            ['#resetBtn', '#resetSimulation', '[data-action="reset"]'],
            () => this.resetExperiment()
        );

        this.bindButton(
            ['#rotateBtn', '[data-action="rotate"]'],
            () => this.rotateCamera()
        );

        this.bindButton(
            ['#zoomInBtn', '[data-action="zoom-in"]'],
            () => this.zoomCamera(0.85)
        );

        this.bindButton(
            ['#zoomOutBtn', '[data-action="zoom-out"]'],
            () => this.zoomCamera(1.15)
        );

        this.bindButton(
            ['#showHolesBtn', '[data-action="show-holes"]'],
            () => this.toggleHoleMarkers()
        );

        this.bindButton(
            ['#generateGraphBtn', '[data-action="graph"]'],
            () => this.generateGraph()
        );


        // Resistance controls
        const resistanceInput = this.findElement(
            '#seriesResistance',
            '#resistanceSlider'
        );

        if (resistanceInput) {

            resistanceInput.addEventListener(
                'input',
                () => {

                    this.simulation.updateParameters({
                        seriesResistance:
                            Number(resistanceInput.value)
                    });

                    this.runSimulation();
                }
            );
        }


        const loadInput = this.findElement(
            '#loadResistance',
            '#loadSlider'
        );

        if (loadInput) {

            loadInput.addEventListener(
                'input',
                () => {

                    this.simulation.updateParameters({
                        loadResistance:
                            Number(loadInput.value)
                    });

                    this.runSimulation();
                }
            );
        }
    }


    /* =====================================
       16. BIND BUTTON
    ===================================== */

    bindButton(selectors, callback) {

        const button = this.findElement(
            ...selectors
        );

        if (!button) {
            return;
        }

        button.addEventListener(
            'click',
            event => {

                event.preventDefault();

                callback();
            }
        );
    }


    /* =====================================
       17. UPDATE VOLTAGE LABEL
    ===================================== */

    updateVoltageLabel(voltage) {

        if (!this.voltageValue) {
            return;
        }

        this.voltageValue.textContent =
            `${Number(voltage).toFixed(1)} V`;
    }


    /* =====================================
       18. RUN SIMULATION
    ===================================== */

    runSimulation(voltage) {

        if (!this.simulation) {
            return null;
        }

        let inputVoltage;

        if (voltage !== undefined) {
            inputVoltage = Number(voltage);
        }

        else if (this.voltageSlider) {
            inputVoltage =
                Number(this.voltageSlider.value);
        }

        else {
            inputVoltage =
                this.simulation.supplyVoltage;
        }

        const result =
            this.simulation.run(inputVoltage);

        this.updateMeters(result);

        this.updateComponentDisplays(result);

        this.lastResult = result;

        return result;
    }


    /* =====================================
       19. UPDATE METER READINGS
    ===================================== */

    updateMeters(result) {

        if (!result) {
            return;
        }

        const current =
            result.currentMilliampere ??
            result.loadCurrentMilliampere ??
            0;

        const voltage =
            result.diodeVoltage ??
            result.outputVoltage ??
            0;

        const power =
            result.powerMilliwatt ??
            result.zenerPowerMilliwatt ??
            0;

        if (this.ammeterDisplay) {

            this.ammeterDisplay.textContent =
                `${current.toFixed(3)} mA`;
        }

        if (this.voltmeterDisplay) {

            this.voltmeterDisplay.textContent =
                `${voltage.toFixed(3)} V`;
        }

        if (this.powerDisplay) {

            this.powerDisplay.textContent =
                `${power.toFixed(3)} mW`;
        }

        if (this.regionDisplay) {

            this.regionDisplay.textContent =
                result.region;
        }
    }


    /* =====================================
       20. UPDATE 3D METER DISPLAYS
    ===================================== */

    updateComponentDisplays(result) {

        if (!result) {
            return;
        }

        const current =
            result.currentMilliampere ??
            result.loadCurrentMilliampere ??
            0;

        const voltage =
            result.diodeVoltage ??
            result.outputVoltage ??
            0;

        this.update3DLabel(
            this.components.ammeter,
            `${current.toFixed(2)} mA`
        );

        this.update3DLabel(
            this.components.voltmeter,
            `${voltage.toFixed(2)} V`
        );
    }


    update3DLabel(component, value) {

        if (!component) {
            return;
        }

        const label = component.children.find(
            child =>
                child.isMesh &&
                child.material &&
                child.material.map
        );

        if (!label) {
            return;
        }

        const canvas =
            document.createElement('canvas');

        canvas.width = 512;

        canvas.height = 128;

        const ctx = canvas.getContext('2d');

        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        ctx.fillStyle = '#7dffdc';

        ctx.font = 'bold 48px Arial';

        ctx.textAlign = 'center';

        ctx.textBaseline = 'middle';

        ctx.fillText(
            value,
            256,
            64
        );

        const texture =
            new THREE.CanvasTexture(canvas);

        label.material.map = texture;

        label.material.needsUpdate = true;
    }


    /* =====================================
       21. RECORD OBSERVATION
    ===================================== */

    recordObservation() {

        if (!this.lastResult) {
            this.runSimulation();
        }

        const observation =
            this.simulation.recordObservation();

        if (!observation) {
            return;
        }

        this.observations.push(observation);

        this.updateObservationTable();

        this.showMessage(
            'Observation recorded successfully.'
        );
    }


    /* =====================================
       22. UPDATE OBSERVATION TABLE
    ===================================== */

    updateObservationTable() {

        const tableBody = this.findElement(
            '#observationBody',
            '#observationTable tbody',
            '#observationTableBody',
            '[data-observations]'
        );

        if (!tableBody) {
            return;
        }

        tableBody.innerHTML = '';

        this.observations.forEach(
            (item, index) => {

                const voltage =
                    item.diodeVoltage ??
                    item.outputVoltage ??
                    0;

                const current =
                    item.currentMilliampere ??
                    item.loadCurrentMilliampere ??
                    0;

                const row =
                    document.createElement('tr');

                const values = [
                    index + 1,
                    voltage.toFixed(3),
                    current.toFixed(3),
                    item.region
                ];

                values.forEach(value => {

                    const cell =
                        document.createElement('td');

                    cell.textContent = value;

                    row.appendChild(cell);
                });

                tableBody.appendChild(row);
            }
        );
    }


    /* =====================================
       23. GENERATE GRAPH
    ===================================== */

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
        }

        else {

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

        this.showMessage(
            'Graph generated successfully.'
        );
    }


    /* =====================================
       24. RESET EXPERIMENT
    ===================================== */

    resetExperiment() {

        this.observations = [];

        this.simulation.reset();

        if (this.voltageSlider) {
            this.voltageSlider.value = 0;
        }

        this.updateVoltageLabel(0);

        this.runSimulation(0);

        if (this.graph) {
            this.graph.clear();
        }

        this.updateObservationTable();

        this.showMessage(
            'Experiment has been reset.'
        );
    }


    /* =====================================
       25. CHANGE EXPERIMENT HEADING
    ===================================== */

    updateExperimentHeading() {

        const heading =
            document.getElementById('experimentTitle');

        if (!heading) {
            return;
        }

        const titles = {

            forward:
                'Forward Bias Characteristics',

            reverse:
                'Reverse Bias Characteristics',

            'load-regulation':
                'Zener Diode Load Regulation'
        };

        heading.textContent =
            titles[this.mode] ||
            titles.forward;
    }


    /* =====================================
       26. CAMERA ROTATION
    ===================================== */

    rotateCamera() {

        if (!this.controls) {
            return;
        }

        const current =
            this.camera.position.clone();

        const angle = Math.PI / 4;

        const x =
            current.x * Math.cos(angle) -
            current.z * Math.sin(angle);

        const z =
            current.x * Math.sin(angle) +
            current.z * Math.cos(angle);

        this.camera.position.set(
            x,
            current.y,
            z
        );

        this.controls.update();
    }


    /* =====================================
       27. CAMERA ZOOM
    ===================================== */

    zoomCamera(factor) {

        if (!this.camera) {
            return;
        }

        const direction =
            this.camera.position.clone()
                .sub(this.controls.target);

        direction.multiplyScalar(factor);

        this.camera.position.copy(
            this.controls.target.clone().add(direction)
        );

        this.controls.update();
    }


    /* =====================================
       28. TOGGLE BREADBOARD HOLES
    ===================================== */

    toggleHoleMarkers() {

        if (!this.holeMarkers) {
            return;
        }

        this.holeMarkers.visible =
            !this.holeMarkers.visible;
    }


    /* =====================================
       29. SETUP 3D INTERACTIONS
    ===================================== */

    setupInteractions() {

        this.renderer.domElement.addEventListener(
            'pointerdown',
            event => {

                const rect =
                    this.renderer.domElement.getBoundingClientRect();

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

                const objects = [
                    ...Object.values(this.components)
                ];

                const intersections =
                    this.raycaster.intersectObjects(
                        objects,
                        true
                    );

                if (!intersections.length) {
                    this.selectedObject = null;
                    return;
                }

                let selected =
                    intersections[0].object;

                while (
                    selected.parent &&
                    !selected.userData.type
                ) {
                    selected = selected.parent;
                }

                this.selectedObject = selected;

                this.showComponentInformation(
                    selected
                );
            }
        );
    }


    /* =====================================
       30. COMPONENT INFORMATION
    ===================================== */

    showComponentInformation(object) {

        const info =
            document.getElementById('componentInfo');

        if (!info) {
            return;
        }

        const data = object.userData || {};

        const name =
            data.name ||
            data.type ||
            'Electronic Component';

        const description =
            data.description ||
            'Laboratory component';

        info.innerHTML = '';

        const title =
            document.createElement('strong');

        title.textContent = name;

        const text =
            document.createElement('p');

        text.textContent = description;

        info.append(
            title,
            text
        );

        info.classList.add('active');
    }


    /* =====================================
       31. CAMERA CONTROLS
    ===================================== */

    createCameraControls() {

        this.controls = new OrbitControls(
            this.camera,
            this.renderer.domElement
        );

        this.controls.enableDamping = true;

        this.controls.dampingFactor = 0.06;

        this.controls.enablePan = true;

        this.controls.enableZoom = true;

        this.controls.minDistance = 5;

        this.controls.maxDistance = 30;

        this.controls.maxPolarAngle =
            Math.PI * 0.48;

        this.controls.target.set(
            0,
            0,
            0
        );

        this.controls.update();
    }


    /* =====================================
       32. SETUP CAMERA CONTROLS
    ===================================== */

    setupCameraControls() {

        if (this.controls) {
            return;
        }

        this.createCameraControls();
    }


    /* =====================================
       33. RESIZE HANDLER
    ===================================== */

    setupResize() {

        this.setupCameraControls();

        const resize = () => {

            const width =
                this.container.clientWidth;

            const height =
                this.container.clientHeight;

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

            this.renderer.setPixelRatio(
                Math.min(
                    window.devicePixelRatio || 1,
                    2
                )
            );
        };

        window.addEventListener(
            'resize',
            resize
        );

        if (window.ResizeObserver) {

            this.resizeObserver =
                new ResizeObserver(resize);

            this.resizeObserver.observe(
                this.container
            );
        }

        resize();
    }


    /* =====================================
       34. ANIMATION LOOP
    ===================================== */

    animate() {

        this.animationFrame =
            requestAnimationFrame(
                () => this.animate()
            );

        const delta =
            this.clock.getDelta();

        if (this.controls) {
            this.controls.update();
        }

        // Subtle component animation
        if (this.components.potentiometer) {

            this.components.potentiometer.rotation.y +=
                delta * 0.08;
        }

        this.renderer.render(
            this.scene,
            this.camera
        );
    }


    /* =====================================
       35. LOADING SCREEN
    ===================================== */

    hideLoadingScreen() {

        const loader =
            document.getElementById('loadingScreen') ||
            document.getElementById('loader');

        if (!loader) {
            return;
        }

        loader.classList.add('hidden');

        setTimeout(() => {

            loader.style.display = 'none';

        }, 500);
    }


    /* =====================================
       36. MESSAGE
    ===================================== */

    showMessage(message) {

        const existing =
            document.getElementById('labToast');

        if (existing) {
            existing.remove();
        }

        const toast =
            document.createElement('div');

        toast.id = 'labToast';

        toast.textContent = message;

        toast.style.cssText = `
            position: fixed;
            right: 20px;
            bottom: 20px;
            z-index: 9999;
            padding: 13px 18px;
            border-radius: 9px;
            background: #123b42;
            color: #ffffff;
            border: 1px solid #22d3ee;
            font-size: 13px;
            box-shadow: 0 8px 25px rgba(0,0,0,.3);
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 2500);
    }


    /* =====================================
       37. CLEANUP
    ===================================== */

    destroy() {

        if (this.animationFrame) {

            cancelAnimationFrame(
                this.animationFrame
            );
        }

        if (this.resizeObserver) {

            this.resizeObserver.disconnect();
        }

        if (this.controls) {
            this.controls.dispose();
        }

        if (this.graph) {
            this.graph.destroy();
        }

        if (this.viva) {
            this.viva.destroy();
        }

        if (this.renderer) {

            this.renderer.dispose();

            this.renderer.domElement.remove();
        }

        window.removeEventListener(
            'resize',
            this.resizeHandler
        );
    }
}


/* =========================================
   38. START LABORATORY
========================================= */

let laboratory = null;

function startLaboratory() {

    if (laboratory) {
        return;
    }

    try {

        laboratory =
            new ZenerLaboratory();

        window.zenerLab = laboratory;

    }

    catch (error) {

        console.error(
            'Laboratory initialization failed:',
            error
        );

        const loader =
            document.getElementById('loadingScreen');

        if (loader) {

            loader.textContent =
                'Unable to load the 3D laboratory. Please refresh the page.';
        }
    }
}


if (document.readyState === 'loading') {

    document.addEventListener(
        'DOMContentLoaded',
        startLaboratory,
        { once: true }
    );

}

else {

    startLaboratory();
}
