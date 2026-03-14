/**
 * Gemini API 유틸리티 - 이미지 생성
 *
 * 모델: gemini-2.0-flash-preview-image-generation
 * 사용자 명함 정보를 기반으로 로고 이미지를 생성합니다.
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const GEMINI_IMAGE_MODEL = 'gemini-2.0-flash-exp-image-generation';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export type LogoGenerationInput = {
  name: string;
  headline?: string;
  organization?: string;
};

export type GeminiImageResult = {
  mimeType: string;
  data: string; // base64
};

/**
 * 명함 정보를 바탕으로 로고 생성용 프롬프트를 구성합니다.
 */
function buildLogoPrompt(input: LogoGenerationInput): string {
  const parts: string[] = [];

  if (input.organization) {
    parts.push(`Organization: ${input.organization}`);
  }
  if (input.name) {
    parts.push(`Person name: ${input.name}`);
  }
  if (input.headline) {
    parts.push(`Role or tagline: ${input.headline}`);
  }

  const context = parts.join(', ');

  return (
    `Create a clean, minimal, professional logo/icon for a digital business card. ` +
    `Context: ${context}. ` +
    `Style requirements: simple geometric shapes, flat design, no text, ` +
    `suitable as a small icon (64x64 or 128x128), transparent or white background, ` +
    `single cohesive color palette, modern and elegant look.`
  );
}

/**
 * Gemini API를 사용해 로고 이미지를 생성합니다.
 * @returns base64 이미지 데이터 및 mimeType
 * @throws API 키 미설정 또는 생성 실패 시
 */
export async function generateLogoWithGemini(
  input: LogoGenerationInput,
): Promise<GeminiImageResult> {
  if (!GEMINI_API_KEY) {
    throw new Error(
      'VITE_GEMINI_API_KEY가 설정되지 않았습니다. .env.local 파일에 키를 추가해 주세요.',
    );
  }

  const prompt = buildLogoPrompt(input);

  const response = await fetch(
    `${GEMINI_BASE_URL}/${GEMINI_IMAGE_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseModalities: ['IMAGE', 'TEXT'],
        },
      }),
    },
  );

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Gemini API 오류 (${response.status}): ${errText}`);
  }

  const json = await response.json();

  // 응답에서 이미지 파트 추출
  const parts: any[] = json?.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find(
    (p: any) => p.inlineData && p.inlineData.mimeType?.startsWith('image/'),
  );

  if (!imagePart) {
    throw new Error('Gemini API에서 이미지를 생성하지 못했습니다. 다시 시도해 주세요.');
  }

  return {
    mimeType: imagePart.inlineData.mimeType as string,
    data: imagePart.inlineData.data as string,
  };
}
