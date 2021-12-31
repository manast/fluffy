import { Sprite } from "./sprite";
import { Direction } from "../enums/direction";

const pattern = `00 00 00 00 00 00 03 0F
0F 1F 1F 1F 1F 0F 0F 03
00 00 00 00 00 00 C0 F0
F0 F8 F8 F8 F8 F0 F0 C0`;

export class Bomb extends Sprite {
  constructor() {
    super({
      [Direction.LEFT]: [[{ pattern, color: 0x06 }]],
      [Direction.RIGHT]: [[{ pattern, color: 0x06 }]],
      [Direction.UP]: [[{ pattern, color: 0x06 }]],
      [Direction.DOWN]: [[{ pattern, color: 0x06 }]],
    });
  }
}
