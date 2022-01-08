import { Texture, Container, Sprite } from "pixi.js";
import { TileType } from "../enums/tile-type";
import { Elevator } from "./elevator";
import { Player } from "./player";
import { Parrot } from "./parrot";
import { Game } from "./game";

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

  tick(game: Game, player: Player) {
    if (this.elevators) {
      const elevators = this.elevators;
      for (let i = 0; i < elevators.length; i++) {
        elevators[i].tick(player);
      }
    }
    if (this.parrots) {
      const parrots = this.parrots;
      let contact = false;
      for (let i = 0; i < parrots.length; i++) {
        const parrot = parrots[i];
        if (!parrot.dead) {
          parrot.tick();
          if (!contact) {
            // Detect Collision with player
            contact = parrot.checkCollision(player);
          }
        }
      }

      if (contact && game.level) {
        // player.die(game.level);
        game.handleDeath();
      }
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
