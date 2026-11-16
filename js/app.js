/* SIS 6118 revision site - vanilla JS SPA */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const T=window.TOPICS, PLAN=window.PLAN, MOCKS=window.MOCKS;
const byId=Object.fromEntries(T.map(t=>[t.id,t]));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- safe storage ---------- */
const store={get(k,d){try{const v=localStorage.getItem('sis6116:'+k);return v===null?d:JSON.parse(v)}catch(e){return d}},
             set(k,v){try{localStorage.setItem('sis6116:'+k,JSON.stringify(v))}catch(e){}}};

/* ---------- theme ---------- */
function applyTheme(){const t=store.get('theme',null);if(t)document.documentElement.setAttribute('data-theme',t);else document.documentElement.removeAttribute('data-theme')}
applyTheme();
$('#themeBtn').onclick=()=>{const dark=document.documentElement.getAttribute('data-theme')==='dark'||(!store.get('theme',null)&&matchMedia('(prefers-color-scheme: dark)').matches);store.set('theme',dark?'light':'dark');applyTheme()};
$('#menuBtn').onclick=()=>$('#side').classList.toggle('open');

/* ---------- progress ---------- */
function prog(id){return store.get('p:'+id,{watched:false,done:false,quiz:0})}
function setProg(id,patch){store.set('p:'+id,Object.assign(prog(id),patch));buildNav()}
function pct(id){const p=prog(id);return Math.round(((p.watched?1:0)+(p.done?1:0)+(p.quiz>=80?1:p.quiz/80))/3*100)}

/* ---------- nav ---------- */
const EXTRA=[['lab','🧮','Calculation Lab','#0f766e'],['allquiz','⚡','Quick-fire quiz (all)','#9333ea'],...MOCKS.map((m,i)=>['mock'+(i+1),'📝',m.title,'#be123c']),['plan','📅','4-Day plan','#16a34a'],['cheat','📌','Cheat sheet','#ca8a04'],['search','🔎','Search notes','#475569']];
function buildNav(){
  const h=location.hash||'#/home';
  let s=`<a href="#/home" class="${h==='#/home'?'active':''}" style="--c:#e11d48"><span>🏠</span>Home</a><div class="grp">Topics</div>`;
  T.forEach(t=>{const p=prog(t.id);s+=`<a href="#/t/${t.id}" class="${h.startsWith('#/t/'+t.id)?'active':''}" style="--c:${t.color}"><span class="dot" style="background:${t.color}"></span>${t.emoji} ${t.short}${p.done?'<span class="done">✔</span>':''}</a>`});
  s+='<div class="grp">Practice</div>';
  EXTRA.forEach(([id,e,n,c])=>{s+=`<a href="#/${id}" class="${h==='#/'+id?'active':''}" style="--c:${c}"><span>${e}</span>${n}</a>`});
  $('#side').innerHTML=s;
}

/* ---------- speech ---------- */
const SS=window.speechSynthesis;let VOICES=[];
function loadVoices(){if(!SS)return;VOICES=SS.getVoices().filter(v=>/^en/i.test(v.lang));}
if(SS){loadVoices();SS.onvoiceschanged=loadVoices}
function bestVoice(){const pref=store.get('voice','');if(pref){const v=VOICES.find(v=>v.name===pref);if(v)return v}
  return VOICES.find(v=>/natural|neural|google uk|google us|aria|jenny|libby|sonia/i.test(v.name))||VOICES.find(v=>/en-GB/i.test(v.lang))||VOICES[0]||null}

