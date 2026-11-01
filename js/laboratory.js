
/* =====================================================
   ZENER-LAB-360
   FILE: js/laboratory.js

   Updated Main Laboratory Controller
   Supports:
   1. Forward Bias
   2. Reverse Bias
   3. Load Regulation
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


/* =====================================================
   1. MAIN CLASS
===================================================== */

class ZenerLaboratory {

    constructor() {

        this.container =
            document.getElementById('three-container');

        if (!this.container) {
            console.error('3D viewport not found.');
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

        this.lastResult = null;

        this.mode = this.detectExperimentMode();

        this.holeMarkers = null;

        this.animationFrame = null;

        this.resizeObserver = null;

        this.raycaster = new THREE.Raycaster();

        this.pointer = new THREE.Vector2();

        this.clock = new THREE.Clock();

        this.initialize();
    }


    /* =================================================
       2. EXPERIMENT MODE
    ================================================= */

    detectExperimentMode() {

        const path =
            window.location.pathname.toLowerCase();

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


    getExperimentTitle() {

        const titles = {
            forward: 'Forward Bias Characteristics',
            reverse: 'Reverse Bias Characteristics',
            'load-regulation': 'Zener Diode Load Regulation'
        };

        return titles[this.mode] || titles.forward;
    }


    /* =================================================
       3. INITIALIZATION
    ================================================= */

    initialize() {

        try {

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

            this.setupCameraControls();

            this.setupControls();

            this.setupInteractions();

            this.setupResize();

            this.updateExperimentHeading();

            this.runSimulation(0);

            this.generateGraph();

            this.hideLoadingScreen();

            this.animate();

            console.log(
                'ZENER-LAB-360 ready:',
                this.mode
            );

        } catch (error) {

            console.error(
                'Laboratory initialization error:',
                error
            );

            this.showLoadingError();
        }
    }


    /* =================================================
       4. THREE.JS SCENE
    ================================================= */

    createScene() {

        this.scene = new THREE.Scene();

        this.scene.background =
            new THREE.Color(0x101a2a);

        this.scene.fog = new THREE.Fog(
            0x101a2a,
            25,
            60
        );
    }


    /* =================================================
       5. CAMERA
    ================================================= */

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

        this.camera.lookAt(0, 0, 0);
    }


    /* =================================================
       6. RENDERER
    ================================================= */

    createRenderer() {

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false
        });

        this.renderer.setPixelRatio(
            Math.min(window.devicePixelRatio || 1, 2)
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

        this.renderer.domElement.style.width = '100%';

        this.renderer.domElement.style.height = '100%';

        this.renderer.domElement.style.display = 'block';
    }


    /* =================================================
       7. LIGHTING
    ================================================= */

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

        mainLight.position.set(8, 15, 10);

        mainLight.castShadow = true;

        mainLight.shadow.mapSize.set(2048, 2048);

        this.scene.add(mainLight);


        const fillLight = new THREE.PointLight(
            0x27d9cf,
            35,
            30
        );

        fillLight.position.set(-8, 6, -5);

        this.scene.add(fillLight);


        const backLight = new THREE.DirectionalLight(
            0x568bff,
            1.1
        );

        backLight.position.set(-5, 8, 8);

