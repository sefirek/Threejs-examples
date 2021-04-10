import log from './grid.js';
import OrbitControls from './OrbitControls.js';
import getData from './getData.js';
import Hexagon from './Hexagon.js';
import HexagonsContainer from './HexagonsContainer.js';


log();
/**
 * @type import('./three.js')
 */


// eslint-disable-next-line global-require
const THREE = (window && window.THREE) || require('three-js');


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
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
  const mater = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const square = new THREE.Mesh(geom, mater);
  square.position.z = -0.1;
  square.position.x = -0.5;
  square.position.y = -0.5;
  return square;
}
/**
 * @type {HexagonsContainer}
 */
const hexagonsContainer = new HexagonsContainer();
hexagonsContainer.createDOM();
hexagonsContainer.optimalWeights.addEventListener((curr, prev) => {
  if (Number.isFinite(curr)) {
    console.error('bad weights', hexagonsContainer.getWeights());
    console.error('optWeiBad', { curr, prev });
    throw new Error('not object');
  }
});
hexagonsContainer.optimalError.addEventListener((current, prev) => {
  if (current === null) {
    console.error({ current, prev });
    throw new Error('Value is null');
  }
});


// const containerStyle = window.getComputedStyle(hexagonsContainer.nodeContainer);
// console.log({ containerStyle });
// const containerWidth = Number.parseInt(containerStyle.getPropertyValue('width'), 10);

document.onreadystatechange = () => {
  if (document.readyState !== 'complete') {
    return;
  }

  const canvasClientRect = renderer.domElement.getBoundingClientRect();
  const { y: clientY } = canvasClientRect;
  const containerWidth = hexagonsContainer.nodeContainer.firstElementChild.clientWidth;
  const ratio = containerWidth / (window.innerHeight - clientY);
  renderer.setSize(containerWidth, window.innerHeight - clientY);
  camera.aspect = ratio;
  camera.updateProjectionMatrix();
};

const dataSize = 8;

createHexagons();
function createHexagons() {
  hexagonsContainer.forEach(hexagon => scene.remove(hexagon.getMesh()));
  hexagonsContainer.splice(0);
  const hexagonSize = Math.min(
    1 / (1.5 * (hexagonsContainer.rowCount.getValue()) + 0.5),
    1 / (((hexagonsContainer.columnCount.getValue() > 1 ? 1 : 0) + 2 + 2 * (hexagonsContainer.columnCount.getValue() - 1)) * Math.sqrt(3) / 2),
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
  for (let i = 0; i < hexagonsContainer.rowCount.getValue(); i += 1) {
    for (let j = 0; j < hexagonsContainer.columnCount.getValue(); j += 1) {
      const x = -0.5 + getX(i, j) * hexagonSize;
      const y = -0.5 + getY(i, j) * hexagonSize;

      const material = new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff });

      const hexagonMesh = new THREE.Mesh(geometry, material);

      hexagonMesh.position.x = x;
      hexagonMesh.position.y = y;
      scene.add(hexagonMesh);
      hexagonsContainer.push(new Hexagon(hexagonMesh, hexagonsContainer, dataSize));
    }
  }
  hexagonsContainer.forEach(hexagon => hexagon.calculateNeighboursRadius());
}

hexagonsContainer.columnCount.addEventListener(createHexagons);
hexagonsContainer.rowCount.addEventListener(createHexagons);

function getX(i, j) {
  return 1 + 1.5 * i;
}

function getY(i, j) {
  return ((i % 2) + 1 + 2 * j) * Math.sqrt(3) / 2;
}


console.log({ cubes: hexagonsContainer.length });

camera.position.z = 1;
/**
 * @type {import('./OrbitControls')}
 */
const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

hexagonsContainer.nextEpoch();
getData(dataSize).then((data) => {
  let index = 0;
  let epoka = 0;
  let randomData = createRandomData();
  function createRandomData() {
    const copy = [...data];
    const random = [];
    while (copy.length > 0) {
      const randomId = Math.floor(Math.random() * copy.length);
      random.push(copy[randomId]);
      copy.splice(randomId, 1);
    }
    return random;
  }
  hexagonsContainer.run.addEventListener((curr, prev) => {
    if (curr === prev) return;
    if (curr > 0) {
      const optimalWeights = hexagonsContainer.optimalWeights.getValue();
      if (Number.isNaN(optimalWeights)) {
        hexagonsContainer.setWeights(optimalWeights);
      }
    }
    requestAnimationFrame(animate);
  });
  function animate() {
    let winner = null;

    // winner = hexagonsContainer.getWinner(one);

    // calculateHeatMap(new Array(dataSize).fill(1));
    // calculateHeatMap(new Array(dataSize).fill(0));

    if (hexagonsContainer.run.getValue() === 2) {
      winner = hexagonsContainer.getWinner(data[index]);
      hexagonsContainer.forEach((hexagon) => {
        hexagon.updateColor();
      });

      renderer.render(scene, camera);
      index += 1;
      if (index === data.length) {
        hexagonsContainer.run.setValue(0);
        index = 0;
      }
    } else {
      index = (index + 1) % (Math.floor(data.length / 100));
      const input = randomData[index];
      winner = hexagonsContainer.getWinner(input);
      winner.train(input);
      if (index === 0) {
        if (epoka % 1 === 0) {
        // hexagonsContainer.currentEpoch += 2;
          randomData = createRandomData();
          hexagonsContainer.nextEpoch();
          const currentError = hexagonsContainer.calculateError(data);
          hexagonsContainer.currentError.setValue(currentError);
          if (!hexagonsContainer.optimalError.getValue()) {
            hexagonsContainer.optimalError.setValue(currentError);
            hexagonsContainer.optimalWeights.setValue({ weights: hexagonsContainer.getWeights() });
          }
          if (hexagonsContainer.optimalError.getValue() < currentError) {
            hexagonsContainer.setWeights(hexagonsContainer.optimalWeights.getValue());
          } else {
            hexagonsContainer.optimalError.setValue(currentError);
            hexagonsContainer.optimalWeights.setValue(hexagonsContainer.getWeights());
          }
          controls.update();
          renderer.render(scene, camera);
        }
        epoka += 1;
      }
    }
    // hexagonMesh.rotation.x += 0.01;
    // hexagonMesh.rotation.y += 0.01;

    winner.updateColor();
    winner.neighboursRadius.forEach((neighbour) => {
      neighbour.hexagon.updateColor();
    });
    renderer.render(scene, camera);

    if (hexagonsContainer.currentEpoch.getValue() < hexagonsContainer.lastEpoch.getValue()
    && hexagonsContainer.run.getValue() > 0)requestAnimationFrame(animate);
    else hexagonsContainer.run.setValue(0);
    // else {
    //   index = 0;
    //   alert('teraz');
    //   const f = () => {
    //     index += 1;
    //     calculateHeatMap(data[index]);
    //     renderer.render(scene, camera);
    //     requestAnimationFrame(f);
    //   };
    //   f();
    // }
  }
});
