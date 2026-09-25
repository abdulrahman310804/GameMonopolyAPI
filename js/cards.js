/* Per-player cards: current deeds, stored jail passes, and resolved event history. */
function ensurePlayerCards(player) {
  if (!Array.isArray(player.cards)) {
    player.cards = Array.from({length: player.free || 0}, () => ({
      type: 'KARTU SIMPANAN', icon: '🔑', text: 'Kartu bebas penjara dari simpanan lama.',
      status: 'held', round: null
    }));
    player.legacyCards = true;
  }
  return player.cards;
}
function recordPlayerCard(player, card, held) {
  ensurePlayerCards(player).push({...card, status: held ? 'held' : 'resolved', round: s.round});
}
function consumePlayerCard(player) {
  const card = ensurePlayerCards(player).find(card => card.status === 'held');
  if (card) { card.status = 'used'; card.usedRound = s.round; }
}
function discardPlayerCards(player) {
  ensurePlayerCards(player).forEach(card => { if(card.status === 'held') {card.status='void';card.usedRound=s.round} });
  player.free=0;
}
function showPlayerCards(id = s?.turn, tab = 'property') {
  if (!s || busy || !s.players[id]) return;
  const player=s.players[id],cards=ensurePlayerCards(player),deeds=owned(id);
  const held=cards.filter(card=>card.status==='held'),history=cards.filter(card=>card.status!=='held');
  const statusText={held:'Disimpan · belum dipakai',resolved:'Efek sudah dijalankan',used:'Sudah digunakan',void:'Hangus · pemain bangkrut'};
  const eventCard=card=>`<article class="inventory-card event-inventory"><div class="inventory-band">${esc(card.type)}</div><div class="inventory-content"><div class="inventory-symbol">${card.icon}</div><p>${esc(card.text)}</p><span class="card-state ${card.status==='held'?'held':''}">${statusText[card.status]}</span><small>${card.round===null?'Dari simpanan sebelumnya':'Diperoleh ronde '+card.round}${card.usedRound?' · '+(card.status==='void'?'Hangus':'Dipakai')+' ronde '+card.usedRound:''}</small></div></article>`;
  const deed=t=>{const q=s.props[t.id];return `<button class="inventory-card deed-card" onclick="showDeedCard(${id},${t.id})" style="--deed-color:${colors[t.group]||'#7097bb'}"><div class="inventory-band">SERTIFIKAT PROPERTI</div><div class="inventory-content"><div class="inventory-symbol">${t.icon}</div><h3>${esc(t.name)}</h3><span class="card-state ${q.mortgage?'':'held'}">${q.mortgage?'Digadai':t.group<8?stageNames[q.level]:'Aktif'}</span><p>Nilai ${short(t.price)}</p><small>Lihat rincian sewa →</small></div></button>`};
  const list=tab==='property'?deeds.map(deed):tab==='held'?held.map(eventCard):[...history].reverse().map(eventCard);
  show(`<div class="eyebrow">Koleksi masing-masing pemain</div><h2>Kartu Pemain</h2><label for="cardPlayerSelect">Lihat kartu milik</label><select id="cardPlayerSelect" onchange="showPlayerCards(Number(this.value),'${tab}')">${s.players.map(p=>`<option value="${p.id}" ${p.id===id?'selected':''}>${esc(p.name)}${p.dead?' · Bangkrut':''}</option>`).join('')}</select><div class="inventory-owner" style="--owner-color:${pcs[id]}"><span>● ${esc(player.name)}</span><small>${deeds.length} properti · ${held.length} kartu disimpan</small></div><div class="inventory-tabs" aria-label="Kategori kartu">${[['property','Properti',deeds.length],['held','Disimpan',held.length],['history','Riwayat',history.length]].map(([key,label,count])=>`<button aria-pressed="${tab===key}" class="${tab===key?'primary':''}" onclick="showPlayerCards(${id},'${key}')">${label} (${count})</button>`).join('')}</div><p class="notice">${tab==='held'?'Kartu bebas penjara disimpan sampai digunakan. Kartu bonus atau denda langsung dijalankan dan masuk Riwayat.':tab==='history'?'Kartu pada riwayat tidak bisa digunakan kembali.':'Sertifikat mengikuti pemilik properti saat ini, termasuk setelah negosiasi atau kebangkrutan.'}</p>${tab==='history'&&player.legacyCards?'<p class="notice">Riwayat sebelum pembaruan tidak tersedia. Kartu bebas penjara yang masih dimiliki tetap ditampilkan.</p>':''}<div class="inventory-grid">${list.join('')||`<div class="inventory-empty">${tab==='property'?'Belum memiliki kartu properti.':tab==='held'?'Belum ada kartu yang disimpan.':'Belum ada riwayat kartu.'}</div>`}</div><div class="modal-actions"><button class="primary" onclick="closeModal()">Tutup</button></div>`);
}
function showDeedCard(playerId, tileId) {
  if(!s||busy)return;
  const t=board[tileId],q=s.props[tileId];
  if(q.owner!==playerId){showPlayerCards(playerId);return}
  show(`<div class="detail-banner" style="--group:${colors[t.group]||'#7097bb'}"></div><div class="eyebrow">Sertifikat properti</div><h2>${t.icon} ${esc(t.name)}</h2><p>Pemilik: <b>${esc(s.players[playerId].name)}</b></p><div class="detail-grid"><div><small>Nilai properti</small>${money(t.price)}</div><div><small>Status</small>${q.mortgage?'Digadai':t.group<8?stageNames[q.level]:'Aktif'}</div><div><small>Sewa saat ini${t.group===9?' (contoh dadu 7)':''}</small>${money(rent(t))}</div><div><small>Nilai gadai</small>${money(t.price/2)}</div></div><p class="notice">${t.group<8?'Upgrade rumah → vila → hotel saat kembali ke petak sendiri.':'Stasiun dan utilitas tidak bisa di-upgrade.'}</p><div class="modal-actions"><button onclick="showPlayerCards(${playerId})">← Kembali ke kartu</button><button class="primary" onclick="closeModal()">Tutup</button></div>`);
}
