import { Application } from "pixi.js";
import { Game } from "./classes/game";

import "./style.css";

declare const VERSION: string;

const gameWidth = 256;
const gameHeight = 192;

console.log(`Welcome to Fluffy! ${VERSION}`);

const app = new Application({
  backgroundColor: 0x0,
  width: gameWidth,
  height: gameHeight,
});

window.onload = async (): Promise<void> => {
  document.body.appendChild(app.view);

  resizeCanvas();

  app.stage.interactive = true;

  const game = new Game(app);
  await game.start();
};

function resizeCanvas(): void {
  const resize = () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
    app.stage.scale.x = window.innerWidth / gameWidth;
    app.stage.scale.y = window.innerHeight / gameHeight;
  };

  resize();

  window.addEventListener("resize", resize);
}
