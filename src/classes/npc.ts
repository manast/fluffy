import { Sprite, SpriteData } from "./sprite";
import { Direction } from "../enums/direction";

/**
 * Non player character
 */
export class Npc extends Sprite {
  constructor(animations: { [index: string]: SpriteData[][] }) {
    super(animations);
  }
}
