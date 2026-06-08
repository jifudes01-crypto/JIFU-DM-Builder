import type { RefObject } from "react";
import type { Contact, Department, Team, TemplateWithBlocks } from "@/types/database";

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
  team?: Team | null;
  department?: Department | null;
  scale?: number;
  stageRef?: RefObject<StageExportHandle | null>;
  showGuides?: boolean;
}

export interface DmEditorProps {
  teamId: string;
  team: Team;
  template: TemplateWithBlocks;
  departments: Department[];
  contacts: Contact[];
}

export interface TemplateBlockEditorProps {
  template: TemplateWithBlocks;
}
