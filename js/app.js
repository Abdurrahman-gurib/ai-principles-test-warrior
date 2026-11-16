/* SIS 6116 revision site - vanilla JS SPA */
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
const STEPS=[['watched','🎬 Lesson','lesson'],['simple','🧒 Simple','simple'],['qa','❓ Q&A','qa'],['quick','⚡ Quick','quick'],['scen','🎭 Scenarios','scen'],['notes','📖 Notes','notes'],['quiz','🧠 Quiz ≥ 80%','quiz'],['cards','🃏 Cards','cards'],['done','✅ Understood','lesson']];
function prog(id){const p=store.get('p:'+id,{})||{};return Object.assign({watched:false,done:false,quiz:0},p,{seen:Object.assign({},p.seen||{})})}
function setProg(id,patch){store.set('p:'+id,Object.assign(prog(id),patch));buildNav()}
function stepDone(p,k){return k==='watched'?!!p.watched:k==='done'?!!p.done:k==='quiz'?p.quiz>=80:!!p.seen[k]}
function pct(id){const p=prog(id);let s=0;STEPS.forEach(([k])=>{s+=k==='quiz'?Math.min(1,(p.quiz||0)/80):(stepDone(p,k)?1:0)});return Math.round(s/STEPS.length*100)}
function mockState(n){return Object.assign({done:false,score:null},store.get('m:'+n,{})||{})}
function overall(){const tp=T.reduce((a,t)=>a+pct(t.id),0)/T.length;const md=MOCKS.filter((_,i)=>mockState(i+1).done).length;
  return {pct:Math.round(tp*0.8+(MOCKS.length?md/MOCKS.length*100:0)*0.2),topics:T.filter(t=>pct(t.id)>=100).length,md}}
function updateBar(){const o=overall(),el=$('#gprog');if(!el)return;$('i',el).style.width=o.pct+'%';
  $('span',el).textContent=`📈 Progress ${o.pct}% · ${o.topics}/${T.length} topics complete · ${o.md}/${MOCKS.length} mocks done`}

