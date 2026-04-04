/**
 * ThemeEditor Page
 *
 * /theme-editor 라우트에서 렌더링되는 독립형 테마 편집 페이지.
 * BusinessCard 미리보기 + EditPanel(바텀시트)로 구성됩니다.
 */

import { useState } from 'react';
import { BusinessCard } from '../components/business-card/BusinessCard';
import { EditPanel } from '../components/editor/EditPanel';
import type { CardTheme, CardContentTokens } from '../theme/types';
import { mergeTheme } from '../theme/mergeTheme';

const DEFAULT_THEME: CardTheme = mergeTheme('minimal_light');

const DEFAULT_DATA: CardContentTokens = {
  name: '홍길동',
  major: 'Computer Science',
  tagline: 'Frontend Engineer · Design Lover',
  email: 'hong@example.com',
  phone: '010-1234-5678',
  links: {
    instagram: '@honggildong',
    github: 'github.com/hong',
    website: 'hong.dev',
  },
  profileUrl: undefined,
};

export function ThemeEditor() {
  const [theme, setTheme] = useState<CardTheme>(DEFAULT_THEME);
  const [data, setData] = useState<CardContentTokens>(DEFAULT_DATA);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);

  const handleThemeChange = (partial: Partial<CardTheme>) => {
    setTheme((prev) => ({
      ...prev,
      ...partial,
      style: partial.style ? { ...prev.style, ...partial.style } : prev.style,
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">명함 커스터마이징</h1>
              <p className="mt-0.5 text-sm text-slate-500">템플릿 커스터마이징 엔진 v1 데모</p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditPanelOpen(true)}
              className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              스타일 편집
            </button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* 좌측: 미리보기 */}
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">미리보기</h2>
              <p className="mt-1 text-xs text-slate-500">변경 사항이 즉시 반영됩니다</p>
            </div>
            <div className="sticky top-24">
              <BusinessCard theme={theme} data={data} />
            </div>
          </div>

          {/* 우측: 콘텐츠 편집 */}
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">콘텐츠 편집</h2>
              <p className="mt-1 text-xs text-slate-500">명함에 표시될 정보를 입력하세요</p>
            </div>
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">이름</label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/40"
                  placeholder="홍길동"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">전공/소속</label>
                <input
                  type="text"
                  value={data.major || ''}
                  onChange={(e) => setData({ ...data, major: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/40"
                  placeholder="Computer Science"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">한 줄 소개</label>
                <input
                  type="text"
                  value={data.tagline || ''}
                  onChange={(e) => setData({ ...data, tagline: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/40"
                  placeholder="Frontend Engineer · Design Lover"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">이메일</label>
                <input
                  type="email"
                  value={data.email || ''}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/40"
                  placeholder="hong@example.com"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">전화번호</label>
                <input
                  type="tel"
                  value={data.phone || ''}
                  onChange={(e) => setData({ ...data, phone: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/40"
                  placeholder="010-1234-5678"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">프로필 이미지 URL (선택)</label>
                <input
                  type="url"
                  value={data.profileUrl || ''}
                  onChange={(e) => setData({ ...data, profileUrl: e.target.value || undefined })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/40"
                  placeholder="https://example.com/profile.jpg"
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <EditPanel
        isOpen={isEditPanelOpen}
        onClose={() => setIsEditPanelOpen(false)}
        theme={theme}
        data={data}
        onChange={handleThemeChange}
      />
    </div>
  );
}
