import {
  ACESFilmicToneMapping,
  CanvasTexture,
  Color,
  DirectionalLight,
  EquirectangularReflectionMapping,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Path,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShadowMaterial,
  Shape,
  SRGBColorSpace,
  WebGLRenderer,
} from "three";

import { gsap } from "../gsap.js";
import { clamp, lerp, onRevealed, prefersReducedMotion, qs } from "../utils.js";

/**
 * The Berberette mark in 3D — built from the original vector coordinates,
 * lit by a hand-painted studio environment, with a soft shadow caught on an
 * invisible wall behind it.
 *
 * Interaction: the mark follows the pointer, can be grabbed and dragged, and
 * answers the scroll — rotating away and receding while the hero is pinned.
 */

const LOGO = {
  block: {
    outer: [204.81,152.6,213.67,137.97,213.61,93.44,213.56,92.74,213.44,92.06,213.23,91.41,212.96,90.79,212.64,90.19,212.26,89.64,211.85,89.11,211.41,88.62,210.94,88.18,210.47,87.78,209.99,87.42,209.51,87.11,209.05,86.85,208.44,86.56,207.84,86.33,207.23,86.15,206.63,86.01,206.03,85.93,205.42,85.89,204.81,85.9,204.19,85.97,203.56,86.09,202.93,86.27,202.29,86.5,201.63,86.79,200.96,87.14,200.28,87.55,185.2,96.29,125.99,130.24,126.04,263.01,207.13,216.45,207.79,216.05,208.42,215.65,209.03,215.24,209.62,214.81,210.19,214.36,210.73,213.9,211.24,213.42,211.72,212.92,212.17,212.4,212.58,211.86,212.95,211.3,213.28,210.72,213.56,210.11,213.79,209.48,213.97,208.82,214.09,208.14,214.15,207.43,214.17,206.7,214.25,160.79,205.36,152.56],
    holes: [
      [187.82,197.95,151.78,218.62,151.73,191.97,187.67,171.18],
      [151.76,144.33,187.78,123.64,187.8,136.13,182.65,144.81,151.85,162.54],
    ],
  },
  ribbon: {
    outer: [151.35,24.81,106.8,0,81.16,14.24,0.02,59.76,0,203.52,25.79,218.19,25.79,74.39,106.79,28.56,120.86,36.69,41.93,82.25,41.94,227.4,67.61,242.08,67.66,97.59,92.97,83.12,147.51,51.81,162.52,60.3,83.93,105.66,83.95,251.6,109.73,266.27,109.73,121.08,214.98,60.52],
    holes: [],
  },
};

const W = 214.98;
const H = 266.27;
const CX = W / 2;
const CY = H / 2;

const CONFIG = {
  depth: 22,
  bevel: 1.6,
  color: "#C9CDD3",
  metalness: 1,
  roughness: 0.26,
  motion: "follow", // follow | spin | still
  exposure: 1.05,
  /* Margin around the mark when fitting the camera; higher = smaller mark. */
  fit: 1.5,
};

