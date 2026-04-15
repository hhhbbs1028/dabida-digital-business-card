import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, Maximize2 } from 'lucide-react';
import { FullscreenCardEditor } from './FullscreenCardEditor';
import { CardPreview } from './CardPreview';
import type { CardData } from '../types';
import { CardCanvas } from '../../../components/business-card/CardCanvas';
import type { CardTheme, CardThemeStorage, CardContentTokens, ProfileShape } from '../../../theme/types';
import { mergeTheme, themeToStorage, storageToTheme } from '../../../theme/mergeTheme';

/** profileUrl이 있을 때 profileShape가 'none'이면 'circle'로 자동 전환 */
function withNormalizedProfileShape(theme: CardTheme, hasProfileUrl: boolean): CardTheme {
  if (hasProfileUrl && theme.style.profileShape === 'none') {
    return { ...theme, style: { ...theme.style, profileShape: 'circle' } };
  }
  return theme;
}
import { AiLogoGenerator } from './AiLogoGenerator';
import { useToast } from '../../../shared/ui/Toast';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { uploadToStorage } from '../../../shared/infrastructure/storageApi';
import { supabase } from '../../../shared/infrastructure/supabaseClient';
import { ThemeEditor } from '../../../pages/ThemeEditor';

type Props = {
  initialValue?: CardData | null;
  onSave: (card: CardData) => Promise<void>;
  onSaved?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  avatarUrl?: string | null;
};

type TabKey = 'basic' | 'contact' | 'links' | 'style';

const TAB_LABELS: Record<TabKey, string> = {
  basic: '기본 정보',
  contact: '연락처',
  links: '링크',
  style: '스타일',
};

const TAB_ORDER: TabKey[] = ['basic', 'contact', 'links', 'style'];

const emptyCard: Omit<CardData, 'id'> = {
  display_name: '',
  headline: '',
  organization: '',
  email: '',
  phone: '',
  links: {
    instagram: '',
    github: '',
    website: '',
    linkedin: '',
    google_drive: '',
  },
  theme: null,
};

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition';

