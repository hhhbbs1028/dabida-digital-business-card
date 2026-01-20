import { supabase } from '../../../shared/infrastructure/supabaseClient';
import type { CardData } from '../../cards/types';
import type { ReceivedCard, ReceivedCardInput } from '../../contacts/types';

export type PublicCard = CardData & {
  is_public?: boolean;
};

export async function getPublicCard(cardId: string): Promise<PublicCard | null> {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('id', cardId)
    // is_public 컬럼이 아직 없을 수도 있으므로, 우선은 단순 조회
    .maybeSingle();

  if (error) {
    console.error('[shareApi] 공개 카드 조회 오류:', error);
    throw error;
  }

  if (!data) return null;

  // cardsApi.normalizeCard 와 동일한 형태로 정규화
  const card: PublicCard = {
    id: data.id,
    display_name: data.display_name ?? '',
    headline: data.headline ?? '',
    organization: data.organization ?? '',
    email: data.email ?? '',
    phone: data.phone ?? '',
    links: {
      instagram: data.links?.instagram ?? '',
      github: data.links?.github ?? '',
      website: data.links?.website ?? '',
    },
    style: {
      template_id: data.style?.template_id ?? 1,
      theme_color: data.style?.theme_color ?? '#111827',
      font_family: data.style?.font_family ?? 'sans',
      orientation: data.style?.orientation ?? 'horizontal',
    },
    is_public: (data as any).is_public ?? true,
  };

  return card;
}

export async function saveReceivedCardFromPublicCard(
  input: ReceivedCardInput,
): Promise<ReceivedCard> {
  // contactsApi.createReceivedCard 를 직접 쓰지 않는 이유:
  // - 순환 의존을 피하고, 공유 플로우에 특화된 에러 메시지/로깅을 남기기 위함
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error('[shareApi] 사용자 확인 오류:', userError);
    throw userError;
  }

  if (!user) {
    throw new Error('로그인이 필요합니다.');
  }

  // 중복 방지: owner_id + source_card_id 조합 존재 여부 확인
  if (input.source_card_id) {
    const { data: existing, error: checkError } = await supabase
      .from('received_cards')
      .select('id')
      .eq('owner_id', user.id)
      .eq('source_card_id', input.source_card_id)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116: 결과 없음
      console.error('[shareApi] 중복 확인 오류:', checkError);
      throw checkError;
    }

    if (existing) {
      const err = new Error('이미 저장된 명함입니다.');
      (err as any).code = 'DUPLICATE_RECEIVED_CARD';
      throw err;
    }
  }

  const record = {
    owner_id: user.id,
    source_card_id: input.source_card_id ?? null,
    snapshot: input.snapshot ?? {},
    tags: input.tags ?? [],
    folder_id: input.folder_id ?? null,
    memo: input.memo ?? null,
  };

  const { data, error } = await supabase
    .from('received_cards')
    .insert(record)
    .select('*')
    .single();

  if (error) {
    console.error('[shareApi] 받은 명함 생성 오류:', error);
    throw error;
  }

  return {
    id: data.id,
    owner_id: data.owner_id,
    source_card_id: data.source_card_id ?? null,
    snapshot: data.snapshot ?? {},
    tags: Array.isArray(data.tags) ? data.tags : [],
    folder_id: data.folder_id ?? null,
    memo: data.memo ?? null,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}


