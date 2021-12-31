import { Text, Container } from "pixi.js";

export class ScoreBar {
  bar: Text;
  constructor() {
    this.bar = new Text(`Carrots: 00 Lives: 00 Bomb: 00`, {
      fontFamily: "Arial",
      fontSize: 12,
      fill: 0xffffff,
      align: "center",
    });
    this.bar.position.set(0, 11 * 16);
  }

  add(container: Container) {
    container.addChild(this.bar);
  }

  update(carrots: number, lives: number, bomb: number) {
    this.bar.text = `Carrots: ${carrots} Lives: ${lives}, Bomb: ${bomb}`;
  }
}
