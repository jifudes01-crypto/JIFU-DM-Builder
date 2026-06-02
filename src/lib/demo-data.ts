import type {
  Contact,
  PrintOption,
  PrintRequest,
  Team,
  TemplateWithBlocks
} from "@/types/database";

export const demoTeams: Team[] = [
  {
    id: "demo-team-main",
    name: "台北一部",
    slug: "taipei-1",
    is_active: true,
    sort_order: 1
  },
  {
    id: "demo-team-luxury",
    name: "豪宅事業部",
    slug: "luxury",
    is_active: true,
    sort_order: 2
  }
];

export const demoTemplates: TemplateWithBlocks[] = [
  {
    id: "demo-template-a4",
    team_id: "demo-team-main",
    name: "每月精選 A4 直式",
    category: "每月精選物件",
    size_label: "A4 直式",
    width: 794,
    height: 1123,
    status: "published",
    image_url: "",
    thumbnail_url: null,
    notes: "Demo 模板；正式版請從後台上傳底圖。",
    duplicated_from: null,
    blocks: [
      {
        id: "b-title",
        template_id: "demo-template-a4",
        type: "title",
        label: "主標題",
        required: true,
        max_length: 18,
        x: 72,
        y: 76,
        width: 500,
        height: 72,
        font_size: 34,
        color: "#0f2a44",
        text_align: "left",
        image_fit: "cover",
        z_index: 1
      },
      {
        id: "b-image",
        template_id: "demo-template-a4",
        type: "image",
        label: "主視覺圖片",
        required: true,
        max_length: null,
        x: 72,
        y: 180,
        width: 650,
        height: 370,
        font_size: 16,
        color: "#0f2a44",
        text_align: "center",
        image_fit: "cover",
        z_index: 2
      },
      {
        id: "b-price",
        template_id: "demo-template-a4",
        type: "price",
        label: "價格",
        required: true,
        max_length: 24,
        x: 72,
        y: 588,
        width: 430,
        height: 70,
        font_size: 32,
        color: "#2d8cff",
        text_align: "left",
        image_fit: "cover",
        z_index: 3
      },
      {
        id: "b-address",
        template_id: "demo-template-a4",
        type: "address",
        label: "地址",
        required: true,
        max_length: 36,
        x: 72,
        y: 675,
        width: 560,
        height: 48,
        font_size: 20,
        color: "#334155",
        text_align: "left",
        image_fit: "cover",
        z_index: 4
      },
      {
        id: "b-feature",
        template_id: "demo-template-a4",
        type: "body",
        label: "特色說明",
        required: true,
        max_length: 68,
        x: 72,
        y: 748,
        width: 580,
        height: 118,
        font_size: 19,
        color: "#334155",
        text_align: "left",
        image_fit: "cover",
        z_index: 5
      },
      {
        id: "b-avatar",
        template_id: "demo-template-a4",
        type: "avatar",
        label: "聯絡人頭像",
        required: false,
        max_length: null,
        x: 72,
        y: 920,
        width: 92,
        height: 92,
        font_size: 14,
        color: "#0f2a44",
        text_align: "center",
        image_fit: "cover",
        z_index: 6
      },
      {
        id: "b-contact",
        template_id: "demo-template-a4",
        type: "contact",
        label: "聯絡資訊",
        required: false,
        max_length: 60,
        x: 186,
        y: 926,
        width: 360,
        height: 86,
        font_size: 18,
        color: "#0f2a44",
        text_align: "left",
        image_fit: "cover",
        z_index: 7
      },
      {
        id: "b-qr",
        template_id: "demo-template-a4",
        type: "qrcode",
        label: "QR Code",
        required: false,
        max_length: null,
        x: 610,
        y: 916,
        width: 96,
        height: 96,
        font_size: 14,
        color: "#0f2a44",
        text_align: "center",
        image_fit: "contain",
        z_index: 8
      }
    ]
  }
];

export const demoContacts: Contact[] = [
  {
    id: "demo-contact-wang",
    team_id: "demo-team-main",
    name: "王專員",
    title: "不動產顧問",
    mobile: "0912-345-678",
    phone: "02-2345-6789",
    email: "wang@example.com",
    line_id: "jifu_wang",
    avatar_url: null,
    qrcode_url: null,
    is_active: true,
    notes: "Demo 聯絡人"
  }
];

export const demoPrintOptions: PrintOption[] = [
  { id: "po-quantity-100", type: "quantity", label: "100 份", value: "100", sort_order: 1, is_active: true },
  { id: "po-quantity-300", type: "quantity", label: "300 份", value: "300", sort_order: 2, is_active: true },
  { id: "po-paper-art", type: "paper", label: "銅版紙", value: "銅版紙", sort_order: 1, is_active: true },
  { id: "po-paper-matte", type: "paper", label: "霧面紙", value: "霧面紙", sort_order: 2, is_active: true },
  { id: "po-size-a4", type: "size", label: "A4", value: "A4", sort_order: 1, is_active: true },
  { id: "po-rush-yes", type: "rush", label: "急件", value: "yes", sort_order: 1, is_active: true },
  { id: "po-cut-yes", type: "cutting", label: "需要裁切", value: "yes", sort_order: 1, is_active: true }
];

export const demoPrintRequests: PrintRequest[] = [];