/* ---------- video player ---------- */
let activePlayer=null;
function stopAll(){if(activePlayer)activePlayer.stop();if(SS)SS.cancel()}
function Player(root,topic){
  const sc=topic.scenes;let i=0,k=0,playing=false,timer=null,token=0;
  const voiceOn=()=>store.get('voiceOn',true)&&!!SS;
  root.innerHTML=`<div class="player" style="--c:${topic.color}">
   <div class="stage"><div class="scn"></div><h3></h3><div class="big"></div><div class="chips"></div><div class="subs"><span>Press ▶ Play to start the lesson</span></div></div>
   <div class="controls"><button class="prev" title="Previous scene">⏮</button><button class="play">▶ Play</button><button class="next" title="Next scene">⏭</button>
   <div class="progress"><i></i></div>
   <select class="rate" title="Speed"><option value=".8">0.8×</option><option value="1" selected>1×</option><option value="1.2">1.2×</option><option value="1.4">1.4×</option></select>
   <button class="vo" title="Voice on/off"></button><button class="fs" title="Full screen">⛶</button></div>
   <div class="dots"></div></div>
   <details class="card" style="margin-top:10px"><summary><b>📜 Full transcript (read it too)</b></summary><div class="transcript"></div></details>
   <div class="card"><label>🗣️ Narrator voice</label><select class="vsel"></select><p class="muted" style="margin:6px 0 0;font-size:.85rem">The narrator uses your browser's built-in text-to-speech. If you hear nothing, turn the voice on or check your volume. Subtitles always play.</p></div>`;
  const st=$('.stage',root),rate=$('.rate',root);rate.value=store.get('rate','1');
  $('.transcript',root).innerHTML=sc.map((s,n)=>`<p><b>${n+1}. ${esc(s.t)}</b><br>${s.s.map(esc).join(' ')}</p>`).join('');
  $('.dots',root).innerHTML=sc.map((s,n)=>`<button data-n="${n}" title="${esc(s.t)}">${n+1}</button>`).join('');
  const vsel=$('.vsel',root);
  function fillVoices(){loadVoices();const b=bestVoice();vsel.innerHTML=VOICES.length?VOICES.map(v=>`<option ${b&&b.name===v.name?'selected':''}>${esc(v.name)}</option>`).join(''):'<option>Default voice</option>'}
  fillVoices();if(SS)setTimeout(fillVoices,600);
  vsel.onchange=()=>store.set('voice',vsel.value);
  const vo=$('.vo',root);const paintVo=()=>vo.textContent=voiceOn()?'🔊 Voice':'🔇 Subtitles only';paintVo();
  vo.onclick=()=>{store.set('voiceOn',!store.get('voiceOn',true));paintVo();if(playing){halt();speakNext()}};
  rate.onchange=()=>store.set('rate',rate.value);
  function render(){const s=sc[i];$('.scn',st).textContent=`${topic.title} · scene ${i+1}/${sc.length}`;$('h3',st).textContent=s.t;$('.big',st).textContent=s.e;
    $('.chips',st).innerHTML=s.v.map(c=>`<div class="chip">${esc(c)}</div>`).join('');
    $$('.dots button',root).forEach((b,n)=>b.classList.toggle('on',n===i));reveal();progress()}
  function reveal(){const chips=$$('.chip',st),S=sc[i].s.length,show=Math.min(chips.length,Math.ceil((k+1)/S*chips.length));
    chips.forEach((c,n)=>{c.classList.toggle('show',n<show);c.classList.toggle('hl',n===show-1&&playing)})}
  function progress(){const tot=sc.reduce((a,s)=>a+s.s.length,0),done=sc.slice(0,i).reduce((a,s)=>a+s.s.length,0)+k;$('.progress i',root).style.width=(done/tot*100)+'%'}
  function sub(t){$('.subs',st).innerHTML=`<span>${esc(t)}</span>`}
  function halt(){token++;clearTimeout(timer);if(SS)SS.cancel()}
  function speakNext(){
    const my=++token;const s=sc[i];
    if(k>=s.s.length){ if(i<sc.length-1){i++;k=0;render();timer=setTimeout(()=>{if(my===token)speakNext()},500);} else {playing=false;paint();sub('✅ Lesson complete! Now try the Quiz tab.');setProg(topic.id,{watched:true});} return;}
    const line=s.s[k];sub(line);reveal();progress();
    const r=parseFloat(rate.value);
    const fallback=()=>{const ms=Math.max(2200,line.split(/\s+/).length*390)/r;timer=setTimeout(()=>{if(my===token){k++;speakNext()}},ms)};
    if(voiceOn()){
      const u=new SpeechSynthesisUtterance(line);const v=bestVoice();if(v)u.voice=v;u.rate=r;u.lang=v?v.lang:'en-GB';
      let ended=false;u.onend=()=>{if(ended||my!==token)return;ended=true;k++;timer=setTimeout(()=>{if(my===token)speakNext()},250)};
      u.onerror=()=>{if(ended||my!==token)return;ended=true;fallback()};
      SS.speak(u);
      // safety net if the engine never fires onend
      setTimeout(()=>{if(!ended&&my===token&&!SS.speaking){ended=true;fallback()}},2500);
    } else fallback();
  }
  function paint(){$('.play',root).textContent=playing?'⏸ Pause':'▶ Play'}
  function play(){stopAll();activePlayer=api;playing=true;paint();if(k>=sc[i].s.length)k=0;speakNext()}
  function pause(){playing=false;halt();paint();reveal()}
  function go(n){halt();i=Math.max(0,Math.min(sc.length-1,n));k=0;render();if(playing)speakNext()}
  $('.play',root).onclick=()=>playing?pause():play();
  $('.prev',root).onclick=()=>go(i-1);$('.next',root).onclick=()=>go(i+1);
  $$('.dots button',root).forEach(b=>b.onclick=()=>go(+b.dataset.n));
  $('.progress',root).onclick=e=>{const r=e.currentTarget.getBoundingClientRect();go(Math.floor((e.clientX-r.left)/r.width*sc.length))};
  $('.fs',root).onclick=()=>{const p=$('.player',root);if(document.fullscreenElement)document.exitFullscreen();else if(p.requestFullscreen)p.requestFullscreen()};
  const api={stop(){playing=false;halt();paint()}};
  render();return api;
}

