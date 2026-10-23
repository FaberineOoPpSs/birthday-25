/**
 * scene.js  –  Three.js r165 Birthday 3D Scene
 * Fixed: Cake scale, Side-framed fixed balloons, Flat envelope, and Mouse drag turntable.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

/* ─────────────────────────────────────────────────────────────────────
   DOM HANDLES
   ───────────────────────────────────────────────────────────────────── */
const canvas      = document.getElementById('three-canvas');
const loaderEl    = document.getElementById('loader');
const loaderFill  = document.getElementById('loader-fill');
const loaderMsg   = document.querySelector('.loader-msg');
const labelEl     = document.getElementById('open-letter-label');
const overlayEl   = document.getElementById('transition-overlay');

/* ─────────────────────────────────────────────────────────────────────
   PROGRESS TRACKING
   ───────────────────────────────────────────────────────────────────── */
let loadPct = 0;
function progress(n) {
  loadPct = Math.min(100, loadPct + n);
  if (loaderFill) loaderFill.style.width = loadPct + '%';
  
  if (loaderMsg) {
    if (loadPct < 40) {
      loaderMsg.innerHTML = 'Setting table & ballons&hellip;';
    } else if (loadPct < 80) {
      loaderMsg.innerHTML = 'Putting cake&hellip;';
    } else {
      loaderMsg.innerHTML = 'Finally giving final touches&hellip;';
    }
  }
}

/* ─────────────────────────────────────────────────────────────────────
   1.  RENDERER
   ───────────────────────────────────────────────────────────────────── */
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true, // Transparent to show CSS pastel background
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0); 
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
renderer.toneMapping       = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
progress(8);

/* ─────────────────────────────────────────────────────────────────────
   2.  SCENE & TURNTABLE
   ───────────────────────────────────────────────────────────────────── */
const scene = new THREE.Scene();
scene.background = null; 
scene.fog = new THREE.FogExp2(0xfce7f3, 0.015);

// Create a master group for everything that should rotate on drag
const turntableGroup = new THREE.Group();
scene.add(turntableGroup);

/* ─────────────────────────────────────────────────────────────────────
   3.  CAMERA
   ───────────────────────────────────────────────────────────────────── */
const camera = new THREE.PerspectiveCamera(
  36,
  window.innerWidth / window.innerHeight,
  0.1,
  120
);
camera.position.set(0, 9, 13);
camera.lookAt(0, 1.5, 0);

/* ─────────────────────────────────────────────────────────────────────
   4.  LIGHTING
   ───────────────────────────────────────────────────────────────────── */
scene.add(new THREE.AmbientLight(0xffeedd, 0.7));

const keyLight = new THREE.DirectionalLight(0xffd580, 2.0);
keyLight.position.set(5, 12, 8);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near   = 0.5;
keyLight.shadow.camera.far    = 35;
keyLight.shadow.camera.left   = -8;
keyLight.shadow.camera.right  = 8;
keyLight.shadow.camera.top    = 8;
keyLight.shadow.camera.bottom = -8;
keyLight.shadow.radius = 3;
keyLight.shadow.bias   = -0.0008;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x7dd3fc, 0.9);
rimLight.position.set(-5, 7, -9);
scene.add(rimLight);

const fillLight = new THREE.DirectionalLight(0xff9bb2, 0.6);
fillLight.position.set(-7, 3, 5);
scene.add(fillLight);
progress(8);

/* ─────────────────────────────────────────────────────────────────────
   5.  GLTF / DRACO LOADER
   ───────────────────────────────────────────────────────────────────── */
const draco = new DRACOLoader();
draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/libs/draco/gltf/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(draco);

function loadModel(path, onSuccess, onFallback) {
  gltfLoader.load(
    path,
    (gltf) => {
      const model = gltf.scene;
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow    = true;
          child.receiveShadow = true;
          if (child.material && child.material.emissiveMap) {
            child.material.emissiveIntensity = 1;
          }
        }
      });
      onSuccess(model);
    },
    undefined,           
    () => onFallback()   
  );
}

const PI2 = Math.PI * 2;
function mat(params) { return new THREE.MeshStandardMaterial(params); }

/* ─────────────────────────────────────────────────────────────────────
   7.  TABLE (Added to Turntable)
   ───────────────────────────────────────────────────────────────────── */
const tableGroup = new THREE.Group();
tableGroup.position.y = 0;
turntableGroup.add(tableGroup);

