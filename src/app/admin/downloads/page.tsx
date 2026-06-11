import { DownloadRecordsClient } from "@/components/admin/DownloadRecordsClient";
import { listExportRecords } from "@/lib/data";

export default async function AdminDownloadsPage() {
  const records = await listExportRecords();

  return <DownloadRecordsClient initialRecords={records} />;
}