/* ---------- notes renderer ---------- */
function blockHTML(b){
  switch(b.k){
    case 'h2':return `<h2>${b.t}</h2>`;
    case 'h3':return `<h3>${b.t}</h3>`;
    case 'p':return `<p>${b.t}</p>`;
    case 'ul':return `<ul>${b.items.map(x=>`<li>${x}</li>`).join('')}</ul>`;
    case 'ol':return `<ol>${b.items.map(x=>`<li>${x}</li>`).join('')}</ol>`;
    case 'code':return `<pre class="code">${esc(b.t)}</pre>`;
    case 'table':{const r=b.rows;let h='<div class="tblwrap"><table>';r.forEach((row,n)=>{const tag=(b.head&&n===0)?'th':'td';h+='<tr>'+row.map(c=>`<${tag}>${c}</${tag}>`).join('')+'</tr>'});return h+'</table></div>'}
    case 'box':return `<div class="box ${b.kind}"><b class="t">${b.title}</b>${b.lines.length>1?'<ul>'+b.lines.map(l=>`<li>${l}</li>`).join('')+'</ul>':(b.lines[0]||'')}</div>`;
    case 'svg':return `<div class="svgbox">${b.svg}${b.cap?`<div class="cap">${esc(b.cap)}</div>`:''}</div>`;
    case 'a':return `${b.t?`<p><b style="color:var(--good)">Answer:</b> ${b.t}</p>`:'<p><b style="color:var(--good)">Answer:</b></p>'}${b.ul?'<ul>'+b.ul.map(x=>`<li>${x}</li>`).join('')+'</ul>':''}${b.ol?'<ol>'+b.ol.map(x=>`<li>${x}</li>`).join('')+'</ol>':''}`;
  }return '';
}
function renderBlocks(blocks,onlyQA){
  let out='',i=0,qn=0;
  while(i<blocks.length){
    const b=blocks[i];
    if(b.k==='q'){
      qn++;let ans='';i++;
      while(i<blocks.length&&!['q','h2','h3'].includes(blocks[i].k)){ans+=blockHTML(blocks[i]);i++}
      const qt=b.t.replace(/^Q\d+\.\s*/,'');
      out+=`<div class="qa"><div class="q"><span>Q${qn}.</span><span>${qt}</span>${b.m?`<span class="m pill">${b.m} mk</span>`:''}</div>
        <button class="btn sm ghost rv">👀 Show / hide answer</button><div class="ans">${ans}</div></div>`;
      continue;
    }
    if(!onlyQA)out+=blockHTML(b);else if(b.k==='h2'){let j=i+1,has=false;while(j<blocks.length&&blocks[j].k!=='h2'){if(blocks[j].k==='q'){has=true;break}j++}if(has)out+=blockHTML(b)}
    i++;
  }
  return out;
}
function wireQA(root){$$('.qa',root).forEach(q=>{const a=$('.ans',q);$('.rv',q).onclick=()=>{a.classList.toggle('open');if(!root.classList.contains('hideall'))a.classList.toggle('hide')}})}
function practiceSwitch(root){
  return `<label class="row" style="margin:6px 0 10px"><input type="checkbox" class="hidesw" ${store.get('hideAns',true)?'checked':''}> 🙈 Practice mode: hide answers until I click "Show answer"</label>`;
}
function wirePractice(root,box){const sw=$('.hidesw',root);const f=()=>{box.classList.toggle('hideall',sw.checked);store.set('hideAns',sw.checked);$$('.ans',box).forEach(a=>{a.classList.remove('hide','open')})};sw.onchange=f;f()}