function buildProceduralTable() {
  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(4.4, 4.4, 0.26, 64),
    mat({ color: 0xf5e0c8, roughness: 0.38, metalness: 0.05 })
  );
  top.position.y = -0.13;
  top.receiveShadow = true;
  tableGroup.add(top);

  const trim = new THREE.Mesh(
    new THREE.TorusGeometry(4.4, 0.065, 8, 80),
    mat({ color: 0xdcbf9e, roughness: 0.45, metalness: 0.1 })
  );
  trim.rotation.x = Math.PI / 2;
  trim.position.y = 0.01;
  tableGroup.add(trim);

  const col = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.52, 1.85, 32),
    mat({ color: 0xc8a87a, roughness: 0.55, metalness: 0.06 })
  );
  col.position.y = -1.06;
  col.castShadow = true;
  tableGroup.add(col);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 0.85, 0.1, 48),
    mat({ color: 0xb8985a, roughness: 0.5, metalness: 0.08 })
  );
  base.position.y = -2.02;
  base.receiveShadow = true;
  tableGroup.add(base);
}

loadModel(
  'assets/models/table.glb',
  (model) => {
    model.scale.setScalar(1.0);    
    model.position.set(0, -0.26, 0);
    tableGroup.add(model);
    progress(12);
  },
  () => {
    buildProceduralTable();
    progress(12);
  }
);

/* ─────────────────────────────────────────────────────────────────────
   8.  CAKE (Added to Turntable)
   ───────────────────────────────────────────────────────────────────── */
const cakeGroup = new THREE.Group();
turntableGroup.add(cakeGroup);

function buildProceduralCake() {
  const tiers = [
    { r: 1.78, h: 1.18, y: 0.59, col: 0xfde8d4 },
    { r: 1.28, h: 0.98, y: 1.87, col: 0xfcc0d0 },
    { r: 0.78, h: 0.78, y: 2.75, col: 0xfde0ee },
  ];

  tiers.forEach(({ r, h, y, col }) => {
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r * 1.01, h, 48),
      mat({ color: col, roughness: 0.92, metalness: 0 })
    );
    body.position.y = y;
    body.castShadow = body.receiveShadow = true;
    cakeGroup.add(body);
  });
}

loadModel(
  'assets/models/cake.glb',
  (model) => {
    model.scale.setScalar(0.026); // Adjusted to fix 100x Sketchfab scaling
    model.position.set(0, -0.1, 0);
    cakeGroup.add(model);
    progress(20);
  },
  () => {
    buildProceduralCake();
    progress(20);
  }
);

/* ─────────────────────────────────────────────────────────────────────
   11.  BALLOONS (Fixed in Background — NOT on Turntable)
   ───────────────────────────────────────────────────────────────────── */
const balloonsRootGroup = new THREE.Group();
scene.add(balloonsRootGroup);
const balloonData = [];

function buildProceduralBalloons() {
  const balloonColors = [0xff9bb2, 0x7dd3fc, 0xfbbf24, 0xc084fc, 0x34d399, 0xf87171];
  balloonColors.forEach((col, i) => {
    const g = new THREE.Group();
    const balloon = new THREE.Mesh(
      new THREE.SphereGeometry(0.54, 30, 22),
      mat({ color: col, roughness: 0.16, metalness: 0.04, transparent: true, opacity: 0.87 })
    );
    balloon.scale.y = 1.22;
    balloon.castShadow = true;

    const str = new THREE.Mesh(
      new THREE.CylinderGeometry(0.011, 0.011, 1.75, 4),
      mat({ color: 0xd1d5db, roughness: 0.8 })
    );
    str.position.y = -1.6;

    g.add(balloon, str);
    const angle  = (i / balloonColors.length) * PI2 + 0.45;
    const radius = 3.3 + (i % 2) * 0.85;
    g.position.set(Math.cos(angle) * radius, 3.6 + i * 0.55, Math.sin(angle) * radius - 1.6);
    balloonsRootGroup.add(g);
    balloonData.push({ mesh: g, baseY: g.position.y, phase: i * 0.85 });
  });
}

loadModel(
  'assets/models/Ballons_NEW.glb',
  (model) => {
    model.scale.setScalar(0.55);

    // Set 1: Far Left
    const leftBalloons = model;
    leftBalloons.position.set(-5, -2, -3);
    balloonsRootGroup.add(leftBalloons);
    balloonData.push({ mesh: leftBalloons, baseY: leftBalloons.position.y, phase: 0 });

    // Set 2: Far Right
    const rightBalloons = model.clone();
    rightBalloons.position.set(5, -2, -3);
    rightBalloons.rotation.y = Math.PI; // Spin it around for slight variation
    balloonsRootGroup.add(rightBalloons);
    balloonData.push({ mesh: rightBalloons, baseY: rightBalloons.position.y, phase: 1.5 });
    
    progress(18);
  },
  () => {
    buildProceduralBalloons();
    progress(18);
  }
);

