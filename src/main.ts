import * as THREE from "three";
import { WebGPURenderer, PostProcessing } from "three/webgpu";
import { abs, mix, pass, smoothstep, uniform, vec2, viewportUV } from "three/tsl";
import { gaussianBlur } from "three/examples/jsm/tsl/display/GaussianBlurNode.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Stats from "stats-gl";

// --- 定数定義 ---
const FLOOR_DIMENSION = 4000;
const GRID_SIZE = 80; // グリッドの1辺のセル数 (80x80)
const GRID_SPACING = 50; // グリッドセル間の距離 (GRID_SIZE * GRID_SPACING が配置範囲の目安)
const NUMBER_OF_CUBES = 1000; // 配置する立方体の数
const CUBE_BASE_SIZE = 45; // 立方体の底面のサイズ
const MAX_CUBE_HEIGHT_FACTOR = 4; // 立方体の高さの最大係数 (高さ = CUBE_BASE_SIZE * 係数)
const FOG_NEAR = 1000;
const FOG_FAR = 3500;
const SPOTLIGHT_BASE_POS = new THREE.Vector3(1000, 500, 1000);
const SPOTLIGHT_MOVE_RADIUS = 200;
const SPOTLIGHT_MOVE_SPEED = 0.0003;
// --- 定数定義ここまで ---

// サイズ
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// シーン
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, FOG_NEAR, FOG_FAR);

// カメラ
const camera = new THREE.PerspectiveCamera(20, sizes.width / sizes.height, 1, 9999);
camera.position.set(0, 1500, 3000); // カメラの初期位置
camera.lookAt(0, 0, 0); // 原点を見つめる
scene.add(camera); // カメラをシーンに追加

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
const postProcessing = new PostProcessing(renderer);
const finalTiltShiftNode = createTiltShiftNodeGraph(scene, camera);
postProcessing.outputNode = finalTiltShiftNode;

// --- Stats.js の初期化 ---
// Revert to default constructor as context passing failed type checks
const stats = new Stats({
  trackGPU: false,
  trackHz: true,
}); // デフォルトオプションで初期化
stats.init(renderer);
document.body.appendChild(stats.dom); // 表示要素をDOMに追加
// --- Stats.js 初期化ここまで ---

// Initialize OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.autoRotate = true;
controls.autoRotateSpeed = 1.0; // 必要に応じて速度を調整
controls.maxPolarAngle = (Math.PI / 2) * 0.95; // 垂直回転を水平よりわずかに上に制限
controls.minDistance = 100;
controls.maxDistance = 2000; // シーンのスケールに合わせて調整
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// --- ライト設定 ---
const spotLight = new THREE.SpotLight(0xffffff, 200, 8000, Math.PI / 4, 0.2, 0.5);
spotLight.position.copy(SPOTLIGHT_BASE_POS);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 2048 * 2;
spotLight.shadow.mapSize.height = 2048 * 2;
spotLight.shadow.bias = -0.000001;
spotLight.shadow.radius = 8;
scene.add(spotLight);

// --- 地面設定 ---
const textureLoader = new THREE.TextureLoader();
// 'public/imgs/' ディレクトリに 'floor.png' が存在することを確認してください
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
    color: 0x222222,
    roughness: 0.5,
    metalness: 0.1,
  }),
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// --- 立方体設定 ---
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

  // 高さを計算 (1 から MAX_CUBE_HEIGHT_FACTOR 層)
  const heightFactor = Math.floor(Math.random() * Math.random() * MAX_CUBE_HEIGHT_FACTOR + 1);
  const boxHeight = heightFactor * CUBE_BASE_SIZE;

  // この立方体のための一意なジオメトリを作成
  const boxGeometry = new THREE.BoxGeometry(CUBE_BASE_SIZE, boxHeight, CUBE_BASE_SIZE);
  const box = new THREE.Mesh(boxGeometry, cubeMaterial);

  // ワールド座標を計算
  const posX = (gridX - gridOffset) * GRID_SPACING;
  const posY = boxHeight / 2;
  const posZ = (gridZ - gridOffset) * GRID_SPACING;

  box.position.set(posX, posY, posZ);

  box.castShadow = true;
  box.receiveShadow = true;
  scene.add(box);
}

// Initialize and Start
await renderer.init();

tick();

window.addEventListener("resize", handleResize);

// --- Function to create TSL Node Graph (Restore tilt-shift logic) ---
function createTiltShiftNodeGraph(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
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

  const finalNode = mix(sceneColor, blurredScene, blurStrength);

  return finalNode;
}

function tick() {
  controls.update();

  // スポットライトの位置を周期的に更新
  const time = Date.now() * SPOTLIGHT_MOVE_SPEED;
  const offsetX = Math.cos(time) * SPOTLIGHT_MOVE_RADIUS;
  const offsetZ = Math.sin(time) * SPOTLIGHT_MOVE_RADIUS;
  spotLight.position.x = SPOTLIGHT_BASE_POS.x + offsetX;
  spotLight.position.z = SPOTLIGHT_BASE_POS.z + offsetZ;

  postProcessing.render();

  stats.update(); // 計測終了

  window.requestAnimationFrame(tick);
}

function handleResize() {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
}
