class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // ゲーム状態
        this.gameState = 'start'; // 'start', 'playing', 'gameOver'
        this.score = 0;
        this.level = 1;
        this.frameCount = 0;
        
        // プレイヤー
        this.player = {
            x: 100,
            y: this.height / 2,
            width: 60,
            height: 30,
            health: 200,
            maxHealth: 200,
            speed: 3,
            shootCooldown: 0
        };
        
        // プレイヤー2
        this.player2 = {
            x: 50,
            y: this.height / 2 + 60,
            width: 60,
            height: 30,
            health: 200,
            maxHealth: 200,
            speed: 3,
            shootCooldown: 0,
            active: false // 2プレイヤーモードかどうか
        };
        
        // ゲームオブジェクト配列
        this.bullets = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.particles = [];
        this.powerups = [];
        this.stars = [];
        
        // 入力管理
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        
        // 3D効果用のパラメータ
        this.cameraZ = 0;
        this.parallaxLayers = [];
        
        // 音楽・音響システム
        this.audioContext = null;
        this.bgMusicPlaying = false;
        this.musicEnabled = true;
        this.soundEnabled = true;
        this.musicOscillators = [];
        this.masterGain = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.createStars();
        this.createParallaxLayers();
        this.initAudioSystem();
        this.gameLoop();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.gameState === 'start') {
                    this.startGame();
                } else if (this.gameState === 'gameOver') {
                    this.restart();
                }
            }
            if (e.code === 'KeyM') {
                e.preventDefault();
                this.toggleMusic();
            }
            if (e.code === 'KeyP') {
                e.preventDefault();
                this.toggle2PlayerMode();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        // ユーザーが最初にクリックしたときに音楽を開始
        document.addEventListener('click', () => {
            this.startBackgroundMusic();
        }, { once: true });
    }
    
    createStars() {
        for (let i = 0; i < 200; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                z: Math.random() * 1000,
                speed: Math.random() * 2 + 1
            });
        }
    }
    
    createParallaxLayers() {
        for (let i = 0; i < 3; i++) {
            this.parallaxLayers.push({
                objects: [],
                speed: (i + 1) * 0.5,
                depth: i + 1
            });
            
            // 各レイヤーにオブジェクトを配置
            for (let j = 0; j < 10; j++) {
                this.parallaxLayers[i].objects.push({
                    x: Math.random() * this.width * 2,
                    y: Math.random() * this.height,
                    size: Math.random() * 20 + 10,
                    type: Math.floor(Math.random() * 3)
                });
            }
        }
    }
    
    // 音響システムの初期化
    initAudioSystem() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.3; // 音量を30%に設定
        } catch (error) {
            console.log('Web Audio API not supported:', error);
            this.soundEnabled = false;
        }
    }
    
    // 背景音楽を開始
    startBackgroundMusic() {
        if (!this.audioContext || !this.musicEnabled || this.bgMusicPlaying) return;
        
        this.bgMusicPlaying = true;
        this.playBackgroundLoop();
        document.getElementById('musicStatus').textContent = 'ON';
    }
    
    // 背景音楽のループ
    playBackgroundLoop() {
        if (!this.audioContext || !this.musicEnabled) return;
        
        // Sci-Fi風の背景音楽を生成
        const playNote = (frequency, startTime, duration, type = 'sine') => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.type = type;
            osc.frequency.setValueAtTime(frequency, startTime);
            
            // フェードイン・フェードアウト
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.1, startTime + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
            
            osc.start(startTime);
            osc.stop(startTime + duration);
            
            this.musicOscillators.push(osc);
        };
        
        const currentTime = this.audioContext.currentTime;
        const beatDuration = 0.5; // 1拍の長さ
        
        // メインメロディー（Sci-Fi風）
        const melody = [
            { note: 220, duration: beatDuration * 2 }, // A3
            { note: 277.18, duration: beatDuration }, // C#4
            { note: 329.63, duration: beatDuration }, // E4
            { note: 220, duration: beatDuration * 2 }, // A3
            { note: 246.94, duration: beatDuration }, // B3
            { note: 277.18, duration: beatDuration }, // C#4
            { note: 329.63, duration: beatDuration * 2 }, // E4
            { note: 277.18, duration: beatDuration * 2 }, // C#4
        ];
        
        // ベースライン
        const bass = [
            { note: 110, duration: beatDuration * 4 }, // A2
            { note: 123.47, duration: beatDuration * 2 }, // B2
            { note: 138.59, duration: beatDuration * 2 }, // C#3
        ];
        
        let time = currentTime;
        
        // メロディーを再生
        melody.forEach(note => {
            playNote(note.note, time, note.duration, 'square');
            time += note.duration;
        });
        
        // ベースラインを再生
        time = currentTime;
        bass.forEach(note => {
            playNote(note.note, time, note.duration, 'triangle');
            time += note.duration;
        });
        
        // アンビエント効果
        playNote(440, currentTime, beatDuration * 8, 'sawtooth');
        playNote(880, currentTime + beatDuration * 2, beatDuration * 4, 'sine');
        
        // 8秒後に再度ループ
        if (this.musicEnabled) {
            setTimeout(() => {
                if (this.bgMusicPlaying && this.musicEnabled) {
                    this.playBackgroundLoop();
                }
            }, 8000);
        }
    }
    
    // 音楽のオン・オフ切り替え
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        
        if (this.musicEnabled) {
            document.getElementById('musicStatus').textContent = 'ON';
            if (this.audioContext && !this.bgMusicPlaying) {
                this.startBackgroundMusic();
            }
        } else {
            document.getElementById('musicStatus').textContent = 'OFF';
            this.stopBackgroundMusic();
        }
    }
    
    // 背景音楽を停止
    stopBackgroundMusic() {
        this.bgMusicPlaying = false;
        
        // 現在再生中のオシレーターを停止
        this.musicOscillators.forEach(osc => {
            try {
                osc.stop();
            } catch (e) {
                // 既に停止している場合は無視
            }
        });
        this.musicOscillators = [];
    }
    
    // 効果音を再生
    playSound(frequency, duration = 0.1, type = 'square', volume = 0.1) {
        if (!this.audioContext || !this.soundEnabled) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.type = type;
        osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        gain.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + duration);
    }
    
    toggle2PlayerMode() {
        this.player2.active = !this.player2.active;
        
        if (this.player2.active) {
            this.player2.health = this.player2.maxHealth;
            this.player2.x = 50;
            this.player2.y = this.height / 2 + 60;
            this.playSound(660, 0.2, 'sine', 0.08);
        } else {
            this.playSound(440, 0.2, 'sine', 0.08);
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.level = 1;
        this.frameCount = 0;
        this.player.health = this.player.maxHealth;
        this.player.x = 100;
        this.player.y = this.height / 2;
        
        // プレイヤー2の初期化
        if (this.player2.active) {
            this.player2.health = this.player2.maxHealth;
            this.player2.x = 50;
            this.player2.y = this.height / 2 + 60;
        }
        
        this.bullets = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.particles = [];
        this.powerups = [];
        
        // ゲーム開始音を再生
        this.playSound(440, 0.1, 'sine', 0.1);
        setTimeout(() => this.playSound(880, 0.1, 'sine', 0.08), 100);
        
        // 背景音楽を開始
        if (this.musicEnabled && !this.bgMusicPlaying) {
            this.startBackgroundMusic();
        }
    }
    
    update() {
        if (this.gameState === 'start') {
            // スタート画面では背景のみ更新
            this.updateBackground();
            return;
        }
        
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
        
        // レベルアップ判定
        if (this.score > this.level * 1000) {
            this.level++;
        }
    }
    
    updatePlayer() {
        // プレイヤー1の移動
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            this.player.y = Math.max(0, this.player.y - this.player.speed);
        }
        if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            this.player.y = Math.min(this.height - this.player.height, this.player.y + this.player.speed);
        }
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.x = Math.max(0, this.player.x - this.player.speed);
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.x = Math.min(this.width - this.player.width, this.player.x + this.player.speed);
        }
        
        // プレイヤー1の射撃
        if (this.player.shootCooldown > 0) {
            this.player.shootCooldown--;
        }
        
        if (this.keys['Space'] && this.player.shootCooldown === 0) {
            this.shoot(this.player);
            this.player.shootCooldown = 5;
        }
        
        // プレイヤー2の操作（アクティブな場合）
        if (this.player2.active && this.player2.health > 0) {
            // プレイヤー2の移動（IJKL キー）
            if (this.keys['KeyI']) {
                this.player2.y = Math.max(0, this.player2.y - this.player2.speed);
            }
            if (this.keys['KeyK']) {
                this.player2.y = Math.min(this.height - this.player2.height, this.player2.y + this.player2.speed);
            }
            if (this.keys['KeyJ']) {
                this.player2.x = Math.max(0, this.player2.x - this.player2.speed);
            }
            if (this.keys['KeyL']) {
                this.player2.x = Math.min(this.width - this.player2.width, this.player2.x + this.player2.speed);
            }
            
            // プレイヤー2の射撃
            if (this.player2.shootCooldown > 0) {
                this.player2.shootCooldown--;
            }
            
            if (this.keys['Enter'] && this.player2.shootCooldown === 0) {
                this.shoot(this.player2);
                this.player2.shootCooldown = 5;
            }
        }
    }
    
    shoot(player = this.player) {
        const angle = Math.atan2(
            this.mouse.y - (player.y + player.height / 2),
            this.mouse.x - (player.x + player.width)
        );
        
        this.bullets.push({
            x: player.x + player.width,
            y: player.y + player.height / 2,
            vx: Math.cos(angle) * 8,
            vy: Math.sin(angle) * 8,
            size: 4,
            life: 120,
            trail: [],
            player: player === this.player2 ? 2 : 1 // どのプレイヤーの弾か識別
        });
        
        // 射撃音を再生
        this.playSound(800, 0.05, 'square', 0.05);
        
        // マズルフラッシュパーティクル
        this.createParticles(
            player.x + player.width,
            player.y + player.height / 2,
            5,
            player === this.player2 ? '#00ff00' : '#ffff00'
        );
    }
    
    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            // 軌跡を記録
            bullet.trail.push({ x: bullet.x, y: bullet.y });
            if (bullet.trail.length > 5) {
                bullet.trail.shift();
            }
            
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            bullet.life--;
            
            if (bullet.life <= 0 || bullet.x > this.width || bullet.y < 0 || bullet.y > this.height) {
                this.bullets.splice(i, 1);
            }
        }
    }
    
    spawnEnemies() {
        // 画面上の敵の数をカウント（画面内のみ）
        const enemiesOnScreen = this.enemies.filter(enemy => 
            enemy.x >= -50 && enemy.x <= this.width + 50 && 
            enemy.y >= -50 && enemy.y <= this.height + 50
        ).length;
        
        // 敵が6体未満の場合は強制的に敵を生成（8→6に減少）
        if (enemiesOnScreen < 6) {
            // 足りない分だけ一気に生成
            const needEnemies = 6 - enemiesOnScreen;
            for (let i = 0; i < Math.min(needEnemies, 2); i++) { // 一度に最大2体まで生成（3→2に減少）
                this.createEnemy();
            }
        }
        
        // 通常の敵生成（低頻度）
        if (this.frameCount % 30 === 0) { // 30フレームに1回敵生成（20→30に増加）
            if (enemiesOnScreen < 10) { // 10体未満の場合のみ追加生成（12→10に減少）
                this.createEnemy();
            }
        }
        
        // バックアップ生成（確実に敵を維持）
        if (this.frameCount % 45 === 0 && enemiesOnScreen < 3) { // 45フレームに1回（30→45に増加）
            for (let i = 0; i < 1; i++) { // 1体生成（2→1に減少）
                this.createEnemy();
            }
        }
    }
    
    createEnemy() {
        const enemyType = Math.random();
        let enemy;
        
        // 生成位置を少しランダムに（画面の右側から少し後ろまで）
        const spawnX = this.width + Math.random() * 100;
        
        if (enemyType < 0.06) { // 通常敵
            enemy = {
                x: spawnX,
                y: Math.random() * (this.height - 40),
                width: 40,
                height: 30,
                health: 1,
                speed: 1 + this.level * 0.2,
                type: 'normal',
                shootCooldown: 0,
                rotationZ: 0
            };
        } else if (enemyType < 0.12) { // 高速敵
            enemy = {
                x: spawnX,
                y: Math.random() * (this.height - 30),
                width: 30,
                height: 20,
                health: 1,
                speed: 2.2 + this.level * 0.3,
                type: 'fast',
                shootCooldown: 0,
                rotationZ: 0,
                zigzagDirection: 1,
                zigzagTime: 0
            };
        } else if (enemyType < 0.18) { // 重装甲敵
            enemy = {
                x: spawnX,
                y: Math.random() * (this.height - 50),
                width: 50,
                height: 40,
                health: 3,
                speed: 0.6 + this.level * 0.15,
                type: 'armored',
                shootCooldown: 0,
                rotationZ: 0
            };
        } else if (enemyType < 0.24) { // ドローン（縦移動）
            enemy = {
                x: spawnX,
                y: Math.random() * (this.height - 35),
                width: 35,
                height: 25,
                health: 1,
                speed: 0.9 + this.level * 0.2,
                type: 'drone',
                shootCooldown: 0,
                rotationZ: 0,
                verticalSpeed: (Math.random() - 0.5) * 2,
                targetY: Math.random() * this.height
            };
        } else if (enemyType < 0.30) { // スナイパー（遠距離射撃）
            enemy = {
                x: spawnX,
                y: Math.random() * (this.height - 45),
                width: 45,
                height: 35,
                health: 2,
                speed: 0.4 + this.level * 0.15,
                type: 'sniper',
                shootCooldown: 0,
                rotationZ: 0,
                chargeTime: 0
            };
        } else if (enemyType < 0.36) { // 大型敵
            enemy = {
                x: spawnX,
                y: Math.random() * (this.height - 80),
                width: 80,
                height: 60,
                health: 2,
                speed: 0.8 + this.level * 0.15,
                type: 'large',
                shootCooldown: 0,
                rotationZ: 0
            };
        } else if (enemyType < 0.40) { // ボス敵
            enemy = {
                x: spawnX,
                y: Math.random() * (this.height - 120),
                width: 120,
                height: 100,
                health: 5,
                speed: 0.4 + this.level * 0.08,
                type: 'boss',
                shootCooldown: 0,
                rotationZ: 0,
                pattern: Math.floor(Math.random() * 3)
            };
        } else if (enemyType < 0.46) { // 新追加1: ステルス敵（透明化）
            enemy = {
                x: spawnX,
                y: Math.random() * (this.height - 35),
                width: 35,
                height: 25,
                health: 1,
                speed: 1.5 + this.level * 0.25,
                type: 'stealth',
                shootCooldown: 0,
                rotationZ: 0,
                stealthCycle: 0,
                isVisible: true
            };
        } else if (enemyType < 0.52) { // 新追加2: ミサイル敵（ミサイル発射）
            enemy = {
                x: spawnX,
                y: Math.random() * (this.height - 55),
                width: 55,
                height: 40,
                health: 2,
                speed: 0.7 + this.level * 0.18,
                type: 'missile',
                shootCooldown: 0,
                rotationZ: 0,
                missileCooldown: 0
            };
        } else if (enemyType < 0.58) { // 新追加3: シールド敵（バリア持ち）
            enemy = {
                x: spawnX,
                y: Math.random() * (this.height - 60),
                width: 60,
                height: 45,
                health: 4,
                speed: 0.5 + this.level * 0.12,
                type: 'shield',
                shootCooldown: 0,
                rotationZ: 0,
                shieldActive: true,
                shieldHealth: 2
            };
        } else if (enemyType < 0.64) { // 新追加4: 分裂敵（死亡時に分裂）
            enemy = {
                x: spawnX,
                y: Math.random() * (this.height - 50),
                width: 50,
                height: 35,
                health: 2,
                speed: 1.1 + this.level * 0.2,
                type: 'splitter',
                shootCooldown: 0,
                rotationZ: 0
            };
        } else if (enemyType < 0.70) { // 新追加5: レーザー敵（レーザービーム）
            enemy = {
                x: spawnX,
                y: Math.random() * (this.height - 65),
                width: 65,
                height: 50,
                health: 3,
                speed: 0.3 + this.level * 0.1,
                type: 'laser',
                shootCooldown: 0,
                rotationZ: 0,
                laserCharging: false,
                laserCharge: 0
            };
        } else if (enemyType < 0.76) { // 新追加6: 電撃敵（電撃攻撃）
            enemy = {
                x: spawnX,
                y: Math.random() * (this.height - 40),
                width: 40,
                height: 30,
                health: 1,
                speed: 1.8 + this.level * 0.3,
                type: 'electric',
                shootCooldown: 0,
                rotationZ: 0,
                electricCharge: 0
            };
        } else if (enemyType < 0.82) { // 新追加7: 鉱山敵（地雷設置）
            enemy = {
                x: spawnX,
                y: Math.random() * (this.height - 45),
                width: 45,
                height: 35,
                health: 2,
                speed: 0.8 + this.level * 0.15,
                type: 'miner',
                shootCooldown: 0,
                rotationZ: 0,
                mineCooldown: 0
            };
        } else if (enemyType < 0.88) { // 新追加8: テレポート敵（瞬間移動）
            enemy = {
                x: spawnX,
                y: Math.random() * (this.height - 35),
                width: 35,
                height: 25,
                health: 1,
                speed: 1.3 + this.level * 0.25,
                type: 'teleporter',
                shootCooldown: 0,
                rotationZ: 0,
                teleportCooldown: 0,
                teleporting: false
            };
        } else if (enemyType < 0.94) { // 新追加9: 回復敵（他の敵を回復）
            enemy = {
                x: spawnX,
                y: Math.random() * (this.height - 50),
                width: 50,
                height: 40,
                health: 2,
                speed: 0.6 + this.level * 0.15,
                type: 'healer',
                shootCooldown: 0,
                rotationZ: 0,
                healCooldown: 0
            };
        } else { // 新追加10: 巨大ボス敵（超大型）
            enemy = {
                x: spawnX,
                y: Math.random() * (this.height - 200),
                width: 200,
                height: 150,
                health: 10,
                speed: 0.2 + this.level * 0.05,
                type: 'megaboss',
                shootCooldown: 0,
                rotationZ: 0,
                pattern: Math.floor(Math.random() * 5),
                phase: 1,
                specialAttackCooldown: 0
            };
        }
        
        this.enemies.push(enemy);
    }
    
    updateEnemies() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // 敵タイプ別の移動パターン
            if (enemy.type === 'fast') {
                // 高速敵：ジグザグ移動
                enemy.x -= enemy.speed;
                enemy.zigzagTime += 0.1;
                enemy.y += Math.sin(enemy.zigzagTime) * enemy.zigzagDirection * 2;
                enemy.rotationZ += 0.05;
            } else if (enemy.type === 'drone') {
                // ドローン：縦移動追尾
                enemy.x -= enemy.speed;
                const distanceToTarget = enemy.targetY - enemy.y;
                if (Math.abs(distanceToTarget) > 5) {
                    enemy.y += Math.sign(distanceToTarget) * Math.abs(enemy.verticalSpeed);
                } else {
                    enemy.targetY = Math.random() * this.height;
                }
                enemy.rotationZ += 0.03;
            } else if (enemy.type === 'sniper') {
                // スナイパー：ゆっくり移動、長距離射撃
                enemy.x -= enemy.speed;
                enemy.rotationZ += 0.01;
                enemy.chargeTime++;
            } else if (enemy.type === 'armored') {
                // 重装甲敵：安定した移動
                enemy.x -= enemy.speed;
                enemy.rotationZ += 0.015;
            } else if (enemy.type === 'stealth') {
                // ステルス敵：透明化サイクル
                enemy.x -= enemy.speed;
                enemy.stealthCycle++;
                enemy.isVisible = (enemy.stealthCycle % 120) < 60; // 60フレーム表示、60フレーム透明
                enemy.rotationZ += 0.04;
            } else if (enemy.type === 'missile') {
                // ミサイル敵：安定移動でミサイル発射
                enemy.x -= enemy.speed;
                enemy.missileCooldown--;
                enemy.rotationZ += 0.02;
            } else if (enemy.type === 'shield') {
                // シールド敵：ゆっくり移動
                enemy.x -= enemy.speed;
                enemy.rotationZ += 0.01;
            } else if (enemy.type === 'splitter') {
                // 分裂敵：波状移動
                enemy.x -= enemy.speed;
                enemy.y += Math.sin(this.frameCount * 0.05) * 1.5;
                enemy.rotationZ += 0.03;
            } else if (enemy.type === 'laser') {
                // レーザー敵：停止してレーザーチャージ
                if (enemy.x > this.width * 0.7) {
                    enemy.x -= enemy.speed;
                } else {
                    enemy.laserCharge++;
                    if (enemy.laserCharge > 60) {
                        enemy.laserCharging = true;
                    }
                }
                enemy.rotationZ += 0.005;
            } else if (enemy.type === 'electric') {
                // 電撃敵：ランダム移動
                enemy.x -= enemy.speed;
                enemy.y += (Math.random() - 0.5) * 3;
                enemy.electricCharge++;
                enemy.rotationZ += 0.06;
            } else if (enemy.type === 'miner') {
                // 鉱山敵：直線移動で地雷設置
                enemy.x -= enemy.speed;
                enemy.mineCooldown--;
                enemy.rotationZ += 0.02;
            } else if (enemy.type === 'teleporter') {
                // テレポート敵：瞬間移動
                if (!enemy.teleporting) {
                    enemy.x -= enemy.speed;
                    enemy.teleportCooldown--;
                    if (enemy.teleportCooldown <= 0) {
                        enemy.teleporting = true;
                        enemy.teleportCooldown = 180;
                    }
                } else {
                    // テレポート実行
                    enemy.x = Math.random() * (this.width * 0.8) + this.width * 0.2;
                    enemy.y = Math.random() * (this.height - enemy.height);
                    enemy.teleporting = false;
                }
                enemy.rotationZ += 0.08;
            } else if (enemy.type === 'healer') {
                // 回復敵：ゆっくり移動で他の敵を回復
                enemy.x -= enemy.speed;
                enemy.healCooldown--;
                enemy.rotationZ += 0.015;
                
                // 回復処理
                if (enemy.healCooldown <= 0) {
                    for (let otherEnemy of this.enemies) {
                        if (otherEnemy !== enemy && otherEnemy.type !== 'healer') {
                            const distance = Math.sqrt(
                                Math.pow(enemy.x - otherEnemy.x, 2) + 
                                Math.pow(enemy.y - otherEnemy.y, 2)
                            );
                            if (distance < 100) {
                                otherEnemy.health = Math.min(otherEnemy.health + 1, this.getMaxHealth(otherEnemy.type));
                                this.createParticles(otherEnemy.x + otherEnemy.width/2, otherEnemy.y + otherEnemy.height/2, 5, '#00ff00');
                            }
                        }
                    }
                    enemy.healCooldown = 300;
                }
            } else if (enemy.type === 'megaboss') {
                // 巨大ボス：複雑な移動パターン
                enemy.x -= enemy.speed;
                enemy.specialAttackCooldown--;
                
                // フェーズ別移動
                if (enemy.health > 7) {
                    enemy.phase = 1;
                    enemy.y += Math.sin(this.frameCount * 0.02) * 0.5;
                } else if (enemy.health > 4) {
                    enemy.phase = 2;
                    enemy.y += Math.sin(this.frameCount * 0.04) * 1;
                } else {
                    enemy.phase = 3;
                    enemy.y += Math.sin(this.frameCount * 0.06) * 1.5;
                }
                enemy.rotationZ += 0.005;
            } else {
                // 通常敵、大型敵、ボス敵
                enemy.x -= enemy.speed;
                enemy.rotationZ += 0.02;
            }
            
            // 敵の射撃
            enemy.shootCooldown--;
            if (enemy.shootCooldown <= 0) {
                this.enemyShoot(enemy);
                
                // タイプ別射撃頻度
                switch (enemy.type) {
                    case 'fast':
                        enemy.shootCooldown = 80;
                        break;
                    case 'drone':
                        enemy.shootCooldown = 100;
                        break;
                    case 'sniper':
                        enemy.shootCooldown = 180;
                        break;
                    case 'armored':
                        enemy.shootCooldown = 90;
                        break;
                    case 'boss':
                        enemy.shootCooldown = 60;
                        break;
                    case 'stealth':
                        enemy.shootCooldown = 70;
                        break;
                    case 'missile':
                        enemy.shootCooldown = 200;
                        break;
                    case 'shield':
                        enemy.shootCooldown = 110;
                        break;
                    case 'splitter':
                        enemy.shootCooldown = 85;
                        break;
                    case 'laser':
                        enemy.shootCooldown = 300;
                        break;
                    case 'electric':
                        enemy.shootCooldown = 60;
                        break;
                    case 'miner':
                        enemy.shootCooldown = 150;
                        break;
                    case 'teleporter':
                        enemy.shootCooldown = 95;
                        break;
                    case 'healer':
                        enemy.shootCooldown = 140;
                        break;
                    case 'megaboss':
                        enemy.shootCooldown = 40;
                        break;
                    default:
                        enemy.shootCooldown = 120;
                }
            }
            
            // 画面外に出たら削除
            if (enemy.x + enemy.width < 0 || enemy.y < -50 || enemy.y > this.height + 50) {
                this.enemies.splice(i, 1);
                continue;
            }
            
            // 敵が死んだら削除
            if (enemy.health <= 0) {
                this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                
                // 爆発音を再生
                this.playSound(150, 0.3, 'sawtooth', 0.08);
                
                // タイプ別スコア
                switch (enemy.type) {
                    case 'fast':
                        this.score += 120;
                        break;
                    case 'drone':
                        this.score += 150;
                        break;
                    case 'sniper':
                        this.score += 200;
                        break;
                    case 'armored':
                        this.score += 180;
                        break;
                    case 'large':
                        this.score += 200;
                        break;
                    case 'boss':
                        this.score += 500;
                        break;
                    case 'stealth':
                        this.score += 160;
                        break;
                    case 'missile':
                        this.score += 220;
                        break;
                    case 'shield':
                        this.score += 250;
                        break;
                    case 'splitter':
                        this.score += 140;
                        break;
                    case 'laser':
                        this.score += 300;
                        break;
                    case 'electric':
                        this.score += 130;
                        break;
                    case 'miner':
                        this.score += 190;
                        break;
                    case 'teleporter':
                        this.score += 170;
                        break;
                    case 'healer':
                        this.score += 280;
                        break;
                    case 'megaboss':
                        this.score += 1000;
                        break;
                    default:
                        this.score += 100;
                }
                
                // 分裂敵の特殊処理
                if (enemy.type === 'splitter') {
                    // 小さい敵2体に分裂
                    for (let i = 0; i < 2; i++) {
                        this.enemies.push({
                            x: enemy.x + (i - 0.5) * 20,
                            y: enemy.y + (i - 0.5) * 20,
                            width: 25,
                            height: 20,
                            health: 1,
                            speed: 1.8 + this.level * 0.3,
                            type: 'mini',
                            shootCooldown: 60,
                            rotationZ: 0
                        });
                    }
                }
                
                // パワーアップドロップ
                if (Math.random() < 0.3) {
                    this.powerups.push({
                        x: enemy.x,
                        y: enemy.y + enemy.height / 2,
                        type: 'health',
                        life: 300,
                        rotationZ: 0
                    });
                }
                
                this.enemies.splice(i, 1);
            }
        }
    }
    
    enemyShoot(enemy) {
        const dx = this.player.x - enemy.x;
        const dy = this.player.y - enemy.y;
        const angle = Math.atan2(dy, dx);
        
        if (enemy.type === 'boss') {
            // ボスは複数弾発射
            for (let i = -1; i <= 1; i++) {
                this.enemyBullets.push({
                    x: enemy.x,
                    y: enemy.y + enemy.height / 2,
                    vx: Math.cos(angle + i * 0.3) * 4,
                    vy: Math.sin(angle + i * 0.3) * 4,
                    size: 6,
                    life: 180,
                    type: 'boss'
                });
            }
        } else if (enemy.type === 'fast') {
            // 高速敵：小さく速い弾
            this.enemyBullets.push({
                x: enemy.x,
                y: enemy.y + enemy.height / 2,
                vx: Math.cos(angle) * 5,
                vy: Math.sin(angle) * 5,
                size: 3,
                life: 120,
                type: 'fast'
            });
        } else if (enemy.type === 'drone') {
            // ドローン：追尾弾
            this.enemyBullets.push({
                x: enemy.x,
                y: enemy.y + enemy.height / 2,
                vx: Math.cos(angle) * 2.5,
                vy: Math.sin(angle) * 2.5,
                size: 4,
                life: 200,
                type: 'homing',
                targetX: this.player.x,
                targetY: this.player.y
            });
        } else if (enemy.type === 'sniper') {
            // スナイパー：大きく強力な弾
            if (enemy.chargeTime > 120) { // チャージ時間
                this.enemyBullets.push({
                    x: enemy.x,
                    y: enemy.y + enemy.height / 2,
                    vx: Math.cos(angle) * 6,
                    vy: Math.sin(angle) * 6,
                    size: 8,
                    life: 180,
                    type: 'sniper'
                });
                enemy.chargeTime = 0;
            }
        } else if (enemy.type === 'armored') {
            // 重装甲敵：散弾
            for (let i = -0.2; i <= 0.2; i += 0.2) {
                this.enemyBullets.push({
                    x: enemy.x,
                    y: enemy.y + enemy.height / 2,
                    vx: Math.cos(angle + i) * 3,
                    vy: Math.sin(angle + i) * 3,
                    size: 4,
                    life: 150,
                    type: 'spread'
                });
            }
        } else if (enemy.type === 'stealth') {
            // ステルス敵：見えている時のみ射撃
            if (enemy.isVisible) {
                this.enemyBullets.push({
                    x: enemy.x,
                    y: enemy.y + enemy.height / 2,
                    vx: Math.cos(angle) * 4,
                    vy: Math.sin(angle) * 4,
                    size: 3,
                    life: 140,
                    type: 'stealth'
                });
            }
        } else if (enemy.type === 'missile') {
            // ミサイル敵：追尾ミサイル
            if (enemy.missileCooldown <= 0) {
                this.enemyBullets.push({
                    x: enemy.x,
                    y: enemy.y + enemy.height / 2,
                    vx: Math.cos(angle) * 2,
                    vy: Math.sin(angle) * 2,
                    size: 6,
                    life: 300,
                    type: 'missile',
                    homingStrength: 0.08
                });
                enemy.missileCooldown = 180;
            }
        } else if (enemy.type === 'shield') {
            // シールド敵：バリア貫通弾
            this.enemyBullets.push({
                x: enemy.x,
                y: enemy.y + enemy.height / 2,
                vx: Math.cos(angle) * 3.5,
                vy: Math.sin(angle) * 3.5,
                size: 5,
                life: 160,
                type: 'piercing'
            });
        } else if (enemy.type === 'splitter') {
            // 分裂敵：分裂弾
            this.enemyBullets.push({
                x: enemy.x,
                y: enemy.y + enemy.height / 2,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                size: 4,
                life: 100,
                type: 'split',
                splitTimer: 50
            });
        } else if (enemy.type === 'laser') {
            // レーザー敵：レーザービーム
            if (enemy.laserCharging) {
                this.enemyBullets.push({
                    x: enemy.x,
                    y: enemy.y + enemy.height / 2,
                    vx: Math.cos(angle) * 8,
                    vy: Math.sin(angle) * 8,
                    size: 12,
                    life: 80,
                    type: 'laser',
                    width: 15
                });
                enemy.laserCharging = false;
                enemy.laserCharge = 0;
            }
        } else if (enemy.type === 'electric') {
            // 電撃敵：電撃弾
            if (enemy.electricCharge > 60) {
                for (let i = -0.5; i <= 0.5; i += 0.25) {
                    this.enemyBullets.push({
                        x: enemy.x,
                        y: enemy.y + enemy.height / 2,
                        vx: Math.cos(angle + i) * 4,
                        vy: Math.sin(angle + i) * 4,
                        size: 3,
                        life: 120,
                        type: 'electric'
                    });
                }
                enemy.electricCharge = 0;
            }
        } else if (enemy.type === 'miner') {
            // 鉱山敵：地雷設置
            if (enemy.mineCooldown <= 0) {
                this.enemyBullets.push({
                    x: enemy.x,
                    y: enemy.y + enemy.height / 2,
                    vx: 0,
                    vy: 0,
                    size: 8,
                    life: 600,
                    type: 'mine',
                    armed: false,
                    armTimer: 60
                });
                enemy.mineCooldown = 240;
            }
        } else if (enemy.type === 'teleporter') {
            // テレポート敵：瞬間弾
            this.enemyBullets.push({
                x: enemy.x,
                y: enemy.y + enemy.height / 2,
                vx: Math.cos(angle) * 6,
                vy: Math.sin(angle) * 6,
                size: 4,
                life: 100,
                type: 'teleport'
            });
        } else if (enemy.type === 'healer') {
            // 回復敵：妨害弾
            this.enemyBullets.push({
                x: enemy.x,
                y: enemy.y + enemy.height / 2,
                vx: Math.cos(angle) * 2,
                vy: Math.sin(angle) * 2,
                size: 5,
                life: 200,
                type: 'heal'
            });
        } else if (enemy.type === 'megaboss') {
            // 巨大ボス：フェーズ別攻撃
            if (enemy.phase === 1) {
                // 5方向弾
                for (let i = -2; i <= 2; i++) {
                    this.enemyBullets.push({
                        x: enemy.x,
                        y: enemy.y + enemy.height / 2,
                        vx: Math.cos(angle + i * 0.2) * 4,
                        vy: Math.sin(angle + i * 0.2) * 4,
                        size: 7,
                        life: 200,
                        type: 'megaboss'
                    });
                }
            } else if (enemy.phase === 2) {
                // 円形弾幕
                for (let i = 0; i < 8; i++) {
                    const circleAngle = (i / 8) * Math.PI * 2;
                    this.enemyBullets.push({
                        x: enemy.x + enemy.width / 2,
                        y: enemy.y + enemy.height / 2,
                        vx: Math.cos(circleAngle) * 3,
                        vy: Math.sin(circleAngle) * 3,
                        size: 6,
                        life: 180,
                        type: 'megaboss'
                    });
                }
            } else {
                // レーザー攻撃
                this.enemyBullets.push({
                    x: enemy.x,
                    y: enemy.y + enemy.height / 2,
                    vx: Math.cos(angle) * 10,
                    vy: Math.sin(angle) * 10,
                    size: 20,
                    life: 60,
                    type: 'megalaser',
                    width: 25
                });
            }
        } else if (enemy.type === 'mini') {
            // 分裂後の小型敵
            this.enemyBullets.push({
                x: enemy.x,
                y: enemy.y + enemy.height / 2,
                vx: Math.cos(angle) * 4,
                vy: Math.sin(angle) * 4,
                size: 2,
                life: 100,
                type: 'mini'
            });
        } else {
            // 通常敵・大型敵
            this.enemyBullets.push({
                x: enemy.x,
                y: enemy.y + enemy.height / 2,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                size: 4,
                life: 150,
                type: 'normal'
            });
        }
    }
    
    updateEnemyBullets() {
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            
            // 追尾弾の特殊処理
            if ((bullet.type === 'homing' || bullet.type === 'missile') && bullet.life > 50) {
                const dx = this.player.x - bullet.x;
                const dy = this.player.y - bullet.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0) {
                    const homingStrength = bullet.homingStrength || 0.05;
                    bullet.vx += (dx / distance) * homingStrength;
                    bullet.vy += (dy / distance) * homingStrength;
                    
                    // 速度制限
                    const maxSpeed = bullet.type === 'missile' ? 5 : 4;
                    const speed = Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);
                    if (speed > maxSpeed) {
                        bullet.vx = (bullet.vx / speed) * maxSpeed;
                        bullet.vy = (bullet.vy / speed) * maxSpeed;
                    }
                }
            }
            
            // 分裂弾の処理
            if (bullet.type === 'split' && bullet.splitTimer > 0) {
                bullet.splitTimer--;
                if (bullet.splitTimer === 0) {
                    // 3方向に分裂
                    for (let j = -1; j <= 1; j++) {
                        const splitAngle = Math.atan2(bullet.vy, bullet.vx) + j * 0.5;
                        this.enemyBullets.push({
                            x: bullet.x,
                            y: bullet.y,
                            vx: Math.cos(splitAngle) * 2.5,
                            vy: Math.sin(splitAngle) * 2.5,
                            size: 3,
                            life: 80,
                            type: 'mini'
                        });
                    }
                    this.enemyBullets.splice(i, 1);
                    continue;
                }
            }
            
            // 地雷の処理
            if (bullet.type === 'mine') {
                if (bullet.armTimer > 0) {
                    bullet.armTimer--;
                } else {
                    bullet.armed = true;
                    // プレイヤーとの距離チェック
                    const distance = Math.sqrt(
                        Math.pow(this.player.x - bullet.x, 2) + 
                        Math.pow(this.player.y - bullet.y, 2)
                    );
                    if (distance < 50) {
                        // 爆発
                        this.createExplosion(bullet.x, bullet.y);
                        this.playSound(120, 0.5, 'sawtooth', 0.1);
                        this.enemyBullets.splice(i, 1);
                        continue;
                    }
                }
            }
            
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            bullet.life--;
            
            if (bullet.life <= 0 || bullet.x < 0 || bullet.y < 0 || bullet.y > this.height) {
                this.enemyBullets.splice(i, 1);
            }
        }
    }
    
    updatePowerups() {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            powerup.x -= 2;
            powerup.life--;
            powerup.rotationZ += 0.05;
            
            if (powerup.life <= 0 || powerup.x < -20) {
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
                if (this.isColliding(bullet, enemy)) {
                    enemy.health--;
                    this.createParticles(bullet.x, bullet.y, 8, '#ff4444');
                    this.bullets.splice(i, 1);
                    break;
                }
            }
        }
        
        // 敵の弾とプレイヤー1の衝突
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            if (this.isColliding(bullet, this.player)) {
                this.player.health -= 5; // ダメージを半分に
                this.createParticles(bullet.x, bullet.y, 10, '#ff0000');
                this.enemyBullets.splice(i, 1);
                
                // ダメージ音を再生
                this.playSound(200, 0.2, 'triangle', 0.06);
                
                if (this.player.health <= 0) {
                    this.gameOver();
                }
            }
        }
        
        // 敵の弾とプレイヤー2の衝突
        if (this.player2.active && this.player2.health > 0) {
            for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
                const bullet = this.enemyBullets[i];
                if (this.isColliding(bullet, this.player2)) {
                    this.player2.health -= 5;
                    this.createParticles(bullet.x, bullet.y, 10, '#ff0000');
                    this.enemyBullets.splice(i, 1);
                    
                    // ダメージ音を再生
                    this.playSound(200, 0.2, 'triangle', 0.06);
                    
                    if (this.player2.health <= 0) {
                        // プレイヤー2がダウンしても即ゲームオーバーにはしない
                        if (this.player.health <= 0) {
                            this.gameOver();
                        }
                    }
                }
            }
        }
        
        // プレイヤー1と敵の衝突
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (this.isColliding(this.player, enemy)) {
                this.player.health -= 10; // ダメージを半分に
                enemy.health = 0;
                this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                
                if (this.player.health <= 0) {
                    this.gameOver();
                }
            }
        }
        
        // プレイヤー2と敵の衝突
        if (this.player2.active && this.player2.health > 0) {
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                if (this.isColliding(this.player2, enemy)) {
                    this.player2.health -= 10;
                    enemy.health = 0;
                    this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                    
                    if (this.player2.health <= 0) {
                        // プレイヤー2がダウンしても即ゲームオーバーにはしない
                        if (this.player.health <= 0) {
                            this.gameOver();
                        }
                    }
                }
            }
        }
        
        // プレイヤー1とパワーアップの衝突
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            if (this.isColliding(this.player, powerup)) {
                if (powerup.type === 'health') {
                    this.player.health = Math.min(this.player.maxHealth, this.player.health + 50); // 回復量を増加
                }
                this.createParticles(powerup.x, powerup.y, 15, '#00ff00');
                this.powerups.splice(i, 1);
                
                // パワーアップ取得音を再生
                this.playSound(600, 0.3, 'sine', 0.1);
                setTimeout(() => this.playSound(800, 0.2, 'sine', 0.08), 100);
            }
        }
        
        // プレイヤー2とパワーアップの衝突
        if (this.player2.active && this.player2.health > 0) {
            for (let i = this.powerups.length - 1; i >= 0; i--) {
                const powerup = this.powerups[i];
                if (this.isColliding(this.player2, powerup)) {
                    if (powerup.type === 'health') {
                        this.player2.health = Math.min(this.player2.maxHealth, this.player2.health + 50);
                    }
                    this.createParticles(powerup.x, powerup.y, 15, '#00ff00');
                    this.powerups.splice(i, 1);
                    
                    // パワーアップ取得音を再生
                    this.playSound(600, 0.3, 'sine', 0.1);
                    setTimeout(() => this.playSound(800, 0.2, 'sine', 0.08), 100);
                }
            }
        }
    }
    
    isColliding(obj1, obj2) {
        // プレイヤーの当たり判定を小さくする
        let obj1X = obj1.x;
        let obj1Y = obj1.y;
        let obj1Width = obj1.width || obj1.size;
        let obj1Height = obj1.height || obj1.size;
        
        // obj1がプレイヤー（1または2）の場合、当たり判定を75%小さくする（4分の1サイズ）
        if (obj1 === this.player || obj1 === this.player2) {
            const shrinkX = obj1Width * 0.375;
            const shrinkY = obj1Height * 0.375;
            obj1X += shrinkX;
            obj1Y += shrinkY;
            obj1Width -= shrinkX * 2;
            obj1Height -= shrinkY * 2;
        }
        
        // obj2がプレイヤー（1または2）の場合、当たり判定を75%小さくする（4分の1サイズ）
        let obj2X = obj2.x;
        let obj2Y = obj2.y;
        let obj2Width = obj2.width || obj2.size;
        let obj2Height = obj2.height || obj2.size;
        
        if (obj2 === this.player || obj2 === this.player2) {
            const shrinkX = obj2Width * 0.375;
            const shrinkY = obj2Height * 0.375;
            obj2X += shrinkX;
            obj2Y += shrinkY;
            obj2Width -= shrinkX * 2;
            obj2Height -= shrinkY * 2;
        }
        
        return obj1X < obj2X + obj2Width &&
               obj1X + obj1Width > obj2X &&
               obj1Y < obj2Y + obj2Height &&
               obj1Y + obj1Height > obj2Y;
    }
    
    createParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 30,
                maxLife: 30,
                color: color,
                size: Math.random() * 3 + 1
            });
        }
    }
    
    createExplosion(x, y) {
        this.createParticles(x, y, 20, '#ff8800');
        this.createParticles(x, y, 15, '#ffff00');
        this.createParticles(x, y, 10, '#ff0000');
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            particle.life--;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    updateBackground() {
        // 星の更新
        for (let star of this.stars) {
            star.x -= star.speed * (1000 - star.z) / 1000 * 2;
            if (star.x < 0) {
                star.x = this.width;
                star.y = Math.random() * this.height;
                star.z = Math.random() * 1000;
            }
        }
        
        // パララックスレイヤーの更新
        for (let layer of this.parallaxLayers) {
            for (let obj of layer.objects) {
                obj.x -= layer.speed;
                if (obj.x < -50) {
                    obj.x = this.width + Math.random() * 200;
                    obj.y = Math.random() * this.height;
                }
            }
        }
        
        this.cameraZ += 0.5;
    }
    
    render() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.renderStars();
        this.renderParallaxLayers();
        
        if (this.gameState === 'start') {
            this.renderStartScreen();
        } else {
            this.renderPlayer();
            if (this.player2.active && this.player2.health > 0) {
                this.renderPlayer2();
            }
            this.renderBullets();
            this.renderEnemies();
            this.renderEnemyBullets();
            this.renderPowerups();
            this.renderParticles();
            this.renderEffects();
            this.renderHitboxes(); // 当たり判定の可視化を追加
            this.renderUI(); // UI描画を追加
        }
    }
    
    renderStartScreen() {
        this.ctx.save();
        
        // 背景グラデーション
        const bgGradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        bgGradient.addColorStop(0, 'rgba(0, 30, 60, 0.8)');
        bgGradient.addColorStop(0.5, 'rgba(0, 15, 40, 0.6)');
        bgGradient.addColorStop(1, 'rgba(0, 0, 20, 0.8)');
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // タイトルロゴ
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#00aaff';
        this.ctx.shadowBlur = 20;
        
        // メインタイトル
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.fillText('SPACE FIGHTER', this.width / 2, this.height / 2 - 120);
        
        // サブタイトル
        this.ctx.fillStyle = '#00aaff';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText('- Stellar Combat -', this.width / 2, this.height / 2 - 80);
        
        // 戦闘機のプレビュー
        this.ctx.save();
        this.ctx.translate(this.width / 2, this.height / 2 - 20);
        this.ctx.scale(1.5, 1.5);
        
        // 機体本体（戦闘機風）
        const bodyGradient = this.ctx.createLinearGradient(-30, -15, 30, 15);
        bodyGradient.addColorStop(0, '#2a4d6b');
        bodyGradient.addColorStop(0.3, '#3a6d8b');
        bodyGradient.addColorStop(0.7, '#1a3d5b');
        bodyGradient.addColorStop(1, '#0a2d4b');
        
        this.ctx.fillStyle = bodyGradient;
        this.ctx.beginPath();
        this.ctx.moveTo(-30, 0);
        this.ctx.lineTo(25, -8);
        this.ctx.lineTo(30, -3);
        this.ctx.lineTo(30, 3);
        this.ctx.lineTo(25, 8);
        this.ctx.lineTo(-30, 0);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 主翼
        const wingGradient = this.ctx.createLinearGradient(0, -15, 0, -5);
        wingGradient.addColorStop(0, '#4a7d9b');
        wingGradient.addColorStop(1, '#2a5d7b');
        this.ctx.fillStyle = wingGradient;
        this.ctx.beginPath();
        this.ctx.moveTo(5, -8);
        this.ctx.lineTo(15, -18);
        this.ctx.lineTo(20, -15);
        this.ctx.lineTo(15, -8);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.moveTo(5, 8);
        this.ctx.lineTo(15, 18);
        this.ctx.lineTo(20, 15);
        this.ctx.lineTo(15, 8);
        this.ctx.closePath();
        this.ctx.fill();
        
        // エンジン噴射エフェクト
        this.ctx.fillStyle = '#00ffff';
        this.ctx.beginPath();
        this.ctx.arc(-40, 0, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#0088ff';
        this.ctx.beginPath();
        this.ctx.arc(-50, 0, 12, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
        
        // ゲーム説明
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '18px Arial';
        this.ctx.fillText('横スクロール シューティングゲーム', this.width / 2, this.height / 2 + 60);
        
        this.ctx.fillStyle = '#cccccc';
        this.ctx.font = '14px Arial';
        this.ctx.fillText('17種類の敵との戦いに挑戦！', this.width / 2, this.height / 2 + 85);
        
        // 操作説明
        this.ctx.fillStyle = '#ffff88';
        this.ctx.font = '16px Arial';
        this.ctx.fillText('操作方法:', this.width / 2, this.height / 2 + 120);
        
        this.ctx.fillStyle = '#dddddd';
        this.ctx.font = '14px Arial';
        this.ctx.fillText('移動: ↑↓←→ キー または WASD', this.width / 2, this.height / 2 + 145);
        this.ctx.fillText('射撃: スペースキー', this.width / 2, this.height / 2 + 165);
        this.ctx.fillText('音楽ON/OFF: Mキー', this.width / 2, this.height / 2 + 185);
        this.ctx.fillText('2プレイヤーモード: Pキー', this.width / 2, this.height / 2 + 205);
        
        // スタートボタン
        const time = Date.now() * 0.005;
        const pulseAlpha = 0.7 + Math.sin(time) * 0.3;
        
        this.ctx.save();
        this.ctx.globalAlpha = pulseAlpha;
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText('SPACE キーでスタート！', this.width / 2, this.height / 2 + 250);
        this.ctx.restore();
        
        // 装飾的なパーティクル
        for (let i = 0; i < 20; i++) {
            const x = this.width / 2 + Math.cos(time + i) * 200;
            const y = this.height / 2 + Math.sin(time + i * 0.5) * 100;
            const alpha = 0.3 + Math.sin(time * 2 + i) * 0.3;
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = '#00aaff';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
        
        this.ctx.restore();
    }
    
    renderStars() {
        for (let star of this.stars) {
            const size = (1000 - star.z) / 1000 * 3;
            const alpha = (1000 - star.z) / 1000;
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(star.x, star.y, size, size);
            this.ctx.restore();
        }
    }
    
    renderParallaxLayers() {
        for (let layer of this.parallaxLayers) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.3 - layer.depth * 0.1;
            
            for (let obj of layer.objects) {
                this.ctx.fillStyle = `hsl(${layer.depth * 60}, 50%, 30%)`;
                
                if (obj.type === 0) {
                    // 円形オブジェクト
                    this.ctx.beginPath();
                    this.ctx.arc(obj.x, obj.y, obj.size / layer.depth, 0, Math.PI * 2);
                    this.ctx.fill();
                } else if (obj.type === 1) {
                    // 四角形オブジェクト
                    this.ctx.fillRect(obj.x, obj.y, obj.size / layer.depth, obj.size / layer.depth);
                } else {
                    // 三角形オブジェクト
                    this.ctx.beginPath();
                    this.ctx.moveTo(obj.x, obj.y);
                    this.ctx.lineTo(obj.x + obj.size / layer.depth, obj.y + obj.size / layer.depth / 2);
                    this.ctx.lineTo(obj.x, obj.y + obj.size / layer.depth);
                    this.ctx.fill();
                }
            }
            this.ctx.restore();
        }
    }
    
    renderPlayer() {
        this.ctx.save();
        this.ctx.translate(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
        
        // 機体本体（戦闘機風）
        const bodyGradient = this.ctx.createLinearGradient(-30, -15, 30, 15);
        bodyGradient.addColorStop(0, '#2a4d6b');
        bodyGradient.addColorStop(0.3, '#3a6d8b');
        bodyGradient.addColorStop(0.7, '#1a3d5b');
        bodyGradient.addColorStop(1, '#0a2d4b');
        
        this.ctx.fillStyle = bodyGradient;
        this.ctx.beginPath();
        this.ctx.moveTo(-30, 0);  // 機首
        this.ctx.lineTo(25, -8);  // 上翼付け根
        this.ctx.lineTo(30, -3);  // ノーズ上部
        this.ctx.lineTo(30, 3);   // ノーズ下部
        this.ctx.lineTo(25, 8);   // 下翼付け根
        this.ctx.lineTo(-30, 0);  // 機首に戻る
        this.ctx.closePath();
        this.ctx.fill();
        
        // 主翼（上翼）
        const wingGradient = this.ctx.createLinearGradient(0, -15, 0, -5);
        wingGradient.addColorStop(0, '#4a7d9b');
        wingGradient.addColorStop(1, '#2a5d7b');
        this.ctx.fillStyle = wingGradient;
        this.ctx.beginPath();
        this.ctx.moveTo(5, -8);
        this.ctx.lineTo(15, -18);
        this.ctx.lineTo(20, -15);
        this.ctx.lineTo(15, -8);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 主翼（下翼）
        this.ctx.beginPath();
        this.ctx.moveTo(5, 8);
        this.ctx.lineTo(15, 18);
        this.ctx.lineTo(20, 15);
        this.ctx.lineTo(15, 8);
        this.ctx.closePath();
        this.ctx.fill();
        
        // コックピット
        const cockpitGradient = this.ctx.createRadialGradient(10, -2, 0, 10, -2, 8);
        cockpitGradient.addColorStop(0, '#87ceeb');
        cockpitGradient.addColorStop(0.6, '#4682b4');
        cockpitGradient.addColorStop(1, '#2f4f4f');
        this.ctx.fillStyle = cockpitGradient;
        this.ctx.beginPath();
        this.ctx.ellipse(10, -2, 8, 5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // コックピットフレーム
        this.ctx.strokeStyle = '#1a3d5b';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // エンジンノズル
        const engineGradient = this.ctx.createLinearGradient(-30, -5, -35, 5);
        engineGradient.addColorStop(0, '#606060');
        engineGradient.addColorStop(0.5, '#404040');
        engineGradient.addColorStop(1, '#202020');
        this.ctx.fillStyle = engineGradient;
        this.ctx.beginPath();
        this.ctx.ellipse(-32, 0, 4, 6, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // エンジン噴射（内側）
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(-37, 0, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // エンジン噴射（中間）
        this.ctx.fillStyle = '#00ffff';
        this.ctx.beginPath();
        this.ctx.arc(-40, 0, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // エンジン噴射（外側）
        this.ctx.fillStyle = '#0088ff';
        this.ctx.beginPath();
        this.ctx.arc(-43, 0, 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 機体のライン（詳細）
        this.ctx.strokeStyle = '#5a8dab';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(-25, -3);
        this.ctx.lineTo(20, -3);
        this.ctx.moveTo(-25, 3);
        this.ctx.lineTo(20, 3);
        this.ctx.stroke();
        
        // 機首の詳細
        this.ctx.fillStyle = '#ff6600';
        this.ctx.beginPath();
        this.ctx.arc(28, 0, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 翼端灯
        this.ctx.fillStyle = '#ff0000';
        this.ctx.beginPath();
        this.ctx.arc(18, -16, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#00ff00';
        this.ctx.beginPath();
        this.ctx.arc(18, 16, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 機体アウトライン（グロー効果）
        this.ctx.shadowColor = '#00aaff';
        this.ctx.shadowBlur = 12;
        this.ctx.strokeStyle = '#00aaff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(-30, 0);
        this.ctx.lineTo(25, -8);
        this.ctx.lineTo(30, -3);
        this.ctx.lineTo(30, 3);
        this.ctx.lineTo(25, 8);
        this.ctx.lineTo(-30, 0);
        this.ctx.closePath();
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    renderPlayer2() {
        this.ctx.save();
        this.ctx.translate(this.player2.x + this.player2.width / 2, this.player2.y + this.player2.height / 2);
        
        // 機体本体（戦闘機風 - 赤系カラー）
        const bodyGradient = this.ctx.createLinearGradient(-30, -15, 30, 15);
        bodyGradient.addColorStop(0, '#6b2a2a');
        bodyGradient.addColorStop(0.3, '#8b3a3a');
        bodyGradient.addColorStop(0.7, '#5b1a1a');
        bodyGradient.addColorStop(1, '#4b0a0a');
        
        this.ctx.fillStyle = bodyGradient;
        this.ctx.beginPath();
        this.ctx.moveTo(-30, 0);  // 機首
        this.ctx.lineTo(25, -8);  // 上翼付け根
        this.ctx.lineTo(30, -3);  // ノーズ上部
        this.ctx.lineTo(30, 3);   // ノーズ下部
        this.ctx.lineTo(25, 8);   // 下翼付け根
        this.ctx.lineTo(-30, 0);  // 機首に戻る
        this.ctx.closePath();
        this.ctx.fill();
        
        // 主翼（上翼）
        const wingGradient = this.ctx.createLinearGradient(0, -15, 0, -5);
        wingGradient.addColorStop(0, '#9b4a4a');
        wingGradient.addColorStop(1, '#7b2a2a');
        this.ctx.fillStyle = wingGradient;
        this.ctx.beginPath();
        this.ctx.moveTo(5, -8);
        this.ctx.lineTo(15, -18);
        this.ctx.lineTo(20, -15);
        this.ctx.lineTo(15, -8);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 主翼（下翼）
        this.ctx.beginPath();
        this.ctx.moveTo(5, 8);
        this.ctx.lineTo(15, 18);
        this.ctx.lineTo(20, 15);
        this.ctx.lineTo(15, 8);
        this.ctx.closePath();
        this.ctx.fill();
        
        // コックピット
        const cockpitGradient = this.ctx.createRadialGradient(10, -2, 0, 10, -2, 8);
        cockpitGradient.addColorStop(0, '#eb8787');
        cockpitGradient.addColorStop(0.6, '#b44646');
        cockpitGradient.addColorStop(1, '#4f2f2f');
        this.ctx.fillStyle = cockpitGradient;
        this.ctx.beginPath();
        this.ctx.ellipse(10, -2, 8, 5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // コックピットフレーム
        this.ctx.strokeStyle = '#5b1a1a';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // エンジンノズル
        const engineGradient = this.ctx.createLinearGradient(-30, -5, -35, 5);
        engineGradient.addColorStop(0, '#606060');
        engineGradient.addColorStop(0.5, '#404040');
        engineGradient.addColorStop(1, '#202020');
        this.ctx.fillStyle = engineGradient;
        this.ctx.beginPath();
        this.ctx.ellipse(-32, 0, 4, 6, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // エンジン噴射（内側）
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(-37, 0, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // エンジン噴射（中間）
        this.ctx.fillStyle = '#ffff00';
        this.ctx.beginPath();
        this.ctx.arc(-40, 0, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // エンジン噴射（外側）
        this.ctx.fillStyle = '#ff8800';
        this.ctx.beginPath();
        this.ctx.arc(-43, 0, 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 機体のライン（詳細）
        this.ctx.strokeStyle = '#ab5a5a';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(-25, -3);
        this.ctx.lineTo(20, -3);
        this.ctx.moveTo(-25, 3);
        this.ctx.lineTo(20, 3);
        this.ctx.stroke();
        
        // 機首の詳細
        this.ctx.fillStyle = '#ff6600';
        this.ctx.beginPath();
        this.ctx.arc(28, 0, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 翼端灯
        this.ctx.fillStyle = '#ff0000';
        this.ctx.beginPath();
        this.ctx.arc(18, -16, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#00ff00';
        this.ctx.beginPath();
        this.ctx.arc(18, 16, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 機体アウトライン（グロー効果 - 赤系）
        this.ctx.shadowColor = '#ff0055';
        this.ctx.shadowBlur = 12;
        this.ctx.strokeStyle = '#ff0055';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(-30, 0);
        this.ctx.lineTo(25, -8);
        this.ctx.lineTo(30, -3);
        this.ctx.lineTo(30, 3);
        this.ctx.lineTo(25, 8);
        this.ctx.lineTo(-30, 0);
        this.ctx.closePath();
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    renderUI() {
        this.ctx.save();
        
        // プレイヤー1のヘルスバー
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(20, 20, 200, 20);
        
        const healthPercent1 = this.player.health / this.player.maxHealth;
        this.ctx.fillStyle = healthPercent1 > 0.5 ? '#00ff00' : healthPercent1 > 0.25 ? '#ffff00' : '#ff0000';
        this.ctx.fillRect(22, 22, (200 - 4) * healthPercent1, 16);
        
        // プレイヤー1のヘルス表示
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px monospace';
        this.ctx.fillText(`P1 Health: ${this.player.health}/${this.player.maxHealth}`, 230, 35);
        
        // プレイヤー2のUI（アクティブな場合のみ）
        if (this.player2.active) {
            // プレイヤー2のヘルスバー
            this.ctx.fillStyle = '#333333';
            this.ctx.fillRect(20, 50, 200, 20);
            
            if (this.player2.health > 0) {
                const healthPercent2 = this.player2.health / this.player2.maxHealth;
                this.ctx.fillStyle = healthPercent2 > 0.5 ? '#00ff00' : healthPercent2 > 0.25 ? '#ffff00' : '#ff0000';
                this.ctx.fillRect(22, 52, (200 - 4) * healthPercent2, 16);
            }
            
            // プレイヤー2のヘルス表示
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(`P2 Health: ${this.player2.health}/${this.player2.maxHealth}`, 230, 65);
        }
        
        // スコア表示
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '20px monospace';
        this.ctx.fillText(`Score: ${this.score}`, 20, this.height - 80);
        
        // レベル表示
        this.ctx.fillText(`Level: ${this.level}`, 20, this.height - 50);
        
        // 2プレイヤーモードの説明（アクティブでない場合）
        if (!this.player2.active) {
            this.ctx.fillStyle = '#888888';
            this.ctx.font = '14px monospace';
            this.ctx.fillText('Press P for 2-Player Mode', this.width - 250, this.height - 30);
        }
        
        // コントロール説明（2プレイヤーモード時）
        if (this.player2.active) {
            this.ctx.fillStyle = '#888888';
            this.ctx.font = '12px monospace';
            this.ctx.fillText('P1: WASD + Space | P2: IJKL + Enter', this.width - 350, this.height - 30);
        }
        
        this.ctx.restore();
    }
    
    renderBullets() {
        for (let bullet of this.bullets) {
            // 弾の軌跡
            if (bullet.trail.length > 1) {
                this.ctx.strokeStyle = '#ffff00';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(bullet.trail[0].x, bullet.trail[0].y);
                for (let i = 1; i < bullet.trail.length; i++) {
                    this.ctx.lineTo(bullet.trail[i].x, bullet.trail[i].y);
                }
                this.ctx.stroke();
            }
            
            // 弾本体
            this.ctx.save();
            this.ctx.shadowColor = '#ffff00';
            this.ctx.shadowBlur = 8;
            this.ctx.fillStyle = '#ffff00';
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }
    
    renderEnemies() {
        for (let enemy of this.enemies) {
            this.ctx.save();
            this.ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
            this.ctx.rotate(enemy.rotationZ);
            
            let color, gradient;
            
            if (enemy.type === 'boss') {
                color = '#ff0000';
                gradient = this.ctx.createLinearGradient(-enemy.width/2, -enemy.height/2, enemy.width/2, enemy.height/2);
                gradient.addColorStop(0, '#ff0000');
                gradient.addColorStop(0.5, '#cc0000');
                gradient.addColorStop(1, '#990000');
            } else if (enemy.type === 'large') {
                color = '#ff8800';
                gradient = this.ctx.createLinearGradient(-enemy.width/2, -enemy.height/2, enemy.width/2, enemy.height/2);
                gradient.addColorStop(0, '#ff8800');
                gradient.addColorStop(0.5, '#cc6600');
                gradient.addColorStop(1, '#994400');
            } else if (enemy.type === 'fast') {
                color = '#ff00ff';
                gradient = this.ctx.createLinearGradient(-enemy.width/2, -enemy.height/2, enemy.width/2, enemy.height/2);
                gradient.addColorStop(0, '#ff00ff');
                gradient.addColorStop(0.5, '#cc00cc');
                gradient.addColorStop(1, '#990099');
            } else if (enemy.type === 'drone') {
                color = '#00ff88';
                gradient = this.ctx.createLinearGradient(-enemy.width/2, -enemy.height/2, enemy.width/2, enemy.height/2);
                gradient.addColorStop(0, '#00ff88');
                gradient.addColorStop(0.5, '#00cc66');
                gradient.addColorStop(1, '#009944');
            } else if (enemy.type === 'sniper') {
                color = '#8800ff';
                gradient = this.ctx.createLinearGradient(-enemy.width/2, -enemy.height/2, enemy.width/2, enemy.height/2);
                gradient.addColorStop(0, '#8800ff');
                gradient.addColorStop(0.5, '#6600cc');
                gradient.addColorStop(1, '#440099');
            } else if (enemy.type === 'armored') {
                color = '#888888';
                gradient = this.ctx.createLinearGradient(-enemy.width/2, -enemy.height/2, enemy.width/2, enemy.height/2);
                gradient.addColorStop(0, '#888888');
                gradient.addColorStop(0.5, '#666666');
                gradient.addColorStop(1, '#444444');
            } else if (enemy.type === 'stealth') {
                color = '#00ffff';
                gradient = this.ctx.createLinearGradient(-enemy.width/2, -enemy.height/2, enemy.width/2, enemy.height/2);
                gradient.addColorStop(0, '#00ffff');
                gradient.addColorStop(0.5, '#00cccc');
                gradient.addColorStop(1, '#009999');
            } else if (enemy.type === 'missile') {
                color = '#ffff00';
                gradient = this.ctx.createLinearGradient(-enemy.width/2, -enemy.height/2, enemy.width/2, enemy.height/2);
                gradient.addColorStop(0, '#ffff00');
                gradient.addColorStop(0.5, '#cccc00');
                gradient.addColorStop(1, '#999900');
            } else if (enemy.type === 'shield') {
                color = '#0088ff';
                gradient = this.ctx.createLinearGradient(-enemy.width/2, -enemy.height/2, enemy.width/2, enemy.height/2);
                gradient.addColorStop(0, '#0088ff');
                gradient.addColorStop(0.5, '#0066cc');
                gradient.addColorStop(1, '#004499');
            } else if (enemy.type === 'splitter') {
                color = '#ff8888';
                gradient = this.ctx.createLinearGradient(-enemy.width/2, -enemy.height/2, enemy.width/2, enemy.height/2);
                gradient.addColorStop(0, '#ff8888');
                gradient.addColorStop(0.5, '#cc6666');
                gradient.addColorStop(1, '#994444');
            } else if (enemy.type === 'laser') {
                color = '#ff4400';
                gradient = this.ctx.createLinearGradient(-enemy.width/2, -enemy.height/2, enemy.width/2, enemy.height/2);
                gradient.addColorStop(0, '#ff4400');
                gradient.addColorStop(0.5, '#cc3300');
                gradient.addColorStop(1, '#992200');
            } else if (enemy.type === 'electric') {
                color = '#44ff44';
                gradient = this.ctx.createLinearGradient(-enemy.width/2, -enemy.height/2, enemy.width/2, enemy.height/2);
                gradient.addColorStop(0, '#44ff44');
                gradient.addColorStop(0.5, '#33cc33');
                gradient.addColorStop(1, '#229922');
            } else if (enemy.type === 'miner') {
                color = '#cc8844';
                gradient = this.ctx.createLinearGradient(-enemy.width/2, -enemy.height/2, enemy.width/2, enemy.height/2);
                gradient.addColorStop(0, '#cc8844');
                gradient.addColorStop(0.5, '#996633');
                gradient.addColorStop(1, '#664422');
            } else if (enemy.type === 'teleporter') {
                color = '#8844ff';
                gradient = this.ctx.createLinearGradient(-enemy.width/2, -enemy.height/2, enemy.width/2, enemy.height/2);
                gradient.addColorStop(0, '#8844ff');
                gradient.addColorStop(0.5, '#6633cc');
                gradient.addColorStop(1, '#442299');
            } else if (enemy.type === 'healer') {
                color = '#88ff88';
                gradient = this.ctx.createLinearGradient(-enemy.width/2, -enemy.height/2, enemy.width/2, enemy.height/2);
                gradient.addColorStop(0, '#88ff88');
                gradient.addColorStop(0.5, '#66cc66');
                gradient.addColorStop(1, '#449944');
            } else if (enemy.type === 'megaboss') {
                color = '#ff0088';
                gradient = this.ctx.createLinearGradient(-enemy.width/2, -enemy.height/2, enemy.width/2, enemy.height/2);
                gradient.addColorStop(0, '#ff0088');
                gradient.addColorStop(0.5, '#cc0066');
                gradient.addColorStop(1, '#990044');
            } else if (enemy.type === 'mini') {
                color = '#ffaaaa';
                gradient = this.ctx.createLinearGradient(-enemy.width/2, -enemy.height/2, enemy.width/2, enemy.height/2);
                gradient.addColorStop(0, '#ffaaaa');
                gradient.addColorStop(0.5, '#cc8888');
                gradient.addColorStop(1, '#996666');
            } else {
                color = '#ff4444';
                gradient = this.ctx.createLinearGradient(-enemy.width/2, -enemy.height/2, enemy.width/2, enemy.height/2);
                gradient.addColorStop(0, '#ff4444');
                gradient.addColorStop(0.5, '#cc3333');
                gradient.addColorStop(1, '#992222');
            }
            
            // ステルス敵の透明度処理
            if (enemy.type === 'stealth' && !enemy.isVisible) {
                this.ctx.globalAlpha = 0.2;
            }
            
            this.ctx.fillStyle = gradient;
            
            // 敵タイプ別の形状
            if (enemy.type === 'fast') {
                // 高速敵：細長い形状
                this.ctx.beginPath();
                this.ctx.moveTo(enemy.width/2, 0);
                this.ctx.lineTo(-enemy.width/3, -enemy.height/3);
                this.ctx.lineTo(-enemy.width/2, 0);
                this.ctx.lineTo(-enemy.width/3, enemy.height/3);
                this.ctx.closePath();
                this.ctx.fill();
            } else if (enemy.type === 'drone') {
                // ドローン：丸い形状
                this.ctx.beginPath();
                this.ctx.arc(0, 0, enemy.width/2, 0, Math.PI * 2);
                this.ctx.fill();
                
                // プロペラ
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(-enemy.width/2, -5);
                this.ctx.lineTo(enemy.width/2, -5);
                this.ctx.moveTo(-enemy.width/2, 5);
                this.ctx.lineTo(enemy.width/2, 5);
                this.ctx.stroke();
            } else if (enemy.type === 'sniper') {
                // スナイパー：長い砲身
                this.ctx.beginPath();
                this.ctx.moveTo(enemy.width/2, 0);
                this.ctx.lineTo(-enemy.width/4, -enemy.height/2);
                this.ctx.lineTo(-enemy.width/2, -enemy.height/4);
                this.ctx.lineTo(-enemy.width/2, enemy.height/4);
                this.ctx.lineTo(-enemy.width/4, enemy.height/2);
                this.ctx.closePath();
                this.ctx.fill();
                
                // 砲身
                this.ctx.fillStyle = this.darkenColor(color, 0.3);
                this.ctx.fillRect(enemy.width/4, -2, enemy.width/3, 4);
                
                // チャージエフェクト
                if (enemy.chargeTime > 60) {
                    this.ctx.shadowColor = '#ffffff';
                    this.ctx.shadowBlur = 15;
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.beginPath();
                    this.ctx.arc(enemy.width/2, 0, 3, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            } else if (enemy.type === 'armored') {
                // 重装甲敵：角ばった形状
                this.ctx.fillRect(-enemy.width/2, -enemy.height/2, enemy.width, enemy.height);
                
                // 装甲プレート
                this.ctx.fillStyle = this.darkenColor(color, 0.4);
                this.ctx.fillRect(-enemy.width/3, -enemy.height/3, enemy.width/1.5, enemy.height/1.5);
            } else if (enemy.type === 'stealth') {
                // ステルス敵：三角形
                this.ctx.beginPath();
                this.ctx.moveTo(enemy.width/2, 0);
                this.ctx.lineTo(-enemy.width/4, -enemy.height/2);
                this.ctx.lineTo(-enemy.width/4, enemy.height/2);
                this.ctx.closePath();
                this.ctx.fill();
            } else if (enemy.type === 'missile') {
                // ミサイル敵：ロケット形状
                this.ctx.fillRect(-enemy.width/2, -enemy.height/3, enemy.width, enemy.height/1.5);
                
                // ミサイルポッド
                this.ctx.fillStyle = this.darkenColor(color, 0.3);
                this.ctx.fillRect(-enemy.width/4, -enemy.height/2, enemy.width/8, enemy.height/4);
                this.ctx.fillRect(-enemy.width/4, enemy.height/4, enemy.width/8, enemy.height/4);
            } else if (enemy.type === 'shield') {
                // シールド敵：六角形
                this.ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2;
                    const x = Math.cos(angle) * enemy.width / 3;
                    const y = Math.sin(angle) * enemy.height / 3;
                    if (i === 0) this.ctx.moveTo(x, y);
                    else this.ctx.lineTo(x, y);
                }
                this.ctx.closePath();
                this.ctx.fill();
                
                // シールドエフェクト
                if (enemy.shieldActive) {
                    this.ctx.strokeStyle = '#00aaff';
                    this.ctx.lineWidth = 3;
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, enemy.width/2 + 5, 0, Math.PI * 2);
                    this.ctx.stroke();
                }
            } else if (enemy.type === 'splitter') {
                // 分裂敵：ダイヤ形状
                this.ctx.beginPath();
                this.ctx.moveTo(enemy.width/2, 0);
                this.ctx.lineTo(0, -enemy.height/2);
                this.ctx.lineTo(-enemy.width/2, 0);
                this.ctx.lineTo(0, enemy.height/2);
                this.ctx.closePath();
                this.ctx.fill();
            } else if (enemy.type === 'laser') {
                // レーザー敵：砲台形状
                this.ctx.fillRect(-enemy.width/2, -enemy.height/2, enemy.width, enemy.height);
                
                // レーザー砲
                this.ctx.fillStyle = this.darkenColor(color, 0.5);
                this.ctx.fillRect(enemy.width/4, -5, enemy.width/3, 10);
                
                // チャージエフェクト
                if (enemy.laserCharging) {
                    this.ctx.shadowColor = '#ffffff';
                    this.ctx.shadowBlur = 20;
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.beginPath();
                    this.ctx.arc(enemy.width/2, 0, 5, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            } else if (enemy.type === 'electric') {
                // 電撃敵：稲妻形状
                this.ctx.beginPath();
                this.ctx.moveTo(enemy.width/3, -enemy.height/2);
                this.ctx.lineTo(enemy.width/2, -enemy.height/4);
                this.ctx.lineTo(0, 0);
                this.ctx.lineTo(enemy.width/4, enemy.height/4);
                this.ctx.lineTo(-enemy.width/2, enemy.height/2);
                this.ctx.lineTo(-enemy.width/4, 0);
                this.ctx.lineTo(-enemy.width/3, -enemy.height/3);
                this.ctx.closePath();
                this.ctx.fill();
                
                // 電撃エフェクト
                if (enemy.electricCharge > 30) {
                    this.ctx.strokeStyle = '#ffffff';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    for (let j = 0; j < 3; j++) {
                        this.ctx.moveTo((Math.random() - 0.5) * enemy.width, (Math.random() - 0.5) * enemy.height);
                        this.ctx.lineTo((Math.random() - 0.5) * enemy.width, (Math.random() - 0.5) * enemy.height);
                    }
                    this.ctx.stroke();
                }
            } else if (enemy.type === 'miner') {
                // 鉱山敵：ドリル形状
                this.ctx.fillRect(-enemy.width/2, -enemy.height/2, enemy.width, enemy.height);
                
                // ドリル
                this.ctx.fillStyle = this.darkenColor(color, 0.4);
                this.ctx.beginPath();
                this.ctx.moveTo(enemy.width/2, 0);
                this.ctx.lineTo(enemy.width/4, -5);
                this.ctx.lineTo(enemy.width/4, 5);
                this.ctx.closePath();
                this.ctx.fill();
            } else if (enemy.type === 'teleporter') {
                // テレポート敵：星形
                this.ctx.beginPath();
                for (let j = 0; j < 5; j++) {
                    const angle = (j / 5) * Math.PI * 2;
                    const outerRadius = enemy.width / 3;
                    const innerRadius = enemy.width / 6;
                    
                    let x = Math.cos(angle) * outerRadius;
                    let y = Math.sin(angle) * outerRadius;
                    if (j === 0) this.ctx.moveTo(x, y);
                    else this.ctx.lineTo(x, y);
                    
                    const innerAngle = angle + Math.PI / 5;
                    x = Math.cos(innerAngle) * innerRadius;
                    y = Math.sin(innerAngle) * innerRadius;
                    this.ctx.lineTo(x, y);
                }
                this.ctx.closePath();
                this.ctx.fill();
                
                // テレポートエフェクト
                if (enemy.teleporting) {
                    this.ctx.strokeStyle = '#ffffff';
                    this.ctx.lineWidth = 4;
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, enemy.width/2 + 10, 0, Math.PI * 2);
                    this.ctx.stroke();
                }
            } else if (enemy.type === 'healer') {
                // 回復敵：十字形
                this.ctx.fillRect(-enemy.width/6, -enemy.height/2, enemy.width/3, enemy.height);
                this.ctx.fillRect(-enemy.width/2, -enemy.height/6, enemy.width, enemy.height/3);
                
                // 回復エフェクト
                this.ctx.strokeStyle = '#00ff00';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, enemy.width/2 + 3, 0, Math.PI * 2);
                this.ctx.stroke();
            } else if (enemy.type === 'megaboss') {
                // 巨大ボス：複雑な形状
                this.ctx.fillRect(-enemy.width/2, -enemy.height/2, enemy.width, enemy.height);
                
                // 装甲プレート
                this.ctx.fillStyle = this.darkenColor(color, 0.2);
                this.ctx.fillRect(-enemy.width/3, -enemy.height/3, enemy.width/1.5, enemy.height/1.5);
                
                // 砲台
                for (let j = 0; j < 4; j++) {
                    const angle = (j / 4) * Math.PI * 2;
                    const x = Math.cos(angle) * enemy.width / 4;
                    const y = Math.sin(angle) * enemy.height / 4;
                    this.ctx.fillStyle = this.darkenColor(color, 0.5);
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, 8, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                
                // フェーズ表示
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '20px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(`P${enemy.phase}`, 0, 5);
            } else if (enemy.type === 'mini') {
                // 小型敵：小さい三角形
                this.ctx.beginPath();
                this.ctx.moveTo(enemy.width/2, 0);
                this.ctx.lineTo(-enemy.width/2, -enemy.height/2);
                this.ctx.lineTo(-enemy.width/2, enemy.height/2);
                this.ctx.closePath();
                this.ctx.fill();
            } else {
                // 通常敵・大型敵・ボス敵：従来の形状
                this.ctx.beginPath();
                this.ctx.moveTo(enemy.width/2, 0);
                this.ctx.lineTo(-enemy.width/4, -enemy.height/2);
                this.ctx.lineTo(-enemy.width/2, 0);
                this.ctx.lineTo(-enemy.width/4, enemy.height/2);
                this.ctx.closePath();
                this.ctx.fill();
            }
            
            // グロー効果
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 8;
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            
            // ボスの場合は追加装飾
            if (enemy.type === 'boss') {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(-10, -10, 3, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.arc(-10, 10, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            this.ctx.restore();
            
            // ヘルスバー（複数体力の敵）
            if (enemy.health > 1) {
                const maxHealth = this.getMaxHealth(enemy.type);
                const healthPercent = enemy.health / maxHealth;
                
                this.ctx.fillStyle = '#ff0000';
                this.ctx.fillRect(enemy.x, enemy.y - 10, enemy.width, 4);
                this.ctx.fillStyle = '#00ff00';
                this.ctx.fillRect(enemy.x, enemy.y - 10, enemy.width * healthPercent, 4);
            }
        }
    }
    
    renderEnemyBullets() {
        for (let bullet of this.enemyBullets) {
            this.ctx.save();
            
            // 弾のタイプ別エフェクト
            if (bullet.type === 'boss') {
                this.ctx.shadowColor = '#ff0000';
                this.ctx.shadowBlur = 10;
                this.ctx.fillStyle = '#ff0000';
            } else if (bullet.type === 'fast') {
                this.ctx.shadowColor = '#ff00ff';
                this.ctx.shadowBlur = 6;
                this.ctx.fillStyle = '#ff00ff';
            } else if (bullet.type === 'homing') {
                this.ctx.shadowColor = '#00ff88';
                this.ctx.shadowBlur = 8;
                this.ctx.fillStyle = '#00ff88';
                
                // 追尾弾の軌跡エフェクト
                this.ctx.strokeStyle = '#00ff88';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(bullet.x - bullet.vx * 3, bullet.y - bullet.vy * 3);
                this.ctx.lineTo(bullet.x, bullet.y);
                this.ctx.stroke();
            } else if (bullet.type === 'sniper') {
                this.ctx.shadowColor = '#8800ff';
                this.ctx.shadowBlur = 12;
                this.ctx.fillStyle = '#8800ff';
                
                // スナイパー弾の強力なエフェクト
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(bullet.x, bullet.y, bullet.size + 2, 0, Math.PI * 2);
                this.ctx.stroke();
            } else if (bullet.type === 'spread') {
                this.ctx.shadowColor = '#888888';
                this.ctx.shadowBlur = 4;
                this.ctx.fillStyle = '#888888';
            } else if (bullet.type === 'stealth') {
                this.ctx.shadowColor = '#00ffff';
                this.ctx.shadowBlur = 6;
                this.ctx.fillStyle = '#00ffff';
            } else if (bullet.type === 'missile') {
                this.ctx.shadowColor = '#ffff00';
                this.ctx.shadowBlur = 10;
                this.ctx.fillStyle = '#ffff00';
                
                // ミサイル軌跡
                this.ctx.strokeStyle = '#ffaa00';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(bullet.x - bullet.vx * 5, bullet.y - bullet.vy * 5);
                this.ctx.lineTo(bullet.x, bullet.y);
                this.ctx.stroke();
            } else if (bullet.type === 'piercing') {
                this.ctx.shadowColor = '#0088ff';
                this.ctx.shadowBlur = 8;
                this.ctx.fillStyle = '#0088ff';
            } else if (bullet.type === 'split') {
                this.ctx.shadowColor = '#ff8888';
                this.ctx.shadowBlur = 6;
                this.ctx.fillStyle = '#ff8888';
            } else if (bullet.type === 'laser') {
                this.ctx.shadowColor = '#ff4400';
                this.ctx.shadowBlur = 15;
                this.ctx.fillStyle = '#ff4400';
                
                // レーザーの太い描画
                if (bullet.width) {
                    this.ctx.fillRect(bullet.x - bullet.width/2, bullet.y - bullet.size/2, bullet.width, bullet.size);
                    return;
                }
            } else if (bullet.type === 'electric') {
                this.ctx.shadowColor = '#44ff44';
                this.ctx.shadowBlur = 8;
                this.ctx.fillStyle = '#44ff44';
                
                // 電撃エフェクト
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 1;
                for (let j = 0; j < 2; j++) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(bullet.x + (Math.random() - 0.5) * 10, bullet.y + (Math.random() - 0.5) * 10);
                    this.ctx.lineTo(bullet.x + (Math.random() - 0.5) * 10, bullet.y + (Math.random() - 0.5) * 10);
                    this.ctx.stroke();
                }
            } else if (bullet.type === 'mine') {
                this.ctx.shadowColor = bullet.armed ? '#ff0000' : '#cc8844';
                this.ctx.shadowBlur = bullet.armed ? 12 : 6;
                this.ctx.fillStyle = bullet.armed ? '#ff0000' : '#cc8844';
                
                // 地雷の点滅
                if (bullet.armed && Math.floor(this.frameCount / 10) % 2) {
                    this.ctx.fillStyle = '#ffffff';
                }
            } else if (bullet.type === 'teleport') {
                this.ctx.shadowColor = '#8844ff';
                this.ctx.shadowBlur = 10;
                this.ctx.fillStyle = '#8844ff';
            } else if (bullet.type === 'heal') {
                this.ctx.shadowColor = '#88ff88';
                this.ctx.shadowBlur = 8;
                this.ctx.fillStyle = '#88ff88';
            } else if (bullet.type === 'megaboss') {
                this.ctx.shadowColor = '#ff0088';
                this.ctx.shadowBlur = 12;
                this.ctx.fillStyle = '#ff0088';
            } else if (bullet.type === 'megalaser') {
                this.ctx.shadowColor = '#ff0088';
                this.ctx.shadowBlur = 20;
                this.ctx.fillStyle = '#ff0088';
                
                // 巨大レーザーの太い描画
                if (bullet.width) {
                    this.ctx.fillRect(bullet.x - bullet.width/2, bullet.y - bullet.size/2, bullet.width, bullet.size);
                    return;
                }
            } else if (bullet.type === 'mini') {
                this.ctx.shadowColor = '#ffaaaa';
                this.ctx.shadowBlur = 4;
                this.ctx.fillStyle = '#ffaaaa';
            } else {
                this.ctx.shadowColor = '#ff4444';
                this.ctx.shadowBlur = 6;
                this.ctx.fillStyle = '#ff4444';
            }
            
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }
    
    renderPowerups() {
        for (let powerup of this.powerups) {
            this.ctx.save();
            this.ctx.translate(powerup.x + 10, powerup.y + 10);
            this.ctx.rotate(powerup.rotationZ);
            
            this.ctx.shadowColor = '#00ff00';
            this.ctx.shadowBlur = 10;
            this.ctx.fillStyle = '#00ff00';
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, -10);
            this.ctx.lineTo(7, -3);
            this.ctx.lineTo(10, 0);
            this.ctx.lineTo(7, 3);
            this.ctx.lineTo(0, 10);
            this.ctx.lineTo(-7, 3);
            this.ctx.lineTo(-10, 0);
            this.ctx.lineTo(-7, -3);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
            
            this.ctx.restore();
        }
    }
    
    renderParticles() {
        for (let particle of this.particles) {
            const alpha = particle.life / particle.maxLife;
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }
    
    renderEffects() {
        // スクリーンエフェクトは無効化
    }
    
    renderHitboxes() {
        this.ctx.save();
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.8;
        
        // プレイヤーの当たり判定を表示（縮小された当たり判定）
        const shrinkX = this.player.width * 0.375;
        const shrinkY = this.player.height * 0.375;
        const playerHitboxX = this.player.x + shrinkX;
        const playerHitboxY = this.player.y + shrinkY;
        const playerHitboxWidth = this.player.width - shrinkX * 2;
        const playerHitboxHeight = this.player.height - shrinkY * 2;
        
        // プレイヤー：明るい緑色で塗りつぶし
        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        this.ctx.fillRect(playerHitboxX, playerHitboxY, playerHitboxWidth, playerHitboxHeight);
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.strokeRect(playerHitboxX, playerHitboxY, playerHitboxWidth, playerHitboxHeight);
        
        // 敵の当たり判定を表示（明るい赤色で塗りつぶし）
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        this.ctx.strokeStyle = '#ff0000';
        for (let enemy of this.enemies) {
            this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            this.ctx.strokeRect(enemy.x, enemy.y, enemy.width, enemy.height);
        }
        
        // プレイヤーの弾の当たり判定を表示（明るい黄色）
        this.ctx.fillStyle = 'rgba(255, 255, 0, 0.4)';
        this.ctx.strokeStyle = '#ffff00';
        for (let bullet of this.bullets) {
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
        }
        
        // 敵の弾の当たり判定を表示（明るいオレンジ色）
        this.ctx.fillStyle = 'rgba(255, 100, 0, 0.4)';
        this.ctx.strokeStyle = '#ff6400';
        for (let bullet of this.enemyBullets) {
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
        }
        
        // パワーアップの当たり判定を表示（明るいシアン色で塗りつぶし）
        this.ctx.fillStyle = 'rgba(0, 255, 200, 0.3)';
        this.ctx.strokeStyle = '#00ffc8';
        for (let powerup of this.powerups) {
            this.ctx.fillRect(powerup.x, powerup.y, 20, 20);
            this.ctx.strokeRect(powerup.x, powerup.y, 20, 20);
        }
        
        this.ctx.restore();
    }
    
    getMaxHealth(type) {
        switch (type) {
            case 'boss': return 5;
            case 'armored': return 3;
            case 'large': return 2;
            case 'sniper': return 2;
            case 'missile': return 2;
            case 'shield': return 4;
            case 'splitter': return 2;
            case 'laser': return 3;
            case 'miner': return 2;
            case 'healer': return 2;
            case 'megaboss': return 10;
            default: return 1;
        }
    }
    
    darkenColor(color, factor) {
        const hex = color.replace('#', '');
        const r = Math.floor(parseInt(hex.substr(0, 2), 16) * (1 - factor));
        const g = Math.floor(parseInt(hex.substr(2, 2), 16) * (1 - factor));
        const b = Math.floor(parseInt(hex.substr(4, 2), 16) * (1 - factor));
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    updateUI() {
        // 画面上の敵の数をカウント（表示用）
        const enemiesOnScreen = this.enemies.filter(enemy => 
            enemy.x >= -50 && enemy.x <= this.width + 50 && 
            enemy.y >= -50 && enemy.y <= this.height + 50
        );
        
        // 敵のタイプ別カウント
        const enemyTypeCounts = {
            normal: 0,
            fast: 0,
            armored: 0,
            drone: 0,
            sniper: 0,
            large: 0,
            boss: 0,
            stealth: 0,
            missile: 0,
            shield: 0,
            splitter: 0,
            laser: 0,
            electric: 0,
            miner: 0,
            teleporter: 0,
            healer: 0,
            megaboss: 0,
            mini: 0
        };
        
        enemiesOnScreen.forEach(enemy => {
            if (enemyTypeCounts.hasOwnProperty(enemy.type)) {
                enemyTypeCounts[enemy.type]++;
            }
        });
        
        document.getElementById('score').textContent = this.score;
        document.getElementById('health').textContent = this.player.health;
        document.getElementById('level').textContent = this.level;
        document.getElementById('enemyCount').textContent = enemiesOnScreen.length;
        
        // 敵タイプ別の数を更新
        document.getElementById('normal').textContent = enemyTypeCounts.normal;
        document.getElementById('fast').textContent = enemyTypeCounts.fast;
        document.getElementById('armored').textContent = enemyTypeCounts.armored;
        document.getElementById('drone').textContent = enemyTypeCounts.drone;
        document.getElementById('sniper').textContent = enemyTypeCounts.sniper;
        document.getElementById('large').textContent = enemyTypeCounts.large;
        document.getElementById('boss').textContent = enemyTypeCounts.boss;
        
        // 新しい敵タイプの表示（IDが存在する場合のみ）
        const newEnemyTypes = ['stealth', 'missile', 'shield', 'splitter', 'laser', 'electric', 'miner', 'teleporter', 'healer', 'megaboss', 'mini'];
        newEnemyTypes.forEach(type => {
            const element = document.getElementById(type);
            if (element) {
                element.textContent = enemyTypeCounts[type];
            }
        });
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        document.getElementById('gameOver').style.display = 'block';
        
        // ゲームオーバー音を再生
        this.playSound(100, 1.0, 'triangle', 0.15);
        setTimeout(() => this.playSound(80, 1.5, 'triangle', 0.12), 200);
    }
    
    restart() {
        this.gameState = 'playing';
        this.score = 0;
        this.level = 1;
        this.frameCount = 0;
        this.player.health = this.player.maxHealth;
        this.player.x = 100;
        this.player.y = this.height / 2;
        
        // プレイヤー2もリセット
        if (this.player2.active) {
            this.player2.health = this.player2.maxHealth;
            this.player2.x = 50;
            this.player2.y = this.height / 2 + 60;
        }
        
        this.bullets = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.particles = [];
        this.powerups = [];
        document.getElementById('gameOver').style.display = 'none';
        
        // リスタート音を再生
        this.playSound(440, 0.1, 'sine', 0.1);
        setTimeout(() => this.playSound(880, 0.1, 'sine', 0.08), 100);
        
        // 背景音楽を再開
        if (this.musicEnabled && !this.bgMusicPlaying) {
            this.startBackgroundMusic();
        }
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// ゲーム開始
window.addEventListener('load', () => {
    new Game();
});