/* ─────────────────────────────────────────────────────────────────────
   12.  CONFETTI scattered on table surface (Added to Turntable)
   ───────────────────────────────────────────────────────────────────── */
(function buildConfetti() {
  const cols = [0xff9bb2, 0x7dd3fc, 0xfbbf24, 0xc084fc, 0xf9a8d4, 0xa5f3fc];
  for (let i = 0; i < 110; i++) {
    const isCircle = Math.random() > 0.5;
    const geo = isCircle
      ? new THREE.CircleGeometry(0.04 + Math.random() * 0.05, 7)
      : new THREE.PlaneGeometry(0.07 + Math.random() * 0.1, 0.03 + Math.random() * 0.04);
    const m = new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({ color: cols[i % cols.length], transparent: true, opacity: 0.7 + Math.random() * 0.3, side: THREE.DoubleSide })
    );
    let x, z;
    do { x = (Math.random() - 0.5) * 8; z = (Math.random() - 0.5) * 8; }
    while (Math.hypot(x, z) < 2.0 || Math.hypot(x, z) > 4.3);
    m.position.set(x, 0.02, z);
    m.rotation.set(Math.random() * 0.3, Math.random() * PI2, Math.random() * PI2);
    turntableGroup.add(m);
  }
})();
progress(10);

/* ─────────────────────────────────────────────────────────────────────
   14.  ENVELOPE  —  Added to Turntable (Resting flat)
   ───────────────────────────────────────────────────────────────────── */
const envelopeGroup = new THREE.Group();
// Placed on the table in front/right of the cake
envelopeGroup.position.set(2.0, 0.01, 2.5); 
// Rotated flat on its back
envelopeGroup.rotation.set(-Math.PI / 2, 0, -0.45); 

const ENV_BASE_Y   = 0.01;   
const ENV_HOVER_Y  = 0.25;   

let envelopeHovered = false;
const envelopeHitList = [];

function buildProceduralEnvelope() {
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.52, 1.06, 0.075),
    mat({ color: 0xfff0f4, roughness: 0.82, metalness: 0.03 })
  );
  body.castShadow = body.receiveShadow = true;
  envelopeGroup.add(body);
  envelopeHitList.push(body);

  const seal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.115, 0.115, 0.026, 32),
    mat({ color: 0xdb2777, roughness: 0.32, metalness: 0.22 })
  );
  seal.rotation.x = Math.PI / 2;
  seal.position.set(0, 0.13, 0.053);
  envelopeGroup.add(seal);
  envelopeHitList.push(seal);
}

const envSpot = new THREE.PointLight(0xff9bb2, 0, 3, 2);
envSpot.position.set(0, 0.14, 0.6);
envelopeGroup.add(envSpot);

loadModel(
  'assets/models/letter.glb',
  (model) => {
    model.traverse((c) => { if (c.isMesh) envelopeHitList.push(c); });
    envelopeGroup.add(model);
    progress(14);
  },
  () => {
    buildProceduralEnvelope();
    progress(14);
  }
);

turntableGroup.add(envelopeGroup);
progress(10);

/* ─────────────────────────────────────────────────────────────────────
   15.  DRAG TO ROTATE & RAYCASTER
   ───────────────────────────────────────────────────────────────────── */
const raycaster = new THREE.Raycaster();
const pointer   = new THREE.Vector2(9999, 9999);

let isDragging = false;
let hasDragged = false; // Flag to differentiate between a click/tap and a pan/swipe
let previousTouchX = 0;
let turntableTargetRot = 0;

// -- Mouse Events --
window.addEventListener('mousedown', (e) => {
  isDragging = true;
  hasDragged = false;
  previousTouchX = e.clientX;
});

window.addEventListener('mousemove', (e) => {
  pointer.x =  (e.clientX / window.innerWidth)  * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;

  if (isDragging) {
    const deltaX = e.clientX - previousTouchX;
    if (Math.abs(deltaX) > 2) hasDragged = true; // Mark as dragged if moved > 2px
    turntableTargetRot += deltaX * 0.006;
    previousTouchX = e.clientX;
  }
});

window.addEventListener('mouseup', () => {
  isDragging = false;
});

// -- Touch Events --
window.addEventListener('touchstart', (e) => {
  isDragging = true;
  hasDragged = false;
  previousTouchX = e.touches[0].clientX;
}, { passive: true });

