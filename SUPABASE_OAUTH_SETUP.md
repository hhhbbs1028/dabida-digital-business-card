# Supabase OAuth 설정 가이드

## 1. Authentication > Providers 활성화

### GitHub
1. Supabase Dashboard → **Authentication** → **Providers**
2. **GitHub** 찾기 → **Enable** 클릭
3. GitHub OAuth App 생성:
   - GitHub → **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**
   - **Application name**: `Dabida Digital Business Card` (또는 원하는 이름)
   - **Homepage URL**: `http://localhost:5175` (또는 프로덕션 URL)
   - **Authorization callback URL**: `https://[your-project-ref].supabase.co/auth/v1/callback`
     - `[your-project-ref]`는 Supabase Dashboard URL에서 확인 가능
     - 예: `https://abcdefghijklmnop.supabase.co/auth/v1/callback`
4. GitHub에서 **Client ID**와 **Client Secret** 복사
5. Supabase Dashboard의 GitHub Provider 설정에 붙여넣기 → **Save**

### Google
1. Supabase Dashboard → **Authentication** → **Providers**
2. **Google** 찾기 → **Enable** 클릭
3. Google Cloud Console 설정:
   - [Google Cloud Console](https://console.cloud.google.com/) 접속
   - 프로젝트 선택 또는 생성
   - **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
   - **Application type**: Web application
   - **Name**: `Dabida Digital Business Card`
   - **Authorized redirect URIs**: `https://[your-project-ref].supabase.co/auth/v1/callback`
4. **Client ID**와 **Client Secret** 복사
5. Supabase Dashboard의 Google Provider 설정에 붙여넣기 → **Save**

### Apple
1. Supabase Dashboard → **Authentication** → **Providers**
2. **Apple** 찾기 → **Enable** 클릭
3. Apple Developer 설정 (개발용 최소 설정):
   - [Apple Developer Portal](https://developer.apple.com/) 접속
   - **Certificates, Identifiers & Profiles** → **Identifiers** → **Services IDs** → **+**
   - **Description**: `Dabida Digital Business Card`
   - **Identifier**: `com.dabida.app` (고유한 값)
   - **Sign in with Apple** 체크 → **Configure**
   - **Primary App ID**: 선택
   - **Website URLs**:
     - **Domains and Subdomains**: `[your-project-ref].supabase.co`
     - **Return URLs**: `https://[your-project-ref].supabase.co/auth/v1/callback`
   - **Save** → **Continue** → **Register**
4. **Keys** → **+** → **Sign in with Apple** 체크 → **Configure**
   - **Key Name**: `Dabida Sign In Key`
   - **Primary App ID**: 선택
   - **Save** → **Continue** → **Register**
   - **Key ID**와 **Key 파일(.p8)** 다운로드
5. Supabase Dashboard의 Apple Provider 설정에 입력:
   - **Services ID**: 위에서 생성한 Services ID
   - **Team ID**: Apple Developer 계정의 Team ID (우측 상단에서 확인)
   - **Key ID**: 위에서 생성한 Key ID
   - **Private Key**: 다운로드한 .p8 파일 내용 (전체 텍스트 복사)
   - **Save**

---

## 2. Authentication > URL Configuration

1. Supabase Dashboard → **Authentication** → **URL Configuration**

2. **Site URL**:
   ```
   http://localhost:5175
   ```
   (프로덕션 배포 시 실제 도메인으로 변경)

3. **Redirect URLs**에 다음 추가:
   ```
   http://localhost:5175
   http://localhost:5175/auth/callback
   https://your-production-domain.com
   https://your-production-domain.com/auth/callback
   ```

---

## 3. 로컬 테스트 체크리스트

### 환경 변수 확인
`.env.local` 파일이 프로젝트 루트에 있고 다음 내용이 포함되어야 합니다:
```
VITE_SUPABASE_URL=https://[your-project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 개발 서버 실행
```bash
npm run dev
```

### 테스트 플로우
1. **로그인 페이지** (`http://localhost:5175/login`)
   - Google / GitHub / Apple 버튼 클릭
   - OAuth 제공자로 리다이렉트
   - 인증 완료 후 `/auth/callback`으로 돌아옴

2. **콘솔 로그 확인**:
   ```
   [AuthButtons] google 로그인 시작, redirectTo: http://localhost:5175/auth/callback
   [AuthCallback] OAuth callback 처리 시작
   [AuthCallback] 로그인 성공: user@example.com
   [AuthCallback] 프로필 확인: 없음 → /onboarding
   ```

3. **프로필 없을 때**:
   - `/onboarding` 페이지로 이동
   - 이름 입력 후 저장 → `/app`으로 이동

4. **프로필 있을 때**:
   - `/app` 페이지로 바로 이동

---

## 4. 문제 해결

### "Redirect URL mismatch" 오류
- Supabase Dashboard의 **Redirect URLs**에 정확한 URL이 등록되어 있는지 확인
- OAuth 제공자(GitHub/Google/Apple)의 **Callback URL**도 Supabase URL과 일치하는지 확인

### 로그인 후 `/login`으로 돌아감
- `AuthCallback` 컴포넌트가 제대로 세션을 확인하는지 콘솔 로그 확인
- 브라우저 개발자 도구 → **Application** → **Cookies**에서 세션 쿠키 확인

### Apple 로그인이 안 됨
- Apple은 프로덕션 환경에서만 완전히 동작할 수 있음
- 개발용으로는 Google/GitHub만 사용하는 것도 가능

---

## 5. 프로덕션 배포 시

1. **Site URL**을 실제 도메인으로 변경
2. **Redirect URLs**에 프로덕션 URL 추가
3. 각 OAuth 제공자의 **Callback URL**도 프로덕션 URL로 업데이트
4. `.env.local` 대신 환경 변수로 설정 (Vercel, Netlify 등)

