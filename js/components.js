import * as THREE from 'three';

/* =========================================
   ZENER-LAB-360 : COMPONENTS
   ========================================= */

const MATERIALS = {
    board: new THREE.MeshStandardMaterial({
        color: 0x172b3b,
        roughness: 0.65
    }),
    white: new THREE.MeshStandardMaterial({
        color: 0xe8edf2,
        roughness: 0.45
    }),
    metal: new THREE.MeshStandardMaterial({
        color: 0xb8c4ce,
        metalness: 0.75,
        roughness: 0.25
    }),
    red: new THREE.MeshStandardMaterial({ color: 0xef4444 }),
    black: new THREE.MeshStandardMaterial({ color: 0x202938 }),
    blue: new THREE.MeshStandardMaterial({ color: 0x2563eb }),
    yellow: new THREE.MeshStandardMaterial({ color: 0xfacc15 }),
    green: new THREE.MeshStandardMaterial({ color: 0x22c55e }),
    screen: new THREE.MeshStandardMaterial({
        color: 0x071827,
        emissive: 0x06283c,
        emissiveIntensity: 0.7
    })
};

function box(parent, width, height, depth, material, position) {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        material
    );

    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);

    return mesh;
}

function cylinder(parent, radiusTop, radiusBottom, height, material, position, segments = 24) {
    const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(
            radiusTop,
            radiusBottom,
            height,
            segments
        ),
        material
    );

    mesh.position.set(...position);
    mesh.castShadow = true;
    parent.add(mesh);

    return mesh;
}

function createTerminal(parent, id, label, position, color = 0xfacc15) {
    const terminal = new THREE.Group();
    terminal.position.set(...position);

    const pin = new THREE.Mesh(
        new THREE.SphereGeometry(0.075, 16, 12),
        new THREE.MeshStandardMaterial({
            color,
            emissive: color,
            emissiveIntensity: 0.12,
            metalness: 0.35
        })
    );

    pin.userData.isTerminal = true;
    pin.userData.terminalId = id;
    pin.userData.terminalLabel = label;

    terminal.add(pin);

    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.105, 0.012, 8, 20),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
    );

    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.015;
    terminal.add(ring);

    terminal.userData.isTerminal = true;
    terminal.userData.terminalId = id;
    terminal.userData.terminalLabel = label;

    parent.add(terminal);

    return {
        id,
        label,
        object: terminal,
        pin,
        getPosition() {
            const world = new THREE.Vector3();
            terminal.getWorldPosition(world);
            return world;
        }
    };
}

function createBreadboard() {
    const group = new THREE.Group();
    group.name = 'Breadboard';

    box(group, 5.2, 0.22, 8.2, MATERIALS.white, [0, 0, 0]);

    // Central channel
    box(
        group,
        4.8,
        0.012,
        0.24,
        new THREE.MeshStandardMaterial({ color: 0x9ca3af }),
        [0, 0.117, 0]
    );

    // Power rail lines
    const railMaterial = new THREE.MeshStandardMaterial({
        color: 0xef4444
    });

    const negativeMaterial = new THREE.MeshStandardMaterial({
        color: 0x2563eb
    });

    for (let x of [-2.15, 2.15]) {
        box(group, 0.018, 0.008, 7.7, railMaterial, [x, 0.116, 0]);
        box(group, 0.018, 0.008, 7.7, negativeMaterial, [x + 0.12, 0.116, 0]);
    }

    // Visual terminal holes
    const holeMaterial = new THREE.MeshStandardMaterial({
        color: 0x34495e,
        metalness: 0.3
    });

    for (let row = 0; row < 30; row++) {
        const z = -3.55 + row * 0.245;

        for (const side of [-1, 1]) {
            for (let col = 0; col < 5; col++) {
                const x = side * (0.38 + col * 0.19);

                const hole = cylinder(
                    group,
                    0.035,
                    0.035,
                    0.012,
                    holeMaterial,
                    [x, 0.12, z],
                    12
                );

                hole.rotation.x = Math.PI / 2;
            }
        }
    }

    group.userData.componentType = 'breadboard';
    return group;
}

/* =========================================
   RESISTOR
   ========================================= */

