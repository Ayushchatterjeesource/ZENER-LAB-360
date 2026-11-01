
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const container = document.getElementById("three-container");
const loadingScreen = document.getElementById("loadingScreen");

if (!container) {
  throw new Error("3D laboratory container not found.");
}

// -------------------------------------
// SCENE SETUP
// -------------------------------------

const scene = new THREE.Scene();
scene.background = new THREE.Color("#c4cccf");

const camera = new THREE.PerspectiveCamera(
  42,
  container.clientWidth / container.clientHeight,
  0.1,
  100
);

camera.position.set(8, 8, 10);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

container.appendChild(renderer.domElement);

// -------------------------------------
// CAMERA CONTROLS
// -------------------------------------

const controls = new OrbitControls(camera, renderer.domElement);

controls.enableDamping = true;
controls.dampingFactor = 0.06;

controls.enablePan = true;
controls.minDistance = 5;
controls.maxDistance = 19;

controls.maxPolarAngle = Math.PI / 2.05;
controls.target.set(0, 0.4, 0);

// -------------------------------------
// LIGHTING
// -------------------------------------

const ambientLight = new THREE.AmbientLight(
  0xffffff,
  1.7
);

scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(
  0xffffff,
  3
);

mainLight.position.set(-5, 12, 7);
mainLight.castShadow = true;

mainLight.shadow.mapSize.set(2048, 2048);

scene.add(mainLight);

const fillLight = new THREE.DirectionalLight(
  0xd7edff,
  1.2
);

fillLight.position.set(7, 6, -5);
scene.add(fillLight);

// -------------------------------------
// MATERIALS
// -------------------------------------

const materials = {
  table: new THREE.MeshStandardMaterial({
    color: "#777b79",
    roughness: 0.8
  }),

  breadboard: new THREE.MeshStandardMaterial({
    color: "#f0f0e9",
    roughness: 0.72
  }),

  hole: new THREE.MeshStandardMaterial({
    color: "#303b40",
    roughness: 0.9
  }),

  metal: new THREE.MeshStandardMaterial({
    color: "#b6c1c7",
    metalness: 0.8,
    roughness: 0.3
  }),

  plastic: new THREE.MeshStandardMaterial({
    color: "#20272c",
    roughness: 0.55
  }),

  red: new THREE.MeshStandardMaterial({
    color: "#e34343",
    roughness: 0.4
  }),

  blue: new THREE.MeshStandardMaterial({
    color: "#277ac8",
    roughness: 0.4
  }),

  resistor: new THREE.MeshStandardMaterial({
    color: "#c89b63",
    roughness: 0.65
  }),

  diode: new THREE.MeshStandardMaterial({
    color: "#292e32",
    roughness: 0.4
  })
};

// -------------------------------------
// HELPER FUNCTIONS
// -------------------------------------

function addBox(parent, size, position, material) {

  const geometry = new THREE.BoxGeometry(
    size[0],
    size[1],
    size[2]
  );

  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(...position);

  mesh.castShadow = true;
  mesh.receiveShadow = true;

  parent.add(mesh);

  return mesh;
}

function addCylinder(parent, radius, length, position, material, rotation) {

  const geometry = new THREE.CylinderGeometry(
    radius,
    radius,
    length,
    32
  );

  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(...position);

  if (rotation) {
    mesh.rotation.set(...rotation);
  }

  mesh.castShadow = true;

  parent.add(mesh);

  return mesh;
}

function addText(parent, text, position, size = 0.16, color = "#27333a") {

  const canvas = document.createElement("canvas");

  canvas.width = 512;
  canvas.height = 128;

  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, 512, 128);

  ctx.fillStyle = color;
  ctx.font = "bold 48px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(text, 256, 64);

  const texture = new THREE.CanvasTexture(canvas);

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(size * 4, size),
    material
  );

  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(...position);

  parent.add(mesh);

  return mesh;
}

// -------------------------------------
// WORKBENCH
// -------------------------------------

const workbench = addBox(
  scene,
  [18, 0.45, 12],
  [0, -0.25, 0],
  materials.table
);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({
    color: "#d5dadd",
    roughness: 1
  })
);

floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.49;

scene.add(floor);

// -------------------------------------
// BREADBOARD
// -------------------------------------

const breadboard = new THREE.Group();

breadboard.position.set(0, 0.01, 0);

scene.add(breadboard);

// Main body
addBox(
  breadboard,
  [8, 0.24, 4.35],
  [0, 0, 0],
  materials.breadboard
);

// Outer border
const borderMaterial = new THREE.MeshStandardMaterial({
  color: "#c5cbc7",
  roughness: 0.8
});

// Power rail strips
addBox(
  breadboard,
  [7.65, 0.018, 0.045],
  [0, 0.13, -1.86],
  materials.red
);

addBox(
  breadboard,
  [7.65, 0.018, 0.045],
  [0, 0.13, -1.65],
  materials.blue
);

addBox(
  breadboard,
  [7.65, 0.018, 0.045],
  [0, 0.13, 1.65],
  materials.red
);

addBox(
  breadboard,
  [7.65, 0.018, 0.045],
  [0, 0.13, 1.86],
  materials.blue
);

// Central IC channel
addBox(
  breadboard,
  [7.7, 0.025, 0.28],
  [0, 0.135, 0],
  new THREE.MeshStandardMaterial({
    color: "#d0d4cf"
  })
);

// -------------------------------------
// BREADBOARD HOLES
// -------------------------------------

const holeGeometry = new THREE.CylinderGeometry(
  0.043,
  0.043,
  0.018,
  12
);

const holeMaterial = materials.hole;

const holeInstances = [];

function createHole(x, z) {
  holeInstances.push([x, z]);
}

// Main terminal strips
for (let col = 0; col < 30; col++) {

  const x = -3.65 + col * 0.25;

  for (const side of [-1, 1]) {

    for (let row = 0; row < 5; row++) {

      const z = side * (0.36 + row * 0.24);

      createHole(x, z);
    }
  }
}

// Power rails
for (let col = 0; col < 30; col++) {

  const x = -3.65 + col * 0.25;

  [-1.86, -1.65, 1.65, 1.86].forEach(z => {
    createHole(x, z);
  });
}

const holes = new THREE.InstancedMesh(
  holeGeometry,
  holeMaterial,
  holeInstances.length
);

const dummy = new THREE.Object3D();

holeInstances.forEach(([x, z], index) => {

  dummy.position.set(x, 0.145, z);
  dummy.updateMatrix();

  holes.setMatrixAt(index, dummy.matrix);

});

holes.castShadow = false;
holes.receiveShadow = true;

breadboard.add(holes);

// Breadboard markings
addText(
  breadboard,
  "+  POWER RAIL",
  [-2.7, 0.155, -1.9],
  0.09,
  "#b82f2f"
);

addText(
  breadboard,
  "-  POWER RAIL",
  [2.7, 0.155, 1.9],
  0.09,
  "#2764b0"
);

// -------------------------------------
// COMPONENT INFORMATION
// -------------------------------------

const componentObjects = [];

function registerComponent(group, name, description) {

  group.userData.componentInfo = {
    name,
    description
  };

  componentObjects.push(group);

  return group;
}

// -------------------------------------
// ZENER DIODE MODEL
// -------------------------------------

function createZenerDiode() {

  const group = new THREE.Group();

  group.position.set(0.5, 0.43, 0.05);

  // Diode body
  const body = addCylinder(
    group,
    0.105,
    0.65,
    [0, 0, 0],
    materials.diode,
    [0, 0, Math.PI / 2]
  );

  // Cathode marking
  const band = addCylinder(
    group,
    0.109,
    0.075,
    [0.25, 0, 0],
    materials.metal,
    [0, 0, Math.PI / 2]
  );

  // Anode lead
  addCylinder(
    group,
    0.022,
    0.72,
    [-0.67, 0, 0],
    materials.metal,
    [0, 0, Math.PI / 2]
  );

  // Cathode lead
  addCylinder(
    group,
    0.022,
    0.72,
    [0.67, 0, 0],
    materials.metal,
    [0, 0, Math.PI / 2]
  );

  registerComponent(
    group,
    "Zener Diode",
    "Semiconductor diode. The silver band marks the cathode. This experiment studies its forward-bias behavior."
  );

  return group;
}

