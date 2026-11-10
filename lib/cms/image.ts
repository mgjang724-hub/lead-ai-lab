/**
 * 사진 줄이기 — 브라우저 안에서 사진을 정해진 크기의 JPEG 로 다시 그려 저장합니다.
 * 다시 그리는 과정에서 촬영 위치(GPS) 같은 사진 속 정보(EXIF)도 함께 지워집니다.
 */
import type { ImageSpec } from './collections';

export interface PreparedImage {
  base64: string;
  dataUrl: string;
  width: number;
  height: number;
  bytes: number;
}

const MAX_INPUT_BYTES = 30 * 1024 * 1024;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('사진을 읽을 수 없습니다. JPG·PNG 파일인지 확인해 주세요. (아이폰 HEIC 사진은 JPG 로 바꿔서 올려 주세요)'));
    };
    img.src = url;
  });
}

export async function prepareImage(file: File, spec: ImageSpec): Promise<PreparedImage> {
  if (!file.type.startsWith('image/')) throw new Error('사진 파일(JPG·PNG)만 올릴 수 있습니다.');
  if (file.size > MAX_INPUT_BYTES) throw new Error('사진이 너무 큽니다 (30MB 이하).');
  const img = await loadImage(file);
  const sw = img.naturalWidth;
  const sh = img.naturalHeight;
  let sx = 0;
  let sy = 0;
  let cw = sw;
  let ch = sh;
  let w: number;
  let h: number;
  if (spec.mode === 'crop') {
    // 목표 비율로 가운데를 자름 — 세로 사진은 얼굴이 위쪽에 있는 경우가 많아 위에서 1/4 지점 기준
    const target = spec.width / spec.height;
    if (sw / sh > target) {
      cw = Math.round(sh * target);
      sx = Math.round((sw - cw) / 2);
    } else {
      ch = Math.round(sw / target);
      sy = Math.round((sh - ch) / 4);
    }
    const scale = Math.min(1, spec.width / cw);
    w = Math.round(cw * scale);
    h = Math.round(ch * scale);
  } else {
    const scale = Math.min(1, spec.width / sw, spec.height / sh);
    w = Math.round(sw * scale);
    h = Math.round(sh * scale);
  }
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('이 브라우저에서는 사진을 처리할 수 없습니다.');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, cw, ch, 0, 0, w, h);
  const dataUrl = canvas.toDataURL('image/jpeg', spec.quality ?? 0.85);
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  return { base64, dataUrl, width: w, height: h, bytes: Math.round((base64.length * 3) / 4) };
}

/** 저장 경로 — 같은 이름을 다시 쓰면 브라우저·CDN 캐시 때문에 예전 사진이 보일 수 있어 매번 새 이름 */
export function imageFileName(key: string): string {
  return `${key}-${Date.now().toString(36)}.jpg`;
}
