document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('billiardTable');
    const ctx = canvas.getContext('2d');
    const ballRadius = 10;
    const balls = [];
    const pockets = [
        { x: 0, y: 0, radius: 30 }, // 左上角
        { x: canvas.width, y: 0, radius: 30 }, // 右上角
        { x: 0, y: canvas.height, radius: 30 }, // 左下角
        { x: canvas.width, y: canvas.height, radius: 30 }, // 右下角
        { x: canvas.width / 2, y: 0, radius: 30 }, // 上中
        { x: canvas.width / 2, y: canvas.height, radius: 30 } // 下中
    ];
    let gameOver = false;

    // 确保canvas尺寸
    canvas.width = 800;
    canvas.height = 400;

    function initBalls() {
        balls.push({ x: 400, y: 300, vx: 0, vy: 0, color: '#FFFFFF' }); // 白球

        const startX = 600;
        const startY = 200;
        let offsetX = 0;
        let offsetY = 0;

        for (let i = 0; i < 15; i++) {
            balls.push({
                x: startX + offsetX,
                y: startY + offsetY,
                vx: 0,
                vy: 0,
                color: getRandomColor()
            });

            offsetX += 2 * ballRadius;
            if ((i + 1) % 5 === 0) {
                offsetY += 2 * ballRadius;
                offsetX = 0;
            }
        }
    }

    function getRandomColor() {
        const colors = ['#FF0000', '#FFFF00', '#0000FF', '#FF00FF', '#00FFFF', '#00FF00', '#FFA500'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    initBalls();

    function drawTable() {
        ctx.fillStyle = '#006400'; // 色台球桌
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawBalls() {
        balls.forEach(ball => {
            if (ball !== null) {  // 确保不绘制 null 的球
                drawBall(ball.x, ball.y, ballRadius, ball.color);
            }
        });
    }

    function drawBall(x, y, radius, color) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.closePath();
    }

    function drawPockets() {
        pockets.forEach(pocket => {
            ctx.beginPath();
            ctx.arc(pocket.x, pocket.y, pocket.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#000000';
            ctx.fill();
            ctx.closePath();
        });
    }

    function update() {
        if (gameOver) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawTable();
        drawBalls();
        drawPockets();

        // 更新每个球的位置
        balls.forEach(ball => {
            if (ball !== null) {  // 确保只更新存在的球
                ball.x += ball.vx;
                ball.y += ball.vy;

                // 碰撞检测
                if (ball.x + ballRadius > canvas.width || ball.x - ballRadius < 0) {
                    ball.vx = -ball.vx;
                }
                if (ball.y + ballRadius > canvas.height || ball.y - ballRadius < 0) {
                    ball.vy = -ball.vy;
                }

                // 摩擦力减速
                ball.vx *= 0.99;
                ball.vy *= 0.99;
            }
        });

        // 检查球是否进入洞口
        checkPockets();
        checkCollisions(); // 加入碰撞检测

        requestAnimationFrame(update);
    }

    function checkPockets() {
        // 过滤掉已经进洞的球
        balls.forEach((ball, index) => {
            if (ball === null) return;

            pockets.forEach(pocket => {
                const dx = ball.x - pocket.x;
                const dy = ball.y - pocket.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < pocket.radius + ballRadius) {
                    // 球进入洞口
                    balls[index] = null;  // 删除已进洞的球

                    // 如果是白球，触发游戏结束
                    if (ball.color === '#FFFFFF') {
                        gameOver = true;
                        setTimeout(() => {
                            alert('白球进洞，游戏结束！');
                            resetGame(); // 游戏结束后重置
                        }, 1000);
                    }
                }
            });
        });

        // 检查是否所有球都进洞了
        if (balls.every(ball => ball === null)) {
            gameOver = true;
            setTimeout(() => {
                alert('游戏结束！你赢了！');
                resetGame(); // 游戏结束后重置
            }, 1000);
        }
    }

    function resetGame() {
        gameOver = false;
        balls.length = 0; // 清空球数组
        initBalls(); // 重新初始化球
        update(); // 重新开始游戏
    }

    function checkCollisions() {
        for (let i = 0; i < balls.length; i++) {
            for (let j = i + 1; j < balls.length; j++) {
                const ballA = balls[i];
                const ballB = balls[j];
                
                if (ballA === null || ballB === null) continue;
    
                const dx = ballB.x - ballA.x;
                const dy = ballB.y - ballA.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
    
                if (distance < 2 * ballRadius) {
                    // 计算碰撞的法线和切线方向
                    const angle = Math.atan2(dy, dx);
                    const sin = Math.sin(angle);
                    const cos = Math.cos(angle);
    
                    // 球A的速度分量
                    const v1 = { x: ballA.vx, y: ballA.vy };
                    const v2 = { x: ballB.vx, y: ballB.vy };
    
                    // 球A的速度沿法线方向的分量
                    const v1n = v1.x * cos + v1.y * sin;
                    const v1t = v1.x * sin - v1.y * cos;
    
                    // 球B的速度沿法线方向的分量
                    const v2n = v2.x * cos + v2.y * sin;
                    const v2t = v2.x * sin - v2.y * cos;
    
                    // 碰撞后沿法线方向的速度更新
                    const m1 = 1; // 假设球的质量相等
                    const m2 = 1; // 假设球的质量相等
    
                    const v1nNew = ((m1 - m2) * v1n + 2 * m2 * v2n) / (m1 + m2);
                    const v2nNew = ((m2 - m1) * v2n + 2 * m1 * v1n) / (m1 + m2);
    
                    // 更新球的速度
                    ballA.vx = v1t * cos - v1nNew * sin;
                    ballA.vy = v1t * sin + v1nNew * cos;
                    ballB.vx = v2t * cos - v2nNew * sin;
                    ballB.vy = v2t * sin + v2nNew * cos;
    
                    // 修正位置，避免球重叠
                    const overlap = 2 * ballRadius - distance;
                    ballA.x -= overlap * cos / 2;
                    ballA.y -= overlap * sin / 2;
                    ballB.x += overlap * cos / 2;
                    ballB.y += overlap * sin / 2;
                }
            }
        }
    }
    

    canvas.addEventListener('click', (event) => {
        if (gameOver) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // 计算白球的击球方向
        const whiteBall = balls[0];
        whiteBall.vx = (mouseX - whiteBall.x) * 0.1;
        whiteBall.vy = (mouseY - whiteBall.y) * 0.1;
    });

    update();
});
