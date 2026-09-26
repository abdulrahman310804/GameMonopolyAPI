(() => {
  function ensureStyle(){
    if(document.getElementById('catDefeatStyle')) return;
    const s=document.createElement('style');s.id='catDefeatStyle';s.textContent=`
      .cat-defeat-overlay{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:rgba(3,8,14,.78);backdrop-filter:blur(4px);padding:20px}
      .cat-defeat-card{width:min(430px,100%);text-align:center;padding:30px 24px;border:1px solid #ffffff22;border-radius:26px;background:#102333f7;box-shadow:0 25px 80px #0009;animation:catDefeatPop .28s ease-out}
      .cat-defeat-emoji{font-size:100px;line-height:1;animation:catDefeatShake .55s ease-in-out}
      .cat-defeat-card h2{margin:12px 0 6px;font-size:30px}.cat-defeat-card p{color:#9db7c1;line-height:1.6;margin:8px 0 20px}
      .cat-defeat-card button{border:0;border-radius:13px;padding:13px 20px;background:#65e7d0;color:#071522;font-weight:1000;cursor:pointer}
      @keyframes catDefeatPop{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:scale(1)}}@keyframes catDefeatShake{0%,100%{transform:rotate(0)}25%{transform:rotate(-8deg)}50%{transform:rotate(8deg)}75%{transform:rotate(-5deg)}}
    `;document.head.appendChild(s);
  }
  function laugh(){
    try{
      const A=window.AudioContext||window.webkitAudioContext;if(!A)return;
      const c=new A();c.resume();
      const now=c.currentTime;
      const laugh=(t,f,d,v)=>{const o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*.72,t+d);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.018);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+d+.02)};
      [0,0.13,0.27,0.42,0.58].forEach((x,i)=>laugh(now+x,520+(i%2)*70,.16,.075));
      setTimeout(()=>c.close().catch(()=>{}),1100);
    }catch{}
  }
  window.showCatDefeat=function(message='Yah, kalah! Kucingnya sampai ketawa 😹'){
    if(document.querySelector('.cat-defeat-overlay'))return;
    ensureStyle();laugh();
    const o=document.createElement('div');o.className='cat-defeat-overlay';
    o.innerHTML='<div class="cat-defeat-card"><div class="cat-defeat-emoji">😹</div><h2>WKWK, KALAH! 😹</h2><p>'+String(message).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))+'</p><button type="button">COBA LAGI</button></div>';
    document.body.appendChild(o);
    o.querySelector('button').onclick=()=>o.remove();
  };
})();