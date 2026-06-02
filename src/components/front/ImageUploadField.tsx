"use client";

import { useRef, useState } from "react";

interface ImageUploadFieldProps {
  label: string;
  value?: string;
  onChange: (dataUrl: string) => void;
  onClear: () => void;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function ImageUploadField({ label, value, onChange, onClear }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState("");

  async function useFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("請選擇圖片檔。");
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    onChange(dataUrl);
    setMessage("圖片已更新。");
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void useFile(event.dataTransfer.files[0]);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        className={`grid min-h-36 w-full place-items-center rounded-lg border-2 border-dashed p-4 text-center ${
          dragging ? "border-action bg-blue-50" : "border-line bg-slate-50"
        }`}
      >
        <span>
          <span className="block text-lg font-black text-navy-900">{label}</span>
          <span className="mt-2 block text-base text-slate-600">
            {value ? "已選擇圖片，可重新上傳" : "點擊或拖曳圖片到這裡"}
          </span>
        </span>
      </button>
      <input
        ref={inputRef}
        hidden
        type="file"
        accept="image/*"
        onChange={(event) => void useFile(event.currentTarget.files?.[0])}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn btn-secondary" onClick={() => inputRef.current?.click()}>
          重新上傳
        </button>
        {value ? (
          <button type="button" className="btn btn-muted" onClick={onClear}>
            刪除圖片
          </button>
        ) : null}
      </div>
      {message ? <p className="field-help">{message}</p> : null}
    </div>
  );
}
