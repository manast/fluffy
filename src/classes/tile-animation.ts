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
export class TileAnimation {
  private sprite: AnimatedSprite;

  constructor(tileIndexes: number[]) {
    const frames = tileIndexes.map((index) => new Tile(tiles[index]));

    this.sprite = new AnimatedSprite(frames.map((frame) => frame.texture));

    this.sprite.loop = false;
    this.sprite.animationSpeed = 0.2;
    this.sprite.visible = false;
  }

  add(container: Container) {
    container.addChild(this.sprite);
  }

  remove(container: Container) {
    container.removeChild(this.sprite);
  }

  play({ x, y }: { x: number; y: number }, keepLast = false) {
    this.sprite.gotoAndStop(0);
    this.sprite.position.set(x * 16, y * 16);
    this.sprite.visible = true;
    this.sprite.play();
    this.sprite.onComplete = () => {
      this.sprite.onComplete = void 0;
      if (!keepLast) {
        this.sprite.visible = false;
      }
    };
  }
}
