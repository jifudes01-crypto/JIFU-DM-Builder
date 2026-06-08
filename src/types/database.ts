export type TemplateStatus = "draft" | "published" | "archived";

export type BlockType =
  | "text"
  | "title"
  | "subtitle"
  | "body"
  | "price"
  | "address"
  | "feature"
  | "image"
  | "avatar"
  | "contact"
  | "qrcode"
  | "logo";

export type TextAlign = "left" | "center" | "right";
export type ImageFit = "cover" | "contain";
export type PrintStatus = "pending" | "processing" | "sent" | "completed" | "cancelled";
export type PrintOptionType = "quantity" | "material_size" | "vendor" | "rush" | "cutting" | "paper" | "size";
export type ExportFormat = "png" | "jpg" | "pdf";

export interface Team {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  slug: string;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface Department {
  id: string;
  team_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  teams?: Pick<Team, "name"> | null;
}

export interface Template {
  id: string;
  team_id: string;
  name: string;
  category: string;
  size_label: string;
  width: number;
  height: number;
  status: TemplateStatus;
  image_url: string;
  thumbnail_url: string | null;
  description: string | null;
  notes: string | null;
  duplicated_from: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TemplateBlock {
  id: string;
  template_id: string;
  type: BlockType;
  label: string;
  required: boolean;
  max_length: number | null;
  x: number;
  y: number;
  width: number;
  height: number;
  font_size: number;
  color: string;
  text_align: TextAlign;
  image_fit: ImageFit;
  z_index: number;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface Contact {
  id: string;
  team_id: string;
  department_id: string | null;
  name: string;
  title: string | null;
  mobile: string | null;
  phone: string | null;
  email: string | null;
  line_id: string | null;
  avatar_url: string | null;
  qrcode_url: string | null;
  is_active: boolean;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
  departments?: Pick<Department, "name"> | null;
}

export interface PrintOption {
  id: string;
  type: PrintOptionType;
  label: string;
  value: string;
  vendor: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ExportRecord {
  id: string;
  team_id: string;
  template_id: string;
  contact_id: string | null;
  format: ExportFormat;
  file_url: string;
  preview_url: string | null;
  payload: Record<string, unknown>;
  created_at?: string;
}

export interface PrintRequest {
  id: string;
  team_id: string;
  template_id: string;
  contact_id: string | null;
  export_id: string | null;
  preview_url: string | null;
  png_url: string | null;
  jpg_url: string | null;
  pdf_url: string | null;
  print_quantity: string | null;
  paper: string | null;
  size: string | null;
  total_quantity: number;
  material_summary: string | null;
  vendor: string | null;
  batch_items: PrintRequestBatchItem[];
  is_rush: boolean;
  is_cutting: boolean;
  message: string | null;
  status: PrintStatus;
  internal_note: string | null;
  payload: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  teams?: Pick<Team, "name"> | null;
  templates?: Pick<Template, "name"> | null;
  contacts?: Pick<Contact, "name" | "mobile"> | null;
}

export interface PrintRequestBatchItem {
  id: string;
  contactId: string | null;
  contactName: string;
  quantity: number;
  materialSize: string;
  vendor: string;
  previewUrl?: string;
  pngUrl?: string;
  jpgUrl?: string;
  pdfUrl?: string;
  label?: string;
}

export interface TemplateWithBlocks extends Template {
  blocks: TemplateBlock[];
}

export interface EditorFormValues {
  departmentId: string;
  contactId: string;
  values: Record<string, string>;
  images: Record<string, string>;
}

export interface BatchRow {
  id: string;
  label: string;
  values: Record<string, string>;
}