export function CardEditor({ initialValue, onSave, onSaved, onDirtyChange, avatarUrl }: Props) {
  const baseEmpty = emptyCard;
  const { showToast } = useToast();

  const [value, setValue] = useState<Omit<CardData, 'id'>>(baseEmpty);
  const [currentId, setCurrentId] = useState(
    initialValue?.id ?? (crypto as any).randomUUID?.() ?? String(Date.now()),
  );
  const [theme, setTheme] = useState<CardTheme>(
    () => (initialValue?.theme && (initialValue.theme as any).colors ? storageToTheme(initialValue.theme) : null) ?? mergeTheme('minimal_light'),
  );

  const [showThemeEditor, setShowThemeEditor] = useState(false);
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('basic');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const hydratedRef = useRef(false);
  const lastSavedRef = useRef<string>('');
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const handleAvatarUpload = async (e?: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarUploading(true);
    setAvatarError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      let file: File;

      if (Capacitor.isNativePlatform()) {
        // 네이티브: 카메라 플러그인으로 네이티브 갤러리/카메라 선택 UI 사용
        const image = await Camera.getPhoto({
          quality: 80,
          allowEditing: true,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Prompt,
        });
        if (!image.dataUrl) throw new Error('이미지를 가져올 수 없습니다.');
        const res = await fetch(image.dataUrl);
        const blob = await res.blob();
        file = new File([blob], `avatar_${Date.now()}.jpg`, { type: 'image/jpeg' });
      } else {
        // 웹: 기존 파일 input 방식
        const f = e?.target.files?.[0];
        if (!f) return;
        file = f;
      }

      const url = await uploadToStorage('avatars', file, user.id);
      update('profile_url', url);
      setTheme((prev) => withNormalizedProfileShape(prev, true));
    } catch (err: any) {
      if (err?.message?.includes('canceled') || err?.message?.includes('cancelled')) return;
      setAvatarError(err?.message ?? '사진 업로드 중 오류가 발생했습니다.');
    } finally {
      setAvatarUploading(false);
      if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';
    }
  };

  const handleAvatarDelete = () => {
    update('profile_url', null);
    // profileShape를 none으로 되돌림
    setTheme((prev) => ({ ...prev, style: { ...prev.style, profileShape: 'none' } }));
  };

  const handleUseProfileAvatar = (url: string) => {
    update('profile_url', url);
    setTheme((prev) => withNormalizedProfileShape(prev, true));
  };

  useEffect(() => {
    if (initialValue) {
      const { id: _id, ...rest } = initialValue;
      setCurrentId(initialValue.id);
      const newValue = {
        ...baseEmpty,
        ...rest,
        links: { ...baseEmpty.links, ...rest.links },
      };
      let restoredTheme = (rest.theme ? storageToTheme(rest.theme as CardThemeStorage) : null) ?? mergeTheme('minimal_light');
      restoredTheme = withNormalizedProfileShape(restoredTheme, !!rest.profile_url);
      setValue(newValue);
      setTheme(restoredTheme);
      lastSavedRef.current = JSON.stringify({ v: newValue, t: restoredTheme });
    } else {
      const defaultTheme = mergeTheme('minimal_light');
      setValue(baseEmpty);
      setTheme(defaultTheme);
      lastSavedRef.current = JSON.stringify({ v: baseEmpty, t: defaultTheme });
    }
  }, [initialValue, baseEmpty]);

  const update = (field: keyof Omit<CardData, 'id'>, v: any) => {
    setValue((prev) => ({ ...prev, [field]: v }));
  };

  const updateLink = (key: keyof CardData['links'], v: string) => {
    setValue((prev) => ({
      ...prev,
      links: { ...prev.links, [key]: v },
    }));
  };

  const isEmptyCard = useMemo(() => {
    return (
      !initialValue &&
      !value.display_name &&
      !value.headline &&
      !value.organization &&
      !value.email &&
      !value.phone &&
      !value.links.instagram &&
      !value.links.github &&
      !value.links.website &&
      !value.links.linkedin &&
      !value.links.google_drive
    );
  }, [value, initialValue]);

  const themePreviewData = useMemo<CardContentTokens>(() => ({
    name: value.display_name,
    major: value.organization || undefined,
    tagline: value.headline || undefined,
    email: value.email || undefined,
    phone: value.phone || undefined,
    links: {
      instagram: value.links.instagram || undefined,
      github: value.links.github || undefined,
      website: value.links.website || undefined,
      linkedin: value.links.linkedin || undefined,
      google_drive: value.links.google_drive || undefined,
    },
    profileUrl: value.profile_url ?? undefined,
  }), [value]);

  // 변경 감지 → isDirty 업데이트
  useEffect(() => {
    const serialized = JSON.stringify({ v: value, t: theme });
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      return;
    }
    const dirty = serialized !== lastSavedRef.current;
    setIsDirty(dirty);
    onDirtyChange?.(dirty);
  }, [value, theme, onDirtyChange]);

  const handleManualSave = async () => {
    if (isEmptyCard || saveStatus === 'saving') return;
    setSaveStatus('saving');
    setSaveMessage('저장 중...');
    try {
      await onSave({ id: currentId, ...value, theme: themeToStorage(theme) });
      lastSavedRef.current = JSON.stringify({ v: value, t: theme });
      setSaveStatus('saved');
      setSaveMessage('저장됨');
      setIsDirty(false);
      onDirtyChange?.(false);
      showToast('저장이 완료되었습니다.', 'success');
      setActiveTab('basic');
      onSaved?.();
    } catch (err: any) {
      setSaveStatus('error');
      setSaveMessage('저장 실패');
      setError(err?.message ?? '저장 중 오류가 발생했습니다.');
    }
  };

  const activeIndex = TAB_ORDER.indexOf(activeTab);
  const profileSrc = value.profile_url || null;

  const hasPositions = theme.elementPositions && Object.keys(theme.elementPositions).length > 0;
  
  const renderSection = (tab: TabKey) => {
    if (tab === 'basic') {
      const orientation = theme.orientation ?? 'landscape';
      return (
        <div className="space-y-6">
          {/* 명함 방향 */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">명함 방향</p>
            <div className="flex gap-3">
              {/* 가로 방향 */}
              <button
                type="button"
                onClick={() => setTheme((prev) => ({ ...prev, orientation: 'landscape' }))}
                className={[
                  'flex flex-1 flex-col items-center gap-2 rounded-xl border-2 py-3 transition',
                  orientation === 'landscape'
                    ? 'border-slate-900 bg-slate-50'
                    : 'border-slate-200 bg-white hover:border-slate-300',
                ].join(' ')}
              >
                {/* 가로 명함 미니 아이콘 */}
                <div
                  className={[
                    'rounded border-2',
                    orientation === 'landscape' ? 'border-slate-900 bg-slate-200' : 'border-slate-300 bg-slate-100',
                  ].join(' ')}
                  style={{ width: '3rem', height: '1.6rem' }}
                />
                <span className={[
                  'text-xs font-medium',
                  orientation === 'landscape' ? 'text-slate-900' : 'text-slate-400',
                ].join(' ')}>가로</span>
              </button>

              {/* 세로 방향 */}
              <button
                type="button"
                onClick={() => setTheme((prev) => ({ ...prev, orientation: 'portrait' }))}
                className={[
                  'flex flex-1 flex-col items-center gap-2 rounded-xl border-2 py-3 transition',
                  orientation === 'portrait'
                    ? 'border-slate-900 bg-slate-50'
                    : 'border-slate-200 bg-white hover:border-slate-300',
                ].join(' ')}
              >
                {/* 세로 명함 미니 아이콘 */}
                <div
                  className={[
                    'rounded border-2',
                    orientation === 'portrait' ? 'border-slate-900 bg-slate-200' : 'border-slate-300 bg-slate-100',
                  ].join(' ')}
                  style={{ width: '1.6rem', height: '3rem' }}
                />
                <span className={[
                  'text-xs font-medium',
                  orientation === 'portrait' ? 'text-slate-900' : 'text-slate-400',
                ].join(' ')}>세로</span>
              </button>
            </div>
          </div>

          {/* 프로필 사진 */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">프로필 사진</p>
            {/* 모양 선택 버튼 */}
            <div className="flex gap-3 mb-4">
              {(
                [
                  {
                    id: 'none' as ProfileShape,
                    label: '없음',
                    icon: (
                      <div className="flex h-10 w-10 items-center justify-center">
                        <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      </div>
                    ),
                  },
                  {
                    id: 'circle' as ProfileShape,
                    label: '원형',
                    icon: <div className="h-10 w-10 rounded-full bg-slate-300" />,
                  },
                  {
                    id: 'rounded' as ProfileShape,
                    label: '둥근 모서리',
                    icon: <div className="h-10 w-10 rounded-xl bg-slate-300" />,
                  },
                ] as { id: ProfileShape; label: string; icon: React.ReactNode }[]
              ).map((shape) => {
                const isSelected = theme.style.profileShape === shape.id;
                return (
                  <button
                    key={shape.id}
                    type="button"
                    onClick={() => {
                      if (shape.id === 'none') {
                        handleAvatarDelete();
                      } else {
                        setTheme((prev) => ({ ...prev, style: { ...prev.style, profileShape: shape.id } }));
                        if (!profileSrc && avatarUrl) {
                          handleUseProfileAvatar(avatarUrl);
                        }
                      }
                    }}
                    className={[
                      'flex flex-1 flex-col items-center gap-2 rounded-xl border-2 py-3 transition',
                      isSelected
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 bg-white hover:border-slate-300',
                    ].join(' ')}
                  >
                    {shape.icon}
                    <span className={[
                      'text-xs font-medium',
                      isSelected ? 'text-slate-900' : 'text-slate-400',
                    ].join(' ')}>{shape.label}</span>
                  </button>
                );
              })}
            </div>

          </div>

          {/* 기본 정보 */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">기본 정보</p>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">이름</label>
                <input
                  className={inputClass}
                  value={value.display_name}
                  onChange={(e) => update('display_name', e.target.value)}
                  placeholder="홍길동"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">한 줄 소개</label>
                <input
                  className={inputClass}
                  value={value.headline}
                  onChange={(e) => update('headline', e.target.value)}
                  placeholder="Frontend Engineer · Design Lover"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">소속</label>
                <input
                  className={inputClass}
                  value={value.organization}
                  onChange={(e) => update('organization', e.target.value)}
                  placeholder="Acme Inc."
                />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (tab === 'contact') {
      return (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">필요한 항목만 입력하세요. 비워두면 명함에 표시되지 않습니다.</p>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">이메일</label>
            <input
              type="email"
              className={inputClass}
              value={value.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="hello@example.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">전화번호</label>
            <input
              type="tel"
              className={inputClass}
              value={value.phone}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="010-0000-0000"
            />
          </div>
        </div>
      );
    }

    if (tab === 'links') {
      return (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">연결하고 싶은 채널만 입력하세요.</p>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Instagram</label>
            <input
              className={inputClass}
              value={value.links.instagram}
              onChange={(e) => updateLink('instagram', e.target.value)}
              placeholder="@username"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">GitHub</label>
            <input
              className={inputClass}
              value={value.links.github}
              onChange={(e) => updateLink('github', e.target.value)}
              placeholder="username"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">웹사이트</label>
            <input
              className={inputClass}
              value={value.links.website}
              onChange={(e) => updateLink('website', e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">LinkedIn</label>
            <input
              className={inputClass}
              value={value.links.linkedin}
              onChange={(e) => updateLink('linkedin', e.target.value)}
              placeholder="https://linkedin.com/in/username"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Google Drive</label>
            <input
              className={inputClass}
              value={value.links.google_drive}
              onChange={(e) => updateLink('google_drive', e.target.value)}
              placeholder="https://drive.google.com/..."
            />
          </div>
        </div>
      );
    }

    if (tab === 'style') {
      return (
        <div className="space-y-4">
          {/* 캔버스 하단 버튼 행 */}
          <div className="flex flex-col gap-2">
            <div>
              <p className="mt-0.5 text-[11px] text-slate-400">색상, 폰트 등을 변경하고 이미지를 추가할 수 있습니다.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowThemeEditor(true)}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100"
            >
              스타일 편집
            </button>
          </div>

          {/* AI 로고 생성  */}
          {/* <AiLogoGenerator
            currentLogoUrl={value.logo_url}
            cardInfo={{
              name: value.display_name,
              headline: value.headline || undefined,
              organization: value.organization || undefined,
            }}
            onLogoGenerated={(url) => update('logo_url', url)}
          /> */}
        </div>
      );
    }

    return null;
  };

  return (
    <>
    {/* 전체화면 카드 편집기 */}
    {isCanvasFullscreen && (
      <FullscreenCardEditor
        theme={theme}
        data={themePreviewData}
        onThemeChange={(newTheme) => setTheme(newTheme)}
        onClose={() => setIsCanvasFullscreen(false)}
      />
    )}
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <style>{`
        @media (max-width: 1023px) {
          .card-preview-mobile { display: block !important; }
        }
      `}</style>
      
      {/* 미리보기 */}
      <div className="hidden space-y-3 lg:block card-preview-mobile">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">미리보기</p>
          <p className="mt-0.5 text-[11px] text-slate-400">실제 명함이 이렇게 보입니다</p>
        </div>
        
        <div className="sticky top-6">
          <div className="relative">
            <CardCanvas
              theme={theme}
              data={themePreviewData}
              onPositionsChange={(positions) =>{
                setTheme((prev) => ({ ...prev, elementPositions: positions }))}
              }
              onStickersChange={(stickers) => {
                setTheme((prev) => ({ ...prev, stickers }))}
              }
            />
            {hasPositions && (
              <button
                type="button"
                onClick={() =>
                  setTheme((prev) => ({ ...prev, elementPositions: undefined }))
                }
                className="absolute bottom-10 right-0 z-10 rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 shadow-sm transition hover:border-red-200 hover:text-red-500"
                title="위치를 기본값으로 초기화"
              >
                <RotateCcw size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsCanvasFullscreen(true)}
              className="absolute bottom-0 right-0 z-10 rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 shadow-sm transition hover:border-slate-300 hover:text-slate-700"
              title="전체화면으로 보기"
            >
              <Maximize2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 편집 패널 */}
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* 탭 네비게이션 */}
        <div className="border-b border-slate-100 bg-white px-1 pt-1">
          <div className="flex">
            {TAB_ORDER.map((tab) => {
              const isActive = tab === activeTab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={[
                    'flex-1 rounded-t-lg py-2.5 text-xs font-medium transition',
                    isActive
                      ? 'border-b-2 border-slate-900 bg-slate-50 text-slate-900'
                      : 'text-slate-400 hover:text-slate-600',
                  ].join(' ')}
                >
                  {TAB_LABELS[tab]}
                </button>
              );
            })}
          </div>
        </div>

        {/* 탭 콘텐츠 */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {renderSection(activeTab)}
          {error && (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* 하단 바 */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-5 py-3">
          <div className="flex items-center gap-1.5">
            {saveStatus === 'saving' && (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
            )}
            {isDirty && saveStatus !== 'saving' && (
              <span className="text-[11px] text-amber-500">저장되지 않은 변경사항</span>
            )}
            {!isDirty && saveMessage && (
              <span className={[
                'text-[11px]',
                saveStatus === 'error' ? 'text-red-500' : 'text-slate-400',
              ].join(' ')}>
                {saveMessage}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={activeIndex === 0}
              onClick={() => setActiveTab(TAB_ORDER[Math.max(activeIndex - 1, 0)])}
              className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              이전
            </button>
            
            <button
              type="button"
              disabled={activeIndex === TAB_ORDER.length - 1}
              onClick={() => setActiveTab(TAB_ORDER[Math.min(activeIndex + 1, TAB_ORDER.length - 1)])}
              className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              다음
            </button>

            <button
              type="button"
              disabled={!isDirty || isEmptyCard || saveStatus === 'saving'}
              onClick={handleManualSave}
              className="rounded-full bg-slate-900 px-5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              저장
            </button>
          </div>
        </div>
      </div>


    </div>

    <ThemeEditor
      isOpen={showThemeEditor}
      theme={theme}
      data={value}
      onChange={(newTheme) => setTheme(newTheme)}
      onClose={() => setShowThemeEditor(false)}
    />
    </>
  );
}
