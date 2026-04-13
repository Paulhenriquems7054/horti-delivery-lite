-- Script para resetar a senha do usuário paulhenriquems7054@gmail.com
-- Execute este script no SQL Editor do Supabase

-- Senha definida: phms705412

-- 1. Atualiza a senha do usuário
UPDATE auth.users
SET 
  encrypted_password = crypt('phms705412', gen_salt('bf')),
  updated_at = now()
WHERE email = 'paulhenriquems7054@gmail.com';

-- 2. Verifica se a atualização foi bem-sucedida
SELECT 
  id,
  email,
  created_at,
  updated_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'paulhenriquems7054@gmail.com';
