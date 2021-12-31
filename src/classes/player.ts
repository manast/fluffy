import { Container } from "pixi.js";

import { Sprite } from "./sprite";
import { Direction } from "../enums/direction";
import { Bomb } from "./bomb";
import { TileAnimation } from "./tile-animation";
import { Level } from "./level";
import { TileType } from "../enums/tile-type";
import { Elevator } from "./elevator";

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

export class Player extends Sprite {
  bomb: Bomb = new Bomb();
  bombAnimations: TileAnimation[];
  deadExplodeAnimation: TileAnimation;
  deadFallAnimation: TileAnimation;
  deadExplodeAnimationRope: TileAnimation;
  deadFallAnimationRope: TileAnimation;

  hasBomb = false;
  bombPos: { x: number; y: number } = { x: 0, y: 0 };
  elevator: Elevator | undefined;

  constructor() {
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

    this.bombAnimations = [
      new TileAnimation([24, 25, 26, 27]),
      new TileAnimation([24, 25, 26, 27]),
      new TileAnimation([24, 25, 26, 27]),
    ];

    this.deadExplodeAnimation = new TileAnimation([37, 38, 39, 40, 41]);
    this.deadFallAnimation = new TileAnimation([40, 41]);

    this.deadExplodeAnimationRope = new TileAnimation([37, 38, 39, 40, 42]);
    this.deadFallAnimationRope = new TileAnimation([40, 42]);
  }

  add(container: Container) {
    super.add(container);
    this.bombAnimations.forEach((animation) => animation.add(container));
    this.deadExplodeAnimation.add(container);
    this.deadFallAnimation.add(container);
    this.deadExplodeAnimationRope.add(container);
    this.deadFallAnimationRope.add(container);
  }

  move(direction: Direction): void {
    if (this.hasBomb) {
      this.bombPos.x = this.xpos;
      this.bombPos.y = this.ypos;
    }
    if (this.elevator) {
      this.ypos = Math.floor(this.ypos);
      super.move(direction, 16);
    } else {
      super.move(direction);
    }
  }

  grabBomb() {
    this.hasBomb = true;
    this.bomb.add(this.container);
  }

  dropBomb() {
    this.hasBomb = false;
    this.container.removeChild(this.bomb.container);
  }

  explodeBomb(level: Level) {
    // Run animations and play explosion sound
    let x = Math.floor((this.bombPos.x + 8) / 16) - 1;
    let y = Math.floor(this.bombPos.y / 16);

    this.bombAnimations.forEach((animation) => {
      const { material, room, tileIndex } = level.getTileMaterial(x, y);
      if (material == TileType.WALL || material == TileType.BOMB_ACTIVE) {
        room.replaceTile(tileIndex, 0x00);
      }
      animation.play({ x: x++, y });
    });

    // Kill Enemies or Player
  }

  suicide(level: Level) {
    let x = Math.floor((this.xpos + 8) / 16) - 1;
    let y = Math.floor((this.ypos + 8) / 16);

    const { material } = level.getTileMaterial(x + 1, y);

    this.pixiSprite.visible = false;

    const deadAnimation =
      material == TileType.ROPE_START
        ? this.deadExplodeAnimationRope
        : this.deadExplodeAnimation;

    deadAnimation.play({ x: x + 1, y }, true);
    this.bombAnimations.forEach((animation) => {
      animation.play({ x: x++, y });
    });
  }

  deadFall(level: Level) {
    let x = Math.floor((this.xpos + 8) / 16);
    let y = Math.floor((this.ypos + 8) / 16);

    const { material } = level.getTileMaterial(x, y);

    //this.pixiSprite.visible = false;

    const deadAnimation =
      material == TileType.ROPE_START
        ? this.deadFallAnimationRope
        : this.deadFallAnimation;

    deadAnimation.play({ x, y }, true);
  }
}
