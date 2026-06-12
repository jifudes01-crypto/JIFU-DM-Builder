import { DownloadRecordsClient } from "@/components/admin/DownloadRecordsClient";
import { listExportRecords } from "@/lib/data";

export default async function AdminDownloadsPage() {
  let records = [];

  try {
    records = await listExportRecords();
  } catch (error) {
    console.warn("Download records are unavailable during build.", error);
  }

  return <DownloadRecordsClient initialRecords={records} />;
}