import type { Camera, Scene } from "three";
import type { Node } from "three/webgpu";

type TslNode = Node & {
  readonly y: TslNode;
  add(value: unknown): TslNode;
  sub(value: unknown): TslNode;
};

export function abs(value: unknown): TslNode;
export function mix(x: unknown, y: unknown, a: unknown): Node;
export function pass(
  scene: Scene,
  camera: Camera,
): {
  getTextureNode(): TslNode;
};
export function smoothstep(edge0: unknown, edge1: unknown, x: unknown): TslNode;
export function uniform(value: number): TslNode;
export function vec2(x: unknown, y: unknown): TslNode;
export const viewportUV: TslNode;
