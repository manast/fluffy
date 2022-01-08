import { Texture, FORMATS, SCALE_MODES } from "pixi.js";

const width = 8;
const height = 8;

/**
 * 8x8 Font.
 *
 */
export class Font {
  data: number[];
  textures: Texture[] = [];

  constructor(fontData: string) {
    this.data = fontData.split(/\s+/).map((hex) => parseInt(hex, 16));

    const data = this.data;

    for (let t = 0; t < data.length / 8; t++) {
      const buffer: Uint8Array = new Uint8Array(width * height * 4);

      // Convert from MSX pixel pattern
      let offset = 0;
      for (let i = 0; i < 8; i++) {
        let row = data[t * 8 + i];

        // Consume bits and generate row of pixels
        for (let bit = 7; bit >= 0; bit--) {
          const pixel = row & 0x01;

          row >>= 1;
          buffer[offset + bit] = pixel ? 0xff : 0x00;
        }
        offset += 8;
      }

      this.textures.push(
        Texture.fromBuffer(new Uint8Array(buffer.buffer), 8, 8, {
          format: FORMATS.LUMINANCE,
        }),
      );
    }
  }
}
