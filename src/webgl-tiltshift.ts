import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Stats from "stats-gl";

import { scene, camera, sizes, createCubes, updateSpotLight } from "./common/scene";

// レンダラー
const canvas = document.querySelector<HTMLCanvasElement>("#webgl");
if (!canvas) {
  throw new Error("Canvas element #webgl not found!");
}
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setClearColor(0x000000);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(sizes.width, sizes.height);
renderer.shadowMap.enabled = true;

// --- Stats.js の初期化 ---
const stats = new Stats({
  trackGPU: true,
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

// --- Post-processing ---
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const tiltShiftShader = {
  uniforms: {
    tDiffuse: { value: null },
    focusPos: { value: 0.5 },
    blurAmount: { value: 7.0 },
    gradientRadius: { value: 0.2 },
    resolution: { value: new THREE.Vector2(sizes.width, sizes.height) },
  },
  // language=GLSL
  vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
  // language=GLSL
  fragmentShader: `
        precision highp float;
        uniform sampler2D tDiffuse;
        uniform float focusPos;
        uniform float blurAmount;
        uniform float gradientRadius;
        uniform vec2 resolution;
        varying vec2 vUv;
        float gaussianPdf(in float x, in float sigma) {
            return 0.39894 * exp(-0.5 * x * x / (sigma * sigma)) / sigma;
        }
        void main() {
            float dist = abs(vUv.y - focusPos);
            float blurStrength = smoothstep(gradientRadius, gradientRadius + 0.2, dist) * blurAmount;
            vec4 originalColor = texture2D(tDiffuse, vUv);
            if (blurStrength < 0.1) {
                gl_FragColor = originalColor;
                return;
            }
            const int KERNEL_RADIUS = 3;
            float kernel[KERNEL_RADIUS + 1];
            vec3 final_color = vec3(0.0);
            float totalWeight = 0.0;
            float sigma = float(KERNEL_RADIUS);
            float sum = 0.0;
            for (int i = 0; i <= KERNEL_RADIUS; i++) {
                kernel[i] = gaussianPdf(float(i), sigma);
                sum += (i == 0 ? 1.0 : 2.0) * kernel[i];
            }
            for (int i = 0; i <= KERNEL_RADIUS; i++) {
                kernel[i] /= sum;
            }
            vec2 pixelSize = 1.0 / resolution;
            for (int i = -KERNEL_RADIUS; i <= KERNEL_RADIUS; i++) {
                for (int j = -KERNEL_RADIUS; j <= KERNEL_RADIUS; j++) {
                    float weight = kernel[abs(i)] * kernel[abs(j)];
                    vec2 offset = vec2(float(i), float(j)) * pixelSize * blurStrength;
                    final_color += texture2D(tDiffuse, vUv + offset).rgb * weight;
                    totalWeight += weight;
                }
            }
            gl_FragColor = vec4(final_color / totalWeight, originalColor.a);
        }
    `,
};

const tiltShiftPass = new ShaderPass(tiltShiftShader);
composer.addPass(tiltShiftPass);

// アニメーションループ
const tick = () => {
  controls.update();
  updateSpotLight();
  composer.render();
  stats.update();
  window.requestAnimationFrame(tick);
};

tick();

// リサイズ処理
window.addEventListener("resize", handleResize);

function handleResize() {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(window.devicePixelRatio);
  composer.setSize(sizes.width, sizes.height);
  if (tiltShiftPass && tiltShiftPass.uniforms.resolution) {
    tiltShiftPass.uniforms.resolution.value.set(sizes.width, sizes.height);
  }
}
