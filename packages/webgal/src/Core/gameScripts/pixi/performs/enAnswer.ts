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
 * answer 表情：单图层，固定位置出现 1.5s，无移动，结束后自动卸载。
 *
 * 资源：将图片放到 `packages/webgal/public/game/tex/en_answer.png`
 * 调用：pixiInit; pixiPerform:enAnswer;
 */
const pixiEnAnswer = (
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

  const texture = PIXI.Texture.from('./game/tex/en_answer.png');
  const sprite = new PIXI.Sprite(texture);
  sprite.anchor.set(0.5);
  sprite.position.set(startX, startY);
  sprite.scale.set(scale);
  sprite.alpha = 1;
  container.addChild(sprite);

  let timeSec = 0;
  const blinkShowSec = 0.1;
  const blinkHideSec = 0.1;
  const blinkEndSec = blinkShowSec + blinkHideSec;

  const tickerFn = (delta: number) => {
    const dt = delta / 60;
    timeSec += dt;

    // 闪一下：显示 0.1s → 隐藏 0.1s → 显示剩余时间
    if (timeSec < blinkShowSec) {
      sprite.alpha = 1;
    } else if (timeSec < blinkEndSec) {
      sprite.alpha = 0;
    } else {
      sprite.alpha = 1;
    }

    const p = clamp01(timeSec / durationSec);
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

registerPerform('enAnswer', {
  fg: () => {
    // 固定初始位置（强约定）：以后每个特效都用这个坐标
    const startX = SCREEN_CONSTANTS.width * 0.4;
    const startY = SCREEN_CONSTANTS.height * 0.25;

    // 持续时间（秒）：出现 1.5s
    const durationSec = 1.5;

    const scale = 1.0;

    return pixiEnAnswer('en-answer-foreground-ticker', 'foreground', startX, startY, durationSec, scale);
  },
});
