import { supabase } from '../../../shared/infrastructure/supabaseClient';
import type { CardData } from '../../cards/types';
import type { ReceivedCard, ReceivedCardInput } from '../../contacts/types';
import { getMyCards } from '../../cards/api/cardsApi';

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

  // 자기 자신의 명함인지 확인
  if (input.source_card_id) {
    const { data: sourceCard, error: cardCheckError } = await supabase
      .from('cards')
      .select('user_id')
      .eq('id', input.source_card_id)
      .maybeSingle();

    if (cardCheckError && cardCheckError.code !== 'PGRST116') {
      console.error('[shareApi] 명함 확인 오류:', cardCheckError);
      throw cardCheckError;
    }

    if (sourceCard && sourceCard.user_id === user.id) {
      const err = new Error('자기 자신의 명함은 추가할 수 없습니다.');
      (err as any).code = 'SELF_CARD_NOT_ALLOWED';
      throw err;
    }

    // 중복 방지: owner_id + source_card_id 조합 존재 여부 확인
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

  // 양방향 교환 처리: source_card_id가 있고, 받는 사람(B)의 명함이 있으면 양방향 교환
  if (input.source_card_id) {
    try {
      // 받는 사람(B)의 명함 조회
      const receiverCards = await getMyCards();
      
      if (receiverCards.length > 0) {
        // 첫 번째 명함을 사용 (또는 기본 명함 선택 로직 추가 가능)
        const receiverCard = receiverCards[0];
        
        // 양방향 교환 RPC 함수 호출
        const { data: exchangeResult, error: exchangeError } = await supabase.rpc(
          'exchange_cards_bidirectional',
          {
            p_receiver_id: user.id,
            p_sender_card_id: input.source_card_id,
            p_receiver_card_id: receiverCard.id,
            p_sender_snapshot: input.snapshot ?? {},
            p_receiver_snapshot: {
              display_name: receiverCard.display_name,
              headline: receiverCard.headline,
              organization: receiverCard.organization,
              email: receiverCard.email,
              phone: receiverCard.phone,
              links: {
                instagram: receiverCard.links.instagram,
                github: receiverCard.links.github,
                website: receiverCard.links.website,
              },
              style: {
                template_id: receiverCard.style.template_id,
                theme_color: receiverCard.style.theme_color,
                font_family: receiverCard.style.font_family,
                orientation: receiverCard.style.orientation,
              },
            },
          }
        );

        if (exchangeError) {
          console.warn('[shareApi] 양방향 교환 실패, 단방향으로 진행:', exchangeError);
          // 양방향 교환이 실패해도 단방향 저장은 계속 진행
        } else {
          console.log('[shareApi] 양방향 명함 교환 완료:', exchangeResult);
          // 양방향 교환이 성공했으므로 받는 사람의 received_cards에서 결과 조회
          if (exchangeResult && exchangeResult.length > 0) {
            const receiverCardId = exchangeResult[0].receiver_card_id;
            if (receiverCardId) {
              const { data: savedCard, error: fetchError } = await supabase
                .from('received_cards')
                .select('*')
                .eq('id', receiverCardId)
                .single();

              if (!fetchError && savedCard) {
                return {
                  id: savedCard.id,
                  owner_id: savedCard.owner_id,
                  source_card_id: savedCard.source_card_id ?? null,
                  snapshot: savedCard.snapshot ?? {},
                  tags: Array.isArray(savedCard.tags) ? savedCard.tags : [],
                  folder_id: savedCard.folder_id ?? null,
                  memo: savedCard.memo ?? null,
                  created_at: savedCard.created_at,
                  updated_at: savedCard.updated_at,
                };
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('[shareApi] 양방향 교환 시도 중 오류, 단방향으로 진행:', err);
      // 양방향 교환이 실패해도 단방향 저장은 계속 진행
    }
  }

  // 단방향 저장 (양방향 교환이 실패했거나 받는 사람의 명함이 없는 경우)
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


