"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Image as KonvaImage, Layer, Rect, Stage, Text, Transformer } from "react-konva";
import type Konva from "konva";
import type { TemplateBlockEditorProps } from "@/types/component-props";
import type { BlockType, TemplateBlock } from "@/types/database";

const blockTypes: BlockType[] = [
  "text",
  "title",
  "subtitle",
  "body",
  "price",
  "address",
  "feature",
  "image",
  "avatar",
  "contact",
  "qrcode",
  "logo"
];

const blockTypeLabels: Record<BlockType, string> = {
  text: "文字",
  title: "主標題",
  subtitle: "副標題",
  body: "內文",
  price: "價格",
  address: "地址",
  feature: "特色",
  image: "圖片",
  avatar: "頭像",
  contact: "聯絡資訊",
  qrcode: "QR Code",
  logo: "Logo"
};

function useLoadedImage(src: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src) return;
    const next = new window.Image();
    next.crossOrigin = "anonymous";
    next.onload = () => setImage(next);
    next.src = src;
  }, [src]);

  return image;
}

type DraftBlock = Omit<TemplateBlock, "created_at" | "updated_at" | "metadata">;

function createBlock(templateId: string, index: number): DraftBlock {
  return {
    id: `draft-${crypto.randomUUID()}`,
    template_id: templateId,
    type: "text",
    label: `新區塊 ${index + 1}`,
    required: false,
    max_length: 30,
    x: 80 + index * 12,
    y: 80 + index * 12,
    width: 240,
    height: 72,
    font_size: 22,
    color: "#0f2a44",
    text_align: "left",
    image_fit: "cover",
    z_index: index + 1
  };
}

