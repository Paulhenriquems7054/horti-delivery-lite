-- Migration: Create storage bucket for product images
-- Cria bucket público para armazenar imagens de produtos

-- Cria o bucket se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'arquivos',
  'arquivos',
  true, -- público para clientes visualizarem as fotos
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Política: Admin pode fazer upload
CREATE POLICY "Admin can upload product images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'arquivos'
  AND auth.role() = 'authenticated'
);

-- Política: Todos podem visualizar (bucket público)
CREATE POLICY "Anyone can view product images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'arquivos');

-- Política: Admin pode deletar imagens
CREATE POLICY "Admin can delete product images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'arquivos'
  AND auth.role() = 'authenticated'
);
