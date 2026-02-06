# Dabida Digital Business Card

디지털 명함 공유 및 커뮤니티 플랫폼

## 📋 프로젝트 소개

Dabida는 명함을 디지털로 공유하고, 커뮤니티 기능을 통해 네트워킹할 수 있는 플랫폼입니다.

### 주요 기능
- 📇 디지털 명함 생성 및 편집
- 📱 QR 코드를 통한 명함 공유
- 👥 커뮤니티 기능 (친구 찾기, 파도타기, 채팅)
- 📂 받은 명함 관리 및 폴더 분류
- 🎨 테마 커스터마이징

## 🚀 시작하기

### 사전 요구사항
- Node.js 18 이상
- npm 또는 yarn
- Supabase 계정 및 프로젝트

### 설치 방법

1. **저장소 클론**
```bash
git clone https://github.com/dabida-EugeneMira/dabida-digital-business-card.git
cd dabida-digital-business-card
```

2. **의존성 설치**
```bash
npm install
```

3. **환경 변수 설정**

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

환경 변수는 Supabase Dashboard > Settings > API에서 확인할 수 있습니다.

4. **개발 서버 실행**
```bash
npm run dev
```

개발 서버는 기본적으로 `http://localhost:5173`에서 실행됩니다.

HTTPS를 사용하려면:
```bash
npm run dev:https
```

## 🔧 Supabase 설정

### 1. Supabase 프로젝트 초대

협업자를 Supabase 프로젝트에 초대하려면:

1. [Supabase Dashboard](https://app.supabase.com) 접속
2. 프로젝트 선택
3. **Settings** → **Team** (또는 **Project Settings** → **Collaborators**)
4. **Invite member** 클릭
5. 협업자의 이메일 주소 입력 및 권한 설정 (보통 **Developer** 권한 권장)
6. 초대 이메일 발송

### 2. 데이터베이스 마이그레이션

SQL 마이그레이션 파일을 순서대로 실행하세요:

1. `001_create_cards_table.sql`
2. `002_create_received_cards_and_folders.sql`
3. `003_add_is_public_and_unique_received_cards.sql`
4. `004_add_image_storage_fields.sql`
5. `005_community_core.sql`
6. `006_community_sample_data.sql` (선택사항 - 샘플 데이터)
7. `007_network_privacy.sql`
8. `008_fix_conversation_members_rls.sql`
9. `009_get_public_connections.sql`
10. `010_bidirectional_card_exchange.sql`
11. `011_remove_mock_data.sql`

Supabase Dashboard > SQL Editor에서 각 파일의 내용을 복사하여 실행하세요.

### 3. OAuth 설정

OAuth 인증 설정은 `SUPABASE_OAUTH_SETUP.md` 파일을 참고하세요.

## 📁 프로젝트 구조

```
dabida_digital_business_card/
├── src/
│   ├── features/          # 기능별 모듈
│   │   ├── auth/         # 인증
│   │   ├── cards/        # 명함 관리
│   │   ├── community/    # 커뮤니티
│   │   ├── contacts/     # 연락처 관리
│   │   └── share/        # 공유 기능
│   ├── pages/            # 페이지 컴포넌트
│   ├── shared/           # 공유 컴포넌트 및 유틸리티
│   └── theme/            # 테마 설정
├── docs/                  # 문서
├── public/               # 정적 파일
└── *.sql                 # 데이터베이스 마이그레이션 파일
```

자세한 프로젝트 구조는 `docs/PROJECT_MAP.md`를 참고하세요.

## 🛠️ 개발 스택

- **Frontend**: React 18, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Routing**: React Router v6
- **QR Code**: qr-scanner, react-qr-code

## 📝 스크립트

- `npm run dev` - 개발 서버 실행 (HTTP)
- `npm run dev:https` - 개발 서버 실행 (HTTPS)
- `npm run build` - 프로덕션 빌드
- `npm run preview` - 빌드 결과 미리보기

## 📚 문서

- [프로젝트 구조](docs/PROJECT_MAP.md)
- [Supabase OAuth 설정](SUPABASE_OAUTH_SETUP.md)
- [채팅 테스트 가이드](docs/CHAT_TESTING_GUIDE.md)
- [마이그레이션 계획](docs/MIGRATION_PLAN.md)

## 🤝 협업 가이드

### GitHub 저장소 접근

1. 저장소에 접근 권한이 있는지 확인
2. 저장소를 클론하고 브랜치 생성
3. 변경사항 커밋 및 푸시

### Supabase 접근

1. 프로젝트 소유자로부터 Supabase 프로젝트 초대를 받아야 합니다
2. 초대 이메일의 링크를 클릭하여 프로젝트에 접근
3. 환경 변수는 각자의 `.env.local` 파일에 설정

### 작업 흐름

1. 새로운 기능 개발 시 브랜치 생성
2. 변경사항 커밋
3. Pull Request 생성
4. 코드 리뷰 후 머지

## 📄 라이선스

ISC

## 👥 기여자

- EugeneMira

