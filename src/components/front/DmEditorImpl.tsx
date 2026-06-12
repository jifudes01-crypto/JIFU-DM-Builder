"use client";

import jsPDF from "jspdf";
import QRCode from "qrcode";
import { useEffect, useMemo, useRef, useState } from "react";
import { Image as KonvaImage, Layer, Rect, Stage, Text, Transformer } from "react-konva";
import type Konva from "konva";
import type { DmEditorProps } from "@/types/component-props";

type CanvasElement =
  | {
      id: string;
      type: "text";
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      text: string;
      fontSize: number;
      fill: string;
      fontFamily: string;
      fontStyle: string;
      align: "left" | "center" | "right";
    }
  | {
      id: string;
      type: "image";
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      src: string;
    };

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

function useViewportSize() {
  const [size, setSize] = useState({ width: 1280, height: 860 });

  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return size;
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

function dataUrlToPdfDataUrl(imageDataUrl: string, width: number, height: number) {
  const pdf = new jsPDF({
    orientation: width > height ? "landscape" : "portrait",
    unit: "px",
    format: [width, height],
    compress: true
  });

  pdf.addImage(imageDataUrl, "PNG", 0, 0, width, height);
  return pdf.output("datauristring");
}

function readFileAsDataUrl(file?: File | null) {
  return new Promise<string>((resolve, reject) => {
    if (!file) {
      reject(new Error("沒有選擇檔案。"));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("讀取圖片失敗。"));
    reader.readAsDataURL(file);
  });
}

function EditableImage({
  element,
  selected,
  onSelect,
  onChange
}: {
  element: Extract<CanvasElement, { type: "image" }>;
  selected: boolean;
  onSelect: () => void;
  onChange: (next: CanvasElement) => void;
}) {
  const image = useLoadedImage(element.src);
  const shapeRef = useRef<Konva.Image | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);

  useEffect(() => {
    if (selected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selected]);

  if (!image) return null;

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        image={image}
        x={element.x}
        y={element.y}
        width={element.width}
        height={element.height}
        rotation={element.rotation}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(event) => onChange({ ...element, x: event.target.x(), y: event.target.y() })}
        onTransformEnd={() => {
          const node = shapeRef.current;
          if (!node) return;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            ...element,
            x: node.x(),
            y: node.y(),
            width: Math.max(24, node.width() * scaleX),
            height: Math.max(24, node.height() * scaleY),
            rotation: node.rotation()
          });
        }}
      />
      {selected ? <Transformer ref={transformerRef} rotateEnabled enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]} /> : null}
    </>
  );
}

function EditableText({
  element,
  selected,
  onSelect,
  onChange,
  onEditText
}: {
  element: Extract<CanvasElement, { type: "text" }>;
  selected: boolean;
  onSelect: () => void;
  onChange: (next: CanvasElement) => void;
  onEditText: () => void;
}) {
  const shapeRef = useRef<Konva.Text | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);

  useEffect(() => {
    if (selected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selected]);

  return (
    <>
      <Text
        ref={shapeRef}
        x={element.x}
        y={element.y}
        width={element.width}
        height={element.height}
        rotation={element.rotation}
        text={element.text}
        fontSize={element.fontSize}
        fill={element.fill}
        fontFamily={element.fontFamily}
        fontStyle={element.fontStyle}
        align={element.align}
        verticalAlign="middle"
        lineHeight={1.25}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDblClick={onEditText}
        onDblTap={onEditText}
        onDragEnd={(event) => onChange({ ...element, x: event.target.x(), y: event.target.y() })}
        onTransformEnd={() => {
          const node = shapeRef.current;
          if (!node) return;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            ...element,
            x: node.x(),
            y: node.y(),
            width: Math.max(60, node.width() * scaleX),
            height: Math.max(32, node.height() * scaleY),
            fontSize: Math.max(8, Math.round(element.fontSize * scaleY)),
            rotation: node.rotation()
          });
        }}
      />
      {selected ? <Transformer ref={transformerRef} rotateEnabled enabledAnchors={["middle-left", "middle-right", "top-left", "top-right", "bottom-left", "bottom-right"]} /> : null}
    </>
  );
}

function contactSummary(contact: DmEditorProps["contacts"][number] | null, teamName: string, departmentName: string) {
  if (!contact) return "";
  return [
    contact.name,
    contact.title ?? "",
    contact.mobile ? `手機 ${contact.mobile}` : "",
    contact.phone ? `電話 ${contact.phone}` : "",
    contact.email ?? "",
    contact.line_id ? `LINE ${contact.line_id}` : "",
    departmentName ? `團隊 ${departmentName}` : teamName
  ]
    .filter(Boolean)
    .join("\\n");
}