/* ---------- quiz ---------- */
function quizHTML(qs,id){return `<div class="quiz">${qs.map((q,n)=>`<div class="card qz" data-a="${q.a}"><b>${n+1}. ${q.q}</b>${q.o.map((o,j)=>`<button class="opt" data-j="${j}">${String.fromCharCode(65+j)}. ${esc(o)}</button>`).join('')}<div class="x">💡 ${q.x}</div></div>`).join('')}
 <div class="card"><span class="score">Score: <span class="sc">0</span> / ${qs.length}</span> <button class="btn sm ghost redo">↻ Retry</button></div></div>`}
function wireQuiz(root,qs,id){let right=0,ans=0;
  $$('.qz',root).forEach(c=>{$$('.opt',c).forEach(b=>b.onclick=()=>{if(c.classList.contains('answered'))return;c.classList.add('answered');ans++;const a=+c.dataset.a,j=+b.dataset.j;
    $$('.opt',c)[a].classList.add('right');if(j!==a)b.classList.add('wrong');else right++;$('.sc',root).textContent=right;
    if(ans===qs.length&&id){const p=Math.round(right/qs.length*100);if(p>prog(id).quiz)setProg(id,{quiz:p});$('.sc',root).textContent=`${right} (${p}%)${p>=80?' 🏆 Great!':' - retry to reach 80%'}`}})});
  $('.redo',root).onclick=()=>{root.innerHTML=quizHTML(qs,id);wireQuiz(root,qs,id)}}

/* ---------- flashcards ---------- */
function cardsUI(root,cards,color){let i=0,order=cards.map((_,n)=>n);
  root.innerHTML=`<div class="fc" style="--c:${color}"><div class="in"><div class="f"></div><div class="b"></div></div></div>
  <p class="muted" style="text-align:center">Tap the card to flip · <span class="ct"></span></p>
  <div class="row" style="justify-content:center"><button class="btn ghost pv">◀ Prev</button><button class="btn sh" style="--c:${color}">🔀 Shuffle</button><button class="btn ghost nx">Next ▶</button></div>`;
  const fc=$('.fc',root);const show=()=>{fc.classList.remove('flip');const c=cards[order[i]];$('.f',fc).innerHTML=c[0];$('.b',fc).innerHTML=c[1];$('.ct',root).textContent=`${i+1} / ${cards.length}`};
  fc.onclick=()=>fc.classList.toggle('flip');$('.pv',root).onclick=()=>{i=(i-1+cards.length)%cards.length;show()};$('.nx',root).onclick=()=>{i=(i+1)%cards.length;show()};
  $('.sh',root).onclick=()=>{order.sort(()=>Math.random()-.5);i=0;show()};show()}

