import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CardPreview } from './CardPreview';
import type { CardData, FontFamilyOption } from '../types';
import { BusinessCard } from '../../../components/business-card/BusinessCard';
import { EditPanel } from '../../../components/editor/EditPanel';
import type { CardTheme, CardContentTokens } from '../../../theme/types';
import { mergeTheme } from '../../../theme/mergeTheme';
import { AiLogoGenerator } from './AiLogoGenerator';
import { uploadToStorage } from '../../../shared/infrastructure/storageApi';
import { supabase } from '../../../shared/infrastructure/supabaseClient';

type Props = {
  initialValue?: CardData | null;
  onSave: (card: CardData) => Promise<void>;
  defaultStyle?: {
    template_id: number;
    theme_color: string;
    font_family: FontFamilyOption;
    orientation: 'horizontal' | 'vertical';
  };
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
  },
  style: {
    template_id: 1,
    theme_color: '#111827',
    font_family: 'sans',
    orientation: 'horizontal',
  },
};

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition';

export function CardEditor({ initialValue, onSave, defaultStyle, avatarUrl }: Props) {
  const baseEmpty = useMemo(
    () => ({
      ...emptyCard,
      style: {
        template_id: (defaultStyle?.template_id ?? emptyCard.style.template_id) as 1 | 2,
        theme_color: defaultStyle?.theme_color ?? emptyCard.style.theme_color,
        font_family: defaultStyle?.font_family ?? emptyCard.style.font_family,
        orientation: defaultStyle?.orientation ?? emptyCard.style.orientation,
      },
    }),
    [defaultStyle],
  );

  const [value, setValue] = useState(baseEmpty as Omit<CardData, 'id'>);
  const [currentId, setCurrentId] = useState(
    initialValue?.id ?? (crypto as any).randomUUID?.() ?? String(Date.now()),
  );
  const [theme, setTheme] = useState<CardTheme>(
    () => (initialValue?.theme as CardTheme | undefined) ?? mergeTheme('minimal_light'),
  );
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('basic');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const saveTimer = useRef<number | null>(null);
  const hydratedRef = useRef(false);
  const lastSavedRef = useRef<string>('');
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    setAvatarError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');
      const url = await uploadToStorage('avatars', file, user.id);
      update('profile_url', url);
      // profileShape가 none이면 circle로 자동 전환
      setTheme((prev) =>
        prev.style.profileShape === 'none'
          ? { ...prev, style: { ...prev.style, profileShape: 'circle' } }
          : prev,
      );
    } catch (err: any) {
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
    setTheme((prev) =>
      prev.style.profileShape === 'none'
        ? { ...prev, style: { ...prev.style, profileShape: 'circle' } }
        : prev,
    );
  };

  useEffect(() => {
    if (initialValue) {
      const { id: _id, ...rest } = initialValue;
      setCurrentId(initialValue.id);
      const newValue = {
        ...baseEmpty,
        ...rest,
        links: { ...baseEmpty.links, ...rest.links },
        style: { ...baseEmpty.style, ...rest.style },
      };
      const restoredTheme = (rest.theme as CardTheme | undefined) ?? mergeTheme('minimal_light');
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
      !value.links.website
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
    },
    profileUrl: value.profile_url ?? undefined,
  }), [value]);

  useEffect(() => {
    const serialized = JSON.stringify({ v: value, t: theme });
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      lastSavedRef.current = serialized;
      return;
    }
    if (serialized === lastSavedRef.current) return;
    if (isEmptyCard) return;

    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    setSaveStatus('saving');
    setSaveMessage('저장 중...');

    saveTimer.current = window.setTimeout(async () => {
      try {
        await onSave({ id: currentId, ...value, theme });
        lastSavedRef.current = JSON.stringify({ v: value, t: theme });
        setSaveStatus('saved');
        setSaveMessage('저장됨');
      } catch (err: any) {
        setSaveStatus('error');
        setSaveMessage('저장 실패');
        setError(err?.message ?? '자동 저장 중 오류가 발생했습니다.');
      }
    }, 900);

    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [value, theme, currentId, onSave, isEmptyCard]);

  const activeIndex = TAB_ORDER.indexOf(activeTab);
  const profileSrc = value.profile_url || null;

  const renderSection = (tab: TabKey) => {
    if (tab === 'basic') {
      return (
        <div className="space-y-6">
          {/* 프로필 사진 */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">프로필 사진</p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => avatarFileInputRef.current?.click()}
                disabled={avatarUploading}
                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-2 ring-offset-2 ring-transparent hover:ring-slate-300 transition focus:outline-none disabled:opacity-60"
                title={profileSrc ? '사진 변경' : '사진 추가'}
              >
                {profileSrc ? (
                  <img src={profileSrc} alt="프로필" className="h-full w-full object-cover" />
                ) : avatarUrl ? (
                  <>
                    <img src={avatarUrl} alt="프로필" className="h-full w-full object-cover opacity-25" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-medium text-slate-500 leading-tight text-center">사진<br/>추가</span>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                    <span className="text-[10px] text-slate-400">추가</span>
                  </div>
                )}
                {avatarUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
                  </div>
                )}
              </button>
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-slate-700">
                  {profileSrc ? '사진이 명함에 표시됩니다' : '사진 없음'}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => avatarFileInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="text-xs text-slate-500 underline underline-offset-2 hover:text-slate-700 transition disabled:opacity-50"
                  >
                    {profileSrc ? '사진 변경' : '업로드'}
                  </button>
                  {!profileSrc && avatarUrl && (
                    <button
                      type="button"
                      onClick={() => handleUseProfileAvatar(avatarUrl)}
                      className="text-xs text-slate-500 underline underline-offset-2 hover:text-slate-700 transition"
                    >
                      내 프로필 사진 사용
                    </button>
                  )}
                  {profileSrc && (
                    <button
                      type="button"
                      onClick={handleAvatarDelete}
                      className="text-xs text-red-400 hover:text-red-600 transition"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
              <input
                ref={avatarFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            {avatarError && (
              <p className="mt-2 text-xs text-red-500">{avatarError}</p>
            )}
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
        </div>
      );
    }

    if (tab === 'style') {
      return (
        <div className="space-y-4">
          <BusinessCard theme={theme} data={themePreviewData} />
          <button
            type="button"
            onClick={() => setShowEditPanel(true)}
            className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100"
          >
            스타일 편집
          </button>
          <AiLogoGenerator
            currentLogoUrl={value.logo_url}
            cardInfo={{
              name: value.display_name,
              headline: value.headline || undefined,
              organization: value.organization || undefined,
            }}
            onLogoGenerated={(url) => update('logo_url', url)}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <style>{`
        @media (max-width: 1023px) {
          .card-preview-mobile { display: block !important; margin-top: 1.5rem; }
        }
      `}</style>

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
            {saveMessage && (
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
              className="rounded-full bg-slate-900 px-5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        </div>
      </div>

      {/* 미리보기 */}
      <div className="hidden space-y-3 lg:block card-preview-mobile">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">미리보기</p>
          <p className="mt-0.5 text-[11px] text-slate-400">실제 명함이 이렇게 보입니다</p>
        </div>
        <div className="sticky top-6">
          <CardPreview card={{ ...value, theme }} />
        </div>
      </div>

      <EditPanel
        isOpen={showEditPanel}
        onClose={() => setShowEditPanel(false)}
        theme={theme}
        data={themePreviewData}
        onChange={(partial) => setTheme((prev) => ({ ...prev, ...partial }))}
      />
    </div>
  );
}
