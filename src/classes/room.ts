import { Texture, Container, Sprite } from "pixi.js";
import { TileType } from "../enums/tile-type";
import { Elevator } from "./elevator";
import { Player } from "./player";

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

  constructor(
    private textures: Texture[],
    data: string,
    elevators?: {
      start: { x: number; y: number };
      end: { x: number; y: number };
    }[],
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
  }

  tick(player: Player) {
    if (this.elevators) {
      this.elevators.forEach((elevator) => elevator.tick(player));
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
  }

  remove(container: Container) {
    container.removeChild(this.container);
  }

  replaceTile(tileIndex: number, material: TileType) {
    const sprite = this.container.getChildAt(tileIndex) as Sprite;
    sprite.texture = this.textures[material];
    this.tiles[tileIndex] = material;
  }
}
