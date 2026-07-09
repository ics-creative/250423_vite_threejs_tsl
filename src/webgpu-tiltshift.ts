import * as THREE from "three";
import { RenderPipeline, WebGPURenderer, type Node } from "three/webgpu";
import { abs, mix, pass, smoothstep, uniform, vec2, viewportUV } from "three/tsl";
import { gaussianBlur } from "three/examples/jsm/tsl/display/GaussianBlurNode.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Stats from "stats-gl";

import { scene, camera, sizes, createCubes, updateSpotLight } from "./common/scene";

// レンダラー
const canvas = document.querySelector<HTMLCanvasElement>("#webgl");
if (!canvas) {
  throw new Error("Canvas要素 #webgl が見つかりません!");
}
const renderer = new WebGPURenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setClearColor(0x000000);
renderer.shadowMap.enabled = true;
const postProcessing = new RenderPipeline(renderer);
const finalTiltShiftNode = createTiltShiftNodeGraph(scene, camera);
postProcessing.outputNode = finalTiltShiftNode;

// --- Stats.js の初期化 ---
const stats = new Stats({
  trackGPU: false,
  trackHz: true,
});
stats.init(renderer);
document.body.appendChild(stats.dom);

// Initialize OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.autoRotate = true;
controls.autoRotateSpeed = 1.0;
controls.maxPolarAngle = (Math.PI / 2) * 0.95;
controls.minDistance = 100;
controls.maxDistance = 2000;
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// 立方体の配置
createCubes();

// Initialize and Start
await renderer.init();

tick();

window.addEventListener("resize", handleResize);

// --- Function to create TSL Node Graph (Restore tilt-shift logic) ---
function createTiltShiftNodeGraph(scene: THREE.Scene, camera: THREE.PerspectiveCamera): Node {
  const focusPosUniform = uniform(0.5);
  const blurAmountUniform = uniform(1.0);
  const gradientRadiusUniform = uniform(0.1);

  const scenePass = pass(scene, camera);
  const sceneColor = scenePass.getTextureNode();

  const blurDirection = vec2(blurAmountUniform, blurAmountUniform);
  const blurredScene = gaussianBlur(sceneColor, blurDirection, 4);

  const uv = viewportUV;
  const dist = abs(uv.y.sub(focusPosUniform));
  const blurStrength = smoothstep(gradientRadiusUniform, gradientRadiusUniform.add(0.2), dist);

  const finalNode = mix(sceneColor, blurredScene, blurStrength) as Node;

  return finalNode;
}

function tick() {
  controls.update();
  updateSpotLight();
  postProcessing.render();
  stats.update();
  window.requestAnimationFrame(tick);
}

function handleResize() {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
}
