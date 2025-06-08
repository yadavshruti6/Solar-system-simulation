// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#solar-system'),
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Add OrbitControls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 20;
controls.maxDistance = 100;

// Add raycaster for planet labels
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const labelDiv = document.createElement('div');
labelDiv.style.position = 'absolute';
labelDiv.style.padding = '5px 10px';
labelDiv.style.background = 'rgba(0, 0, 0, 0.7)';
labelDiv.style.color = 'white';
labelDiv.style.borderRadius = '5px';
labelDiv.style.pointerEvents = 'none';
labelDiv.style.display = 'none';
document.body.appendChild(labelDiv);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);
const sunLight = new THREE.PointLight(0xffffff, 2, 300);
scene.add(sunLight);

// Camera position
camera.position.z = 50;

// Planet data
const planetData = {
    mercury: { size: 0.8, distance: 5, speed: 1, color: 0x8C8C8C },
    venus: { size: 1.8, distance: 7, speed: 1, color: 0xE6E6B8 },
    earth: { size: 2, distance: 10, speed: 1, color: 0x2233FF },
    mars: { size: 1, distance: 13, speed: 1, color: 0xC1440E },
    jupiter: { size: 5, distance: 18, speed: 1, color: 0xD8CA9D },
    saturn: { size: 4.4, distance: 23, speed: 1, color: 0xE3B059 },
    uranus: { size: 3.6, distance: 28, speed: 1, color: 0x5580AA },
    neptune: { size: 3.6, distance: 33, speed: 1, color: 0x366896 }
};

// Create planets
const planets = {};
const planetMeshes = {};

// Create Sun
const sunGeometry = new THREE.SphereGeometry(3, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Create stars
function createStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 0.1
    });

    const starsVertices = [];
    for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
}

// Create planets
Object.keys(planetData).forEach(planet => {
    const data = planetData[planet];
    const geometry = new THREE.SphereGeometry(data.size, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color: data.color });
    const mesh = new THREE.Mesh(geometry, material);
    
    // Create orbit
    const orbitGeometry = new THREE.RingGeometry(data.distance - 0.1, data.distance + 0.1, 128);
    const orbitMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3
    });
    const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbit.rotation.x = Math.PI / 2;
    scene.add(orbit);
    
    scene.add(mesh);
    planets[planet] = {
        mesh,
        angle: Math.random() * Math.PI * 2,
        speed: data.speed,
        distance: data.distance
    };
});

createStars();

// Animation state
let isPaused = false;

// Animation loop
function animate() {
    if (!isPaused) {
        requestAnimationFrame(animate);
        
        // Update controls
        controls.update();
        
        // Rotate sun
        sun.rotation.y += 0.002;
        
        // Update planet positions
        Object.keys(planets).forEach(planet => {
            const p = planets[planet];
            p.angle += 0.01 * p.speed;
            p.mesh.position.x = Math.cos(p.angle) * p.distance;
            p.mesh.position.z = Math.sin(p.angle) * p.distance;
            p.mesh.rotation.y += 0.05;
        });
    }
    
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Speed controls
Object.keys(planetData).forEach(planet => {
    const slider = document.getElementById(planet);
    slider.addEventListener('input', (e) => {
        planets[planet].speed = parseFloat(e.target.value);
    });
});

// Pause/Resume button
document.getElementById('pause-btn').addEventListener('click', () => {
    isPaused = !isPaused;
    if (!isPaused) {
        animate();
    }
});

// Theme toggle
let isDarkTheme = true;
document.getElementById('theme-toggle').addEventListener('click', () => {
    isDarkTheme = !isDarkTheme;
    document.body.style.backgroundColor = isDarkTheme ? '#000' : '#fff';
    document.body.style.color = isDarkTheme ? '#fff' : '#000';
    document.getElementById('controls').style.backgroundColor = isDarkTheme ? 
        'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)';
});

// Add mouse move handler for planet labels
window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(Object.values(planets).map(p => p.mesh));
    
    if (intersects.length > 0) {
        const planet = intersects[0].object;
        const planetName = Object.keys(planets).find(key => planets[key].mesh === planet);
        if (planetName) {
            labelDiv.style.display = 'block';
            labelDiv.style.left = event.clientX + 10 + 'px';
            labelDiv.style.top = event.clientY + 10 + 'px';
            labelDiv.textContent = planetName.charAt(0).toUpperCase() + planetName.slice(1);
        }
    } else {
        labelDiv.style.display = 'none';
    }
});

// Start animation
animate(); 