        this.scene.add(backLight);
    }


    /* =================================================
       8. LAB TABLE
    ================================================= */

    createEnvironment() {

        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(60, 60),
            new THREE.MeshStandardMaterial({
                color: 0x172438,
                roughness: 0.85
            })
        );

        floor.rotation.x = -Math.PI / 2;

        floor.position.y = -0.65;

        floor.receiveShadow = true;

        this.scene.add(floor);


        const table = new THREE.Mesh(
            new THREE.BoxGeometry(17, 0.45, 12),
            new THREE.MeshStandardMaterial({
                color: 0x28384b,
                roughness: 0.55
            })
        );

        table.position.set(0, -0.35, 0);

        table.receiveShadow = true;

        table.castShadow = true;

        this.scene.add(table);


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


    /* =================================================
       9. COMPONENTS
    ================================================= */

    createLaboratoryComponents() {

        const breadboard = createBreadboard();

        breadboard.position.set(0, 0, 0);

        this.scene.add(breadboard);

        this.components.breadboard = breadboard;


        const diode = createComponent('zener');

        diode.position.set(-1.1, 0.35, 0);

        this.scene.add(diode);

        this.components.zener = diode;


        const resistor = createComponent('resistor');

        resistor.position.set(1.1, 0.35, 0);

        this.scene.add(resistor);

        this.components.resistor = resistor;


        const potentiometer =
            createComponent('potentiometer');

        potentiometer.position.set(3, 0.35, 1.5);

        this.scene.add(potentiometer);

        this.components.potentiometer =
            potentiometer;


        const supply = createComponent('dcSupply');

        supply.position.set(-7, 0, -1);

        this.scene.add(supply);

        this.components.dcSupply = supply;


        const ammeter = createComponent('ammeter');

        ammeter.position.set(-5.5, 0, 3);

        this.scene.add(ammeter);

        this.components.ammeter = ammeter;


        const voltmeter = createComponent('voltmeter');

        voltmeter.position.set(5.5, 0, 3);

        this.scene.add(voltmeter);

        this.components.voltmeter = voltmeter;


        try {

            this.holeMarkers = createHoleMarkers(
                this.scene,
                { visible: false }
            );

        } catch (error) {

            console.warn(
                'Breadboard markers unavailable:',
                error
            );
        }
    }


    /* =================================================
       10. CIRCUIT BUILDER
    ================================================= */

    createCircuitBuilder() {

        this.circuitBuilder =
            new CircuitBuilder(this.scene);
    }


    /* =================================================
       11. SIMULATION ENGINE
    ================================================= */

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


    /* =================================================
       12. GRAPH
    ================================================= */

    createGraph() {

        const canvas =
            document.getElementById('viGraph');

        if (!canvas) {
            console.warn('Graph canvas not found.');
            return;
        }

        this.graph = new ExperimentGraph(canvas);

        this.graph.setGraphType(
            this.mode === 'load-regulation'
                ? 'load'
                : 'vi'
        );
    }


    /* =================================================
       13. VIVA MODULE
    ================================================= */

    createViva() {

        const container =
            document.getElementById('vivaContainer');

        if (!container) {
            return;
        }

        this.viva = new VivaModule(container);
    }


    /* =================================================
       14. DOM SELECTOR HELPER
    ================================================= */

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


    /* =================================================
       15. SETUP CONTROLS
    ================================================= */

    setupControls() {

        this.voltageSlider = this.findElement(
            '#voltageSlider',
            '#supplyVoltage',
            '#voltageRange'
        );

        this.voltageValue = this.findElement(
            '#voltageValue',
            '#voltageDisplay',
            '[data-voltage-value]'
        );

        this.currentDisplay = this.findElement(
            '#currentReading',
            '#ammeterValue',
            '[data-meter="current"]'
        );

        this.voltageDisplay = this.findElement(
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

        this.seriesResistance = this.findElement(
            '#seriesResistance',
            '#resistanceSlider'
        );

        this.loadResistance = this.findElement(
            '#loadResistance',
            '#loadSlider'
        );

        this.resistanceDisplay = this.findElement(
            '#resistanceDisplay'
        );

        this.loadResistanceDisplay = this.findElement(
            '#loadResistanceDisplay'
        );


        /* Voltage slider */

        if (this.voltageSlider) {

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


        /* Series resistance slider */

        if (this.seriesResistance) {

            this.seriesResistance.addEventListener(
                'input',
                () => {

                    const resistance =
                        Number(this.seriesResistance.value);

                    this.simulation.updateParameters({
                        seriesResistance: resistance
                    });

                    this.updateResistanceLabel(resistance);

                    this.runSimulation();
                }
            );

            this.updateResistanceLabel(
                Number(this.seriesResistance.value)
            );
        }


        /* Load resistance slider */

        if (this.loadResistance) {

            this.loadResistance.addEventListener(
                'input',
                () => {

                    const resistance =
                        Number(this.loadResistance.value);

                    this.simulation.updateParameters({
                        loadResistance: resistance
                    });

                    this.updateLoadResistanceLabel(resistance);

                    this.runSimulation();
                }
            );

            this.updateLoadResistanceLabel(
                Number(this.loadResistance.value)
            );
        }


        /* Buttons */

        this.bindButton(
            ['#runBtn', '#startSimulation'],
            () => this.runSimulation()
        );

        this.bindButton(
            ['#recordBtn', '#recordReading'],
            () => this.recordObservation()
        );

        this.bindButton(
            ['#resetBtn', '#resetSimulation'],
            () => this.resetExperiment()
        );

        this.bindButton(
            ['#rotateBtn'],
            () => this.rotateCamera()
        );

        this.bindButton(
            ['#zoomInBtn'],
            () => this.zoomCamera(0.85)
        );

        this.bindButton(
            ['#zoomOutBtn'],
            () => this.zoomCamera(1.15)
        );

        this.bindButton(
            ['#showHolesBtn'],
            () => this.toggleHoleMarkers()
        );

        this.bindButton(
            ['#generateGraphBtn'],
            () => this.generateGraph()
        );


        this.updateVoltageLabel(
            this.voltageSlider
                ? Number(this.voltageSlider.value)
                : 0
        );
    }


    /* =================================================
       16. BUTTON HELPER
    ================================================= */

    bindButton(selectors, callback) {

        const button = this.findElement(...selectors);

        if (!button) {
            return;
        }

        button.addEventListener('click', event => {

            event.preventDefault();

            callback();
        });
    }


    /* =================================================
       17. LABEL UPDATES
    ================================================= */

    updateVoltageLabel(voltage) {

        if (this.voltageValue) {

            this.voltageValue.textContent =
                `${Number(voltage).toFixed(1)} V`;
        }
    }


    updateResistanceLabel(value) {

        if (!this.resistanceDisplay) {
            return;
        }

        this.resistanceDisplay.textContent =
            `${Number(value).toLocaleString()} Ω`;
    }


    updateLoadResistanceLabel(value) {

        if (!this.loadResistanceDisplay) {
            return;
        }

        this.loadResistanceDisplay.textContent =
            `${Number(value).toLocaleString()} Ω`;
    }


    /* =================================================
       18. GET SUPPLY VOLTAGE
    ================================================= */

    getSupplyVoltage() {

        if (this.voltageSlider) {

            return Number(this.voltageSlider.value);
        }

        return 0;
    }


    /* =================================================
       19. RUN SIMULATION
    ================================================= */

    runSimulation(voltage) {

        if (!this.simulation) {
            return null;
        }

        const inputVoltage =
            voltage === undefined
                ? this.getSupplyVoltage()
                : Number(voltage);

        const result =
            this.simulation.run(inputVoltage);

        if (!result) {
            return null;
        }

        this.lastResult = result;

        this.updateMeters(result);

        this.update3DMeters(result);

        return result;
    }


    /* =================================================
       20. RESULT HELPERS
    ================================================= */

    getNumber(result, keys, fallback = 0) {

        for (const key of keys) {

            if (
                result[key] !== undefined &&
                Number.isFinite(Number(result[key]))
            ) {
                return Number(result[key]);
            }
        }

        return fallback;
    }


    /* =================================================
       21. UPDATE METERS
    ================================================= */

    updateMeters(result) {

        if (!result) {
            return;
        }

        let current;
        let voltage;
        let power;

        if (this.mode === 'load-regulation') {

            current = this.getNumber(result, [
                'loadCurrentMilliampere',
                'currentMilliampere'
            ]);

            voltage = this.getNumber(result, [
                'outputVoltage',
                'diodeVoltage'
            ]);

            power = this.getNumber(result, [
                'zenerPowerMilliwatt',
                'powerMilliwatt'
            ]);
        }

        else {

            current = this.getNumber(result, [
                'currentMilliampere'
            ]);

            voltage = this.getNumber(result, [
                'diodeVoltage'
            ]);

            power = this.getNumber(result, [
                'powerMilliwatt'
            ]);
        }


        if (this.currentDisplay) {

            this.currentDisplay.textContent =
                `${current.toFixed(3)} mA`;
        }

        if (this.voltageDisplay) {

            this.voltageDisplay.textContent =
                `${voltage.toFixed(3)} V`;
        }

        if (this.powerDisplay) {

            this.powerDisplay.textContent =
                `${power.toFixed(3)} mW`;
        }

        if (this.regionDisplay) {

            this.regionDisplay.textContent =
                result.region || 'Operating';
        }
    }


    /* =================================================
       22. UPDATE 3D METERS
    ================================================= */

    update3DMeters(result) {

        if (!result) {
            return;
        }

        const current = this.getNumber(result, [
            'currentMilliampere',
            'loadCurrentMilliampere'
        ]);

        const voltage = this.getNumber(result, [
            'diodeVoltage',
            'outputVoltage'
        ]);

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

        ctx.clearRect(0, 0, 512, 128);

        ctx.fillStyle = '#7dffdc';

        ctx.font = 'bold 48px Arial';

        ctx.textAlign = 'center';

        ctx.textBaseline = 'middle';

        ctx.fillText(value, 256, 64);

        const texture =
            new THREE.CanvasTexture(canvas);

        if (label.material.map) {
            label.material.map.dispose();
        }

        label.material.map = texture;

        label.material.needsUpdate = true;
    }


    /* =================================================
       23. RECORD OBSERVATION
    ================================================= */

    recordObservation() {

        if (!this.lastResult) {
            this.runSimulation();
        }

        const observation =
            this.simulation.recordObservation();

        if (!observation) {
            this.showMessage(
                'No reading available to record.'
            );

            return;
        }

        this.observations.push(observation);

        this.updateObservationTable();

        this.showMessage(
            'Observation recorded.'
        );
    }


    /* =================================================
       24. UPDATE OBSERVATION TABLE
    ================================================= */

    updateObservationTable() {

        const tableBody = this.findElement(
            '#observationBody',
            '#observationTable tbody',
            '#observationTableBody'
        );

        if (!tableBody) {
            return;
        }

        tableBody.replaceChildren();

        this.observations.forEach((item, index) => {

            const voltage = this.getNumber(item, [
                'outputVoltage',
                'diodeVoltage'
            ]);

            const current = this.getNumber(item, [
                'loadCurrentMilliampere',
                'currentMilliampere'
            ]);

            const region =
                item.region || 'Operating';

            const values = [
                index + 1,
                voltage.toFixed(3),
                current.toFixed(3),
                region
            ];

            const row =
                document.createElement('tr');

            values.forEach(value => {

                const cell =
                    document.createElement('td');

                cell.textContent = String(value);

                row.appendChild(cell);
            });

            tableBody.appendChild(row);
        });
    }


    /* =================================================
       25. GENERATE GRAPH
    ================================================= */

    generateGraph() {

        if (!this.graph || !this.simulation) {
            return;
        }

        try {

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

        } catch (error) {

            console.error(
                'Graph generation error:',
                error
            );

            this.showMessage(
                'Unable to generate graph.'
            );
        }
    }


    /* =================================================
       26. RESET EXPERIMENT
    ================================================= */

    resetExperiment() {

        this.observations = [];

        this.lastResult = null;

        this.simulation.reset();

        if (this.voltageSlider) {
            this.voltageSlider.value = 0;
        }

        if (this.seriesResistance) {
            this.seriesResistance.value = 1000;
        }

        if (this.loadResistance) {
            this.loadResistance.value = 1000;
        }

        this.updateVoltageLabel(0);

        this.updateResistanceLabel(1000);

        this.updateLoadResistanceLabel(1000);

        this.simulation.updateParameters({
            seriesResistance: 1000,
            loadResistance: 1000
        });

        this.runSimulation(0);

        if (this.graph) {
            this.graph.clear();
        }

        this.updateObservationTable();

        this.showMessage(
            'Experiment reset successfully.'
        );
    }


    /* =================================================
       27. UPDATE HEADING
    ================================================= */

    updateExperimentHeading() {

        const heading =
            document.getElementById('experimentTitle');

        if (heading) {
            heading.textContent =
                this.getExperimentTitle();
        }
    }


    /* =================================================
       28. CAMERA CONTROLS
    ================================================= */

    setupCameraControls() {

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

        this.controls.target.set(0, 0, 0);

        this.controls.update();
    }


    rotateCamera() {

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


    zoomCamera(factor) {

        const direction =
            this.camera.position.clone()
                .sub(this.controls.target);

        direction.multiplyScalar(factor);

        this.camera.position.copy(
            this.controls.target.clone()
                .add(direction)
        );

        this.controls.update();
    }


    toggleHoleMarkers() {

        if (!this.holeMarkers) {
            return;
        }

        this.holeMarkers.visible =
            !this.holeMarkers.visible;
    }


    /* =================================================
       29. COMPONENT SELECTION
    ================================================= */

    setupInteractions() {

        this.renderer.domElement.addEventListener(
            'pointerdown',
            event => {

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

                const objects =
                    Object.values(this.components);

                const hits =
                    this.raycaster.intersectObjects(
                        objects,
                        true
                    );

                if (!hits.length) {
                    return;
                }

                let selected = hits[0].object;

                while (
                    selected.parent &&
                    selected.parent !== this.scene &&
                    !selected.userData.type &&
                    !selected.userData.name
                ) {
                    selected = selected.parent;
                }

                this.showComponentInformation(selected);
            }
        );
    }


    /* =================================================
       30. COMPONENT INFORMATION
    ================================================= */

    showComponentInformation(object) {

        const info =
            document.getElementById('componentInfo');

        if (!info) {
            return;
        }

        const data = object.userData || {};

        const title =
            data.name ||
            data.type ||
            'Electronic Component';

        const description =
            data.description ||
            'Select and inspect this laboratory component.';

        info.replaceChildren();

        const heading =
            document.createElement('strong');

        heading.textContent = title;

        const paragraph =
            document.createElement('p');

        paragraph.textContent = description;

        info.append(heading, paragraph);

        info.classList.add('active');
    }


    /* =================================================
       31. RESIZE
    ================================================= */

    setupResize() {

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
                Math.min(window.devicePixelRatio || 1, 2)
            );
        };

        window.addEventListener('resize', resize);

        if (window.ResizeObserver) {

            this.resizeObserver =
                new ResizeObserver(resize);

            this.resizeObserver.observe(
                this.container
            );
        }

        resize();
    }


    /* =================================================
       32. ANIMATION LOOP
    ================================================= */

    animate() {

        this.animationFrame =
            requestAnimationFrame(
                () => this.animate()
            );

        this.clock.getDelta();

        if (this.controls) {
            this.controls.update();
        }

        this.renderer.render(
            this.scene,
            this.camera
        );
    }


    /* =================================================
       33. LOADING SCREEN
    ================================================= */

    hideLoadingScreen() {

        const loader =
            document.getElementById('loadingScreen');

        if (!loader) {
            return;
        }

        loader.classList.add('hidden');

        setTimeout(() => {

            loader.style.display = 'none';

        }, 500);
    }


    showLoadingError() {

        const loader =
            document.getElementById('loadingScreen');

        if (!loader) {
            return;
        }

        loader.textContent =
            'Unable to initialize the 3D laboratory. Please refresh the page.';
    }


    /* =================================================
       34. TOAST MESSAGE
    ================================================= */

    showMessage(message) {

        const previous =
            document.getElementById('labToast');

        if (previous) {
            previous.remove();
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
            color: white;
            border: 1px solid #22d3ee;
            font-size: 13px;
            box-shadow: 0 8px 25px rgba(0,0,0,.3);
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 2500);
    }


    /* =================================================
       35. CLEANUP
    ================================================= */

    destroy() {

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }

        if (this.controls) {
            this.controls.dispose();
        }

        if (this.graph && this.graph.destroy) {
            this.graph.destroy();
        }

        if (this.renderer) {

            this.renderer.dispose();

            this.renderer.domElement.remove();
        }

        this.scene.traverse(object => {

            if (object.geometry) {
                object.geometry.dispose();
            }

            if (object.material) {

                const materials = Array.isArray(object.material)
                    ? object.material
                    : [object.material];

                materials.forEach(material => {

                    if (material.map) {
                        material.map.dispose();
                    }

                    material.dispose();
                });
            }
        });
    }
}


/* =====================================================
   36. START APPLICATION
===================================================== */

let laboratory = null;

function startLaboratory() {

    if (laboratory) {
        return;
    }

    try {

        laboratory = new ZenerLaboratory();

        window.zenerLab = laboratory;

    } catch (error) {

        console.error(
            'ZENER-LAB-360 startup error:',
            error
        );

        const loader =
            document.getElementById('loadingScreen');

        if (loader) {

            loader.textContent =
                'Laboratory initialization failed. Check the browser console.';
        }
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
