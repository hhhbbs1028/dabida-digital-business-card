# 채팅 기능 테스트 가이드

## 현재 상황

채팅 기능은 **실제 사용자 ID(UUID 형식)**가 필요합니다. Mock 데이터의 `user_id`는 `snapshot_김민수_0` 형식이라 UUID가 아니므로 채팅할 수 없습니다.

## 테스트 방법

### 방법 1: 두 개의 실제 사용자 계정 사용 (권장)

1. **첫 번째 계정 생성**
   - 브라우저/기기 1에서 앱에 로그인
   - 계정 생성 및 프로필 설정 완료
   - Supabase 대시보드 → Authentication → Users에서 `user_id` 확인 (예: `abc-123-def-456`)

2. **두 번째 계정 생성**
   - 브라우저/기기 2에서 앱에 로그인 (다른 이메일 사용)
   - 계정 생성 및 프로필 설정 완료
   - Supabase 대시보드 → Authentication → Users에서 `user_id` 확인

3. **채팅 테스트**
   - 계정 1에서 커뮤니티 탭 → 친구찾기/파도타기
   - 계정 2의 프로필 찾기 (또는 직접 user_id 사용)
   - "메시지 보내기" 버튼 클릭
   - 채팅 UI 확인 및 메시지 전송 테스트

### 방법 2: SQL로 테스트 사용자 생성

Supabase SQL Editor에서 실행:

```sql
-- 1. 테스트용 사용자 계정 2개 생성 (Supabase Auth에서 직접 생성 필요)
-- Supabase Dashboard → Authentication → Add User

-- 2. 각 사용자의 user_id 확인
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 2;

-- 3. 프로필 생성 (user_id를 위에서 확인한 값으로 교체)
INSERT INTO profiles (user_id, display_name, university, major)
VALUES 
  ('USER_ID_1', '테스트 사용자 1', '서울대학교', '컴퓨터공학과'),
  ('USER_ID_2', '테스트 사용자 2', '연세대학교', '전기전자공학과')
ON CONFLICT (user_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  university = EXCLUDED.university,
  major = EXCLUDED.major;

-- 4. 대화방 생성 테스트 (RPC 함수 사용)
SELECT create_conversation_with_members(ARRAY['USER_ID_1', 'USER_ID_2']::UUID[]);
```

### 방법 3: 개발 모드에서 직접 user_id 사용

1. Supabase에서 실제 사용자 ID 확인:
   ```sql
   SELECT id, email FROM auth.users;
   ```

2. 코드에서 직접 테스트:
   - 브라우저 콘솔에서:
   ```javascript
   // 실제 user_id로 채팅 생성
   const { createOrGetDm } = await import('./src/features/community/api/chatsApi');
   await createOrGetDm('실제-사용자-id-여기');
   ```

## 현재 제한사항

- ❌ Mock 데이터의 `user_id` (`snapshot_김민수_0` 형식)는 UUID가 아니므로 채팅 불가
- ✅ 실제 사용자 ID(UUID 형식)만 채팅 가능
- ✅ 명함 교환 없이도 직접 user_id를 알면 채팅 가능

## 빠른 테스트 방법

가장 빠른 방법은 **두 개의 브라우저 창**을 열고:
1. 창 1: 계정 A로 로그인
2. 창 2: 계정 B로 로그인 (시크릿 모드 또는 다른 브라우저)
3. 창 1에서 계정 B의 user_id를 찾아서 채팅 시작

## 디버깅

채팅 기능 테스트 시 콘솔에 다음 로그가 표시됩니다:
- `[CommunityPage] DM 생성 시작`
- `[chatsApi] createOrGetDm 시작`
- `[chatsApi] RPC 함수 호출 전/후`
- `[ChatTab] 렌더링` (UI 상태 확인)

문제가 발생하면 콘솔 로그를 확인하세요.

