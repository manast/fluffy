import { Application, Texture, Container } from "pixi.js";
import { Player } from "./player";
import { ScoreBar } from "./score-bar";
import { Sprite } from "./sprite";
import { Direction } from "../enums/direction";

import { Tile } from "./tile";
import { Level } from "./level";

import { levels } from "../data/levels";
import { TileType } from "../enums/tile-type";

import { tiles } from "../data/tiles";

function range(N: number) {
  return [...Array(N)].map((_, i) => i.toString(16)).join(" ");
}

function isSolid(material: TileType) {
  return material & 0x01;
}

export class Game {
  player: Sprite;
  level: Level;
  levelIndex = 0;
  lives = 3;

  levelContainer: Container = new Container();

  nextLevel(levelIndex: number, textures: Texture[], player: Player) {
    if (this.level) {
      this.level.remove(this.levelContainer);
    }

    const level = (this.level = new Level(
      textures,
      player,
      /*
      {
        rooms: [range(63), "00", "00", "00"],
        startPos: { x: 10, y: 10 },
        startRoom: { x: 0, y: 0 },
      },
      */
      levels[levelIndex],
    ));

    level.add(this.levelContainer);

    return level;
  }

  constructor(app: Application) {
    app.stage.addChild(this.levelContainer);

    const textures: Texture[] = [];
    for (let t = 0; t < tiles.length; t++) {
      textures.push(new Tile(tiles[t]).texture);
    }

    const player = (this.player = new Player());

    this.level = this.nextLevel(0, textures, player);
    let carrots = this.level.numCarrots;
    let lives = 3;

    let scoreBar = new ScoreBar();
    scoreBar.update(carrots, lives, 0);

    player.add(app.stage);

    scoreBar.add(app.stage);

    window.addEventListener("keyup", keyUpHandler);

    let falling = false;
    let fallCoord: number;

    function alignTileHoriz(player: Sprite) {
      const { xpos, ypos } = player;

      player.set(Math.round(xpos / 16) * 16, ypos);
    }

    const checkRight = (player: Sprite) => {
      const xtile = Math.floor(player.xpos / 16) + 1;
      const ytile0 = Math.floor(player.ypos / 16);

      const { material } = this.level.getTileMaterial(xtile, ytile0);
      if (material & 0x01) {
        return false;
      }

      const ytile1 = Math.floor((player.ypos + 15) / 16);

      {
        const { material } = this.level.getTileMaterial(xtile, ytile1);
        if (isSolid(material)) {
          return false;
        }
      }
      return true;
    };

    let bombTimer: NodeJS.Timeout;
    let bombBackground = TileType.EMPTY;

    const keyDownHandler = (evt: KeyboardEvent) => {
      keys[evt.keyCode] = true;

      const direction = keyMoveMap[evt.keyCode];
      if (direction) {
        moving = direction;
      }

      if (evt.keyCode == 32) {
        // Check if there is a bomb in this tile.
        const ytile = Math.floor(player.ypos / 16);
        const xtile = Math.floor((player.xpos + 8) / 16);

        const { material, room, tileIndex } = this.level.getTileMaterial(
          xtile,
          ytile,
        );

        if (player.hasBomb) {
          const { material } = this.level.getTileMaterial(xtile, ytile + 1);
          if (material == TileType.FLOOR) {
            player.dropBomb();
            bombBackground = room.tiles[tileIndex];
            room.replaceTile(tileIndex, 0x17);
          }
        } else {
          if (material == TileType.BOMB) {
            room.replaceTile(tileIndex, bombBackground);
            player.grabBomb();

            bombTimer = setTimeout(() => {
              player.explodeBomb(this.level);
            }, 6000);
          }
        }
      }

      if (evt.keyCode == 27) {
        // Die, restart level or game over.
        player.suicide(this.level);
      }
    };

    window.addEventListener("keydown", keyDownHandler);

    const checkLeft = (player: Sprite) => {
      const xtile = Math.floor((player.xpos + 15) / 16) - 1;
      const ytile0 = Math.floor(player.ypos / 16);

      const { material } = this.level.getTileMaterial(xtile, ytile0);

      if (isSolid(material)) {
        return false;
      }

      const ytile1 = Math.floor((player.ypos + 15) / 16);

      {
        const { material } = this.level.getTileMaterial(xtile, ytile1);

        if (isSolid(material)) {
          return false;
        }
      }

      return true;
    };

    function keyUpHandler(evt: KeyboardEvent) {
      const direction = keyMoveMap[evt.keyCode];
      if (direction == moving) {
        moving = null;
      }
      delete keys[evt.keyCode];
    }

    const gameLoop = () => {
      const ytile = Math.floor(player.ypos / 16);
      const xtile = Math.floor((player.xpos + 8) / 16);

      // Check if there is a carrot
      const { material, room, tileIndex } = this.level.getTileMaterial(
        xtile,
        ytile,
      );
      if (material == TileType.CARROT) {
        // Replace carrot tile with empty tile
        room.replaceTile(tileIndex, TileType.EMPTY);
        // Decrease carrot counter
        carrots--;

        // If carrot counter == 0, level completed.
        if (carrots == 0) {
          this.level = this.nextLevel(++this.levelIndex, textures, player);
          carrots = this.level.numCarrots;
        }

        scoreBar.update(carrots, lives, 0);
      }

      const level = this.level;

      // Check if there is floor under
      const { material: floorType } = this.level.getTileMaterial(
        xtile,
        ytile + 1,
      );
      if (
        !isSolid(floorType) &&
        ![TileType.ROPE, TileType.ROPE_START].includes(floorType) &&
        !player.elevator
      ) {
        if (!falling) {
          falling = true;
          fallCoord = player.ypos + level.yroom * 16 * 11;
        }

        alignTileHoriz(player);
        player.stop();
        player.set(player.xpos, player.ypos + 1);
      } else {
        if (falling) {
          falling = false;
          if (player.ypos + level.yroom * 16 * 11 - fallCoord >= 32) {
            player.deadFall(level);
          }
          return;
        }

        if (moving) {
          if (moving == Direction.RIGHT) {
            if (checkRight(player)) {
              player.move(moving);
            } else {
              player.stop();
            }
          }

          if (moving == Direction.LEFT) {
            if (checkLeft(player)) {
              player.move(moving);
            } else {
              player.stop();
            }
          }

          if (moving == Direction.UP) {
            const ytile = Math.floor((player.ypos + 15) / 16) - 1;
            const { material } = level.getTileMaterial(xtile, ytile);
            if (material == TileType.ROPE || material == TileType.ROPE_START) {
              alignTileHoriz(player);
              player.move(moving);
            } else {
              player.stop();
            }
          }

          if (moving == Direction.DOWN) {
            const { material } = level.getTileMaterial(xtile, ytile + 1);
            if (material == TileType.ROPE || material == TileType.ROPE_START) {
              alignTileHoriz(player);
              player.move(moving);
            } else {
              player.stop();
            }
          }
        } else {
          player.stop();
        }
      }

      level.tick(player);
    };

    app.ticker.add(gameLoop);
  }

  destroy() {}
}

const keys: { [index: string]: boolean } = {};
let moving: Direction | null;

const keyMoveMap: { [index: number]: Direction } = {
  39: Direction.RIGHT,
  37: Direction.LEFT,
  38: Direction.UP,
  40: Direction.DOWN,
};
