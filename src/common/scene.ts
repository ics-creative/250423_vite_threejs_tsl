import * as THREE from "three";

// --- 定数定義 ---
export const FLOOR_DIMENSION = 4000;
export const GRID_SIZE = 80; // グリッドの1辺のセル数 (80x80)
export const GRID_SPACING = 50; // グリッドセル間の距離 (GRID_SIZE * GRID_SPACING が配置範囲の目安)
export const NUMBER_OF_CUBES = 1000; // 配置する立方体の数
export const CUBE_BASE_SIZE = 45; // 立方体の底面のサイズ
export const MAX_CUBE_HEIGHT_FACTOR = 4; // 立方体の高さの最大係数 (高さ = CUBE_BASE_SIZE * 係数)
export const FOG_NEAR = 1000;
export const FOG_FAR = 3500;
export const SPOTLIGHT_BASE_POS = new THREE.Vector3(1000, 500, 1000);
export const SPOTLIGHT_MOVE_RADIUS = 200;
export const SPOTLIGHT_MOVE_SPEED = 0.0003;

// サイズ
export const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// シーン
export const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, FOG_NEAR, FOG_FAR);

// カメラ
export const camera = new THREE.PerspectiveCamera(20, sizes.width / sizes.height, 1, 9999);
camera.position.set(0, 1500, 3000); // カメラの初期位置
camera.lookAt(0, 0, 0); // 原点を見つめる
scene.add(camera); // カメラをシーンに追加

// スポットライト
export const spotLight = new THREE.SpotLight(0xffffff, 200, 8000, Math.PI / 4, 0.2, 0.5);
spotLight.position.copy(SPOTLIGHT_BASE_POS);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 2048 * 2;
spotLight.shadow.mapSize.height = 2048 * 2;
spotLight.shadow.bias = -0.000001;
spotLight.shadow.radius = 8;
scene.add(spotLight);

// 床
const textureLoader = new THREE.TextureLoader();
const floorTexture = textureLoader.load("imgs/floor.png");
floorTexture.colorSpace = THREE.SRGBColorSpace;
floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(40, 40);
floorTexture.magFilter = THREE.NearestFilter;

export const floor = new THREE.Mesh(
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

// 立方体の配置
export function createCubes() {
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
}

// スポットライトのアニメーション
export function updateSpotLight() {
  const time = Date.now() * SPOTLIGHT_MOVE_SPEED;
  const offsetX = Math.cos(time) * SPOTLIGHT_MOVE_RADIUS;
  const offsetZ = Math.sin(time) * SPOTLIGHT_MOVE_RADIUS;
  spotLight.position.x = SPOTLIGHT_BASE_POS.x + offsetX;
  spotLight.position.z = SPOTLIGHT_BASE_POS.z + offsetZ;
}
