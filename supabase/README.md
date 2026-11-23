# Supabase para likes y calificaciones

La web llama a `api/project-feedback.js` desde el navegador. La función de Vercel usa la clave secreta del servidor para consultar las tablas de Supabase; no se expone ninguna clave secreta en el JavaScript público.

## Configuración

1. Creá un proyecto de Supabase o conectá uno desde el Marketplace de Vercel.
2. En Supabase, abrí el SQL Editor y ejecutá [`project-feedback.sql`](project-feedback.sql).
3. En Vercel, abrí **Settings → Environment Variables** y agregá:
   - `SUPABASE_URL`: URL del proyecto Supabase.
   - `SUPABASE_SECRET_KEY`: clave secreta del proyecto. Si tu proyecto solo ofrece la clave heredada, podés usar `SUPABASE_SERVICE_ROLE_KEY`.
4. Asigná las variables a los entornos que uses y volvé a desplegar el proyecto.

La función valida cada acción y conserva un único registro de calificación y de estado de Me gusta por proyecto y por identificador anónimo del navegador. El promedio y los contadores se comparten entre visitantes; cada persona puede actualizar su calificación o retirar su Me gusta desde ese navegador.

El identificador anónimo se guarda en `localStorage`. Si alguien borra los datos del navegador o usa otro dispositivo, contará como un visitante distinto. Esta integración no autentica personas ni evita votos coordinados.

Mientras falte la configuración de Supabase, el sitio sigue usando el almacenamiento local existente. Los datos guardados localmente antes de conectar Supabase no se migran automáticamente.
