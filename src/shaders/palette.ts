import { Filter, Texture, FORMATS, SCALE_MODES } from "pixi.js";
import { MSXPalette } from "../data/palette";

// Inspiration: https://gamedev.stackexchange.com/questions/43294/creating-a-retro-style-palette-swapping-effect-in-opengl/43313#43313
const shader = `
varying vec2 vTextureCoord;
uniform sampler2D palette;
uniform sampler2D uSampler;

void main(){
   // Get bit pattern
   vec4 pattern = texture2D(uSampler, vTextureCoord);
   gl_FragColor = texture2D(palette, vec2( vTextureCoord.y * 2.0 + 0.09, pattern.r ));
}
`;

export const fromPalette = (colors: number[]) => {
  let bg: number[] = [],
    fg: number[] = [];

  colors.forEach((color) => {
    bg.push(color & 0x0f);
    fg.push(color >> 4);
  });

  bg = bg.concat(fg);

  const data = new Uint32Array(bg.map((index) => MSXPalette[index]));

  const paletteTexture = Texture.fromBuffer(new Uint8Array(data.buffer), 8, 2, {
    format: FORMATS.RGBA,
    scaleMode: SCALE_MODES.NEAREST,
  });
  return new Filter(void 0, shader, {
    palette: paletteTexture,
  });
};