/* ---------- pages ---------- */
const main=$('#main');
function setColor(c){document.documentElement.style.setProperty('--c',c)}

function home(){
  setColor('#e11d48');
  const tiles=T.map(t=>`<a class="tile" href="#/t/${t.id}" style="--c:${t.color}"><div class="em">${t.emoji}</div><b>${t.title}</b><small>${t.scenes.length} video scenes · ${t.quiz.length} quiz Qs</small><div class="bar"><i style="width:${pct(t.id)}%"></i></div></a>`).join('');
  const total=Math.round(T.reduce((a,t)=>a+pct(t.id),0)/T.length);
  main.innerHTML=`<div class="hero" style="--c:#e11d48"><h1>⚔️ SIS 6116 AI Principles: Test Warrior</h1><p>Everything for the 1-hour class test (whole module, weeks 1-10), even if you missed every class. Watch, understand, practise, win.</p>
   <div class="bar" style="background:rgba(255,255,255,.25)"><i style="width:${total}%;background:#fff"></i></div><small>Overall progress: ${total}%</small></div>
  <div class="card"><h2>🚀 Start here</h2><ol class="steps">
   <li><b>Open a topic</b> and press <b>▶ Play</b> on the 🎬 Video lesson. An AI narrator explains with subtitles and animated key points.</li>
   <li>Read <b>🧒 Simple + Hacks</b>: a child-level explanation plus memory tricks and exam cheats.</li>
   <li>Use <b>❓ Q&amp;A practice</b> with answers hidden. Answer first, then reveal.</li>
   <li>Do the <b>🧠 Quiz</b> until ≥ 80%, then flip the <b>🃏 Flashcards</b>.</li>
   <li>Solve every calculation in the <b>🧮 Calculation Lab</b> (A*, entropy, perceptron, backprop, CSP…), then sit both <b>📝 Mock Tests</b> with the 60-minute timer.</li></ol></div>
  <div class="card"><h2>🎯 The test in 20 seconds</h2><div class="grid">
   <div class="note"><b>Format</b><br>1 hour · whole module · 40% of the module · questions of [10 Marks] with parts (Sample Test 2025)</div>
   <div class="note"><b>Typical parts</b><br>(a) justify/compare (e.g. why DFID over BFS/DFS) · (b) solve step by step (A* with f = g + h, CSP domains, forward checking)</div>
   <div class="note good"><b>Calculations in syllabus</b><br>BFS/DFS/UCS/DFID/Greedy/A* traces · Dijkstra · SA probability · GA selection/crossover · CSP domains + forward checking · entropy &amp; information gain · perceptron rule · backpropagation · counting n!</div>
   <div class="note warn"><b>Excluded</b><br>Linear regression (class tip). Everything else in the catalogue is covered here.</div></div></div>
  <div class="card"><h2>📚 Topics (module catalogue weeks 1-10)</h2><div class="grid">${tiles}</div></div>
  <div class="card"><h2>⚡ Practice</h2><div class="grid">${EXTRA.map(([id,e,n,c])=>`<a class="tile" href="#/${id}" style="--c:${c}"><div class="em">${e}</div><b>${n}</b></a>`).join('')}</div></div>`;
}

