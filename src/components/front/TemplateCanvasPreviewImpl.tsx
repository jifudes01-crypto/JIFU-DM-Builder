"use client";

import { useEffect, useMemo, useState, type MutableRefObject } from "react";
import { Image as KonvaImage, Layer, Rect, Stage, Text } from "react-konva";
import type Konva from "konva";
import QRCode from "qrcode";
import type { TemplateCanvasPreviewProps } from "@/types/component-props";
import type { Contact, TemplateBlock } from "@/types/database";

function useLoadedImage(src?: string | null) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src) {
      setImage(null);
      return;
    }

    const nextImage = new window.Image();
    nextImage.crossOrigin = "anonymous";
    nextImage.onload = () => setImage(nextImage);
    nextImage.onerror = () => setImage(null);
    nextImage.src = src;
  }, [src]);

  return image;
}

function contactText(contact: Contact | null) {
  if (!contact) return "請選擇聯絡人";
  return [
    `${contact.name}${contact.title ? ` / ${contact.title}` : ""}`,
    contact.mobile ? `手機 ${contact.mobile}` : "",
    contact.phone ? `電話 ${contact.phone}` : "",
    contact.email ? `Email ${contact.email}` : "",
    contact.line_id ? `LINE ${contact.line_id}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

function fallbackText(block: TemplateBlock) {
  const labels: Record<string, string> = {
    title: "物件主標題",
    subtitle: "副標題",
    body: "特色說明",
    price: "NT$ 00,000,000",
    address: "地址",
    feature: "特色",
    text: block.label
  };

  return labels[block.type] ?? block.label;
}

function ImageBlock({
  block,
  src,
  label
}: {
  block: TemplateBlock;
  src?: string | null;
  label: string;
}) {
  const image = useLoadedImage(src);

  if (image) {
    const imageRatio = image.width / image.height;
    const boxRatio = block.width / block.height;
    let width = block.width;
    let height = block.height;
    let x = block.x;
    let y = block.y;

    if (block.image_fit === "contain") {
      if (imageRatio > boxRatio) {
        height = block.width / imageRatio;
        y = block.y + (block.height - height) / 2;
      } else {
        width = block.height * imageRatio;
        x = block.x + (block.width - width) / 2;
      }
    }

    return (
      <>
        <Rect
          x={block.x}
          y={block.y}
          width={block.width}
          height={block.height}
          fill="#f1f5f9"
          stroke="#d8e0e8"
        />
        <KonvaImage image={image} x={x} y={y} width={width} height={height} />
      </>
    );
  }

  return (
    <>
      <Rect
        x={block.x}
        y={block.y}
        width={block.width}
        height={block.height}
        fill="#eef3f8"
        stroke="#9fb3c8"
        dash={[8, 6]}
      />
      <Text
        x={block.x}
        y={block.y + block.height / 2 - 12}
        width={block.width}
        text={label}
        fontSize={16}
        fill="#64748b"
        align="center"
      />
    </>
  );
}

function QrBlock({ block, src }: { block: TemplateBlock; src?: string | null }) {
  const image = useLoadedImage(src);

  if (image) {
    return <KonvaImage image={image} x={block.x} y={block.y} width={block.width} height={block.height} />;
  }

  return (
    <>
      <Rect x={block.x} y={block.y} width={block.width} height={block.height} fill="#fff" stroke="#d8e0e8" />
      <Text
        x={block.x}
        y={block.y + block.height / 2 - 10}
        width={block.width}
        text="QR Code"
        fontSize={14}
        fill="#64748b"
        align="center"
      />
    </>
  );
}

export function TemplateCanvasPreview({
  template,
  values,
  images,
  contact,
  scale = 0.45,
  stageRef,
  showGuides = false
}: TemplateCanvasPreviewProps) {
  const backgroundImage = useLoadedImage(template.image_url);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const blocks = useMemo(() => [...template.blocks].sort((a, b) => a.z_index - b.z_index), [template.blocks]);

  function setStageRef(node: Konva.Stage | null) {
    if (stageRef) {
      (stageRef as MutableRefObject<Konva.Stage | null>).current = node;
    }
  }

  useEffect(() => {
    const qrText = contact?.qrcode_url || contact?.line_id || contact?.mobile || contact?.email || "吉富房屋";
    if (contact?.qrcode_url) {
      setQrDataUrl(contact.qrcode_url);
      return;
    }

    QRCode.toDataURL(qrText, { margin: 1, width: 320 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [contact]);

  return (
    <div className="overflow-auto rounded-lg border border-line bg-slate-100 p-4">
      <div style={{ width: template.width * scale, height: template.height * scale }}>
        <Stage
          ref={setStageRef}
          width={template.width}
          height={template.height}
          style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
          className="rounded-lg bg-white shadow-panel"
        >
          <Layer>
            <Rect x={0} y={0} width={template.width} height={template.height} fill="#ffffff" />
            {backgroundImage ? (
              <KonvaImage image={backgroundImage} x={0} y={0} width={template.width} height={template.height} />
            ) : (
              <>
                <Rect x={0} y={0} width={template.width} height={template.height} fill="#ffffff" />
                <Rect x={0} y={0} width={template.width} height={128} fill="#0f2a44" />
                <Text x={48} y={42} text="JI FU REAL ESTATE" fontSize={24} fill="#ffffff" fontStyle="bold" />
                <Rect x={0} y={template.height - 150} width={template.width} height={150} fill="#eef3f8" />
              </>
            )}

            {blocks.map((block) => {
              const text =
                block.type === "contact"
                  ? contactText(contact)
                  : values[block.id] || values[block.label] || fallbackText(block);

              if (["image", "avatar", "logo"].includes(block.type)) {
                const src = block.type === "avatar" ? contact?.avatar_url || images[block.id] : images[block.id];
                return <ImageBlock key={block.id} block={block} src={src} label={block.label} />;
              }

              if (block.type === "qrcode") {
                return <QrBlock key={block.id} block={block} src={qrDataUrl || images[block.id]} />;
              }

              return (
                <Text
                  key={block.id}
                  x={block.x}
                  y={block.y}
                  width={block.width}
                  height={block.height}
                  text={text}
                  fontSize={block.font_size}
                  fill={block.color}
                  align={block.text_align}
                  verticalAlign="middle"
                  fontStyle={["title", "price"].includes(block.type) ? "bold" : "normal"}
                  lineHeight={1.25}
                />
              );
            })}

            {showGuides
              ? blocks.map((block) => (
                  <Rect
                    key={`guide-${block.id}`}
                    x={block.x}
                    y={block.y}
                    width={block.width}
                    height={block.height}
                    stroke="#2d8cff"
                    dash={[10, 8]}
                  />
                ))
              : null}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
