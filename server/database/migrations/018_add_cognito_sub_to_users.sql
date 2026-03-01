-- Añade cognito_sub a users para mapear el sub de Cognito (UUID) con el usuario.
-- Permite que /api/me resuelva el nombre mostrado desde la tabla users.
ALTER TABLE users ADD COLUMN IF NOT EXISTS cognito_sub VARCHAR(255);

-- Ejemplo: asociar tu usuario con el sub de Cognito
-- UPDATE users SET cognito_sub = '5d200734-9031-709e-4f17-d23886343536' WHERE id_user = 'frankgl.';