/* ---------- nav ---------- */
const EXTRA=[['papers','📜','Real past papers','#b45309'],['arena','🧠','Quiz Arena (all topics)','#9333ea'],['lab','🧮','Calculation Lab','#0f766e'],...MOCKS.map((m,i)=>['mock'+(i+1),'📝',m.title,'#be123c']),['plan','📅','4-Day plan','#16a34a'],['cheat','📌','Cheat sheet','#ca8a04'],['search','🔎','Search notes','#475569']];
function buildNav(){
  const h=location.hash||'#/home';
  let s=`<a href="#/home" class="${h==='#/home'?'active':''}" style="--c:#e11d48"><span>🏠</span>Home</a><div class="grp">Topics</div>`;
  T.forEach(t=>{const pc=pct(t.id);s+=`<a href="#/t/${t.id}" class="${(h==='#/t/'+t.id||h.startsWith('#/t/'+t.id+'/'))?'active':''}" style="--c:${t.color}"><span class="dot" style="background:${t.color}"></span>${t.emoji} ${t.short}<span class="done">${pc>=100?'✔':pc?pc+'%':''}</span></a>`});
  s+='<div class="grp">Practice</div>';
  EXTRA.forEach(([id,e,n,c])=>{s+=`<a href="#/${id}" class="${(h==='#/'+id||h.startsWith('#/'+id+'/'))?'active':''}" style="--c:${c}"><span>${e}</span>${n}</a>`});
  $('#side').innerHTML=s;updateBar();
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
    $('.chips',st).innerHTML=(s.svg?`<div class="sv">${s.svg}</div>`:'')+s.v.map(c=>`<div class="chip">${esc(c)}</div>`).join('');st.classList.toggle('withsv',!!s.svg);
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
      qn++;let ans='',pre='';i++;
      while(i<blocks.length&&!['q','h2','h3'].includes(blocks[i].k)){if(blocks[i].pre)pre+=blockHTML(blocks[i]);else ans+=blockHTML(blocks[i]);i++}
      const qt=b.t.replace(/^Q\d+\.\s*/,'');
      out+=`<div class="qa"><div class="q"><span>Q${qn}.</span><span>${qt}</span>${b.m?`<span class="m pill">${b.m} mk</span>`:''}</div>
        ${pre?`<div class="qfig">${pre}</div>`:''}<button class="btn sm ghost rv">👀 Show / hide answer</button><div class="ans">${ans}</div></div>`;
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
const LET=j=>String.fromCharCode(65+j);
function quizHTML(qs,id){return `<div class="quiz"><div class="card qstat"><b>🧠 ${qs.length} questions.</b> Tap an answer: you get ✅/❌ and the explanation instantly. <span class="live"></span></div>${qs.map((q,n)=>`<div class="card qz" data-a="${q.a}"><b>${n+1}. ${q.q}</b>${q.o.map((o,j)=>`<button class="opt" data-j="${j}">${LET(j)}. ${esc(o)}</button>`).join('')}<div class="fb"></div></div>`).join('')}
 <div class="card"><span class="score">Score: <span class="sc">0</span> / ${qs.length}</span> <button class="btn sm ghost redo">↻ Retry</button></div></div>`}
function feedback(c,q,j){const ok=j===q.a;c.classList.add('answered',ok?'got':'miss');const fb=$('.fb',c);
  fb.className='fb '+(ok?'good':'bad');fb.innerHTML=(ok?'✅ <b>Correct!</b> ':`❌ <b>Wrong.</b> You chose ${LET(j)}. The correct answer is <b>${LET(q.a)}. ${esc(q.o[q.a])}</b>. `)+`<br>💡 ${q.x}`;
  const btns=$$('.opt',c);btns[q.a].classList.add('right');if(!ok)btns[j].classList.add('wrong');btns.forEach(b=>b.disabled=true);return ok}
function wireQuiz(root,qs,id){let right=0,ans=0;
  $$('.qz',root).forEach((c,n)=>{$$('.opt',c).forEach(b=>b.onclick=()=>{if(c.classList.contains('answered'))return;ans++;if(feedback(c,qs[n],+b.dataset.j))right++;
    $('.sc',root).textContent=right;$('.live',root).textContent=`Answered ${ans}/${qs.length} · correct ${right}`;
    if(ans===qs.length){const p=Math.round(right/qs.length*100);if(id&&p>prog(id).quiz)setProg(id,{quiz:p});$('.sc',root).textContent=`${right} (${p}%)${p>=80?' 🏆 Great!':' - retry to reach 80%'}`}})});
  $('.redo',root).onclick=()=>{root.innerHTML=quizHTML(qs,id);wireQuiz(root,qs,id)}}

/* ---------- Quiz Arena: one question at a time ---------- */
function arena(){setColor('#9333ea');const all=T.flatMap(t=>t.quiz.map(q=>Object.assign({},q,{tid:t.id,tn:t.short,te:t.emoji})));
  const best=store.get('arenaBest',null);
  main.innerHTML=`<div class="hero" style="--c:#9333ea"><h1>🧠 Quiz Arena</h1><p>${all.length} questions across every topic. One at a time, instant ✅/❌ with explanation, then review your mistakes.${best!=null?` Best score: ${best}%.`:''}</p></div><div id="ar"></div>`;
  const ar=$('#ar');
  const setup=()=>{ar.innerHTML=`<div class="card"><h2>1. Choose topics</h2><div class="row"><button class="btn sm ghost" id="aall">All</button><button class="btn sm ghost" id="anone">None</button></div>
    <div class="grid" style="margin-top:8px">${T.map(t=>`<label class="check"><input type="checkbox" class="tp" value="${t.id}" checked><span>${t.emoji} ${t.short} <small class="muted">(${t.quiz.length})</small></span></label>`).join('')}</div>
    <h2 style="margin-top:14px">2. How many questions?</h2><div class="row">${[10,20,40,0].map(n=>`<label class="row"><input type="radio" name="an" value="${n}" ${n===20?'checked':''}> ${n||'All'}</label>`).join('')}</div>
    <label class="row" style="margin-top:10px"><input type="checkbox" id="ash" checked> Shuffle questions</label>
    <button class="btn" id="ago" style="margin-top:12px">▶ Start quiz</button></div>`;
    $('#aall').onclick=()=>$$('.tp').forEach(x=>x.checked=true);$('#anone').onclick=()=>$$('.tp').forEach(x=>x.checked=false);
    $('#ago').onclick=()=>{const ids=$$('.tp').filter(x=>x.checked).map(x=>x.value);if(!ids.length)return alert('Choose at least one topic');
      let qs=all.filter(q=>ids.includes(q.tid));if($('#ash').checked)qs=qs.map(q=>[Math.random(),q]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);const n=+$('input[name=an]:checked').value;if(n)qs=qs.slice(0,n);run(qs)}};
  const run=(qs)=>{let i=0,right=0;const wrong=[];
    const show=()=>{const q=qs[i];ar.innerHTML=`<div class="card"><div class="row" style="justify-content:space-between"><span class="pill">${q.te} ${esc(q.tn)}</span><b>Question ${i+1} / ${qs.length} · ✅ ${right} · ❌ ${wrong.length}</b></div>
      <div class="bar" style="margin:10px 0"><i style="width:${i/qs.length*100}%;background:#9333ea"></i></div><div class="qz" style="margin:0"><b style="font-size:1.08rem">${q.q}</b>${q.o.map((o,j)=>`<button class="opt" data-j="${j}">${LET(j)}. ${esc(o)}</button>`).join('')}<div class="fb"></div></div>
      <div class="row" style="margin-top:10px"><button class="btn" id="anext" disabled>${i<qs.length-1?'Next ▶':'See results 🏁'}</button><button class="btn sm ghost" id="aquit">✖ Stop</button></div></div>`;
      const c=$('.qz',ar);$$('.opt',c).forEach(b=>b.onclick=()=>{if(c.classList.contains('answered'))return;const ok=feedback(c,q,+b.dataset.j);if(ok)right++;else wrong.push(Object.assign({chosen:+b.dataset.j},q));$('#anext').disabled=false;$('#anext').focus()});
      $('#anext').onclick=()=>{i++;i<qs.length?show():done()};$('#aquit').onclick=()=>done()};
    const done=()=>{const tot=right+wrong.length,p=tot?Math.round(right/tot*100):0;if(tot>=10&&p>(store.get('arenaBest',0)||0))store.set('arenaBest',p);
      const byT={};qs.slice(0,tot).forEach(q=>{byT[q.tn]=byT[q.tn]||[0,0];byT[q.tn][1]++});qs.slice(0,tot).forEach(q=>{if(!wrong.includes(q)&&!wrong.some(w=>w.q===q.q))byT[q.tn][0]++});
      ar.innerHTML=`<div class="card"><h2>🏁 Result: ${right} / ${tot} (${p}%) ${p>=80?'🏆 Exam-ready!':p>=60?'👍 Good, fix the mistakes below':'📚 Review the topics below'}</h2>
       <div class="tblwrap"><table><tr><th>Topic</th><th>Score</th></tr>${Object.entries(byT).map(([k,[a,b]])=>`<tr><td>${esc(k)}</td><td>${a}/${b}</td></tr>`).join('')}</table></div>
       <div class="row"><button class="btn" id="aretry" ${wrong.length?'':'disabled'}>↻ Retry my ${wrong.length} wrong answers</button><button class="btn ghost" id="anew">New quiz</button></div></div>
       ${wrong.length?`<div class="card"><h2>❌ Review your mistakes</h2>${wrong.map(w=>`<div class="qa"><div class="q"><span class="pill">${esc(w.tn)}</span><span>${w.q}</span></div><div class="ans"><p>You chose <b>${LET(w.chosen)}. ${esc(w.o[w.chosen])}</b> ✗<br>Correct: <b>${LET(w.a)}. ${esc(w.o[w.a])}</b> ✓<br>💡 ${w.x}</p></div></div>`).join('')}</div>`:''}`;
      $('#anew').onclick=setup;if(wrong.length)$('#aretry').onclick=()=>run(wrong.map(w=>{const c=Object.assign({},w);delete c.chosen;return c}))};
    show()};
  setup()}

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
  const total=overall().pct;
  const o=overall();
  const dash=`<div class="card"><h2>📊 Progress dashboard</h2><div class="bar" style="height:14px"><i style="width:${o.pct}%;background:#16a34a"></i></div>
   <p class="muted" style="margin:6px 0 10px">${o.pct}% overall · ${o.topics}/${T.length} topics complete · ${o.md}/${MOCKS.length} mocks done. Every tab you open, a lesson watched, a quiz ≥ 80% and "I understand" each count.</p>
   <div class="tblwrap"><table class="dash"><tr><th>Topic</th><th>%</th>${STEPS.map(x=>`<th title="${x[1]}">${x[1].split(' ')[0]}</th>`).join('')}</tr>${T.map(t=>{const pp=prog(t.id);return `<tr><td><a href="#/t/${t.id}">${t.emoji} ${t.short}</a></td><td><b>${pct(t.id)}%</b></td>${STEPS.map(([k,n,tb])=>`<td><a href="#/t/${t.id}/${tb}" title="${n}" style="text-decoration:none">${stepDone(pp,k)?'✅':'⬜'}</a></td>`).join('')}</tr>`}).join('')}</table></div>
   <p style="margin:10px 0 6px"><b>Mock tests:</b></p><div class="steps-row">${MOCKS.map((m,i)=>{const ms=mockState(i+1);return `<a class="stp ${ms.done?'ok':''}" href="#/mock${i+1}">${ms.done?'✓':'○'} Mock ${i+1}${ms.score!=null?` · ${ms.score}/40`:''}</a>`}).join('')}</div>
   <button class="btn sm ghost" id="resetP" style="margin-top:10px">↺ Reset all progress</button></div>`;

  main.innerHTML=`<div class="hero" style="--c:#e11d48"><h1>⚔️ SIS 6116 AI Principles: Test Warrior</h1><p>Everything for the 1-hour class test (whole module, weeks 1-10), even if you missed every class. Watch, understand, practise, win.</p>
   <div class="bar" style="background:rgba(255,255,255,.25)"><i style="width:${total}%;background:#fff"></i></div><small>Overall progress: ${total}%</small></div>
  ${dash}<div class="card"><h2>🚀 Start here</h2><ol class="steps">
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
  const rb=$('#resetP');if(rb)rb.onclick=()=>{if(!confirm('Reset all progress (topics, quizzes, mocks, plan)?'))return;try{Object.keys(localStorage).filter(x=>/^sis6116:(p:|m:|plan)/.test(x)).forEach(x=>localStorage.removeItem(x))}catch(e){}buildNav();home()};
}

function topic(id,tab){
  const t=byId[id];if(!t)return home();setColor(t.color);tab=tab||'lesson';
  const tabs=[['lesson','🎬 Video lesson'],['simple','🧒 Simple + Hacks'],['qa','❓ Q&A practice'],['quick','⚡ Quick Qs'],['scen','🎭 Scenarios'],['notes','📖 Full notes'],['quiz','🧠 Quiz'],['cards','🃏 Flashcards']];
  if(!tabs.some(x=>x[0]===tab))tab='lesson';
  if(!['lesson','quiz'].includes(tab)){const pp=prog(id);if(!pp.seen[tab]){pp.seen[tab]=true;store.set('p:'+id,pp)}}
  const p=prog(id);
  main.innerHTML=`<div class="hero" style="--c:${t.color}"><h1>${t.emoji} ${t.title}</h1><p>Topic ${t.n} · source: ${t.src} · progress ${pct(id)}% ${p.quiz?`· best quiz ${p.quiz}%`:''}</p></div>
   <div class="steps-row">${STEPS.map(([k,n,tb])=>`<a href="#/t/${id}/${tb}" class="stp ${stepDone(p,k)?'ok':''}">${stepDone(p,k)?'✓':'○'} ${n}</a>`).join('')}</div>
   <div class="tabs">${tabs.map(([k,n])=>`<button data-k="${k}" class="${k===tab?'on':''}">${n}</button>`).join('')}</div><div id="pane"></div>
   <div class="card row"><label class="row"><input type="checkbox" id="doneBox" ${p.done?'checked':''}> ✅ I understand this topic</label><label class="row"><input type="checkbox" id="watchBox" ${p.watched?'checked':''}> 🎬 Lesson watched / transcript read</label>
   ${T[t.n+1]?`<a class="btn" href="#/t/${T[t.n+1].id}" style="margin-left:auto">Next topic: ${T[t.n+1].emoji} ${T[t.n+1].short} ▶</a>`:''}</div>`;
  $$('.tabs button',main).forEach(b=>b.onclick=()=>{location.hash=`#/t/${id}/${b.dataset.k}`});
  $('#doneBox').onchange=e=>{setProg(id,{done:e.target.checked});topic(id,tab)};
  $('#watchBox').onchange=e=>{setProg(id,{watched:e.target.checked});topic(id,tab)};
  const pane=$('#pane');const blocks=t.notes||[];
  if(tab==='lesson'){activePlayer=Player(pane,t)}
  else if(tab==='simple'){pane.innerHTML=`<div class="kid" style="--c:${t.color}"><b>🧒 Explain it like I'm 10</b><p style="margin:6px 0 0">${t.kid}</p></div>
     <div class="card" style="margin-top:14px"><h2>🧠 Hacks, mnemonics & exam cheats</h2>${t.hacks.map((h,n)=>`<div class="hack"><div class="n">${n+1}</div><div><b>${h[0]}</b>${h[1]}</div></div>`).join('')}</div>`}
  else if(tab==='notes'){pane.innerHTML=`<div class="card notes">${practiceSwitch(pane)}<div class="nb">${renderBlocks(blocks,false)}</div></div>`;const nb=$('.nb',pane);wireQA(nb);wirePractice(pane,nb)}
  else if(tab==='qa'){const n=blocks.filter(b=>b.k==='q').length;pane.innerHTML=`<div class="card notes"><p class="muted">${n} exam-style questions with full model answers. Answer first, then reveal.</p>${practiceSwitch(pane)}<div class="nb">${renderBlocks(blocks,true)}</div></div>`;const nb=$('.nb',pane);wireQA(nb);wirePractice(pane,nb)}
  else if(tab==='quick'){pane.innerHTML=`<div class="card notes"><p class="muted">${t.quick.length} rapid-recall questions. Say the answer out loud, then tap to check.</p>${t.quick.map((x,i)=>`<div class="qa"><div class="q"><span>${i+1}.</span><span>${x[0]}</span></div><button class="btn sm ghost rv">👀 Show answer</button><div class="ans hide"><b style="color:var(--good)">${x[1]}</b></div></div>`).join('')}</div>`;$$('.qa',pane).forEach(q=>$('.rv',q).onclick=()=>$('.ans',q).classList.toggle('hide'))}
  else if(tab==='scen'){pane.innerHTML=`<div class="card notes"><p class="muted">Real-world scenario questions, like part (a) of the paper. Plan your answer (technique → why → how → risk), then reveal the model answer.</p>${t.scen.length?t.scen.map((x,i)=>`<div class="qa"><div class="q"><span>S${i+1}.</span><span>${x[0]}</span></div><button class="btn sm ghost rv">👀 Show model answer</button><div class="ans hide"><p>${x[1]}</p></div></div>`).join(''):'<p>See the Q&amp;A tab for this topic.</p>'}</div>`;$$('.qa',pane).forEach(q=>$('.rv',q).onclick=()=>$('.ans',q).classList.toggle('hide'))}
  else if(tab==='quiz'){pane.innerHTML=quizHTML(t.quiz,id);wireQuiz(pane,t.quiz,id)}
  else if(tab==='cards'){pane.innerHTML='<div class="card"></div>';cardsUI($('.card',pane),t.cards,t.color)}
}