export function initMonogram() {
  const host = qs("#hero-canvas");
  if (!host) return;

  let probeContext = null;
  try {
    const probe = document.createElement("canvas");
    probeContext = probe.getContext("webgl2") || probe.getContext("webgl");
  } catch {
    probeContext = null;
  }
  if (!probeContext) return;

  const reduced = prefersReducedMotion();

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 1, 4000);
  camera.position.set(0, 0, 620);

  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = CONFIG.exposure;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  host.appendChild(renderer.domElement);

  /* Studio environment, painted into a canvas as an equirect map. */
  scene.environment = studioEnv(renderer);

  const key = new DirectionalLight(0xffffff, 1.35);
  key.position.set(-260, 340, 420);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  const sc = key.shadow.camera;
  sc.left = -260;
  sc.right = 260;
  sc.top = 300;
  sc.bottom = -300;
  sc.near = 10;
  sc.far = 1400;
  key.shadow.radius = 4;
  key.shadow.bias = -0.0015;
  scene.add(key);

  const fill = new DirectionalLight(0xdfe6f2, 0.35);
  fill.position.set(320, -120, 260);
  scene.add(fill);

  /* Shadow catcher: an invisible wall behind the mark. depthWrite stays off
     so the mark can recede past it during the scroll without vanishing. */
  const wall = new Mesh(
    new PlaneGeometry(2400, 2400),
    new ShadowMaterial({ opacity: 0.19 }),
  );
  wall.material.depthWrite = false;
  wall.position.z = -150;
  wall.receiveShadow = true;
  scene.add(wall);

  /* Geometry */
  const material = new MeshStandardMaterial({
    color: new Color(CONFIG.color),
    metalness: CONFIG.metalness,
    roughness: CONFIG.roughness,
    envMapIntensity: 1.15,
  });

  const group = new Group(); // pointer follow + drag
  const rig = new Group(); // entry + scroll
  rig.add(group);
  scene.add(rig);

  const settings = {
    depth: CONFIG.depth,
    bevelEnabled: CONFIG.bevel > 0.01,
    bevelThickness: CONFIG.bevel,
    bevelSize: CONFIG.bevel,
    bevelSegments: 3,
    curveSegments: 1,
    steps: 1,
  };

  for (const [name, zNudge] of [
    ["ribbon", 0],
    ["block", 0.12],
  ]) {
    const part = LOGO[name];
    const geometry = new ExtrudeGeometry(toShape(part.outer, part.holes), settings);
    geometry.translate(0, 0, -CONFIG.depth / 2 + zNudge);
    const mesh = new Mesh(geometry, material);
    mesh.castShadow = true;
    group.add(mesh);
  }

  /* Pose + interaction */
  const base = reduced ? { x: -0.14, y: 0.42 } : { x: 0, y: 0 };
  const target = { ...base };
  const current = { ...base };
  let spin = 0;
  let dragging = false;
  let last = null;

  const pointerPose = (event) => {
    const rect = host.getBoundingClientRect();
    const nx = (event.clientX - rect.left) / rect.width - 0.5;
    const ny = (event.clientY - rect.top) / rect.height - 0.5;
    target.y = nx * 0.9;
    target.x = ny * 0.5;
  };

  if (!reduced) {
    host.addEventListener("pointermove", (event) => {
      if (dragging) {
        target.y += (event.clientX - last.x) * 0.008;
        target.x += (event.clientY - last.y) * 0.006;
        target.x = clamp(target.x, -1.1, 1.1);
        last = { x: event.clientX, y: event.clientY };
      } else if (CONFIG.motion === "follow" && event.pointerType === "mouse") {
        pointerPose(event);
      }
    });

    host.addEventListener("pointerdown", (event) => {
      dragging = true;
      last = { x: event.clientX, y: event.clientY };
      host.setPointerCapture(event.pointerId);
      host.classList.add("is-dragging");
    });

    for (const type of ["pointerup", "pointercancel"]) {
      host.addEventListener(type, () => {
        dragging = false;
        host.classList.remove("is-dragging");
      });
    }

    host.addEventListener("pointerleave", () => {
      if (!dragging && CONFIG.motion === "follow") {
        target.x = base.x;
        target.y = base.y;
      }
    });
  }

  /* Resize: frame the mark with a consistent margin whatever the shape. */
  const resize = () => {
    const width = host.clientWidth || 1;
    const height = host.clientHeight || 1;
    renderer.setSize(width, height, false);
    renderer.domElement.style.width = `${width}px`;
    renderer.domElement.style.height = `${height}px`;
    camera.aspect = width / height;
    // Portrait stages get extra margin so the mark doesn't swallow the name.
    const fit = CONFIG.fit + Math.max(0, 1 - camera.aspect) * 0.85;
    const fitH = H * fit;
    const fitW = W * fit;
    const halfFov = (camera.fov * Math.PI) / 180 / 2;
    const dV = fitH / 2 / Math.tan(halfFov);
    const dH = fitW / 2 / Math.tan(halfFov) / camera.aspect;
    camera.position.z = Math.max(dV, dH);
    camera.updateProjectionMatrix();
  };

  resize();
  new ResizeObserver(resize).observe(host);

  /* Visibility gate so the GPU rests once the hero is out of view. */
  let visible = true;
  new IntersectionObserver(
    ([entryRecord]) => {
      visible = entryRecord.isIntersecting;
    },
    { rootMargin: "120px" },
  ).observe(host);

  /* Entry + scroll state */
  let entry = reduced ? 1 : 0;
  let revealed = reduced;
  onRevealed(() => {
    revealed = true;
  });

  const frame = () => {
    const ratio = gsap.ticker.deltaRatio(60);
    const step = clamp(0.075 * ratio, 0, 1);

    entry = lerp(entry, revealed ? 1 : 0, clamp(0.027 * ratio, 0, 1));
    const eased = 1 - Math.pow(1 - entry, 3);

    const scrolled = reduced
      ? 0
      : clamp(window.scrollY / Math.max(window.innerHeight, 1), 0, 1.4);

    if (CONFIG.motion === "spin" && !dragging && !reduced) {
      spin += 0.006 * ratio;
    }

    current.x += (target.x - current.x) * step;
    current.y += (target.y - current.y) * step;
    group.rotation.x = current.x;
    group.rotation.y = current.y + spin;

    // Scroll: rotate away, sink and recede while the hero is pinned.
    rig.rotation.y = lerp(rig.rotation.y, scrolled * 1.3 + (1 - eased) * -0.85, step);
    rig.rotation.z = lerp(rig.rotation.z, scrolled * -0.12, step);
    rig.position.y = lerp(rig.position.y, -scrolled * 90, step);
    rig.position.z = lerp(
      rig.position.z,
      -scrolled * 210 + (1 - eased) * -300,
      step,
    );
    const scale = (0.94 * eased + 0.06) * (1 - clamp(scrolled * 0.18, 0, 0.3));
    rig.scale.setScalar(scale);

    if (visible) renderer.render(scene, camera);
  };

  gsap.ticker.add(frame);
  host.classList.add("is-ready");
}

