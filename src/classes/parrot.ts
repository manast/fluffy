import { Container } from "pixi.js";
import { Npc } from "./npc";
import { Direction } from "../enums/direction";
import { TileAnimation } from "./tile-animation";
import { Level } from "./level";
import { TileType } from "../enums/tile-type";

/**
 * Parrot
 */
const parrot = [
  `00 00 01 03 03 03 03 07
07 07 07 07 03 00 00 00
00 00 C0 80 80 C0 C0 C0
E0 F0 F0 F0 E0 00 00 00`,

  `00 00 08 0C 04 20 18 08
20 18 08 00 0C 11 03 07
00 00 00 60 58 3C 3C 04
00 00 00 00 00 C0 F8 E0`,

  `00 00 08 0C 04 20 18 08
20 18 08 00 0C 11 03 00
00 00 00 60 58 3C 3C 04
00 00 00 00 00 C0 E0 F0`,

  `00 00 03 01 01 03 03 03
07 0F 0F 0F 07 00 00 00
00 00 80 C0 C0 C0 C0 E0
E0 E0 E0 E0 C0 00 00 00`,

  `00 00 00 06 1A 3C 3C 20
00 00 00 00 00 03 1F 07
00 00 10 30 20 04 18 10
04 18 10 00 30 88 C0 E0`,

  `00 00 00 06 1A 3C 3C 20
00 00 00 00 00 03 07 0F
00 00 10 30 20 04 18 10
04 18 10 00 30 88 C0 00`,

  `00 00 03 06 07 06 07 0E
 0E 0F 0E 0E 07 00 00 00
 00 00 80 C0 C0 C0 C0 E0
 E0 E0 E0 E0 C0 00 00 00`,

  `00 00 00 01 00 01 00 01
 01 00 01 01 00 07 00 01
 00 00 00 00 00 00 00 00
 00 00 00 00 00 80 80 C0`,

  `00 00 00 01 00 01 00 01
 01 00 01 01 00 03 02 07
 00 00 00 00 00 00 00 00
 00 00 00 00 00 C0 00 00`,

  `03 0F 0F 1F 1F 1F 1F 0F
 0F 03 00 00 00 00 00 00
 C0 F0 F0 F8 F8 F8 F8 F0
 F0 C0 00 00 00 00 00 00`,

  `3F 7F 7F 00 00 00 00 00
 00 00 00 00 00 00 00 00
 FC FE FE 00 00 00 00 00
 00 00 00 00 00 00 00 00`,
];
export class Parrot extends Npc {
  dieAnimation: TileAnimation;
  dieAnimationRope: TileAnimation;
  animationsContainer = new Container();
  dead = false;

  constructor(steps: number[]) {
    super(
      {
        [Direction.RIGHT]: [
          [
            { pattern: parrot[0], color: 0x2 },
            { pattern: parrot[1], color: 0xb },
          ],
          [
            { pattern: parrot[0], color: 0x2 },
            { pattern: parrot[2], color: 0xb },
          ],
        ],
        [Direction.LEFT]: [
          [
            { pattern: parrot[3], color: 0x2 },
            { pattern: parrot[4], color: 0xb },
          ],
          [
            { pattern: parrot[3], color: 0x2 },
            { pattern: parrot[5], color: 0xb },
          ],
        ],
        [Direction.UP]: [
          [
            { pattern: parrot[6], color: 0x2 },
            { pattern: parrot[7], color: 0xb },
          ],
          [
            { pattern: parrot[6], color: 0x2 },
            { pattern: parrot[8], color: 0xb },
          ],
        ],
        [Direction.DOWN]: [
          [
            { pattern: parrot[6], color: 0x2 },
            { pattern: parrot[7], color: 0xb },
          ],
          [
            { pattern: parrot[6], color: 0x2 },
            { pattern: parrot[8], color: 0xb },
          ],
        ],
      },
      steps,
    );

    this.dieAnimation = new TileAnimation([33, 34, 35, 36, 31]);
    this.dieAnimationRope = new TileAnimation([33, 34, 35, 36, 32]);

    this.animationsContainer.addChild(this.dieAnimation, this.dieAnimationRope);
  }

  add(container: Container) {
    super.add(container);
    container.addChild(this.animationsContainer);
  }

  die(level: Level) {
    let x = Math.floor((this.xpos + 8) / 16);
    let y = Math.floor((this.ypos + 8) / 16);

    const { material } = level.getTileMaterial(x, y);

    this.animationsContainer.visible = true;
    this.pixiSprite.visible = false;

    const deadAnimation =
      material == TileType.ROPE_START
        ? this.dieAnimationRope
        : this.dieAnimation;

    deadAnimation.start({ x, y }, true);
    this.dead = true;
    return new Promise<void>((resolve) => (deadAnimation.onComplete = resolve));
  }
}
