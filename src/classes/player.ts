import { Container, Sprite as PixiSprite, Texture } from "pixi.js";

import { Sprite } from "./sprite";
import { Direction } from "../enums/direction";
import { Bomb } from "./bomb";
import { TileAnimation } from "./tile-animation";
import { Level } from "./level";
import { TileType } from "../enums/tile-type";
import { Elevator } from "./elevator";
import { Room } from "./room";
import { Game } from "./game";

import { Sound } from "@pixi/sound";

const bombExplosion = Sound.from({
  url: "assets/bomb-explosion.wav",
});
bombExplosion.loop = false;

const blood = Sound.from({
  url: "assets/blood.wav",
});
blood.loop = false;

const fluffy = [
  `0A 21 0B 17 9F 2F 5F 2F
  1F AF 17 4F 15 0B 0E 07
  A2 68 D2 EC F9 94 9A 94
  F9 F4 F8 D2 E8 A4 38 70`,

  `09 24 0B 57 2F 0F 5F 2F 
  5F 0F 57 0F 15 01 01 03
  40 A8 D0 EC F8 94 9A 94
  F8 F4 F8 D0 E8 80 80 E0`,

  `45 16 4B 37 9F 29 59 29
  9F 2F 1F 4B 17 25 1C 0E
  50 84 D0 E8 F9 F4 FA F4
  F8 F5 E8 F2 A8 D0 70 E0`,

  `02 15 0B 37 1F 29 59 29
  1F 2F 1F 0B 17 01 01 07
  90 24 D0 EA F4 F0 FA F4
  FA F0 EA F0 A8 80 80 C0`,

  `09 24 0B 57 1F 2F 1F AF
  1F 2F 97 2F 17 03 03 07
  52 A8 D2 E8 F1 F4 F9 F0
  FA F0 F9 F4 68 F4 00 80`,

  `29 04 23 57 0F 2F 1F 2F
  1F 4F 17 2F 13 07 00 00
  52 88 D2 E8 F5 F0 FA F0
  FA F4 F8 F5 68 E0 60 F0`,

  `00 00 00 00 00 06 00 00
  00 00 00 00 00 00 00 00
  00 00 00 00 00 00 00 00
  00 00 00 00 00 00 00 00`,

  `00 00 00 00 00 00 00 00
  00 00 00 00 00 00 00 00
  00 00 00 00 00 60 00 00
  00 00 00 00 00 00 00 00`,
];

enum Status {
  IN_ROPE,
  GOING_TO_ROPE,
  INSIDE_PIPE,
  FALLING,
  BOUNCING,
  STANDING,
  DEAD,
}

export class Player extends Sprite {
  bomb: Bomb = new Bomb();
  bombAnimations: Container = new Container();
  deadExplodeAnimation: TileAnimation;
  deadFallAnimation: TileAnimation;
  deadExplodeAnimationRope: TileAnimation;
  deadFallAnimationRope: TileAnimation;

  hasBomb = false;
  bombPos: { x: number; y: number } = { x: 0, y: 0 };
  bombRoom: Room | undefined;
  elevator: Elevator | undefined;
  insidePipe = false;

  bombTile: PixiSprite;

  animationsContainer = new Container();

  status: Status = Status.STANDING;

  falling = false;
  goingToRope = false;

  fallCoord = 0;
  dstPos: { x: number; y: number } | undefined;

