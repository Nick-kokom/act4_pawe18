import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as dat from 'lil-gui';
import { gsap } from 'gsap'; // Import GSAP for animations

// Debug
const gui = new dat.GUI({ width: 340 });

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

// Texture loader
const textureLoader = new THREE.TextureLoader();

// const Meteor = textureLoader.load('/meteor.jpg');
// Meteor.wrapS = THREE.RepeatWrapping; // Repeat horizontally
// Meteor.wrapT = THREE.RepeatWrapping; // Repeat vertically

// const Meteorgeometry = new THREE.BoxGeometry(0.2, 1.4, 0.5);
// const material = new THREE.MeshBasicMaterial({ map: Meteor });
// const cube = new THREE.Mesh(Meteorgeometry, material);
// cube.position.set(1, 4, 0);
// scene.add(cube);

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.set(30, 2, 3); // Adjusted for better visibility
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000); // Set background color

/**
 * Add Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // Bright directional light
directionalLight.position.set(5, 5, 5); // Position the light
scene.add(directionalLight);

// Debug lighting
const lightFolder = gui.addFolder('Lights');
lightFolder.add(directionalLight.position, 'x', -10, 10, 0.1).name('Directional Light X');
lightFolder.add(directionalLight.position, 'y', -10, 10, 0.1).name('Directional Light Y');
lightFolder.add(directionalLight.position, 'z', -10, 10, 0.1).name('Directional Light Z');
lightFolder.add(directionalLight, 'intensity', 0, 2, 0.1).name('Light Intensity');

/**
 * Load GLB Model
 */
let model; // Declare a variable to store the loaded model
let bubble; // Declare a variable for the bubble mesh

const loader = new GLTFLoader();
loader.load(
    '/planet_earth.glb',
    (gltf) => {
        // Add the loaded model to the scene
        model = gltf.scene;
        model.position.set(0, 0, 0);
        model.scale.set(1, 1, 1);
        scene.add(model);

        // Debug model materials
        model.traverse((node) => {
            if (node.isMesh) {
                console.log(node.material);
            }
        });

        // Create a transparent bubble around the planet
        createBubble();
    },
    undefined,
    (error) => {
        console.error('Error loading the model:', error);
    }
);

function createBubble() {
    const bubbleGeometry = new THREE.SphereGeometry(10, 32, 32); // Larger radius
    const bubbleMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xdfe0e0, // Cyan color
        transparent: true,
        opacity: 0.1, // Lower opacity for a more glass-like appearance
        refractionRatio: 0.98, // Adjust refraction to simulate glass
        reflectivity: 1, // Reflectivity of the surface
        metalness: 0, // Non-metallic for glass
        roughness: 0.1, // Smooth surface for glass-like appearance
        clearcoat: 1, // Glossy surface
        clearcoatRoughness: 0, // Smooth clear coat
        side: THREE.DoubleSide // Render both sides
    });
    bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
    bubble.position.set(0, 0, 0); // Centered around the Earth
    scene.add(bubble);

    // Add an additional light to enhance visibility
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);
}

// Raycasting setup
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Control panel feature
const params = {
    bubbleWave: false, // Default: pop
};

const actionsFolder = gui.addFolder('Bubble Actions');
// actionsFolder.add(params, 'bubbleWave').name('Action'); // Checkbox for wave action

window.addEventListener('click', (event) => {
    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / sizes.width) * 2 - 1;
    mouse.y = -(event.clientY / sizes.height) * 2 + 1;

    // Update the raycaster with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObject(bubble);

    if (intersects.length > 0) {
        // Trigger the action based on the checkbox state
        if (params.bubbleWave) {
            waveBubble();
        } else {
            popBubble();
        }
    }
});

function popBubble() {
    // Remove the big bubble mesh
    scene.remove(bubble);

    // Create small bubbles after the main bubble is popped
    for (let i = 0; i < 20; i++) {
        const smallBubbleGeometry = new THREE.SphereGeometry(0.5, 50, 16);
        const smallBubbleMaterial = new THREE.MeshBasicMaterial({ color: 0xdfe0e0, transparent: true, opacity: 0.5 });
        const smallBubble = new THREE.Mesh(smallBubbleGeometry, smallBubbleMaterial);

        // Randomize position and velocity
        smallBubble.position.copy(bubble.position);
        smallBubble.position.x += (Math.random() - 0.5) * 5;
        smallBubble.position.y += (Math.random() - 0.5) * 10;
        smallBubble.position.z += (Math.random() - 0.5) * 10;

        scene.add(smallBubble);

        // Animate the small bubble
        gsap.to(smallBubble.position, {
            y: smallBubble.position.y + 8,
            duration: 2,
            onComplete: () => {
                scene.remove(smallBubble); // Remove small bubble when animation is complete
            }
        });
    }

    // Recreate the big bubble after 4 seconds
    setTimeout(() => {
        createBubble(); // Recreate the original bubble
    }, 4000);
}




/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
    const elapsedTime = clock.getElapsedTime();

    // Update controls
    controls.update();

    // Rotate the model (if loaded)
    if (model) {
        model.rotation.y = elapsedTime * 0.5; // Rotate around Y-axis
    }

    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
};

tick();