function topic(id,tab){
  const t=byId[id];if(!t)return home();setColor(t.color);tab=tab||'lesson';
  const tabs=[['lesson','🎬 Video lesson'],['simple','🧒 Simple + Hacks'],['qa','❓ Q&A practice'],['notes','📖 Full notes'],['quiz','🧠 Quiz'],['cards','🃏 Flashcards']];
  const p=prog(id);
  main.innerHTML=`<div class="hero" style="--c:${t.color}"><h1>${t.emoji} ${t.title}</h1><p>Topic ${t.n} · source: ${t.src} · progress ${pct(id)}% ${p.quiz?`· best quiz ${p.quiz}%`:''}</p></div>
   <div class="tabs">${tabs.map(([k,n])=>`<button data-k="${k}" class="${k===tab?'on':''}">${n}</button>`).join('')}</div><div id="pane"></div>
   <div class="card row"><label class="row"><input type="checkbox" id="doneBox" ${p.done?'checked':''}> ✅ I understand this topic</label>
   ${T[t.n+1]?`<a class="btn" href="#/t/${T[t.n+1].id}" style="margin-left:auto">Next topic: ${T[t.n+1].emoji} ${T[t.n+1].short} ▶</a>`:''}</div>`;
  $$('.tabs button',main).forEach(b=>b.onclick=()=>{location.hash=`#/t/${id}/${b.dataset.k}`});
  $('#doneBox').onchange=e=>setProg(id,{done:e.target.checked});
  const pane=$('#pane');const blocks=t.notes||[];
  if(tab==='lesson'){activePlayer=Player(pane,t)}
  else if(tab==='simple'){pane.innerHTML=`<div class="kid" style="--c:${t.color}"><b>🧒 Explain it like I'm 10</b><p style="margin:6px 0 0">${t.kid}</p></div>
     <div class="card" style="margin-top:14px"><h2>🧠 Hacks, mnemonics & exam cheats</h2>${t.hacks.map((h,n)=>`<div class="hack"><div class="n">${n+1}</div><div><b>${h[0]}</b>${h[1]}</div></div>`).join('')}</div>`}
  else if(tab==='notes'){pane.innerHTML=`<div class="card notes">${practiceSwitch(pane)}<div class="nb">${renderBlocks(blocks,false)}</div></div>`;const nb=$('.nb',pane);wireQA(nb);wirePractice(pane,nb)}
  else if(tab==='qa'){const n=blocks.filter(b=>b.k==='q').length;pane.innerHTML=`<div class="card notes"><p class="muted">${n} exam-style questions with full model answers. Answer first, then reveal.</p>${practiceSwitch(pane)}<div class="nb">${renderBlocks(blocks,true)}</div></div>`;const nb=$('.nb',pane);wireQA(nb);wirePractice(pane,nb)}
  else if(tab==='quiz'){pane.innerHTML=quizHTML(t.quiz,id);wireQuiz(pane,t.quiz,id)}
  else if(tab==='cards'){pane.innerHTML='<div class="card"></div>';cardsUI($('.card',pane),t.cards,t.color)}
}

function allquiz(){setColor('#9333ea');const qs=T.flatMap(t=>t.quiz.map(q=>Object.assign({},q,{q:`<span class="pill">${t.short}</span> ${q.q}`}))).sort(()=>Math.random()-.5).slice(0,20);
  main.innerHTML=`<div class="hero" style="--c:#9333ea"><h1>⚡ Quick-fire quiz</h1><p>20 random questions from all topics. Reload for a new set.</p></div><div id="qzz"></div>`;
  const r=$('#qzz');r.innerHTML=quizHTML(qs,null);wireQuiz(r,qs,null)}

