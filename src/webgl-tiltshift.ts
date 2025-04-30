import * as THREE from "three";

// Post-processing and other necessary imports
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Stats from "stats-gl";

// --- 定数定義 ---
const GRID_SIZE = 80; // グリッドの1辺のセル数 (80x80)
const GRID_SPACING = 50; // グリッドセル間の距離 (GRID_SIZE * GRID_SPACING が配置範囲の目安)
const NUMBER_OF_CUBES = 1000; // 配置する立方体の数
const CUBE_BASE_SIZE = 45; // 立方体の底面のサイズ
const MAX_CUBE_HEIGHT_FACTOR = 4; // 立方体の高さの最大係数 (高さ = CUBE_BASE_SIZE * 係数)

// サイズ
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// シーン
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, 1000, 3500);

// カメラ設定をmain.tsに合わせて更新
const camera = new THREE.PerspectiveCamera(
  20, // fov
  sizes.width / sizes.height, // aspect
  1, // near
  9999, // far
);
camera.position.set(0, 1500, 3000); // カメラの初期位置
camera.lookAt(0, 0, 0); // 原点を見つめる
scene.add(camera);

// レンダラー（WebGLRenderer のまま）
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
}); // デフォルトオプションで初期化
stats.init(renderer);
document.body.appendChild(stats.dom); // 表示要素をDOMに追加
// --- Stats.js 初期化ここまで ---

// レンダラーの設定後に OrbitControls を初期化
const controls = new OrbitControls(camera, renderer.domElement);
controls.autoRotate = true;
controls.autoRotateSpeed = 1.0;
controls.maxPolarAngle = (Math.PI / 2) * 0.95; // 垂直回転を水平よりわずかに上に制限
controls.minDistance = 100;
controls.maxDistance = 2000;
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// --- Light ---
const SPOTLIGHT_BASE_POS = new THREE.Vector3(1000, 500, 1000);
const SPOTLIGHT_MOVE_RADIUS = 200;
const SPOTLIGHT_MOVE_SPEED = 0.0003;

// スポットライトの強度を調整
const spotLight = new THREE.SpotLight(
  0xffffff,
  500, // 強度を増加
  8000,
  Math.PI / 4,
  0.2,
  0.5,
);
spotLight.position.copy(SPOTLIGHT_BASE_POS);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 4096;
spotLight.shadow.mapSize.height = 4096;
spotLight.shadow.bias = -0.000001;
spotLight.shadow.radius = 8;
scene.add(spotLight);

// --- Ground ---
const FLOOR_DIMENSION = 4000;
const textureLoader = new THREE.TextureLoader();
const floorTexture = textureLoader.load("imgs/floor.png");
floorTexture.colorSpace = THREE.SRGBColorSpace;
floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(40, 40);
floorTexture.magFilter = THREE.NearestFilter;

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(FLOOR_DIMENSION, FLOOR_DIMENSION),
  new THREE.MeshStandardMaterial({
    map: floorTexture,
    color: 0x888888, // 明るめの色に変更
    roughness: 0.3, // 表面を滑らかに
    metalness: 0.0, // 金属感を完全に除去
  }),
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// 立方体の配置ロジックをmain.tsに合わせて更新
const cubeMaterial = new THREE.MeshStandardMaterial({
  color: 0x999999,
  roughness: 0.9,
  metalness: 0.5,
});

const occupiedCells = new Set<string>();
const gridOffset = (GRID_SIZE - 1) / 2; // グリッドを原点中心にするためのオフセット

for (let i = 0; i < NUMBER_OF_CUBES; i++) {
  let gridX: number;
  let gridZ: number;
  let cellKey: string;

  // 空いているグリッドセルを探す
  do {
    gridX = Math.floor(Math.random() * GRID_SIZE);
    gridZ = Math.floor(Math.random() * GRID_SIZE);
    cellKey = `${gridX},${gridZ}`;
  } while (occupiedCells.has(cellKey));

  occupiedCells.add(cellKey); // セルを使用済みにする

  // 高さを計算
  const heightFactor = Math.floor(Math.random() * Math.random() * MAX_CUBE_HEIGHT_FACTOR + 1);
  const boxHeight = heightFactor * CUBE_BASE_SIZE;

  const boxGeometry = new THREE.BoxGeometry(CUBE_BASE_SIZE, boxHeight, CUBE_BASE_SIZE);
  const box = new THREE.Mesh(boxGeometry, cubeMaterial);

  const posX = (gridX - gridOffset) * GRID_SPACING;
  const posY = boxHeight / 2;
  const posZ = (gridZ - gridOffset) * GRID_SPACING;

  box.position.set(posX, posY, posZ);
  box.castShadow = true;
  box.receiveShadow = true;
  scene.add(box);
}

// --- Post-processing ---
// main.ts の実装に合わせた EffectComposer の設定
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
// --- Post-processing End ---

// アニメーションループ
const tick = () => {
  controls.update(); // OrbitControls の更新

  // スポットライトの位置を周期的に更新
  const time = Date.now() * SPOTLIGHT_MOVE_SPEED;
  const offsetX = Math.cos(time) * SPOTLIGHT_MOVE_RADIUS;
  const offsetZ = Math.sin(time) * SPOTLIGHT_MOVE_RADIUS;
  spotLight.position.x = SPOTLIGHT_BASE_POS.x + offsetX;
  spotLight.position.z = SPOTLIGHT_BASE_POS.z + offsetZ;

  composer.render();
  stats.update(); // 計測終了
  window.requestAnimationFrame(tick);
};

tick();

// リサイズ処理
const handleResize = () => {
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
};

window.addEventListener("resize", handleResize);
