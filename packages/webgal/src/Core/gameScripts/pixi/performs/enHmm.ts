/* eslint-disable max-params */
import * as PIXI from 'pixi.js';
import { registerPerform } from '@/Core/util/pixiPerformManager/pixiPerformManager';
import { WebGAL } from '@/Core/WebGAL';
import { SCREEN_CONSTANTS } from '@/Core/util/constants';

type ContainerType = 'foreground' | 'background';

function clamp01(v: number): number {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

function easeOutCubic(t: number): number {
  const u = 1 - t;
  return 1 - u * u * u;
}

/**
 * “嗯哼”表情：固定位置出现 → 左移一段距离 → 最后淡出消失（alpha -> 0）。
 *
 * 资源：将图片放到 `packages/webgal/public/game/tex/en_hmm.png`
 * 调用：pixiInit; pixiPerform:enHmm;
 */
const pixiEnHmm = (
  tickerKey: string,
  containerType: ContainerType,
  startX: number,
  startY: number,
  moveLeftPx: number,
  durationSec: number,
  scale: number,
) => {
  const pixiStage = WebGAL.gameplay.pixiStage!;

  const effectsContainer =
    containerType === 'foreground' ? pixiStage.foregroundEffectsContainer : pixiStage.backgroundEffectsContainer;

  const container = new PIXI.Container();
  effectsContainer.addChild(container);

  const texture = PIXI.Texture.from('./game/tex/en_hmm.png');
  const sprite = new PIXI.Sprite(texture);
  sprite.anchor.set(0.5);
  sprite.position.set(startX, startY);
  sprite.scale.set(scale);
  sprite.alpha = 1;
  container.addChild(sprite);
  const fadeStart = 0.75;
  let timeSec = 0;

  const tickerFn = (delta: number) => {
    const dt = delta / 60;
    timeSec += dt;

    const p = clamp01(timeSec / durationSec);
    const e = easeOutCubic(p);

    sprite.x = startX - moveLeftPx * e;
    if (p < fadeStart) {
      sprite.alpha = 1;
    } else {
      const fp = clamp01((p - fadeStart) / (1 - fadeStart));
      sprite.alpha = 1 - fp;
    }

    if (p >= 1) {
      sprite.alpha = 0;
      pixiStage.removeAnimation(tickerKey);
    }
  };

  pixiStage.registerAnimation(
    {
      setStartState: () => {},
      setEndState: () => {},
      tickerFunc: tickerFn,
    },
    tickerKey,
  );

  return { container, tickerKey };
};

registerPerform('enHmm', {
  fg: () => {
    // 初始位置（以屏幕左上角为原点）：
    // - startX 越大越靠右；startY 越大越靠下
    const startX = SCREEN_CONSTANTS.width * 0.45;
    const startY = SCREEN_CONSTANTS.height * 0.25;

    // 左移距离（像素）：值越大移动得越远（向左）。
    const moveLeftPx = 65;

    // 持续时间（秒）：总动画时长，越大越慢。
    const durationSec = 1.5;

    const scale = 1.0;

    return pixiEnHmm('en-hmm-foreground-ticker', 'foreground', startX, startY, moveLeftPx, durationSec, scale);
  },
});