export function DmEditor({ teamId: _teamId, team, template, departments, contacts }: DmEditorProps) {
  const backgroundImage = useLoadedImage(template.image_url);
  const viewport = useViewportSize();
  const stageRef = useRef<Konva.Stage | null>(null);
  const [departmentId, setDepartmentId] = useState("");
  const [contactId, setContactId] = useState(contacts[0]?.id ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [message, setMessage] = useState("");
  const [generated, setGenerated] = useState<string | null>(null);

  const selectedDepartment = departments.find((department) => department.id === departmentId) ?? null;
  const filteredContacts = contacts.filter((contact) => !departmentId || contact.department_id === departmentId);
  const selectedContact = filteredContacts.find((contact) => contact.id === contactId) ?? filteredContacts[0] ?? null;
  const selectedElement = elements.find((element) => element.id === selectedId) ?? null;

  const scale = useMemo(() => {
    const sidePanels = viewport.width >= 1280 ? 680 : viewport.width >= 1024 ? 320 : 40;
    const availableWidth = Math.max(320, viewport.width - sidePanels - 96);
    const availableHeight = Math.max(420, viewport.height - 210);
    const fitScale = Math.min(availableWidth / template.width, availableHeight / template.height);
    return Math.min(0.92, Math.max(0.28, fitScale));
  }, [template.height, template.width, viewport.height, viewport.width]);

  useEffect(() => {
    if (selectedContact && selectedContact.id !== contactId) {
      setContactId(selectedContact.id);
    }
  }, [contactId, selectedContact]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!selectedId) return;
      if (event.key === "Delete" || event.key === "Backspace") {
        const active = document.activeElement;
        if (active && ["INPUT", "TEXTAREA", "SELECT"].includes(active.tagName)) return;
        setElements((current) => current.filter((element) => element.id !== selectedId));
        setSelectedId(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedId]);

  function updateElement(next: CanvasElement) {
    setElements((current) => current.map((element) => (element.id === next.id ? next : element)));
  }

  function addText(text = "新增文字") {
    const next: CanvasElement = {
      id: crypto.randomUUID(),
      type: "text",
      x: 80,
      y: 80,
      width: 360,
      height: 72,
      rotation: 0,
      text,
      fontSize: 36,
      fill: "#0b2345",
      fontFamily: "Noto Sans TC",
      fontStyle: "normal",
      align: "left"
    };
    setElements((current) => [...current, next]);
    setSelectedId(next.id);
  }

  async function addImageFromFile(file?: File | null) {
    try {
      const src = await readFileAsDataUrl(file);
      const next: CanvasElement = {
        id: crypto.randomUUID(),
        type: "image",
        x: 100,
        y: 120,
        width: Math.min(360, template.width * 0.42),
        height: Math.min(260, template.height * 0.3),
        rotation: 0,
        src
      };
      setElements((current) => [...current, next]);
      setSelectedId(next.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "圖片新增失敗。");
    }
  }

  async function addImageFromUrl(url?: string | null, label = "圖片") {
    if (!url) {
      setMessage(`目前沒有可插入的${label}。`);
      return;
    }

    const next: CanvasElement = {
      id: crypto.randomUUID(),
      type: "image",
      x: 100,
      y: 120,
      width: label.includes("QR") ? 180 : 220,
      height: label.includes("QR") ? 180 : 260,
      rotation: 0,
      src: url
    };
    setElements((current) => [...current, next]);
    setSelectedId(next.id);
  }

  async function addQrCode() {
    if (selectedContact?.qrcode_url) {
      await addImageFromUrl(selectedContact.qrcode_url, "QR Code");
      return;
    }

    const qrText = selectedContact?.line_id || selectedContact?.mobile || selectedContact?.email || "";
    if (!qrText) {
      setMessage("此業務沒有 QR Code、LINE、手機或 Email，無法自動產生 QR Code。");
      return;
    }

    const src = await QRCode.toDataURL(qrText, { margin: 1, width: 400 });
    await addImageFromUrl(src, "QR Code");
  }

  function updateSelectedText(patch: Partial<Extract<CanvasElement, { type: "text" }>>) {
    if (!selectedElement || selectedElement.type !== "text") return;
    updateElement({ ...selectedElement, ...patch });
  }

  function editSelectedText() {
    if (!selectedElement || selectedElement.type !== "text") return;
    const nextText = window.prompt("請輸入文字內容", selectedElement.text);
    if (nextText === null) return;
    updateElement({ ...selectedElement, text: nextText });
  }

  function deleteSelected() {
    if (!selectedId) return;
    setElements((current) => current.filter((element) => element.id !== selectedId));
    setSelectedId(null);
  }

  function clearCanvasElements() {
    if (!window.confirm("確定要清除所有自行新增的文字與圖片嗎？")) return;
    setElements([]);
    setSelectedId(null);
  }

  function createExport(format: "png" | "jpg" | "pdf") {
    const stage = stageRef.current;
    if (!stage) {
      setMessage("畫布尚未準備好。");
      return;
    }

    try {
      setSelectedId(null);
      window.setTimeout(() => {
        const png = stage.toDataURL({ mimeType: "image/png", pixelRatio: 2 });
        const name = `${template.name || "template"}-${selectedContact?.name || "DM"}`;

        if (format === "png") {
          downloadDataUrl(png, `${name}.png`);
          setGenerated(png);
          setMessage("PNG 已開始下載。");
          return;
        }

        if (format === "jpg") {
          const jpg = stage.toDataURL({ mimeType: "image/jpeg", quality: 0.92, pixelRatio: 2 });
          downloadDataUrl(jpg, `${name}.jpg`);
          setGenerated(jpg);
          setMessage("JPG 已開始下載。");
          return;
        }

        const pdf = dataUrlToPdfDataUrl(png, template.width, template.height);
        downloadDataUrl(pdf, `${name}.pdf`);
        setGenerated(png);
        setMessage("PDF 已開始下載。");
      }, 80);
    } catch {
      setMessage("下載失敗。若使用外部圖片，請改用手動上傳圖片。");
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[280px_minmax(420px,1fr)_300px]">
      <section className="space-y-4">
        <div className="luxury-panel">
          <p className="text-sm font-black uppercase tracking-normal text-gold-300">PPT Editor</p>
          <h1 className="mt-2 text-3xl font-black text-white">自由編輯</h1>
          <p className="mt-3 text-base leading-7 text-slate-200">底圖由後台提供，業務可自行新增文字、圖片並拖曳縮放。</p>
        </div>

        <div className="card p-4">
          <label className="field-label" htmlFor="departmentId">團隊＆店名</label>
          <select id="departmentId" value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}>
            <option value="">全部</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>{department.name}</option>
            ))}
          </select>

          <label className="field-label mt-4" htmlFor="contactId">業務</label>
          <select id="contactId" value={selectedContact?.id ?? ""} onChange={(event) => setContactId(event.target.value)}>
            {filteredContacts.map((contact) => {
              const department = departments.find((item) => item.id === contact.department_id);
              return (
                <option key={contact.id} value={contact.id}>
                  {department ? `${department.name} / ` : ""}{contact.name}{contact.title ? ` - ${contact.title}` : ""}
                </option>
              );
            })}
          </select>

          <button type="button" className="btn btn-secondary mt-4 w-full" onClick={() => addText(contactSummary(selectedContact, team.name, selectedDepartment?.name ?? ""))}>
            插入業務資料文字
          </button>
        </div>

        <div className="card p-4">
          <p className="field-label">新增元素</p>
          <div className="grid gap-2">
            <button type="button" className="btn btn-primary" onClick={() => addText()}>新增文字</button>
            <label className="btn btn-secondary cursor-pointer text-center">
              上傳圖片
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => void addImageFromFile(event.currentTarget.files?.[0])} />
            </label>
            <button type="button" className="btn btn-secondary" onClick={() => void addImageFromUrl(selectedContact?.avatar_url, "形象照")}>插入形象照</button>
            <button type="button" className="btn btn-secondary" onClick={() => void addQrCode()}>插入 QR Code</button>
          </div>
        </div>

        <div className="card p-4">
          <p className="field-label">操作</p>
          <div className="grid gap-2">
            <button type="button" className="btn btn-secondary" onClick={deleteSelected} disabled={!selectedId}>刪除選取元素</button>
            <button type="button" className="btn btn-secondary" onClick={clearCanvasElements}>清除自行新增內容</button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="card p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow">{team.name}</p>
              <h2 className="section-title">{template.name}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary" onClick={() => createExport("png")}>下載 PNG</button>
              <button type="button" className="btn btn-secondary" onClick={() => createExport("jpg")}>下載 JPG</button>
              <button type="button" className="btn btn-blue" onClick={() => createExport("pdf")}>下載 PDF</button>
            </div>
          </div>

          <div className="grid place-items-center rounded-2xl border border-line bg-slate-100 p-3 shadow-inner">
            <div style={{ width: template.width * scale, height: template.height * scale }}>
              <Stage
                ref={stageRef}
                width={template.width}
                height={template.height}
                scaleX={scale}
                scaleY={scale}
                className="rounded-xl bg-white shadow-panel"
                onMouseDown={(event) => {
                  if (event.target === event.target.getStage()) setSelectedId(null);
                }}
                onTouchStart={(event) => {
                  if (event.target === event.target.getStage()) setSelectedId(null);
                }}
              >
                <Layer>
                  <Rect x={0} y={0} width={template.width} height={template.height} fill="#ffffff" />
                  {backgroundImage ? (
                    <KonvaImage image={backgroundImage} x={0} y={0} width={template.width} height={template.height} />
                  ) : (
                    <Text x={40} y={40} text="尚未載入模板底圖" fontSize={32} fill="#94a3b8" />
                  )}

                  {elements.map((element) =>
                    element.type === "text" ? (
                      <EditableText
                        key={element.id}
                        element={element}
                        selected={selectedId === element.id}
                        onSelect={() => setSelectedId(element.id)}
                        onEditText={editSelectedText}
                        onChange={updateElement}
                      />
                    ) : (
                      <EditableImage
                        key={element.id}
                        element={element}
                        selected={selectedId === element.id}
                        onSelect={() => setSelectedId(element.id)}
                        onChange={updateElement}
                      />
                    )
                  )}
                </Layer>
              </Stage>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-500">畫布會自動縮放，完整顯示整張 DM；點選元素後可拖曳、拉角縮放、旋轉。</p>
        </div>

        {message ? <div className="card border-blue-200 bg-blue-50 p-4 text-base font-bold text-navy-900">{message}</div> : null}

        {generated ? (
          <div className="card p-5">
            <p className="text-base font-bold text-navy-900">手機或 LINE 無法下載時，請長按下方圖片儲存。</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={generated} alt="可長按儲存的成品圖片" className="mt-3 w-full rounded-xl border border-line bg-white" />
          </div>
        ) : null}
      </section>

      <aside className="space-y-4">
        <div className="card p-4">
          <p className="eyebrow">Style Panel</p>
          <h2 className="section-title text-2xl">文字編輯</h2>
          {selectedElement?.type === "text" ? (
            <div className="mt-4 space-y-3">
              <textarea value={selectedElement.text} onChange={(event) => updateSelectedText({ text: event.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <label>
                  <span className="field-label">字級</span>
                  <input type="number" min={8} max={180} value={selectedElement.fontSize} onChange={(event) => updateSelectedText({ fontSize: Number(event.target.value) })} />
                </label>
                <label>
                  <span className="field-label">顏色</span>
                  <input type="color" value={selectedElement.fill} onChange={(event) => updateSelectedText({ fill: event.target.value })} />
                </label>
              </div>
              <label>
                <span className="field-label">字體</span>
                <select value={selectedElement.fontFamily} onChange={(event) => updateSelectedText({ fontFamily: event.target.value })}>
                  <option value="Noto Sans TC">Noto Sans TC</option>
                  <option value="Microsoft JhengHei">Microsoft JhengHei</option>
                  <option value="sans-serif">sans-serif</option>
                  <option value="serif">serif</option>
                </select>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" className="btn btn-secondary" onClick={() => updateSelectedText({ align: "left" })}>靠左</button>
                <button type="button" className="btn btn-secondary" onClick={() => updateSelectedText({ align: "center" })}>置中</button>
                <button type="button" className="btn btn-secondary" onClick={() => updateSelectedText({ align: "right" })}>靠右</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => updateSelectedText({ fontStyle: selectedElement.fontStyle.includes("bold") ? selectedElement.fontStyle.replace("bold", "").trim() || "normal" : `${selectedElement.fontStyle === "normal" ? "" : selectedElement.fontStyle} bold`.trim() })}
                >
                  粗體
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => updateSelectedText({ fontStyle: selectedElement.fontStyle.includes("italic") ? selectedElement.fontStyle.replace("italic", "").trim() || "normal" : `${selectedElement.fontStyle === "normal" ? "" : selectedElement.fontStyle} italic`.trim() })}
                >
                  斜體
                </button>
              </div>
            </div>
          ) : selectedElement?.type === "image" ? (
            <p className="mt-4 text-sm text-slate-500">目前選取的是圖片，可直接在畫布中拖曳、拉角縮放與旋轉。</p>
          ) : (
            <p className="mt-4 text-sm text-slate-500">請先點選畫布上的文字，這裡才會顯示可調整的字型、大小與顏色。</p>
          )}
        </div>

        <div className="card p-4">
          <p className="eyebrow">Reference</p>
          <h2 className="section-title text-2xl">展示圖參考</h2>
          <div className="mt-4 rounded-xl border border-dashed border-gold-300 bg-gold-50 p-5 text-sm font-bold leading-6 text-navy-900">
            展示圖之後會放到模板列表或收合區，不會壓縮中間 DM 編輯畫布。
          </div>
        </div>
      </aside>
    </div>
  );
}
