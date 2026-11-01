
/* =========================================
   ZENER-LAB-360
   FILE: components.js
   3D Electronic Components
========================================= */

import * as THREE from
    'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';


/* ---------- Shared Materials ---------- */

const materials = {
    board: new THREE.MeshStandardMaterial({
        color: 0x087d65,
        roughness: 0.72
    }),

    boardEdge: new THREE.MeshStandardMaterial({
        color: 0x075443,
        roughness: 0.8
    }),

    metal: new THREE.MeshStandardMaterial({
        color: 0xb8c5d1,
        metalness: 0.85,
        roughness: 0.25
    }),

    metalDark: new THREE.MeshStandardMaterial({
        color: 0x596575,
        metalness: 0.7,
        roughness: 0.35
    }),

    diode: new THREE.MeshStandardMaterial({
        color: 0x171b22,
        roughness: 0.4
    }),

    diodeBand: new THREE.MeshStandardMaterial({
        color: 0xd6dce2,
        roughness: 0.3
    }),

    resistor: new THREE.MeshStandardMaterial({
        color: 0xd5b078,
        roughness: 0.65
    }),

    red: new THREE.MeshStandardMaterial({
        color: 0xe64b4b,
        roughness: 0.5
    }),

    black: new THREE.MeshStandardMaterial({
        color: 0x20242b,
        roughness: 0.5
    }),

    blue: new THREE.MeshStandardMaterial({
        color: 0x267bd4,
        roughness: 0.5
    }),

    yellow: new THREE.MeshStandardMaterial({
        color: 0xf2c94c,
        roughness: 0.5
    }),

    white: new THREE.MeshStandardMaterial({
        color: 0xf1f4f7,
        roughness: 0.4
    }),

    screen: new THREE.MeshStandardMaterial({
        color: 0x102c2c,
        emissive: 0x073c35,
        emissiveIntensity: 0.5
    }),

    knob: new THREE.MeshStandardMaterial({
        color: 0x252b36,
        roughness: 0.4
    })
};


/* ---------- Helper Functions ---------- */

function createBox(
    width,
    height,
    depth,
    material,
    x = 0,
    y = 0,
    z = 0
) {
    const geometry = new THREE.BoxGeometry(
        width,
        height,
        depth
    );

    const mesh = new THREE.Mesh(
        geometry,
        material
    );

    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
}


function createCylinder(
    radiusTop,
    radiusBottom,
    height,
    material,
    x = 0,
    y = 0,
    z = 0,
    segments = 24
) {
    const geometry = new THREE.CylinderGeometry(
        radiusTop,
        radiusBottom,
        height,
        segments
    );

    const mesh = new THREE.Mesh(
        geometry,
        material
    );

    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
}


function createLabel(text, color = '#ffffff') {
    const canvas = document.createElement('canvas');

    canvas.width = 512;
    canvas.height = 128;

    const context = canvas.getContext('2d');

    context.clearRect(0, 0, 512, 128);

    context.fillStyle = color;
    context.font = 'bold 48px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    context.fillText(text, 256, 64);

    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
    });

    const geometry = new THREE.PlaneGeometry(1.8, 0.45);

    return new THREE.Mesh(geometry, material);
}


/* =========================================
   1. BREADBOARD
========================================= */

export function createBreadboard() {
    const group = new THREE.Group();

    // Main breadboard body
    const base = createBox(
        12,
        0.45,
        7,
        materials.board
    );

    group.add(base);

    // Top surface
    const surface = createBox(
        11.85,
        0.025,
        6.85,
        new THREE.MeshStandardMaterial({
            color: 0x159476,
            roughness: 0.8
        }),
        0,
        0.24,
        0
    );

    group.add(surface);

    // Center separation channel
    const channel = createBox(
        11.5,
        0.035,
        0.45,
        materials.boardEdge,
        0,
        0.265,
        0
    );

    group.add(channel);

    // Power rails
    const railPositions = [
        -2.9,
        -2.5,
        2.5,
        2.9
    ];

    railPositions.forEach((z, index) => {
        const line = createBox(
            11.5,
            0.018,
            0.025,
            index % 2 === 0
                ? materials.red
                : materials.blue,
            0,
            0.27,
            z
        );

        group.add(line);
    });

    // Breadboard holes
    const holeMaterial = new THREE.MeshStandardMaterial({
        color: 0x063c32,
        roughness: 0.9
    });

    const holeGeometry = new THREE.CylinderGeometry(
        0.035,
        0.035,
        0.015,
        12
    );

    const rows = 30;
    const columns = 10;
    const spacingX = 0.36;
    const spacingZ = 0.34;

    for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {

            const z = (column - 4.5) * spacingZ;

            // Leave central channel empty
            if (Math.abs(z) < 0.35) {
                continue;
            }

            const hole = new THREE.Mesh(
                holeGeometry,
                holeMaterial
            );

            hole.position.set(
                (row - 14.5) * spacingX,
                0.285,
                z
            );

            group.add(hole);
        }
    }

    // Board label
    const label = createLabel(
        'BREADBOARD',
        '#e9fff8'
    );

    label.position.set(0, 0.31, -3.15);
    group.add(label);

    group.userData = {
        type: 'breadboard',
        name: 'Solderless Breadboard',
        description:
            'Breadboard used for temporary circuit connections.',
        dimensions: {
            width: 12,
            depth: 7
        }
    };

    return group;
}


