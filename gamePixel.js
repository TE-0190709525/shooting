class PixelGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // ピクセルパーフェクトな描画設定
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;
        
        // ピクセルサイズ（ドット絵の拡大率）
        this.pixelSize = 4;
        this.gameWidth = this.width / this.pixelSize;
        this.gameHeight = this.height / this.pixelSize;
        
        // ゲーム状態
        this.gameState = 'playing';
        this.score = 0;
        this.level = 1;
        this.frameCount = 0;
        
        // プレイヤー
        this.player = {
            x: 20,
            y: this.gameHeight / 2,
            width: 16,
            height: 8,
            health: 200,
            maxHealth: 200,
            speed: 2,
            shootCooldown: 0,
            animFrame: 0
        };
        
        // ゲームオブジェクト
        this.bullets = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.particles = [];
        this.powerups = [];
        this.stars = [];
        
        // 入力管理
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        
        // パレットカラー（ドット絵風）
        this.colors = {
            bg: '#0f0f23',
            player: ['#00aaff', '#0088cc', '#006699', '#004466'],
            enemy: ['#ff4444', '#cc3333', '#aa2222', '#881111'],
            bullet: '#ffff55',
            enemyBullet: '#ff5555',
            powerup: '#55ff55',
            particle: ['#ffaa00', '#ff8800', '#ff6600', '#ff4400'],
            star: '#ffffff'
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.createStars();
        this.createPlayerSprite();
        this.gameLoop();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.gameState === 'gameOver') {
                    this.restart();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = Math.floor((e.clientX - rect.left) / this.pixelSize);
            this.mouse.y = Math.floor((e.clientY - rect.top) / this.pixelSize);
        });
    }
    
    createStars() {
        for (let i = 0; i < 50; i++) {
            this.stars.push({
                x: Math.random() * this.gameWidth,
                y: Math.random() * this.gameHeight,
                speed: Math.random() * 0.5 + 0.2,
                brightness: Math.random()
            });
        }
    }
    
    createPlayerSprite() {
        // プレイヤーのピクセルアートパターン
        this.playerSprite = [
            [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
            [0,0,1,1,2,2,2,2,2,2,2,2,1,1,0,0],
            [0,1,2,2,2,3,3,3,3,3,3,2,2,2,1,0],
            [1,2,2,3,3,3,3,3,3,3,3,3,3,2,2,1],
            [1,2,3,3,3,3,3,3,3,3,3,3,3,3,2,1],
            [1,2,2,3,3,3,3,3,3,3,3,3,3,2,2,1],
            [0,1,2,2,2,3,3,3,3,3,3,2,2,2,1,0],
            [0,0,1,1,2,2,2,2,2,2,2,2,1,1,0,0]
        ];
        
        // 敵のスプライトパターン
        this.enemySprites = {
            normal: [
                [0,0,1,1,1,1,0,0],
                [0,1,2,2,2,2,1,0],
                [1,2,2,3,3,2,2,1],
                [1,2,3,3,3,3,2,1],
                [1,2,2,3,3,2,2,1],
                [0,1,2,2,2,2,1,0],
                [0,0,1,1,1,1,0,0]
            ],
            large: [
                [0,0,0,1,1,1,1,0,0,0],
                [0,0,1,2,2,2,2,1,0,0],
                [0,1,2,2,3,3,2,2,1,0],
                [1,2,2,3,3,3,3,2,2,1],
                [1,2,3,3,3,3,3,3,2,1],
                [1,2,3,3,3,3,3,3,2,1],
                [1,2,2,3,3,3,3,2,2,1],
                [0,1,2,2,3,3,2,2,1,0],
                [0,0,1,2,2,2,2,1,0,0],
                [0,0,0,1,1,1,1,0,0,0]
            ],
            boss: [
                [0,0,0,0,1,1,1,1,1,1,0,0,0,0],
                [0,0,1,1,2,2,2,2,2,2,1,1,0,0],
                [0,1,2,2,2,3,3,3,3,2,2,2,1,0],
                [1,2,2,3,3,3,3,3,3,3,3,2,2,1],
                [1,2,3,3,3,3,4,4,3,3,3,3,2,1],
                [1,2,3,3,4,4,4,4,4,4,3,3,2,1],
                [1,2,3,3,4,4,4,4,4,4,3,3,2,1],
                [1,2,3,3,3,3,4,4,3,3,3,3,2,1],
                [1,2,2,3,3,3,3,3,3,3,3,2,2,1],
                [0,1,2,2,2,3,3,3,3,2,2,2,1,0],
                [0,0,1,1,2,2,2,2,2,2,1,1,0,0],
                [0,0,0,0,1,1,1,1,1,1,0,0,0,0]
            ]
        };
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        this.frameCount++;
        this.updatePlayer();
        this.updateBullets();
        this.updateEnemies();
        this.updateEnemyBullets();
        this.updateParticles();
        this.updatePowerups();
        this.updateBackground();
        this.spawnEnemies();
        this.checkCollisions();
        this.updateUI();
        
        if (this.score > this.level * 1000) {
            this.level++;
        }
    }
    
    updatePlayer() {
        // プレイヤーの移動
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            this.player.y = Math.max(0, this.player.y - this.player.speed);
        }
        if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            this.player.y = Math.min(this.gameHeight - this.player.height, this.player.y + this.player.speed);
        }
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.x = Math.max(0, this.player.x - this.player.speed);
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.x = Math.min(this.gameWidth - this.player.width, this.player.x + this.player.speed);
        }
        
        // アニメーション
        this.player.animFrame = (this.player.animFrame + 0.2) % 4;
        
        // 射撃
        if (this.player.shootCooldown > 0) {
            this.player.shootCooldown--;
        }
        
        if (this.keys['Space'] && this.player.shootCooldown === 0) {
            this.shoot();
            this.player.shootCooldown = 8;
        }
    }
    
    shoot() {
        this.bullets.push({
            x: this.player.x + this.player.width,
            y: this.player.y + this.player.height / 2,
            vx: 4,
            vy: 0,
            size: 2,
            life: 60
        });
        
        // マズルフラッシュパーティクル
        for (let i = 0; i < 3; i++) {
            this.particles.push({
                x: this.player.x + this.player.width,
                y: this.player.y + this.player.height / 2,
                vx: Math.random() * 2 - 1,
                vy: Math.random() * 2 - 1,
                life: 10,
                maxLife: 10,
                color: this.colors.bullet,
                size: 1
            });
        }
    }
    
    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            bullet.life--;
            
            if (bullet.life <= 0 || bullet.x > this.gameWidth) {
                this.bullets.splice(i, 1);
            }
        }
    }
    
    spawnEnemies() {
        if (this.frameCount % (120 - this.level * 10) === 0) {
            const enemyType = Math.random();
            let enemy;
            
            if (enemyType < 0.7) {
                enemy = {
                    x: this.gameWidth,
                    y: Math.random() * (this.gameHeight - 20),
                    width: 8,
                    height: 7,
                    health: 1,
                    speed: 1 + this.level * 0.2,
                    type: 'normal',
                    shootCooldown: 0,
                    animFrame: 0
                };
            } else if (enemyType < 0.9) {
                enemy = {
                    x: this.gameWidth,
                    y: Math.random() * (this.gameHeight - 30),
                    width: 10,
                    height: 10,
                    health: 2,
                    speed: 0.8 + this.level * 0.15,
                    type: 'large',
                    shootCooldown: 0,
                    animFrame: 0
                };
            } else {
                enemy = {
                    x: this.gameWidth,
                    y: Math.random() * (this.gameHeight - 40),
                    width: 14,
                    height: 12,
                    health: 4,
                    speed: 0.5 + this.level * 0.1,
                    type: 'boss',
                    shootCooldown: 0,
                    animFrame: 0
                };
            }
            
            this.enemies.push(enemy);
        }
    }
    
    updateEnemies() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.x -= enemy.speed;
            enemy.animFrame = (enemy.animFrame + 0.1) % 4;
            
            // 敵の射撃
            enemy.shootCooldown--;
            if (enemy.shootCooldown <= 0) {
                this.enemyShoot(enemy);
                enemy.shootCooldown = enemy.type === 'boss' ? 40 : 80;
            }
            
            if (enemy.x + enemy.width < 0) {
                this.enemies.splice(i, 1);
            }
            
            if (enemy.health <= 0) {
                this.createPixelExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                this.score += enemy.type === 'boss' ? 500 : enemy.type === 'large' ? 200 : 100;
                
                if (Math.random() < 0.25) {
                    this.powerups.push({
                        x: enemy.x,
                        y: enemy.y + enemy.height / 2,
                        type: 'health',
                        life: 300,
                        animFrame: 0
                    });
                }
                
                this.enemies.splice(i, 1);
            }
        }
    }
    
    enemyShoot(enemy) {
        const dx = this.player.x - enemy.x;
        const dy = this.player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        this.enemyBullets.push({
            x: enemy.x,
            y: enemy.y + enemy.height / 2,
            vx: (dx / dist) * 2,
            vy: (dy / dist) * 2,
            size: 2,
            life: 120
        });
    }
    
    updateEnemyBullets() {
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            bullet.life--;
            
            if (bullet.life <= 0 || bullet.x < 0 || bullet.y < 0 || bullet.y > this.gameHeight) {
                this.enemyBullets.splice(i, 1);
            }
        }
    }
    
    updatePowerups() {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            powerup.x -= 1;
            powerup.life--;
            powerup.animFrame = (powerup.animFrame + 0.2) % 8;
            
            if (powerup.life <= 0 || powerup.x < -10) {
                this.powerups.splice(i, 1);
            }
        }
    }
    
    checkCollisions() {
        // プレイヤーの弾と敵の衝突
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                if (this.isPixelColliding(bullet, enemy)) {
                    enemy.health--;
                    this.createPixelHit(bullet.x, bullet.y);
                    this.bullets.splice(i, 1);
                    break;
                }
            }
        }
        
        // 敵の弾とプレイヤーの衝突
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            if (this.isPixelColliding(bullet, this.player)) {
                this.player.health -= 5;
                this.createPixelHit(bullet.x, bullet.y);
                this.enemyBullets.splice(i, 1);
                
                if (this.player.health <= 0) {
                    this.gameOver();
                }
            }
        }
        
        // プレイヤーと敵の衝突
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (this.isPixelColliding(this.player, enemy)) {
                this.player.health -= 10;
                enemy.health = 0;
                
                if (this.player.health <= 0) {
                    this.gameOver();
                }
            }
        }
        
        // プレイヤーとパワーアップの衝突
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            if (this.isPixelColliding(this.player, powerup)) {
                if (powerup.type === 'health') {
                    this.player.health = Math.min(this.player.maxHealth, this.player.health + 40);
                }
                this.createPixelHeal(powerup.x, powerup.y);
                this.powerups.splice(i, 1);
            }
        }
    }
    
    isPixelColliding(obj1, obj2) {
        // ピクセル単位の当たり判定
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + (obj1.width || obj1.size) > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + (obj1.height || obj1.size) > obj2.y;
    }
    
    createPixelExplosion(x, y) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 20,
                maxLife: 20,
                color: this.colors.particle[Math.floor(Math.random() * this.colors.particle.length)],
                size: Math.floor(Math.random() * 2) + 1
            });
        }
    }
    
    createPixelHit(x, y) {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                life: 15,
                maxLife: 15,
                color: this.colors.bullet,
                size: 1
            });
        }
    }
    
    createPixelHeal(x, y) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 25,
                maxLife: 25,
                color: this.colors.powerup,
                size: 1
            });
        }
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vx *= 0.95;
            particle.vy *= 0.95;
            particle.life--;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    updateBackground() {
        for (let star of this.stars) {
            star.x -= star.speed;
            if (star.x < 0) {
                star.x = this.gameWidth;
                star.y = Math.random() * this.gameHeight;
            }
        }
    }
    
    render() {
        // 背景クリア
        this.ctx.fillStyle = this.colors.bg;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // ピクセル描画モード開始
        this.ctx.save();
        this.ctx.scale(this.pixelSize, this.pixelSize);
        
        this.renderStars();
        this.renderPlayer();
        this.renderBullets();
        this.renderEnemies();
        this.renderEnemyBullets();
        this.renderPowerups();
        this.renderParticles();
        
        this.ctx.restore();
    }
    
    renderStars() {
        for (let star of this.stars) {
            const alpha = 0.3 + star.brightness * 0.7;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = this.colors.star;
            this.drawPixel(Math.floor(star.x), Math.floor(star.y));
        }
        this.ctx.globalAlpha = 1;
    }
    
    renderPlayer() {
        const sprite = this.playerSprite;
        for (let y = 0; y < sprite.length; y++) {
            for (let x = 0; x < sprite[y].length; x++) {
                const colorIndex = sprite[y][x];
                if (colorIndex > 0) {
                    this.ctx.fillStyle = this.colors.player[colorIndex - 1];
                    this.drawPixel(this.player.x + x, this.player.y + y);
                }
            }
        }
        
        // エンジン噴射アニメーション
        if (Math.floor(this.player.animFrame) % 2 === 0) {
            this.ctx.fillStyle = '#ffff00';
            this.drawPixel(this.player.x - 1, this.player.y + 3);
            this.drawPixel(this.player.x - 1, this.player.y + 4);
            this.ctx.fillStyle = '#ff8800';
            this.drawPixel(this.player.x - 2, this.player.y + 3);
            this.drawPixel(this.player.x - 2, this.player.y + 4);
        }
    }
    
    renderBullets() {
        for (let bullet of this.bullets) {
            this.ctx.fillStyle = this.colors.bullet;
            this.drawPixel(Math.floor(bullet.x), Math.floor(bullet.y));
            this.drawPixel(Math.floor(bullet.x) + 1, Math.floor(bullet.y));
        }
    }
    
    renderEnemies() {
        for (let enemy of this.enemies) {
            const sprite = this.enemySprites[enemy.type];
            const flash = Math.floor(enemy.animFrame * 2) % 2;
            
            for (let y = 0; y < sprite.length; y++) {
                for (let x = 0; x < sprite[y].length; x++) {
                    const colorIndex = sprite[y][x];
                    if (colorIndex > 0) {
                        let color = this.colors.enemy[Math.min(colorIndex - 1, this.colors.enemy.length - 1)];
                        if (flash && enemy.type === 'boss') {
                            color = '#ff8888'; // ボスの点滅
                        }
                        this.ctx.fillStyle = color;
                        this.drawPixel(Math.floor(enemy.x) + x, Math.floor(enemy.y) + y);
                    }
                }
            }
        }
    }
    
    renderEnemyBullets() {
        for (let bullet of this.enemyBullets) {
            this.ctx.fillStyle = this.colors.enemyBullet;
            this.drawPixel(Math.floor(bullet.x), Math.floor(bullet.y));
            if (bullet.size > 1) {
                this.drawPixel(Math.floor(bullet.x) + 1, Math.floor(bullet.y));
                this.drawPixel(Math.floor(bullet.x), Math.floor(bullet.y) + 1);
                this.drawPixel(Math.floor(bullet.x) + 1, Math.floor(bullet.y) + 1);
            }
        }
    }
    
    renderPowerups() {
        for (let powerup of this.powerups) {
            const frame = Math.floor(powerup.animFrame);
            const colors = ['#55ff55', '#44ee44', '#33dd33', '#22cc22'];
            this.ctx.fillStyle = colors[frame % colors.length];
            
            // 十字形のパワーアップ
            this.drawPixel(Math.floor(powerup.x) + 2, Math.floor(powerup.y) + 1);
            this.drawPixel(Math.floor(powerup.x) + 1, Math.floor(powerup.y) + 2);
            this.drawPixel(Math.floor(powerup.x) + 2, Math.floor(powerup.y) + 2);
            this.drawPixel(Math.floor(powerup.x) + 3, Math.floor(powerup.y) + 2);
            this.drawPixel(Math.floor(powerup.x) + 2, Math.floor(powerup.y) + 3);
        }
    }
    
    renderParticles() {
        for (let particle of this.particles) {
            const alpha = particle.life / particle.maxLife;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = particle.color;
            
            for (let i = 0; i < particle.size; i++) {
                for (let j = 0; j < particle.size; j++) {
                    this.drawPixel(Math.floor(particle.x) + i, Math.floor(particle.y) + j);
                }
            }
        }
        this.ctx.globalAlpha = 1;
    }
    
    drawPixel(x, y) {
        if (x >= 0 && x < this.gameWidth && y >= 0 && y < this.gameHeight) {
            this.ctx.fillRect(x, y, 1, 1);
        }
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('health').textContent = this.player.health;
        document.getElementById('level').textContent = this.level;
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        document.getElementById('gameOver').style.display = 'block';
    }
    
    restart() {
        this.gameState = 'playing';
        this.score = 0;
        this.level = 1;
        this.frameCount = 0;
        this.player.health = this.player.maxHealth;
        this.player.x = 20;
        this.player.y = this.gameHeight / 2;
        this.bullets = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.particles = [];
        this.powerups = [];
        document.getElementById('gameOver').style.display = 'none';
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// ゲーム開始
window.addEventListener('load', () => {
    new PixelGame();
});