function createResistor() {
    const group = new THREE.Group();

    cylinder(
        group,
        0.105,
        0.105,
        0.62,
        new THREE.MeshStandardMaterial({ color: 0xd6b27a }),
        [0, 0.18, 0]
    ).rotation.z = Math.PI / 2;

    // Leads
    const leadMaterial = MATERIALS.metal;

    cylinder(group, 0.018, 0.018, 0.42, leadMaterial, [-0.48, 0.18, 0])
        .rotation.z = Math.PI / 2;

    cylinder(group, 0.018, 0.018, 0.42, leadMaterial, [0.48, 0.18, 0])
        .rotation.z = Math.PI / 2;

    // Colour bands
    const bandColors = [0x8b4513, 0xff0000, 0x8b4513, 0xffd700];

    bandColors.forEach((color, index) => {
        const band = cylinder(
            group,
            0.108,
            0.108,
            0.055,
            new THREE.MeshStandardMaterial({ color }),
            [-0.2 + index * 0.13, 0.18, 0]
        );

        band.rotation.z = Math.PI / 2;
    });

    group.userData.componentType = 'resistor';
    group.userData.value = 1000;

    createTerminal(group, 'R1', 'Resistor terminal 1', [-0.7, 0.18, 0]);
    createTerminal(group, 'R2', 'Resistor terminal 2', [0.7, 0.18, 0]);

    return group;
}

/* =========================================
   ZENER DIODE
   ========================================= */

function createZenerDiode() {
    const group = new THREE.Group();

    cylinder(
        group,
        0.13,
        0.13,
        0.52,
        new THREE.MeshStandardMaterial({ color: 0x30343b }),
        [0, 0.18, 0]
    ).rotation.z = Math.PI / 2;

    cylinder(group, 0.018, 0.018, 0.48, MATERIALS.metal, [-0.5, 0.18, 0])
        .rotation.z = Math.PI / 2;

    cylinder(group, 0.018, 0.018, 0.48, MATERIALS.metal, [0.5, 0.18, 0])
        .rotation.z = Math.PI / 2;

    // Cathode marking band
    const band = cylinder(
        group,
        0.135,
        0.135,
        0.07,
        MATERIALS.yellow,
        [0.2, 0.18, 0]
    );
    band.rotation.z = Math.PI / 2;

    group.userData.componentType = 'zener-diode';
    group.userData.zenerVoltage = 5.1;

    createTerminal(group, 'A', 'Anode', [-0.72, 0.18, 0], 0x22c55e);
    createTerminal(group, 'K', 'Cathode', [0.72, 0.18, 0], 0xef4444);

    return group;
}

/* =========================================
   POTENTIOMETER
   ========================================= */

function createPotentiometer() {
    const group = new THREE.Group();

    cylinder(
        group,
        0.34,
        0.34,
        0.22,
        new THREE.MeshStandardMaterial({ color: 0x334155 }),
        [0, 0.18, 0]
    );

    cylinder(
        group,
        0.12,
        0.12,
        0.12,
        MATERIALS.metal,
        [0, 0.36, 0]
    );

    const knob = cylinder(
        group,
        0.09,
        0.09,
        0.08,
        MATERIALS.red,
        [0, 0.45, 0]
    );

    knob.userData.isKnob = true;

    group.userData.componentType = 'potentiometer';
    group.userData.value = 1000;

    createTerminal(group, 'P1', 'Potentiometer terminal 1', [-0.25, 0.08, 0.2]);
    createTerminal(group, 'PW', 'Potentiometer wiper', [0, 0.08, 0.2]);
    createTerminal(group, 'P2', 'Potentiometer terminal 2', [0.25, 0.08, 0.2]);

    return group;
}

/* =========================================
   DC POWER SUPPLY
   ========================================= */

function createDCPowerSupply() {
    const group = new THREE.Group();

    box(group, 1.35, 0.8, 0.95, MATERIALS.board, [0, 0.4, 0]);

    box(group, 0.85, 0.32, 0.035, MATERIALS.screen, [0, 0.52, 0.49]);

    // Display detail
    box(
        group,
        0.55,
        0.035,
        0.012,
        new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            emissive: 0x0284c7
        }),
        [0, 0.56, 0.515]
    );

    cylinder(group, 0.09, 0.09, 0.07, MATERIALS.red, [-0.35, 0.12, 0.5]);
    cylinder(group, 0.09, 0.09, 0.07, MATERIALS.black, [0.35, 0.12, 0.5]);

    group.userData.componentType = 'dc-supply';

    createTerminal(group, 'POS', 'DC positive', [-0.35, 0.12, 0.62], 0xef4444);
    createTerminal(group, 'NEG', 'DC negative', [0.35, 0.12, 0.62], 0x2563eb);

    return group;
}

