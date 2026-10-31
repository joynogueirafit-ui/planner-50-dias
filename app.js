(function(){
  var START = new Date(2026,10,3), TOTAL = 50;
  var WD = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  var SEM = ['Voltar pra mim, sem culpa','Um momento com Deus que cabe na rotina','O terço no meu dia a dia',
    'Uma rotina que funciona + Missa no domingo','Cuidar do corpo que Deus me deu','Esperar com Maria','Preparando o coração pro Natal','Encerramento: o que mudou em mim'];
  var ROTINA = [['deus','🙏','5 a 30 min com Deus','oração, Evangelho ou terço'],['agua','💧','2 L de água',''],
    ['alim','🍽️','Alimentação 80%','comida de verdade, sem culpa'],['auto','🛁','10 min de autocuidado','um banho demorado, skincare, um chazinho'],
    ['mov','🚶‍♀️','Movimento','meta: 3x na semana'],['adiei','📖','Aquilo que eu venho adiando','meta: 1x na semana']];
  var DIARIOS = ['deus','agua','alim','auto'];
  var MSGS = ['Um passinho de cada vez 🤍','Que lindo! Deus vê cada esforço.','Tá indo muito bem!','Rotina completa! Glória a Deus 🤍'];

  var cfg = window.PLANNER_CONFIG || {};
  var demo = /[?&]demo\b/.test(location.search) || !cfg.url || cfg.url.indexOf('COLE_AQUI') >= 0;
  var sb = (!demo && window.supabase) ? window.supabase.createClient(cfg.url, cfg.anonKey) : null;
  var user = null, st = blank(), timer = null;

  function blank(){ return {dias:{}, sem:{}, geral:{}}; }
  function $(id){ return document.getElementById(id); }
  function pad(n){ return (n<10?'0':'')+n; }
  function dateOf(i){ var d = new Date(START); d.setDate(d.getDate()+i); return d; }
  function ddmm(d){ return pad(d.getDate())+'/'+pad(d.getMonth()+1); }
  function todayIdx(){ var t = new Date(); t.setHours(0,0,0,0); return Math.round((t-START)/864e5); }
  function weekOf(i){ return i < 6 ? 0 : i >= 48 ? 7 : 1 + Math.floor((i-6)/7); }
  function weekRange(w){ if (w === 0) return [0,5]; if (w === 7) return [48,49]; var a = 6 + 7*(w-1); return [a, a+6]; }
  function count(i){ var d = st.dias[i] || {}; return DIARIOS.filter(function(k){ return d[k]; }).length; }
  var ti = todayIdx(), cur = Math.min(Math.max(ti,0), TOTAL-1);

  // ---------- salvar ----------
  function cacheKey(){ return 'p50:' + (user ? user.id : 'demo'); }
  function cache(){ try { localStorage.setItem(cacheKey(), JSON.stringify(st)); } catch(e){} }
  function save(){
    cache();
    if (!sb || !user) return;
    $('sync').textContent = 'Salvando…';
    clearTimeout(timer);
    timer = setTimeout(function(){
      sb.from('planner').upsert({user_id: user.id, dados: st, updated_at: new Date().toISOString()}).then(function(r){
        $('sync').textContent = r.error ? 'Sem internet agora. Guardei aqui e salvo quando voltar.' : 'Tudo salvo ✓';
        if (r.error) { clearTimeout(timer); timer = setTimeout(save, 15000); }
      });
    }, 700);
  }
  function load(){
    try { var c = localStorage.getItem(cacheKey()); if (c) st = Object.assign(blank(), JSON.parse(c)); } catch(e){}
    if (!sb) return Promise.resolve();
    return sb.from('planner').select('dados').eq('user_id', user.id).maybeSingle().then(function(r){
      if (!r.error && r.data && r.data.dados) st = Object.assign(blank(), r.data.dados);
    });
  }

  // ---------- telas ----------
  function countdown(){
    var cd = $('countdown');
    if (ti < 0) cd.textContent = 'Começa na terça, 03/11 · faltam ' + (-ti) + (ti === -1 ? ' dia' : ' dias');
    else if (ti >= TOTAL) cd.textContent = 'Feliz Natal! Que Jesus nasça de novo no seu coração 🤍';
    else cd.textContent = 'Hoje é o dia ' + (ti+1) + ' de 50';
  }
  function renderDay(){
    var d = dateOf(cur), w = weekOf(cur), day = st.dias[cur] || {};
    $('dnum').textContent = 'Dia ' + (cur+1) + ' de 50';
    $('dtitle').textContent = WD[d.getDay()] + ', ' + ddmm(d);
    $('dtheme').textContent = w === 7 ? SEM[7] : 'Semana ' + (w+1) + ' · ' + SEM[w];
    $('prev').disabled = cur === 0; $('next').disabled = cur === TOTAL-1;
    var f = (window.FOCOS || [])[cur];
    $('foco').hidden = !f;
    if (f) { $('focoTag').textContent = 'Foco do dia · ' + window.FOCO_TAG[cur]; $('focoTxt').textContent = f; }
    var box = $('checks'); box.innerHTML = '';
    ROTINA.forEach(function(c){
      var b = document.createElement('button'); b.className = 'check'; b.type = 'button';
      b.setAttribute('aria-pressed', day[c[0]] ? 'true' : 'false');
      b.innerHTML = '<span class="em" aria-hidden="true">'+c[1]+'</span><span class="t"><b>'+c[2]+'</b>'+(c[3]?'<small>'+c[3]+'</small>':'')+'</span><span class="box" aria-hidden="true"></span>';
      b.addEventListener('click', function(){
        var dd = st.dias[cur] = st.dias[cur] || {}; dd[c[0]] = !dd[c[0]]; save(); renderAll();
      });
      box.appendChild(b);
    });
    var n = count(cur);
    $('msg').textContent = n ? MSGS[n-1] : '';
    $('notaDia').value = day.nota || '';
  }
  function renderWeek(){
    var w = weekOf(cur), r = weekRange(w), s = st.sem[w] || {};
    var t = {mov:0, adiei:0, deus:0, agua:0}, n = r[1]-r[0]+1;
    for (var i=r[0]; i<=r[1]; i++){ var d = st.dias[i] || {}; for (var k in t) if (d[k]) t[k]++; }
    $('wtitle').textContent = w === 7 ? 'Encerramento' : 'Semana ' + (w+1);
    $('wsub').textContent = ddmm(dateOf(r[0])) + ' a ' + ddmm(dateOf(r[1])) + ' · ' + SEM[w];
    var g = [['🚶‍♀️ movimento', t.mov, 3], ['📖 o que eu adiava', t.adiei, 1], ['🙏 dias com Deus', t.deus, n], ['💧 dias de água', t.agua, n]];
    $('goals').innerHTML = g.map(function(x){ return '<div class="goal'+(x[1]>=x[2]?' ok':'')+'"><b>'+x[1]+'/'+x[2]+'</b><span>'+x[0]+(x[1]>=x[2]?' ✓':'')+'</span></div>'; }).join('');
    var q = (window.PERGUNTAS || [])[w];
    $('wqTxt').textContent = q ? '“' + q + '”' : 'Escreva aqui o que Deus falou com você nessa semana.';
    $('wq').value = s.q || ''; $('wck').value = s.ck || '';
  }
  function renderPath(){
    var p = $('path'); p.innerHTML = '';
    var tot = {deus:0, agua:0, mov:0}, lived = 0;
    for (var i=0; i<TOTAL; i++){
      var n = count(i), d = st.dias[i] || {};
      if (n || d.mov || d.adiei) lived++;
      for (var k in tot) if (d[k]) tot[k]++;
      var b = document.createElement('button'); b.type = 'button'; b.textContent = i+1;
      b.className = 'dot' + (n===4?' full':(n||d.mov||d.adiei)?' part':'') + (i===cur?' sel':'') + (i>ti?' future':'');
      b.setAttribute('aria-label', 'Dia '+(i+1)+', '+ddmm(dateOf(i)));
      (function(i){ b.addEventListener('click', function(){ cur = i; renderAll(); window.scrollTo({top:0, behavior:'smooth'}); }); })(i);
      p.appendChild(b);
    }
    $('sDias').textContent = lived; $('sDeus').textContent = tot.deus; $('sAgua').textContent = tot.agua; $('sMov').textContent = tot.mov;
  }
  function renderGeral(){
    document.querySelectorAll('[data-scope="geral"]').forEach(function(el){ el.value = st.geral[el.id] || ''; });
  }
  function renderAll(){ renderDay(); renderWeek(); renderPath(); }

  // campos de texto
  $('notaDia').addEventListener('input', function(){ var dd = st.dias[cur] = st.dias[cur] || {}; dd.nota = this.value; save(); });
  document.querySelectorAll('[data-scope="sem"]').forEach(function(el){
    el.addEventListener('input', function(){ var w = weekOf(cur); var s = st.sem[w] = st.sem[w] || {}; s[el.dataset.k] = el.value; save(); });
  });
  document.querySelectorAll('[data-scope="geral"]').forEach(function(el){
    el.addEventListener('input', function(){ st.geral[el.id] = el.value; save(); });
  });
  $('prev').addEventListener('click', function(){ if (cur>0){ cur--; renderAll(); } });
  $('next').addEventListener('click', function(){ if (cur<TOTAL-1){ cur++; renderAll(); } });
  $('hoje').addEventListener('click', function(){ cur = Math.min(Math.max(ti,0), TOTAL-1); renderAll(); });

  function showApp(){
    $('login').hidden = true; $('app').hidden = false;
    $('quem').textContent = user ? user.email : 'modo de teste';
    renderGeral(); renderAll();
  }
  function showLogin(){ $('login').hidden = false; $('app').hidden = true; }

  // ---------- login ----------
  var msg = function(t){ $('loginMsg').textContent = t; };
  function traduz(e){
    var m = (e && e.message || '').toLowerCase();
    if (m.indexOf('invalid login') >= 0) return 'E-mail ou senha não conferem. Primeira vez? Toque em “Criar a minha conta”.';
    if (m.indexOf('already registered') >= 0) return 'Esse e-mail já tem conta. É só entrar com a sua senha.';
    if (m.indexOf('password') >= 0) return 'A senha precisa ter pelo menos 6 caracteres.';
    if (m.indexOf('rate') >= 0) return 'Muitas tentativas agora. Espera uns minutinhos e tenta de novo.';
    return 'Não deu certo agora. Confere a internet e tenta de novo.';
  }
  function entrou(u){ user = u; load().then(showApp); }
  $('fLogin').addEventListener('submit', function(ev){
    ev.preventDefault(); msg('Entrando…');
    sb.auth.signInWithPassword({email: $('email').value.trim(), password: $('senha').value}).then(function(r){
      if (r.error) msg(traduz(r.error)); else { msg(''); entrou(r.data.user); }
    });
  });
  $('bCriar').addEventListener('click', function(){
    var email = $('email').value.trim(), senha = $('senha').value;
    if (!email || senha.length < 6) { msg('Preencha o seu e-mail e crie uma senha de pelo menos 6 caracteres.'); return; }
    msg('Criando a sua conta…');
    sb.auth.signUp({email: email, password: senha}).then(function(r){
      if (r.error) msg(traduz(r.error));
      else if (r.data.session) { msg(''); entrou(r.data.user); }
      else msg('Conta criada! Confira o seu e-mail pra confirmar e depois entre aqui.');
    });
  });
  $('bEsqueci').addEventListener('click', function(){
    var email = $('email').value.trim();
    if (!email) { msg('Escreva o seu e-mail ali em cima e toque de novo em “Esqueci a senha”.'); return; }
    sb.auth.resetPasswordForEmail(email, {redirectTo: location.origin + location.pathname.replace(/[^/]*$/, '') + 'nova-senha.html'}).then(function(r){
      msg(r.error ? traduz(r.error) : 'Pronto! Mandei um link pro seu e-mail pra criar uma senha nova.');
    });
  });
  $('sair').addEventListener('click', function(){
    if (sb) sb.auth.signOut().then(function(){ user = null; st = blank(); showLogin(); });
  });

  countdown();
  if (demo) { try { var c = localStorage.getItem(cacheKey()); if (c) st = Object.assign(blank(), JSON.parse(c)); } catch(e){} showApp(); $('sync').textContent = 'Modo de teste: as marcações ficam só neste aparelho.'; }
  else sb.auth.getSession().then(function(r){ var s = r.data && r.data.session; if (s) entrou(s.user); else showLogin(); });

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function(){});
})();
