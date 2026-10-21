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
const charts=[];function chart(el,cfg){charts.push(new Chart(el,cfg))}
if(window.Chart){Chart.defaults.color='#8fa89b';Chart.defaults.borderColor='#24392f';Chart.defaults.font.family='system-ui,sans-serif'}
$('#builtAt').textContent=`Updated ${D.meta.built||'—'} ${D.meta.tz||''}`;
const C=D.meta.counts||{};$('#counts').innerHTML=[['eps',C.episodes],['players',C.players],['takes',C.takes]].map(([k,v])=>`<span class="pill"><b>${v||0}</b> ${k}</span>`).join('');

function sortable(tbl,rows,cols,render){let key=null,asc=false;const th=tbl.querySelectorAll('th');
 th.forEach((h,i)=>h.onclick=()=>{const k=cols[i];if(!k)return;asc=key===k?!asc:false;key=k;th.forEach(x=>x.classList.remove('s','asc'));h.classList.add('s');if(asc)h.classList.add('asc');
 rows.sort((a,b)=>{const x=k(a),y=k(b);return (x>y?1:x<y?-1:0)*(asc?1:-1)});render()})}

const T={};
T.feed=()=>{let h='';
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
 if(!P.length){app.innerHTML='<h2>Master player table</h2>'+WAIT();return}
 const hostNames=[...new Set(P.flatMap(p=>Object.keys(p.hosts)))];
 app.innerHTML=`<h2>Most-discussed · take sentiment</h2><div class="card"><div id="cMentBox" style="position:relative"><canvas id="cMent" style="max-height:none"></canvas></div></div>
 <h2>Master player table</h2><div class="filters"><input id="q" placeholder="Search player / team / stat…">
 <select id="fs"><option value="">All shows</option>${D.meta.shows.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select>
 <select id="fp"><option value="">All pos</option>${['QB','RB','WR','TE','K','DEF'].map(x=>`<option>${x}</option>`).join('')}</select>
 <select id="fh"><option value="">All hosts</option>${hostNames.map(h=>`<option>${esc(h)}</option>`).join('')}</select>
 <select id="fm"><option value="">All players</option><option value="mine">On my teams</option></select></div>
 <div class="tblwrap"><table id="pt"><thead><tr><th>Player</th><th>Pos</th><th>Men.</th><th>🎧 Said</th><th>Net</th><th>Bull/Bear</th><th>Host sentiment</th><th>Shows</th><th>Stats cited</th><th>Last</th></tr></thead><tbody></tbody></table></div>`;
 const top=P.slice().sort((a,b)=>(b.caption_mentions||0)-(a.caption_mentions||0)||b.n_takes-a.n_takes).slice(0,15);
 $('#cMentBox').style.height=Math.max(200,top.length*24+60)+'px';chart($('#cMent'),{type:'bar',data:{labels:top.map(p=>p.name),datasets:[{label:'Bull',data:top.map(p=>p.bull),backgroundColor:'#2ee59d'},{label:'Neutral',data:top.map(p=>p.neutral),backgroundColor:'#56645d'},{label:'Bear',data:top.map(p=>p.bear),backgroundColor:'#ff5c6c'}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,scales:{x:{stacked:true,ticks:{precision:0}},y:{stacked:true,ticks:{autoSkip:false,font:{size:11}}}},plugins:{legend:{position:'bottom'}}}});
 
 const rows=P.slice();const tb=$('#pt tbody');
 const render=()=>{const q=$('#q').value.toLowerCase(),fs=$('#fs').value,fp=$('#fp').value,fh=$('#fh').value,fm=$('#fm').value;
  tb.innerHTML=rows.filter(p=>(!q||(p.name+' '+p.team+' '+p.stats.join(' ')).toLowerCase().includes(q))&&(!fs||p.shows[fs])&&(!fp||p.pos===fp)&&(!fh||p.hosts[fh])&&(!fm||(p.my_teams||[]).length)).map(p=>`<tr>
  <td><b>${esc(p.name)}</b> ${(p.my_teams||[]).map(t=>`<span class="chip" style="color:var(--gold)">${esc(t)}</span>`).join('')}<div class="muted small">${esc(p.team)}</div></td><td>${esc(p.pos)}</td><td>${p.mentions}${p.n_takes>p.mentions?`<div class="muted small">${p.n_takes} takes</div>`:''}</td><td>${p.caption_mentions??'<span class="muted">–</span>'}</td><td>${sent(p.score)}</td>
  <td><div class="bar" style="width:70px"><i style="width:${100*p.bull/p.mentions}%;background:var(--bull)"></i><i style="width:${100*p.neutral/p.mentions}%;background:#56645d"></i><i style="width:${100*p.bear/p.mentions}%;background:var(--bear)"></i></div><span class="small">${p.bull}/${p.bear}</span></td>
  <td>${Object.entries(p.hosts).map(([h,v])=>`<div class="small">${sent(v.avg)} ${esc(h)} <span class="muted">×${v.n}</span></div>`).join('')}</td>
  <td>${Object.keys(p.shows).map(showTag).join(' ')}</td>
  <td><div class="chips">${p.stats.slice(0,8).map(x=>`<span class="chip">${esc(x)}</span>`).join('')}${p.stats.length>8?`<span class="chip">+${p.stats.length-8}</span>`:''}</div></td><td class="small">${esc(p.last)}</td></tr>`).join('')||`<tr><td colspan="10" class="muted">No matches.</td></tr>`};
 ['q','fs','fp','fh','fm'].forEach(i=>$('#'+i).oninput=render);
 sortable($('#pt'),rows,[p=>p.name,p=>p.pos,p=>p.mentions,p=>p.caption_mentions||0,p=>p.score,p=>p.bull-p.bear,null,p=>Object.keys(p.shows).length,p=>p.stats.length,p=>p.last],render);render()};

T.hosts=()=>{const H=D.hosts;
 if(!H.length){app.innerHTML='<h2>Host profiles</h2>'+WAIT();return}
 let h=`<h2>Bullish vs bearish meter</h2><div class="card"><canvas id="cHost"></canvas></div><h2>Host profiles</h2><div class="grid two">`;
 for(const x of H){const pr=x.profiles[0];
  h+=`<div class="card"><h3>🎙️ ${esc(x.name)}</h3><div class="muted small">${Object.keys(x.shows).map(showTag).join(' ')} · ${x.episodes} eps · ${x.n_takes} takes ${x.bull_pct!=null?'· '+x.bull_pct+'% bullish':''}</div>
  <div class="grid two" style="margin-top:8px"><div><div class="small bull"><b>Most bullish on</b></div>${x.most_bullish.map(p=>`<div class="small">▲ ${esc(p.player)} <span class="muted">(${p.score})</span></div>`).join('')||'<div class="muted small">—</div>'}</div>
  <div><div class="small bear"><b>Most bearish on</b></div>${x.most_bearish.map(p=>`<div class="small">▼ ${esc(p.player)} <span class="muted">(${p.score})</span></div>`).join('')||'<div class="muted small">—</div>'}</div></div>
  ${pr?`<details open><summary>Latest profile · ${esc(pr.date)}</summary>${Object.entries(pr.fields||{}).map(([k,v])=>`<div class="small"><b style="text-transform:capitalize">${esc(k)}:</b> ${esc(v.join(' · '))}</div>`).join('')||`<div class="small" style="white-space:pre-wrap">${esc(pr.text)}</div>`}</details>`:''}
  ${x.profiles.length>1?`<details><summary>Profile history (${x.profiles.length})</summary>${x.profiles.slice(1).map(p=>`<div class="small"><b>${esc(p.date)}</b> ${esc(p.title)}<div style="white-space:pre-wrap" class="muted">${esc(p.text)}</div></div>`).join('')}</details>`:''}</div>`}
 app.innerHTML=h+'</div>';
 const hs=H.filter(x=>x.n_takes);
 if(hs.length)chart($('#cHost'),{type:'bar',data:{labels:hs.map(x=>x.name),datasets:[{label:'Bullish',data:hs.map(x=>x.bull),backgroundColor:'#2ee59d'},{label:'Neutral',data:hs.map(x=>x.neutral),backgroundColor:'#56645d'},{label:'Bearish',data:hs.map(x=>-x.bear),backgroundColor:'#ff5c6c'}]},options:{responsive:true,scales:{x:{stacked:true},y:{stacked:true}},plugins:{legend:{position:'bottom'}}}});
 else $('#cHost').parentNode.innerHTML='<div class="muted small">No attributed takes yet.</div>'};

T.debates=()=>{const X=D.disagreements;
 if(!X.length){app.innerHTML='<h2>Disagreements</h2>'+WAIT('No host-vs-host disagreements logged yet.');return}
 app.innerHTML='<h2>Host vs host</h2>'+X.map(d=>{const head=`<div class="muted small">${showTag(d.show)} ${esc(d.date)} · ${esc(d.title)}</div>`;
  if(d.source==='computed')return `<div class="card">${head}<h3>${esc(d.player)}</h3><div class="vs"><div>${d.bull.map(t=>`<div class="take p"><b class="bull">▲ ${esc(t.host)}</b><div class="small">${esc(t.take)}</div></div>`).join('')}</div><div class="mid">VS</div><div>${d.bear.map(t=>`<div class="take n"><b class="bear">▼ ${esc(t.host)}</b><div class="small">${esc(t.take)}</div></div>`).join('')}</div></div></div>`;
  return `<div class="card">${head}${Object.entries(d.detail).map(([k,v])=>k==='text'?`<div>${esc(v)}</div>`:`<div class="small"><b>${esc(k)}:</b> ${esc(v)}</div>`).join('')}</div>`}).join('')};

T.preds=()=>{const L=D.leaderboard,P=D.predictions;let h='<h2>Accuracy leaderboard</h2>';
 if(!L.length)h+=WAIT('No graded predictions yet. The Tuesday report card fills this in.');
 else h+=(L.some(r=>r.pct!=null)?`<div class="card"><canvas id="cLb"></canvas></div>`:`<div class="empty"><div class="big">⏳</div><b>No predictions graded yet</b>All logged calls are still pending. The Tuesday report card grades them.</div>`)+`<div class="tblwrap"><table><thead><tr><th>#</th><th>Host</th><th>Show</th><th>Hit</th><th>Miss</th><th>Push</th><th>Pend.</th><th>Acc.</th></tr></thead><tbody>${L.map((r,i)=>`<tr><td>${i===0&&r.pct!=null?'🏆':i+1}</td><td><b>${esc(r.host)}</b></td><td class="small">${esc(SH[r.show]?.name||r.show)}</td><td class="bull">${r.hits}</td><td class="bear">${r.misses}</td><td>${r.push||0}</td><td>${r.pending||0}</td><td><b>${r.pct==null?'—':r.pct+'%'}</b></td></tr>`).join('')}</tbody></table></div>`;
 h+='<h2>Predictions log</h2>';
 if(!P.length)h+=WAIT('No predictions logged yet.');
 else{h+=`<div class="filters"><input id="pq" placeholder="Filter predictions…"><select id="pst"><option value="">All</option><option>pending</option><option>hit</option><option>miss</option><option>push</option><option>void</option></select></div><div class="tblwrap"><table><thead><tr><th>Date</th><th>Host</th><th>Prediction</th><th>Status</th></tr></thead><tbody id="pb"></tbody></table></div>`}
 app.innerHTML=h;
 if(L.some(r=>r.pct!=null)){const l=L.filter(r=>r.pct!=null);chart($('#cLb'),{type:'bar',data:{labels:l.map(r=>r.host),datasets:[{label:'Accuracy %',data:l.map(r=>r.pct),backgroundColor:'#ffc83d'}]},options:{scales:{y:{min:0,max:100}},plugins:{legend:{display:false}}}})}
 if(P.length){const icon={hit:'✅',miss:'❌',push:'🟡',pending:'⏳',void:'⚪'};const r=()=>{const q=$('#pq').value.toLowerCase(),s=$('#pst').value;
  $('#pb').innerHTML=P.filter(p=>(!s||p.status===s)&&(!q||JSON.stringify(p).toLowerCase().includes(q))).map(p=>`<tr><td class="small">${esc(p.date)}${p.week?'<br>Wk '+esc(p.week):''}</td><td>${esc(p.host)}<div>${showTag(p.show)}</div></td><td>${p.player?`<b>${esc(p.player)}</b>: `:''}${esc(p.prediction)}${p.conf?` <span class="muted small">(conf ${esc(p.conf)})</span>`:''}</td><td>${icon[p.status]} ${esc(p.result||p.status)}</td></tr>`).join('')};
  $('#pq').oninput=$('#pst').onchange=r;r()}};

T.accuracy=()=>{const A=D.accuracy;if(!A||!(A.hosts||[]).length){app.innerHTML='<div class="empty"><div class="big">🏹</div><b>No graded calls yet</b>The Tuesday report card fills this in.</div>';return}
 const pc=v=>v==null?'—':v+'%',ic={hit:'✅',miss:'❌',push:'➖',void:'⚪'},cell=v=>v&&(v.hit+v.miss+v.push)?`${pc(v.pct)} <span class="muted small">${v.hit}-${v.miss}-${v.push}</span>`:'';
 const G=A.hosts.filter(r=>r.graded),t=A.totals;let rk=0;
 let h=`<h2>🏹 Host Accuracy</h2><div class="muted small">2026 season, graded through Week ${esc(A.through_week)} (updated ${esc(A.updated)}). ${esc(A.method)}</div>
 <div class="card"><b>${t.hit} hits · ${t.miss} misses · ${t.push} pushes</b> <span class="muted">(${pc(t.pct)}), ${t.void} voids</span></div>
 <div class="card"><canvas id="cAcc"></canvas></div>
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
 h+=`<h2>🗂️ Every graded call</h2><div class="filters"><input id="aq" placeholder="Filter calls…"><select id="ast"><option value="">All</option><option>hit</option><option>miss</option><option>push</option><option>void</option></select></div><div class="tblwrap"><table><thead><tr><th>Wk</th><th>Host</th><th>Call</th><th>Grade</th></tr></thead><tbody id="ab"></tbody></table></div>`;
 if((A.reports||[]).length)h+=`<h2>📝 Weekly report cards</h2>${A.reports.map((r,i)=>`<div class="card"><details ${i===0?'open':''}><summary style="margin:0">${esc(r.title)} <span class="muted small">${esc(r.file)}</span></summary><div class="mdbody">${r.html}</div></details></div>`).join('')}`;
 app.innerHTML=h;
 const l=G;chart($('#cAcc'),{type:'bar',data:{labels:l.map(r=>r.host),datasets:[{label:'Hit rate %',data:l.map(r=>r.pct),backgroundColor:'#ffc83d'}]},options:{scales:{y:{min:0,max:100}},plugins:{legend:{display:false}}}});
 const C=A.calls||[];const r=()=>{const q=$('#aq').value.toLowerCase(),s=$('#ast').value;$('#ab').innerHTML=C.filter(c=>(!s||c.status===s)&&(!q||JSON.stringify(c).toLowerCase().includes(q))).map(c=>`<tr><td>${c.week}</td><td>${esc(c.hosts.join(' + '))}<div class="muted small">${esc((SH[c.show]||{}).name||c.show)} ${esc(c.ep)} ${esc(c.time)} · ${esc(c.type)} · ${esc(c.pos)}</div></td><td>${esc(c.call)}${c.poncho?`<div class="small" style="color:#ffc83d">🛡️ ${esc(c.poncho)}</div>`:''}</td><td>${ic[c.status]} ${esc(c.status)}<div class="small muted">${esc(c.note)}</div></td></tr>`).join('')};
 $('#aq').oninput=$('#ast').onchange=r;r()};

T.board=()=>{const B=D.board||{};const tot=(B.consensus_start||[]).length+(B.consensus_fade||[]).length+(B.contrarian||[]).length;
 if(!B.window||!tot){app.innerHTML='<h2>Consensus vs contrarian</h2>'+WAIT('Needs at least two shows or hosts weighing in on the same player this week.');return}
 const card=i=>`<div class="card"><h3>${esc(i.player)} <span class="muted small">${esc(i.pos)} ${esc(i.team)}</span> ${sent(i.score)}</h3>${Object.entries(i.voices).map(([k,v])=>`<div class="small">${sent(v)} ${esc(k)}</div>`).join('')}</div>`;
 app.innerHTML=`<div class="muted small" style="margin-top:10px">Window: ${esc(B.window[0])} → ${esc(B.window[1])}</div>
 <h2 class="bull">✅ Consensus starts</h2>${(B.consensus_start||[]).map(card).join('')||'<div class="muted">None yet.</div>'}
 <h2 class="bear">🚫 Consensus fades</h2>${(B.consensus_fade||[]).map(card).join('')||'<div class="muted">None yet.</div>'}
 <h2 style="color:var(--gold)">⚔️ Contrarian splits</h2>${(B.contrarian||[]).map(card).join('')||'<div class="muted">None yet.</div>'}`};

let teamSel=0;
T.teams=()=>{const TM=D.myteams;if(!TM.length){app.innerHTML=WAIT('No leagues loaded.');return}
 const t=TM[teamSel];const m=t.matchup;
 let h=`<div class="subtabs">${TM.map((x,i)=>`<button data-i="${i}" class="${i===teamSel?'on':''}">${esc(x.label)}</button>`).join('')}</div>
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
 if((t.weekly||[]).length)chart($('#cWk'),{type:'line',data:{labels:t.weekly.map(w=>'Wk '+w.week),datasets:[{label:t.team,data:t.weekly.map(w=>w.pts),borderColor:'#3ddc84',backgroundColor:'#3ddc8433',fill:true,tension:.3},{label:'Opponent',data:t.weekly.map(w=>w.opp_pts),borderColor:'#ff5c6c',tension:.3},{label:'League median',data:t.weekly.map(w=>w.league_median),borderColor:'#8fa89b',borderDash:[4,4],tension:.3}]},options:{plugins:{legend:{position:'bottom'}}}})};

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

T.wraps=()=>{const A=D.archive||{sections:[],memes:[]};let h='';
 const secs=A.sections||[];
 h+=`<div class="subtabs scrollx">${secs.map((s,i)=>`<button data-ai="${i}" class="${i===(T._ai||0)?'on':''}">${s.icon} ${esc(s.label.replace('Sunday ',''))} <span class="muted">${s.items.length}</span></button>`).join('')}</div>`;
 const s=secs[T._ai||0];
 if(!s){app.innerHTML=h+`<div class="empty"><b>No archives yet</b></div>`;return}
 h+=`<h2>${s.icon} ${esc(s.label)}</h2>`;
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

T.league=()=>{if(!LG.length){app.innerHTML=NOLG;return}
 const L=LG[lgSel],S=L.standings,W=L.weeks;let h=lgTabs()+`<div class="muted small" style="margin-top:6px">${esc(L.name)} · ${L.n_teams} teams · ${L.ppr} PPR · ${L.pass_td}-pt pass TD · FAAB $${L.faab_budget}</div>`+liveNote(L);
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
 const P=['QB','RB','WR','TE','K','DEF'].filter(p=>S.some(s=>s.pos_pts[p])),col={QB:'#ff5c6c',RB:'#2ee59d',WR:'#1f8fff',TE:'#ffc83d',K:'#a855f7',DEF:'#8fa89b'};
 chart($('#cPos'),{type:'bar',data:{labels:S.map(s=>s.team+(s.me?' (YOU)':s.freddy?' (FREDDY)':'')),datasets:P.map(p=>({label:p,data:S.map(s=>s.pos_pts[p]||0),backgroundColor:col[p]}))},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,scales:{x:{stacked:true},y:{stacked:true,ticks:{autoSkip:false,font:{size:10}}}},plugins:{legend:{position:'bottom'}}}});
 const ts=()=>{const p=$('#tsp').value;$('#tsb').innerHTML=L.top_scorers.filter(x=>!p||x.pos===p).slice(0,25).map((x,i)=>{const o=byName(L,x.owner);return `<tr class="${tcls(o)}"><td>${i+1}</td><td><b>${esc(x.name)}</b> <span class="muted small">${esc(x.pos)} ${esc(x.nfl)}</span></td><td><b>${f1(x.pts)}</b></td><td>${x.gp}</td><td>${f1(x.avg)}</td><td class="small">${esc(x.owner)}${tag(o)}</td></tr>`}).join('')};$('#tsp').onchange=ts;ts()};

T.matchup=()=>{if(!LG.length){app.innerHTML=NOLG;return}
 const L=LG[lgSel],M=L.preview;let h=lgTabs();
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

T.bench=()=>{if(!LG.length){app.innerHTML=NOLG;return}
 let h=`<div class="muted small" style="margin-top:8px">Points left on the bench = best possible lineup − actual score, season to date (final weeks).</div>`;
 LG.forEach((L,i)=>{const B=L.bench;h+=`<h2>${esc(L.label)}</h2><div class="card"><div style="position:relative;height:${B.length*28+50}px"><canvas id="cB${i}" style="max-height:none"></canvas></div></div>
 <div class="tblwrap"><table><thead><tr><th>Team</th><th>Left</th><th>Eff.</th>${L.final_weeks.map(w=>`<th>Wk ${w}</th>`).join('')}${L.live_week?`<th>Wk ${L.live_week} <span class="live">LIVE</span></th>`:''}<th>Worst call</th></tr></thead><tbody>${B.map(b=>`<tr class="${tcls(b)}"><td>${esc(b.team)}${tag(b)}</td><td class="bear"><b>${f1(b.bench_left)}</b></td><td>${f1(b.eff)}%</td>${b.weekly.map(v=>`<td>${f1(v)}</td>`).join('')}${L.live_week?`<td class="muted">${f1(b.live)}</td>`:''}<td class="small" style="min-width:220px">${b.worst?`Wk ${b.worst.week}: ${esc(b.worst.benched)} ${f1(b.worst.benched_pts)} sat for ${esc(b.worst.started)} ${f1(b.worst.started_pts)}`:'—'}</td></tr>`).join('')}</tbody></table></div>`});
 app.innerHTML=h;
 LG.forEach((L,i)=>{const B=L.bench;chart($('#cB'+i),{type:'bar',data:{labels:B.map(b=>b.team+(b.me?' (YOU)':b.freddy?' (FREDDY)':'')),datasets:[{label:'Bench points left',data:B.map(b=>b.bench_left),backgroundColor:B.map(b=>b.me?'#ffc83d':b.freddy?'#ff6fb5':'#3a5a4b')}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,scales:{y:{ticks:{autoSkip:false,font:{size:10}}}},plugins:{legend:{display:false}}}})})};

function spark(weeks,lab){const v=weeks.map(w=>w.pts?w.pts[lab]:null),mx=Math.max(5,...v.map(x=>x||0));const bw=100/weeks.length;
 return `<svg viewBox="0 0 100 44" preserveAspectRatio="none" class="spark">${weeks.map((w,i)=>{const x=v[i];if(x==null||!w.played)return `<text x="${i*bw+bw/2}" y="40" font-size="6" text-anchor="middle" fill="#56645d">${w.played===false&&w.pts?'0':'–'}</text>`;const hh=Math.max(1,36*Math.max(0,x)/mx);return `<rect x="${i*bw+bw*.15}" y="${38-hh}" width="${bw*.7}" height="${hh}" rx="1" fill="${w.live?'#8fa89b':'#3ddc84'}"/><text x="${i*bw+bw/2}" y="${Math.max(6,36-hh)}" font-size="5.5" text-anchor="middle" fill="#e8f1ec">${x.toFixed(0)}</text>`}).join('')}</svg><div class="sparkx">${weeks.map(w=>`<span>${w.week}</span>`).join('')}</div>`}
T.trends=()=>{const R=(D.league&&D.league.trends)||[];if(!R.length){app.innerHTML=NOLG;return}
 const lab=['all',...new Set(R.flatMap(r=>r.leagues))];T._tl=T._tl||'all';
 let h=`<div class="subtabs">${lab.map(l=>`<button data-tl="${esc(l)}" class="${T._tl===l?'on':''}">${l==='all'?'Both':esc(l)}</button>`).join('')}</div><div class="muted small">Your rostered players. Fantasy points use each league's scoring, from Sleeper's free weekly stats. Grey bar = live week.</div><div class="grid two">`;
 for(const r of R.filter(r=>T._tl==='all'||r.leagues.includes(T._tl))){const L0=T._tl==='all'?r.leagues[0]:T._tl;
  const tr=k=>r.weeks.map(w=>w[k]==null?'–':k==='snap'?Math.round(w[k])+'%':(+w[k]).toFixed(0));
  const rowsDef=r.pos==='QB'?[['Pass yds','pass_yd'],['Carries','car'],['TDs','td'],['Snap %','snap']]:r.pos==='K'||r.pos==='DEF'?[]:[['Snap %','snap'],['Targets','tgt'],['Catches','rec'],['Carries','car'],['Scrim yds','yds']];
  h+=`<div class="card tc"><div style="display:flex;justify-content:space-between"><div><b>${esc(r.name)}</b>${r.inj?`<span class="inj">${esc(r.inj)}</span>`:''}<div class="muted small">${esc(r.pos)} ${esc(r.nfl)}${r.age?' · age '+r.age:''} · ${r.leagues.map(esc).join(' + ')}</div></div><div style="text-align:right"><b>${f1(r.avg[L0])}</b><div class="muted small">avg pts (${esc(L0)})</div></div></div>
  ${spark(r.weeks,L0)}
  ${rowsDef.length?`<table class="mini"><tbody>${rowsDef.map(([n,k])=>`<tr><td class="muted">${n}</td>${tr(k).map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table>`:''}</div>`}
 app.innerHTML=h+'</div>';app.querySelectorAll('[data-tl]').forEach(b=>b.onclick=()=>{T._tl=b.dataset.tl;go('trends')})};

T.value=()=>{const V=D.league&&D.league.dynasty;if(!V||V.error||!V.players){app.innerHTML=`<div class="empty"><div class="big">💎</div><b>Dynasty values unavailable</b>${esc((V&&V.error)||'The free value source could not be reached on the last build.')}</div>`;return}
 const fl=f=>`<span class="flag ${f}">${f}</span>`;
 let h=`<h2>💎 ${esc(V.team)} dynasty value board</h2><div class="muted small">Source: <a href="https://fantasycalc.com/dynasty-rankings" target="_blank" rel="noopener">FantasyCalc</a> public dynasty values (${esc(V.settings)}, matches your league), pulled ${esc(V.fetched)} ET. Values are trade-market based, built from real trades.</div>
 <div class="tblwrap" style="margin-top:8px"><table id="vt"><thead><tr><th>#</th><th>Player</th><th>Age</th><th>Value</th><th>30-day</th><th>Flag</th></tr></thead><tbody>${V.players.map((p,i)=>`<tr><td>${i+1}</td><td><b>${esc(p.name)}</b> <span class="muted small">${esc(p.pos)} ${esc(p.nfl)}${p.group!=='Roster'?' · '+p.group:''}</span>${p.rank?`<div class="muted small">overall #${p.rank} · ${esc(p.pos)}${p.pos_rank}</div>`:''}</td><td>${p.age??'—'}</td><td><b>${p.value??'—'}</b></td><td class="${(p.trend30||0)>0?'bull':(p.trend30||0)<0?'bear':''}">${p.trend30==null?'—':(p.trend30>0?'+':'')+p.trend30}</td><td>${fl(p.flag)}<div class="muted small">${esc(p.why)}</div></td></tr>`).join('')}</tbody></table></div>
 <h2>🎟️ Draft picks</h2>${V.picks.length?`<div class="tblwrap"><table><thead><tr><th>Pick</th><th>Value</th><th>30-day</th></tr></thead><tbody>${V.picks.map(p=>`<tr><td><b>${esc(p.name)}</b></td><td>${p.value??'—'}</td><td>${p.trend30==null?'—':(p.trend30>0?'+':'')+p.trend30}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty"><b>No future picks owned</b></div>'}
 <div class="muted small">${esc(V.pick_note)}</div>
 <h2>🏦 League value standings</h2><div class="tblwrap"><table><thead><tr><th>#</th><th>Team</th><th>Players</th><th>Picks</th><th>Total</th></tr></thead><tbody>${V.totals.map(t=>`<tr class="${tcls(t)}"><td>${t.rank}</td><td>${esc(t.team)}${tag(t)}<div class="muted small">${t.top.map(esc).join(', ')}</div></td><td>${t.players.toLocaleString()}</td><td>${t.picks.toLocaleString()}</td><td><b>${t.total.toLocaleString()}</b></td></tr>`).join('')}</tbody></table></div>
 ${V.freddy_players&&V.freddy_players.length?`<h2>🌸 Freddy's top assets (${esc(V.freddy_team)})</h2><div class="card">${V.freddy_players.map(p=>`<div class="small">${fl(p.flag)} <b>${esc(p.name)}</b> <span class="muted">${esc(p.pos)} · age ${p.age??'—'}</span> <b style="float:right">${p.value??'—'}</b></div>`).join('')}</div>`:''}
 <div class="muted small" style="margin-top:8px">${esc(V.flag_rules)}</div>`;
 app.innerHTML=h};

T.shame=()=>{if(!LG.length){app.innerHTML=NOLG;return}
 const L=LG[lgSel];let h=lgTabs()+`<div class="muted small" style="margin-top:6px">Every week's worst starts and worst start/sit calls across the whole league. Live weeks are provisional until games end.</div>`;
 if(!L.shame.length)h+='<div class="empty"><b>No weeks scored yet</b></div>';
 for(const w of L.shame){h+=`<h2>🤡 Week ${w.week}${w.live?' <span class="live">LIVE</span>':''}</h2><div class="grid two"><div class="card"><h3>💩 Worst starts</h3>${w.worst_starts.map((s,i)=>`<div class="small ${tcls(byName(L,s.team))}">${i===0?'👑':'·'} <b>${esc(s.player)}</b> <span class="muted">${esc(s.pos)} ${esc(s.nfl||'')}</span> <b class="bear">${f2(s.pts)}</b> <span class="muted">for ${esc(s.team)}</span>${tag(byName(L,s.team))}</div>`).join('')}</div>
 <div class="card"><h3>🪑 Worst start/sit calls</h3>${w.worst_decisions.length?w.worst_decisions.map(d=>`<div class="small"><b>${esc(d.team)}</b>${tag(byName(L,d.team))}: started ${esc(d.started)} (${f2(d.started_pts)}) over <b>${esc(d.benched)}</b> (${f2(d.benched_pts)}) <b class="bear">−${f2(d.delta)}</b></div>`).join(''):'<div class="muted small">Everybody set a sane lineup. Suspicious.</div>'}
 <div class="small muted" style="margin-top:6px">Most left on bench: ${w.bench_kings.map(b=>`${esc(b.team)} ${f1(b.bench_left)}`).join(' · ')}</div></div></div>`}
 app.innerHTML=h;bindLg('shame')};

let grSel=0;
T.grades=()=>{const G=D.grades;if(!G||!(G.leagues||[]).length){app.innerHTML='<div class="empty"><div class="big">🎓</div><b>No draft grades yet</b></div>';return}
 const L=G.leagues[grSel];const gc=g=>/^A/.test(g)?'bull':/^[DF]/.test(g)?'bear':'';const tm=n=>L.teams.find(t=>t.name===n)||{};
 let h=`<div class="subtabs">${G.leagues.map((l,i)=>`<button data-gi="${i}" class="${i===grSel?'on':''}">${esc(l.label)}</button>`).join('')}</div>
 <div class="muted small" style="margin-top:6px">Mid-season draft grades through Week ${esc(G.meta.through_week)}, using each league's real scoring. Graded ${esc(G.meta.generated)}. Team and owner names are refreshed from Sleeper.</div>`;
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

function go(tab){if(!T[tab])tab='feed';charts.splice(0).forEach(c=>c.destroy());document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===tab));T[tab]();if(location.hash!=='#'+tab)history.replaceState(null,'','#'+tab);window.scrollTo(0,0);const ab=document.querySelector('.tabs button.on');if(ab&&ab.scrollIntoView)ab.scrollIntoView({inline:'center',block:'nearest'})}
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>go(b.dataset.tab));
go((location.hash||'#feed').slice(1) in T?(location.hash||'#feed').slice(1):'feed');
})();
