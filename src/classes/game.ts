import { Application, Texture, Container } from "pixi.js";
import { Sound } from "@pixi/sound";
import { CRTFilter } from "@pixi/filter-crt";
import { Player } from "./player";
import { ScoreBar } from "./score-bar";
import { Sprite } from "./sprite";
import { Direction } from "../enums/direction";

import { Tile } from "./tile";
import { Level } from "./level";
import { Text } from "./text";
import { Font } from "./font";

import { levels } from "../data/levels";
import { bombsData } from "../data/bombs";
import { font as fontData } from "../data/font";

import { TileType } from "../enums/tile-type";

import { tiles } from "../data/tiles";

const bombAlert = Sound.from({
  url: "assets/bomb-alert.wav",
  sprites: {
    alert: {
      start: 0,
      end: 12,
    },
  },
});
bombAlert.loop = true;

const carrot = Sound.from({
  url: "assets/carrot.wav",
});
carrot.loop = false;

function range(N: number) {
  return [...Array(N)].map((_, i) => i.toString(16)).join(" ");
}

function isSolid(material: TileType) {
  return material & 0x01;
}

function delay(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

const startLevel = 0;
const numLives = 4;

export class Game {
  player: Player;
  level: Level | undefined;
  levelIndex = startLevel;
  lives = numLives;

  scoreBar = new ScoreBar();

  numCarrots: number = 0;

  textures: Texture[] = [];

  levelContainer: Container = new Container();

  font = new Font(fontData);

  bombTimes: any = {};
  constructor(private app: Application) {
    const crtFilter = new CRTFilter();
    crtFilter.vignetting = 0;
    crtFilter.lineContrast = 0.75;
    crtFilter.curvature = 0;
    app.stage.filters = [crtFilter];

    for (let t = 0; t < tiles.length; t++) {
      this.textures.push(new Tile(tiles[t]).texture);
    }

    this.player = new Player(/* Bomb tile*/ this.textures[0x17]);

    // Create a structure to hold bomb times
    let index = 0;

    const parsedBombData = bombsData
      .split(/\s+/)
      .map((hex) => parseInt(hex, 16));
    while (index < parsedBombData.length) {
      const level = parsedBombData[index++] - 1;
      const pos = parsedBombData[index++];
      const roomIndex = parsedBombData[index++] - 5;
      const time = parsedBombData[index++];

      this.bombTimes[level] = this.bombTimes[level] || {};
      this.bombTimes[level][roomIndex] = this.bombTimes[level][roomIndex] || {};
      this.bombTimes[level][roomIndex][pos] = time * 100; // Time in milliseconds
    }
  }

  async handleDeath() {
    this.lives--;

    const scoreBar = this.scoreBar;

    scoreBar.update(this.numCarrots, this.lives, 0);

    this.level = void 0;

    if (this.lives == 0) {
      const str = ` GAME OVER `;
      const text = new Text(this.font, str);
      text.position.x = (256 - str.length * 8) / 2;
      text.position.y = (192 - 16) / 2;

      this.levelContainer.addChild(text);
      this.levelIndex = startLevel;
      this.lives = numLives;
    }
    await delay(2000);

    this.levelContainer.removeChildren();
    this.player.remove(this.levelContainer);
    this.nextLevel(this.levelIndex);
  }

  async nextLevel(levelIndex: number) {
    const player = this.player;

    const levelNum = `${levelIndex + 1}`.padStart(2, "0");
    const str = `Level:${levelNum}`;
    const text = new Text(this.font, str);

    text.position.x = (256 - str.length * 8) / 2;
    text.position.y = (192 - 16) / 2;

    this.levelContainer.addChild(text);

    await delay(2000);

    const level = (this.level = new Level(
      this.textures,
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
    player.add(this.levelContainer);

    player.pixiSprite.visible = true;

    this.numCarrots = level.numCarrots;

    this.scoreBar.update(this.numCarrots, this.lives, 0);

    return level;
  }

  async start() {
    const app = this.app;
    app.stage.addChild(this.levelContainer);

    this.scoreBar.add(app.stage);

    const player = this.player;

    this.level = await this.nextLevel(startLevel);

    window.addEventListener("keyup", keyUpHandler);

    let lastDirection: Direction;
    let bombEnd: number = 0;

    const keyDownHandler = async (evt: KeyboardEvent) => {
      keys[evt.keyCode] = true;

      const direction = keyMoveMap[evt.keyCode];
      if (direction) {
        moving = direction;
        // Last direction unless jumping or falling
        lastDirection = direction;
      }

      if (this.level) {
        if (evt.keyCode == 32) {
          // Check if there is a bomb in this tile.
          const ytile = Math.floor(player.ypos / 16);
          const xtile = Math.floor((player.xpos + 8) / 16);

          const { material, room, tileIndex } = this.level.getTileMaterial(
            xtile,
            ytile,
          );

          if (player.hasBomb) {
            const { material: floor } = this.level.getTileMaterial(
              xtile,
              ytile + 1,
            );
            if (floor == TileType.FLOOR) {
              player.dropBomb(room);
            }
          } else {
            if (material == TileType.BOMB) {
              room.replaceTile(tileIndex, 0x00);
              player.grabBomb();

              bombAlert.play("alert");

              bombEnd =
                Date.now() +
                this.bombTimes[this.levelIndex][
                  this.level.xroom + this.level.yroom * 2
                ][tileIndex];
            }
          }
        }

        if (evt.keyCode == 27) {
          // Die, restart level or game over.
          player.suicide(this.level);
          await this.handleDeath();
        }
      }
    };

    window.addEventListener("keydown", keyDownHandler);

    function keyUpHandler(evt: KeyboardEvent) {
      const direction = keyMoveMap[evt.keyCode];
      if (direction == moving) {
        moving = void 0;
      }
      delete keys[evt.keyCode];
    }

    const gameLoop = async (delta: number) => {
      if (this.level) {
        // TODO: Move to player
        if (bombEnd) {
          const bombTime = bombEnd - Date.now();
          const t = bombTime / 10000;
          bombAlert.speed = t * 1 + (1 - t) * 3.5;

          this.scoreBar.update(
            this.numCarrots,
            this.lives,
            Math.max(bombTime, 0),
          );
          if (bombTime <= 0) {
            bombAlert.stop();
            bombEnd = 0;
            player.explodeBomb(this.level);
            // TODO: check if player is dead and call deadHandler if so.
          }
        }

        const xtile = Math.floor((player.xpos + 8) / 16);
        const ytile = Math.floor(player.ypos / 16);

        const { material, room, tileIndex } = this.level.getTileMaterial(
          xtile,
          ytile,
        );
        // Check if there is a carrot
        if (material == TileType.CARROT) {
          room.replaceTile(tileIndex, TileType.EMPTY);
          this.numCarrots--;
          carrot.play();

          this.scoreBar.update(this.numCarrots, this.lives, 0);

          // If carrot counter == 0, level completed.
          if (this.numCarrots == 0) {
            this.level = await this.nextLevel(++this.levelIndex);
            return;
          }
        }

        this.level.tick(player);
        player.tick(this, moving, lastDirection);
      }
    };

    app.ticker.add(gameLoop);
  }
}

const keys: { [index: string]: boolean } = {};
let moving: Direction | undefined;

const keyMoveMap: { [index: number]: Direction } = {
  39: Direction.RIGHT,
  37: Direction.LEFT,
  38: Direction.UP,
  40: Direction.DOWN,
};