function mock(n){setColor('#be123c');const M=MOCKS[n-1];const blocks=M.blocks;
  main.innerHTML=`<div class="hero" style="--c:#be123c"><h1>📝 ${M.title}</h1><p>Sample Test 2025 format · 4 questions × 10 marks · 60 minutes. Start the timer, answer on paper, then reveal and mark yourself.</p></div>
  <div class="card row"><span class="timer" id="tm">60:00</span><button class="btn" id="tgo">▶ Start</button><button class="btn ghost" id="trs">↺ Reset</button><span class="muted">About 15 min per question</span></div>
  <div class="card notes">${practiceSwitch(main)}<div class="nb">${renderBlocks(blocks,false)}</div></div>`;
  const nb=$('.nb',main);wireQA(nb);wirePractice(main,nb);
  let left=3600,run=false,iv=null;const paint=()=>{$('#tm').textContent=`${String(Math.floor(left/60)).padStart(2,'0')}:${String(left%60).padStart(2,'0')}`;$('#tm').style.color=left<300?'var(--bad)':''};
  $('#tgo').onclick=()=>{run=!run;$('#tgo').textContent=run?'⏸ Pause':'▶ Start';if(run){iv=setInterval(()=>{left--;paint();if(left<=0){clearInterval(iv);run=false;alert('⏰ Time is up! Now reveal the answers and mark yourself.')}},1000);window._mockIv=iv}else clearInterval(iv)};
  $('#trs').onclick=()=>{clearInterval(iv);run=false;left=3600;$('#tgo').textContent='▶ Start';paint()};
}

function plan(){setColor('#16a34a');const st=store.get('plan',{});const date=store.get('testDate','2026-11-21');
  const days=Math.ceil((new Date(date+'T09:00')-new Date())/864e5);
  main.innerHTML=`<div class="hero" style="--c:#16a34a"><h1>📅 4-Day battle plan</h1><p>${days>0?`⏳ ${days} day${days>1?'s':''} until the test`:'Test day! You are ready. 💪'}</p></div>
   <div class="card row"><label>Test date: <input type="date" id="td" value="${date}" style="width:auto"></label></div>
   ${PLAN.map((d,di)=>`<div class="card" style="--c:${d.c}"><h2 style="color:${d.c}">${d.d}</h2>${d.items.map((it,ii)=>{const k=di+'-'+ii;return `<label class="check ${st[k]?'ok':''}"><input type="checkbox" data-k="${k}" ${st[k]?'checked':''}><span>${it}</span></label>`}).join('')}</div>`).join('')}`;
  $('#td').onchange=e=>{store.set('testDate',e.target.value);plan()};
  $$('.check input',main).forEach(c=>c.onchange=()=>{st[c.dataset.k]=c.checked;store.set('plan',st);c.parentElement.classList.toggle('ok',c.checked)})}

function cheat(){setColor('#ca8a04');
  main.innerHTML=`<div class="hero" style="--c:#ca8a04"><h1>📌 Cheat sheet</h1><p>Every formula, table and trick on one page. Read it the night before and the morning of the test.</p></div>
   <div class="card notes"><h2>Formula sheet</h2><div class="tblwrap"><table><tr><th>Topic</th><th>Formula / rule</th></tr>
   <tr><td>A*</td><td>f(n) = g(n) + h(n); optimal if h admissible: h(n) ≤ h*(n)</td></tr><tr><td>Greedy</td><td>expand lowest h(n)</td></tr><tr><td>UCS / Dijkstra</td><td>expand lowest g(n); goal test on removal</td></tr>
   <tr><td>BFS / DFS / UCS / DFID</td><td>time/space: O(b<sup>d</sup>)/O(b<sup>d</sup>) · O(b<sup>m</sup>)/O(bm) · O(b<sup>d</sup>)/O(b<sup>d</sup>) · O(b<sup>d</sup>)/O(bd)</td></tr>
   <tr><td>Simulated annealing</td><td>p(accept worse) = e<sup>−Δ/T</sup>; T ← αT</td></tr><tr><td>GA roulette</td><td>P(i) = f<sub>i</sub>/Σf</td></tr><tr><td>Counting</td><td>orderings n!; tours (n − 1)!</td></tr>
   <tr><td>Entropy</td><td>E(S) = −p<sub>+</sub>log<sub>2</sub>p<sub>+</sub> − p<sub>−</sub>log<sub>2</sub>p<sub>−</sub>; E(9+, 5−) = 0.940</td></tr><tr><td>Information gain</td><td>Gain(S, A) = E(S) − Σ(|S<sub>v</sub>|/|S|)E(S<sub>v</sub>); Outlook 0.246 &gt; Humidity 0.151 &gt; Wind 0.048 &gt; Temp 0.029</td></tr>
   <tr><td>Perceptron</td><td>Y = 1 if Σxw − θ ≥ 0; e = Yd − Ya; w += α·x·e; θ += α·(−1)·e</td></tr><tr><td>Sigmoid</td><td>Y = 1/(1 + e<sup>−X</sup>); dY/dX = Y(1 − Y)</td></tr>
   <tr><td>Backprop</td><td>δ<sub>out</sub> = Y(1 − Y)e; δ<sub>hid</sub> = Y(1 − Y)Σδw; w += α·input·δ; θ += α·(−1)·δ</td></tr><tr><td>Gradient descent</td><td>w ← w − η·∂E/∂w</td></tr></table></div></div>
   ${T.filter(t=>t.id!=='test').map(t=>`<div class="card" style="--c:${t.color}"><h2 style="color:${t.color}">${t.emoji} ${t.title}</h2>${t.hacks.map(h=>`<div class="hack"><div class="n">★</div><div><b>${h[0]}</b>${h[1]}</div></div>`).join('')}</div>`).join('')}`}

