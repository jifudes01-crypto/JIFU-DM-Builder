import type { RefObject } from "react";
import type { Contact, TemplateWithBlocks } from "@/types/database";

export interface StageExportHandle {
  toDataURL(config?: {
    mimeType?: string;
    quality?: number;
    pixelRatio?: number;
  }): string;
}

export interface TemplateCanvasPreviewProps {
  template: TemplateWithBlocks;
  values: Record<string, string>;
  images: Record<string, string>;
  contact: Contact | null;
  scale?: number;
  stageRef?: RefObject<StageExportHandle | null>;
  showGuides?: boolean;
}

export interface DmEditorProps {
  teamId: string;
  template: TemplateWithBlocks;
  contacts: Contact[];
}

export interface TemplateBlockEditorProps {
  template: TemplateWithBlocks;
}
