/* Gridiron Guru Running Rankings tab — self-contained; data from assets/rankings_data.js (window.RANKINGS) */
(function(){
 const T=window.__ffT,GROUP_OF=window.__ffGroupOf,go=window.__ffGo;if(!T)return;
 GROUP_OF.rankings='leagues';
 const R=window.RANKINGS; const st={li:0,h:'week',pos:'QB',mine:false,q:''};
 const e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const arrow=r=>r.delta==null?(r.new?'<span class="bull small">NEW</span>':'<span class="muted">–</span>'):r.delta>0?`<span class="bull">▲${r.delta}</span>`:r.delta<0?`<span class="bear">▼${-r.delta}</span>`:'<span class="muted">=</span>';
 T.rankings=()=>{const app=document.getElementById('app');
  if(!R){app.innerHTML='<div class="empty"><div class="big">🏅</div><b>No rankings yet</b>Run /workspace/rankings/build_rankings.py</div>';return}
  const L=R.leagues[st.li]; const flexLbl=L.superflex?'SF Overall':'Flex (RB/WR/TE)';
  const key=`${st.h}_${st.pos}`; let rows=(L.boards[key]||[]);
  if(st.mine)rows=rows.filter(r=>r.mine); if(st.q)rows=rows.filter(r=>(r.name+' '+r.nfl).toLowerCase().includes(st.q));
  const valLbl=st.h==='week'?`Wk ${R.week} proj`:(L.horizon==='dynasty'?'Dyn score':'ROS pts');
  const btn=(a,v,l)=>`<button data-rk="${a}" data-v="${v}" class="${String(st[a])===String(v)?'on':''}">${l}</button>`;
  let h=`<div class="page-head"><h1>🏅 Running Rankings</h1><p class="muted">Gridiron Guru's own board · ${e(R.generated)} · Week ${R.week} + rest of season · ⭐ = Poncho's player</p></div>
  <div class="subtabs">${R.leagues.map((l,i)=>btn('li',i,e(l.label))).join('')}</div>
  <div class="subtabs">${btn('h','week','This week (Wk '+R.week+')')}${btn('h','ros',L.horizon==='dynasty'?'Dynasty / long-term':'Rest of season')}</div>
  <div class="subtabs">${['QB','RB','WR','TE'].map(p=>btn('pos',p,p)).join('')}${btn('pos','FLEX',flexLbl)}
   <button data-mine="1" class="${st.mine?'on':''}">⭐ My guys only</button> <input id="rkq" placeholder="Search…" value="${e(st.q)}" style="margin-left:8px"></div>
  <div class="muted small" style="margin:6px 0">${e(L.team)} · ${e(L.site)} · ${L.n_teams||''} teams · starters: ${e(L.slots.join(' '))} · scoring: ${e(Object.entries(L.scoring_summary).map(([k,v])=>k+' '+v).join(', '))}${L.assumptions.length?'<br>⚠️ '+e(L.assumptions.join(' ')):''}</div>
  <div class="scard"><div class="scard-body flush"><div class="tblwrap"><table><thead><tr><th>#</th><th>Trend</th><th>Tier</th><th>Player</th><th>${valLbl}</th><th>PPG (league)</th><th>Hosts</th><th>Why</th></tr></thead><tbody>
  ${rows.map((r,i)=>{const nt=i&&rows[i-1].tier!==r.tier&&!st.mine&&!st.q;return `${nt?`<tr><td colspan="8" class="muted small" style="border-top:2px solid var(--gold,#c9a227)">Tier ${r.tier}</td></tr>`:''}<tr class="${r.mine?'me':''}"><td><b>${r.rank}</b></td><td>${arrow(r)}</td><td>T${r.tier}</td><td><b>${r.mine?'⭐ ':''}${e(r.name)}</b> <span class="muted small">${e(r.pos)} ${e(r.nfl||'FA')}${r.age?' · '+r.age+'y':''}</span>${r.inj?` <span class="bear small">${e(r.inj)}</span>`:''}</td><td><b>${r.val}</b></td><td>${r.ppg||'—'}</td><td class="${r.hs>0.2?'bull':r.hs<-0.2?'bear':'muted'}">${r.hs>0?'+':''}${r.hs}</td><td class="small" style="min-width:240px">${e(r.why)}${r.quote?`<div class="muted">${e(r.quote)}</div>`:''}</td></tr>`}).join('')}
  </tbody></table></div></div></div><details class="muted small" style="margin-top:10px"><summary>How this is built</summary>${e(R.method)}</details>`;
  app.innerHTML=h;
  app.querySelectorAll('[data-rk]').forEach(b=>b.onclick=()=>{const a=b.dataset.rk;st[a]=a==='li'?+b.dataset.v:b.dataset.v;T.rankings()});
  app.querySelector('[data-mine]').onclick=()=>{st.mine=!st.mine;T.rankings()};
  const q=app.querySelector('#rkq');q.oninput=()=>{st.q=q.value.toLowerCase();const p=q.selectionStart;T.rankings();const n=app.querySelector('#rkq');n.focus();n.setSelectionRange(p,p)};
 };
 const nav=(performance.getEntriesByType&&performance.getEntriesByType('navigation')[0]||{}).name||'';
 if(location.hash==='#rankings'||/#rankings$/.test(nav))go('rankings');
})();
