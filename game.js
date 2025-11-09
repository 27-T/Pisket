window.onload = function () {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    // --- Game setup ---
    const gravity = 1.0;
    const groundHeight = 50;
    const floorY = canvas.height - groundHeight;
    let cameraX = 0;
    let score = 0;
    let gameOver = false;

    // --- Load player sprites ---
    const idleSprite = new Image();
    idleSprite.src = "idle.gif";

    const runSprite = new Image();
    runSprite.src = "run.gif";

    // --- Load background music (WAV) ---
    const bgMusic = new Audio("music.wav");
    bgMusic.loop = true;
    bgMusic.volume = 0.5;

    // --- Player setup ---
    const player = {
        x: 100,
        y: floorY - 60,
        width: 50,
        height: 60,
        dx: 0,
        dy: 0,
        speed: 8,
        jumping: false,
        facingRight: true,
        currentSprite: idleSprite,
    };

    // --- Platforms ---
    let platforms = [
        { x: 0, y: floorY, width: 800, height: groundHeight },
        { x: 400, y: floorY - 100, width: 120, height: 20 },
        { x: 700, y: floorY - 150, width: 100, height: 20 },
    ];

    // --- Input ---
    const keys = {};
    document.addEventListener("keydown", (e) => {
        keys[e.code] = true;

        // Restart if game over
        if (gameOver && e.code === "Space") restartGame();
    });
    document.addEventListener("keyup", (e) => (keys[e.code] = false));

    // --- Generate new platforms ---
    function generatePlatform() {
        const lastPlat = platforms[platforms.length - 1];
        const newX = lastPlat.x + Math.random() * 200 + 150;
        const newY = floorY - (Math.random() * 150 + 50);
        const newWidth = Math.random() * 100 + 80;

        platforms.push({ x: newX, y: newY, width: newWidth, height: 20 });

        if (platforms[0].x + platforms[0].width < cameraX - 200) {
            platforms.shift();
        }
    }

    // --- Update logic ---
    function update() {
        if (gameOver) return;

        // Movement (WASD)
        if (keys["KeyD"]) {
            player.dx = player.speed;
            player.facingRight = true;
        } else if (keys["KeyA"]) {
            player.dx = -player.speed;
            player.facingRight = false;
        } else {
            player.dx = 0;
        }

        // Jump
        if (keys["KeyW"] && !player.jumping) {
            player.dy = -18;
            player.jumping = true;
        }

        // Gravity
        player.dy += gravity;
        player.y += player.dy;

        const playerWorldX = cameraX + player.x;
        let onGround = false;

        // Platform collision
        for (let plat of platforms) {
            const overlapX =
                playerWorldX + player.width > plat.x &&
                playerWorldX < plat.x + plat.width;
            const feetY = player.y + player.height;
            const withinY = feetY >= plat.y && feetY <= plat.y + plat.height;

            if (overlapX && withinY && player.dy >= 0) {
                player.y = plat.y - player.height;
                player.dy = 0;
                onGround = true;
                break;
            }
        }

        player.jumping = !onGround;
        player.currentSprite = player.dx !== 0 ? runSprite : idleSprite;

        // Scroll & score
        cameraX += 2;
        score += 1;

        // Move player
        player.x += player.dx;
        if (player.x < 0) player.x = 0;
        if (player.x + player.width > canvas.width)
            player.x = canvas.width - player.width;

        // Generate more platforms
        const farthestPlatform = platforms[platforms.length - 1];
        if (farthestPlatform.x < cameraX + 1000) {
            generatePlatform();
        }

        // Fall detection
        if (player.y > canvas.height) {
            gameOver = true;
            bgMusic.pause();
        }
    }

    // --- Draw pretty platform ---
    function drawPlatform(plat) {
        const x = plat.x - cameraX;
        const y = plat.y;
        const w = plat.width;
        const h = plat.height;

        const grad = ctx.createLinearGradient(x, y, x, y + h);
        grad.addColorStop(0, "#ffb6c1"); // pink top
        grad.addColorStop(1, "#d8b4fe"); // pastel purple bottom
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, w, h);

        // Subtle border
        ctx.strokeStyle = "#c084fc";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, w, h);
    }

    // --- Draw everything ---
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Sky
        ctx.fillStyle = "#fce7f3";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Platforms
        for (let plat of platforms) drawPlatform(plat);

        // Player
        ctx.save();
        if (!player.facingRight) {
            ctx.scale(-1, 1);
            ctx.drawImage(
                player.currentSprite,
                -player.x - player.width,
                player.y,
                player.width,
                player.height
            );
        } else {
            ctx.drawImage(
                player.currentSprite,
                player.x,
                player.y,
                player.width,
                player.height
            );
        }
        ctx.restore();

        // Score
        ctx.fillStyle = "#fff";
        ctx.font = "20px Arial";
        ctx.fillText("Score: " + Math.floor(score / 10), 20, 30);

        // Game Over screen
        if (gameOver) {
            ctx.fillStyle = "rgba(0,0,0,0.6)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = "#fff";
            ctx.font = "36px Arial";
            ctx.fillText("You fell!", canvas.width / 2 - 80, canvas.height / 2 - 20);

            ctx.font = "24px Arial";
            ctx.fillText(
                "Press SPACE to revive",
                canvas.width / 2 - 130,
                canvas.height / 2 + 20
            );
        }
    }

    // --- Restart game ---
    function restartGame() {
        player.x = 100;
        player.y = floorY - 60;
        player.dy = 0;
        cameraX = 0;
        score = 0;
        gameOver = false;
        bgMusic.currentTime = 0;
        bgMusic.play();
    }

    // --- Game loop ---
    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    // --- Start ---
    bgMusic.play();
    gameLoop();
};
