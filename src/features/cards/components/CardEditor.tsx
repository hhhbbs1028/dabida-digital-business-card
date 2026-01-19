import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CardPreview } from './CardPreview';
import type { CardData, FontFamilyOption } from '../types';
import { StepTabs } from './StepTabs';
import { OptionalFieldGroup } from './OptionalFieldGroup';

type Props = {
  initialValue?: CardData | null;
  onSave: (card: CardData) => Promise<void>;
  defaultStyle?: {
    template_id: number;
    theme_color: string;
    font_family: FontFamilyOption;
    orientation: 'horizontal' | 'vertical';
  };
};

type TabKey = 'basic' | 'contact' | 'links' | 'style' | 'done';

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

export function CardEditor({ initialValue, onSave, defaultStyle }: Props) {
  const baseEmpty = useMemo(
    () => ({
      ...emptyCard,
      style: {
        template_id: defaultStyle?.template_id ?? emptyCard.style.template_id,
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

  // 디버깅 로그: value 변경 추적
  useEffect(() => {
    console.log('[CardEditor] editor value:', value);
  }, [value]);
  const [error, setError] = useState(null as string | null);
  const [activeTab, setActiveTab] = useState('basic' as TabKey);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showContact, setShowContact] = useState(false);
  const [showLinks, setShowLinks] = useState(false);
  const saveTimer = useRef<number | null>(null);
  const hydratedRef = useRef(false);
  const lastSavedRef = useRef<string>('');

  useEffect(() => {
    if (initialValue) {
      const { id: _id, ...rest } = initialValue;
      setCurrentId(initialValue.id);
      setValue({
        ...baseEmpty,
        ...rest,
        links: { ...baseEmpty.links, ...rest.links },
        style: { ...baseEmpty.style, ...rest.style },
      });
    } else {
      setValue(baseEmpty);
    }
    setShowContact(!!(initialValue?.email || initialValue?.phone));
    setShowLinks(
      !!(
        initialValue?.links.instagram ||
        initialValue?.links.github ||
        initialValue?.links.website
      ),
    );
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

  const updateStyle = (key: keyof CardData['style'], v: any) => {
    setValue((prev) => ({
      ...prev,
      style: { ...prev.style, [key]: v },
    }));
  };

  // 새 명함 모드에서 값이 비어있는지 확인하는 함수
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

  useEffect(() => {
    const serialized = JSON.stringify(value);
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      lastSavedRef.current = serialized;
      return;
    }
    if (serialized === lastSavedRef.current) return;

    // 새 명함 모드이고 값이 비어있으면 자동 저장하지 않음
    if (isEmptyCard) {
      return;
    }

    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
    }

    setSaveStatus('saving');
    setSaveMessage('저장 중...');

    saveTimer.current = window.setTimeout(async () => {
      try {
        await onSave({ id: currentId, ...value });
        lastSavedRef.current = JSON.stringify(value);
        setSaveStatus('saved');
        setSaveMessage('저장됨 (방금)');
      } catch (err: any) {
        console.error('[CardEditor] 자동 저장 실패:', err);
        setSaveStatus('error');
        setSaveMessage('저장 실패');
        setError(err?.message ?? '자동 저장 중 오류가 발생했습니다.');
      }
    }, 900);

    return () => {
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
      }
    };
  }, [value, currentId, onSave, isEmptyCard]);

  const renderSection = (tab: TabKey) => {
    if (tab === 'basic') {
      return (
        <>
          <div>
            <h2 className="text-xs font-semibold text-slate-900">기본 정보</h2>
            <p className="mt-1 text-[11px] text-slate-500">
              명함에 표시될 이름과 한 줄 소개, 소속을 입력하세요.
            </p>
          </div>
          <div className="mt-3 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                이름 (display_name)
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/40"
                value={value.display_name}
                onChange={(e) => update('display_name', e.target.value)}
                placeholder="홍길동"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                한 줄 소개 (headline)
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/40"
                value={value.headline}
                onChange={(e) => update('headline', e.target.value)}
                placeholder="Frontend Engineer · Design Lover"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                회사 / 조직 (organization)
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/40"
                value={value.organization}
                onChange={(e) => update('organization', e.target.value)}
                placeholder="Acme Inc."
              />
            </div>
          </div>
        </>
      );
    }

    if (tab === 'contact') {
      return (
        <>
          <div>
            <h2 className="text-xs font-semibold text-slate-900">연락처</h2>
            <p className="mt-1 text-[11px] text-slate-500">
              필요한 연락처만 추가해서 보여줄 수 있어요.
            </p>
          </div>
          <div className="mt-4 space-y-3">
            <OptionalFieldGroup
              title="연락처 항목"
              description="이메일/전화번호는 필요할 때만 추가할 수 있어요."
              isOpen={showContact}
              onToggle={() => setShowContact((prev) => !prev)}
            >
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">이메일</label>
                <input
                  type="email"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/40"
                  value={value.email}
                  onChange={(e) => update('email', e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">전화번호</label>
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/40"
                  value={value.phone}
                  onChange={(e) => update('phone', e.target.value)}
                />
              </div>
            </OptionalFieldGroup>
          </div>
        </>
      );
    }

    if (tab === 'links') {
      return (
        <>
          <div>
            <h2 className="text-xs font-semibold text-slate-900">링크</h2>
            <p className="mt-1 text-[11px] text-slate-500">
              연결하고 싶은 채널만 추가하세요.
            </p>
          </div>
          <div className="mt-3 space-y-3">
            <OptionalFieldGroup
              title="링크 항목"
              description="필요한 채널만 추가해 주세요."
              isOpen={showLinks}
              onToggle={() => setShowLinks((prev) => !prev)}
            >
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Instagram</label>
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/40"
                  value={value.links.instagram}
                  onChange={(e) => updateLink('instagram', e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">GitHub</label>
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/40"
                  value={value.links.github}
                  onChange={(e) => updateLink('github', e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Website</label>
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/40"
                  value={value.links.website}
                  onChange={(e) => updateLink('website', e.target.value)}
                />
              </div>
            </OptionalFieldGroup>
          </div>
        </>
      );
    }

    if (tab === 'style') {
      const templateSwatches: { id: 1 | 2; label: string; color: string }[] = [
        { id: 1, label: 'Template 1', color: '#dbeafe' },
        { id: 2, label: 'Template 2', color: '#dcfce7' },
      ];

      const accentColors = ['#0f766e', '#2563eb', '#7c3aed', '#f97316', '#ef4444', '#6366f1'];

      return (
        <>
          <div>
            <h2 className="text-xs font-semibold text-slate-900">스타일</h2>
            <p className="mt-1 text-[11px] text-slate-500">
              템플릿과 테마를 선택하세요.
            </p>
          </div>

          <div className="mt-4 grid gap-5 md:grid-cols-[170px,minmax(0,1fr)]">
            <div className="space-y-4 rounded-2xl bg-white/80 p-3 shadow-sm">
              <div>
                <p className="mb-1.5 text-[11px] font-medium text-slate-600">템플릿</p>
                <div className="grid grid-cols-2 gap-2">
                  {templateSwatches.map((tpl) => {
                    const isActive = value.style.template_id === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => {
                          updateStyle('template_id', tpl.id);
                          updateStyle('theme_color', tpl.color);
                        }}
                        className={[
                          'flex h-12 items-center justify-center rounded-xl border text-[11px] font-medium transition',
                          isActive
                            ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300',
                        ].join(' ')}
                      >
                        <span
                          className="mr-2 h-6 w-6 rounded-md"
                          style={{ backgroundColor: tpl.color }}
                        />
                        {tpl.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-[11px] font-medium text-slate-600">색상</p>
                <div className="flex flex-wrap gap-2">
                  {accentColors.map((c) => {
                    const isActive = value.style.theme_color === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => updateStyle('theme_color', c)}
                        className={[
                          'flex h-7 w-7 items-center justify-center rounded-full border-2 transition',
                          isActive ? 'border-slate-900' : 'border-transparent hover:border-slate-300',
                        ].join(' ')}
                      >
                        <span className="h-5 w-5 rounded-full" style={{ backgroundColor: c }} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-[11px] font-medium text-slate-600">폰트</p>
                <div className="space-y-1.5">
                  {(['sans', 'serif', 'mono'] as FontFamilyOption[]).map((ff) => {
                    const isActive = value.style.font_family === ff;
                    return (
                      <button
                        key={ff}
                        type="button"
                        onClick={() => updateStyle('font_family', ff)}
                        className={[
                          'flex w-full items-center justify-between rounded-xl border px-3 py-2 text-[11px] transition',
                          isActive
                            ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
                        ].join(' ')}
                      >
                        <span>
                          {ff === 'sans' && 'Sans'}
                          {ff === 'serif' && 'Serif'}
                          {ff === 'mono' && 'Mono'}
                        </span>
                        <span
                          className={[
                            'rounded-full px-2 py-0.5 text-[10px]',
                            isActive
                              ? 'bg-white/10 text-slate-100'
                              : 'bg-slate-100 text-slate-500',
                          ].join(' ')}
                        >
                          선택
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-[11px] font-medium text-slate-600">카드 방향</p>
                <div className="flex gap-2">
                  {(['horizontal', 'vertical'] as const).map((ori) => (
                    <button
                      key={ori}
                      type="button"
                      onClick={() => updateStyle('orientation', ori)}
                      className={[
                        'flex-1 rounded-xl border px-3 py-2 text-[11px] transition',
                        value.style.orientation === ori
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                      ].join(' ')}
                    >
                      {ori === 'horizontal' ? '가로형' : '세로형'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="hidden items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-[11px] text-slate-500 md:flex">
              선택한 스타일은 오른쪽 미리보기에 즉시 반영됩니다.
            </div>
          </div>
        </>
      );
    }

    return (
      <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <h2 className="text-xs font-semibold text-slate-900">완료</h2>
        <p className="text-[11px] text-slate-500">
          입력한 정보를 확인하고 자동 저장 상태를 확인하세요.
        </p>
      </div>
    );
  };

  const steps = ['기본정보', '연락처', '링크', '스타일', '완료'];
  const tabOrder: TabKey[] = ['basic', 'contact', 'links', 'style', 'done'];
  const activeIndex = tabOrder.indexOf(activeTab);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      {/* 모바일에서도 미리보기 보이도록 보장 */}
      <style>{`
        @media (max-width: 1023px) {
          .card-preview-mobile {
            display: block !important;
            margin-top: 1.5rem;
          }
        }
      `}</style>
      <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50/60 shadow-sm">
        <StepTabs
          steps={steps}
          activeIndex={activeIndex}
          onSelect={(index) => setActiveTab(tabOrder[index] ?? 'basic')}
        />

        <div className="flex-1 px-4 py-4 md:px-5">
          {renderSection(activeTab)}
          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50/80 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-white/80 px-4 py-3">
          <div className="text-[11px] text-slate-500">
            {saveMessage && (
              <span className={saveStatus === 'error' ? 'text-red-600' : 'text-slate-500'}>
                {saveMessage}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={activeIndex === 0}
              onClick={() =>
                setActiveTab(tabOrder[Math.max(activeIndex - 1, 0)] ?? 'basic')
              }
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              이전
            </button>
            <button
              type="button"
              disabled={activeIndex === steps.length - 1}
              onClick={() =>
                setActiveTab(
                  tabOrder[Math.min(activeIndex + 1, steps.length - 1)] ?? 'done',
                )
              }
              className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              다음
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3 card-preview-mobile">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            미리보기
          </h2>
          <p className="mt-1 text-[11px] text-slate-500">
            실제 사용자에게 보여질 명함 카드가 이렇게 보입니다.
          </p>
        </div>
        <div className="sticky top-6 block w-full">
          <CardPreview card={value} />
        </div>
      </div>
    </div>
  );
}


