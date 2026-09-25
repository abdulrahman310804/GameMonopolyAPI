const boardEl=document.getElementById('board'),turnEl=document.getElementById('turn'),capturedEl=document.getElementById('captured'),messageEl=document.getElementById('message');
const symbols={K:'♔',Q:'♕',R:'♖',B:'♗',N:'♘',P:'♙',k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'};
let board,turn='w',selected=null,captured=[];
function newGame(){board=[['r','n','b','q','k','b','n','r'],['p','p','p','p','p','p','p','p'],...Array.from({length:4},()=>Array(8).fill(null)),['P','P','P','P','P','P','P','P'],['R','N','B','Q','K','B','N','R']];turn='w';selected=null;captured=[];messageEl.textContent='';render()}
function colorOf(p){return p&&(p===p.toUpperCase()?'w':'b')}
function inBoard(r,c){return r>=0&&r<8&&c>=0&&c<8}
function pseudo(r,c,tr,tc){const p=board[r][c],t=board[tr][tc];if(!p||colorOf(p)!==turn||(t&&colorOf(t)===turn))return false;const P=p.toUpperCase(),dr=tr-r,dc=tc-c,adr=Math.abs(dr),adc=Math.abs(dc);
 if(P==='P'){const d=turn==='w'?-1:1,start=turn==='w'?6:1;if(dc===0&&!t&&(dr===d||(r===start&&dr===2*d&&!board[r+d][c])))return true;if(adc===1&&dr===d&&t)return true;return false}
 if(P==='N')return (adr===2&&adc===1)||(adr===1&&adc===2);
 if(P==='K')return adr<=1&&adc<=1;
 const slide=(dirs)=>{for(const [sr,sc] of dirs){let rr=r+sr,cc=c+sc;while(inBoard(rr,cc)){if(rr===tr&&cc===tc)return true;if(board[rr][cc])break;rr+=sr;cc+=sc}}return false};
 if(P==='R')return slide([[1,0],[-1,0],[0,1],[0,-1]]);if(P==='B')return slide([[1,1],[1,-1],[-1,1],[-1,-1]]);if(P==='Q')return slide([[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]);return false}
function moves(r,c){const out=[];for(let tr=0;tr<8;tr++)for(let tc=0;tc<8;tc++)if(pseudo(r,c,tr,tc))out.push([tr,tc]);return out}
function clickSquare(r,c){const p=board[r][c];if(selected){const [sr,sc]=selected;if(moves(sr,sc).some(([a,b])=>a===r&&b===c)){makeMove(sr,sc,r,c);return}if(p&&colorOf(p)===turn){selected=[r,c];render();return}selected=null;render();return}if(p&&colorOf(p)===turn){selected=[r,c];render()}}
function makeMove(sr,sc,tr,tc){const p=board[sr][sc],taken=board[tr][tc];if(taken)captured.push(taken);board[tr][tc]=p;board[sr][sc]=null;if(p==='P'&&tr===0)board[tr][tc]='Q';if(p==='p'&&tr===7)board[tr][tc]='q';turn=turn==='w'?'b':'w';selected=null;render();checkStatus()}
function render(){boardEl.innerHTML='';for(let r=0;r<8;r++)for(let c=0;c<8;c++){const sq=document.createElement('button');sq.className='square '+((r+c)%2?'dark':'light');sq.dataset.r=r;sq.dataset.c=c;if(selected&&selected[0]===r&&selected[1]===c)sq.classList.add('selected');if(selected&&moves(selected[0],selected[1]).some(([a,b])=>a===r&&b===c))sq.classList.add(board[r][c]?'capture':'move');if(board[r][c]){const sp=document.createElement('span');sp.className='piece '+(colorOf(board[r][c])==='w'?'white-piece':'black-piece');sp.textContent=symbols[board[r][c]];sq.appendChild(sp)}sq.onclick=()=>clickSquare(r,c);boardEl.appendChild(sq)}turnEl.textContent='Giliran: '+(turn==='w'?'Putih':'Hitam');capturedEl.textContent=captured.length?captured.map(p=>symbols[p]).join(' '):'Belum ada'}
function checkStatus(){const pieces=[...board.flat()];if(!pieces.includes('K')||!pieces.includes('k'))messageEl.textContent='Raja tertangkap. Tekan Permainan baru untuk mengulang.';else if(!board.flat().some((p,i)=>p&&colorOf(p)===turn&&moves(Math.floor(i/8),i%8).length))messageEl.textContent='Tidak ada langkah legal sederhana untuk giliran ini.'}
document.getElementById('resetBtn').onclick=newGame;newGame();
