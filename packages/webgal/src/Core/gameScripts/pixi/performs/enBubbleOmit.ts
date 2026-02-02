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
 * Omit（省略号）气泡表情：4 图层（Bubble + A/B/C 三个点）。
 *
 * - B 在气泡中心
 * - A 在 B 左侧，C 在 B 右侧
 * - A/B/C 使用同一张图片，但出现顺序为 A -> B -> C
 * - 间隔 0.45s
 * - A/B/C 都出现后保持 1s，然后整体淡出
 *
 * 资源：
 * - 气泡：`packages/webgal/public/game/tex/Bubble.png`
 * - 点图（A/B/C 共用）：`packages/webgal/public/game/tex/en_omit.png`
 *
 * 调用：pixiInit; pixiPerform:enBubbleOmit;
 */
const pixiOmit = (
  tickerKey: string,
  containerType: ContainerType,
  startX: number,
  startY: number,
  bubbleScale: number,
  dotScale: number,
  dotOffsetPx: number,
  appearIntervalSec: number,
  holdAfterAllSec: number,
  fadeOutSec: number,
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

  // 上层：A / B / C（三个点共用同一张图）
  const dotTexture = PIXI.Texture.from('./game/tex/en_omit.png');

  const dotA = new PIXI.Sprite(dotTexture);
  dotA.anchor.set(0.5);
  dotA.position.set(startX - dotOffsetPx, startY);
  dotA.scale.set(dotScale);
  dotA.alpha = 0;
  container.addChild(dotA);

  const dotB = new PIXI.Sprite(dotTexture);
  dotB.anchor.set(0.5);
  dotB.position.set(startX, startY);
  dotB.scale.set(dotScale);
  dotB.alpha = 0;
  container.addChild(dotB);

  const dotC = new PIXI.Sprite(dotTexture);
  dotC.anchor.set(0.5);
  dotC.position.set(startX + dotOffsetPx, startY);
  dotC.scale.set(dotScale);
  dotC.alpha = 0;
  container.addChild(dotC);

  // 时间轴：A(0) -> B(0.45) -> C(0.9) -> hold(1.0) -> fadeOut
  const cAppearAt = appearIntervalSec * 2;
  const fadeStartAt = cAppearAt + holdAfterAllSec;
  const endAt = fadeStartAt + fadeOutSec;

  let timeSec = 0;

  const tickerFn = (delta: number) => {
    const dt = delta / 60;
    timeSec += dt;

    // 分段出现（A -> B -> C）
    dotA.alpha = timeSec >= 0 ? 1 : 0;
    dotB.alpha = timeSec >= appearIntervalSec ? 1 : 0;
    dotC.alpha = timeSec >= cAppearAt ? 1 : 0;

    // 整体淡出（Bubble + A/B/C）
    if (timeSec >= fadeStartAt) {
      const fp = clamp01((timeSec - fadeStartAt) / fadeOutSec);
      const fadeAlpha = 1 - fp;

      bubbleSprite.alpha = fadeAlpha;
      dotA.alpha = fadeAlpha;
      dotB.alpha = fadeAlpha;
      dotC.alpha = fadeAlpha;
    }

    if (timeSec >= endAt) {
      bubbleSprite.alpha = 0;
      dotA.alpha = 0;
      dotB.alpha = 0;
      dotC.alpha = 0;
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

registerPerform('enBubbleOmit', {
  fg: () => {
    // 固定初始位置（强约定）：以后每个特效都用这个坐标
    const startX = SCREEN_CONSTANTS.width * 0.4;
    const startY = SCREEN_CONSTANTS.height * 0.25;

    const bubbleScale = 1.0;
    const dotScale = 1.0;

    // 点左右间距（像素）：控制 A/B/C 的横向间隔
    const dotOffsetPx = 40;

    // 0.45s 间隔出现；全部出现后保持 1s；末尾淡出
    const appearIntervalSec = 0.45;
    const holdAfterAllSec = 1.0;
    const fadeOutSec = 0.25;

    return pixiOmit(
      'omit-foreground-ticker',
      'foreground',
      startX,
      startY,
      bubbleScale,
      dotScale,
      dotOffsetPx,
      appearIntervalSec,
      holdAfterAllSec,
      fadeOutSec,
    );
  },
});
