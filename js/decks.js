/* Draw from the visible stack, then flip a real two-sided card. */
window.cardDecks = {
  async reveal(type, card, player) {
    let dialog = document.getElementById('cardReveal');
    if (!dialog) {
      dialog=document.createElement('dialog'); dialog.id='cardReveal';document.body.appendChild(dialog);
    }
    const label=type==='chance'?'KESEMPATAN':'DANA UMUM',symbol=type==='chance'?'?':'✦';
    const source=document.getElementById('stack-'+type);
    source?.classList.add('drawing-stack');
    dialog.innerHTML=`<button class="dialog-close" id="dismissDraw" aria-label="Tutup kartu dan lanjutkan">×</button><div class="eyebrow">${esc(player.name)} mengambil kartu</div><h2>${label}</h2><div class="reveal-stage"><div class="flying-card"><div class="flip-card-inner"><div class="reveal-back ${type}"><span>${symbol}</span><strong>${label}</strong><small>MONOPOLI INDONESIA</small></div><div class="reveal-front ${type}"><div class="reveal-card-band">${label}</div><div class="reveal-card-symbol">${card.icon}</div><p>${esc(card.text)}</p><small>${card.icon==='🔑'?'Kartu ini akan disimpan di koleksi Anda.':'Efek kartu berlaku setelah dilanjutkan.'}</small></div></div></div></div><button class="primary reveal-continue" id="continueDraw" disabled>Membuka kartu…</button>`;
    dialog.showModal();
    const flyer=dialog.querySelector('.flying-card'),inner=dialog.querySelector('.flip-card-inner');
    const box=flyer.getBoundingClientRect(),origin=source?.getBoundingClientRect();
    const dx=origin?origin.left+origin.width/2-box.left-box.width/2:0;
    const dy=origin?origin.top+origin.height/2-box.top-box.height/2:80;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    return new Promise(resolve=>{
      let done=false,autoTimer,fly,flip;
      const finish=()=>{
        if(done)return;done=true;clearTimeout(autoTimer);fly?.cancel();flip?.cancel();
        source?.classList.remove('drawing-stack');dialog.oncancel=null;dialog.onclose=null;
        if(dialog.open)dialog.close();resolve();
      };
      dialog.oncancel=e=>{e.preventDefault();finish()};dialog.onclose=finish;
      document.getElementById('dismissDraw').onclick=finish;
      document.getElementById('continueDraw').onclick=finish;
      (async()=>{
        try {
          fly=flyer.animate([{transform:`translate(${dx}px,${dy}px) scale(.22) rotate(-14deg)`,opacity:.35},{transform:'translate(0,0) scale(1) rotate(0deg)',opacity:1}],{duration:reduced?40:540,easing:'cubic-bezier(.18,.8,.25,1)',fill:'forwards'});
          await fly.finished;
          flip=inner.animate([{transform:'rotateY(0deg)'},{transform:'rotateY(180deg)'}],{duration:reduced?40:650,easing:'cubic-bezier(.3,.1,.2,1)',fill:'forwards'});
          await flip.finished;
        } catch { if(done)return;inner.style.transform='rotateY(180deg)'; }
        if(done)return;
        const button=document.getElementById('continueDraw');button.disabled=false;button.textContent='Terapkan & lanjutkan →';button.focus();
        if(player.ai)autoTimer=setTimeout(finish,1400);
      })();
    });
  }
};
/* SVG buildings remain recognizable without an emoji font. */
function propertyBuilding(level) {
  const paths={
    1:'<path d="M3 16 16 5l13 11"/><path d="M7 14v16h18V14Z"/><path class="window" d="M14 21h5v9h-5z"/>',
    2:'<path d="M1 17 10 8l9 9M13 13 22 4l9 9"/><path d="M4 16v14h24V12H17v4Z"/><path class="window" d="M8 20h4v4H8zm12-5h4v4h-4zm-5 8h5v7h-5z"/>',
    3:'<path d="M6 3h21v27H6z"/><path class="window" d="M10 7h4v4h-4zm9 0h4v4h-4zm-9 8h4v4h-4zm9 0h4v4h-4zm-5 8h6v7h-6z"/>'
  };
  return `<svg class="building-svg" viewBox="0 0 34 34" aria-hidden="true">${paths[level]||'<path d="M3 12 17 3l14 9ZM6 14h23v15H6z"/><path class="window" d="M11 17h4v8h-4zm8 0h4v8h-4z"/>'}</svg>`;
}