  constructor(bombTexture: Texture) {
    super({
      [Direction.LEFT]: [
        [
          { pattern: fluffy[2], color: 0x04 },
          { pattern: fluffy[6], color: 0x0f },
        ],
        [
          { pattern: fluffy[3], color: 0x04 },
          { pattern: fluffy[6], color: 0x0f },
        ],
      ],
      [Direction.RIGHT]: [
        [
          { pattern: fluffy[0], color: 0x04 },
          { pattern: fluffy[7], color: 0x0f },
        ],
        [
          { pattern: fluffy[1], color: 0x04 },
          { pattern: fluffy[7], color: 0x0f },
        ],
      ],
      [Direction.UP]: [
        [{ pattern: fluffy[4], color: 0x04 }],
        [{ pattern: fluffy[5], color: 0x04 }],
      ],
      [Direction.DOWN]: [
        [{ pattern: fluffy[4], color: 0x04 }],
        [{ pattern: fluffy[5], color: 0x04 }],
      ],
    });

    this.pixiSprite.textures = this.textures[Direction.RIGHT];

    this.bombAnimations.addChild(
      new TileAnimation([24, 25, 26, 27]),
      new TileAnimation([24, 25, 26, 27]),
      new TileAnimation([24, 25, 26, 27]),
    );

    this.deadExplodeAnimation = new TileAnimation([37, 38, 39, 40, 41]);
    this.deadFallAnimation = new TileAnimation([40, 41]);

    this.deadExplodeAnimationRope = new TileAnimation([37, 38, 39, 40, 42]);
    this.deadFallAnimationRope = new TileAnimation([40, 42]);

    this.animationsContainer.addChild(
      this.bombAnimations,
      this.deadExplodeAnimation,
      this.deadFallAnimation,
      this.deadExplodeAnimationRope,
      this.deadFallAnimationRope,
    );

    this.bombTile = PixiSprite.from(bombTexture);
  }

  add(container: Container) {
    super.add(container);
    container.addChild(this.animationsContainer);
  }

  remove(container: Container) {
    super.remove(container);
    container.removeChild(this.animationsContainer);
    this.animationsContainer.children.forEach(
      (animation) => (animation.visible = false),
    );
  }

  move(direction: Direction, steps = 1): void {
    if (this.hasBomb) {
      this.bombPos.x = this.xpos;
      this.bombPos.y = this.ypos;
    }
    if (this.elevator) {
      this.ypos = Math.floor(this.ypos);
      // super.move(direction, 16);
      this.elevator = void 0;
      this.dstPos = {
        x: this.xpos + (direction === Direction.RIGHT ? 16 : -16),
        y: this.ypos,
      };
    } else {
      super.move(direction, steps);
    }
  }

  alignHorizTiles(offset = 0) {
    const { xpos, ypos } = this;
    const nx = Math.floor((xpos + 8) / 16) * 16 + offset;
    if (nx != xpos) {
      this.dstPos = {
        x: nx,
        y: ypos,
      };
    }
  }

