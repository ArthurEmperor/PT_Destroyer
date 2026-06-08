// Configuração básica da cena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Iluminação
const light = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(light);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

// Chão do cenário
const floorGeo = new THREE.PlaneGeometry(100, 100);
const floorMat = new THREE.MeshStandardMaterial({ color: 0x333333, side: THREE.DoubleSide });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = Math.PI / 2;
scene.add(floor);

// Posicionamento inicial da câmera (Jogador)
camera.position.set(0, 2, 5);

// Vetores para controle de movimento e projéteis
const move = { forward: false, backward: false, left: false, right: false };
const bullets = [];

// Eventos de teclado
window.addEventListener('keydown', (e) => {
    if (e.key === 'w' || e.key === 'W') move.forward = true;
    if (e.key === 's' || e.key === 'S') move.backward = true;
    if (e.key === 'a' || e.key === 'A') move.left = true;
    if (e.key === 'd' || e.key === 'D') move.right = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'w' || e.key === 'W') move.forward = false;
    if (e.key === 's' || e.key === 'S') move.backward = false;
    if (e.key === 'a' || e.key === 'A') move.left = false;
    if (e.key === 'd' || e.key === 'D') move.right = false;
});

// Mecânica de Tiro (Clique do Mouse)
window.addEventListener('click', () => {
    atirarProjetil();
});

function atirarProjetil() {
    // Cria a esfera de energia
    const bulletGeo = new THREE.SphereGeometry(0.2, 16, 16);
    const bulletMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc }); // Cor da energia
    const bullet = new THREE.Mesh(bulletGeo, bulletMat);
    
    // Define a posição inicial saindo da direção da câmera
    bullet.position.copy(camera.position);
    
    // Calcula a direção que a câmera está olhando
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    
    // Salva a direção no objeto do projétil para mover depois
    bullet.userData = { direction: direction.clone() };
    
    scene.add(bullet);
    bullets.push(bullet);
}

// Controle de rotação simples da câmera com o mouse
let mouseX = 0, mouseY = 0;
window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX - window.innerWidth / 2) * 0.003;
    mouseY = (e.clientY - window.innerHeight / 2) * 0.003;
});

// Loop de renderização e atualização do jogo
function animate() {
    requestAnimationFrame(animate);

    // Movimentação do jogador
    const speed = 0.1;
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0; // Impede o jogador de voar ao olhar para cima
    direction.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(camera.up, direction).normalize();

    if (move.forward) camera.position.addScaledVector(direction, speed);
    if (move.backward) camera.position.addScaledVector(direction, -speed);
    if (move.left) camera.position.addScaledVector(right, speed);
    if (move.right) camera.position.addScaledVector(right, -speed);

    // Rotação da câmera
    camera.rotation.y = -mouseX;
    camera.rotation.x = -mouseY;

    // Atualização dos projéteis
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.position.addScaledVector(b.userData.direction, 0.5); // Velocidade do tiro

        // Remove projéteis que vão muito longe para não travar o jogo
        if (b.position.distanceTo(camera.position) > 100) {
            scene.remove(b);
            bullets.splice(i, 1);
        }
    }

    renderer.render(scene, camera);
}

animate();

// Ajusta a tela caso o navegador mude de tamanho
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});