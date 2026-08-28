import {
  ACESFilmicToneMapping,
  AmbientLight,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

import { gsap } from "../gsap.js";
import { clamp, lerp, onRevealed, prefersReducedMotion, qs } from "../utils.js";

const MARK_URL = "/logo/mb-mark.svg";

/**
 * The hero mark: the monogram SVG extruded into real geometry, lit like a
 * machined object, and nudged by the pointer and the scroll position.
 */
export async function initMonogram() {
  const host = qs("#hero-canvas");
  if (!host) return;

  let context = null;
  try {
    const probe = document.createElement("canvas");
    context = probe.getContext("webgl2") || probe.getContext("webgl");
  } catch {
    context = null;
  }
  if (!context) return;

  const reduced = prefersReducedMotion();

  const [{ paths }] = await Promise.all([loadMark()]);

  const scene = new Scene();
  const camera = new PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  const renderer = new WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  host.appendChild(renderer.domElement);

  // A neutral studio environment ships with three, so there is no HDR to fetch.
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const key = new DirectionalLight(0xfff6ec, 2.6);
  key.position.set(3, 4, 6);
  const rim = new DirectionalLight(0xff4a1c, 2.2);
  rim.position.set(-5, -2, -4);
  const fill = new DirectionalLight(0x6f8cff, 0.7);
  fill.position.set(0, -6, 2);
  scene.add(new AmbientLight(0xffffff, 0.32), key, rim, fill);

  const shapes = [];
  for (const path of paths) shapes.push(...path.toShapes(true));

  const geometry = new ExtrudeGeometry(shapes, {
    depth: 30,
    bevelEnabled: true,
    bevelThickness: 5,
    bevelSize: 4,
    bevelOffset: 0,
    bevelSegments: 5,
    curveSegments: 10,
  });
  geometry.center();
  // SVG space is y-down. A half-turn about X puts the mark upright without
  // mirroring it, so face winding and normals stay correct.
  geometry.rotateX(Math.PI);
  geometry.computeVertexNormals();

  const material = new MeshPhysicalMaterial({
    color: 0xefeae0,
    metalness: 0.58,
    roughness: 0.3,
    clearcoat: 0.85,
    clearcoatRoughness: 0.2,
    envMapIntensity: 1.6,
    reflectivity: 0.6,
    sheen: 0.3,
  });

  const mesh = new Mesh(geometry, material);
  mesh.scale.setScalar(0.0042);

  const spinner = new Group();
  spinner.add(mesh);

  const root = new Group();
  root.scale.setScalar(0.06);
  root.add(spinner);
  scene.add(root);

  const pointer = { x: 0, y: 0 };
  let entry = 0;
  let revealed = false;
  let visible = true;

  onRevealed(() => {
    revealed = true;
  });

  if (!reduced) {
    window.addEventListener(
      "pointermove",
      (event) => {
        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -((event.clientY / window.innerHeight) * 2 - 1);
      },
      { passive: true },
    );
  }

  const resize = () => {
    const { clientWidth: width, clientHeight: height } = host;
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  resize();
  new ResizeObserver(resize).observe(host);

  new IntersectionObserver(
    ([entryRecord]) => {
      visible = entryRecord.isIntersecting;
    },
    { rootMargin: "120px" },
  ).observe(host);

  const clock = { time: 0 };

  const frame = () => {
    const delta = gsap.ticker.deltaRatio(60) / 60;
    clock.time += delta;

    entry = lerp(entry, revealed ? 1 : 0, clamp(delta * 1.6, 0, 1));
    const eased = 1 - Math.pow(1 - entry, 3);
    const step = clamp(delta * 3.2, 0, 1);

    const scrolled = clamp(
      window.scrollY / Math.max(window.innerHeight, 1),
      0,
      1.4,
    );

    const wobbleY = reduced ? 0 : Math.sin(clock.time * 0.35) * 0.09;
    const wobbleX = reduced ? 0 : Math.cos(clock.time * 0.29) * 0.06;

    spinner.rotation.y = lerp(
      spinner.rotation.y,
      pointer.x * 0.34 + wobbleY + scrolled * 1.15 + (1 - eased) * -0.9,
      step,
    );
    spinner.rotation.x = lerp(
      spinner.rotation.x,
      -pointer.y * 0.22 + wobbleX + scrolled * 0.25,
      step,
    );
    spinner.rotation.z = lerp(spinner.rotation.z, scrolled * -0.18, step);

    const bob = reduced ? 0 : Math.sin(clock.time * 0.6) * 0.045;
    root.position.y = lerp(
      root.position.y,
      bob - scrolled * 1.1 + (1 - eased) * -0.6,
      step,
    );
    root.position.z = lerp(
      root.position.z,
      -scrolled * 2.4 + (1 - eased) * -3.2,
      step,
    );
    root.scale.setScalar(0.94 * eased + 0.06);

    key.position.x = lerp(key.position.x, 3 + pointer.x * 2, 0.05);
    key.position.y = lerp(key.position.y, 4 + pointer.y * 2, 0.05);

    if (visible) renderer.render(scene, camera);
  };

  gsap.ticker.add(frame);
  host.classList.add("is-ready");
}

function loadMark() {
  return new Promise((resolve, reject) => {
    new SVGLoader().load(MARK_URL, resolve, undefined, reject);
  });
}
