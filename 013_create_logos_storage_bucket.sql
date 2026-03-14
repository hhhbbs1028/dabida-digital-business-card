-- AI 생성 로고 이미지를 저장하는 Supabase Storage 버킷 생성
-- Supabase Dashboard > Storage > New bucket 에서도 동일하게 생성 가능

INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- 인증된 사용자만 본인 폴더에 업로드 가능
CREATE POLICY "logos_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 누구나 읽기 가능 (public bucket)
CREATE POLICY "logos_read_public" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'logos');

-- 본인 파일만 삭제 가능
CREATE POLICY "logos_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