window.addEventListener('touchmove', (e) => {
  const t = e.touches[0];
  pointer.x =  (t.clientX / window.innerWidth)  * 2 - 1;
  pointer.y = -(t.clientY / window.innerHeight) * 2 + 1;

  if (isDragging) {
    const deltaX = t.clientX - previousTouchX;
    if (Math.abs(deltaX) > 2) hasDragged = true;
    turntableTargetRot += deltaX * 0.006;
    previousTouchX = t.clientX;
  }
}, { passive: true });

window.addEventListener('touchend', (e) => {
  isDragging = false;
  
  // If user just tapped (didn't drag), update pointer for final raycast check
  if (!hasDragged && e.changedTouches && e.changedTouches.length > 0) {
    const t = e.changedTouches[0];
    pointer.set(
      (t.clientX / window.innerWidth)  * 2 - 1,
     -(t.clientY / window.innerHeight) * 2 + 1
    );
    if (isOverEnvelope()) doTransition();
  }
}, { passive: true });

function isOverEnvelope() {
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObjects(envelopeHitList, true).length > 0;
}

// Ensure clean clicks on desktop
canvas.addEventListener('click', () => {
  if (!hasDragged && isOverEnvelope()) doTransition();
});

/* ─────────────────────────────────────────────────────────────────────
   16.  "OPEN THIS LETTER" LABEL
   ───────────────────────────────────────────────────────────────────── */
const _v3 = new THREE.Vector3();

function updateLabelPosition() {
  // Push the label slightly "above" the envelope surface geometrically
  _v3.set(0, 0.4, 0).applyMatrix4(envelopeGroup.matrixWorld);
  _v3.project(camera);

  const sx = ( _v3.x * 0.5 + 0.5) * window.innerWidth;
  const sy = (-_v3.y * 0.5 + 0.5) * window.innerHeight;

  labelEl.style.left = sx + 'px';
  labelEl.style.top  = (sy - 60) + 'px';
}

labelEl.addEventListener('click', doTransition);

/* ─────────────────────────────────────────────────────────────────────
   17.  PAGE TRANSITION  →  letter.html
   ───────────────────────────────────────────────────────────────────── */
let transitioning = false;
function doTransition() {
  if (transitioning) return;
  transitioning = true;
  overlayEl.classList.add('flash');
  setTimeout(() => { window.location.href = 'letter.html'; }, 700);
}

/* ─────────────────────────────────────────────────────────────────────
   18.  RESIZE
   ───────────────────────────────────────────────────────────────────── */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ─────────────────────────────────────────────────────────────────────
   19.  ANIMATION LOOP
   ───────────────────────────────────────────────────────────────────── */
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  /* ── Balloons gently float ── */
  balloonData.forEach((b) => {
    b.mesh.position.y = b.baseY + Math.sin(t * 0.52 + b.phase) * 0.16;
  });

  /* ── Envelope hover state ── */
  const hit = isOverEnvelope();
  if (hit !== envelopeHovered) {
    envelopeHovered = hit;
    document.body.classList.toggle('hover-env', hit);
  }

  // Envelope smoothly rises slightly when hovered
  const targetY = envelopeHovered ? ENV_HOVER_Y : ENV_BASE_Y;
  envelopeGroup.position.y += (targetY - envelopeGroup.position.y) * 0.09;
  
  // Envelope tilts up gently when hovered
  const targetRotX = envelopeHovered ? (-Math.PI / 2) + 0.15 : -Math.PI / 2;
  envelopeGroup.rotation.x += (targetRotX - envelopeGroup.rotation.x) * 0.07;
  
  const targetRotZ = envelopeHovered ? -0.25 : -0.45;
  envelopeGroup.rotation.z += (targetRotZ - envelopeGroup.rotation.z) * 0.07;
  
  envSpot.intensity += ((envelopeHovered ? 2.8 : 0) - envSpot.intensity) * 0.1;

  /* ── Smooth Turntable Rotation ── */
  turntableGroup.rotation.y += (turntableTargetRot - turntableGroup.rotation.y) * 0.08;

  /* ── Keep Label Locked to Rotating Envelope ── */
  envelopeGroup.updateMatrixWorld();
  updateLabelPosition();

  renderer.render(scene, camera);
}

/* ─────────────────────────────────────────────────────────────────────
   20.  INIT
   ───────────────────────────────────────────────────────────────────── */
progress(20); 

setTimeout(() => {
  loaderEl.classList.add('hidden');
  setTimeout(() => {
    labelEl.classList.add('visible');
  }, 1600);
}, 950);

animate();