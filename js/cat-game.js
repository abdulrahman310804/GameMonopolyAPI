let audioCtx=null;function cuteSound(freq=520,duration=.09,type="triangle",volume=.045){try{if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain(),t=audioCtx.currentTime;o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(50,freq*.7),t+duration);g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(audioCtx.destination);o.start(t);o.stop(t+duration)}catch(e){}}
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gameOverMessage = document.getElementById("gameOverMessage");
const finalScoreElement = document.getElementById("finalScore");
const retryButton = document.getElementById("retryButton");
const pauseButton = document.getElementById("pauseButton");

const introScreen = document.getElementById("introScreen");
const newGameButton = document.getElementById("newGameButton");
const difficultyButton = document.getElementById("difficultyButton");
const highScoresButton = document.getElementById("highScoresButton");

let score = 0;
let ballRadius = 20;
let x, y, dx, dy;
const giantWidth = 150;
const giantHeight = 20;
let giantX;

let rightPressed = false;
let leftPressed = false;
let gameOver = false;
let paused = false;
let difficultyLevel = 1;

const ballImage = new Image();
ballImage.src = "assets/cat/cat.png";
const cryImage = new Image();
cryImage.src = "assets/cat/catCry.png";
const dieImage = new Image();
dieImage.src = "assets/cat/dieCat.png";
let currentBallImage = ballImage;

let isMouseDown = false;
let mouseX = 0;

function resetGameVariables() {
    x = canvas.width / 2;
    y = canvas.height - 30;
    dx = 2;
    dy = -2;
    giantX = (canvas.width - giantWidth) / 2;
    score = 0;
    gameOver = false;
    currentBallImage = ballImage;
}

function startGame() { cuteSound(620,.08); setTimeout(()=>cuteSound(820,.1),80);
    introScreen.style.display = "none";
    canvas.style.display = "block";
    gameStatus.style.display = "block";
    pauseButton.style.display = "block";
    resetGameVariables();
    draw();
}

function displayGameOver() {
    gameOver = true;
    currentBallImage = dieImage;
    finalScoreElement.textContent = score;
    gameOverMessage.style.display = "block";
}

function restartGame() {
    gameOverMessage.style.display = "none";
    resetGameVariables();
    updateScore();
    draw();
}

function resizeCanvas() {
    canvas.width = window.innerWidth * 0.9;
    canvas.height = window.innerHeight * 0.8;
    giantX = (canvas.width - giantWidth) / 2;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

canvas.addEventListener("mousedown", mouseDownHandler, false);
canvas.addEventListener("mousemove", mouseMoveHandler, false);
canvas.addEventListener("mouseup", mouseUpHandler, false);

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
pauseButton.addEventListener("click", togglePause, false);
retryButton.addEventListener("click", restartGame, false);

function mouseDownHandler(e) {
    if (e.button === 0) {
        isMouseDown = true;
        mouseX = e.clientX - canvas.getBoundingClientRect().left;
    }
}

function mouseMoveHandler(e) {
    if (isMouseDown) {
        mouseX = e.clientX - canvas.getBoundingClientRect().left;
        if (mouseX > 0 && mouseX < canvas.width) {
            giantX = mouseX - giantWidth / 2;
        }
    }
}

function mouseUpHandler() {
    isMouseDown = false;
}

canvas.addEventListener("touchstart", handleTouch, false);
canvas.addEventListener("touchmove", handleTouch, false);

function keyDownHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = true;
    } else if (e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = true;
    }
}

function keyUpHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = false;
    } else if (e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = false;
    }
}

function handleTouch(e) {
    e.preventDefault();
    const touchX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
    if (touchX > 0 && touchX < canvas.width) {
        giantX = touchX - giantWidth / 2;
    }
}

function togglePause() {
    paused = !paused;
    pauseButton.textContent = paused ? "Resume" : "Pause";
    if (!paused) draw();
}

function drawBall() {
    ctx.drawImage(currentBallImage, x - ballRadius * 2, y - ballRadius * 2, ballRadius * 4, ballRadius * 4);
}

function drawGiant() {
    ctx.beginPath();
    ctx.rect(giantX, canvas.height - giantHeight, giantWidth, giantHeight);
    ctx.fillStyle = "#ff4081";
    ctx.fill();
    ctx.closePath();
}

function updateScore() {
    document.getElementById("gameStatus").innerText = `Score: ${score}`;
}

function draw() {
    if (gameOver || paused) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBall();
    drawGiant();

    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx;
        currentBallImage = cryImage;
        setTimeout(() => {
            currentBallImage = gameOver ? dieImage : ballImage;
        }, 200);
    }

    if (y + dy < ballRadius) {
        dy = -dy;
        currentBallImage = cryImage;
        setTimeout(() => {
            currentBallImage = gameOver ? dieImage : ballImage;
        }, 200);
    } else if (y + dy > canvas.height - ballRadius) {
        if (x > giantX && x < giantX + giantWidth) {
            dy = -dy;
            score++; cuteSound(820,.08);
            updateScore();
        } else {
            cuteSound(260,.22,"triangle",.05); displayGameOver();
        }
    }

    x += dx;
    y += dy;

    if (rightPressed && giantX < canvas.width - giantWidth) {
        giantX += 7;
    } else if (leftPressed && giantX > 0) {
        giantX -= 7;
    }

    requestAnimationFrame(draw);
}

newGameButton.addEventListener("click", startGame);
difficultyButton.addEventListener("click", () => alert("Difficulty settings coming soon!"));
highScoresButton.addEventListener("click", () => alert("High scores feature coming soon!"));

// Hide game elements initially
document.getElementById("gameStatus").style.display = "none";
pauseButton.style.display = "none";