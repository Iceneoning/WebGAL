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

/**
 * sweat 表情：单图层，固定位置出现 1.5s，无移动，结束后自动卸载。
 *
 * 资源：将图片放到 `packages/webgal/public/game/tex/en_sweat.png`
 * 调用：pixiInit; pixiPerform:enSweat;
 */
const pixiEnSweat = (
  tickerKey: string,
  containerType: ContainerType,
  startX: number,
  startY: number,
  durationSec: number,
  scale: number,
) => {
  const pixiStage = WebGAL.gameplay.pixiStage!;

  const effectsContainer =
    containerType === 'foreground' ? pixiStage.foregroundEffectsContainer : pixiStage.backgroundEffectsContainer;

  const container = new PIXI.Container();
  effectsContainer.addChild(container);

  const texture = PIXI.Texture.from('./game/tex/en_sweat.png');
  const sprite = new PIXI.Sprite(texture);
  sprite.anchor.set(0.5);
  sprite.position.set(startX, startY);
  sprite.scale.set(scale);
  sprite.alpha = 1;
  container.addChild(sprite);

  let timeSec = 0;
  // 末尾淡出时间（秒）：让消失不那么突兀
  const fadeOutSec = 0.25;

  const tickerFn = (delta: number) => {
    const dt = delta / 60;
    timeSec += dt;

    const p = clamp01(timeSec / durationSec);

    // 末尾淡出：最后 fadeOutSec 内 alpha 从 1 -> 0
    const remainSec = durationSec - timeSec;
    const fadeAlpha = remainSec <= fadeOutSec ? clamp01(remainSec / fadeOutSec) : 1;
    sprite.alpha = fadeAlpha;

    if (p >= 1) {
      sprite.alpha = 0;
      container.visible = false;
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

registerPerform('enSweat', {
  fg: () => {
    // 固定初始位置（强约定）：以后每个特效都用这个坐标
    const startX = SCREEN_CONSTANTS.width * 0.425;
    const startY = SCREEN_CONSTANTS.height * 0.25;

    // 持续时间（秒）：出现 1.5s
    const durationSec = 1.5;

    const scale = 1.0;

    return pixiEnSweat('en-sweat-foreground-ticker', 'foreground', startX, startY, durationSec, scale);
  },
});