function toShape(flat, holes) {
  const shape = new Shape();
  for (let i = 0; i < flat.length; i += 2) {
    const x = flat[i] - CX;
    const y = -(flat[i + 1] - CY);
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  for (const hole of holes || []) {
    const path = new Path();
    for (let j = 0; j < hole.length; j += 2) {
      const hx = hole[j] - CX;
      const hy = -(hole[j + 1] - CY);
      if (j === 0) path.moveTo(hx, hy);
      else path.lineTo(hx, hy);
    }
    path.closePath();
    shape.holes.push(path);
  }

  return shape;
}

function studioEnv(renderer) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const g = canvas.getContext("2d");

  const sky = g.createLinearGradient(0, 0, 0, 256);
  sky.addColorStop(0, "#ffffff");
  sky.addColorStop(0.48, "#b9bcc2");
  sky.addColorStop(0.52, "#6a6d73");
  sky.addColorStop(1, "#2a2c30");
  g.fillStyle = sky;
  g.fillRect(0, 0, 512, 256);

  // Two softboxes and a rim source.
  for (const [x, y, radius, strength] of [
    [150, 60, 90, 1.0],
    [370, 78, 62, 0.75],
    [255, 200, 70, 0.28],
  ]) {
    const r = g.createRadialGradient(x, y, 0, x, y, radius);
    r.addColorStop(0, `rgba(255,255,255,${strength})`);
    r.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, 512, 256);
  }

  const texture = new CanvasTexture(canvas);
  texture.mapping = EquirectangularReflectionMapping;
  texture.colorSpace = SRGBColorSpace;

  const pmrem = new PMREMGenerator(renderer);
  const env = pmrem.fromEquirectangular(texture).texture;
  pmrem.dispose();
  texture.dispose();
  return env;
}
