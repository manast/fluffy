import { Texture, Container, Sprite } from "pixi.js";
import { TileType } from "../enums/tile-type";
import { Elevator } from "./elevator";
import { Player } from "./player";
import { Parrot } from "./parrot";
import { Level } from "./level";
import { Direction } from "../enums/direction";

const width = 16;
const height = 11;

/**
 * 16x16 Tiles in MSX format. Pixel data followed by color data.
 *
 */
export class Room {
  tiles: number[];
  elevators: Elevator[] | undefined;
  container: Container = new Container();
  parrots: Parrot[] | undefined;

  constructor(
    private textures: Texture[],
    data: string,
    elevators?: {
      start: { x: number; y: number };
      end: { x: number; y: number };
    }[],
    parrots?: number[][],
  ) {
    this.tiles = data.split(/\s+/).map((hex) => parseInt(hex, 16));

    for (let j = 0; j < height; j++) {
      for (let i = 0; i < width; i++) {
        const index = j * 16 + i;
        if (index >= this.tiles.length) {
          return;
        }
        const tileSprite = Sprite.from(this.textures[this.tiles[index]]);
        tileSprite.position.set(16 * i, 16 * j);
        this.container.addChild(tileSprite);
      }
    }

    if (elevators) {
      this.elevators = elevators.map(
        (elevator) => new Elevator(elevator.start, elevator.end),
      );
      this.elevators.forEach((elevator) => elevator.add(this.container));
    }

    if (parrots) {
      this.parrots = parrots.map((parrot) => new Parrot(parrot));
    }
  }

  tick(level: Level, player: Player) {
    if (this.elevators) {
      this.elevators.forEach((elevator) => elevator.tick(player));
    }
    if (this.parrots) {
      const parrots = this.parrots.filter((parrot) => !parrot.dead);
      parrots.forEach((parrot) => parrot.tick());

      // Detect Collission with player
      const contact = parrots.some((parrot) => parrot.checkCollision(player));

      if (contact) {
        player.die(level);
      }
    }
  }

  private updateParrot(parrot: {
    pos: {
      x: number;
      y: number;
    };
    stepIndex: number;
    steps: number[];
    sprite: Parrot;
  }) {
    // Get current step index.
    let { stepIndex: index } = parrot;

    // Get current pos
    const cx = parrot.steps[index] & 0xf0;
    const cy = (parrot.steps[index] & 0x0f) << 4;

    // Get next pos
    index = (index + 1) % parrot.steps.length;
    const nx = parrot.steps[index] & 0xf0;
    const ny = (parrot.steps[index] & 0x0f) << 4;

    // Get next direction
    const deltaX = nx - cx;
    const deltaY = ny - cy;

    const direction =
      deltaX > 0
        ? Direction.RIGHT
        : deltaX < 0
        ? Direction.LEFT
        : deltaY > 0
        ? Direction.DOWN
        : Direction.UP;

    // Move
    const stepSize = 1;
    parrot.sprite.move(direction, stepSize);

    // increase step index mod steps legth
    if (parrot.sprite.xpos == nx && parrot.sprite.ypos == ny) {
      parrot.stepIndex = (parrot.stepIndex + 1) % parrot.steps.length;
    }
  }

  count(tileNumber: number) {
    return this.tiles.reduce(
      (prev, tile) => prev + (tile === tileNumber ? 1 : 0),
      0,
    );
  }

  addLevel(container: Container) {
    container.addChild(this.container);

    this.parrots?.forEach((parrot) => {
      parrot.add(container);
    });
  }

  remove(container: Container) {
    container.removeChild(this.container);
    this.parrots?.forEach((parrot) => {
      parrot.remove(container);
    });
  }

  replaceTile(tileIndex: number, material: TileType) {
    const sprite = this.container.getChildAt(tileIndex) as Sprite;
    sprite.texture = this.textures[material];
    this.tiles[tileIndex] = material;
  }
}
