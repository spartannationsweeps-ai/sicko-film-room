(function(){
const D=window.FFDATA||{meta:{shows:[],counts:{}},episodes:[],players:[],hosts:[],disagreements:[],predictions:[],leaderboard:[],board:{},myteams:[]};
const SH=Object.fromEntries((D.meta.shows||[]).map(s=>[s.id,s]));
const $=s=>document.querySelector(s), app=$('#app');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const showTag=id=>{const s=SH[id]||{name:id,color:'#888'};return `<span class="show" style="background:${s.color};color:#fff">${esc(s.name)}</span>`};
const sent=v=>v==null?'<span class="sent z">–</span>':v>0.15?`<span class="sent p">▲${v===1?'':' '+(+v).toFixed(2)}</span>`:v<-0.15?`<span class="sent n">▼${v===-1?'':' '+(+v).toFixed(2)}</span>`:`<span class="sent z">●</span>`;
const md=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\*(.+?)\*/g,'<i>$1</i>');
const sc=v=>v>0.15?'p':v<-0.15?'n':'z';
const WAIT=(what)=>`<div class="empty"><div class="big">⏳</div><b>Waiting for first episode</b>${what?esc(what):'Nothing has been broken down yet. This fills in automatically after the first report runs.'}</div>`;

const pageHead=(title,sub,actions)=>{const act=actions?`<div class="ph-actions">${actions}</div>`:'';return `<div class="page-head"><div class="ph-text"><div class="ph-kicker">Sicko Film Room</div><h2>${title}</h2>${sub?`<div class="ph-sub">${sub}</div>`:''}</div>${act}</div>`};
const sectionCard=(title,body,opts)=>{opts=opts||{};const link=opts.jump?`<button type="button" class="section-link" data-jump="${opts.jump}">${esc(opts.linkLabel||'Open →')}</button>`:'';const flush=opts.flush?' flush':'';return `<div class="scard"><div class="scard-head"><h3>${title}</h3>${link}${opts.meta?`<span class="muted">${opts.meta}</span>`:''}</div><div class="scard-body${flush}">${body}</div></div>`};
const kpiRow=(items)=>`<div class="kpis">${items.map(([b,s,cls])=>`<div class="kpi"><b class="${cls||''}">${b}</b><span>${s}</span></div>`).join('')}</div>`;
const AREA_LABEL={home:'Home',leagues:'My Leagues',film:'Shows',accuracy:'Host Accuracy'};
const charts=[];function chart(el,cfg){charts.push(new Chart(el,cfg))}
if(window.Chart){Chart.defaults.color='#8b93a7';Chart.defaults.borderColor='#2a2f3d';Chart.defaults.font.family='"IBM Plex Sans",system-ui,sans-serif'}
$('#builtAt').textContent=`Updated ${D.meta.built||'—'} ${D.meta.tz||''}`;
const C=D.meta.counts||{};$('#counts').innerHTML=[['eps',C.episodes],['players',C.players],['takes',C.takes]].map(([k,v])=>`<span class="pill"><b>${v||0}</b> ${k}</span>`).join('');

function renderScoreBug(){
 const el=$('#scoreBug'); if(!el) return;
 const TM=D.myteams||[];
 const liveWk=((D.league&&D.league.leagues)||[]).map(l=>l.live_week).find(Boolean);
 const SNF=new Set(['Patrick Mahomes','Xavier Worthy','Travis Kelce','Kenneth Walker III','Rashid Shaheed','Jaxon Smith-Njigba']);
 const MNF=new Set(['Saquon Barkley','CeeDee Lamb']);
 const cards=[];
 for(const t of TM){
  const m=t.matchup; if(!m||m.me==null) continue;
  const me=+m.me, opp=m.opp==null?null:+m.opp;
  const ahead=opp==null?null:me>=opp;
  const sp=m.starters_points||{};
  const oppZero=(m.opp_starters||[]).filter(p=>!(+p.pts)).map(p=>p.name);
  const myZero=Object.entries(sp).filter(([,v])=>!(+v)).map(([n])=>n);
  const left=[...myZero,...oppZero];
  const hasSNF=left.some(n=>SNF.has(n));
  const hasMNF=left.some(n=>MNF.has(n));
  const weekLive=liveWk && m.week===liveWk;
  let chip='FINAL', cls='final';
  if(weekLive || left.length){
   if(hasMNF && !hasSNF && left.every(n=>MNF.has(n) || !(SNF.has(n)))){chip='MNF';cls='mnf'}
   else if(hasSNF){chip='SNF';cls='snf'}
   else {chip='LIVE';cls='live'}
  }
  const gap=opp==null?'':(me-opp);
  const gapTxt=opp==null?'':(gap>=0?`+${gap.toFixed(1)}`:`${gap.toFixed(1)}`);
  const shortOpp=(m.opp_team||'Opp').replace('Flowers for Ms. Jackson','Freddy').replace("Sloppy 2nd's","BakedShady");
  const shortMe=(t.team||'').replace('Taylor Snift','Snift').replace('Amon A Boat!','Boat');
  cards.push(`<div class="sb-card ${ahead===false?'behind':ahead?'ahead':''}" title="Week ${m.week} · ${esc(t.team)} vs ${esc(m.opp_team||'')}">
   <div class="sb-left"><div class="sb-lg">${esc(t.label)} · Wk ${m.week}</div>
   <div class="sb-teams">${esc(shortMe)} <span class="muted">vs</span> ${esc(shortOpp)} ${gapTxt?`<span class="muted small">(${gapTxt})</span>`:''}</div></div>
   <div class="sb-score"><span class="${ahead===false?'bear':'bull'}">${me.toFixed(1)}</span><span class="sep">–</span><span class="${ahead===false?'bull':'bear'}">${opp==null?'—':opp.toFixed(1)}</span></div>
   <span class="sb-chip ${cls}">${chip}</span></div>`);
 }
 if(!cards.length){el.hidden=true;el.innerHTML='';return}
 el.hidden=false; el.innerHTML=cards.join('');
}
renderScoreBug();


function sortable(tbl,rows,cols,render){let key=null,asc=false;const th=tbl.querySelectorAll('th');
 th.forEach((h,i)=>h.onclick=()=>{const k=cols[i];if(!k)return;asc=key===k?!asc:false;key=k;th.forEach(x=>x.classList.remove('s','asc'));h.classList.add('s');if(asc)h.classList.add('asc');
 rows.sort((a,b)=>{const x=k(a),y=k(b);return (x>y?1:x<y?-1:0)*(asc?1:-1)});render()})}

const T={};

const GROUP_OF={home:'home',teams:'leagues',matchup:'leagues',league:'leagues',trends:'leagues',value:'leagues',bench:'leagues',shame:'leagues',grades:'leagues',feed:'film',wraps:'film',players:'film',hosts:'film',debates:'film',board:'film',accuracy:'accuracy',preds:'accuracy'};
let activeGroup='home';
function setGroup(g, keepTab){
 activeGroup=g;
 document.querySelectorAll('#groups [data-group]').forEach(b=>b.classList.toggle('on',b.dataset.group===g));
 document.querySelectorAll('#bottomNav [data-group]').forEach(b=>b.classList.toggle('on',b.dataset.group===g));
 document.querySelectorAll('#tabs [data-tab]').forEach(b=>{
  const show=b.dataset.group===g; b.hidden=!show;
 });
 const al=$('#areaLabel'); if(al) al.textContent=AREA_LABEL[g]||g;
 document.body.classList.remove('nav-open');
 const scrim=$('#scrim'); if(scrim) scrim.hidden=true;
}
function jumpTo(tab, opts){
 opts=opts||{};
 if(opts.playerQ!=null){T._playerQ=opts.playerQ}
 if(opts.wrapSection!=null){T._ai=opts.wrapSection}
 go(tab);
}

T.home=()=>{
 const TM=D.myteams||[], A=D.accuracy, LG=(D.league&&D.league.leagues)||[];
 const latest=(D.episodes||[])[0];
 const arch=(D.archive&&D.archive.sections)||[];
 const hostWrap=arch.find(s=>s.key==='hostwrap');
 const latestWrap=hostWrap&&hostWrap.items&&hostWrap.items[0];
 const t=A&&A.totals; const C=D.meta.counts||{};
 const withWk=TM.filter(x=>(x.weekly||[]).length);
 const V=D.league&&D.league.dynasty;
 const weekCounts={};
 (D.predictions||[]).forEach(p=>{const w=String(p.week||'').trim(); if(/^\d+$/.test(w)) weekCounts[w]=(weekCounts[w]||0)+1});
 const wks=Object.keys(weekCounts).map(Number).sort((a,b)=>a-b);

 let h=pageHead('Command center','At-a-glance for Poncho — every number still lives in its full tab.',
  `<button type="button" class="qj" data-jump="matchup">This Week</button><button type="button" class="qj" data-jump="accuracy">Host Accuracy</button><button type="button" class="qj" data-jump="wraps">Mag</button>`);

 h+=`<div class="home-dash">`;
 h+=`<div class="home-kpis">
  <div class="home-kpi"><b>${t&&t.pct!=null?t.pct+'%':'—'}</b><span>Host hit rate</span></div>
  <div class="home-kpi"><b class="bull">${t?t.hit||0:'—'}</b><span>Hits</span></div>
  <div class="home-kpi"><b class="bear">${t?t.miss||0:'—'}</b><span>Misses</span></div>
  <div class="home-kpi"><b>${C.takes||0}</b><span>Takes logged</span></div>
 </div>`;

 h+=`<div class="league-grid">${TM.map((x,i)=>{
   const m=x.matchup; const me=m&&m.me!=null?(+m.me).toFixed(1):null; const opp=m&&m.opp!=null?(+m.opp).toFixed(1):null;
   const ahead=me!=null&&opp!=null?(+me>=+opp):null;
   return `<button type="button" class="lg-card" data-team="${i}">
    <div class="lg-top"><div><div class="lg-label">${esc(x.label)}</div><div class="lg-team">${esc(x.team)}</div><div class="lg-meta">${x.record?esc(x.record):'—'} · rank ${x.rank||'—'}/${x.n_teams||'—'}</div></div>
    <div class="lg-score ${ahead===false?'bear':ahead?'bull':''}">${me!=null?`${me}${opp!=null?'–'+opp:''}`:'—'}</div></div>
   </button>`;
 }).join('')||'<div class="empty"><b>No leagues loaded</b></div>'}</div>`;

 h+=`<div class="home-modules">
  <div class="scard"><div class="scard-head"><h3>Jump</h3><span class="muted small">Shortcuts</span></div><div class="scard-body">
   <div class="quickjumps">
    <button type="button" class="qj" data-jump="teams">🛡️ My Teams</button>
    <button type="button" class="qj" data-jump="matchup">🆚 This Week</button>
    <button type="button" class="qj" data-jump="league">🏟️ League Hub</button>
    <button type="button" class="qj" data-jump="wraps">🗞️ Mag &amp; Archives</button>
    <button type="button" class="qj" data-jump="accuracy">🏹 Host Accuracy</button>
    <button type="button" class="qj" data-jump="players">📊 Players</button>
    <button type="button" class="qj" data-jump="feed">📺 Episode Feed</button>
    <button type="button" class="qj" data-jump="value">💎 Dynasty Value</button>
    <button type="button" class="qj" data-jump="bench">🪑 Bench Left</button>
    <button type="button" class="qj" data-jump="shame">🤡 Hall of Shame</button>
    <button type="button" class="qj" data-jump="preds">🎯 Predictions</button>
   </div>
   ${latest?`<div class="small" style="margin-top:10px">🔥 Latest breakdown: ${showTag(latest.show)} <b>${esc(latest.title)}</b> <span class="muted">${esc(latest.date)}</span></div>`:''}
   ${latestWrap?`<div class="small muted" style="margin-top:4px">🗞️ Latest host wrap: ${esc(latestWrap.title)} · ${esc(latestWrap.date)}</div>`:''}
  </div></div>
  <div class="scard"><div class="scard-head"><h3>Host accuracy</h3><button type="button" class="section-link" data-jump="accuracy">Full board →</button></div><div class="scard-body">
   ${A&&(A.hosts||[]).length?`<div class="chartbox"><canvas id="hAcc"></canvas></div>`:`<div class="empty"><b>No graded calls yet</b>The Tuesday report card fills this in.</div>`}
  </div></div>
 </div>`;

 if(A&&(A.hosts||[]).length){
  h+=sectionCard('Hits vs misses',`<div class="chartbox"><canvas id="hHitMiss"></canvas></div>`,{jump:'accuracy',linkLabel:'Leaderboard →'});
 }

 h+=sectionCard('Points for · your teams', withWk.length?`<div class="chartbox tall"><canvas id="hPF" style="max-height:none"></canvas></div><div class="muted small">Sleeper weekly PF. Yahoo snapshots without weekly history are omitted from the line chart.</div>`:`<div class="empty"><b>No weekly PF series yet</b>Sleeper weeks fill this in after games finalize.</div>`,{jump:'teams',linkLabel:'My Teams →'});

 if(LG.some(l=>(l.bench||[]).length)){
  h+=sectionCard('Bench points left',`<div class="grid two">${LG.map((L,i)=>`<div><div class="muted small" style="margin-bottom:6px">${esc(L.label)}</div><div class="chartbox" style="min-height:220px"><canvas id="hBench${i}" style="max-height:none"></canvas></div></div>`).join('')}</div>`,{jump:'bench',linkLabel:'Bench tab →'});
 } else {
  h+=sectionCard('Bench points left',`<div class="empty"><b>No bench efficiency data</b></div>`,{jump:'bench'});
 }

 if(LG.length){
  h+=sectionCard('Position scoring (starters)',`<div class="toolbar"><select id="hPosLg">${LG.map((L,i)=>`<option value="${i}">${esc(L.label)}</option>`).join('')}</select></div><div class="chartbox tall"><canvas id="hPos" style="max-height:none"></canvas></div>`,{jump:'league',linkLabel:'League hub →'});
 }

 h+=sectionCard('Most-discussed players', (D.players||[]).length?`<div class="chartbox tall"><canvas id="hMent" style="max-height:none"></canvas></div>`:WAIT(),{jump:'players',linkLabel:'Players →'});

 h+=sectionCard('Dynasty value · top assets', V&&V.players&&V.players.length?`<div class="muted small" style="margin-bottom:6px">${esc(V.team)} · FantasyCalc</div><div class="chartbox tall"><canvas id="hDyn" style="max-height:none"></canvas></div>`:`<div class="empty"><b>Dynasty values unavailable</b>${esc((V&&V.error)||'')}</div>`,{jump:'value',linkLabel:'Value board →'});

 h+=sectionCard('Predictions logged by week', wks.length?`<div class="chartbox"><canvas id="hPredWk"></canvas></div><div class="muted small">Counts only rows with a single numeric week field.</div>`:`<div class="empty"><b>No single-week prediction counts yet</b>Open Preds for the full log.</div>`,{jump:'preds',linkLabel:'Preds →'});

 h+=`</div>`;
 app.innerHTML=h;
 app.querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>jumpTo(b.dataset.jump));
 app.querySelectorAll('[data-team]').forEach(b=>b.onclick=()=>{teamSel=+b.dataset.team;jumpTo('teams')});

 if(A&&(A.hosts||[]).length){
  const G=(A.hosts||[]).filter(r=>r.graded&&r.pct!=null).slice(0,12);
  if(G.length&&$('#hAcc')) chart($('#hAcc'),{type:'bar',data:{labels:G.map(r=>r.host),datasets:[{label:'Hit rate %',data:G.map(r=>r.pct),backgroundColor:'#f0c14b'}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,scales:{x:{min:0,max:100}},plugins:{legend:{display:false}}}});
  if(G.length&&$('#hHitMiss')) chart($('#hHitMiss'),{type:'bar',data:{labels:G.map(r=>r.host),datasets:[{label:'Hits',data:G.map(r=>r.hits),backgroundColor:'#3dd68c'},{label:'Misses',data:G.map(r=>r.misses),backgroundColor:'#ff6b7a'}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,scales:{x:{stacked:true},y:{stacked:true}},plugins:{legend:{position:'bottom'}}}});
 }
 if(withWk.length&&$('#hPF')){
  const colors=['#5b8cff','#1f8fff','#f0c14b','#a855f7','#ff8a00'];
  const allWeeks=[...new Set(withWk.flatMap(t=>t.weekly.map(w=>w.week)))].sort((a,b)=>a-b);
  chart($('#hPF'),{type:'line',data:{labels:allWeeks.map(w=>'Wk '+w),datasets:withWk.map((t,i)=>({label:t.team||t.label,data:allWeeks.map(w=>{const row=(t.weekly||[]).find(x=>x.week===w);return row?row.pts:null}),borderColor:colors[i%colors.length],backgroundColor:colors[i%colors.length]+'33',tension:.3,spanGaps:true}))},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom'}}}});
 }
 LG.forEach((L,i)=>{
  const B=L.bench||[]; const el=$('#hBench'+i); if(!el||!B.length) return;
  chart(el,{type:'bar',data:{labels:B.map(b=>b.team+(b.me?' (YOU)':b.freddy?' (FREDDY)':'')),datasets:[{label:'Bench left',data:B.map(b=>b.bench_left),backgroundColor:B.map(b=>b.me?'#f0c14b':b.freddy?'#ff6fb5':'#3a4558')}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,scales:{y:{ticks:{autoSkip:false,font:{size:10}}}},plugins:{legend:{display:false}}}});
 });
 const drawPos=()=>{
  const el=$('#hPos'); if(!el) return;
  const sel=$('#hPosLg'); const L=LG[sel?+sel.value:0]; if(!L) return;
  const S=L.standings||[]; const P=['QB','RB','WR','TE','K','DEF'].filter(p=>S.some(s=>s.pos_pts&&s.pos_pts[p]));
  const col={QB:'#ff6b7a',RB:'#3dd68c',WR:'#5b8cff',TE:'#f0c14b',K:'#a855f7',DEF:'#8b93a7'};
  const prev=charts.find(c=>c.canvas&&c.canvas.id==='hPos');
  if(prev){const i=charts.indexOf(prev);prev.destroy();if(i>=0)charts.splice(i,1)}
  chart(el,{type:'bar',data:{labels:S.map(s=>s.team+(s.me?' (YOU)':s.freddy?' (FREDDY)':'')),datasets:P.map(p=>({label:p,data:S.map(s=>(s.pos_pts&&s.pos_pts[p])||0),backgroundColor:col[p]}))},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,scales:{x:{stacked:true},y:{stacked:true,ticks:{autoSkip:false,font:{size:10}}}},plugins:{legend:{position:'bottom'}}}});
 };
 if(LG.length){drawPos(); const sel=$('#hPosLg'); if(sel) sel.onchange=drawPos}
 if((D.players||[]).length&&$('#hMent')){
  const top=D.players.slice().sort((a,b)=>(b.caption_mentions||0)-(a.caption_mentions||0)||b.n_takes-a.n_takes).slice(0,12);
  chart($('#hMent'),{type:'bar',data:{labels:top.map(p=>p.name),datasets:[{label:'Bull',data:top.map(p=>p.bull),backgroundColor:'#3dd68c'},{label:'Neutral',data:top.map(p=>p.neutral),backgroundColor:'#6e7689'},{label:'Bear',data:top.map(p=>p.bear),backgroundColor:'#ff6b7a'}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,scales:{x:{stacked:true},y:{stacked:true,ticks:{autoSkip:false,font:{size:11}}}},plugins:{legend:{position:'bottom'}}}});
 }
 if(V&&V.players&&V.players.length&&$('#hDyn')){
  const top=V.players.slice(0,12);
  chart($('#hDyn'),{type:'bar',data:{labels:top.map(p=>p.name),datasets:[{label:'FantasyCalc value',data:top.map(p=>p.value||0),backgroundColor:'#a855f7'}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}}}});
 }
 if(wks.length&&$('#hPredWk')){
  chart($('#hPredWk'),{type:'bar',data:{labels:wks.map(w=>'Wk '+w),datasets:[{label:'Predictions',data:wks.map(w=>weekCounts[w]),backgroundColor:'#5b8cff'}]},options:{plugins:{legend:{display:false}},scales:{y:{ticks:{precision:0}}}}});
 }
};

T.feed=()=>{let h=pageHead('Episode Feed','Every show breakdown ingested into the film room.');
 const ageH=e=>e.date?(Date.now()-new Date(e.date+'T12:00:00').getTime())/36e5:1e9;
 const NEW=e=>ageH(e)<36?'<span class="chip" style="background:#ff5c6c;color:#fff;font-weight:700">🆕 NEW</span> ':'';
 const latest=D.episodes.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''))[0];
 if(latest){h+=`<div class="card" style="border:2px solid ${(SH[latest.show]||{}).color||'#888'}"><div class="muted small">🔥 Latest breakdown</div><div class="ep">${latest.thumb?`<img loading="lazy" src="${esc(latest.thumb)}" alt="">`:''}<div><div class="t">${NEW(latest)}${showTag(latest.show)} <a href="javascript:void(0)" onclick="document.getElementById('ep-${esc(latest.id||'')}').scrollIntoView({behavior:'smooth'})">${esc(latest.title)}</a></div><div class="muted small">${esc(latest.date)} · ${latest.n_players} players · ${latest.n_takes} takes · ${esc((latest.hosts||[]).join(', '))}</div></div></div></div>`}
 for(const s of D.meta.shows){const eps=D.episodes.filter(e=>e.show===s.id);
  h+=`<h2><span style="color:${s.color}">●</span> ${esc(s.name)}</h2>`;
  if(!eps.length){h+=WAIT(`No ${s.name} episodes processed yet.`);continue}
  for(const e of eps.slice(0,6)){
   const dur=e.duration_s?`${Math.floor(e.duration_s/60)}m`:'';
   h+=`<div class="card" id="ep-${esc(e.id||'')}"><div class="ep">${e.thumb?`<img loading="lazy" src="${esc(e.thumb)}" alt="">`:''}<div><div class="t">${NEW(e)}${e.url?`<a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.title)}</a>`:esc(e.title)}</div>
   <div class="muted small">${esc(e.date)} ${dur?'· '+dur:''} · ${e.n_players} players · ${e.n_takes} takes ${e.hosts.length?'· '+esc(e.hosts.join(', ')):''}</div></div></div>
   ${e.summary?`<p style="white-space:pre-wrap">${md(e.summary)}</p>`:''}
   ${(e.takeaways||[]).length?`<details open><summary>Actionable takeaways</summary><ol class="small">${e.takeaways.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></details>`:''}
   ${e.segments.length?`<details><summary>Segments (${e.segments.length})</summary>${e.segments.map(g=>`<div class="small"><span class="mono">${esc(g.ts)}</span> ${esc(g.title)}</div>`).join('')}</details>`:''}
   ${e.takes.length?`<details><summary>Every take (${e.takes.length})</summary>${e.takes.map(t=>`<div class="take ${sc(t.sent)}"><b>${esc(t.player)}</b> ${sent(t.sent)} <span class="muted">${esc(t.host)} ${t.ts?'@'+esc(t.ts):''}</span><div class="small"><b>${esc(t.take)}</b>${t.detail?' — '+esc(t.detail):''}</div>${(t.stats||[]).length?`<div class="chips">${t.stats.map(x=>`<span class="chip">${esc(x)}</span>`).join('')}</div>`:''}</div>`).join('')}</details>`:''}
   </div>`}}
 app.innerHTML=h};

T.players=()=>{const P=D.players;
 if(!P.length){app.innerHTML=pageHead('Players','Most-discussed across shows.')+WAIT();return}
 const hostNames=[...new Set(P.flatMap(p=>Object.keys(p.hosts)))];
 app.innerHTML=pageHead('Players','Most-discussed · take sentiment across every show.')+`<div class="scard"><div class="scard-head"><h3>Mention chart</h3></div><div class="scard-body"><div id="cMentBox" style="position:relative"><canvas id="cMent" style="max-height:none"></canvas></div></div></div>
 <div class="section-head"><h3>Master player table</h3></div><div class="toolbar"><input id="q" placeholder="Search player / team / stat…">
 <select id="fs"><option value="">All shows</option>${D.meta.shows.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select>
 <select id="fp"><option value="">All pos</option>${['QB','RB','WR','TE','K','DEF'].map(x=>`<option>${x}</option>`).join('')}</select>
 <select id="fh"><option value="">All hosts</option>${hostNames.map(h=>`<option>${esc(h)}</option>`).join('')}</select>
 <select id="fm"><option value="">All players</option><option value="mine">On my teams</option></select></div>
 <div class="scard"><div class="scard-body flush"><div class="tblwrap"><table id="pt"><thead><tr><th>Player</th><th>Pos</th><th>Men.</th><th>🎧 Said</th><th>Net</th><th>Bull/Bear</th><th>Host sentiment</th><th>Shows</th><th>Stats cited</th><th>Last</th></tr></thead><tbody></tbody></table></div></div></div>`;
 const top=P.slice().sort((a,b)=>(b.caption_mentions||0)-(a.caption_mentions||0)||b.n_takes-a.n_takes).slice(0,15);
 $('#cMentBox').style.height=Math.max(200,top.length*24+60)+'px';chart($('#cMent'),{type:'bar',data:{labels:top.map(p=>p.name),datasets:[{label:'Bull',data:top.map(p=>p.bull),backgroundColor:'#2ee59d'},{label:'Neutral',data:top.map(p=>p.neutral),backgroundColor:'#6e7689'},{label:'Bear',data:top.map(p=>p.bear),backgroundColor:'#ff5c6c'}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,scales:{x:{stacked:true,ticks:{precision:0}},y:{stacked:true,ticks:{autoSkip:false,font:{size:11}}}},plugins:{legend:{position:'bottom'}}}});
 
 const rows=P.slice();const tb=$('#pt tbody');
 const render=()=>{const q=$('#q').value.toLowerCase(),fs=$('#fs').value,fp=$('#fp').value,fh=$('#fh').value,fm=$('#fm').value;
  tb.innerHTML=rows.filter(p=>(!q||(p.name+' '+p.team+' '+p.stats.join(' ')).toLowerCase().includes(q))&&(!fs||p.shows[fs])&&(!fp||p.pos===fp)&&(!fh||p.hosts[fh])&&(!fm||(p.my_teams||[]).length)).map(p=>`<tr>
  <td><b>${esc(p.name)}</b> ${(p.my_teams||[]).map(t=>`<span class="chip" style="color:var(--gold)">${esc(t)}</span>`).join('')}<div class="muted small">${esc(p.team)}</div></td><td>${esc(p.pos)}</td><td>${p.mentions}${p.n_takes>p.mentions?`<div class="muted small">${p.n_takes} takes</div>`:''}</td><td>${p.caption_mentions??'<span class="muted">–</span>'}</td><td>${sent(p.score)}</td>
  <td><div class="bar" style="width:70px"><i style="width:${100*p.bull/p.mentions}%;background:var(--bull)"></i><i style="width:${100*p.neutral/p.mentions}%;background:#56645d"></i><i style="width:${100*p.bear/p.mentions}%;background:var(--bear)"></i></div><span class="small">${p.bull}/${p.bear}</span></td>
  <td>${Object.entries(p.hosts).map(([h,v])=>`<div class="small">${sent(v.avg)} ${esc(h)} <span class="muted">×${v.n}</span></div>`).join('')}</td>
  <td>${Object.keys(p.shows).map(showTag).join(' ')}</td>
  <td><div class="chips">${p.stats.slice(0,8).map(x=>`<span class="chip">${esc(x)}</span>`).join('')}${p.stats.length>8?`<span class="chip">+${p.stats.length-8}</span>`:''}</div></td><td class="small">${esc(p.last)}</td></tr>`).join('')||`<tr><td colspan="10" class="muted">No matches.</td></tr>`};
 ['q','fs','fp','fh','fm'].forEach(i=>$('#'+i).oninput=render);
 sortable($('#pt'),rows,[p=>p.name,p=>p.pos,p=>p.mentions,p=>p.caption_mentions||0,p=>p.score,p=>p.bull-p.bear,null,p=>Object.keys(p.shows).length,p=>p.stats.length,p=>p.last],render);
 if(T._playerQ){$('#q').value=T._playerQ;T._playerQ=null}render()};

T.hosts=()=>{const H=D.hosts;
 if(!H.length){app.innerHTML=pageHead('Hosts','Profiles and take lean.')+WAIT();return}
 let h=pageHead('Hosts','Bullish vs bearish meter and profiles.')+`<div class="scard"><div class="scard-head"><h3>Sentiment meter</h3></div><div class="scard-body"><canvas id="cHost"></canvas></div></div><div class="section-head"><h3>Host profiles</h3></div><div class="grid two">`;
 for(const x of H){const pr=x.profiles[0];
  h+=`<div class="card"><h3>🎙️ ${esc(x.name)}</h3><div class="muted small">${Object.keys(x.shows).map(showTag).join(' ')} · ${x.episodes} eps · ${x.n_takes} takes ${x.bull_pct!=null?'· '+x.bull_pct+'% bullish':''}</div>
  <div class="grid two" style="margin-top:8px"><div><div class="small bull"><b>Most bullish on</b></div>${x.most_bullish.map(p=>`<div class="small">▲ ${esc(p.player)} <span class="muted">(${p.score})</span></div>`).join('')||'<div class="muted small">—</div>'}</div>
  <div><div class="small bear"><b>Most bearish on</b></div>${x.most_bearish.map(p=>`<div class="small">▼ ${esc(p.player)} <span class="muted">(${p.score})</span></div>`).join('')||'<div class="muted small">—</div>'}</div></div>
  ${pr?`<details open><summary>Latest profile · ${esc(pr.date)}</summary>${Object.entries(pr.fields||{}).map(([k,v])=>`<div class="small"><b style="text-transform:capitalize">${esc(k)}:</b> ${esc(v.join(' · '))}</div>`).join('')||`<div class="small" style="white-space:pre-wrap">${esc(pr.text)}</div>`}</details>`:''}
  ${x.profiles.length>1?`<details><summary>Profile history (${x.profiles.length})</summary>${x.profiles.slice(1).map(p=>`<div class="small"><b>${esc(p.date)}</b> ${esc(p.title)}<div style="white-space:pre-wrap" class="muted">${esc(p.text)}</div></div>`).join('')}</details>`:''}</div>`}
 app.innerHTML=h+'</div>';
 const hs=H.filter(x=>x.n_takes);
 if(hs.length)chart($('#cHost'),{type:'bar',data:{labels:hs.map(x=>x.name),datasets:[{label:'Bullish',data:hs.map(x=>x.bull),backgroundColor:'#2ee59d'},{label:'Neutral',data:hs.map(x=>x.neutral),backgroundColor:'#6e7689'},{label:'Bearish',data:hs.map(x=>-x.bear),backgroundColor:'#ff5c6c'}]},options:{responsive:true,scales:{x:{stacked:true},y:{stacked:true}},plugins:{legend:{position:'bottom'}}}});
 else $('#cHost').parentNode.innerHTML='<div class="muted small">No attributed takes yet.</div>'};

T.debates=()=>{const X=D.disagreements;
 if(!X.length){app.innerHTML=pageHead('Host Debates','Where hosts disagree.')+WAIT('No host-vs-host disagreements logged yet.');return}
 app.innerHTML=pageHead('Host Debates','Host vs host splits from the shows.')+X.map(d=>{const head=`<div class="muted small">${showTag(d.show)} ${esc(d.date)} · ${esc(d.title)}</div>`;
  if(d.source==='computed')return `<div class="card">${head}<h3>${esc(d.player)}</h3><div class="vs"><div>${d.bull.map(t=>`<div class="take p"><b class="bull">▲ ${esc(t.host)}</b><div class="small">${esc(t.take)}</div></div>`).join('')}</div><div class="mid">VS</div><div>${d.bear.map(t=>`<div class="take n"><b class="bear">▼ ${esc(t.host)}</b><div class="small">${esc(t.take)}</div></div>`).join('')}</div></div></div>`;
  return `<div class="card">${head}${Object.entries(d.detail).map(([k,v])=>k==='text'?`<div>${esc(v)}</div>`:`<div class="small"><b>${esc(k)}:</b> ${esc(v)}</div>`).join('')}</div>`}).join('')};

T.preds=()=>{const L=D.leaderboard,P=D.predictions;let h=pageHead('Predictions','Logged calls graded vs results.')+'<div class="section-head"><h3>Accuracy leaderboard</h3></div>';
 if(!L.length)h+=WAIT('No graded predictions yet. The Tuesday report card fills this in.');
 else h+=(L.some(r=>r.pct!=null)?`<div class="card"><canvas id="cLb"></canvas></div>`:`<div class="empty"><div class="big">⏳</div><b>No predictions graded yet</b>All logged calls are still pending. The Tuesday report card grades them.</div>`)+`<div class="tblwrap"><table><thead><tr><th>#</th><th>Host</th><th>Show</th><th>Hit</th><th>Miss</th><th>Push</th><th>Pend.</th><th>Acc.</th></tr></thead><tbody>${L.map((r,i)=>`<tr><td>${i===0&&r.pct!=null?'🏆':i+1}</td><td><b>${esc(r.host)}</b></td><td class="small">${esc(SH[r.show]?.name||r.show)}</td><td class="bull">${r.hits}</td><td class="bear">${r.misses}</td><td>${r.push||0}</td><td>${r.pending||0}</td><td><b>${r.pct==null?'—':r.pct+'%'}</b></td></tr>`).join('')}</tbody></table></div>`;
 h+='<div class="section-head"><h3>Predictions log</h3></div>';
 if(!P.length)h+=WAIT('No predictions logged yet.');
 else{h+=`<div class="toolbar"><input id="pq" placeholder="Filter predictions…"><select id="pst"><option value="">All</option><option>pending</option><option>hit</option><option>miss</option><option>push</option><option>void</option></select></div><div class="scard"><div class="scard-body flush"><div class="tblwrap"><table><thead><tr><th>Date</th><th>Host</th><th>Prediction</th><th>Status</th></tr></thead><tbody id="pb"></tbody></table></div></div></div>`}
 app.innerHTML=h;
 if(L.some(r=>r.pct!=null)){const l=L.filter(r=>r.pct!=null);chart($('#cLb'),{type:'bar',data:{labels:l.map(r=>r.host),datasets:[{label:'Accuracy %',data:l.map(r=>r.pct),backgroundColor:'#ffc83d'}]},options:{scales:{y:{min:0,max:100}},plugins:{legend:{display:false}}}})}
 if(P.length){const icon={hit:'✅',miss:'❌',push:'🟡',pending:'⏳',void:'⚪'};const r=()=>{const q=$('#pq').value.toLowerCase(),s=$('#pst').value;
  $('#pb').innerHTML=P.filter(p=>(!s||p.status===s)&&(!q||JSON.stringify(p).toLowerCase().includes(q))).map(p=>`<tr><td class="small">${esc(p.date)}${p.week?'<br>Wk '+esc(p.week):''}</td><td>${esc(p.host)}<div>${showTag(p.show)}</div></td><td>${p.player?`<b>${esc(p.player)}</b>: `:''}${esc(p.prediction)}${p.conf?` <span class="muted small">(conf ${esc(p.conf)})</span>`:''}</td><td>${icon[p.status]} ${esc(p.result||p.status)}</td></tr>`).join('')};
  $('#pq').oninput=$('#pst').onchange=r;r()}};

T.accuracy=()=>{const A=D.accuracy;if(!A||!(A.hosts||[]).length){app.innerHTML=pageHead('Host Accuracy','Season leaderboard.')+'<div class="empty"><div class="big">🏹</div><b>No graded calls yet</b>The Tuesday report card fills this in.</div>';return}
 const pc=v=>v==null?'—':v+'%',ic={hit:'✅',miss:'❌',push:'➖',void:'⚪'},cell=v=>v&&(v.hit+v.miss+v.push)?`${pc(v.pct)} <span class="muted small">${v.hit}-${v.miss}-${v.push}</span>`:'';
 const G=A.hosts.filter(r=>r.graded),t=A.totals;let rk=0;
 const base=A.baseline_date?` Baseline <b>${esc(A.baseline_date)}</b> (full cast).`:'';
 const note=[A.baseline_note,A.week7_partial?A.week7_note:'',(!A.week7_partial&&A.week7_note)?A.week7_note:''].filter(Boolean).map(esc).join(' ');
 let h=pageHead('Host Accuracy',`2026 season · graded through Week ${esc(A.through_week)} (updated ${esc(A.updated)}). Weeks: ${(A.weeks_graded||[]).join(', ')||'—'}.${base} ${esc(A.method)}`)+`
 ${note?`<div class="card small">${note}</div>`:''}
 ${kpiRow([[t.hit+' hits · '+t.miss+' misses','Rate '+pc(t.pct),''],[String(t.push),'Pushes',''],[String(t.void),'Voids',''],[String(t.hit+t.miss),'Graded','']])}
 <div class="scard"><div class="scard-head"><h3>Hit rate</h3></div><div class="scard-body"><canvas id="cAcc"></canvas></div></div>
 <div class="tblwrap"><table><thead><tr><th>#</th><th>Host</th><th>Show(s)</th><th>Hit</th><th>Miss</th><th>Push</th><th>Void</th><th>Pend.</th><th>Rate</th><th>H2H</th></tr></thead><tbody>${A.hosts.map(r=>{const ok=r.graded>=5;if(ok)rk++;const x=r.h2h||{};return `<tr><td>${ok?(rk===1?'🏆':rk):'—'}</td><td><b>${esc(r.host)}</b></td><td class="small">${esc(r.shows.join(', '))}</td><td class="bull">${r.hits}</td><td class="bear">${r.misses}</td><td>${r.push}</td><td>${r.void}</td><td>${r.pending}</td><td><b>${pc(r.pct)}</b></td><td class="small">${x.w||x.l||x.push?`${x.w}-${x.l}-${x.push}`:''}</td></tr>`}).join('')}</tbody></table></div>
 <div class="muted small">Ranks need at least 5 graded calls.</div>`;
 const pos=[...new Set(G.flatMap(r=>Object.keys(r.by_pos)))].sort(),ty=[...new Set(G.flatMap(r=>Object.keys(r.by_type)))].sort();
 h+=`<h2>📍 By position</h2><div class="tblwrap"><table><thead><tr><th>Host</th>${pos.map(p=>`<th>${esc(p)}</th>`).join('')}</tr></thead><tbody>${G.map(r=>`<tr><td><b>${esc(r.host)}</b></td>${pos.map(p=>`<td>${cell(r.by_pos[p])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
 h+=`<h2>🧾 By call type</h2><div class="tblwrap"><table><thead><tr><th>Host</th>${ty.map(p=>`<th>${esc(p)}</th>`).join('')}</tr></thead><tbody>${G.map(r=>`<tr><td><b>${esc(r.host)}</b></td>${ty.map(p=>`<td>${cell(r.by_type[p])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
 h+=`<h2>📈 Last 3 weeks</h2><div class="tblwrap"><table><thead><tr><th>Host</th>${G[0].trend.map(w=>`<th>Wk ${w.week}</th>`).join('')}</tr></thead><tbody>${G.map(r=>`<tr><td><b>${esc(r.host)}</b></td>${r.trend.map(w=>`<td>${w.graded?`${pc(w.pct)} <span class="muted small">(${w.graded})</span>`:'<span class="muted small">not tracked</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
 const b=A.best,w=A.worst;
 h+=`<div class="grid two"><div class="card"><h3 class="bull">🥇 Call of the week</h3><b>${esc(b.hosts.join(' + '))}</b> <span class="muted small">${esc(b.ep)} ${esc(b.time)}</span><div>${esc(b.call)}</div><div class="small bull">${esc(b.note)}</div>${(A.honorable||[]).map(c=>`<div class="small muted">🏅 ${esc(c.hosts.join(' + '))}: ${esc(c.call)}: ${esc(c.note)}</div>`).join('')}</div>
 <div class="card"><h3 class="bear">🗑️ Brick of the week</h3><b>${esc(w.hosts.join(' + '))}</b> <span class="muted small">${esc(w.ep)} ${esc(w.time)}</span><div>${esc(w.call)}</div><div class="small bear">${esc(w.note)}</div>${(A.dishonorable||[]).map(c=>`<div class="small muted">🧱 ${esc(c.hosts.join(' + '))}: ${esc(c.call)}: ${esc(c.note)}</div>`).join('')}</div></div>`;
 h+=`<h2>⚔️ Head-to-head disagreements</h2><div class="tblwrap"><table><thead><tr><th>Wk</th><th>Topic</th><th>Right</th><th>Wrong</th><th>Proof</th></tr></thead><tbody>${(A.h2h_games||[]).map(g=>`<tr><td>${g.week}</td><td>${esc(g.topic)}</td><td class="bull">${esc(g.winner==='push'||g.winner==='void'?g.winner.toUpperCase():g.winner)}</td><td class="bear">${esc(g.loser)}</td><td class="small">${esc(g.note)}</td></tr>`).join('')}</tbody></table></div><div class="muted small">Still pending: ${esc(A.h2h_pending)}</div>`;
 h+=`<div class="section-head"><h3>Every graded call</h3></div><div class="toolbar"><input id="aq" placeholder="Filter calls…"><select id="ast"><option value="">All</option><option>hit</option><option>miss</option><option>push</option><option>void</option></select></div><div class="scard"><div class="scard-body flush"><div class="tblwrap"><table><thead><tr><th>Wk</th><th>Host</th><th>Call</th><th>Grade</th></tr></thead><tbody id="ab"></tbody></table></div></div></div>`;
 if((A.reports||[]).length)h+=`<h2>📝 Weekly report cards</h2>${A.reports.map((r,i)=>`<div class="card"><details ${i===0?'open':''}><summary style="margin:0">${esc(r.title)} <span class="muted small">${esc(r.file)}</span></summary><div class="mdbody">${r.html}</div></details></div>`).join('')}`;
 app.innerHTML=h;
 const l=G;chart($('#cAcc'),{type:'bar',data:{labels:l.map(r=>r.host),datasets:[{label:'Hit rate %',data:l.map(r=>r.pct),backgroundColor:'#ffc83d'}]},options:{scales:{y:{min:0,max:100}},plugins:{legend:{display:false}}}});
 const C=A.calls||[];const r=()=>{const q=$('#aq').value.toLowerCase(),s=$('#ast').value;$('#ab').innerHTML=C.filter(c=>(!s||c.status===s)&&(!q||JSON.stringify(c).toLowerCase().includes(q))).map(c=>`<tr><td>${c.week}</td><td>${esc(c.hosts.join(' + '))}<div class="muted small">${esc((SH[c.show]||{}).name||c.show)} ${esc(c.ep)} ${esc(c.time)} · ${esc(c.type)} · ${esc(c.pos)}</div></td><td>${esc(c.call)}${c.poncho?`<div class="small" style="color:#ffc83d">🛡️ ${esc(c.poncho)}</div>`:''}</td><td>${ic[c.status]} ${esc(c.status)}<div class="small muted">${esc(c.note)}</div></td></tr>`).join('')};
 $('#aq').oninput=$('#ast').onchange=r;r()};

T.board=()=>{const B=D.board||{};const tot=(B.consensus_start||[]).length+(B.consensus_fade||[]).length+(B.contrarian||[]).length;
 if(!B.window||!tot){app.innerHTML=pageHead('Consensus Board','Starts, fades, and splits.')+WAIT('Needs at least two shows or hosts weighing in on the same player this week.');return}
 const card=i=>`<div class="card"><h3>${esc(i.player)} <span class="muted small">${esc(i.pos)} ${esc(i.team)}</span> ${sent(i.score)}</h3>${Object.entries(i.voices).map(([k,v])=>`<div class="small">${sent(v)} ${esc(k)}</div>`).join('')}</div>`;
 app.innerHTML=pageHead('Consensus Board',`Window: ${esc(B.window[0])} → ${esc(B.window[1])}`)+`
 <div class="section-head"><h3 class="bull">✅ Consensus starts</h3></div>${(B.consensus_start||[]).map(card).join('')||'<div class="muted">None yet.</div>'}
 <div class="section-head"><h3 class="bear">🚫 Consensus fades</h3></div>${(B.consensus_fade||[]).map(card).join('')||'<div class="muted">None yet.</div>'}
 <div class="section-head"><h3 style="color:var(--gold)">⚔️ Contrarian splits</h3></div>${(B.contrarian||[]).map(card).join('')||'<div class="muted">None yet.</div>'}`};

let teamSel=0;
T.teams=()=>{const TM=D.myteams;if(!TM.length){app.innerHTML=pageHead('My Teams','Rosters + show takes for each of your teams.')+WAIT('No leagues loaded.');return}
 const t=TM[teamSel];const m=t.matchup;
 let h=pageHead('My Teams',`${esc(t.team)} · ${esc(t.league_name||'')}`)+`<div class="subtabs">${TM.map((x,i)=>`<button data-i="${i}" class="${i===teamSel?'on':''}">${esc(x.label)}</button>`).join('')}</div>
 <div class="card"><h3>🛡️ ${esc(t.team)}</h3><div class="muted small">${esc(t.league_name||'')} · source: ${esc(t.source)}${t.fetched?' · pulled '+esc(t.fetched.replace('T',' '))+' ET':''}</div>
 ${t.record?`<div class="kpis" style="margin-top:8px"><div class="kpi"><b>${esc(t.record)}</b><span>Record</span></div><div class="kpi"><b>${t.rank}/${t.n_teams}</b><span>Rank</span></div><div class="kpi"><b>${t.pf}</b><span>PF</span></div><div class="kpi"><b>${t.pa}</b><span>PA</span></div></div>
 <div class="small muted" style="margin-top:6px">Max PF ${t.max_pf} · efficiency ${t.max_pf?(100*t.pf/t.max_pf).toFixed(1):'—'}%</div>`:''}</div>`;
 if(m)h+=`<h2>Week ${m.week} matchup</h2><div class="card"><div class="vs"><div><b>${esc(t.team)}</b><div style="font:900 28px Impact" class="${m.me>=(m.opp||0)?'bull':'bear'}">${(+m.me).toFixed(2)}</div></div><div class="mid">VS</div><div style="text-align:right"><b>${esc(m.opp_team)}</b><div style="font:900 28px Impact">${m.opp==null?'—':(+m.opp).toFixed(2)}</div></div></div></div>`;
 if((t.weekly||[]).length)h+=`<h2>Weekly scoring</h2><div class="card"><canvas id="cWk"></canvas></div>`;
 if((t.show_notes||[]).length)h+=`<h2>What the shows mean for you</h2>`+t.show_notes.slice(0,4).map(n=>`<div class="card"><div class="small muted">${showTag(n.show)} ${esc(n.date)} · ${esc(n.title)}</div><div class="small" style="white-space:pre-wrap;margin-top:6px">${md(n.text)}</div></div>`).join('');
 const groups=['Starter','Bench','IR','Taxi'];
 h+=`<h2>Roster × show takes</h2>`;
 if(!t.roster.length)h+='<div class="empty"><b>No roster data</b>Sleeper and the league file were both unavailable.</div>';
 for(const g of groups){const rs=t.roster.filter(r=>r.group===g);if(!rs.length)continue;
  h+=`<div class="muted small" style="margin:10px 0 4px;font-weight:800;letter-spacing:1px">${g.toUpperCase()} (${rs.length})</div>`;
  h+=rs.map(r=>{const sp=m&&m.starters_points?m.starters_points[r.name]:null;return `<div class="card" style="padding:10px"><div style="display:flex;justify-content:space-between;gap:8px"><div><span class="chip mono">${esc(r.slot)}</span> <b>${esc(r.name)}</b>${r.inj?`<span class="inj">${esc(r.inj)}</span>`:''} <span class="muted small">${esc(r.pos)} ${esc(r.team)}${r.age?' · age '+r.age:''}</span></div><div>${sp!=null?`<span class="pill"><b>${(+sp).toFixed(2)}</b> pts</span> `:''}${r.mentions?sent(r.score)+` <span class="muted small">×${r.mentions}</span>`:''}</div></div>
  ${r.takes.length?r.takes.map(k=>`<div class="take ${sc(k.sent)}"><div class="small">${showTag(k.show)} <b>${esc(k.host)}</b> <span class="muted">${esc(k.date)} ${k.ts?'@'+esc(k.ts):''}</span></div><div class="small"><b>${esc(k.take)}</b>${k.detail?' — '+esc(k.detail):''}</div>${(k.stats||[]).length?`<div class="chips">${k.stats.map(x=>`<span class="chip">${esc(x)}</span>`).join('')}</div>`:''}</div>`).join(''):`<div class="muted small">⏳ Waiting for first episode mention.</div>`}</div>`}).join('')}
 if((t.standings||[]).length)h+=`<h2>Standings</h2><div class="tblwrap"><table><thead><tr><th>#</th><th>Team</th><th>W-L</th><th>PF</th><th>PA</th><th>Max PF</th></tr></thead><tbody>${t.standings.map(s=>`<tr class="${s.me?'me':''}"><td>${s.rank}</td><td>${esc(s.team)}</td><td>${s.w}-${s.l}${s.t?'-'+s.t:''}</td><td>${s.pf}</td><td>${s.pa}</td><td>${s.max_pf}</td></tr>`).join('')}</tbody></table></div>`;
 if((t.transactions||[]).length)h+=`<h2>Recent moves</h2>${t.transactions.map(x=>`<div class="card small">Wk ${x.week} · ${esc(x.type)} ${x.adds.length?'<span class="bull">+ '+esc(x.adds.join(', '))+'</span>':''} ${x.drops.length?'<span class="bear">− '+esc(x.drops.join(', '))+'</span>':''}</div>`).join('')}`;
 if((t.notes||[]).length)h+=`<h2>Scoring notes</h2><div class="card small">${t.notes.map(esc).join('<br>')}</div>`;
 app.innerHTML=h;
 app.querySelectorAll('.subtabs button').forEach(b=>b.onclick=()=>{teamSel=+b.dataset.i;go('teams')});
 if((t.weekly||[]).length)chart($('#cWk'),{type:'line',data:{labels:t.weekly.map(w=>'Wk '+w.week),datasets:[{label:t.team,data:t.weekly.map(w=>w.pts),borderColor:'#3ecfff',backgroundColor:'#3ecfff33',fill:true,tension:.3},{label:'Opponent',data:t.weekly.map(w=>w.opp_pts),borderColor:'#ff5c6c',tension:.3},{label:'League median',data:t.weekly.map(w=>w.league_median),borderColor:'#7a8499',borderDash:[4,4],tension:.3}]},options:{plugins:{legend:{position:'bottom'}}}})};

/* ===================== League hub / wrap-ups / matchup / bench / trends / value / shame ===================== */
const LG=(D.league&&D.league.leagues)||[];
let lgSel=Math.max(0,LG.findIndex(l=>l.key==='MAIN_LEAGUE'));
const f2=v=>v==null?'—':(+v).toFixed(2), f1=v=>v==null?'—':(+v).toFixed(1);
const tag=(t)=>t.me?' <span class="chip you">YOU</span>':t.freddy?' <span class="chip fred">FREDDY</span>':'';
const tcls=t=>t.me?'me':t.freddy?'fr':'';
const byName=(L,n)=>(L.standings||[]).find(s=>s.team===n)||{};
const tn=(L,n)=>{const s=byName(L,n);return `${esc(n)}${tag(s)}`};
const NOLG=`<div class="empty"><div class="big">📡</div><b>No league data yet</b>Sleeper couldn't be reached on the last build. It fills in on the next run.</div>`;
function lgTabs(cb){return `<div class="subtabs">${LG.map((l,i)=>`<button data-li="${i}" class="${i===lgSel?'on':''}">${esc(l.label)}</button>`).join('')}</div>`}
function bindLg(tab){app.querySelectorAll('[data-li]').forEach(b=>b.onclick=()=>{lgSel=+b.dataset.li;go(tab)})}
const liveNote=L=>L.live_week?`<div class="muted small">Season stats use final weeks ${L.final_weeks.length?L.final_weeks[0]+'–'+L.final_weeks[L.final_weeks.length-1]:'—'}. Week ${L.live_week} is <span class="live">LIVE</span> and gets counted once Sleeper finalizes it.</div>`:'';
function heat(v,arr){const s=arr.slice().sort((a,b)=>a-b);const r=s.length>1?s.indexOf(v)/(s.length-1):.5;const h=Math.round(r*130);return `background:hsla(${h},70%,40%,.55)`}

T.wraps=()=>{const A=D.archive||{sections:[],memes:[]};
 const secs=A.sections||[];
 const ARCH_LABEL={hostwrap:'Daily Host Wraps',wrapups:'Sunday Score Wraps',freddy:'Freddy Spotlights',waivers:'Waiver Intel',research:"Guru's Findings",ffmag:'The Sicko Mag'};
 let h=pageHead('Mag & Archives','Sicko Mag, host wraps, Freddy, waivers, Sunday wraps.')+`<div class="subtabs scrollx">${secs.map((s,i)=>`<button data-ai="${i}" class="${i===(T._ai||0)?'on':''}" title="${esc(ARCH_LABEL[s.key]||s.label)}">${s.icon} ${esc(ARCH_LABEL[s.key]||s.label)} <span class="muted">${s.items.length}</span></button>`).join('')}</div>`;
 const s=secs[T._ai||0];
 if(!s){app.innerHTML=h+`<div class="empty"><b>No archives yet</b></div>`;return}
 h+=`<h2>${s.icon} ${esc(ARCH_LABEL[s.key]||s.label)}</h2>`;
 if(!s.items.length)h+=`<div class="empty"><div class="big">🗂️</div><b>Nothing here yet</b>${s.key==='research'?'Guru\'s Findings will land here once the first one is written.':s.key==='ffmag'?'The weekly mag PDFs show up here once the first issue is made.':'This archive fills in automatically after the first one is written.'}</div>`;
 s.items.forEach((it,i)=>{
  if(it.kind==='pdf'){h+=`<div class="card"><h3>📄 <a href="${esc(it.href)}" target="_blank" rel="noopener">${esc(it.title)}</a></h3><div class="muted small">${esc(it.date)} ET · PDF · ${it.kb} KB</div></div>`;return}
  h+=`<div class="card"><details ${i===0?'open':''}><summary style="margin:0"><span style="color:var(--chalk)">${esc(it.title)}</span></summary><div class="muted small">${esc(it.date)} ET · ${it.words} words${it.memes.length?' · '+it.memes.length+' memes':''}</div>
  ${it.memes.length?`<div class="memes">${it.memes.map(m=>`<a href="${esc(m.src)}" target="_blank"><img loading="lazy" src="${esc(m.src)}" alt="${esc(m.caption)}"></a>`).join('')}</div>`:''}
  <div class="mdbody">${it.html}</div></details></div>`});
 if(s.key==='wrapups'){const un=(A.memes||[]).filter(m=>!m.linked);
  h+=`<h2>😂 Meme vault</h2>`+((A.memes||[]).length?`<div class="memes">${(A.memes||[]).map(m=>`<figure><a href="${esc(m.src)}" target="_blank"><img loading="lazy" src="${esc(m.src)}" alt=""></a><figcaption class="muted small">${esc(m.date)}</figcaption></figure>`).join('')}</div>`:`<div class="empty"><b>No memes yet</b>Memes drop after the Sunday night kickoff.</div>`)}
 app.innerHTML=h;
 app.querySelectorAll('[data-ai]').forEach(b=>b.onclick=()=>{T._ai=+b.dataset.ai;go('wraps')});
 app.querySelectorAll('.mdbody table').forEach(t=>{const w=document.createElement('div');w.className='tblwrap';t.parentNode.insertBefore(w,t);w.appendChild(t)})};

T.league=()=>{if(!LG.length){app.innerHTML=pageHead('League Hub','Standings, power ranks, heatmap.')+NOLG;return}
 const L=LG[lgSel],S=L.standings,W=L.weeks;let h=pageHead('League Hub',`${esc(L.name)} · ${L.n_teams} teams · ${L.ppr} PPR · ${L.pass_td}-pt pass TD · FAAB $${L.faab_budget}`)+lgTabs()+liveNote(L);
 if(!L.final_weeks.length){app.innerHTML=h+'<div class="empty"><b>No final weeks yet</b>Stats start after Week 1 is scored.</div>';bindLg('league');return}
 h+=`<h2>Standings + luck</h2><div class="tblwrap"><table id="stt"><thead><tr><th>#</th><th>Team</th><th>W-L</th><th>PF</th><th>PA</th><th>All-play</th><th>Exp W</th><th>Luck</th><th>vs Median</th><th>Avg</th></tr></thead><tbody></tbody></table></div>
 <div class="muted small">All-play = your record if you played every team every week. Luck = actual wins − all-play expected wins (+ lucky, − robbed).</div>
 <h2>Power rankings</h2><div class="card">${S.slice().sort((a,b)=>a.power_rank-b.power_rank).map(s=>`<div class="pr ${tcls(s)}"><b class="prn">${s.power_rank}</b><div style="flex:1"><div>${esc(s.team)}${tag(s)} <span class="muted small">${s.w}-${s.l} · last 3 avg ${f1(s.last3)}</span></div><div class="bar"><i style="width:${s.power}%;background:var(--accent)"></i></div></div><b>${f1(s.power)}</b></div>`).join('')}
 <div class="muted small" style="margin-top:6px">Score = 40% points for (scaled) + 35% all-play win % + 25% last-3-weeks scoring (scaled).</div></div>
 <h2>Weekly scores heatmap</h2><div class="tblwrap"><table class="heat"><thead><tr><th>Team</th>${W.map(w=>`<th>Wk ${w.week}${w.live?' <span class="live">LIVE</span>':''}</th>`).join('')}</tr></thead><tbody>
 ${S.map(s=>`<tr class="${tcls(s)}"><td>${esc(s.team)}${tag(s)}</td>${W.map(w=>{const v=w.scores[s.rid];const arr=Object.values(w.scores);return v==null?'<td>—</td>':`<td style="${heat(v,arr)}" class="${v>w.median?'':'dim'}">${f1(v)}</td>`}).join('')}</tr>`).join('')}
 <tr class="medrow"><td><b>Median line</b></td>${W.map(w=>`<td><b>${f1(w.median)}</b></td>`).join('')}</tr>
 <tr><td class="muted">High</td>${W.map(w=>`<td class="small">${w.high?esc(w.high.team)+'<br><b class="bull">'+f1(w.high.pts)+'</b>':'—'}</td>`).join('')}</tr>
 <tr><td class="muted">Low</td>${W.map(w=>`<td class="small">${w.low?esc(w.low.team)+'<br><b class="bear">'+f1(w.low.pts)+'</b>':'—'}</td>`).join('')}</tr></tbody></table></div>
 <div class="muted small">Green = top of the league that week, red = bottom. Faded cells finished below the median.</div>
 <h2>Records book</h2><div class="grid two">${[['🔥 Highest weekly scores','highest'],['🧊 Lowest weekly scores','lowest'],['💥 Biggest blowouts','blowouts'],['😰 Nail-biters','nailbiters']].map(([t,k])=>`<div class="card"><h3>${t}</h3>${(L.records[k]||[]).map(r=>`<div class="small">Wk ${r.week} · <b>${tn(L,r.team)}</b> ${f2(r.pts)} ${r.opp?`<span class="muted">vs ${esc(r.opp)} ${f2(r.opp_pts)}</span>`:''}${r.margin!=null?` <span class="chip">by ${f2(r.margin)}</span>`:''}</div>`).join('')||'<div class="muted small">—</div>'}</div>`).join('')}</div>
 <h2>Points by position (starters)</h2><div class="card"><div style="position:relative;height:${S.length*30+70}px"><canvas id="cPos" style="max-height:none"></canvas></div></div>
 <h2>Lineup efficiency</h2><div class="tblwrap"><table><thead><tr><th>Team</th><th>Actual</th><th>Optimal</th><th>Left on bench</th><th>Eff.</th></tr></thead><tbody>${S.slice().sort((a,b)=>(b.eff||0)-(a.eff||0)).map(s=>`<tr class="${tcls(s)}"><td>${esc(s.team)}${tag(s)}</td><td>${f2(s.pf)}</td><td>${f2(s.optimal)}</td><td class="bear">${f2(s.bench_left)}</td><td><b>${f1(s.eff)}%</b></td></tr>`).join('')}</tbody></table></div>
 <div class="muted small">Optimal = best possible legal lineup from each week's roster (matches Sleeper's Max PF).</div>
 <h2>Transactions + FAAB</h2><div class="tblwrap"><table id="txt"><thead><tr><th>Team</th><th>Waiver</th><th>Free agent</th><th>Trades</th><th>Adds</th><th>FAAB spent</th></tr></thead><tbody>${S.slice().sort((a,b)=>b.faab_used-a.faab_used).map(s=>`<tr class="${tcls(s)}"><td>${esc(s.team)}${tag(s)}</td><td>${s.tx_waiver}</td><td>${s.tx_fa}</td><td>${s.tx_trade}</td><td>${s.tx_adds}</td><td><b>$${s.faab_used}</b> <span class="muted small">/ ${s.faab_budget}</span><div class="bar" style="width:70px"><i style="width:${100*s.faab_used/(s.faab_budget||1)}%;background:var(--gold)"></i></div></td></tr>`).join('')}</tbody></table></div>
 <h2>Top scorers league-wide</h2><div class="filters"><select id="tsp"><option value="">All positions</option>${['QB','RB','WR','TE','K','DEF'].map(x=>`<option>${x}</option>`).join('')}</select></div><div class="tblwrap"><table><thead><tr><th>#</th><th>Player</th><th>Pts</th><th>GP</th><th>Avg</th><th>Fantasy team</th></tr></thead><tbody id="tsb"></tbody></table></div>
 <div class="muted small">This league's scoring, final weeks only, from Sleeper's weekly stats.</div>
 <h2>Trade log</h2>${L.trades.length?L.trades.map(t=>`<div class="card"><div class="muted small">Week ${t.week} · ${esc(t.date)}</div><div class="grid two">${t.sides.map(sd=>`<div><b>${tn(L,sd.team)}</b> gets<div class="small">${sd.gets.map(esc).join('<br>')||'—'}</div></div>`).join('')}</div></div>`).join(''):'<div class="empty"><b>No trades yet</b>Nobody has pulled the trigger.</div>'}
 <h2>Head-to-head + rivalries</h2><div class="tblwrap"><table><thead><tr><th>Matchup</th><th>Series</th><th>Games</th></tr></thead><tbody>${L.h2h.slice().sort((a,b)=>{const r=x=>(byName(L,x.a).me||byName(L,x.b).me?2:0)+(byName(L,x.a).freddy||byName(L,x.b).freddy?1:0);return r(b)-r(a)||a.games[0].week-b.games[0].week}).map(x=>`<tr class="${byName(L,x.a).me||byName(L,x.b).me?'me':''}"><td>${tn(L,x.a)} <span class="muted">vs</span> ${tn(L,x.b)}</td><td><b>${x.a_w}-${x.b_w}${x.ties?'-'+x.ties:''}</b></td><td class="small">${x.games.map(g=>`Wk ${g.week}: ${f2(g.a)}–${f2(g.b)}`).join('<br>')}</td></tr>`).join('')}</tbody></table></div>
 <div class="muted small">This is a first-year league on Sleeper, so the series only covers ${L.season}.</div>`;
 app.innerHTML=h;bindLg('league');
 const rows=S.slice(),tb=$('#stt tbody');
 const rend=()=>tb.innerHTML=rows.map(s=>`<tr class="${tcls(s)}"><td>${s.rank}</td><td>${esc(s.team)}${tag(s)}<div class="muted small">${esc(s.owner)}</div></td><td><b>${s.w}-${s.l}${s.t?'-'+s.t:''}</b></td><td>${f2(s.pf)}</td><td>${f2(s.pa)}</td><td>${s.ap_w}-${s.ap_l}${s.ap_t?'-'+s.ap_t:''}<div class="muted small">${(100*s.ap_pct).toFixed(1)}%</div></td><td>${f2(s.exp_w)}</td><td class="${s.luck>0.25?'bull':s.luck<-0.25?'bear':''}"><b>${s.luck>0?'+':''}${f2(s.luck)}</b></td><td>${s.med_w}-${s.med_l}</td><td>${f1(s.avg)}</td></tr>`).join('');
 sortable($('#stt'),rows,[s=>s.rank,s=>s.team,s=>s.w,s=>s.pf,s=>s.pa,s=>s.ap_pct,s=>s.exp_w,s=>s.luck,s=>s.med_w,s=>s.avg],rend);rend();
 const P=['QB','RB','WR','TE','K','DEF'].filter(p=>S.some(s=>s.pos_pts[p])),col={QB:'#ff5c6c',RB:'#2ee59d',WR:'#1f8fff',TE:'#ffc83d',K:'#a855f7',DEF:'#7a8499'};
 chart($('#cPos'),{type:'bar',data:{labels:S.map(s=>s.team+(s.me?' (YOU)':s.freddy?' (FREDDY)':'')),datasets:P.map(p=>({label:p,data:S.map(s=>s.pos_pts[p]||0),backgroundColor:col[p]}))},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,scales:{x:{stacked:true},y:{stacked:true,ticks:{autoSkip:false,font:{size:10}}}},plugins:{legend:{position:'bottom'}}}});
 const ts=()=>{const p=$('#tsp').value;$('#tsb').innerHTML=L.top_scorers.filter(x=>!p||x.pos===p).slice(0,25).map((x,i)=>{const o=byName(L,x.owner);return `<tr class="${tcls(o)}"><td>${i+1}</td><td><b>${esc(x.name)}</b> <span class="muted small">${esc(x.pos)} ${esc(x.nfl)}</span></td><td><b>${f1(x.pts)}</b></td><td>${x.gp}</td><td>${f1(x.avg)}</td><td class="small">${esc(x.owner)}${tag(o)}</td></tr>`}).join('')};$('#tsp').onchange=ts;ts()};

T.matchup=()=>{if(!LG.length){app.innerHTML=pageHead('This Week','Matchup preview.')+NOLG;return}
 const L=LG[lgSel],M=L.preview;let h=pageHead('This Week',`Week ${L.preview_week||'—'} preview`)+lgTabs();
 if(!M||M.bye){app.innerHTML=h+`<div class="empty"><div class="big">🗓️</div><b>No upcoming matchup found</b>Sleeper hasn't posted Week ${L.preview_week} pairings${M&&M.bye?' (you may have a bye)':''}.</div>`;bindLg('matchup');return}
 const A=M.me,B=M.opp,Tn=M.tendencies;
 const side=(X)=>`<div class="card ${X.freddy?'frcard':''}"><h3>${esc(X.team)}${tag(X)}</h3><div class="muted small">${esc(X.owner)} · ${X.record} · standings #${X.rank} · power #${X.power_rank}</div>
  <div class="kpis" style="margin-top:6px;grid-template-columns:repeat(3,1fr)"><div class="kpi"><b>${X.has_proj?f1(X.proj_total):'—'}</b><span>Proj</span></div><div class="kpi"><b>${f1(X.avg)}</b><span>Avg</span></div><div class="kpi"><b>${f1(X.last3)}</b><span>Last 3</span></div></div>
  <div class="small" style="margin-top:6px">${X.recent.map(r=>`<span class="chip ${r.pts>r.opp_pts?'bull':'bear'}">Wk ${r.week} ${r.pts>r.opp_pts?'W':'L'} ${f1(r.pts)}</span>`).join(' ')}</div></div>`;
 h+=`<h2>Week ${M.week}: ${esc(A.team)} vs ${esc(B.team)}</h2>`;
 const BY=M.byes;if(BY&&(BY.teams||[]).length){const bl=(X,who)=>`<div class="small" style="margin-top:4px"><b>${who}:</b> ${X.starters.length?`<span class="bear">starting ${X.starters.map(esc).join(', ')}</span>`:'<span class="bull">no starters on bye</span>'}${X.bench.length?` <span class="muted">· bench: ${X.bench.map(esc).join(', ')}</span>`:''}</div>`;
  const qn=(X,who)=>X.qb_note?`<div class="small" style="margin-top:6px">🎯 <b>${who} QB:</b> ${X.qb_note.bye_qbs.map(esc).join(' and ')} ${X.qb_note.bye_qbs.length>1?'are both':'is'} on bye. ${X.qb_note.options.length?`Healthy options: ${X.qb_note.options.map(o=>`<b>${esc(o.name)}</b> <span class="muted">(${esc(o.nfl)}${o.opp?' vs '+esc(o.opp):''}, proj ${o.proj==null?'—':f1(o.proj)}, ${esc(o.slot)})</span>`).join(' or ')}.`:'<span class="bear">No healthy QB on the roster. Hit the wire.</span>'}</div>`:'';
  h+=`<div class="card" style="border-color:var(--bear)">🛑 <b>Week ${M.week} byes: ${BY.teams.map(esc).join(', ')}</b>${bl(BY.me,'You ('+esc(A.team)+')')}${bl(BY.opp,esc(B.team))}${qn(BY.me,'Your')}${qn(BY.opp,esc(B.team)+"'s")}</div>`}
 h+=`<div class="grid two">${side(A)}${side(B)}</div>`;
 if(M.proj_source){const diff=A.proj_total-B.proj_total;h+=`<div class="card"><div class="vs"><div><b>${esc(A.team)}</b><div style="font:900 26px Impact" class="${diff>=0?'bull':'bear'}">${f1(A.proj_total)}</div></div><div class="mid">PROJ</div><div style="text-align:right"><b>${esc(B.team)}</b><div style="font:900 26px Impact">${f1(B.proj_total)}</div></div></div><div class="muted small">${esc(M.proj_source)}. Lineups as currently set in Sleeper; projections move all week.</div></div>`}
 else h+=`<div class="empty"><b>No Sleeper projections posted for Week ${M.week} yet</b>They usually appear early in the week.</div>`;
 h+=`<h2>Positional edges</h2><div class="card">${M.edges.map(e=>{const mx=Math.max(e.me,e.opp,1);return `<div class="edge"><b class="mono">${e.pos}</b><div class="eb"><div class="bar l"><i style="width:${100*e.me/mx}%;background:var(--accent)"></i></div><span class="small">${f1(e.me)}</span></div><div class="eb"><span class="small">${f1(e.opp)}</span><div class="bar"><i style="width:${100*e.opp/mx}%;background:var(--bear)"></i></div></div><b class="${e.edge>0?'bull':e.edge<0?'bear':'muted'} small">${e.edge>0?'+':''}${f1(e.edge)}</b></div>`}).join('')}<div class="muted small">Left = you, right = them (projected starters by slot).</div></div>`;
 const flags=r=>`${r.bye?'<span class="inj">BYE</span>':''}${r.inj?`<span class="inj">${esc(r.inj)}</span>`:''}`;
 h+=`<h2>Side-by-side lineups</h2><div class="tblwrap"><table class="sbs"><thead><tr><th>Slot</th><th>${esc(A.team)}</th><th>Proj</th><th>Proj</th><th>${esc(B.team)}</th></tr></thead><tbody>${A.starters.map((r,i)=>{const o=B.starters[i]||{};return `<tr><td class="mono">${esc(r.slot)}</td><td><b>${esc(r.name)}</b> <span class="muted small">${esc(r.pos)} ${esc(r.nfl||'')}${r.opp?' vs '+esc(r.opp):''}</span>${flags(r)}</td><td class="${(r.proj||0)>=(o.proj||0)?'bull':''}"><b>${r.proj==null?'—':f1(r.proj)}</b></td><td class="${(o.proj||0)>(r.proj||0)?'bear':''}"><b>${o.proj==null?'—':f1(o.proj)}</b></td><td><b>${esc(o.name||'')}</b> <span class="muted small">${esc(o.pos||'')} ${esc(o.nfl||'')}${o.opp?' vs '+esc(o.opp):''}</span>${flags(o)}</td></tr>`}).join('')}</tbody></table></div>`;
 const bn=(X)=>`<div class="card"><h3>${esc(X.team)} bench</h3>${X.bench.slice(0,10).map(r=>`<div class="small"><span class="chip mono">${r.slot}</span> ${esc(r.name)} <span class="muted">${esc(r.pos)} ${esc(r.nfl||'')}</span>${flags(r)} <b style="float:right">${r.proj==null?'—':f1(r.proj)}</b></div>`).join('')}</div>`;
 h+=`<details><summary>Benches (by projection)</summary><div class="grid two">${bn(A)}${bn(B)}</div></details>`;
 const byes=A.starters.filter(r=>r.bye);if(byes.length)h+=`<div class="card" style="border-color:var(--bear)">🚨 <b>Bye-week alert:</b> ${byes.map(r=>esc(r.name)).join(', ')} ${byes.length>1?'are':'is'} in your Week ${M.week} lineup on a bye. Swap before kickoff.</div>`;
 const inj=A.starters.filter(r=>r.inj&&!r.bye);if(inj.length)h+=`<div class="card">🏥 <b>Injury watch:</b> ${inj.map(r=>esc(r.name)+' ('+esc(r.inj)+')').join(', ')}</div>`;
 h+=`<h2>Scouting ${esc(B.team)}</h2><div class="card"><div class="kpis"><div class="kpi"><b>${f1(Tn.bench_left)}</b><span>Bench pts left</span></div><div class="kpi"><b>#${Tn.bench_rank}/${Tn.n_teams}</b><span>Most left</span></div><div class="kpi"><b>${f1(Tn.eff)}%</b><span>Lineup eff.</span></div><div class="kpi"><b>${Tn.luck>0?'+':''}${f2(Tn.luck)}</b><span>Luck</span></div></div>
 <div class="small" style="margin-top:8px">Left 10+ points on the bench in <b>${Tn.weeks_10plus_left}</b> of ${L.final_weeks.length} weeks · <b>${Tn.moves}</b> waiver/FA moves · <b>${Tn.trades}</b> trades · FAAB spent <b>$${Tn.faab_used}</b> of $${Tn.faab_budget}</div>
 ${Tn.worst_decisions.length?`<div class="small" style="margin-top:8px"><b>Worst start/sit calls</b>${Tn.worst_decisions.map(d=>`<div>Wk ${d.week}: started ${esc(d.started)} (${f2(d.started_pts)}) over ${esc(d.benched)} (${f2(d.benched_pts)}) at ${esc(d.slot)}: <b class="bear">−${f2(d.delta)}</b></div>`).join('')}</div>`:''}
 ${Tn.recent_tx.length?`<div class="small" style="margin-top:8px"><b>Recent moves</b>${Tn.recent_tx.map(x=>`<div>Wk ${x.week} · ${esc(x.type.replace('_',' '))} ${x.adds.length?'<span class="bull">+ '+esc(x.adds.join(', '))+'</span>':''} ${x.drops.length?'<span class="bear">− '+esc(x.drops.join(', '))+'</span>':''}${x.bid?` <span class="chip">$${x.bid}</span>`:''}</div>`).join('')}</div>`:''}</div>`;
 app.innerHTML=h;bindLg('matchup')};

T.bench=()=>{if(!LG.length){app.innerHTML=pageHead('Bench Left','Points left on the bench.')+NOLG;return}
 let h=pageHead('Bench Left','Best possible lineup − actual score, season to date (final weeks).');
 LG.forEach((L,i)=>{const B=L.bench;h+=`<h2>${esc(L.label)}</h2><div class="card"><div style="position:relative;height:${B.length*28+50}px"><canvas id="cB${i}" style="max-height:none"></canvas></div></div>
 <div class="tblwrap"><table><thead><tr><th>Team</th><th>Left</th><th>Eff.</th>${L.final_weeks.map(w=>`<th>Wk ${w}</th>`).join('')}${L.live_week?`<th>Wk ${L.live_week} <span class="live">LIVE</span></th>`:''}<th>Worst call</th></tr></thead><tbody>${B.map(b=>`<tr class="${tcls(b)}"><td>${esc(b.team)}${tag(b)}</td><td class="bear"><b>${f1(b.bench_left)}</b></td><td>${f1(b.eff)}%</td>${b.weekly.map(v=>`<td>${f1(v)}</td>`).join('')}${L.live_week?`<td class="muted">${f1(b.live)}</td>`:''}<td class="small" style="min-width:220px">${b.worst?`Wk ${b.worst.week}: ${esc(b.worst.benched)} ${f1(b.worst.benched_pts)} sat for ${esc(b.worst.started)} ${f1(b.worst.started_pts)}`:'—'}</td></tr>`).join('')}</tbody></table></div>`});
 app.innerHTML=h;
 LG.forEach((L,i)=>{const B=L.bench;chart($('#cB'+i),{type:'bar',data:{labels:B.map(b=>b.team+(b.me?' (YOU)':b.freddy?' (FREDDY)':'')),datasets:[{label:'Bench points left',data:B.map(b=>b.bench_left),backgroundColor:B.map(b=>b.me?'#ffc83d':b.freddy?'#ff6fb5':'#3a5a4b')}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,scales:{y:{ticks:{autoSkip:false,font:{size:10}}}},plugins:{legend:{display:false}}}})})};

function spark(weeks,lab){const v=weeks.map(w=>w.pts?w.pts[lab]:null),mx=Math.max(5,...v.map(x=>x||0));const bw=100/weeks.length;
 return `<svg viewBox="0 0 100 44" preserveAspectRatio="none" class="spark">${weeks.map((w,i)=>{const x=v[i];if(x==null||!w.played)return `<text x="${i*bw+bw/2}" y="40" font-size="6" text-anchor="middle" fill="#6e7689">${w.played===false&&w.pts?'0':'–'}</text>`;const hh=Math.max(1,36*Math.max(0,x)/mx);return `<rect x="${i*bw+bw*.15}" y="${38-hh}" width="${bw*.7}" height="${hh}" rx="1" fill="${w.live?'#7a8499':'#3ecfff'}"/><text x="${i*bw+bw/2}" y="${Math.max(6,36-hh)}" font-size="5.5" text-anchor="middle" fill="#eef1f7">${x.toFixed(0)}</text>`}).join('')}</svg><div class="sparkx">${weeks.map(w=>`<span>${w.week}</span>`).join('')}</div>`}
T.trends=()=>{const R=(D.league&&D.league.trends)||[];if(!R.length){app.innerHTML=pageHead('Scoring Trends','Your rostered players over the season.')+NOLG;return}
 const lab=['all',...new Set(R.flatMap(r=>r.leagues))];T._tl=T._tl||'all';
 let h=pageHead('Scoring Trends','Fantasy points use each league\'s scoring. Grey bar = live week.')+`<div class="subtabs">${lab.map(l=>`<button data-tl="${esc(l)}" class="${T._tl===l?'on':''}">${l==='all'?'Both':esc(l)}</button>`).join('')}</div><div class="grid two">`;
 for(const r of R.filter(r=>T._tl==='all'||r.leagues.includes(T._tl))){const L0=T._tl==='all'?r.leagues[0]:T._tl;
  const tr=k=>r.weeks.map(w=>w[k]==null?'–':k==='snap'?Math.round(w[k])+'%':(+w[k]).toFixed(0));
  const rowsDef=r.pos==='QB'?[['Pass yds','pass_yd'],['Carries','car'],['TDs','td'],['Snap %','snap']]:r.pos==='K'||r.pos==='DEF'?[]:[['Snap %','snap'],['Targets','tgt'],['Catches','rec'],['Carries','car'],['Scrim yds','yds']];
  h+=`<div class="card tc"><div style="display:flex;justify-content:space-between"><div><b>${esc(r.name)}</b>${r.inj?`<span class="inj">${esc(r.inj)}</span>`:''}<div class="muted small">${esc(r.pos)} ${esc(r.nfl)}${r.age?' · age '+r.age:''} · ${r.leagues.map(esc).join(' + ')}</div></div><div style="text-align:right"><b>${f1(r.avg[L0])}</b><div class="muted small">avg pts (${esc(L0)})</div></div></div>
  ${spark(r.weeks,L0)}
  ${rowsDef.length?`<table class="mini"><tbody>${rowsDef.map(([n,k])=>`<tr><td class="muted">${n}</td>${tr(k).map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table>`:''}</div>`}
 app.innerHTML=h+'</div>';app.querySelectorAll('[data-tl]').forEach(b=>b.onclick=()=>{T._tl=b.dataset.tl;go('trends')})};

T.value=()=>{const V=D.league&&D.league.dynasty;if(!V||V.error||!V.players){app.innerHTML=pageHead('Dynasty Value','FantasyCalc trade values.')+`<div class="empty"><div class="big">💎</div><b>Dynasty values unavailable</b>${esc((V&&V.error)||'The free value source could not be reached on the last build.')}</div>`;return}
 const fl=f=>`<span class="flag ${f}">${f}</span>`;
 let h=pageHead(`${esc(V.team)} dynasty board`,`Source: <a href="https://fantasycalc.com/dynasty-rankings" target="_blank" rel="noopener">FantasyCalc</a> (${esc(V.settings)}), pulled ${esc(V.fetched)} ET.`)+`
 <div class="tblwrap" style="margin-top:8px"><table id="vt"><thead><tr><th>#</th><th>Player</th><th>Age</th><th>Value</th><th>30-day</th><th>Flag</th></tr></thead><tbody>${V.players.map((p,i)=>`<tr><td>${i+1}</td><td><b>${esc(p.name)}</b> <span class="muted small">${esc(p.pos)} ${esc(p.nfl)}${p.group!=='Roster'?' · '+p.group:''}</span>${p.rank?`<div class="muted small">overall #${p.rank} · ${esc(p.pos)}${p.pos_rank}</div>`:''}</td><td>${p.age??'—'}</td><td><b>${p.value??'—'}</b></td><td class="${(p.trend30||0)>0?'bull':(p.trend30||0)<0?'bear':''}">${p.trend30==null?'—':(p.trend30>0?'+':'')+p.trend30}</td><td>${fl(p.flag)}<div class="muted small">${esc(p.why)}</div></td></tr>`).join('')}</tbody></table></div>
 <h2>🎟️ Draft picks</h2>${V.picks.length?`<div class="tblwrap"><table><thead><tr><th>Pick</th><th>Value</th><th>30-day</th></tr></thead><tbody>${V.picks.map(p=>`<tr><td><b>${esc(p.name)}</b></td><td>${p.value??'—'}</td><td>${p.trend30==null?'—':(p.trend30>0?'+':'')+p.trend30}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty"><b>No future picks owned</b></div>'}
 <div class="muted small">${esc(V.pick_note)}</div>
 <h2>🏦 League value standings</h2><div class="tblwrap"><table><thead><tr><th>#</th><th>Team</th><th>Players</th><th>Picks</th><th>Total</th></tr></thead><tbody>${V.totals.map(t=>`<tr class="${tcls(t)}"><td>${t.rank}</td><td>${esc(t.team)}${tag(t)}<div class="muted small">${t.top.map(esc).join(', ')}</div></td><td>${t.players.toLocaleString()}</td><td>${t.picks.toLocaleString()}</td><td><b>${t.total.toLocaleString()}</b></td></tr>`).join('')}</tbody></table></div>
 ${V.freddy_players&&V.freddy_players.length?`<h2>🌸 Freddy's top assets (${esc(V.freddy_team)})</h2><div class="card">${V.freddy_players.map(p=>`<div class="small">${fl(p.flag)} <b>${esc(p.name)}</b> <span class="muted">${esc(p.pos)} · age ${p.age??'—'}</span> <b style="float:right">${p.value??'—'}</b></div>`).join('')}</div>`:''}
 <div class="muted small" style="margin-top:8px">${esc(V.flag_rules)}</div>`;
 app.innerHTML=h};

T.shame=()=>{if(!LG.length){app.innerHTML=pageHead('Hall of Shame','Worst starts and start/sit calls.')+NOLG;return}
 const L=LG[lgSel];let h=pageHead('Hall of Shame','Every week\'s worst starts and start/sit calls. Live weeks are provisional.')+lgTabs();
 if(!L.shame.length)h+='<div class="empty"><b>No weeks scored yet</b></div>';
 for(const w of L.shame){h+=`<h2>🤡 Week ${w.week}${w.live?' <span class="live">LIVE</span>':''}</h2><div class="grid two"><div class="card"><h3>💩 Worst starts</h3>${w.worst_starts.map((s,i)=>`<div class="small ${tcls(byName(L,s.team))}">${i===0?'👑':'·'} <b>${esc(s.player)}</b> <span class="muted">${esc(s.pos)} ${esc(s.nfl||'')}</span> <b class="bear">${f2(s.pts)}</b> <span class="muted">for ${esc(s.team)}</span>${tag(byName(L,s.team))}</div>`).join('')}</div>
 <div class="card"><h3>🪑 Worst start/sit calls</h3>${w.worst_decisions.length?w.worst_decisions.map(d=>`<div class="small"><b>${esc(d.team)}</b>${tag(byName(L,d.team))}: started ${esc(d.started)} (${f2(d.started_pts)}) over <b>${esc(d.benched)}</b> (${f2(d.benched_pts)}) <b class="bear">−${f2(d.delta)}</b></div>`).join(''):'<div class="muted small">Everybody set a sane lineup. Suspicious.</div>'}
 <div class="small muted" style="margin-top:6px">Most left on bench: ${w.bench_kings.map(b=>`${esc(b.team)} ${f1(b.bench_left)}`).join(' · ')}</div></div></div>`}
 app.innerHTML=h;bindLg('shame')};

let grSel=0;
T.grades=()=>{const G=D.grades;if(!G||!(G.leagues||[]).length){app.innerHTML=pageHead('Draft Grades','Midseason report cards.')+'<div class="empty"><div class="big">🎓</div><b>No draft grades yet</b></div>';return}
 const L=G.leagues[grSel];const gc=g=>/^A/.test(g)?'bull':/^[DF]/.test(g)?'bear':'';const tm=n=>L.teams.find(t=>t.name===n)||{};
 let h=pageHead('Draft Grades',`Through Week ${esc(G.meta.through_week)} · graded ${esc(G.meta.generated)}.`)+`<div class="subtabs">${G.leagues.map((l,i)=>`<button data-gi="${i}" class="${i===grSel?'on':''}">${esc(l.label)}</button>`).join('')}</div>`;
 const me=L.teams.find(t=>t.me),fr=L.teams.find(t=>t.freddy);
 h+=`<div class="kpis" style="margin-top:8px">${me?`<div class="kpi"><b class="${gc(me.grade)}">${esc(me.grade)}</b><span>Poncho · #${me.grade_rank}</span></div>`:''}${fr?`<div class="kpi"><b class="${gc(fr.grade)}">${esc(fr.grade)}</b><span>Freddy · #${fr.grade_rank}</span></div>`:''}${me?`<div class="kpi"><b>${f2(me.gpa)}</b><span>Your GPA</span></div>`:''}${fr?`<div class="kpi"><b>${f2(fr.gpa)}</b><span>Freddy GPA</span></div>`:''}</div>`;
 if(L.meme)h+=`<h2>😂 Meme of the grades</h2><div class="memes"><a href="${esc(L.meme.src)}" target="_blank"><img loading="lazy" src="${esc(L.meme.src)}" alt="draft grades meme"></a></div>`;
 h+=`<h2>📋 Report card</h2><div class="tblwrap"><table><thead><tr><th>#</th><th>Team</th><th>Grade</th><th>GPA</th><th>Record</th><th>Superlative</th></tr></thead><tbody>${L.teams.map(t=>`<tr class="${tcls(t)}"><td>${t.grade_rank}</td><td><b>${esc(t.name)}</b>${tag(t)}<div class="muted small">${esc(t.owner)}${t.nick?' · “'+esc(t.nick)+'”':''}</div></td><td><b class="${gc(t.grade)}" style="font:900 20px Impact">${esc(t.grade)}</b></td><td>${f2(t.gpa)}</td><td>${t.w}-${t.l}${t.t?'-'+t.t:''}<div class="muted small">PF #${t.pf_rank??'—'}</div></td><td class="small" style="min-width:200px">${esc(t.sup||'')}</td></tr>`).join('')}</tbody></table></div>
 <div class="muted small">Records here are as of the grading (through Week ${esc(G.meta.through_week)}).</div>`;
 const pk=p=>`<div class="small" style="margin:3px 0"><b>${esc(p.name)}</b> <span class="muted">${esc(p.pos)} ${esc(p.nfl||'')}</span> · ${p.pick?'pick '+p.pick:'ADP '+f1(p.adp)} → <b>${esc(p.pos)}${p.prank??'?'}</b> (${f1(p.pts)} pts) <span class="muted">· ${esc(p.team||'')}</span>${tag(tm(p.team))}</div>`;
 h+=`<div class="grid two"><div class="card"><h3>💰 Biggest steals</h3>${L.steals.map(pk).join('')}</div><div class="card"><h3>💀 Biggest busts</h3>${L.busts.map(pk).join('')}</div></div>`;
 if((L.board||[]).length)h+=`<h2>🔁 If we drafted again today (top 15)</h2><div class="tblwrap"><table><thead><tr><th>New</th><th>Player</th><th>Orig.</th><th>Drafted by</th><th>Now on</th></tr></thead><tbody>${L.board.map(b=>{const o=tm(b.now_team);return `<tr class="${tcls(o)}"><td><b>${b.new}</b></td><td><b>${esc(b.name)}</b> <span class="muted small">${esc(b.pos)}</span></td><td>${b.orig??'—'}</td><td class="small">${esc(b.orig_team||'')}</td><td class="small">${esc(b.now_team||'')}${tag(o)}</td></tr>`}).join('')}</tbody></table></div>`;
 h+=`<h2>📝 Full write-up</h2><div class="card"><details><summary style="margin:0">How the grades work</summary><div class="mdbody">${G.intro_html}</div></details></div><div class="card"><details open><summary style="margin:0"><span style="color:var(--chalk)">${esc(L.label)}: every team, every pick</span></summary><div class="mdbody">${L.html}</div></details></div>`;
 app.innerHTML=h;app.querySelectorAll('[data-gi]').forEach(b=>b.onclick=()=>{grSel=+b.dataset.gi;go('grades')});
 app.querySelectorAll('.mdbody table').forEach(t=>{const w=document.createElement('div');w.className='tblwrap';t.parentNode.insertBefore(w,t);w.appendChild(t)})};

function go(tab){
 if(!T[tab])tab='home';
 const g=GROUP_OF[tab]||'home';
 setGroup(g);
 charts.splice(0).forEach(c=>c.destroy());
 document.querySelectorAll('#tabs [data-tab]').forEach(b=>b.classList.toggle('on',b.dataset.tab===tab));
 T[tab]();
 if(location.hash!=='#'+tab)history.replaceState(null,'','#'+tab);
 window.scrollTo(0,0);
 const ab=document.querySelector('#tabs button.on');
 if(ab&&ab.scrollIntoView)ab.scrollIntoView({inline:'center',block:'nearest'});
}
document.querySelectorAll('#tabs [data-tab]').forEach(b=>b.onclick=()=>go(b.dataset.tab));
document.querySelectorAll('#groups [data-group]').forEach(b=>b.onclick=()=>{
 const g=b.dataset.group;
 const first=[...document.querySelectorAll('#tabs [data-tab]')].find(x=>x.dataset.group===g);
 go(first?first.dataset.tab:(g==='home'?'home':'feed'));
});

/* ===== Global jump / search ===== */
(function setupJump(){
 const input=$('#jump'), menu=$('#jumpmenu'); if(!input||!menu) return;
 const tabs=[
  {tab:'home',label:'Overview / Home',kind:'tab'},
  {tab:'teams',label:'My Teams',kind:'tab'},
  {tab:'matchup',label:'This Week Matchup',kind:'tab'},
  {tab:'league',label:'League hub',kind:'tab'},
  {tab:'trends',label:'Scoring Trends',kind:'tab'},
  {tab:'value',label:'Dynasty Value',kind:'tab'},
  {tab:'bench',label:'Bench left',kind:'tab'},
  {tab:'shame',label:'Hall of Shame',kind:'tab'},
  {tab:'grades',label:'Draft Grades',kind:'tab'},
  {tab:'feed',label:'Episode Feed',kind:'tab'},
  {tab:'wraps',label:'Mag & Archives (Sicko Mag, wraps, Freddy)',kind:'tab'},
  {tab:'players',label:'Players',kind:'tab'},
  {tab:'hosts',label:'Hosts',kind:'tab'},
  {tab:'debates',label:'Host Debates',kind:'tab'},
  {tab:'board',label:'Consensus Board',kind:'tab'},
  {tab:'accuracy',label:'Host Accuracy Leaderboard',kind:'tab'},
  {tab:'preds',label:'Predictions',kind:'tab'},
 ];
 let items=[], sel=0;
 const close=()=>{menu.hidden=true;menu.innerHTML='';items=[];sel=0};
 const open=(list)=>{
  items=list; sel=0;
  if(!list.length){menu.innerHTML='<div class="jumpitem muted">No matches</div>';menu.hidden=false;return}
  menu.innerHTML=list.map((it,i)=>`<button type="button" class="jumpitem ${i===0?'on':''}" data-i="${i}"><span class="kind">${esc(it.kind)}</span><span class="lab">${esc(it.label)}</span><span class="meta">${esc(it.meta||'')}</span></button>`).join('');
  menu.hidden=false;
  menu.querySelectorAll('.jumpitem[data-i]').forEach(b=>{
   b.onmouseenter=()=>{sel=+b.dataset.i;menu.querySelectorAll('.jumpitem').forEach((x,j)=>x.classList.toggle('on',j===sel))};
   b.onclick=()=>run(items[+b.dataset.i]);
  });
 };
 const run=(it)=>{if(!it)return; close(); input.value='';
  if(it.kind==='player') jumpTo('players',{playerQ:it.label});
  else if(it.kind==='host') jumpTo('hosts');
  else jumpTo(it.tab);
 };
 const search=()=>{
  const q=input.value.trim().toLowerCase();
  if(!q){close();return}
  const out=[];
  for(const t of tabs){if(t.label.toLowerCase().includes(q)||t.tab.includes(q)) out.push({...t,meta:'Jump'})}
  for(const p of (D.players||[])){
   if(out.length>40) break;
   if((p.name||'').toLowerCase().includes(q)||(p.team||'').toLowerCase().includes(q))
    out.push({kind:'player',label:p.name,meta:(p.pos||'')+' '+(p.team||'')+(p.my_teams&&p.my_teams.length?' · yours':'')});
  }
  for(const h of (D.hosts||[]).slice(0,200)){
   if(out.length>50) break;
   if((h.name||'').toLowerCase().includes(q)) out.push({kind:'host',label:h.name,meta:(h.n_takes||0)+' takes',tab:'hosts'});
  }
  open(out.slice(0,40));
 };
 input.oninput=search;
 input.onkeydown=e=>{
  if(menu.hidden) return;
  if(e.key==='ArrowDown'){e.preventDefault();sel=Math.min(sel+1,items.length-1);menu.querySelectorAll('.jumpitem').forEach((x,j)=>x.classList.toggle('on',j===sel));}
  else if(e.key==='ArrowUp'){e.preventDefault();sel=Math.max(sel-1,0);menu.querySelectorAll('.jumpitem').forEach((x,j)=>x.classList.toggle('on',j===sel));}
  else if(e.key==='Enter'){e.preventDefault();run(items[sel]);}
  else if(e.key==='Escape'){close();input.blur();}
 };
 document.addEventListener('click',e=>{if(!e.target.closest('#jumpwrap')) close()});
})();


/* Mobile drawer + bottom nav */
(function setupShell(){
 const open=()=>{document.body.classList.add('nav-open'); const s=$('#scrim'); if(s) s.hidden=false};
 const close=()=>{document.body.classList.remove('nav-open'); const s=$('#scrim'); if(s) s.hidden=true};
 const mb=$('#menuBtn'); if(mb) mb.onclick=open;
 const sc=$('#sidebarClose'); if(sc) sc.onclick=close;
 const scrim=$('#scrim'); if(scrim) scrim.onclick=close;
 document.querySelectorAll('#bottomNav [data-group]').forEach(b=>b.onclick=()=>{
  const g=b.dataset.group;
  const first=[...document.querySelectorAll('#tabs [data-tab]')].find(x=>x.dataset.group===g);
  go(first?first.dataset.tab:(g==='home'?'home':'feed'));
 });
})();

window.__ffGo=go;
const boot=(location.hash||'#home').slice(1);
go(boot in T?boot:'home');
window.addEventListener('hashchange',()=>{const t=(location.hash||'#home').slice(1); if(t in T) go(t)});
})();
