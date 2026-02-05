import { useEffect, useMemo, useRef, useCallback } from 'react';
import { useGesture } from '@use-gesture/react';
import './DomeGallery.css';

type ImageItem = string | { src: string; alt?: string };

type DomeGalleryProps = {
  images?: ImageItem[];
  fit?: number;
  minRadius?: number;
  segments?: number;
  dragDampening?: number;
  maxVerticalRotationDeg?: number;
  dragSensitivity?: number;
  enlargeTransitionMs?: number;
  grayscale?: boolean;
};

type ItemDef = {
  src: string;
  alt: string;
  x: number;
  y: number;
  sizeX: number;
  sizeY: number;
};

const DEFAULTS = {
  maxVerticalRotationDeg: 5,
  dragSensitivity: 20,
  enlargeTransitionMs: 300,
  segments: 35,
};

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);

const normalizeAngle = (d: number) => ((d % 360) + 360) % 360;

const wrapAngleSigned = (deg: number) => {
  const a = (((deg + 180) % 360) + 360) % 360;
  return a - 180;
};

const getDataNumber = (
  el: HTMLElement,
  name: string,
  fallback: number
) => {
  const attr = el.dataset[name] ?? el.getAttribute(`data-${name}`);
  const n = attr == null ? NaN : parseFloat(attr);
  return Number.isFinite(n) ? n : fallback;
};

function buildItems(pool: ImageItem[], seg: number): ItemDef[] {
  const xCols = Array.from({ length: seg }, (_, i) => -37 + i * 2);
  const evenYs = [-4, -2, 0, 2, 4];
  const oddYs = [-3, -1, 1, 3, 5];

  const coords = xCols.flatMap((x, c) => {
    const ys = c % 2 === 0 ? evenYs : oddYs;
    return ys.map((y) => ({ x, y, sizeX: 2, sizeY: 2 }));
  });

  const totalSlots = coords.length;

  if (pool.length === 0) {
    return coords.map((c) => ({ ...c, src: '', alt: '' }));
  }

  const normalizedImages = pool.map((image) => {
    if (typeof image === 'string') {
      return { src: image, alt: '' };
    }
    return { src: image.src || '', alt: image.alt || '' };
  });

  const usedImages = Array.from({ length: totalSlots }, (_, i) =>
    normalizedImages[i % normalizedImages.length]
  );

  return coords.map((c, i) => ({
    ...c,
    src: usedImages[i].src,
    alt: usedImages[i].alt,
  }));
}

function computeItemBaseRotation(
  offsetX: number,
  offsetY: number,
  sizeX: number,
  sizeY: number,
  segments: number
) {
  const unit = (360 / segments) / 2;
  const rotateY = unit * (offsetX + (sizeX - 1) / 2);
  const rotateX = unit * (offsetY - (sizeY - 1) / 2);
  return { rotateX, rotateY };
}