const zenerDiode = createZenerDiode();

breadboard.add(zenerDiode);

// -------------------------------------
// RESISTOR MODEL
// -------------------------------------

function createResistor() {

  const group = new THREE.Group();

  group.position.set(-1.7, 0.43, 0.8);

  // Resistor body
  addCylinder(
    group,
    0.12,
    0.65,
    [0, 0, 0],
    materials.resistor,
    [0, 0, Math.PI / 2]
  );

  // Leads
  [-0.72, 0.72].forEach(x => {

    addCylinder(
      group,
      0.018,
      0.75,
      [x, 0, 0],
      materials.metal,
      [0, 0, Math.PI / 2]
    );

  });

  // Color bands
  const bandColors = [
    "#794a2c",
    "#d4a328",
    "#8d3e28"
  ];

  bandColors.forEach((color, index) => {

    addCylinder(
      group,
      0.124,
      0.055,
      [-0.17 + index * 0.16, 0, 0],
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.6
      }),
      [0, 0, Math.PI / 2]
    );

  });

  registerComponent(
    group,
    "1 kΩ Resistor",
    "Series current-limiting resistor used to restrict current through the diode."
  );

  return group;
}

const resistor = createResistor();

breadboard.add(resistor);

// -------------------------------------
// JUMPER WIRES
// -------------------------------------

function createWire(points, color, radius = 0.035) {

  const curve = new THREE.CatmullRomCurve3(
    points.map(point =>
      new THREE.Vector3(...point)
    )
  );

  const geometry = new THREE.TubeGeometry(
    curve,
    40,
    radius,
    10,
    false
  );

  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.38,
    metalness: 0.12
  });

  const wire = new THREE.Mesh(geometry, material);

  wire.castShadow = true;

  breadboard.add(wire);

  return wire;
}

// Colored jumper connections
createWire([
  [-3.5, 0.3, -1.86],
  [-3.5, 0.65, -2.1],
  [-2.5, 0.65, -2.1],
  [-2.5, 0.3, -1.65]
], "#d94343");

createWire([
  [3.5, 0.3, 1.86],
  [3.5, 0.65, 2.1],
  [2.5, 0.65, 2.1],
  [2.5, 0.3, 1.65]
], "#277ac8");

// -------------------------------------
// DIGITAL INSTRUMENT SCREENS
// -------------------------------------

function createDisplayTexture(initialText, color = "#59f3ad") {

  const canvas = document.createElement("canvas");

  canvas.width = 512;
  canvas.height = 180;

  const ctx = canvas.getContext("2d");

  const texture = new THREE.CanvasTexture(canvas);

  function update(text) {

    ctx.fillStyle = "#10221d";
    ctx.fillRect(0, 0, 512, 180);

    ctx.fillStyle = color;
    ctx.font = "bold 75px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(text, 256, 92);

    texture.needsUpdate = true;
  }

  update(initialText);

  return { texture, update };
}

// -------------------------------------
// INSTRUMENT MODEL
// -------------------------------------

function createInstrument(name, position, screenText, info) {

  const group = new THREE.Group();

  group.position.set(...position);

  // Instrument case
  addBox(
    group,
    [2.1, 0.4, 2.5],
    [0, 0.2, 0],
    new THREE.MeshStandardMaterial({
      color: "#303b42",
      roughness: 0.45
    })
  );

  // Front panel
  addBox(
    group,
    [1.8, 0.08, 2.15],
    [0, 0.43, 0],
    new THREE.MeshStandardMaterial({
      color: "#d4d8d8",
      roughness: 0.6
    })
  );

  // Screen
  const display = createDisplayTexture(screenText);

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.25, 0.46),
    new THREE.MeshBasicMaterial({
      map: display.texture,
      side: THREE.DoubleSide
    })
  );

  screen.rotation.x = -Math.PI / 2;

  screen.position.set(0, 0.49, -0.45);

  group.add(screen);

  // Control knob
  addCylinder(
    group,
    0.23,
    0.13,
    [0, 0.52, 0.55],
    materials.plastic,
    [Math.PI / 2, 0, 0]
  );

  // Terminal sockets
  [-0.48, 0.48].forEach((x, index) => {

    const socket = addCylinder(
      group,
      0.095,
      0.06,
      [x, 0.49, 0.93],
      index === 0 ? materials.red : materials.plastic,
      [0, 0, 0]
    );

  });

  addText(
    group,
    name,
    [0, 0.51, -0.95],
    0.12
  );

  registerComponent(
    group,
    name,
    info
  );

  return {
    group,
    updateDisplay: display.update
  };
}

