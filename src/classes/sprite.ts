import { Texture, Container, AnimatedSprite } from "pixi.js";
import { MSXPalette } from "../data/palette";
import { Direction } from "../enums/direction";

const width = 16;
const height = 16;

export interface SpriteData {
  pattern: string;
  color: number;
}

/**
 * 16x16 Sprites in MSX format.
 * Every sprite is actually composed of several patterns to achive multi-color sprites.
 * Patterns for a single frame are ORed together to get the final sprite image.
 * since MSX could only choose one color per 16x16 sprite.
 */
export class Sprite {
  pixiSprite: AnimatedSprite;
  container = new Container();
  textures: { [index: string]: Texture[] } = {};
  xpos: number = 0;
  ypos: number = 0;
  private playing = false;

  constructor(animations: { [index: string]: SpriteData[][] }) {
    for (let key in animations) {
      this.textures[key] = animations[key].map((data) =>
        this.getPixiTexture(
          data.map((pattern) => ({
            pattern: pattern.pattern
              .split(/\s+/)
              .map((hex) => parseInt(hex, 16)),
            colorIndex: pattern.color,
          })),
        ),
      );
    }

    this.pixiSprite = new AnimatedSprite(
      this.textures[Object.keys(this.textures)[0]],
    );

    this.pixiSprite.loop = true;
    this.pixiSprite.animationSpeed = 0.2;
    this.container.addChild(this.pixiSprite);
  }

  private getPatternAsPixels(
    pattern: number[],
    colorIndex: number,
  ): Uint8Array {
    const buffer: Uint32Array = new Uint32Array(width * height * 4);
    let index = 0;
    const startOffsets = [0, 16 * 8, 8, 16 * 8 + 8];

    const fgColor = MSXPalette[colorIndex];
    const bgColor = MSXPalette[0];

    // Convert from MSX pixel pattern
    for (let c = 0; c < 4; c++) {
      let offset = startOffsets[c];

      for (let i = c * 8; i < c * 8 + 8; i++) {
        // Consume bits and generate row of pixels
        let row = pattern[index++];
        for (let bit = 7; bit >= 0; bit--) {
          const pixel = row & 0x01;

          row >>= 1;
          buffer[offset + bit] = pixel ? fgColor : bgColor;
        }
        offset += 16;
      }
    }

    return new Uint8Array(buffer.buffer);
  }

  private mergePatterns(a: Uint8Array, b: Uint8Array): Uint8Array {
    for (let i = 0; i < a.length; i++) {
      a[i] = a[i] | b[i];
    }
    return a;
  }

  private getPixiTexture(
    patterns: { pattern: number[]; colorIndex: number }[],
  ) {
    let rawPixels = this.getPatternAsPixels(
      patterns[0].pattern,
      patterns[0].colorIndex,
    );
    for (let i = 1; i < patterns.length; i++) {
      rawPixels = this.mergePatterns(
        rawPixels,
        this.getPatternAsPixels(patterns[i].pattern, patterns[i].colorIndex),
      );
    }

    return Texture.fromBuffer(rawPixels, 16, 16);
  }

  add(container: Container) {
    container.addChild(this.container);
  }

  set(x: number, y: number) {
    this.xpos = x;
    this.ypos = y;
    this.container.position.set(x, y);
  }

  move(direction: Direction, steps?: number) {
    steps = steps || 1;
    if (this.pixiSprite.textures !== this.textures[direction]) {
      this.pixiSprite.textures = this.textures[direction];
    }

    if (!this.playing) {
      this.pixiSprite.play();
    }

    switch (direction) {
      case Direction.RIGHT:
        this.set(this.xpos + steps, this.ypos);
        break;
      case Direction.LEFT:
        this.set(this.xpos - steps, this.ypos);
        break;
      case Direction.UP:
        this.set(this.xpos, this.ypos - steps);
        break;
      case Direction.DOWN:
        this.set(this.xpos, this.ypos + steps);
        break;
    }
  }

  stop() {
    this.playing = false;
    this.pixiSprite.stop();
  }
}