export default function DomeGallery({
  images = [],
  fit = 0.8,
  minRadius = 600,
  segments = DEFAULTS.segments,
  dragDampening = 2,
  maxVerticalRotationDeg = DEFAULTS.maxVerticalRotationDeg,
  dragSensitivity = DEFAULTS.dragSensitivity,
  enlargeTransitionMs = DEFAULTS.enlargeTransitionMs,
  grayscale = false,
}: DomeGalleryProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const sphereRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);

  const focusedElRef = useRef<HTMLElement | null>(null);
  const rotationRef = useRef({ x: 0, y: 0 });
  const startRotRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const inertiaRAF = useRef<number | null>(null);
  const openingRef = useRef(false);
  const openStartedAtRef = useRef(0);
  const lastDragEndAt = useRef(0);

  const items = useMemo(() => buildItems(images, segments), [images, segments]);

  const applyTransform = (xDeg: number, yDeg: number) => {
    const el = sphereRef.current;
    if (el) {
      el.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${xDeg}deg) rotateY(${yDeg}deg)`;
    }
  };

  const lockedRadiusRef = useRef<number | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect;
      const w = Math.max(1, cr.width),
        h = Math.max(1, cr.height);
      const minDim = Math.min(w, h);

      let radius = minDim * fit;
      const heightGuard = h * 1.35;
      radius = Math.min(radius, heightGuard);
      radius = Math.max(radius, minRadius);

      lockedRadiusRef.current = Math.round(radius);

      root.style.setProperty('--radius', `${lockedRadiusRef.current}px`);
      root.style.setProperty('--viewer-pad', '72px');
      root.style.setProperty('--overlay-blur-color', '#fafafa');
      root.style.setProperty('--tile-radius', '30px');
      root.style.setProperty('--enlarge-radius', '30px');
      root.style.setProperty(
        '--image-filter',
        grayscale ? 'grayscale(1)' : 'none'
      );

      applyTransform(rotationRef.current.x, rotationRef.current.y);
    });

    ro.observe(root);
    return () => ro.disconnect();
  }, [fit, minRadius, grayscale]);

  const stopInertia = useCallback(() => {
    if (inertiaRAF.current) {
      cancelAnimationFrame(inertiaRAF.current);
      inertiaRAF.current = null;
    }
  }, []);

  const startInertia = useCallback(
    (vx: number, vy: number) => {
      const MAX_V = 1.4;
      let vX = clamp(vx, -MAX_V, MAX_V) * 80;
      let vY = clamp(vy, -MAX_V, MAX_V) * 80;
      let frames = 0;

      const d = clamp(dragDampening ?? 0.6, 0, 1);
      const frictionMul = 0.94 + 0.055 * d;
      const stopThreshold = 0.015 - 0.01 * d;
      const maxFrames = Math.round(90 + 270 * d);

      const step = () => {
        vX *= frictionMul;
        vY *= frictionMul;

        if (
          Math.abs(vX) < stopThreshold &&
          Math.abs(vY) < stopThreshold
        ) {
          inertiaRAF.current = null;
          return;
        }

        if (++frames > maxFrames) {
          inertiaRAF.current = null;
          return;
        }

        const nextX = clamp(
          rotationRef.current.x - vY / 200,
          -maxVerticalRotationDeg,
          maxVerticalRotationDeg
        );
        const nextY = wrapAngleSigned(rotationRef.current.y + vX / 200);

        rotationRef.current = { x: nextX, y: nextY };
        applyTransform(nextX, nextY);

        inertiaRAF.current = requestAnimationFrame(step);
      };

      stopInertia();
      inertiaRAF.current = requestAnimationFrame(step);
    },
    [dragDampening, maxVerticalRotationDeg, stopInertia]
  );

  useGesture(
    {
      onDragStart: ({ event }) => {
        if (focusedElRef.current) return;
        stopInertia();

        const evt = event as PointerEvent;
        draggingRef.current = true;
        movedRef.current = false;
        startRotRef.current = { ...rotationRef.current };
        startPosRef.current = { x: evt.clientX, y: evt.clientY };
      },
      onDrag: ({ event, last, velocity = [0, 0], direction = [0, 0] }) => {
        if (
          focusedElRef.current ||
          !draggingRef.current ||
          !startPosRef.current
        )
          return;

        const evt = event as PointerEvent;
        const dxTotal = evt.clientX - startPosRef.current.x;
        const dyTotal = evt.clientY - startPosRef.current.y;

        if (!movedRef.current) {
          const dist2 = dxTotal * dxTotal + dyTotal * dyTotal;
          if (dist2 > 16) movedRef.current = true;
        }

        const nextX = clamp(
          startRotRef.current.x - dyTotal / dragSensitivity,
          -maxVerticalRotationDeg,
          maxVerticalRotationDeg
        );
        const nextY = wrapAngleSigned(
          startRotRef.current.y + dxTotal / dragSensitivity
        );

        if (
          rotationRef.current.x !== nextX ||
          rotationRef.current.y !== nextY
        ) {
          rotationRef.current = { x: nextX, y: nextY };
          applyTransform(nextX, nextY);
        }

        if (last) {
          draggingRef.current = false;
          const [vMagX, vMagY] = velocity;
          const [dirX, dirY] = direction;
          const vx = vMagX * dirX;
          const vy = vMagY * dirY;

          if (Math.abs(vx) > 0.005 || Math.abs(vy) > 0.005) {
            startInertia(vx, vy);
          }

          if (movedRef.current) lastDragEndAt.current = performance.now();
          movedRef.current = false;
        }
      },
    },
    { target: mainRef, eventOptions: { passive: true } }
  );

  const openItemFromElement = (el: HTMLElement) => {
    if (openingRef.current) return;
    openingRef.current = true;
    openStartedAtRef.current = performance.now();

    const parent = el.parentElement as HTMLElement;
    focusedElRef.current = el;
    el.setAttribute('data-focused', 'true');

    const offsetX = getDataNumber(parent, 'offsetX', 0);
    const offsetY = getDataNumber(parent, 'offsetY', 0);
    const sizeX = getDataNumber(parent, 'sizeX', 2);
    const sizeY = getDataNumber(parent, 'sizeY', 2);

    const parentRot = computeItemBaseRotation(
      offsetX,
      offsetY,
      sizeX,
      sizeY,
      segments
    );
    const parentY = normalizeAngle(parentRot.rotateY);
    const globalY = normalizeAngle(rotationRef.current.y);

    let rotY = -(parentY + globalY) % 360;
    if (rotY < -180) rotY += 360;

    const rotX = -parentRot.rotateX - rotationRef.current.x;

    parent.style.setProperty('--rot-y-delta', `${rotY}deg`);
    parent.style.setProperty('--rot-x-delta', `${rotX}deg`);

    el.style.visibility = 'hidden';

    const rawSrc =
      parent.dataset.src ||
      (el.querySelector('img') as HTMLImageElement)?.src ||
      '';

    const overlay = document.createElement('div');
    overlay.className = 'enlarge';
    overlay.style.cssText = `
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 80vw;
      max-width: 600px;
      height: 80vh;
      max-height: 600px;
      opacity: 0;
      z-index: 30;
      border-radius: 30px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.35);
      transition: opacity ${enlargeTransitionMs}ms ease;
    `;

    const img = document.createElement('img');
    img.src = rawSrc;
    img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
    overlay.appendChild(img);

    viewerRef.current!.appendChild(overlay);

    setTimeout(() => {
      overlay.style.opacity = '1';
      rootRef.current?.setAttribute('data-enlarging', 'true');
    }, 16);
  };

  const onTileClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (draggingRef.current) return;
      if (movedRef.current) return;
      if (performance.now() - lastDragEndAt.current < 80) return;
      if (openingRef.current) return;
      openItemFromElement(e.currentTarget);
    },
    []
  );

  useEffect(() => {
    const scrim = scrimRef.current;
    if (!scrim) return;

    const close = () => {
      if (performance.now() - openStartedAtRef.current < 250) return;

      const el = focusedElRef.current;
      if (!el) return;

      const parent = el.parentElement as HTMLElement;
      const overlay = viewerRef.current?.querySelector(
        '.enlarge'
      ) as HTMLElement | null;

      if (!overlay) return;

      overlay.style.opacity = '0';

      setTimeout(() => {
        overlay.remove();
        parent.style.setProperty('--rot-y-delta', '0deg');
        parent.style.setProperty('--rot-x-delta', '0deg');
        el.style.visibility = '';
        focusedElRef.current = null;
        rootRef.current?.removeAttribute('data-enlarging');
        openingRef.current = false;
      }, enlargeTransitionMs);
    };

    scrim.addEventListener('click', close);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      scrim.removeEventListener('click', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [enlargeTransitionMs]);

  return (
    <div
      ref={rootRef}
      className="sphere-root"
      style={
        {
          ['--segments-x' as any]: segments,
          ['--segments-y' as any]: segments,
        } as React.CSSProperties
      }
    >
      <main ref={mainRef} className="sphere-main">
        <div className="stage">
          <div ref={sphereRef} className="sphere">
            {items.map((it, i) => (
              <div
                key={`${it.x},${it.y},${i}`}
                className="item"
                data-src={it.src}
                data-offset-x={it.x}
                data-offset-y={it.y}
                data-size-x={it.sizeX}
                data-size-y={it.sizeY}
                style={
                  {
                    ['--offset-x' as any]: it.x,
                    ['--offset-y' as any]: it.y,
                    ['--item-size-x' as any]: it.sizeX,
                    ['--item-size-y' as any]: it.sizeY,
                  } as React.CSSProperties
                }
              >
                <div
                  className="item__image"
                  role="button"
                  tabIndex={0}
                  aria-label={it.alt || 'Open image'}
                  onClick={onTileClick}
                >
                  <img src={it.src} draggable={false} alt={it.alt} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="overlay" />
        <div className="overlay overlay--blur" />
        <div className="edge-fade edge-fade--top" />
        <div className="edge-fade edge-fade--bottom" />

        <div className="viewer" ref={viewerRef}>
          <div ref={scrimRef} className="scrim" />
          <div ref={frameRef} className="frame" />
        </div>
      </main>
    </div>
  );
}