  async tick(game: Game, direction?: Direction, lastDirection?: Direction) {
    if (this.dstPos) {
      if (this.moveTo(this.dstPos.x, this.dstPos.y, 1)) {
        this.dstPos = void 0;
      } else {
        return true;
      }
    } else if (game.level) {
      const level = game.level;
      let { xpos, ypos } = this;
      const x0 = xpos;
      const xc = xpos + 8;
      const x1 = xpos + 15;
      const y0 = ypos;
      const yc = ypos + 8;
      const y1 = ypos + 15;

      const xtile = Math.floor(xc / 16);
      const ytile = Math.floor(y0 / 16);
      const ytile1 = Math.floor(y1 / 16);

      const { material: overlapFloor } = game.level.getTileMaterial(
        xtile,
        ytile1,
      );

      // Check if we need to align fluffy to the floor
      if (
        [TileType.FLOOR, TileType.LEFT_BELT, TileType.RIGHT_BELT].includes(
          overlapFloor,
        )
      ) {
        this.set(this.xpos, ytile * 16);
        return;
      }

      const { material: floorType } = level.getTileMaterial(xtile, ytile + 1);

      // Check if there is a pipe under the player
      if ([TileType.PIPE, TileType.PIPE_END].includes(floorType)) {
        if (this.status !== Status.INSIDE_PIPE) {
          this.pixiSprite.visible = false;
          this.bomb.pixiSprite.visible = false;
          this.status = Status.INSIDE_PIPE;
          xpos = xtile * 16;
        }
        this.set(xpos, ypos + 2);
        return;
      } else if (this.status === Status.INSIDE_PIPE) {
        this.insidePipe = false;
        this.pixiSprite.visible = true;
        this.bomb.pixiSprite.visible = true;
      }

      if (floorType == TileType.RIGHT_BELT) {
        this.stop();
        this.set(xpos + 1, ypos);
        return;
      } else if (floorType == TileType.LEFT_BELT) {
        this.stop();
        this.set(xpos - 1, ypos);
        return;
      }

      // Check if there is floor under the player
      if (
        !isSolid(floorType) &&
        ![TileType.ROPE, TileType.ROPE_START].includes(floorType) &&
        !this.elevator
      ) {
        if (this.status === Status.BOUNCING) {
          if (this.fallCoord >= ypos + level.yroom * 16 * 11) {
            switch (lastDirection) {
              case Direction.RIGHT:
                this.dstPos = {
                  x: xpos + 16,
                  y: ypos,
                };
                break;
              case Direction.LEFT:
                this.dstPos = {
                  x: xpos - 16,
                  y: ypos,
                };
                break;
            }
            this.status = Status.STANDING;
            return;
          } else {
            this.set(xpos, ypos - 3);
          }
        } else {
          // Starts falling
          if (!this.falling) {
            this.falling = true;
            this.fallCoord = ypos + level.yroom * 16 * 11;
            this.alignHorizTiles();
          } else {
            this.set(xpos, ypos + 1);
          }
          this.stop();
          return;
        }
      } else {
        if (this.falling) {
          this.falling = false;
          if (floorType === TileType.TRAMPOLINE) {
            this.status = Status.BOUNCING;
            this.set(xpos, ypos - 1);
          } else if (ypos + level.yroom * 16 * 11 - this.fallCoord >= 32) {
            await this.deadFall(level);
            await game.handleDeath();
          }
          return;
        }
      }

      if (this.status == Status.GOING_TO_ROPE) {
        this.status = Status.IN_ROPE;
        this.move(Direction.UP, 0);
      }

      if (this.status !== Status.IN_ROPE && !direction && lastDirection) {
        if ([Direction.RIGHT, Direction.LEFT].includes(lastDirection)) {
          const { material } = level.getTileMaterial(xtile, ytile);
          if (material === TileType.ROPE) {
            this.status = Status.GOING_TO_ROPE;
            this.dstPos = {
              x: xtile * 16,
              y: ypos,
            };
            return;
          }
        }
      }

      if (direction) {
        if ([Direction.RIGHT, Direction.LEFT].includes(direction)) {
          if (canMoveSides(this, level, direction)) {
            // If we are in a ROPE we must leave the rope
            if (this.status == Status.IN_ROPE) {
              this.status = Status.STANDING;
              if (direction === Direction.RIGHT) {
                this.dstPos = {
                  x: xpos + 16,
                  y: ypos,
                };
                return;
              } else if (direction === Direction.LEFT) {
                this.dstPos = {
                  x: xpos - 16,
                  y: ypos,
                };
                return;
              }
            }
            this.move(direction);
          } else {
            this.stop();
          }
        }
        if (direction == Direction.UP) {
          const ytile = Math.floor(y1 / 16) - 1;
          const { material } = level.getTileMaterial(xtile, ytile);
          if (material == TileType.ROPE || material == TileType.ROPE_START) {
            this.status = Status.IN_ROPE;
            this.alignHorizTiles();
            this.move(direction);
          } else {
            this.stop();
          }
        }

        if (direction == Direction.DOWN) {
          if (floorType == TileType.ROPE || floorType == TileType.ROPE_START) {
            this.status = Status.IN_ROPE;
            this.alignHorizTiles();
            this.move(direction);
          } else {
            this.stop();
          }
        }
      } else {
        this.stop();
      }
    }
  }

  grabBomb() {
    this.hasBomb = true;
    this.bombPos.x = this.xpos;
    this.bombPos.y = this.ypos;
    this.bomb.add(this.container);
  }

  dropBomb(room: Room) {
    this.hasBomb = false;
    this.bombPos.x = this.xpos;
    this.bombPos.y = this.ypos;
    this.container.removeChild(this.bomb.container);

    if (this.bombTile.parent) {
      this.bombTile.parent.removeChild(this.bombTile);
    }

    room.container.addChild(this.bombTile);
    this.bombTile.visible = true;
    this.bombTile.position.x = (this.xpos / 16) * 16;
    this.bombTile.position.y = (this.ypos / 16) * 16;
    this.bombRoom = room;
  }

