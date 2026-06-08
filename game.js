// ==========================================
// 1. CONFIGURAÇÃO DA CENA E ELEMENTOS DA UI
// ==========================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f172a);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Elementos do DOM (HTML)
const txtPontos = document.getElementById('pontos-txt');
const telaPause = document.getElementById('tela-pause');
const uiContainer = document.getElementById('ui-container');
const barraBossContainer = document.getElementById('barra-boss-container');
const barraBossVida = document.getElementById('barra-boss-vida');

// Luzes
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(20, 40, 20);
scene.add(dirLight);

// Chão
const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

camera.position.set(0, 2, 0);
camera.rotation.order = 'YXZ';

// VARIABLES DE ESTADO DO JOGO
let isPaused = true;
let pontos = 0;
let enemiesDefeated = 0;
const enemiesNeededForBoss = 10;

const move = { forward: false, backward: false, left: false, right: false };
const bullets = [];
const enemies = [];
let boss = null;

// ==========================================
// 2. SISTEMA DE PAUSE & POINTER LOCK
// ==========================================
window.addEventListener('click', () => {
    if (!isPaused) {
        atirarProjetil();
    } else {
        renderer.domElement.requestPointerLock();
    }
});

document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === renderer.domElement) {
        isPaused = false;
        telaPause.classList.add('escondido');
    } else {
        isPaused = true;
        telaPause.classList.remove('escondido');
        // Zera comandos de andar ao pausar para não travar correndo
        Object.keys(move).forEach(key => move[key] = false);
    }
});

window.addEventListener('mousemove', (e) => {
    if (!isPaused) {
        camera.rotation.y -= e.movementX * 0.002;
        camera.rotation.x -= e.movementY * 0.002;
        camera.rotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, camera.rotation.x));
    }
});

// Controles de Movimento
window.addEventListener('keydown', (e) => {
    if (isPaused) return;
    if (e.key.toLowerCase() === 'w') move.forward = true;
    if (e.key.toLowerCase() === 's') move.backward = true;
    if (e.key.toLowerCase() === 'a') move.left = true;
    if (e.key.toLowerCase() === 'd') move.right = true;
});
window.addEventListener('keyup', (e) => {
    if (e.key.toLowerCase() === 'w') move.forward = false;
    if (e.key.toLowerCase() === 's') move.backward = false;
    if (e.key.toLowerCase() === 'a') move.left = false;
    if (e.key.toLowerCase() === 'd') move.right = false;
});

// ==========================================
// 3. MECÂNICAS DE INIMIGOS E TIROS
// ==========================================
function atirarProjetil() {
    const bullet = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), new THREE.MeshBasicMaterial({ color: 0x00ffcc }));
    bullet.position.copy(camera.position);
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    bullet.userData = { direction: direction.clone() };
    scene.add(bullet);
    bullets.push(bullet);
}

function criarInimigo() {
    if (boss || isPaused) return;

    const enemy = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 16), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    const angle = Math.random() * Math.PI * 2;
    const distance = 30 + Math.random() * 20;
    enemy.position.set(camera.position.x + Math.cos(angle) * distance, 1, camera.position.z + Math.sin(angle) * distance);

    // Cria elemento HTML da barra de vida do inimigo
    const divBarra = document.createElement('div');
    divBarra.className = 'barra-inimigo';
    divBarra.innerHTML = '<div class="barra-inimigo-cheia"></div>';
    uiContainer.appendChild(divBarra);

    enemy.userData = { hp: 3, maxHp: 3, isBoss: false, uiElement: divBarra };
    scene.add(enemy);
    enemies.push(enemy);
}

function criarBoss() {
    boss = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), new THREE.MeshStandardMaterial({ color: 0xa855f7 }));
    boss.position.set(camera.position.x, 2, camera.position.z - 40);
    boss.userData = { hp: 20, maxHp: 20, isBoss: true };
    
    scene.add(boss);
    enemies.push(boss);
    
    barraBossContainer.classList.remove('escondido');
    barraBossVida.style.width = '100%';
}

setInterval(criarInimigo, 2000);

