import * as FileSystem from 'expo-file-system';

export async function uriToBase64(uri: string): Promise<string | null> {
  try {
    if (uri.startsWith('data:')) {
      const base64 = uri.split(',')[1];
      return base64 || null;
    }
    if (uri.startsWith('file://') || uri.startsWith('content://')) {
      const content = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return content;
    }
    return null;
  } catch {
    return null;
  }
}