// -------------------------------------
// POWER SUPPLY
// -------------------------------------

const powerSupply = createInstrument(
  "DC POWER SUPPLY",
  [-5.2, 0, -2.8],
  "0.0 V",
  "Regulated DC supply. Used to provide an adjustable voltage for the experiment."
);

scene.add(powerSupply.group);

// -------------------------------------
// AMMETER
// -------------------------------------

const ammeter = createInstrument(
  "DIGITAL AMMETER",
  [4.7, 0, -2.8],
  "0.00 mA",
  "Ammeter measures electric current. It must be connected in series in a real circuit."
);

scene.add(ammeter.group);

// -------------------------------------
// VOLTMETER
// -------------------------------------

const voltmeter = createInstrument(
  "DIGITAL VOLTMETER",
  [4.7, 0, 1.0],
  "0.00 V",
  "Voltmeter measures voltage across the Zener diode. It must be connected in parallel."
);

scene.add(voltmeter.group);

// -------------------------------------
// COMPONENT SELECTION
// -------------------------------------

const raycaster = new THREE.Raycaster();

const pointer = new THREE.Vector2();

function findComponent(object) {

  let current = object;

  while (current) {

    if (current.userData.componentInfo) {
      return current.userData.componentInfo;
    }

    current = current.parent;
  }

  return null;
}

renderer.domElement.addEventListener("click", event => {

  const rect = renderer.domElement.getBoundingClientRect();

  pointer.x = (
    (event.clientX - rect.left) / rect.width
  ) * 2 - 1;

  pointer.y = -(
    (event.clientY - rect.top) / rect.height
  ) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);

  const intersects = raycaster.intersectObjects(
    scene.children,
    true
  );

  for (const hit of intersects) {

    const info = findComponent(hit.object);

    if (info) {

      document.getElementById("componentInfo").innerHTML = `
        <span class="component-icon">◉</span>
        <strong>${info.name}</strong>
        <p>${info.description}</p>
      `;

      return;
    }
  }

});

// -------------------------------------
// CAMERA BUTTONS
// -------------------------------------

document.getElementById("topView").addEventListener("click", () => {

  camera.position.set(0, 13, 0.1);

  controls.target.set(0, 0.2, 0);

  controls.update();

});

document.getElementById("resetView").addEventListener("click", () => {

  camera.position.set(8, 8, 10);

  controls.target.set(0, 0.4, 0);

  controls.update();

});

let autoRotate = false;

const rotateButton = document.getElementById("rotateView");

rotateButton.addEventListener("click", () => {

  autoRotate = !autoRotate;

  controls.autoRotate = autoRotate;

  controls.autoRotateSpeed = 1.5;

  rotateButton.classList.toggle("active", autoRotate);

});

// -------------------------------------
// FORWARD BIAS SIMULATION
// -------------------------------------

const voltageSlider = document.getElementById("voltageSlider");

const voltageValue = document.getElementById("voltageValue");

const powerButton = document.getElementById("powerBtn");

const supplyDisplay = document.getElementById("supplyDisplay");

const currentDisplay = document.getElementById("currentDisplay");

const diodeDisplay = document.getElementById("diodeDisplay");

const forwardVoltage = document.getElementById("forwardVoltage");

const forwardCurrent = document.getElementById("forwardCurrent");

let supplyOn = false;

const seriesResistance = 1000;