function papers(){setColor('#b45309');const P=window.PAPERS||[];
  main.innerHTML=`<div class="hero" style="--c:#b45309"><h1>📜 Real past papers & exercise sheets</h1><p>Every question from your folder (Sample Test 2025 and the exercise sheets): narrated video walkthrough with diagrams, plus full step-by-step answers.</p></div>
  <div class="grid">${P.map(x=>{const st=store.get('pp:'+x.id,{});return `<a class="tile" href="#/paper/${x.id}" style="--c:${x.color}"><div class="em">${x.emoji}</div><b>${x.title}</b><small>${x.blocks.filter(b=>b.k==='q').length} questions · ${x.scenes.length} video scenes${st.seen?' · ✓ opened':''}</small><br><small class="muted">${esc(x.src)}</small></a>`}).join('')}</div>`}
function paper(id,tab){const P=(window.PAPERS||[]).find(x=>x.id===id);if(!P)return papers();setColor(P.color);tab=tab==='qa'?'qa':'video';store.set('pp:'+id,{seen:true});
  main.innerHTML=`<div class="hero" style="--c:${P.color}"><h1>${P.emoji} ${P.title}</h1><p>${P.intro} · source: ${esc(P.src)}</p></div>
   <div class="tabs"><button data-k="video" class="${tab==='video'?'on':''}">🎬 Video walkthrough</button><button data-k="qa" class="${tab==='qa'?'on':''}">📝 Questions & answers</button><a class="btn sm ghost" href="#/papers" style="margin-left:auto">← All papers</a></div><div id="pane"></div>`;
  $$('.tabs button',main).forEach(b=>b.onclick=()=>{location.hash=`#/paper/${id}/${b.dataset.k}`});const pane=$('#pane');
  if(tab==='video'){activePlayer=Player(pane,{id:'paper-'+P.id,title:P.title,color:P.color,scenes:P.scenes})}
  else{pane.innerHTML=(P.timer?`<div class="card row"><span class="timer" id="tm">60:00</span><button class="btn" id="tgo">▶ Start 60-min timer</button><span class="muted">Sit it like the real test</span></div>`:'')+`<div class="card notes">${practiceSwitch(pane)}<div class="nb">${renderBlocks(P.blocks,false)}</div></div>`;
    const nb=$('.nb',pane);wireQA(nb);wirePractice(pane,nb);
    if(P.timer){let left=3600,run=false,iv=null;const paint=()=>{$('#tm').textContent=`${String(Math.floor(left/60)).padStart(2,'0')}:${String(left%60).padStart(2,'0')}`};
      $('#tgo').onclick=()=>{run=!run;$('#tgo').textContent=run?'⏸ Pause':'▶ Resume';if(run){iv=setInterval(()=>{left--;paint();if(left<=0){clearInterval(iv);alert('⏰ Time is up!')}},1000);window._mockIv=iv}else clearInterval(iv)}}}}