/* =========================================
   AMMETER
   ========================================= */

function createAmmeter() {
    const group = new THREE.Group();

    box(group, 1.15, 0.72, 0.85, MATERIALS.board, [0, 0.36, 0]);

    box(group, 0.75, 0.28, 0.025, MATERIALS.screen, [0, 0.48, 0.44]);

    cylinder(group, 0.075, 0.075, 0.07, MATERIALS.red, [-0.3, 0.1, 0.45]);
    cylinder(group, 0.075, 0.075, 0.07, MATERIALS.black, [0.3, 0.1, 0.45]);

    group.userData.componentType = 'ammeter';

    createTerminal(group, 'A+', 'Ammeter positive', [-0.3, 0.1, 0.58], 0xef4444);
    createTerminal(group, 'A-', 'Ammeter negative', [0.3, 0.1, 0.58], 0x2563eb);

    return group;
}

/* =========================================
   VOLTMETER
   ========================================= */

function createVoltmeter() {
    const group = new THREE.Group();

    box(group, 1.15, 0.72, 0.85, MATERIALS.board, [0, 0.36, 0]);

    box(group, 0.75, 0.28, 0.025, MATERIALS.screen, [0, 0.48, 0.44]);

    cylinder(group, 0.075, 0.075, 0.07, MATERIALS.red, [-0.3, 0.1, 0.45]);
    cylinder(group, 0.075, 0.075, 0.07, MATERIALS.black, [0.3, 0.1, 0.45]);

    group.userData.componentType = 'voltmeter';

    createTerminal(group, 'V+', 'Voltmeter positive', [-0.3, 0.1, 0.58], 0xef4444);
    createTerminal(group, 'V-', 'Voltmeter negative', [0.3, 0.1, 0.58], 0x2563eb);

    return group;
}

/* =========================================
   COMPONENT FACTORY
   ========================================= */

const COMPONENT_FACTORIES = {
    breadboard: createBreadboard,
    resistor: createResistor,
    'zener-diode': createZenerDiode,
    zener: createZenerDiode,
    potentiometer: createPotentiometer,
    'dc-supply': createDCPowerSupply,
    'dc-power-supply': createDCPowerSupply,
    ammeter: createAmmeter,
    voltmeter: createVoltmeter
};

export function createComponent(type) {
    const factory = COMPONENT_FACTORIES[type];

    if (!factory) {
        console.warn(`Unknown component type: ${type}`);
        return new THREE.Group();
    }

    const component = factory();
    component.userData.componentType = type;

    return component;
}

export { createBreadboard };

/* =========================================
   COMPONENT INFORMATION
   ========================================= */

export const componentInformation = {
    resistor: {
        name: 'Resistor',
        terminals: ['R1', 'R2'],
        defaultValue: '1 kΩ',
        purpose: 'Limits current in the circuit.'
    },

    'zener-diode': {
        name: 'Zener Diode',
        terminals: ['A', 'K'],
        defaultValue: '5.1 V',
        purpose: 'Maintains an approximately constant voltage in reverse breakdown.'
    },

    potentiometer: {
        name: 'Potentiometer',
        terminals: ['P1', 'PW', 'P2'],
        defaultValue: '1 kΩ',
        purpose: 'Provides adjustable resistance.'
    },

    'dc-supply': {
        name: 'DC Power Supply',
        terminals: ['POS', 'NEG'],
        defaultValue: '0–12 V',
        purpose: 'Provides a low-voltage DC source.'
    },

    ammeter: {
        name: 'Ammeter',
        terminals: ['A+', 'A-'],
        purpose: 'Measures current in series.'
    },

    voltmeter: {
        name: 'Voltmeter',
        terminals: ['V+', 'V-'],
        purpose: 'Measures voltage in parallel.'
    }
};
