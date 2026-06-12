import { DownloadRecordsClient } from "@/components/admin/DownloadRecordsClient";
import { listExportRecords } from "@/lib/data";
import type { ExportRecord } from "@/types/database";

export default async function AdminDownloadsPage() {
  let records: ExportRecord[] = [];

  try {
    records = await listExportRecords();
  } catch (error) {
    console.warn("Download records are unavailable during build.", error);
  }

  return <DownloadRecordsClient initialRecords={records} />;
}