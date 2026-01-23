import { supabase } from './supabaseClient';

/**
 * Supabase Storage에 파일을 업로드하고 URL을 반환하는 유틸리티
 * 
 * 사용 예시:
 * ```typescript
 * // 로고 이미지 업로드
 * const logoFile = new File([blob], 'logo.png', { type: 'image/png' });
 * const logoUrl = await uploadToStorage('logos', logoFile, userId);
 * 
 * // 명함 스냅샷 이미지 업로드
 * const cardImageBlob = await htmlToImage.toBlob(element);
 * const cardImageFile = new File([cardImageBlob], 'card.png', { type: 'image/png' });
 * const cardImageUrl = await uploadToStorage('cards', cardImageFile, userId);
 * ```
 */

/**
 * Supabase Storage에 파일 업로드
 * @param bucketName 스토리지 버킷 이름 (예: 'logos', 'cards')
 * @param file 업로드할 파일
 * @param userId 사용자 ID (파일 경로에 포함)
 * @param folderName 선택적 폴더명 (예: 'logos', 'snapshots')
 * @returns Public URL
 */
export async function uploadToStorage(
  bucketName: string,
  file: File,
  userId: string,
  folderName?: string,
): Promise<string> {
  // 파일명 생성: {userId}/{timestamp}-{random}-{originalName}
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  const fileName = folderName
    ? `${folderName}/${userId}/${timestamp}-${random}-${file.name}`
    : `${userId}/${timestamp}-${random}-${file.name}`;

  // 파일 업로드
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false, // 같은 파일명이면 덮어쓰지 않음
    });

  if (error) {
    console.error('[storageApi] 파일 업로드 오류:', error);
    throw new Error(`파일 업로드 실패: ${error.message}`);
  }

  // Public URL 가져오기
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucketName).getPublicUrl(fileName);

  if (!publicUrl) {
    throw new Error('Public URL을 가져올 수 없습니다.');
  }

  console.log('[storageApi] 파일 업로드 성공:', publicUrl);
  return publicUrl;
}

/**
 * Base64 이미지를 File 객체로 변환
 * @param base64String Base64 인코딩된 이미지 문자열
 * @param fileName 파일명
 * @returns File 객체
 */
export function base64ToFile(base64String: string, fileName: string): File {
  // Base64 문자열에서 데이터 부분만 추출
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'image/png' });
  return new File([blob], fileName, { type: 'image/png' });
}

/**
 * Blob을 File 객체로 변환
 * @param blob Blob 객체
 * @param fileName 파일명
 * @returns File 객체
 */
export function blobToFile(blob: Blob, fileName: string): File {
  return new File([blob], fileName, { type: blob.type || 'image/png' });
}

/**
 * Storage에서 파일 삭제
 * @param bucketName 버킷 이름
 * @param filePath 파일 경로
 */
export async function deleteFromStorage(bucketName: string, filePath: string): Promise<void> {
  const { error } = await supabase.storage.from(bucketName).remove([filePath]);

  if (error) {
    console.error('[storageApi] 파일 삭제 오류:', error);
    throw new Error(`파일 삭제 실패: ${error.message}`);
  }

  console.log('[storageApi] 파일 삭제 성공:', filePath);
}

/**
 * URL에서 파일 경로 추출
 * @param url Supabase Storage URL
 * @returns 파일 경로
 */
export function extractFilePathFromUrl(url: string): string | null {
  // Supabase Storage URL 형식: https://xxx.supabase.co/storage/v1/object/public/bucket/path
  const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
  return match ? match[1] : null;
}

