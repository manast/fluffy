import { Sprite } from "./sprite";
import { Direction } from "../enums/direction";
import { Player } from "./player";

const pattern = `3F 7F 7F 00 00 00 00 00
00 00 00 00 00 00 00 00
FC FE FE 00 00 00 00 00
00 00 00 00 00 00 00 00`;

export class Elevator extends Sprite {
  direction: Direction;

  constructor(
    private start: { x: number; y: number },
    private end: { x: number; y: number },
  ) {
    super({
      [Direction.LEFT]: [[{ pattern, color: 0x0d }]],
      [Direction.RIGHT]: [[{ pattern, color: 0x0d }]],
      [Direction.UP]: [[{ pattern, color: 0x0d }]],
      [Direction.DOWN]: [[{ pattern, color: 0x0d }]],
    });

    this.set(start.x, start.y);

    this.direction = Direction.UP;
  }

  tick(player: Player) {
    let { xpos, ypos } = player;

    const delta = ypos - (this.ypos - 16);

    if (xpos == this.xpos && Math.abs(delta) <= 4) {
      player.elevator = this;
    } else if (player.elevator == this) {
      player.elevator = void 0;
    }

    // Move the elevator from start to finish and back
    if (this.ypos == this.end.y) {
      this.direction = Direction.DOWN;
    } else if (this.ypos == this.start.y) {
      this.direction = Direction.UP;
    }

    this.move(this.direction, 0.5);

    if (player.elevator == this) {
      player.set(this.xpos, this.ypos - 16);
    }
  }
}
