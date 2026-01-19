import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg =
    'Supabase 환경 변수가 설정되지 않았습니다.\n\n' +
    '프로젝트 루트에 .env.local 파일을 만들고 다음을 추가하세요:\n\n' +
    'VITE_SUPABASE_URL=https://your-project.supabase.co\n' +
    'VITE_SUPABASE_ANON_KEY=your-anon-key\n\n' +
    '⚠️ 중요: 파일 수정 후 개발 서버를 재시작하세요!';
  
  console.error('[supabaseClient]', errorMsg);
  throw new Error(errorMsg);
}

// Supabase URL 유효성 검사
if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
  const errorMsg = `Supabase URL 형식이 올바르지 않습니다: ${supabaseUrl}`;
  console.error('[supabaseClient]', errorMsg);
  throw new Error(errorMsg);
}

console.log('[supabaseClient] 초기화:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  env: import.meta.env.MODE,
});

// Supabase 클라이언트 생성 (오류 발생 시에도 계속 진행)
let supabase: ReturnType<typeof createClient>;

try {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'x-client-info': 'dabida-digital-business-card',
      },
    },
  });
  console.log('[supabaseClient] 클라이언트 생성 성공');
} catch (error) {
  console.error('[supabaseClient] 클라이언트 생성 실패:', error);
  // 오류가 발생해도 더미 클라이언트 생성 (앱이 계속 작동하도록)
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key', {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  console.warn('[supabaseClient] 더미 클라이언트 사용 (기능 제한됨)');
}

export { supabase };


