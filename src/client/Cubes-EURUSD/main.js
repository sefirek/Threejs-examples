import log from './grid.js';
import OrbitControls from './OrbitControls.js';

log();
/**
 * @type {import('three')}
 */


// eslint-disable-next-line global-require
const THREE = (window && window.THREE) || require('three-js');


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
scene.add(createSquare());
function createSquare() {
  const squareVectorsPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0, 1),
    new THREE.Vector2(1, 1),
    new THREE.Vector2(1, 0),
  ];
  const geom = new THREE.ShapeGeometry(new THREE.Shape(squareVectorsPoints));
  const mater = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const square = new THREE.Mesh(geom, mater);
  square.position.z = -0.001;
  square.position.x = -0.5;
  square.position.y = -0.5;
  return square;
}
const hexagonCount = 4;
const hexagonSize = Math.min(
  1 / (1.5 * (hexagonCount) + 0.5),
  1 / (((hexagonCount > 1 ? 1 : 0) + 2 + 2 * (hexagonCount - 1)) * Math.sqrt(3) / 2),
);
const hexagonPoints = [];
for (let i = 0; i < 6; i += 1) {
  hexagonPoints.push(getHexagonVectorPoint(i));
}
function getHexagonVectorPoint(id) {
  const angle = id * 60 / 360 * Math.PI * 2;
  const x = Math.cos(angle) * hexagonSize;
  const y = Math.sin(angle) * hexagonSize;
  return new THREE.Vector2(x, y);
}
const geometry = new THREE.ShapeGeometry(new THREE.Shape(hexagonPoints));

/**
 * @type {THREE.Mesh[]}
 */
const cubes = [];


for (let i = 0; i < hexagonCount; i += 1) {
  const material = new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff });

  for (let j = 0; j < hexagonCount; j += 1) {
    const x = -0.5 + getX(i, j) * hexagonSize;
    const y = -0.5 + getY(i, j) * hexagonSize;

    const cube = new THREE.Mesh(geometry, material);
    cube.position.x = x;
    cube.position.y = y;
    scene.add(cube);
    cubes.push(cube);
  }
}
function getX(i, j) {
  return 1 + 1.5 * i;
}

function getY(i, j) {
  return ((i % 2) + 1 + 2 * j) * Math.sqrt(3) / 2;
}

console.log({ cubes: cubes.length });

camera.position.z = 1;
/**
 * @type {import('./OrbitControls')}
 */
const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

function animate() {
  requestAnimationFrame(animate);

  // cube.rotation.x += 0.01;
  // cube.rotation.y += 0.01;
  controls.update();
  // keyboardControls.update();

  renderer.render(scene, camera);
}

animate();
