/*
  # Criar usuário administrador

  1. Configurações
    - Cria função para criar usuário admin
    - Define permissões especiais para admin
    
  2. Segurança
    - Senha será definida no momento do signup
    - Usuário terá role 'authenticated' por padrão
*/

-- Função para criar usuário admin
CREATE OR REPLACE FUNCTION create_admin_user(
  admin_email text,
  admin_password text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id uuid;
BEGIN
  -- Criar usuário usando auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    admin_email,
    crypt(admin_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"is_admin":true}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO user_id;

  -- Adicionar à tabela de identidades
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    user_id,
    format('{"sub":"%s","email":"%s"}', user_id::text, admin_email)::jsonb,
    'email',
    NOW(),
    NOW(),
    NOW()
  );

  RETURN user_id;
END;
$$;