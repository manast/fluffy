import { Texture, Sprite, Container, FORMATS, SCALE_MODES } from "pixi.js";

import { Font } from "./font";

const text2font = (text: string) =>
  text
    .toUpperCase()
    .split("")
    .map((char) => char.charCodeAt(0));

export class Text extends Container {
  sprites: Sprite[] = [];
  text: string;

  constructor(private font: Font, text: string, colors?: number[]) {
    super();
    this.update(text);
  }

  update(text: string) {
    this.text = text;
    let i = 0;
    let numChars = 0;
    text2font(text).forEach((char) => {
      if (char >= 45) {
        const texture = this.font.textures[char - (65 - 21)];
        const sprite = this.sprites[numChars] || new Sprite();
        sprite.texture = texture;
        sprite.position.x = i * 8 + 1;

        if (char >= 65) {
          sprite.position.y = 0;
        } else {
          sprite.position.y = -1;
        }

        if (!this.sprites[i]) {
          this.addChild(sprite);
          this.sprites.push(sprite);
        }
        numChars++;
      }
      i++;
    });

    const charLen = numChars;
    while (numChars < this.sprites.length) {
      const sprite = this.sprites[numChars++];
      this.removeChild(sprite);
      sprite.destroy();
    }

    this.sprites.length = charLen;
  }

  add(container: Container) {
    container.addChild(this);
  }

  remove(container: Container) {
    container.removeChild(this);
  }
}
