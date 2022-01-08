import { Texture, FORMATS } from "pixi.js";
import { MSXPalette } from "../data/palette";

const width = 16;
const height = 16;

/**
 * 16x16 Tiles in MSX format. Pixel data followed by color data.
 *
 */
export class Tile {
  data: number[];
  texture: Texture;

  constructor(tileData: string) {
    this.data = tileData.split(/\s+/).map((hex) => parseInt(hex, 16));
    this.texture = this.getTexture();
  }

  private getTexture(): Texture {
    const buffer: Uint32Array = new Uint32Array(width * height * 4);
    const data = this.data;
    const startOffsets = [0, 8, 16 * 8, 16 * 8 + 8];

    // Convert from MSX pixel pattern
    for (let c = 0; c < 4; c++) {
      let offset = startOffsets[c];

      for (let i = c * 8; i < c * 8 + 8; i++) {
        const color = data[i + 32];
        let row = data[i];

        const fgColor = MSXPalette[color >> 4];
        const bgColor = MSXPalette[color & 0x0f];

        // Consume bits and generate row of pixels
        for (let bit = 7; bit >= 0; bit--) {
          const pixel = row & 0x01;

          row >>= 1;
          buffer[offset + bit] = pixel ? fgColor : bgColor;
        }
        offset += 16;
      }
    }

    // RGBA
    return Texture.fromBuffer(new Uint8Array(buffer.buffer), 16, 16, {
      format: FORMATS.RGBA,
    });
  }
}