// Simplified illustrative forward diode model
function calculateDiodeCurrent(voltage) {

  const threshold = 0.58;

  if (voltage <= threshold) {
    return {
      current: 0,
      diodeVoltage: voltage
    };
  }

  let low = 0;
  let high = 0.02;

  for (let i = 0; i < 45; i++) {

    const mid = (low + high) / 2;

    const vd = threshold + 0.06 *
      Math.log(1 + mid / 0.001);

    const totalVoltage = mid * seriesResistance + vd;

    if (totalVoltage > voltage) {
      high = mid;
    } else {
      low = mid;
    }

  }

  const current = (low + high) / 2;

  const diodeVoltage = threshold + 0.06 *
    Math.log(1 + current / 0.001);

  return {
    current,
    diodeVoltage
  };
}

function updateSimulation() {

  const voltage = supplyOn
    ? Number(voltageSlider.value)
    : 0;

  const result = calculateDiodeCurrent(voltage);

  const currentMA = result.current * 1000;

  voltageValue.textContent = voltage.toFixed(1) + " V";

  supplyDisplay.textContent = voltage.toFixed(1) + " V";

  currentDisplay.textContent = currentMA.toFixed(2) + " mA";

  diodeDisplay.textContent =
    result.diodeVoltage.toFixed(2) + " V";

  forwardVoltage.textContent =
    result.diodeVoltage.toFixed(2) + " V";

  forwardCurrent.textContent =
    currentMA.toFixed(2) + " mA";

  powerSupply.updateDisplay(voltage.toFixed(1) + " V");

  ammeter.updateDisplay(currentMA.toFixed(2) + " mA");

  voltmeter.updateDisplay(
    result.diodeVoltage.toFixed(2) + " V"
  );

}

voltageSlider.addEventListener("input", updateSimulation);

powerButton.addEventListener("click", () => {

  supplyOn = !supplyOn;

  powerButton.classList.toggle("off", !supplyOn);

  powerButton.innerHTML = supplyOn
    ? '<span class="power-dot"></span> Turn OFF Supply'
    : '<span class="power-dot"></span> Turn ON Supply';

  voltageSlider.disabled = !supplyOn;

  updateSimulation();

});

// -------------------------------------
// OBSERVATION RECORDING
// -------------------------------------

const observations = [];

document.getElementById("recordBtn").addEventListener("click", () => {

  if (!supplyOn) {
    alert("Please turn ON the power supply first.");
    return;
  }

  const voltage = Number(voltageSlider.value);

  const result = calculateDiodeCurrent(voltage);

  observations.push({
    reading: observations.length + 1,
    supplyVoltage: voltage.toFixed(2),
    diodeVoltage: result.diodeVoltage.toFixed(3),
    currentMA: (result.current * 1000).toFixed(3)
  });

  alert(
    "Observation " + observations.length +
    " recorded successfully."
  );

  console.table(observations);

});

// -------------------------------------
// RESET EXPERIMENT
// -------------------------------------

document.getElementById("resetSimulation").addEventListener("click", () => {

  supplyOn = false;

  voltageSlider.value = 0;
  voltageSlider.disabled = true;

  powerButton.classList.add("off");

  powerButton.innerHTML =
    '<span class="power-dot"></span> Turn ON Supply';

  observations.length = 0;

  updateSimulation();

});

// -------------------------------------
// RESPONSIVE RENDERING
// -------------------------------------

function resizeRenderer() {

  const width = container.clientWidth;
  const height = container.clientHeight;

  if (!width || !height) return;

  camera.aspect = width / height;

  camera.updateProjectionMatrix();

  renderer.setSize(width, height);

}

window.addEventListener("resize", resizeRenderer);

if ("ResizeObserver" in window) {

  const observer = new ResizeObserver(resizeRenderer);

  observer.observe(container);

}

// -------------------------------------
// ANIMATION LOOP
// -------------------------------------

function animate() {

  requestAnimationFrame(animate);

  controls.update();

  renderer.render(scene, camera);

}

updateSimulation();

animate();

loadingScreen.classList.add("hidden");

console.log("ZENER LAB 360° - 3D Laboratory Loaded");

