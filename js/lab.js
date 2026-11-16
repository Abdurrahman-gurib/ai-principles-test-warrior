/* SIS6116 Calculation Lab: step-by-step solvers matching the course conventions */
(function(){
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const f=(x,d=4)=>Number.isInteger(x)?String(x):(+(+x).toFixed(d)).toString();
const LABS=[['search','🔍 Search tracer (BFS · DFS · UCS · Greedy · A*)','#2563eb'],['dfid','🔁 DFID levels','#2563eb'],['entropy','🌳 Entropy & information gain','#059669'],['perc','🔧 Perceptron learning rule','#db2777'],['bp','🔙 Backpropagation (XOR 2-2-1)','#db2777'],['sa','🔥 Simulated annealing','#ea580c'],['ga','🧬 Genetic algorithm','#ea580c'],['csp','🧩 CSP forward checking','#0891b2'],['count','🔢 Search-space counting','#7c3aed']];
window.renderLab=function(main,setColor){
  const cur=(location.hash.split('/')[2])||'search';const c=(LABS.find(x=>x[0]===cur)||LABS[0])[2];setColor(c);
  main.innerHTML=`<div class="hero" style="--c:#0f766e"><h1>🧮 Calculation Lab</h1><p>Every calculation type in SIS6116, solved step by step using your course's conventions. Change the inputs, then copy the working onto paper.</p></div>
  <div class="tabs">${LABS.map(([k,n,cc])=>`<button data-k="${k}" class="${k===cur?'on':''}" style="${k===cur?'background:'+cc+';border-color:'+cc:''}">${n}</button>`).join('')}</div><div id="lab" class="calc"></div>`;
  $$('.tabs button',main).forEach(b=>b.onclick=()=>{location.hash='#/lab/'+b.dataset.k});
  ({search,dfid,entropy,perc,bp,sa,ga,csp,count}[cur]||search)($('#lab'));
  const LG={search:[['g','cost paid so far from the start'],['h','estimated cost to the goal (given)'],['f = g + h','A* priority (lowest first)'],['Frontier','nodes generated but not yet expanded'],['Expanded','node taken off the frontier this step'],['Path / cost','follow the parents back; add the edge costs']],
   dfid:[['Limit c','maximum depth allowed in this iteration'],['Visit order','order in which DFS reaches the nodes within the limit'],['Total generated','sum over all iterations (shows the repeat overhead)']],
   entropy:[['[a, b]','counts of each class in a subset'],['E(S)','impurity: 0 pure, 1 = 50/50'],['(|Sv|/|S|)·E(Sv)','weighted entropy of branch v'],['Gain','E(S) minus the weighted branch entropies: pick the largest']],
   perc:[['Σxw − θ','net input X'],['Ya','1 if X ≥ 0 else 0'],['e','Yd − Ya (0 = correct, no update)'],["w′, θ′","new values: w + α·x·e, θ − α·e"],['Epoch','4 rows = one pass over 00, 01, 10, 11'],['Converged','an epoch with every e = 0']],
   bp:[['sig(z)','1/(1 + e^−z)'],['Y3, Y4','hidden outputs'],['Y5','network output'],['e','Yd − Y5'],['δ5','Y5(1 − Y5)e: output gradient'],['δ3, δ4','Y(1 − Y)·δ5·w: hidden gradients (use the OLD w35, w45)'],['New w','w + α·(input to that link)·δ(of the receiving neuron)'],['New θ','θ − α·δ']],
   sa:[['Δ','how much worse the new solution is'],['T','current temperature'],['p','e^(−Δ/T) = acceptance chance'],['r','random number; accept if r < p'],['α','cooling factor (T ← αT)']],
   ga:[['f(x)','fitness of individual x'],['P','f/Σf = slice of the roulette wheel'],['Cumulative','running total used to map a random r to a parent'],['Crossover point','bits before the cut come from one parent, the rest from the other']],
   csp:[['D(X)','remaining legal values of X'],['Italic','already assigned'],['∅ (red)','empty domain → backtrack'],['Hidden dead end','two unassigned neighbours left with the same single value (AC-3 would catch it)']],
   count:[['n!','orderings of n distinct items'],['(n − 1)!','round trips with a fixed start'],['Time','count ÷ checks per second']]};
  const lg=LG[cur]||LG.search;$('#lab').insertAdjacentHTML('afterbegin',`<details class="card" open><summary><b>🔎 What every value in this calculator means</b></summary><div class="tblwrap"><table><tr><th>Value</th><th>Meaning</th></tr>${lg.map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td></tr>`).join('')}</table></div></details>`);
};
const SAMPLE_EDGES='S A 2\nS B 4\nA B 1\nA C 7\nB C 3\nB D 5\nC D 2\nC E 4\nD E 3\nD G 6\nE G 2',SAMPLE_H='S 10\nA 8\nB 6\nC 5\nD 4\nE 2\nG 0';
function parseGraph(txt,directed){const adj={};txt.split('\n').map(l=>l.trim().split(/[\s,]+/)).filter(x=>x.length>=2&&x[0]).forEach(([a,b,w])=>{w=w===undefined?1:+w;(adj[a]=adj[a]||[]).push([b,w]);adj[b]=adj[b]||[];if(!directed)adj[b].push([a,w])});Object.values(adj).forEach(l=>l.sort((x,y)=>x[0]<y[0]?-1:1));return adj}
function parseH(txt){const h={};txt.split('\n').map(l=>l.trim().split(/[\s,=:]+/)).filter(x=>x.length>=2).forEach(([n,v])=>h[n]=+v);return h}

/* ---------- search ---------- */
function search(L){
  L.innerHTML=`<div class="card"><h2>Search tracer</h2>
  <div class="note"><b>Conventions used</b>: graph search (expanded nodes are not re-expanded); ties broken <b>alphabetically</b>; goal test when a node is <b>removed</b> (expanded) from the frontier. BFS = FIFO queue, DFS = LIFO stack, UCS orders by g, Greedy by h, A* by f = g + h. Default = Sample Test 2025 graph.</div>
  <div class="row" style="align-items:flex-start"><div style="flex:1;min-width:200px"><label>Edges: "from to cost" per line</label><textarea id="ed" rows="8">${SAMPLE_EDGES}</textarea></div>
  <div style="flex:1;min-width:160px"><label>Heuristic h(n): "node value"</label><textarea id="hh" rows="8">${SAMPLE_H}</textarea></div></div>
  <div class="row" style="margin-top:8px"><label>Start <input type="text" id="st" value="S" style="width:70px"></label><label>Goal <input type="text" id="gl" value="G" style="width:70px"></label>
  <label>Algorithm <select id="al"><option value="astar">A* (f = g + h)</option><option value="greedy">Greedy best-first (h)</option><option value="ucs">Uniform-cost / Dijkstra (g)</option><option value="bfs">Breadth-first (FIFO)</option><option value="dfs">Depth-first (LIFO)</option></select></label>
  <label class="row"><input type="checkbox" id="dir"> Directed edges</label></div><div id="so" style="margin-top:12px;overflow-x:auto"></div></div>`;
  const run=()=>{const adj=parseGraph($('#ed').value,$('#dir').checked),h=parseH($('#hh').value),s=$('#st').value.trim(),g=$('#gl').value.trim(),al=$('#al').value;
    if(!adj[s]){$('#so').innerHTML='<div class="note warn">Start node not in graph.</div>';return}
    const H=n=>h[n]??0;const key=x=>al==='astar'?x.g+H(x.n):al==='greedy'?H(x.n):x.g;
    let fr=[{n:s,g:0,p:[s]}],closed=new Set(),rows='',step=0,res=null;
    const show=x=>al==='astar'?`${x.n}(${x.g}+${H(x.n)}=${x.g+H(x.n)})`:al==='greedy'?`${x.n}(h=${H(x.n)})`:al==='ucs'?`${x.n}(g=${x.g})`:x.n;
    while(fr.length&&step<60){
      let i=0;if(al==='bfs')i=0;else if(al==='dfs')i=fr.length-1;else{fr.forEach((x,j)=>{const a=key(x),b=key(fr[i]);if(a<b||(a===b&&x.n<fr[i].n))i=j})}
      const cur=fr.splice(i,1)[0];if(closed.has(cur.n))continue;step++;
      if(cur.n===g){res=cur;rows+=`<tr><td>${step}</td><td><b>${show(cur)}</b> 🎯 goal</td><td>${fr.filter(x=>!closed.has(x.n)).map(show).join(', ')||'-'}</td></tr>`;break}
      closed.add(cur.n);const kids=(adj[cur.n]||[]).filter(([m])=>!closed.has(m));
      const add=(al==='dfs'?[...kids].reverse():kids).map(([m,w])=>({n:m,g:cur.g+w,p:[...cur.p,m]}));
      add.forEach(x=>{if(al==='bfs'||al==='dfs'){if(!fr.some(y=>y.n===x.n)||al==='dfs'){if(al==='dfs')fr=fr.filter(y=>y.n!==x.n);fr.push(x)}}
        else{const ex=fr.find(y=>y.n===x.n);if(!ex)fr.push(x);else if(x.g<ex.g){ex.g=x.g;ex.p=x.p}}});
      const shownFr=al==='dfs'?[...fr].reverse():fr;
      rows+=`<tr><td>${step}</td><td><b>${show(cur)}</b></td><td>${shownFr.filter(x=>!closed.has(x.n)).map(show).join(', ')||'-'}</td></tr>`}
    const cost=res?res.p.slice(1).reduce((a,n,k)=>a+(adj[res.p[k]].find(e=>e[0]===n)||[0,0])[1],0):null;
    $('#so').innerHTML=`<div class="tblwrap"><table><tr><th>Step</th><th>Expanded node</th><th>Frontier after expansion${al==='dfs'?' (top of stack first)':''}</th></tr>${rows}</table></div>
     ${res?`<div class="note good">Expansion order: <b>${rows.match(/<td><b>([^<(]+)/g).map(x=>x.replace(/<td><b>/,'').trim()).join(' → ')}</b><br>Path found: <b>${res.p.join(' → ')}</b> · cost <b>${cost}</b></div>`:'<div class="note warn">Goal not reached.</div>'}
     ${al==='astar'?admis(adj,h,g):''}`};
  $$('textarea,input,select',L).forEach(x=>x.oninput=run);$('#al').onchange=run;$('#dir').onchange=run;run();
}
function admis(adj,h,g){const d={[g]:0},pq=[[0,g]];while(pq.length){pq.sort((a,b)=>a[0]-b[0]);const [c,n]=pq.shift();if(c>d[n])continue;(adj[n]||[]).forEach(([m,w])=>{if(c+w<(d[m]??1e9)){d[m]=c+w;pq.push([c+w,m])}})}
  const rows=Object.keys(h).map(n=>`<tr><td>${n}</td><td>${h[n]}</td><td>${d[n]??'∞'}</td><td>${h[n]<=(d[n]??1e9)?'✓':'✗ overestimates'}</td></tr>`).join('');
  const ok=Object.keys(h).every(n=>h[n]<=(d[n]??1e9));
  return `<details class="card"><summary><b>Admissibility check: h(n) ≤ true cost h*(n)?</b> ${ok?'✅ admissible':'❌ not admissible'}</summary><div class="tblwrap"><table><tr><th>Node</th><th>h(n)</th><th>True cost h*(n) to goal</th><th>OK?</th></tr>${rows}</table></div></details>`}

/* ---------- DFID ---------- */
function dfid(L){
  L.innerHTML=`<div class="card"><h2>Depth-first iterative deepening</h2><div class="note">For limit c = 0, 1, 2…: depth-limited DFS (alphabetical children, no repeated nodes on the current path). Shows the visit order at each depth, like the lecture's "DLS traversal" table.</div>
  <label>Edges (tree or graph)</label><textarea id="ed" rows="7">A B\nA C\nA D\nB E\nB F\nC G\nD H\nE I\nF J\nF K\nG L\nH M\nH N</textarea>
  <div class="row" style="margin-top:8px"><label>Start <input id="st" value="A" style="width:70px"></label><label>Goal <input id="gl" value="L" style="width:70px"></label><label class="row"><input type="checkbox" id="dir" checked> Directed (parent → child)</label></div><div id="so" style="margin-top:10px"></div></div>`;
  const run=()=>{const adj=parseGraph($('#ed').value,$('#dir').checked),s=$('#st').value.trim(),g=$('#gl').value.trim();let rows='',found=false,gen=0;
    for(let c=0;c<=10&&!found;c++){const order=[];const dls=(n,d,path)=>{order.push(n);gen++;if(n===g){found=true;return true}if(d===c)return false;for(const [m] of adj[n]||[]){if(path.includes(m))continue;if(dls(m,d+1,[...path,m]))return true}return false};
      dls(s,0,[s]);rows+=`<tr><td>${c}</td><td>${order.map(x=>x===g?`<b>${x}🎯</b>`:x).join(' ')}</td></tr>`}
    $('#so').innerHTML=`<div class="tblwrap"><table><tr><th>Depth limit</th><th>Visit order</th></tr>${rows}</table></div><div class="note ${found?'good':'warn'}">${found?`Goal found. Total nodes generated across all iterations = <b>${gen}</b> (shallow nodes are regenerated, but the overhead is small).`:'Goal not found within depth 10.'}</div>`};
  $$('textarea,input',L).forEach(x=>x.oninput=run);$('#dir').onchange=run;run();
}

/* ---------- entropy ---------- */
const PT=`Outlook,Temp,Humidity,Wind,Play
Sunny,Hot,High,Weak,No
Sunny,Hot,High,Strong,No
Overcast,Hot,High,Weak,Yes
Rain,Mild,High,Weak,Yes
Rain,Cool,Normal,Weak,Yes
Rain,Cool,Normal,Strong,No
Overcast,Cool,Normal,Strong,Yes
Sunny,Mild,High,Weak,No
Sunny,Cool,Normal,Weak,Yes
Rain,Mild,Normal,Weak,Yes
Sunny,Mild,Normal,Strong,Yes
Overcast,Mild,High,Strong,Yes
Overcast,Hot,Normal,Weak,Yes
Rain,Mild,High,Strong,No`;
const lg=x=>Math.log2(x);
function ent(counts){const n=counts.reduce((a,b)=>a+b,0);return counts.reduce((a,c)=>c?a-(c/n)*lg(c/n):a,0)}
function entTxt(counts){const n=counts.reduce((a,b)=>a+b,0);return counts.filter(c=>c).map(c=>`−(${c}/${n})log₂(${c}/${n})`).join(' ')||'0'}
function entropy(L){
  L.innerHTML=`<div class="card"><h2>Quick entropy</h2><div class="note">E(S) = −p₊log₂p₊ − p₋log₂p₋ (log₂x = ln x / ln 2)</div><div class="row"><label>Positives <input type="number" id="pp" value="9" style="width:90px"></label><label>Negatives <input type="number" id="nn" value="5" style="width:90px"></label></div><div id="qo" style="margin-top:8px"></div></div>
  <div class="card"><h2>Information gain for every attribute (ID3)</h2><p class="muted">CSV with a header; the last column is the target. Default = PlayTennis (lecture). Filter rows to grow a branch (e.g. Outlook = Sunny).</p>
  <textarea id="ds" rows="9">${PT}</textarea><div class="row" style="margin-top:8px"><label>Filter column <select id="fc"><option value="">(none: root)</option></select></label><label>= value <input id="fv" style="width:120px"></label></div><div id="eo" style="margin-top:10px"></div></div>`;
  const quick=()=>{const p=+$('#pp').value,n=+$('#nn').value;$('#qo').innerHTML=`<p>E = ${entTxt([p,n])} = <b>${f(ent([p,n]),3)}</b></p>`};
  const run=()=>{const lines=$('#ds').value.trim().split('\n').map(l=>l.split(',').map(s=>s.trim()));const head=lines[0];let data=lines.slice(1).filter(r=>r.length===head.length);
    const fc=$('#fc');const prev=fc.value;fc.innerHTML='<option value="">(none: root)</option>'+head.slice(0,-1).map(hh=>`<option ${hh===prev?'selected':''}>${esc(hh)}</option>`).join('');
    const fcol=head.indexOf(fc.value),fv=$('#fv').value.trim();if(fcol>=0&&fv)data=data.filter(r=>r[fcol].toLowerCase()===fv.toLowerCase());
    const T=head.length-1,classes=[...new Set(data.map(r=>r[T]))];const cnt=rows=>classes.map(c=>rows.filter(r=>r[T]===c).length);
    const ES=ent(cnt(data)),N=data.length;let out=`<p>S${fcol>=0&&fv?` (${esc(fc.value)} = ${esc(fv)})`:''}: ${N} examples [${classes.map((c,i)=>cnt(data)[i]+' '+esc(c)).join(', ')}] → E(S) = ${entTxt(cnt(data))} = <b>${f(ES,3)}</b></p>`;
    const gains=[];
    head.slice(0,-1).forEach((A,ai)=>{if(ai===fcol)return;const vals=[...new Set(data.map(r=>r[ai]))];let sum=0,parts=[];
      const rws=vals.map(v=>{const sub=data.filter(r=>r[ai]===v),c=cnt(sub),e=ent(c);sum+=sub.length/N*e;parts.push(`(${sub.length}/${N})(${f(e,3)})`);return `<tr><td>${esc(v)}</td><td>[${c.join(', ')}]</td><td>${entTxt(c)} = ${f(e,3)}</td></tr>`}).join('');
      const G=ES-sum;gains.push([A,G]);out+=`<details class="card" ${ai===0?'open':''}><summary><b>Gain(S, ${esc(A)}) = ${f(G,3)}</b></summary><div class="tblwrap"><table><tr><th>Value</th><th>Counts [${classes.map(esc).join(', ')}]</th><th>Entropy</th></tr>${rws}</table></div><p>Gain = ${f(ES,3)} − ${parts.join(' − ')} = <b>${f(G,3)}</b></p></details>`});
    gains.sort((a,b)=>b[1]-a[1]);out+=`<div class="note good">Ranking: ${gains.map(([A,G])=>`${esc(A)} ${f(G,3)}`).join(' > ')}<br>Best split: <b>${gains[0]?esc(gains[0][0]):'-'}</b>${ES===0?' (node is already pure → leaf)':''}</div>`;$('#eo').innerHTML=out};
  ['pp','nn'].forEach(i=>$('#'+i).oninput=quick);$('#ds').oninput=run;$('#fc').onchange=run;$('#fv').oninput=run;quick();run();
}

/* ---------- perceptron ---------- */
function perc(L){
  L.innerHTML=`<div class="card"><h2>Perceptron learning rule (course spreadsheet)</h2>
  <div class="note">Ya = 1 if x1·w1 + x2·w2 − θ ≥ 0 else 0 · e = Yd − Ya · w<sub>i</sub> ← w<sub>i</sub> + α·x<sub>i</sub>·e · θ ← θ + α·(−1)·e. Inputs in order 00, 01, 10, 11.</div>
  <div class="row"><label>Function <select id="fn"><option>AND</option><option>OR</option><option>NAND</option><option>XOR</option></select></label><label>α <input type="number" step="0.05" id="al" value="0.2" style="width:80px"></label>
  <label>w1 <input type="number" step="0.1" id="w1" value="0.5" style="width:80px"></label><label>w2 <input type="number" step="0.1" id="w2" value="-0.2" style="width:80px"></label><label>θ <input type="number" step="0.1" id="th" value="0.3" style="width:80px"></label><label>Max epochs <input type="number" id="me" value="10" style="width:80px"></label></div><div id="po" style="margin-top:10px;overflow-x:auto"></div></div>`;
  const run=()=>{const tbl={AND:[0,0,0,1],OR:[0,1,1,1],NAND:[1,1,1,0],XOR:[0,1,1,0]}[$('#fn').value],X=[[0,0],[0,1],[1,0],[1,1]];let a=+$('#al').value,w1=+$('#w1').value,w2=+$('#w2').value,th=+$('#th').value,me=+$('#me').value,rows='',conv=0,it=0;
    for(let ep=1;ep<=me;ep++){let errs=0;X.forEach(([x1,x2],k)=>{it++;const net=+(x1*w1+x2*w2).toFixed(3)-th,ya=net>=-1e-9?1:0,e=tbl[k]-ya;errs+=Math.abs(e);
      const n1=+(w1+a*x1*e).toFixed(4),n2=+(w2+a*x2*e).toFixed(4),nt=+(th-a*e).toFixed(4);
      rows+=`<tr${e?' style="background:#fff7ed"':''}><td>${it}</td><td>${k===0?ep:''}</td><td>${x1}</td><td>${x2}</td><td>${tbl[k]}</td><td>${f(w1)}</td><td>${f(w2)}</td><td>${f(th)}</td><td>${f(net,3)}</td><td>${ya}</td><td>${e}</td><td>${f(n1)}</td><td>${f(n2)}</td><td>${f(nt)}</td></tr>`;w1=n1;w2=n2;th=nt});
      if(errs===0){conv=ep;break}}
    $('#po').innerHTML=`<div class="tblwrap"><table><tr><th>Iter</th><th>Epoch</th><th>x1</th><th>x2</th><th>Yd</th><th>w1</th><th>w2</th><th>θ</th><th>Σxw − θ</th><th>Ya</th><th>e</th><th>w1′</th><th>w2′</th><th>θ′</th></tr>${rows}</table></div>
    <div class="note ${conv?'good':'warn'}">${conv?`✅ Converged: epoch ${conv} had no errors. Final w1 = ${f(w1)}, w2 = ${f(w2)}, θ = ${f(th)}.`:`❌ No convergence in ${me} epochs${$('#fn').value==='XOR'?': XOR is not linearly separable, so a single perceptron can never learn it.':'.'}`}</div>`};
  $$('input,select',L).forEach(x=>x.oninput=run);$('#fn').onchange=run;run();
}

/* ---------- backprop ---------- */
function bp(L){
  const P=[['w13',0.5],['w14',0.9],['w23',0.4],['w24',1.0],['w35',-1.2],['w45',1.1],['t3',0.8],['t4',-0.1],['t5',0.3]];
  L.innerHTML=`<div class="card"><h2>Backpropagation: 2-2-1 network (course XOR spreadsheet)</h2>
  <div class="note">Y = sigmoid(Σ x·w − θ) · e = Yd − Y5 · δ5 = Y5(1 − Y5)e · δ3 = Y3(1 − Y3)·δ5·w35 · δ4 = Y4(1 − Y4)·δ5·w45 · w ← w + α·input·δ · θ ← θ + α·(−1)·δ</div>
  <div class="row">${P.map(([k,v])=>`<label>${k.replace('t','θ')} <input type="number" step="0.1" id="${k}" value="${v}" style="width:80px"></label>`).join('')}<label>α <input type="number" step="0.1" id="al" value="0.5" style="width:80px"></label></div>
  <div class="row" style="margin-top:8px"><label>x1 <input type="number" id="x1" value="1" style="width:70px"></label><label>x2 <input type="number" id="x2" value="1" style="width:70px"></label><label>Yd <input type="number" id="yd" value="0" style="width:70px"></label>
  <label>Then train XOR for <input type="number" id="ep" value="0" style="width:90px"> epochs</label></div><div id="bo" style="margin-top:10px"></div></div>`;
  const sg=z=>1/(1+Math.exp(-z));
  const run=()=>{const v=Object.fromEntries(P.map(([k])=>[k,+$('#'+k).value]));const a=+$('#al').value,x1=+$('#x1').value,x2=+$('#x2').value,yd=+$('#yd').value;
    const n3=x1*v.w13+x2*v.w23-v.t3,y3=sg(n3),n4=x1*v.w14+x2*v.w24-v.t4,y4=sg(n4),n5=y3*v.w35+y4*v.w45-v.t5,y5=sg(n5),e=yd-y5,d5=y5*(1-y5)*e,d3=y3*(1-y3)*d5*v.w35,d4=y4*(1-y4)*d5*v.w45;
    const nw={w13:v.w13+a*x1*d3,w14:v.w14+a*x1*d4,w23:v.w23+a*x2*d3,w24:v.w24+a*x2*d4,w35:v.w35+a*y3*d5,w45:v.w45+a*y4*d5,t3:v.t3-a*d3,t4:v.t4-a*d4,t5:v.t5-a*d5};
    let out=`<ol class="steps">
    <li>Y3 = sig(${x1}(${v.w13}) + ${x2}(${v.w23}) − ${v.t3}) = sig(${f(n3)}) = <b>${f(y3)}</b></li>
    <li>Y4 = sig(${x1}(${v.w14}) + ${x2}(${v.w24}) − ${v.t4}) = sig(${f(n4)}) = <b>${f(y4)}</b></li>
    <li>Y5 = sig(${f(y3)}(${v.w35}) + ${f(y4)}(${v.w45}) − ${v.t5}) = sig(${f(n5)}) = <b>${f(y5)}</b></li>
    <li>e = ${yd} − ${f(y5)} = <b>${f(e)}</b></li>
    <li>δ5 = ${f(y5)}(1 − ${f(y5)})(${f(e)}) = <b>${f(d5)}</b></li>
    <li>δ3 = ${f(y3)}(1 − ${f(y3)})(${f(d5)})(${v.w35}) = <b>${f(d3)}</b> · δ4 = ${f(y4)}(1 − ${f(y4)})(${f(d5)})(${v.w45}) = <b>${f(d4)}</b></li>
    <li>w35 = ${v.w35} + ${a}(${f(y3)})(${f(d5)}) = <b>${f(nw.w35)}</b> · w45 = <b>${f(nw.w45)}</b></li>
    <li>w13 = ${v.w13} + ${a}(${x1})(${f(d3)}) = <b>${f(nw.w13)}</b> · w23 = <b>${f(nw.w23)}</b> · w14 = <b>${f(nw.w14)}</b> · w24 = <b>${f(nw.w24)}</b></li>
    <li>θ3 = ${v.t3} − ${a}(${f(d3)}) = <b>${f(nw.t3)}</b> · θ4 = <b>${f(nw.t4)}</b> · θ5 = ${v.t5} − ${a}(${f(d5)}) = <b>${f(nw.t5)}</b></li></ol>`;
    const E=+$('#ep').value;if(E>0){let w={...v};const D=[[1,1,0],[0,1,1],[1,0,1],[0,0,0]];let sse=0,hist=[];for(let ep=1;ep<=E;ep++){sse=0;D.forEach(([p,q,t])=>{const a3=sg(p*w.w13+q*w.w23-w.t3),a4=sg(p*w.w14+q*w.w24-w.t4),a5=sg(a3*w.w35+a4*w.w45-w.t5),er=t-a5,g5=a5*(1-a5)*er,g3=a3*(1-a3)*g5*w.w35,g4=a4*(1-a4)*g5*w.w45;sse+=er*er;
      w.w35+=a*a3*g5;w.w45+=a*a4*g5;w.t5-=a*g5;w.w13+=a*p*g3;w.w23+=a*q*g3;w.t3-=a*g3;w.w14+=a*p*g4;w.w24+=a*q*g4;w.t4-=a*g4});if(ep===1||ep%Math.max(1,Math.floor(E/8))===0||ep===E)hist.push([ep,sse])}
      const outs=D.map(([p,q,t])=>{const a3=sg(p*w.w13+q*w.w23-w.t3),a4=sg(p*w.w14+q*w.w24-w.t4);return `(${p},${q}) → ${f(sg(a3*w.w35+a4*w.w45-w.t5),3)} (target ${t})`}).join(' · ');
      out+=`<div class="card"><b>After ${E} epochs of XOR (patterns 11, 01, 10, 00):</b><div class="tblwrap"><table><tr><th>Epoch</th><th>Sum of squared errors</th></tr>${hist.map(([e2,s])=>`<tr><td>${e2}</td><td>${f(s)}</td></tr>`).join('')}</table></div><p>${outs}</p><p class="muted">Training is complete when SSE < 0.001 (a typical stopping criterion).</p></div>`}
    $('#bo').innerHTML=out};
  $$('input',L).forEach(x=>x.oninput=run);run();
}

/* ---------- SA ---------- */
function sa(L){
  L.innerHTML=`<div class="card"><h2>Simulated annealing acceptance</h2><div class="note">Worse move (Δ > 0 when minimising): accept with <b>p = e<sup>−Δ/T</sup></b>. Better move: always accept. Geometric cooling: T<sub>k+1</sub> = α·T<sub>k</sub>.</div>
  <div class="row"><label>Δ (how much worse) <input type="number" id="d" value="5" style="width:90px"></label><label>T <input type="number" id="t" value="10" style="width:90px"></label><label>Random number r <input type="number" step="0.01" id="r" value="0.4" style="width:90px"></label></div><div id="o1" style="margin-top:8px"></div></div>
  <div class="card"><h2>Cooling schedule table</h2><div class="row"><label>T₀ <input type="number" id="t0" value="100" style="width:90px"></label><label>α <input type="number" step="0.01" id="a" value="0.9" style="width:90px"></label><label>Steps <input type="number" id="n" value="10" style="width:90px"></label></div><div id="o2" style="margin-top:8px"></div></div>`;
  const run=()=>{const d=+$('#d').value,t=+$('#t').value,r=+$('#r').value,p=d<=0?1:Math.exp(-d/t);
    $('#o1').innerHTML=`<ol class="steps"><li>${d<=0?'Δ ≤ 0 → better or equal → accept (p = 1)':`p = e<sup>−${d}/${t}</sup> = e<sup>${f(-d/t)}</sup> = <b>${f(p)}</b>`}</li><li>Rule: accept if r &lt; p → ${r} &lt; ${f(p)}? <b>${r<p?'ACCEPT the worse move':'REJECT'}</b></li></ol>`;
    const t0=+$('#t0').value,a=+$('#a').value,n=+$('#n').value;let T=t0,rows='';for(let k=0;k<=n;k++){rows+=`<tr><td>${k}</td><td>${f(T,3)}</td><td>${f(Math.exp(-d/T))}</td></tr>`;T*=a}
    $('#o2').innerHTML=`<div class="tblwrap"><table><tr><th>k</th><th>T</th><th>p(accept Δ = ${d})</th></tr>${rows}</table></div><p class="muted">As T falls, bad moves become rarer: exploration → exploitation.</p>`};
  $$('input',L).forEach(x=>x.oninput=run);run();
}

/* ---------- GA ---------- */
function ga(L){
  L.innerHTML=`<div class="card"><h2>Roulette-wheel selection</h2><div class="note">P(select i) = f(i) / Σf. Default: maximise f(x) = x², x ∈ 0…31, 5-bit chromosomes (lecture example).</div>
  <div class="row"><label>Population (comma separated) <input id="pop" value="13, 24, 8, 19"></label><label>Bits <input type="number" id="bits" value="5" style="width:80px"></label><label>Fitness <select id="fit"><option value="sq">f(x) = x²</option><option value="lin">f(x) = x</option><option value="inv">f(x) = 31 − x</option></select></label></div><div id="o1" style="margin-top:8px"></div></div>
  <div class="card"><h2>Crossover & mutation</h2><div class="row"><label>Parent 1 <input id="p1" value="11000" style="width:120px"></label><label>Parent 2 <input id="p2" value="10011" style="width:120px"></label><label>Crossover after bit <input type="number" id="cp" value="2" style="width:70px"></label><label>Mutate child-1 bit # <input type="number" id="mb" value="5" style="width:70px"></label></div><div id="o2" style="margin-top:8px"></div></div>`;
  const F={sq:x=>x*x,lin:x=>x,inv:x=>31-x};
  const run=()=>{const pop=$('#pop').value.split(',').map(x=>parseInt(x)).filter(x=>!isNaN(x)),b=+$('#bits').value,fn=F[$('#fit').value];const fit=pop.map(fn),S=fit.reduce((a,c)=>a+c,0);let cum=0;
    $('#o1').innerHTML=`<div class="tblwrap"><table><tr><th>x</th><th>Chromosome</th><th>Fitness</th><th>P = f/Σf</th><th>Cumulative</th></tr>${pop.map((x,i)=>{cum+=fit[i]/S;return `<tr><td>${x}</td><td>${x.toString(2).padStart(b,'0')}</td><td>${fit[i]}</td><td>${f(fit[i]/S*100,1)}%</td><td>${f(cum,3)}</td></tr>`}).join('')}<tr><td colspan="2">Σ</td><td>${S}</td><td>100%</td><td></td></tr></table></div><p class="muted">Spin: draw r ∈ [0, 1) and pick the first individual whose cumulative value ≥ r.</p>`;
    const p1=$('#p1').value.trim(),p2=$('#p2').value.trim(),cp=+$('#cp').value,mb=+$('#mb').value;const c1=p1.slice(0,cp)+p2.slice(cp),c2=p2.slice(0,cp)+p1.slice(cp);
    const m=mb>=1&&mb<=c1.length?c1.slice(0,mb-1)+(c1[mb-1]==='1'?'0':'1')+c1.slice(mb):c1;const val=s=>parseInt(s,2);
    $('#o2').innerHTML=`<ol class="steps"><li>Parents: ${p1.slice(0,cp)}|${p1.slice(cp)} (${val(p1)}) and ${p2.slice(0,cp)}|${p2.slice(cp)} (${val(p2)})</li><li>Single-point crossover → child 1 = <b>${c1}</b> (${val(c1)}), child 2 = <b>${c2}</b> (${val(c2)})</li><li>Bit-flip mutation of bit ${mb} in child 1 → <b>${m}</b> (${val(m)}), fitness ${fn(val(m))}</li></ol>`};
  $$('input,select',L).forEach(x=>x.oninput=run);$('#fit').onchange=run;run();
}

/* ---------- CSP forward checking ---------- */
function csp(L){
  L.innerHTML=`<div class="card"><h2>Forward checking (graph colouring)</h2><div class="note">After each assignment, remove that colour from the domains of its <b>unassigned neighbours</b>. An empty domain means backtrack. Default = lecture exercise (8 nodes, colours R, C, B).</div>
  <div class="row" style="align-items:flex-start"><div style="flex:1;min-width:200px"><label>Edges</label><textarea id="ed" rows="7">1 2\n1 3\n1 4\n2 4\n3 4\n4 5\n5 6\n5 7\n6 7\n6 8\n7 8\n2 6\n3 7</textarea></div>
  <div style="flex:1;min-width:200px"><label>Colours</label><input id="cl" value="R C B"><label style="margin-top:8px;display:block">Assignments in order</label><input id="as" value="1=R, 4=C, 5=R, 8=C, 6=B"></div></div><div id="co" style="margin-top:10px;overflow-x:auto"></div>
  <p class="muted">Presets: <button class="btn sm ghost" id="au">Australia map</button> <button class="btn sm ghost" id="lx">Lecture exercise</button></p></div>`;
  const run=()=>{const adj={};$('#ed').value.split('\n').map(l=>l.trim().split(/[\s,-]+/)).filter(x=>x.length>=2&&x[0]).forEach(([a,b])=>{(adj[a]=adj[a]||new Set()).add(b);(adj[b]=adj[b]||new Set()).add(a)});
    const vars=Object.keys(adj).sort((a,b)=>isNaN(a)?a.localeCompare(b):a-b),cols=$('#cl').value.trim().split(/[\s,]+/);const D=Object.fromEntries(vars.map(v=>[v,[...cols]]));const asg={};
    const steps=$('#as').value.split(',').map(s=>s.trim().split('=')).filter(x=>x.length===2).map(([v,c])=>[v.trim(),c.trim()]);
    let rows=`<tr><td>Start</td>${vars.map(v=>`<td>${D[v].join('')}</td>`).join('')}</tr>`,fail=null;
    for(const [v,c] of steps){if(fail)break;if(!D[v]){rows+=`<tr><td colspan="${vars.length+1}">Unknown variable ${esc(v)}</td></tr>`;break}
      if(!D[v].includes(c)){rows+=`<tr><td>${esc(v)}=${esc(c)}</td><td colspan="${vars.length}">❌ ${esc(c)} is not in D(${esc(v)}) = {${D[v].join(', ')}}: inconsistent</td></tr>`;break}
      asg[v]=c;D[v]=[c];const emptied=[];adj[v].forEach(n=>{if(asg[n]===undefined){D[n]=D[n].filter(x=>x!==c);if(!D[n].length)emptied.push(n)}});
      rows+=`<tr><td><b>${esc(v)} = ${esc(c)}</b></td>${vars.map(n=>`<td style="${asg[n]!==undefined?'font-style:italic;color:var(--muted)':''}${!D[n].length?';background:#fee2e2;font-weight:800':''}">${D[n].length?D[n].join(''):'∅'}</td>`).join('')}</tr>`;
      if(emptied.length)fail=`Assigning ${v} = ${c} empties D(${emptied.join('), D(')}) → forward checking detects failure → <b>backtrack</b> (try another value for ${v}, or undo the previous assignment if none is left).`}
    const ac=[];if(!fail){vars.forEach(a=>adj[a].forEach(b=>{if(asg[a]===undefined&&asg[b]===undefined&&D[a].length===1&&D[b].length===1&&D[a][0]===D[b][0])ac.push(`${a}–${b}`)}))}
    $('#co').innerHTML=`<div class="tblwrap"><table><tr><th>After</th>${vars.map(v=>`<th>D(${esc(v)})</th>`).join('')}</tr>${rows}</table></div>
     ${fail?`<div class="note warn">${fail}</div>`:'<div class="note good">No empty domain so far.</div>'}${ac.length?`<div class="note">⚠️ Hidden dead end: unassigned neighbours ${[...new Set(ac)].join(', ')} share a single value. Forward checking cannot see this; <b>arc consistency (AC-3)</b> would detect it now.</div>`:''}`};
  $('#au').onclick=()=>{$('#ed').value='WA NT\nWA SA\nNT SA\nNT Q\nSA Q\nSA NSW\nSA V\nQ NSW\nNSW V\nT T';$('#cl').value='R G B';$('#as').value='SA=B, NT=R, Q=G';run()};
  $('#lx').onclick=()=>{$('#ed').value='1 2\n1 3\n1 4\n2 4\n3 4\n4 5\n5 6\n5 7\n6 7\n6 8\n7 8\n2 6\n3 7';$('#cl').value='R C B';$('#as').value='1=R, 4=C, 5=R, 8=C, 6=B';run()};
  $$('textarea,input',L).forEach(x=>x.oninput=run);run();
}

/* ---------- counting ---------- */
function count(L){
  L.innerHTML=`<div class="card"><h2>Search-space size & combinatorial explosion</h2><div class="row"><label>n (words / cities / customers) <input type="number" id="n" value="15" style="width:90px"></label><label>Solutions checked per second <input type="number" id="r" value="1000000" style="width:140px"></label></div><div id="o" style="margin-top:8px"></div></div>`;
  const fact=n=>{let r=1n;for(let i=2n;i<=BigInt(n);i++)r*=i;return r};
  const run=()=>{const n=+$('#n').value,r=+$('#r').value;const a=fact(n),b=fact(Math.max(0,n-1));const secs=Number(b)/r;
    $('#o').innerHTML=`<ol class="steps"><li>Orderings of n unique items (word-ordering problem): n! = <b>${a.toLocaleString()}</b></li><li>Round trips with a fixed start (lecture: (n − 1)!): (${n} − 1)! = <b>${b.toLocaleString()}</b></li><li>Time to check all at ${r.toLocaleString()}/s = ${f(secs,2)} s = <b>${f(secs/3600,2)} hours</b> (${f(secs/86400,2)} days)</li></ol><p class="muted">Lecture: 14! ≈ 8.7178 × 10¹⁰ routes → 88,000 s ≈ 24.4 h. This is why we use heuristics and metaheuristics.</p>`};
  $$('input',L).forEach(x=>x.oninput=run);run();
}
})();