export function TemplateBlockEditor({ template }: TemplateBlockEditorProps) {
  const background = useLoadedImage(template.image_url);
  const [blocks, setBlocks] = useState<DraftBlock[]>(template.blocks.map((block) => ({ ...block })));
  const [selectedId, setSelectedId] = useState(blocks[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const shapeRefs = useRef<Record<string, Konva.Rect | null>>({});
  const transformerRef = useRef<Konva.Transformer>(null);
  const selectedBlock = blocks.find((block) => block.id === selectedId) ?? null;
  const scale = Math.min(0.76, 620 / template.width);

  function updateSelected(patch: Partial<DraftBlock>) {
    setBlocks((current) => current.map((block) => (block.id === selectedId ? { ...block, ...patch } : block)));
  }

  function syncTransformer(id: string) {
    requestAnimationFrame(() => {
      const node = shapeRefs.current[id];
      if (node && transformerRef.current) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    });
  }

  function addBlock(type: BlockType) {
    const block = { ...createBlock(template.id, blocks.length), type, label: blockTypeLabels[type] };
    setBlocks((current) => [...current, block]);
    setSelectedId(block.id);
    syncTransformer(block.id);
  }

  function removeSelected() {
    if (!selectedId) return;
    setBlocks((current) => current.filter((block) => block.id !== selectedId));
    setSelectedId("");
  }

  function save() {
    startTransition(async () => {
      try {
        setMessage("正在儲存區塊...");
        localStorage.setItem(
          `jifu-template-blocks:${template.id}`,
          JSON.stringify(blocks.map((block, index) => ({ ...block, z_index: index + 1 })))
        );
        setMessage("GitHub Pages 已暫存區塊設定。正式同步資料需連接 Supabase 前端寫入權限。");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "儲存失敗，請稍後再試。");
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="card p-5">
        <div className="mb-4 flex flex-wrap gap-2">
          {blockTypes.map((type) => (
            <button key={type} type="button" className="btn btn-secondary" onClick={() => addBlock(type)}>
              新增 {blockTypeLabels[type]}
            </button>
          ))}
        </div>
        <div className="overflow-auto rounded-lg border border-line bg-slate-100 p-4">
          <div style={{ width: template.width * scale, height: template.height * scale }}>
            <Stage
              width={template.width}
              height={template.height}
              style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
              onMouseDown={(event) => {
                if (event.target === event.target.getStage()) {
                  setSelectedId("");
                }
              }}
            >
              <Layer>
                <Rect x={0} y={0} width={template.width} height={template.height} fill="#ffffff" />
                {background ? (
                  <KonvaImage image={background} x={0} y={0} width={template.width} height={template.height} />
                ) : null}
                {blocks.map((block) => (
                  <Rect
                    key={block.id}
                    ref={(node) => {
                      shapeRefs.current[block.id] = node;
                    }}
                    x={block.x}
                    y={block.y}
                    width={block.width}
                    height={block.height}
                    fill="rgba(45, 140, 255, 0.12)"
                    stroke={block.id === selectedId ? "#0f2a44" : "#2d8cff"}
                    strokeWidth={block.id === selectedId ? 4 : 2}
                    dash={[12, 8]}
                    draggable
                    onClick={() => {
                      setSelectedId(block.id);
                      syncTransformer(block.id);
                    }}
                    onTap={() => {
                      setSelectedId(block.id);
                      syncTransformer(block.id);
                    }}
                    onDragEnd={(event) => {
                      setBlocks((current) =>
                        current.map((item) =>
                          item.id === block.id ? { ...item, x: event.target.x(), y: event.target.y() } : item
                        )
                      );
                    }}
                    onTransformEnd={(event) => {
                      const node = event.target;
                      const scaleX = node.scaleX();
                      const scaleY = node.scaleY();
                      node.scaleX(1);
                      node.scaleY(1);
                      setBlocks((current) =>
                        current.map((item) =>
                          item.id === block.id
                            ? {
                                ...item,
                                x: node.x(),
                                y: node.y(),
                                width: Math.max(20, node.width() * scaleX),
                                height: Math.max(20, node.height() * scaleY)
                              }
                            : item
                        )
                      );
                    }}
                  />
                ))}
                {blocks.map((block) => (
                  <Text
                    key={`label-${block.id}`}
                    x={block.x + 8}
                    y={block.y + 8}
                    text={block.label}
                    fontSize={16}
                    fill="#0f2a44"
                    listening={false}
                  />
                ))}
                <Transformer ref={transformerRef} rotateEnabled={false} />
              </Layer>
            </Stage>
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="card p-5">
          <h2 className="text-xl font-black text-navy-900">區塊設定</h2>
          {selectedBlock ? (
            <div className="mt-4 grid gap-4">
              <label>
                <span className="field-label">類型</span>
                <select value={selectedBlock.type} onChange={(event) => updateSelected({ type: event.target.value as BlockType })}>
                  {blockTypes.map((type) => (
                    <option key={type} value={type}>
                      {blockTypeLabels[type]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="field-label">欄位名稱</span>
                <input value={selectedBlock.label} onChange={(event) => updateSelected({ label: event.target.value })} />
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="h-5 w-5"
                  checked={selectedBlock.required}
                  onChange={(event) => updateSelected({ required: event.target.checked })}
                />
                <span className="text-base font-bold text-navy-900">必填</span>
              </label>
              <label>
                <span className="field-label">字數限制</span>
                <input
                  type="number"
                  value={selectedBlock.max_length ?? ""}
                  onChange={(event) =>
                    updateSelected({ max_length: event.target.value ? Number(event.target.value) : null })
                  }
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label>
                  <span className="field-label">X</span>
                  <input type="number" value={Math.round(selectedBlock.x)} onChange={(event) => updateSelected({ x: Number(event.target.value) })} />
                </label>
                <label>
                  <span className="field-label">Y</span>
                  <input type="number" value={Math.round(selectedBlock.y)} onChange={(event) => updateSelected({ y: Number(event.target.value) })} />
                </label>
                <label>
                  <span className="field-label">寬</span>
                  <input type="number" value={Math.round(selectedBlock.width)} onChange={(event) => updateSelected({ width: Number(event.target.value) })} />
                </label>
                <label>
                  <span className="field-label">高</span>
                  <input type="number" value={Math.round(selectedBlock.height)} onChange={(event) => updateSelected({ height: Number(event.target.value) })} />
                </label>
              </div>
              <label>
                <span className="field-label">字級</span>
                <input type="number" value={selectedBlock.font_size} onChange={(event) => updateSelected({ font_size: Number(event.target.value) })} />
              </label>
              <label>
                <span className="field-label">顏色</span>
                <input type="color" value={selectedBlock.color} onChange={(event) => updateSelected({ color: event.target.value })} />
              </label>
              <label>
                <span className="field-label">文字對齊</span>
                <select value={selectedBlock.text_align} onChange={(event) => updateSelected({ text_align: event.target.value as DraftBlock["text_align"] })}>
                  <option value="left">靠左</option>
                  <option value="center">置中</option>
                  <option value="right">靠右</option>
                </select>
              </label>
              <label>
                <span className="field-label">圖片填滿</span>
                <select value={selectedBlock.image_fit} onChange={(event) => updateSelected({ image_fit: event.target.value as DraftBlock["image_fit"] })}>
                  <option value="cover">裁切填滿</option>
                  <option value="contain">完整顯示</option>
                </select>
              </label>
              <button type="button" className="btn btn-danger" onClick={removeSelected}>
                刪除區塊
              </button>
            </div>
          ) : (
            <p className="section-subtitle">請點選畫布上的區塊，或新增一個區塊。</p>
          )}
        </div>
        <div className="card p-5">
          <h2 className="text-xl font-black text-navy-900">同步預覽</h2>
          <p className="section-subtitle">這裡會同步顯示目前區塊位置，不必跳到前台查看。</p>
          <div className="mt-4 overflow-auto rounded-lg border border-line bg-slate-100 p-3">
            <div style={{ width: template.width * Math.min(0.34, 320 / template.width), height: template.height * Math.min(0.34, 320 / template.width) }}>
              <Stage
                width={template.width}
                height={template.height}
                style={{
                  transform: `scale(${Math.min(0.34, 320 / template.width)})`,
                  transformOrigin: "top left"
                }}
              >
                <Layer>
                  <Rect x={0} y={0} width={template.width} height={template.height} fill="#ffffff" />
                  {background ? <KonvaImage image={background} x={0} y={0} width={template.width} height={template.height} /> : null}
                  {blocks.map((block) => (
                    <Rect
                      key={`preview-${block.id}`}
                      x={block.x}
                      y={block.y}
                      width={block.width}
                      height={block.height}
                      fill="rgba(45, 140, 255, 0.14)"
                      stroke="#2d8cff"
                      strokeWidth={2}
                      dash={[10, 8]}
                    />
                  ))}
                  {blocks.map((block) => (
                    <Text key={`preview-label-${block.id}`} x={block.x + 8} y={block.y + 8} text={block.label} fontSize={16} fill="#0f2a44" />
                  ))}
                </Layer>
              </Stage>
            </div>
          </div>
        </div>
        <button type="button" className="btn btn-blue w-full" onClick={save} disabled={isPending}>
          {isPending ? "儲存中..." : "儲存全部區塊"}
        </button>
        {message ? <div className="card border-blue-200 bg-blue-50 p-4 font-bold text-navy-900">{message}</div> : null}
      </aside>
    </div>
  );
}