// Atualiza as posições das barras de vida 2D sobre o espaço 3D
function atualizarBarrasDeVida() {
    const tempV = new THREE.Vector3();
    
    enemies.forEach(e => {
        if (e.userData.isBoss) return; // O chefe tem barra fixa no topo

        // Pega a posição do topo do inimigo
        tempV.copy(e.position);
        tempV.y += 1.5; // Coloca a barra um pouco acima da esfera
        tempV.project(camera);

        // Verifica se o inimigo está atrás da câmera
        if (tempV.z > 1) {
            e.userData.uiElement.style.display = 'none';
            return;
        }

        // Converte coordenadas 3D para pixels da tela
        const x = (tempV.x * .5 + .5) * window.innerWidth;
        const y = (tempV.y * -.5 + .5) * window.innerHeight;

        e.userData.uiElement.style.display = 'block';
        e.userData.uiElement.style.left = `${x - 25}px`; // Centraliza (metade da largura de 50px)
        e.userData.uiElement.style.top = `${y}px`;
        
        // Atualiza a porcentagem preenchida
        const pct = (e.userData.hp / e.userData.maxHp) * 100;
        e.userData.uiElement.firstChild.style.width = `${pct}%`;
    });
}

// ==========================================
// 4. LOOP DE ATUALIZAÇÃO (ANIMATE)
// ==========================================
function animate() {
    requestAnimationFrame(animate);

    if (isPaused) return; // Para toda a lógica se estiver pausado

    // Movimento Jogador
    const speed = 0.15;
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0; direction.normalize();
    const right = new THREE.Vector3().crossVectors(camera.up, direction).normalize();

    if (move.forward) camera.position.addScaledVector(direction, speed);
    if (move.backward) camera.position.addScaledVector(direction, -speed);
    if (move.left) camera.position.addScaledVector(right, speed);
    if (move.right) camera.position.addScaledVector(right, -speed);

    // Balas e colisões
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.position.addScaledVector(b.userData.direction, 0.8);

        if (b.position.distanceTo(camera.position) > 100) {
            scene.remove(b);
            bullets.splice(i, 1);
            continue;
        }

        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            const distCol = e.userData.isBoss ? 2.5 : 1.2;

            if (b.position.distanceTo(e.position) < distCol) {
                e.userData.hp--;
                scene.remove(b);
                bullets.splice(i, 1);

                if (e.userData.isBoss) {
                    barraBossVida.style.width = `${(e.userData.hp / e.userData.maxHp) * 100}%`;
                }

                if (e.userData.hp <= 0) {
                    if (!e.userData.isBoss) {
                        uiContainer.removeChild(e.userData.uiElement); // Remove barra do HTML
                        pontos += 10;
                        enemiesDefeated++;
                    } else {
                        pontos += 100;
                        boss = null;
                        enemiesDefeated = 0;
                        barraBossContainer.classList.add('escondido');
                    }
                    
                    txtPontos.innerText = pontos;
                    scene.remove(e);
                    enemies.splice(j, 1);

                    if (enemiesDefeated === enemiesNeededForBoss && !boss) {
                        criarBoss();
                    }
                }
                break;
            }
        }
    }

    // Movimentação dos inimigos e Game Over
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        const dir = new THREE.Vector3().subVectors(camera.position, e.position);
        dir.y = 0; dir.normalize();
        e.position.addScaledVector(dir, e.userData.isBoss ? 0.03 : 0.05);

        if (e.position.distanceTo(camera.position) < 1.5) {
            // Reiniciar Jogo
            camera.position.set(0, 2, 0);
            enemies.forEach(enemy => {
                if (!enemy.userData.isBoss) uiContainer.removeChild(enemy.userData.uiElement);
                scene.remove(enemy);
            });
            enemies.length = 0;
            boss = null;
            enemiesDefeated = 0;
            pontos = 0;
            txtPontos.innerText = pontos;
            barraBossContainer.classList.add('escondido');
            document.exitPointerLock();
            alert("Game Over! Seu placar foi zerado.");
            break;
        }
    }

    atualizarBarrasDeVida();
    renderer.render(scene, camera);
}

// Inicia pausado para instrução
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});