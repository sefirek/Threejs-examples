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
const boxSize = 0.01;
const geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
/**
 * @type {THREE.Mesh[]}
 */
const cubes = [];
const boxesCount = 36;
for (let i = 0; i < boxesCount; i += 1) {
  const idX = i - boxesCount / 2;
  const s = idX / boxesCount * Math.PI * 2;
  const material = new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff });

  for (let j = 0; j < boxesCount; j += 1) {
    const idY = j - boxesCount / 2;
    const t = idY / boxesCount * Math.PI * 2;
    const cube = new THREE.Mesh(geometry, material);
    cube.position.x = Math.cos(s) * Math.sin(t);
    cube.position.y = Math.sin(s) * Math.sin(t);
    scene.add(cube);
    cubes.push(cube);
  }

  // for (let j = 0; j < boxesCount; j += 1) {
  //   const material = new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff });
  //   const cube = new THREE.Mesh(geometry, material);
  //   const idZ = j;
  //   const t = idZ / boxesCount * Math.PI * 2;
  //   cube.position.x = Math.cos(s) * Math.sin(t);
  //   cube.position.y = Math.sin(s) * Math.sin(t);
  //   cube.position.z = Math.exp(t * s);
  //   scene.add(cube);
  // }
}


camera.position.z = 2;
/**
 * @type {import('./OrbitControls')}
 */
const controls = new OrbitControls(camera, renderer.domElement);
// const keyboardControls = new FirstPersonControls(camera, renderer.domElement);
controls.update();

function animate() {
  requestAnimationFrame(animate);

  // cube.rotation.x += 0.01;
  // cube.rotation.y += 0.01;
  controls.update();
  // keyboardControls.update();
  const randomX = Math.sin((Math.random() - 0.5) * 2 * Math.PI);
  const randomY = Math.cos((Math.random() - 0.5) * 2 * Math.PI);
  let maxRadius = 0.0001;
  cubes.map((cube) => {
    const radius = ((randomX - cube.position.x) ** 2) + ((randomY - cube.position.y) ** 2);
    maxRadius = Math.max(radius, maxRadius);
    return {
      cube,
      radius,
    };
  }).sort((a, b) => a.radius - b.radius).forEach((object, id) => {
    const { position } = object.cube;
    const { x, y } = position;
    position.x += Math.tanh((randomX - x)) / (id + 1);
    position.y += Math.tanh((randomY - y)) / (id + 1);
  });
  renderer.render(scene, camera);
}

animate();
