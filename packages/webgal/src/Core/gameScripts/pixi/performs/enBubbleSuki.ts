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
 * suki 气泡表情：双图层（Bubble + 中间图片），固定位置出现 1.5s，无移动，结束后自动卸载。
 *
 * 资源：
 * - 气泡：`packages/webgal/public/game/tex/Bubble.png`
 * - 中间图：`packages/webgal/public/game/tex/en_suki.png`
 *
 * 调用：pixiInit; pixiPerform:enBubbleSuki;
 */
const pixiEnBubbleSuki = (
  tickerKey: string,
  containerType: ContainerType,
  startX: number,
  startY: number,
  durationSec: number,
  bubbleScale: number,
  centerScale: number,
) => {
  const pixiStage = WebGAL.gameplay.pixiStage!;

  const effectsContainer =
    containerType === 'foreground' ? pixiStage.foregroundEffectsContainer : pixiStage.backgroundEffectsContainer;

  const container = new PIXI.Container();
  effectsContainer.addChild(container);

  // 底层：Bubble
  const bubbleTexture = PIXI.Texture.from('./game/tex/Bubble.png');
  const bubbleSprite = new PIXI.Sprite(bubbleTexture);
  bubbleSprite.anchor.set(0.5);
  bubbleSprite.position.set(startX, startY);
  bubbleSprite.scale.set(bubbleScale);
  bubbleSprite.alpha = 1;
  container.addChild(bubbleSprite);

  // 上层：中间图片（suki）
  const centerTexture = PIXI.Texture.from('./game/tex/en_suki.png');
  const centerSprite = new PIXI.Sprite(centerTexture);
  centerSprite.anchor.set(0.5);
  centerSprite.position.set(startX, startY);
  centerSprite.scale.set(centerScale);
  centerSprite.alpha = 1;
  container.addChild(centerSprite);

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
    bubbleSprite.alpha = fadeAlpha;
    centerSprite.alpha = fadeAlpha;

    if (p >= 1) {
      // 保持与单图层一致：到点隐藏并卸载 ticker
      bubbleSprite.alpha = 0;
      centerSprite.alpha = 0;
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

registerPerform('enBubbleSuki', {
  fg: () => {
    // 固定初始位置（强约定）：以后每个特效都用这个坐标
    const startX = SCREEN_CONSTANTS.width * 0.4;
    const startY = SCREEN_CONSTANTS.height * 0.25;

    // 持续时间（秒）：出现 1.5s
    const durationSec = 1.5;

    // 缩放：
    // - bubbleScale 控制气泡大小
    // - centerScale 控制中间图大小（通常略小于气泡）
    const bubbleScale = 1.0;
    const centerScale = 1.0;

    return pixiEnBubbleSuki(
      'en-bubble-suki-foreground-ticker',
      'foreground',
      startX,
      startY,
      durationSec,
      bubbleScale,
      centerScale,
    );
  },
});
