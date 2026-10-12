import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export type ExportOutcome = 'downloaded' | 'shared' | 'unavailable';

/**
 * Hands a CSV to the user: a download in the browser, the share sheet on a phone
 * (from there it can go to Google Drive and open in Google Sheets).
 */
export async function exportCsvFile(fileName: string, content: string): Promise<ExportOutcome> {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return 'downloaded';
  }

  if (!(await Sharing.isAvailableAsync())) return 'unavailable';
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  file.write(content);
  await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: fileName, UTI: 'public.comma-separated-values-text' });
  return 'shared';
}
