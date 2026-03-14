/**
 * AiLogoGenerator
 *
 * 사용자의 명함 정보를 기반으로 Gemini API를 호출해 로고 이미지를 생성하고,
 * Supabase Storage에 업로드한 뒤 logo_url을 반환합니다.
 */

import React, { useState } from 'react';
import { generateLogoWithGemini } from '../../../shared/infrastructure/geminiApi';
import { uploadToStorage, base64ToFile } from '../../../shared/infrastructure/storageApi';
import { supabase } from '../../../shared/infrastructure/supabaseClient';
import type { LogoGenerationInput } from '../../../shared/infrastructure/geminiApi';

type Props = {
  /** 현재 명함에 저장된 로고 URL */
  currentLogoUrl?: string | null;
  /** 프롬프트 생성에 사용할 명함 정보 */
  cardInfo: LogoGenerationInput;
  /** 업로드 완료 후 URL 반환 콜백 */
  onLogoGenerated: (url: string) => void;
};

type GenerationState = 'idle' | 'generating' | 'done' | 'error';

export function AiLogoGenerator({ currentLogoUrl, cardInfo, onLogoGenerated }: Props) {
  const [state, setState] = useState<GenerationState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl ?? null);

  const handleGenerate = async () => {
    if (!cardInfo.name && !cardInfo.organization) {
      setErrorMsg('이름 또는 소속을 먼저 입력해 주세요.');
      setState('error');
      return;
    }

    setState('generating');
    setErrorMsg(null);

    try {
      // 1. Gemini로 이미지 생성
      const result = await generateLogoWithGemini(cardInfo);

      // 2. base64 → File 변환
      const dataUrl = `data:${result.mimeType};base64,${result.data}`;
      const logoFile = base64ToFile(dataUrl, `ai-logo-${Date.now()}.png`);

      // 3. 현재 사용자 ID 획득
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      // 4. Supabase Storage 업로드
      const publicUrl = await uploadToStorage('logos', logoFile, user.id);

      // 5. 미리보기 업데이트 및 상위 콜백
      setPreviewUrl(publicUrl);
      onLogoGenerated(publicUrl);
      setState('done');
    } catch (err: any) {
      console.error('[AiLogoGenerator] 로고 생성 실패:', err);
      setErrorMsg(err?.message ?? '이미지 생성 중 오류가 발생했습니다.');
      setState('error');
    }
  };

  const handleRetry = () => {
    setState('idle');
    setErrorMsg(null);
  };

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">AI 로고 생성</h3>
        <p className="mt-1 text-xs text-slate-500">
          입력한 이름·소개·소속 정보를 바탕으로 Gemini AI가 로고를 만들어 드립니다.
        </p>
      </div>

      {/* 미리보기 */}
      {previewUrl && (
        <div className="flex justify-center">
          <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
            <img
              src={previewUrl}
              alt="AI 생성 로고"
              className="h-full w-full object-contain"
            />
            {state === 'done' && (
              <div className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white shadow">
                ✓
              </div>
            )}
          </div>
        </div>
      )}

      {/* 오류 메시지 */}
      {state === 'error' && errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      {/* 버튼 영역 */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={state === 'generating'}
          className={[
            'flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition',
            state === 'generating'
              ? 'cursor-not-allowed bg-slate-100 text-slate-400'
              : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95',
          ].join(' ')}
        >
          {state === 'generating' ? (
            <>
              <SpinnerIcon />
              생성 중...
            </>
          ) : previewUrl ? (
            '다시 생성'
          ) : (
            <>
              <SparkleIcon />
              AI 로고 생성
            </>
          )}
        </button>

        {state === 'error' && (
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:border-slate-300 hover:bg-slate-50"
          >
            초기화
          </button>
        )}
      </div>

      <p className="text-[10px] text-slate-400">
        * 생성에 몇 초 정도 걸릴 수 있습니다. 명함 정보를 먼저 입력하면 더 좋은 결과를 얻을 수 있어요.
      </p>
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2l2.4 7.2H22l-6.2 4.5 2.4 7.2L12 16.4l-6.2 4.5 2.4-7.2L2 9.2h7.6z" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-spin"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
