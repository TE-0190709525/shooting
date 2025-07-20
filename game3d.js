class Game3D {
    constructor() {
        this.container = document.getElementById('gameCanvas');
        this.width = 1000;
        this.height = 600;
        
        // ゲーム状態
        this.gameState = 'playing';
        this.score = 0;
        this.level = 1;
        this.frameCount = 0;
        
        // プレイヤー状態
        this.playerData = {
            health: 200,
            maxHealth: 200,
            speed: 0.1,
            shootCooldown: 0
        };
        
        // ゲームオブジェクト
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.powerups = [];
        this.particles = [];
        
        // 入力管理
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        
        this.init();
    }
    
    init() {
        this.setupScene();
        this.setupLights();
        this.setupPlayer();
        this.setupBackground();
        this.setupEventListeners();
        this.animate();
    }
    
    setupScene() {
        // シーン、カメラ、レンダラーの設定
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000511);
        
        this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1000);
        this.camera.position.set(-10, 0, 5);
        this.camera.lookAt(0, 0, 0);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);
        
        // フォグ効果
        this.scene.fog = new THREE.Fog(0x000511, 20, 100);
    }
    
    setupLights() {
        // 環境光
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        // 指向性ライト
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(-10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // ポイントライト（プレイヤー用）
        this.playerLight = new THREE.PointLight(0x00ffff, 1, 10);
        this.scene.add(this.playerLight);
    }
    
    setupPlayer() {
        // プレイヤー機体の作成
        const playerGroup = new THREE.Group();
        
        // 機体本体
        const bodyGeometry = new THREE.ConeGeometry(0.3, 1.5, 8);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x0088ff,
            emissive: 0x002244,
            shininess: 100
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.z = Math.PI / 2;
        body.castShadow = true;
        body.receiveShadow = true;
        playerGroup.add(body);
        
        // 翼
        const wingGeometry = new THREE.BoxGeometry(0.1, 1.0, 0.1);
        const wingMaterial = new THREE.MeshPhongMaterial({ color: 0x0066cc });
        
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-0.3, 0.4, 0);
        leftWing.castShadow = true;
        playerGroup.add(leftWing);
        
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(-0.3, -0.4, 0);
        rightWing.castShadow = true;
        playerGroup.add(rightWing);
        
        // エンジン
        const engineGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.3, 6);
        const engineMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff8800,
            emissive: 0x441100
        });
        const engine = new THREE.Mesh(engineGeometry, engineMaterial);
        engine.rotation.z = Math.PI / 2;
        engine.position.set(-0.8, 0, 0);
        playerGroup.add(engine);
        
        playerGroup.position.set(-8, 0, 0);
        this.player = playerGroup;
        this.scene.add(this.player);
        
        // プレイヤーライトの位置設定
        this.playerLight.position.copy(this.player.position);
    }
    
    setupBackground() {
        // 星フィールドの作成
        this.stars = [];
        const starGeometry = new THREE.BufferGeometry();
        const starPositions = [];
        const starColors = [];
        
        for (let i = 0; i < 1000; i++) {
            const x = (Math.random() - 0.5) * 200;
            const y = (Math.random() - 0.5) * 200;
            const z = (Math.random() - 0.5) * 200;
            
            starPositions.push(x, y, z);
            
            const color = new THREE.Color();
            color.setHSL(0.6 + Math.random() * 0.2, 0.8, 0.9);
            starColors.push(color.r, color.g, color.b);
            
            this.stars.push({ x, y, z, speed: Math.random() * 0.02 + 0.01 });
        }
        
        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
        starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
        
        const starMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });
        
        this.starField = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(this.starField);
        
        // 遠景オブジェクト
        this.createBackgroundObjects();
    }
    
    createBackgroundObjects() {
        const geometries = [
            new THREE.IcosahedronGeometry(1),
            new THREE.OctahedronGeometry(1),
            new THREE.TetrahedronGeometry(1)
        ];
        
        for (let i = 0; i < 20; i++) {
            const geometry = geometries[Math.floor(Math.random() * geometries.length)];
            const material = new THREE.MeshPhongMaterial({
                color: new THREE.Color().setHSL(Math.random(), 0.7, 0.3),
                transparent: true,
                opacity: 0.3,
                wireframe: Math.random() > 0.5
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(
                Math.random() * 100 - 50,
                Math.random() * 40 - 20,
                Math.random() * 40 - 20
            );
            mesh.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            mesh.scale.setScalar(Math.random() * 2 + 0.5);
            
            this.scene.add(mesh);
        }
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
        
        this.renderer.domElement.addEventListener('mousemove', (e) => {
            const rect = this.renderer.domElement.getBoundingClientRect();
            this.mouse.x = ((e.clientX - rect.left) / this.width) * 2 - 1;
            this.mouse.y = -((e.clientY - rect.top) / this.height) * 2 + 1;
        });
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        this.frameCount++;
        this.updatePlayer();
        this.updateBullets();
        this.updateEnemies();
        this.updateEnemyBullets();
        this.updatePowerups();
        this.updateParticles();
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
        // プレイヤーの移動
        const moveSpeed = this.playerData.speed;
        
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            this.player.position.z = Math.min(5, this.player.position.z + moveSpeed);
        }
        if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            this.player.position.z = Math.max(-5, this.player.position.z - moveSpeed);
        }
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.position.y = Math.max(-8, this.player.position.y - moveSpeed);
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.position.y = Math.min(8, this.player.position.y + moveSpeed);
        }
        
        // プレイヤーライトの位置更新
        this.playerLight.position.copy(this.player.position);
        
        // 射撃
        if (this.playerData.shootCooldown > 0) {
            this.playerData.shootCooldown--;
        }
        
        if (this.keys['Space'] && this.playerData.shootCooldown === 0) {
            this.shoot();
            this.playerData.shootCooldown = 5;
        }
        
        // プレイヤーの傾き
        this.player.rotation.z = this.player.position.z * 0.1;
        this.player.rotation.x = this.player.position.y * -0.1;
    }
    
    shoot() {
        // 弾の作成
        const bulletGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const bulletMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffff00,
            emissive: 0x444400
        });
        const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
        
        bullet.position.copy(this.player.position);
        bullet.position.x += 0.8;
        
        // マウス位置への方向計算
        const targetY = this.mouse.x * 10;
        const targetZ = this.mouse.y * 8;
        
        const direction = new THREE.Vector3(
            1,
            (targetY - bullet.position.y) * 0.1,
            (targetZ - bullet.position.z) * 0.1
        ).normalize();
        
        this.bullets.push({
            mesh: bullet,
            velocity: direction.multiplyScalar(0.5),
            life: 180
        });
        
        this.scene.add(bullet);
        
        // マズルフラッシュ
        this.createMuzzleFlash();
    }
    
    createMuzzleFlash() {
        const flashGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const flashMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffff00,
            transparent: true,
            opacity: 0.8
        });
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        
        flash.position.copy(this.player.position);
        flash.position.x += 0.8;
        
        this.scene.add(flash);
        
        // フラッシュアニメーション
        const animate = () => {
            flash.material.opacity -= 0.1;
            flash.scale.multiplyScalar(1.1);
            
            if (flash.material.opacity <= 0) {
                this.scene.remove(flash);
                flash.geometry.dispose();
                flash.material.dispose();
            } else {
                requestAnimationFrame(animate);
            }
        };
        animate();
    }
    
    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            bullet.mesh.position.add(bullet.velocity);
            bullet.life--;
            
            // 回転エフェクト
            bullet.mesh.rotation.x += 0.2;
            bullet.mesh.rotation.y += 0.1;
            
            if (bullet.life <= 0 || bullet.mesh.position.x > 20) {
                this.scene.remove(bullet.mesh);
                bullet.mesh.geometry.dispose();
                bullet.mesh.material.dispose();
                this.bullets.splice(i, 1);
            }
        }
    }
    
    spawnEnemies() {
        if (this.frameCount % (90 - this.level * 8) === 0) {
            this.createEnemy();
        }
    }
    
    createEnemy() {
        const enemyType = Math.random();
        let enemy;
        
        if (enemyType < 0.8) {
            // 通常の敵
            enemy = this.createNormalEnemy();
        } else if (enemyType < 0.95) {
            // 大型の敵
            enemy = this.createLargeEnemy();
        } else {
            // ボス敵
            enemy = this.createBossEnemy();
        }
        
        this.enemies.push(enemy);
        this.scene.add(enemy.mesh);
    }
    
    createNormalEnemy() {
        const group = new THREE.Group();
        
        // 敵機体
        const bodyGeometry = new THREE.ConeGeometry(0.2, 1, 6);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff4444,
            emissive: 0x220000
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.z = -Math.PI / 2;
        body.castShadow = true;
        group.add(body);
        
        group.position.set(15, Math.random() * 16 - 8, Math.random() * 10 - 5);
        
        return {
            mesh: group,
            health: 1,
            maxHealth: 1,
            speed: 0.08 + this.level * 0.01,
            type: 'normal',
            shootCooldown: 0
        };
    }
    
    createLargeEnemy() {
        const group = new THREE.Group();
        
        // 大型敵機体
        const bodyGeometry = new THREE.BoxGeometry(1.5, 1, 0.5);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff8800,
            emissive: 0x442200
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        group.add(body);
        
        // 装飾
        const detailGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 6);
        const detailMaterial = new THREE.MeshPhongMaterial({ color: 0xffaa00 });
        const detail1 = new THREE.Mesh(detailGeometry, detailMaterial);
        detail1.position.set(0, 0.3, 0);
        detail1.rotation.x = Math.PI / 2;
        group.add(detail1);
        
        const detail2 = new THREE.Mesh(detailGeometry, detailMaterial);
        detail2.position.set(0, -0.3, 0);
        detail2.rotation.x = Math.PI / 2;
        group.add(detail2);
        
        group.position.set(15, Math.random() * 14 - 7, Math.random() * 8 - 4);
        
        return {
            mesh: group,
            health: 2,
            maxHealth: 2,
            speed: 0.05 + this.level * 0.008,
            type: 'large',
            shootCooldown: 0
        };
    }
    
    createBossEnemy() {
        const group = new THREE.Group();
        
        // ボス機体
        const bodyGeometry = new THREE.IcosahedronGeometry(1, 1);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff0000,
            emissive: 0x440000,
            wireframe: false
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        group.add(body);
        
        // コア
        const coreGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const coreMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffffff,
            emissive: 0xffffaa
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        group.add(core);
        
        // 回転リング
        const ringGeometry = new THREE.TorusGeometry(1.2, 0.1, 8, 16);
        const ringMaterial = new THREE.MeshPhongMaterial({ color: 0xff6600 });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        group.add(ring);
        
        group.position.set(15, Math.random() * 12 - 6, Math.random() * 6 - 3);
        
        return {
            mesh: group,
            health: 5,
            maxHealth: 5,
            speed: 0.03 + this.level * 0.005,
            type: 'boss',
            shootCooldown: 0,
            rotationSpeed: 0.02
        };
    }
    
    updateEnemies() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            enemy.mesh.position.x -= enemy.speed;
            
            // 敵の回転
            if (enemy.type === 'boss') {
                enemy.mesh.rotation.x += enemy.rotationSpeed;
                enemy.mesh.rotation.y += enemy.rotationSpeed * 0.7;
                enemy.mesh.children[2].rotation.z += 0.05; // リングの回転
            } else {
                enemy.mesh.rotation.z += 0.01;
            }
            
            // 敵の射撃
            enemy.shootCooldown--;
            if (enemy.shootCooldown <= 0) {
                this.enemyShoot(enemy);
                enemy.shootCooldown = enemy.type === 'boss' ? 60 : 120;
            }
            
            // 画面外チェック
            if (enemy.mesh.position.x < -20) {
                this.scene.remove(enemy.mesh);
                this.disposeEnemy(enemy);
                this.enemies.splice(i, 1);
            }
            
            // 敵の死亡チェック
            if (enemy.health <= 0) {
                this.createExplosion(enemy.mesh.position);
                this.score += enemy.type === 'boss' ? 500 : enemy.type === 'large' ? 200 : 100;
                
                // パワーアップドロップ
                if (Math.random() < 0.3) {
                    this.createPowerup(enemy.mesh.position);
                }
                
                this.scene.remove(enemy.mesh);
                this.disposeEnemy(enemy);
                this.enemies.splice(i, 1);
            }
        }
    }
    
    enemyShoot(enemy) {
        const direction = new THREE.Vector3();
        direction.subVectors(this.player.position, enemy.mesh.position).normalize();
        
        if (enemy.type === 'boss') {
            // ボスは複数弾発射
            for (let i = -1; i <= 1; i++) {
                this.createEnemyBullet(enemy.mesh.position, direction, i * 0.2);
            }
        } else {
            this.createEnemyBullet(enemy.mesh.position, direction, 0);
        }
    }
    
    createEnemyBullet(position, direction, spread) {
        const bulletGeometry = new THREE.SphereGeometry(0.08, 6, 6);
        const bulletMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff4444,
            emissive: 0x220000
        });
        const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
        
        bullet.position.copy(position);
        
        // スプレッド追加
        const spreadDirection = direction.clone();
        spreadDirection.y += spread;
        spreadDirection.z += spread * 0.5;
        spreadDirection.normalize();
        
        this.enemyBullets.push({
            mesh: bullet,
            velocity: spreadDirection.multiplyScalar(0.3),
            life: 180
        });
        
        this.scene.add(bullet);
    }
    
    updateEnemyBullets() {
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            
            bullet.mesh.position.add(bullet.velocity);
            bullet.life--;
            
            bullet.mesh.rotation.x += 0.1;
            bullet.mesh.rotation.y += 0.15;
            
            if (bullet.life <= 0 || bullet.mesh.position.x < -15) {
                this.scene.remove(bullet.mesh);
                bullet.mesh.geometry.dispose();
                bullet.mesh.material.dispose();
                this.enemyBullets.splice(i, 1);
            }
        }
    }
    
    createPowerup(position) {
        const powerupGeometry = new THREE.OctahedronGeometry(0.3);
        const powerupMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x00ff00,
            emissive: 0x004400,
            transparent: true,
            opacity: 0.8
        });
        const powerup = new THREE.Mesh(powerupGeometry, powerupMaterial);
        
        powerup.position.copy(position);
        
        this.powerups.push({
            mesh: powerup,
            type: 'health',
            life: 300,
            rotationSpeed: 0.05
        });
        
        this.scene.add(powerup);
    }
    
    updatePowerups() {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            
            powerup.mesh.position.x -= 0.05;
            powerup.mesh.rotation.x += powerup.rotationSpeed;
            powerup.mesh.rotation.y += powerup.rotationSpeed * 0.7;
            powerup.life--;
            
            if (powerup.life <= 0 || powerup.mesh.position.x < -15) {
                this.scene.remove(powerup.mesh);
                powerup.mesh.geometry.dispose();
                powerup.mesh.material.dispose();
                this.powerups.splice(i, 1);
            }
        }
    }
    
    checkCollisions() {
        const playerPos = this.player.position;
        const hitRadius = 0.8; // プレイヤーの当たり判定
        
        // プレイヤーの弾と敵の衝突
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                const distance = bullet.mesh.position.distanceTo(enemy.mesh.position);
                
                if (distance < 1) {
                    enemy.health--;
                    this.createHitEffect(bullet.mesh.position);
                    
                    this.scene.remove(bullet.mesh);
                    bullet.mesh.geometry.dispose();
                    bullet.mesh.material.dispose();
                    this.bullets.splice(i, 1);
                    break;
                }
            }
        }
        
        // 敵の弾とプレイヤーの衝突
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            const distance = bullet.mesh.position.distanceTo(playerPos);
            
            if (distance < hitRadius) {
                this.playerData.health -= 5;
                this.createHitEffect(bullet.mesh.position);
                
                this.scene.remove(bullet.mesh);
                bullet.mesh.geometry.dispose();
                bullet.mesh.material.dispose();
                this.enemyBullets.splice(i, 1);
                
                if (this.playerData.health <= 0) {
                    this.gameOver();
                }
            }
        }
        
        // プレイヤーと敵の衝突
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const distance = playerPos.distanceTo(enemy.mesh.position);
            
            if (distance < hitRadius + 0.5) {
                this.playerData.health -= 10;
                enemy.health = 0;
                this.createExplosion(enemy.mesh.position);
                
                if (this.playerData.health <= 0) {
                    this.gameOver();
                }
            }
        }
        
        // プレイヤーとパワーアップの衝突
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            const distance = playerPos.distanceTo(powerup.mesh.position);
            
            if (distance < hitRadius) {
                if (powerup.type === 'health') {
                    this.playerData.health = Math.min(this.playerData.maxHealth, this.playerData.health + 50);
                }
                
                this.createHealEffect(powerup.mesh.position);
                this.scene.remove(powerup.mesh);
                powerup.mesh.geometry.dispose();
                powerup.mesh.material.dispose();
                this.powerups.splice(i, 1);
            }
        }
    }
    
    createExplosion(position) {
        for (let i = 0; i < 20; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.05, 4, 4);
            const particleMaterial = new THREE.MeshBasicMaterial({ 
                color: new THREE.Color().setHSL(Math.random() * 0.1, 1, 0.5),
                transparent: true,
                opacity: 1
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            particle.position.copy(position);
            particle.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5
            ));
            
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2
            );
            
            this.particles.push({
                mesh: particle,
                velocity: velocity,
                life: 30,
                maxLife: 30
            });
            
            this.scene.add(particle);
        }
    }
    
    createHitEffect(position) {
        for (let i = 0; i < 8; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.03, 4, 4);
            const particleMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xffff00,
                transparent: true,
                opacity: 1
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            particle.position.copy(position);
            
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1
            );
            
            this.particles.push({
                mesh: particle,
                velocity: velocity,
                life: 15,
                maxLife: 15
            });
            
            this.scene.add(particle);
        }
    }
    
    createHealEffect(position) {
        for (let i = 0; i < 12; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.04, 6, 6);
            const particleMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x00ff00,
                transparent: true,
                opacity: 1
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            particle.position.copy(position);
            
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.15,
                (Math.random() - 0.5) * 0.15,
                (Math.random() - 0.5) * 0.15
            );
            
            this.particles.push({
                mesh: particle,
                velocity: velocity,
                life: 25,
                maxLife: 25
            });
            
            this.scene.add(particle);
        }
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.mesh.position.add(particle.velocity);
            particle.velocity.multiplyScalar(0.95);
            particle.life--;
            
            const alpha = particle.life / particle.maxLife;
            particle.mesh.material.opacity = alpha;
            
            if (particle.life <= 0) {
                this.scene.remove(particle.mesh);
                particle.mesh.geometry.dispose();
                particle.mesh.material.dispose();
                this.particles.splice(i, 1);
            }
        }
    }
    
    updateBackground() {
        // 星フィールドの移動
        const positions = this.starField.geometry.attributes.position.array;
        for (let i = 0; i < this.stars.length; i++) {
            const star = this.stars[i];
            star.x -= star.speed;
            
            if (star.x < -100) {
                star.x = 100;
                star.y = (Math.random() - 0.5) * 200;
                star.z = (Math.random() - 0.5) * 200;
            }
            
            positions[i * 3] = star.x;
            positions[i * 3 + 1] = star.y;
            positions[i * 3 + 2] = star.z;
        }
        this.starField.geometry.attributes.position.needsUpdate = true;
        
        // カメラの微細な揺れ
        this.camera.position.y = Math.sin(this.frameCount * 0.01) * 0.1;
        this.camera.position.z = 5 + Math.sin(this.frameCount * 0.008) * 0.2;
    }
    
    disposeEnemy(enemy) {
        enemy.mesh.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('health').textContent = this.playerData.health;
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
        this.playerData.health = this.playerData.maxHealth;
        this.player.position.set(-8, 0, 0);
        
        // 全てのゲームオブジェクトをクリア
        [...this.bullets, ...this.enemyBullets, ...this.enemies, ...this.powerups, ...this.particles].forEach(obj => {
            this.scene.remove(obj.mesh);
            if (obj.mesh.geometry) obj.mesh.geometry.dispose();
            if (obj.mesh.material) obj.mesh.material.dispose();
        });
        
        this.bullets = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.powerups = [];
        this.particles = [];
        
        document.getElementById('gameOver').style.display = 'none';
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        this.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// ゲーム開始
window.addEventListener('load', () => {
    new Game3D();
});