/* =========================================
   2. ZENER DIODE
========================================= */

export function createZenerDiode() {
    const group = new THREE.Group();

    // Diode body
    const body = createCylinder(
        0.17,
        0.17,
        0.85,
        materials.diode,
        0,
        0.48,
        0
    );

    body.rotation.z = Math.PI / 2;

    group.add(body);

    // Cathode band
    const band = createCylinder(
        0.175,
        0.175,
        0.13,
        materials.diodeBand,
        0.29,
        0.48,
        0
    );

    band.rotation.z = Math.PI / 2;
    group.add(band);

    // Anode lead
    const anode = createCylinder(
        0.025,
        0.025,
        0.8,
        materials.metal,
        -0.82,
        0.48,
        0
    );

    anode.rotation.z = Math.PI / 2;
    group.add(anode);

    // Cathode lead
    const cathode = createCylinder(
        0.025,
        0.025,
        0.8,
        materials.metal,
        0.82,
        0.48,
        0
    );

    cathode.rotation.z = Math.PI / 2;
    group.add(cathode);

    group.userData = {
        type: 'zener-diode',
        name: 'Zener Diode',
        terminals: {
            anode: 'Left terminal',
            cathode: 'Terminal marked by band'
        },
        description:
            'A semiconductor diode designed to operate in reverse breakdown under suitable current limiting.'
    };

    return group;
}


/* =========================================
   3. RESISTOR
========================================= */

export function createResistor() {
    const group = new THREE.Group();

    const body = createCylinder(
        0.13,
        0.13,
        0.9,
        materials.resistor,
        0,
        0.4,
        0
    );

    body.rotation.z = Math.PI / 2;
    group.add(body);

    // Resistor colour bands
    const bandColors = [
        0x8b4513,
        0x171717,
        0xe0b52c
    ];

    bandColors.forEach((color, index) => {
        const bandMaterial = new THREE.MeshStandardMaterial({
            color
        });

        const band = createCylinder(
            0.135,
            0.135,
            0.07,
            bandMaterial,
            -0.2 + index * 0.2,
            0.4,
            0
        );

        band.rotation.z = Math.PI / 2;
        group.add(band);
    });

    // Leads
    [-0.85, 0.85].forEach(x => {
        const lead = createCylinder(
            0.018,
            0.018,
            0.65,
            materials.metal,
            x,
            0.4,
            0
        );

        lead.rotation.z = Math.PI / 2;
        group.add(lead);
    });

    group.userData = {
        type: 'resistor',
        name: 'Current Limiting Resistor',
        resistance: 1000,
        unit: 'Ohm',
        description:
            'Limits current through the Zener diode circuit.'
    };

    return group;
}


/* =========================================
   4. POTENTIOMETER
========================================= */

export function createPotentiometer() {
    const group = new THREE.Group();

    // Main body
    const body = createCylinder(
        0.62,
        0.62,
        0.32,
        materials.blue,
        0,
        0.35,
        0
    );

    group.add(body);

    // Upper surface
    const top = createCylinder(
        0.52,
        0.52,
        0.06,
        materials.knob,
        0,
        0.54,
        0
    );

    group.add(top);

    // Rotating knob
    const knob = createCylinder(
        0.28,
        0.28,
        0.3,
        materials.yellow,
        0,
        0.72,
        0
    );

    group.add(knob);

    // Pointer
    const pointer = createBox(
        0.06,
        0.025,
        0.25,
        materials.white,
        0,
        0.89,
        -0.05
    );

    group.add(pointer);

    // Three terminals
    [-0.4, 0, 0.4].forEach(x => {
        const pin = createCylinder(
            0.035,
            0.035,
            0.55,
            materials.metal,
            x,
            0.05,
            0.35
        );

        group.add(pin);
    });

    group.userData = {
        type: 'potentiometer',
        name: 'Variable Resistor',
        resistance: 10000,
        terminals: 3,
        description:
            'Adjustable resistance used to control the circuit condition.'
    };

    return group;
}


/* =========================================
   5. DC POWER SUPPLY
========================================= */