function allquiz(){setColor('#9333ea');const qs=T.flatMap(t=>t.quiz.map(q=>Object.assign({},q,{q:`<span class="pill">${t.short}</span> ${q.q}`}))).sort(()=>Math.random()-.5).slice(0,20);
  main.innerHTML=`<div class="hero" style="--c:#9333ea"><h1>⚡ Quick-fire quiz</h1><p>20 random questions from all topics. Reload for a new set.</p></div><div id="qzz"></div>`;
  const r=$('#qzz');r.innerHTML=quizHTML(qs,null);wireQuiz(r,qs,null)}

function mock(n){setColor('#be123c');const M=MOCKS[n-1];const blocks=M.blocks;
  main.innerHTML=`<div class="hero" style="--c:#be123c"><h1>📝 ${M.title}</h1><p>Sample Test 2025 format · 4 questions × 10 marks · 60 minutes. Start the timer, answer on paper, then reveal and mark yourself.</p></div>
  <div class="card row"><span class="timer" id="tm">60:00</span><button class="btn" id="tgo">▶ Start</button><button class="btn ghost" id="trs">↺ Reset</button><span class="muted">About 15 min per question</span></div>
  <div class="card notes">${practiceSwitch(main)}<div class="nb">${renderBlocks(blocks,false)}</div></div>`;
  const ms=mockState(n);main.insertAdjacentHTML('beforeend',`<div class="card row"><b>Finished?</b><label>My score / 40 <input type="number" id="msc" min="0" max="40" value="${ms.score??''}" style="width:90px"></label><button class="btn" id="mdone">${ms.done?'✅ Completed (update)':'✅ Mark as completed'}</button><span class="muted" id="mst">${ms.done?'Saved'+(ms.score!=null?` · ${ms.score}/40 (${Math.round(ms.score/40*100)}%)`:''):''}</span></div>`);
  $('#mdone').onclick=()=>{const v=$('#msc').value;const sc=v===''?null:Math.max(0,Math.min(40,+v));store.set('m:'+n,{done:true,score:sc});$('#mst').textContent='Saved'+(sc!=null?` · ${sc}/40 (${Math.round(sc/40*100)}%)`:'');$('#mdone').textContent='✅ Completed (update)';buildNav()};
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

let IDX=null;
const stripH=h=>String(h).replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();
function blocksText(blocks){const out=[];(blocks||[]).forEach(b=>{let tx='';if(b.t)tx+=b.t;if(b.items)tx+=' '+b.items.join(' ');if(b.rows)tx+=' '+b.rows.map(r=>r.join(' | ')).join(' ; ');if(b.lines)tx+=' '+b.title+' '+b.lines.join(' ');if(b.ul)tx+=' '+b.ul.join(' ');if(b.ol)tx+=' '+b.ol.join(' ');if(b.cap)tx+=' '+b.cap;if(tx.trim())out.push({qa:b.k==='q'||b.k==='a',tx})});return out}
function buildIndex(){if(IDX)return IDX;IDX=[];const add=(type,title,link,text)=>{const tx=stripH(text||'');if(tx)IDX.push({type,title,link,tx})};
  T.forEach(t=>{const L='#/t/'+t.id;add('Topic',t.title,L+'/lesson',t.title+' '+t.short+' '+(t.src||''));
    t.scenes.forEach(x=>add('Video lesson',t.title+' · '+x.t,L+'/lesson',x.t+' · '+x.v.join(' · ')+' · '+x.s.join(' ')));
    add('Simple explanation',t.title,L+'/simple',t.kid);t.hacks.forEach(h=>add('Hack',t.title+' · '+stripH(h[0]),L+'/simple',h[0]+': '+h[1]));
    blocksText(t.notes).forEach(x=>add(x.qa?'Q&A':'Notes',t.title,L+(x.qa?'/qa':'/notes'),x.tx));
    (t.quick||[]).forEach(x=>add('Quick Q',t.title,L+'/quick',x[0]+' → '+x[1]));(t.scen||[]).forEach(x=>add('Scenario',t.title,L+'/scen',x[0]+' — '+x[1]));
    t.quiz.forEach(x=>add('Quiz',t.title,L+'/quiz',x.q+' → '+x.o[x.a]+'. '+x.x));t.cards.forEach(x=>add('Flashcard',t.title,L+'/cards',x[0]+': '+x[1]))});
  MOCKS.forEach((m,i)=>blocksText(m.blocks).forEach(x=>add('Mock test',m.title,'#/mock'+(i+1),x.tx)));
  (window.PAPERS||[]).forEach(P=>{blocksText(P.blocks).forEach(x=>add('Past paper',P.title,'#/paper/'+P.id+'/qa',x.tx));P.scenes.forEach(x=>add('Past paper',P.title+' · '+x.t,'#/paper/'+P.id,x.t+' '+x.s.join(' ')))});
  [['A* greedy UCS Dijkstra BFS DFS search tracer f = g + h admissible','search'],['DFID iterative deepening depth limit','dfid'],['entropy information gain decision tree ID3 PlayTennis','entropy'],['perceptron learning rule AND OR NAND XOR threshold','perc'],['backpropagation sigmoid delta gradient XOR network','bp'],['simulated annealing temperature cooling acceptance probability','sa'],['genetic algorithm roulette crossover mutation fitness','ga'],['CSP forward checking graph colouring domains backtrack','csp'],['counting factorial search space TSP routes','count']].forEach(([tx,k])=>add('Calculator','Calculation Lab',`#/lab/${k}`,tx));
  add('Page','Cheat sheet','#/cheat','cheat sheet formula sheet all formulas');add('Page','4-Day plan','#/plan','plan schedule study days checklist');
  return IDX}
function doSearch(q,limit,type){const terms=q.toLowerCase().split(/\s+/).filter(x=>x.length>1);if(!terms.length)return[];
  return buildIndex().filter(r=>!type||r.type===type).map(r=>{const l=r.tx.toLowerCase(),tl=r.title.toLowerCase();if(!terms.every(t=>l.includes(t)||tl.includes(t)))return null;
    let sc=terms.reduce((a,t)=>a+(tl.includes(t)?6:0)+Math.min(5,l.split(t).length-1),0)+(/Quick|Hack|Flashcard|Calculator/.test(r.type)?2:0);return Object.assign({sc},r)}).filter(Boolean).sort((a,b)=>b.sc-a.sc).slice(0,limit)}
function snippet(r,q,len=170){const terms=q.toLowerCase().split(/\s+/).filter(x=>x.length>1);const l=r.tx.toLowerCase();let i=-1;terms.some(t=>(i=l.indexOf(t))>=0);i=Math.max(0,i);
  const s0=Math.max(0,i-60);let sn=esc((s0?'…':'')+r.tx.slice(s0,s0+len)+(s0+len<r.tx.length?'…':''));
  terms.forEach(t=>{sn=sn.replace(new RegExp('('+t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig'),'<mark>$1</mark>')});return sn}
function resultHTML(r,q){return `<a class="sres" href="${r.link}"><span class="pill">${esc(r.type)}</span> <b>${esc(r.title)}</b><span class="snip">${snippet(r,q)}</span></a>`}
function search(q0){setColor('#475569');q0=q0||'';const types=['Past paper','Q&A','Quick Q','Scenario','Notes','Video lesson','Hack','Quiz','Flashcard','Mock test','Calculator'];let type='';
  main.innerHTML=`<div class="hero" style="--c:#475569"><h1>🔎 Search everything</h1><p>Notes, Q&amp;A, quick questions, scenarios, quizzes, flashcards, hacks, lesson subtitles, mock tests and calculators. Use several words to narrow (e.g. "A* admissible").</p></div>
  <div class="card"><input type="search" id="sq" placeholder="Search… e.g. entropy, tenure, forward checking" value="${esc(q0)}" autocomplete="off"><div class="tabs" id="sf" style="margin:10px 0 0"><button data-t="" class="on">All</button>${types.map(t=>`<button data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div></div><div id="sr"></div>`;
  const run=()=>{const q=$('#sq').value.trim();if(q.length<2){$('#sr').innerHTML='<div class="card muted">Type at least 2 characters.</div>';return}
    const res=doSearch(q,80,type);$('#sr').innerHTML=res.length?`<div class="card"><p class="muted" style="margin:0 0 8px">${res.length}${res.length===80?'+':''} result${res.length>1?'s':''}</p>${res.map(r=>resultHTML(r,q)).join('')}</div>`:'<div class="card">No results. Try fewer or different words.</div>'};
  $('#sq').oninput=run;$$('#sf button').forEach(b=>b.onclick=()=>{type=b.dataset.t;$$('#sf button').forEach(x=>x.classList.toggle('on',x===b));run()});
  run();setTimeout(()=>{try{$('#sq').focus()}catch(e){}},50)}

/* global search box in the top bar */
(function(){const inp=$('#gsq'),box=$('#gsr');if(!inp)return;
  const close=()=>{box.classList.remove('open');box.innerHTML=''};
  inp.addEventListener('input',()=>{const q=inp.value.trim();if(q.length<2)return close();const res=doSearch(q,8);
    box.innerHTML=(res.length?res.map(r=>resultHTML(r,q)).join(''):'<div class="sres muted">No results</div>')+`<a class="sres all" href="#/search/${encodeURIComponent(q)}">See all results for “${esc(q)}” →</a>`;box.classList.add('open')});
  inp.addEventListener('keydown',e=>{if(e.key==='Enter'&&inp.value.trim().length>1){location.hash='#/search/'+encodeURIComponent(inp.value.trim());close();inp.blur()}if(e.key==='Escape'){close();inp.blur()}});
  box.addEventListener('click',()=>{close();inp.value=''});
  document.addEventListener('click',e=>{if(!e.target.closest('.gs'))close()});})();

/* ---------- router ---------- */
function route(){
  stopAll();if(window._mockIv)clearInterval(window._mockIv);$('#side').classList.remove('open');
  const h=(location.hash||'#/home').slice(2).split('/');
  if(h[0]==='t')topic(h[1],h[2]);
  else if(h[0]==='lab')window.renderLab(main,setColor);
  else if(h[0]==='allquiz'||h[0]==='arena')arena();
  else if(h[0]==='papers')papers();
  else if(h[0]==='paper')paper(h[1],h[2]);
  else if(/^mock\d+$/.test(h[0])&&MOCKS[+h[0].slice(4)-1])mock(+h[0].slice(4));
  else if(h[0]==='plan')plan();
  else if(h[0]==='cheat')cheat();
  else if(h[0]==='search')search(h[1]?decodeURIComponent(h.slice(1).join('/')):'');
  else home();
  buildNav();window.scrollTo(0,0);
}
window.addEventListener('hashchange',route);
const setHdr=()=>{const h=$('.topbar');if(h)document.documentElement.style.setProperty('--hdr',h.offsetHeight+'px')};window.addEventListener('resize',setHdr);setHdr();
main.addEventListener('click',()=>$('#side').classList.remove('open'));
route();
})();
