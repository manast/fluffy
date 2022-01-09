import { Container, Graphics, Sprite } from "pixi.js";
import { MSXPalette } from "../data/palette";
import { Font } from "./font";
import { Text } from "./text";
import { fromPalette } from "../shaders/palette";
import { font2 as barData } from "../data/font";
import { font as fontData } from "../data/font";

export class ScoreBar {
  sep: Graphics;
  font: Font;
  score: Text;
  time: Text;
  bomb: Text;
  lives: Text;
  carrots: Text;

  constructor() {
    this.sep = new Graphics();
    this.sep.beginFill(MSXPalette[13]);

    this.sep.drawRect(0, 11 * 16 + 1, 16 * 16, 1);
    this.sep.position.set(0, 0);

    this.font = new Font(barData);

    const font = new Font(fontData);
    this.score = new Text(font, "000000");
    this.time = new Text(font, "000");
    this.bomb = new Text(font, "00");
    this.lives = new Text(font, "3");
    this.carrots = new Text(font, "00");
  }

  add(container: Container) {
    container.addChild(this.sep);

    const rainbowFilter = fromPalette([
      0x01, 0xc1, 0x21, 0x31, 0xb1, 0x71, 0x51, 0x41,
    ]);

    const bombTextFilter = fromPalette([
      0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51,
    ]);

    const bombIconFilter = fromPalette([
      0x81, 0x81, 0x81, 0x81, 0x81, 0x81, 0x81, 0x81,
    ]);

    const carrotIconFilter = fromPalette([
      0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61,
    ]);

    const carrotTextFilter = fromPalette([
      0x31, 0x31, 0x31, 0x31, 0x31, 0x31, 0x31, 0x31,
    ]);

    const playerIconFilter = fromPalette([
      0x41, 0x41, 0xf4, 0x41, 0x41, 0x41, 0x41, 0x41,
    ]);

    const playerTextFilter = fromPalette([
      0x71, 0x71, 0x71, 0x71, 0x71, 0x71, 0x71, 0x71,
    ]);

    let i = 0;
    for (; i < 5; i++) {
      const texture = this.font.textures[i];
      const sprite = new Sprite(texture);
      sprite.position.x = i * 8 + 1;
      sprite.position.y = 11 * 16 + 6;
      sprite.filters = [rainbowFilter];
      container.addChild(sprite);
    }

    this.score.filters = [rainbowFilter];
    container.addChild(this.score);
    this.score.position.x = i * 8 + 1;
    this.score.position.y = 11 * 16 + 6;

    i += this.score.text.length + 1;

    for (; i < 16; i++) {
      const texture = this.font.textures[i];
      const sprite = new Sprite(texture);
      sprite.position.x = i * 8 + 1;
      sprite.position.y = 11 * 16 + 6;
      sprite.filters = [rainbowFilter];
      container.addChild(sprite);
    }

    this.time.filters = [rainbowFilter];
    container.addChild(this.time);
    this.time.position.x = i * 8 + 1;
    this.time.position.y = 11 * 16 + 6;
    i += this.time.text.length + 1;

    for (; i < 21; i++) {
      const texture = this.font.textures[i];
      const sprite = new Sprite(texture);
      sprite.position.x = i * 8 + 1;
      sprite.position.y = 11 * 16 + 6;
      sprite.filters = [bombIconFilter];
      container.addChild(sprite);
    }

    this.bomb.filters = [bombTextFilter];
    container.addChild(this.bomb);
    this.bomb.position.x = i * 8 + 1;
    this.bomb.position.y = 11 * 16 + 6;
    i += this.bomb.text.length + 1;

    for (; i < 25; i++) {
      const texture = this.font.textures[i];
      const sprite = new Sprite(texture);
      sprite.position.x = i * 8 + 1;
      sprite.position.y = 11 * 16 + 6;
      sprite.filters = [carrotIconFilter];
      container.addChild(sprite);
    }

    this.carrots.filters = [carrotTextFilter];
    container.addChild(this.carrots);
    this.carrots.position.x = i * 8 + 1;
    this.carrots.position.y = 11 * 16 + 6;
    i += this.carrots.text.length + 1;

    for (; i < 29; i++) {
      const texture = this.font.textures[i];
      const sprite = new Sprite(texture);
      sprite.position.x = i * 8 + 1;
      sprite.position.y = 11 * 16 + 6;
      sprite.filters = [playerIconFilter];
      container.addChild(sprite);
    }

    this.lives.filters = [playerTextFilter];
    container.addChild(this.lives);
    this.lives.position.x = i * 8 + 1;
    this.lives.position.y = 11 * 16 + 6;
    i += this.lives.text.length + 1;
  }

  update({
    score,
    time,
    carrots,
    lives,
    bomb,
  }: {
    score?: number;
    time?: number;
    carrots?: number;
    lives?: number;
    bomb?: number;
  }) {
    score && this.score.update(`${score}`.padStart(6, "0"));
    time && this.time.update(`${time}`.padStart(3, "0"));
    lives && this.lives.update(`${lives}`);
    if (typeof bomb !== "undefined") {
      this.bomb.update(`${Math.round(bomb / 100)}`.padStart(2, "0"));
    }
    carrots && this.carrots.update(`${carrots}`.padStart(2, "0"));
  }
}