export function createDCPowerSupply() {
    const group = new THREE.Group();

    const casing = createBox(
        3,
        1.8,
        2,
        materials.knob,
        0,
        0.9,
        0
    );

    group.add(casing);

    // Display
    const display = createBox(
        1.65,
        0.65,
        0.04,
        materials.screen,
        0,
        1.2,
        1.02
    );

    group.add(display);

    // Voltage display label
    const displayLabel = createLabel(
        'DC SUPPLY',
        '#7dffdc'
    );

    displayLabel.scale.set(0.65, 0.65, 0.65);
    displayLabel.position.set(0, 1.22, 1.05);

    group.add(displayLabel);

    // Adjustment knob
    const knob = createCylinder(
        0.3,
        0.3,
        0.18,
        materials.metal,
        0,
        0.8,
        1.05
    );

    knob.rotation.x = Math.PI / 2;
    group.add(knob);

    // Output terminals
    const terminalColors = [
        materials.red,
        materials.black
    ];

    [-0.6, 0.6].forEach((x, index) => {
        const terminal = createCylinder(
            0.12,
            0.12,
            0.2,
            terminalColors[index],
            x,
            0.45,
            1.05
        );

        terminal.rotation.x = Math.PI / 2;
        group.add(terminal);
    });

    group.userData = {
        type: 'dc-supply',
        name: 'Variable DC Power Supply',
        output: '0–12 V educational model',
        description:
            'Provides adjustable low-voltage DC for the experiment.'
    };

    return group;
}


/* =========================================
   6. DIGITAL AMMETER
========================================= */

export function createAmmeter() {
    const group = new THREE.Group();

    const casing = createBox(
        2,
        1.35,
        0.45,
        materials.knob,
        0,
        0.68,
        0
    );

    group.add(casing);

    const screen = createBox(
        1.45,
        0.58,
        0.035,
        materials.screen,
        0,
        0.82,
        0.24
    );

    group.add(screen);

    const label = createLabel(
        '0.00 mA',
        '#7dff9c'
    );

    label.scale.set(0.65, 0.65, 0.65);
    label.position.set(0, 0.85, 0.27);

    group.add(label);

    // Terminals
    [-0.55, 0.55].forEach((x, index) => {
        const terminal = createCylinder(
            0.09,
            0.09,
            0.15,
            index === 0 ? materials.red : materials.black,
            x,
            0.15,
            0.28
        );

        terminal.rotation.x = Math.PI / 2;
        group.add(terminal);
    });

    group.userData = {
        type: 'ammeter',
        name: 'Digital Ammeter',
        unit: 'mA',
        description:
            'Measures the current flowing through the circuit.'
    };

    return group;
}


/* =========================================
   7. DIGITAL VOLTMETER
========================================= */

export function createVoltmeter() {
    const group = new THREE.Group();

    const casing = createBox(
        2,
        1.35,
        0.45,
        materials.knob,
        0,
        0.68,
        0
    );

    group.add(casing);

    const screen = createBox(
        1.45,
        0.58,
        0.035,
        materials.screen,
        0,
        0.82,
        0.24
    );

    group.add(screen);

    const label = createLabel(
        '0.00 V',
        '#70dfff'
    );

    label.scale.set(0.65, 0.65, 0.65);
    label.position.set(0, 0.85, 0.27);

    group.add(label);

    // Terminals
    [-0.55, 0.55].forEach((x, index) => {
        const terminal = createCylinder(
            0.09,
            0.09,
            0.15,
            index === 0 ? materials.red : materials.black,
            x,
            0.15,
            0.28
        );

        terminal.rotation.x = Math.PI / 2;
        group.add(terminal);
    });

    group.userData = {
        type: 'voltmeter',
        name: 'Digital Voltmeter',
        unit: 'V',
        description:
            'Measures the potential difference across a circuit element.'
    };

    return group;
}


/* =========================================
   8. COMPONENT FACTORY
========================================= */

export function createComponent(type) {
    const componentMap = {
        breadboard: createBreadboard,
        zener: createZenerDiode,
        resistor: createResistor,
        potentiometer: createPotentiometer,
        dcSupply: createDCPowerSupply,
        ammeter: createAmmeter,
        voltmeter: createVoltmeter
    };

    const factory = componentMap[type];

    if (!factory) {
        console.warn(
            `Unknown component type: ${type}`
        );

        return null;
    }

    return factory();
}


/* =========================================
   9. COMPONENT INFORMATION
========================================= */

export const componentInformation = {
    breadboard: {
        title: 'Breadboard',
        purpose: 'Temporary circuit assembly without soldering.'
    },

    zener: {
        title: 'Zener Diode',
        purpose: 'Used to study forward and reverse characteristics.'
    },

    resistor: {
        title: 'Series Resistor',
        purpose: 'Limits current and protects the diode.'
    },

    potentiometer: {
        title: 'Potentiometer',
        purpose: 'Adjusts resistance in the experimental circuit.'
    },

    dcSupply: {
        title: 'DC Power Supply',
        purpose: 'Provides a controlled low-voltage DC input.'
    },

    ammeter: {
        title: 'Ammeter',
        purpose: 'Measures circuit current and is connected in series.'
    },

    voltmeter: {
        title: 'Voltmeter',
        purpose: 'Measures voltage and is connected in parallel.'
    }
};

