/* Six true CSS 3D faces. Final facing always matches the actual game result. */
(() => {
  const poses = [[0,0],[0,-90],[-90,0],[90,0],[0,90],[0,180]];
  const dots = {1:[5],2:[1,9],3:[1,5,9],4:[1,3,7,9],5:[1,3,5,7,9],6:[1,3,4,6,7,9]};
  let active = false;
  function init() {
    const root = document.getElementById('dice');
    if (root.querySelector('.dice-cube')) return;
    root.innerHTML = [0,1].map(i => `<div class="dice-scene"><div class="dice-rig"><div class="dice-cube" id="cube-${i}" role="img" aria-label="Dadu ${i+1}: 1">${[1,2,3,4,5,6].map(n => `<div class="dice-face face-${n}" aria-hidden="true">${[1,2,3,4,5,6,7,8,9].map(pos=>`<i class="pip ${dots[n].includes(pos)?'on':''}"></i>`).join('')}</div>`).join('')}</div></div></div>`).join('');
    const output = document.createElement('div'); output.id='diceResult';output.className='dice-result';output.setAttribute('aria-live','polite');root.after(output);
  }
  function update(values) {
    init(); if (active) return;
    values.forEach((n,i)=>{const cube=document.getElementById('cube-'+i),[x,y]=poses[n-1];cube.style.transform=`rotateX(${x}deg) rotateY(${y}deg)`;cube.dataset.value=n;cube.setAttribute('aria-label',`Dadu ${i+1}: ${n}`)});
    document.getElementById('diceResult').textContent=`${values[0]} + ${values[1]} = ${values[0]+values[1]}`;
  }
  async function animate(values) {
    init(); active=true;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('diceResult').textContent='Dadu sedang dilempar…';
    const duration=reduced?80:1100;
    try {
      await Promise.all(values.map(async(n,i)=>{
        const cube=document.getElementById('cube-'+i),rig=cube.parentElement,[x,y]=poses[n-1];
        const spin=cube.animate([{transform:cube.style.transform||'rotateX(0deg) rotateY(0deg)'},{transform:`rotateX(${x+720}deg) rotateY(${y+(i?1080:720)}deg)`}],{duration,easing:'cubic-bezier(.12,.6,.28,1)',fill:'forwards'});
        const hop=rig.animate(reduced? [{translate:'0 0'},{translate:'0 0'}]:[{translate:'0 0',offset:0},{translate:`${i?12:-12}px -24px`,offset:.22},{translate:'0 3px',offset:.66},{translate:'0 -6px',offset:.80},{translate:'0 0',offset:1}],{duration,easing:'ease-out'});
        await Promise.all([spin.finished,hop.finished]);
        cube.style.transform=`rotateX(${x}deg) rotateY(${y}deg)`;spin.cancel();hop.cancel();
      }));
    } catch { /* Older browsers still show a correct static result. */ }
    finally { active=false;update(values); }
  }
  window.dice3D={update,animate};
})();
