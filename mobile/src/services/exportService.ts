import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

function safeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function shareCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");
  const file = new File(Paths.cache, safeFilename(filename));
  if (file.exists) file.delete();
  file.create();
  file.write(`\uFEFF${csv}`);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Bu cihazda dosya paylaşımı kullanılamıyor.");
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: "text/csv",
    dialogTitle: "CSV dosyasını paylaş",
    UTI: "public.comma-separated-values-text",
  });
}
