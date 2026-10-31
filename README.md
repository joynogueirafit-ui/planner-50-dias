# 50 dias até o Natal · planner

App do planner dos 50 dias (03/11 a 22/12/2026), feito pra abrir no celular, tablet ou notebook e salvar as marcações na conta de cada pessoa.

- Site estático publicado pelo GitHub Pages.
- Login por e-mail e senha e dados guardados no Supabase (tabela `planner`, cada pessoa só vê a própria linha).
- Abra `index.html?demo` pra testar sem login (salva só no aparelho).

## Configurar
1. No Supabase, rode `supabase.sql` no SQL Editor.
2. Em Authentication → Sign In / Providers → Email, desligue "Confirm email" (o envio de e-mail grátis do Supabase é bem limitado).
3. Em Authentication → URL Configuration, coloque o endereço do GitHub Pages em Site URL.
4. Cole o Project URL e a chave anon public em `config.js`.
5. No GitHub: Settings → Pages → Deploy from a branch → `main` / root.