  // Currently when the bomb explodes in a room different from the one we are
  // viewing it is not played correctly.
  explodeBomb(level: Level) {
    // Run animations and play explosion sound
    let x = Math.floor((this.bombPos.x + 8) / 16) - 1;
    let y = Math.floor(this.bombPos.y / 16);

    this.bombAnimations.visible = true;
    this.bombAnimations.children.forEach((animation) => {
      const { material, room, tileIndex } = level.getTileMaterial(
        x,
        y,
        this.bombRoom,
      );
      if (material == TileType.WALL || material == TileType.BOMB_ACTIVE) {
        room.replaceTile(tileIndex, 0x00);
      }

      (<TileAnimation>animation).start({ x, y });

      bombExplosion.play();

      const x0 = x * 16 - 15;
      const x1 = x * 16;
      const y0 = this.bombPos.y - 2;
      const y1 = this.bombPos.y + 18;

      x += 1;

      if (room.parrots) {
        // Check if any parrot must die
        room.parrots.forEach((parrot) => {
          if (
            parrot.xpos >= x0 &&
            parrot.xpos <= x1 &&
            parrot.ypos >= y0 &&
            parrot.ypos <= y1
          ) {
            parrot.die(level);
          }
        });
      }

      // Check if player must die
      if (
        this.xpos >= x0 &&
        this.xpos < x1 &&
        this.ypos > y0 &&
        this.ypos < y1
      ) {
        this.die(level);
      }
    });

    this.bombTile.visible = false;
  }

  die(level: Level) {
    let x = Math.floor((this.xpos + 8) / 16) - 1;
    let y = Math.floor((this.ypos + 8) / 16);

    const { material } = level.getTileMaterial(x + 1, y);

    this.animationsContainer.visible = true;
    this.pixiSprite.visible = false;

    const deadAnimation =
      material == TileType.ROPE_START
        ? this.deadExplodeAnimationRope
        : this.deadExplodeAnimation;

    deadAnimation.start({ x: x + 1, y }, true);
  }

  suicide(level: Level) {
    let x = Math.floor((this.xpos + 8) / 16) - 1;
    let y = Math.floor((this.ypos + 8) / 16);

    const { material } = level.getTileMaterial(x + 1, y);

    this.animationsContainer.visible = true;
    this.bombAnimations.visible = true;
    this.pixiSprite.visible = false;

    bombExplosion.play();

    const deadAnimation =
      material == TileType.ROPE_START
        ? this.deadExplodeAnimationRope
        : this.deadExplodeAnimation;

    deadAnimation.start({ x: x + 1, y }, true);
    this.bombAnimations.children.forEach((animation) => {
      (<TileAnimation>animation).start({ x: x++, y });
    });
  }

  deadFall(level: Level) {
    let x = Math.floor((this.xpos + 8) / 16);
    let y = Math.floor((this.ypos + 8) / 16);

    const { material } = level.getTileMaterial(x, y);

    this.animationsContainer.visible = true;
    this.pixiSprite.visible = false;

    blood.play();

    const deadAnimation =
      material == TileType.ROPE_START
        ? this.deadFallAnimationRope
        : this.deadFallAnimation;

    deadAnimation.start({ x, y }, true);
    return new Promise<void>((resolve) => (deadAnimation.onComplete = resolve));
  }
}

function isSolid(material: TileType) {
  return material & 0x01;
}

const slack = 3;

const canMoveSides = (player: Sprite, level: Level, direction: Direction) => {
  let xtile;
  if (direction == Direction.RIGHT) {
    xtile = Math.floor(player.xpos / 16) + 1;
  } else {
    xtile = Math.floor((player.xpos + 15) / 16) - 1;
  }
  const ytile0 = Math.floor((player.ypos + slack) / 16);

  const { material } = level.getTileMaterial(xtile, ytile0);
  if (isSolid(material)) {
    return false;
  }

  // Instead of + 15 we use +12 to give some extra margin
  const ytile1 = Math.floor((player.ypos + (16 - slack)) / 16);
  {
    const { material } = level.getTileMaterial(xtile, ytile1);
    if (isSolid(material)) {
      return false;
    }
  }
  return true;
};
