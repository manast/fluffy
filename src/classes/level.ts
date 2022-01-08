import { Room } from "./room";
import { Sprite } from "./sprite";
import { Texture, Container } from "pixi.js";
import { tileMapping } from "../data/levels";
import { Player } from "./player";
import { Game } from "./game";

// Levels are hardcoded to 2x2 views (screens)
const width = 2;
const height = 2;

export interface ElevatorData {
  room: number;
  start: { x: number; y: number };
  end: { x: number; y: number };
}

export interface ParrotData {
  room: number;
  steps: number[];
}

export interface LevelData {
  rooms: string[];
  startPos: { x: number; y: number };
  startRoom: { x: number; y: number };
  elevators?: ElevatorData[];
  parrots?: ParrotData[];
}
/**
 * Levels are composed of 4 different adjacent views arranged in 2x2.
 */
export class Level {
  rooms: Room[];
  currentRoom: Room;

  xroom: number = 0;
  yroom: number = 0;

  numCarrots: number;

  container: Container;

  constructor(
    private textures: Texture[],
    private player: Sprite,
    level: LevelData,
  ) {
    this.rooms = level.rooms.map(
      (room, index) =>
        new Room(
          textures,
          room,
          level.elevators?.filter((elevator) => elevator.room === index),
          level.parrots
            ?.filter((parrot) => parrot.room === index)
            .map((parrot) => parrot.steps),
        ),
    );
    this.container = new Container();

    this.numCarrots = this.rooms.reduce(
      (prev, room) => prev + room.count(0x16),
      0,
    );

    this.xroom = level.startRoom.x;
    this.yroom = level.startRoom.y;
    const index = this.yroom * width + this.xroom;

    this.currentRoom = this.rooms[index];
    this.currentRoom.addLevel(this.container);

    player.set(level.startPos.x, level.startPos.y);
  }

  add(container: Container) {
    container.addChild(this.container);
  }

  remove(container: Container) {
    container.removeChild(this.container);
  }

  tick(game: Game, player: Player) {
    let { xpos, ypos } = this.player;

    if (xpos >= 16 * 16) {
      this.xroom++;
      xpos -= 16 * 16;
    } else if (xpos <= -16) {
      this.xroom--;
      xpos += 16 * 16;
    }

    if (ypos >= 11 * 16) {
      this.yroom++;
      ypos -= 11 * 16;
    } else if (ypos <= -16) {
      this.yroom--;
      ypos += 11 * 16;
    }

    const index = this.yroom * height + this.xroom;

    if (this.rooms[index] !== this.currentRoom) {
      this.currentRoom.remove(this.container);
      this.currentRoom = this.rooms[index];
      this.currentRoom.addLevel(this.container);
      this.player.set(xpos, ypos);
    }

    this.currentRoom.tick(game, player);
  }

  getRoom(x: number, y: number) {
    const xRoom = Math.floor(x / 16) + this.xroom;
    const yRoom = Math.floor(y / 11) + this.yroom;

    const index = yRoom * height + xRoom;
    return this.rooms[index];
  }

  getTileMaterial(x: number, y: number, room?: Room) {
    room = room ? room : this.getRoom(x, y);

    if (x < 0) {
      x += 16;
    }
    if (y < 0) {
      y += 11;
    }
    const tileIndex = (y % 11) * 16 + (x % 16);

    return {
      material: tileMapping[room.tiles[tileIndex]],
      room,
      tileIndex,
    };
  }
}