function search(){setColor('#475569');main.innerHTML=`<div class="hero" style="--c:#475569"><h1>🔎 Search all notes</h1><p>Type a word, e.g. "admissible", "tenure", "entropy", "forward checking".</p></div>
  <div class="card"><input type="text" id="sq" placeholder="Search…" autofocus></div><div id="sr"></div>`;
  const strip=h=>h.replace(/<[^>]+>/g,' ');
  const idx=[];const pages=[...T.map(t=>({title:t.title,link:`#/t/${t.id}/notes`,blocks:t.notes||[]})),...MOCKS.map((m,i)=>({title:m.title,link:`#/mock${i+1}`,blocks:m.blocks}))];
  pages.forEach(pg=>pg.blocks.forEach(b=>{let tx='';if(b.t)tx=b.t;if(b.items)tx=b.items.join(' ');if(b.rows)tx=b.rows.map(r=>r.join(' | ')).join(' ; ');if(b.lines)tx=b.title+' '+b.lines.join(' ');if(b.ul)tx+=' '+b.ul.join(' ');if(b.ol)tx+=' '+b.ol.join(' ');if(tx)idx.push({pg,tx:strip(tx)})}));
  $('#sq').oninput=e=>{const q=e.target.value.trim().toLowerCase();if(q.length<2){$('#sr').innerHTML='';return}
    const res=idx.filter(r=>r.tx.toLowerCase().includes(q)).slice(0,40);
    $('#sr').innerHTML=res.length?res.map(r=>{const i=r.tx.toLowerCase().indexOf(q),s=Math.max(0,i-90);const snip=esc(r.tx.slice(s,i+160)).replace(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'ig'),m=>`<mark>${m}</mark>`);
      return `<a class="card" style="display:block;text-decoration:none;color:inherit" href="${r.pg.link}"><span class="pill">${esc(r.pg.title)}</span><p style="margin:6px 0 0">…${snip}…</p></a>`}).join(''):'<div class="card">No results.</div>'}}

/* ---------- router ---------- */
function route(){
  stopAll();if(window._mockIv)clearInterval(window._mockIv);$('#side').classList.remove('open');
  const h=(location.hash||'#/home').slice(2).split('/');
  if(h[0]==='t')topic(h[1],h[2]);
  else if(h[0]==='lab')window.renderLab(main,setColor);
  else if(h[0]==='allquiz')allquiz();
  else if(/^mock\d+$/.test(h[0])&&MOCKS[+h[0].slice(4)-1])mock(+h[0].slice(4));
  else if(h[0]==='plan')plan();
  else if(h[0]==='cheat')cheat();
  else if(h[0]==='search')search();
  else home();
  buildNav();window.scrollTo(0,0);
}
window.addEventListener('hashchange',route);
route();
})();
