"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";

interface ImageCropUploadProps {
  title: string;
  uploadLabel: string;
  aspectRatio: number;
  value?: string;
  fallbackUrl?: string | null;
  fallbackLabel: string;
  onApply: (dataUrl: string) => void;
  onClear: () => void;
}

interface ImageSize {
  width: number;
  height: number;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("圖片載入失敗，請重新選擇檔案。"));
    image.src = src;
  });
}

export function ImageCropUpload({
  title,
  uploadLabel,
  aspectRatio,
  value,
  fallbackUrl,
  fallbackLabel,
  onApply,
  onClear
}: ImageCropUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const cropRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, originX: 0, originY: 0 });
  const [source, setSource] = useState("");
  const [imageSize, setImageSize] = useState<ImageSize | null>(null);
  const [cropSize, setCropSize] = useState({ width: 320, height: Math.round(320 / aspectRatio) });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [message, setMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const previewUrl = value || fallbackUrl || "";
  const previewText = value ? "已套用前台裁切圖片" : fallbackUrl ? fallbackLabel : "尚無圖片";
  const baseScale = useMemo(() => {
    if (!imageSize) return 1;
    return Math.max(cropSize.width / imageSize.width, cropSize.height / imageSize.height);
  }, [cropSize.height, cropSize.width, imageSize]);
  const displayWidth = imageSize ? imageSize.width * baseScale * zoom : cropSize.width;
  const displayHeight = imageSize ? imageSize.height * baseScale * zoom : cropSize.height;

  useEffect(() => {
    if (!isOpen || !cropRef.current) return;
    const element = cropRef.current;
    const updateSize = () => {
      const width = Math.max(240, element.clientWidth);
      setCropSize({ width, height: Math.round(width / aspectRatio) });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [aspectRatio, isOpen]);

  function resetCrop() {
    setPosition({ x: 0, y: 0 });
    setZoom(1);
  }

  async function useFile(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMessage("請選擇 JPG、PNG 或 WEBP 圖片。");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const image = await loadImage(dataUrl);
      setSource(dataUrl);
      setImageSize({ width: image.naturalWidth, height: image.naturalHeight });
      setMessage("");
      resetCrop();
      setIsOpen(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "圖片讀取失敗，請重新選擇。");
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      dragging: true,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y
    };
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragRef.current.dragging) return;
    setPosition({
      x: dragRef.current.originX + event.clientX - dragRef.current.startX,
      y: dragRef.current.originY + event.clientY - dragRef.current.startY
    });
  }

  function stopDragging() {
    dragRef.current.dragging = false;
  }

  async function applyCrop() {
    if (!source || !imageSize || !cropRef.current) return;
    try {
      const image = await loadImage(source);
      const width = cropRef.current.clientWidth;
      const height = cropRef.current.clientHeight;
      const outputWidth = aspectRatio >= 1 ? 900 : 720;
      const outputHeight = Math.round(outputWidth / aspectRatio);
      const canvas = document.createElement("canvas");
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("瀏覽器無法產生裁切圖片，請重新試一次。");

      const scale = Math.max(width / imageSize.width, height / imageSize.height) * zoom;
      const drawWidth = imageSize.width * scale;
      const drawHeight = imageSize.height * scale;
      const imageX = width / 2 - drawWidth / 2 + position.x;
      const imageY = height / 2 - drawHeight / 2 + position.y;
      const outputScale = outputWidth / width;

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, outputWidth, outputHeight);
      context.drawImage(
        image,
        imageX * outputScale,
        imageY * outputScale,
        drawWidth * outputScale,
        drawHeight * outputScale
      );
      onApply(canvas.toDataURL("image/png"));
      setIsOpen(false);
      setMessage("裁切圖片已套用到本次模板。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "裁切失敗，請重新試一次。");
    }
  }

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="field-label">{title}</p>
          <p className="field-help">{previewText}</p>
        </div>
        <button type="button" className="btn btn-blue" onClick={() => inputRef.current?.click()}>
          {uploadLabel}
        </button>
      </div>

      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt={title} className="mt-4 max-h-56 w-full rounded-lg border border-line bg-white object-contain" />
      ) : (
        <div className="mt-4 grid min-h-32 place-items-center rounded-lg border border-dashed border-line bg-slate-50 text-base font-bold text-slate-500">
          尚無圖片
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn btn-secondary" onClick={() => inputRef.current?.click()}>
          重新上傳
        </button>
        {value ? (
          <button type="button" className="btn btn-muted" onClick={onClear}>
            清除自訂圖片
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        hidden
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        onChange={(event) => void useFile(event.currentTarget.files?.[0])}
      />
      {message ? <p className="field-help">{message}</p> : null}

      {isOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-900/75 p-4">
          <div className="mx-auto max-w-xl rounded-2xl bg-white p-5 shadow-luxury">
            <div className="mb-4">
              <p className="eyebrow">Crop</p>
              <h3 className="section-title">{title}</h3>
            </div>
            <div
              ref={cropRef}
              className="relative mx-auto w-full touch-none overflow-hidden rounded-xl border-2 border-gold-300 bg-slate-100"
              style={{ aspectRatio }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={stopDragging}
              onPointerCancel={stopDragging}
            >
              {source && imageSize ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={source}
                  alt="裁切圖片"
                  draggable={false}
                  className="absolute left-1/2 top-1/2 max-w-none select-none"
                  style={{
                    width: displayWidth,
                    height: displayHeight,
                    transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`
                  }}
                />
              ) : null}
              <div className="pointer-events-none absolute inset-0 border-[3px] border-white/90 shadow-[inset_0_0_0_9999px_rgba(8,26,51,0.18)]" />
            </div>

            <label className="mt-4 block">
              <span className="field-label">縮放</span>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(event) => setZoom(Number(event.currentTarget.value))}
              />
            </label>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
              <button type="button" className="btn btn-secondary" onClick={() => setZoom((current) => Math.min(3, current + 0.15))}>
                放大
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setZoom((current) => Math.max(1, current - 0.15))}>
                縮小
              </button>
              <button type="button" className="btn btn-muted" onClick={resetCrop}>
                重設
              </button>
              <button type="button" className="btn btn-primary" onClick={() => void applyCrop()}>
                套用
              </button>
              <button type="button" className="btn btn-danger" onClick={() => setIsOpen(false)}>
                取消
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
