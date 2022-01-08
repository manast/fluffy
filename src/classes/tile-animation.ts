import { Container, AnimatedSprite } from "pixi.js";

import { tiles } from "../data/tiles";
import { Tile } from "./tile";

/**
 * TileAnimation
 *
 * Use tiles to create animations.
 * These animations can only be positioned aligned to the tiles grid, in order
 * to simulate the constraints of a MSX.
 *
 */
export class TileAnimation extends AnimatedSprite {
  constructor(tileIndexes: number[]) {
    const frames = tileIndexes.map((index) => new Tile(tiles[index]));

    super(frames.map((frame) => frame.texture));

    this.loop = false;
    this.animationSpeed = 0.2;
    this.visible = false;
  }

  add(container: Container) {
    container.addChild(this);
  }

  remove(container: Container) {
    container.removeChild(this);
  }

  start({ x, y }: { x: number; y: number }, keepLast = false) {
    this.gotoAndStop(0);
    this.position.set(x * 16, y * 16);
    this.visible = true;
    super.play();

    return new Promise<void>((resolve) => {
      this.onComplete = () => {
        this.onComplete = void 0;
        if (!keepLast) {
          this.visible = false;
        }
      };
    });
  }
}
