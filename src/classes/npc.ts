import { Sprite, SpriteData } from "./sprite";
import { Direction } from "../enums/direction";

/**
 * Non Player Character base class.
 */
export class Npc extends Sprite {
  private stepIndex: number = 0;

  constructor(
    animations: { [index: string]: SpriteData[][] },
    private steps: number[],
    private stepSize = 1,
  ) {
    super(animations);

    this.set(steps[0] & 0xf0, (steps[0] & 0x0f) << 4);
  }

  tick() {
    // Get current step index.
    let { stepIndex: index } = this;

    // Get current pos
    const cx = this.steps[index] & 0xf0;
    const cy = (this.steps[index] & 0x0f) << 4;

    // Get next pos
    index = (index + 1) % this.steps.length;
    const nx = this.steps[index] & 0xf0;
    const ny = (this.steps[index] & 0x0f) << 4;

    // increase step index mod steps legth
    if (this.moveTo(nx, ny, this.stepSize)) {
      this.stepIndex = (this.stepIndex + 1) % this.steps.length;
    }
  }
}
