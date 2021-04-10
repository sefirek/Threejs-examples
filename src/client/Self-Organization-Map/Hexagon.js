import HexagonsContainer from './HexagonsContainer.js';
/**
 *
 * @param {THREE.Mesh} hexagonMesh
 * @param {HexagonsContainer} hexagonsContainer
 * @param {*} inputSize
 */
export default function Hexagon(hexagonMesh, hexagonsContainer, inputSize = 0) {
  const mesh = hexagonMesh;
  const getMesh = () => hexagonMesh;
  /**
   *
   * @type {getMesh}
   */
  this.getMesh = getMesh;
  this.weights = [];
  /**
   * @type {HexagonWrapper[]}
   */
  this.neighboursRadius = null;
  for (let i = 0; i < inputSize; i += 1) {
    const weight = Math.random();
    this.weights.push(weight);
  }


  this.calculateNeighboursRadius = () => {
    const { x, y } = mesh.position;
    const {
      currentLearningRate, neighborhoodSize,
    } = hexagonsContainer;
    if (this.neighboursRadius === null) {
      this.neighboursRadius = hexagonsContainer.map((hexagon) => {
        const hexagonPosition = hexagon.getMesh().position;
        const distance = Math.sqrt((hexagonPosition.x - x) ** 2) + ((hexagonPosition.y - y) ** 2);
        const topology = Math.exp(-(distance * distance) / (2 * neighborhoodSize.getValue() * neighborhoodSize.getValue()));
        const proximity = currentLearningRate.getValue() * topology;
        return new HexagonWrapper(hexagon, distance, proximity);
      });
    }
    this.neighboursRadius = this.neighboursRadius.filter(hexagon => hexagon.distance < neighborhoodSize.getValue());
  };
  this.run = (input = []) => {
    let sum = 0;
    this.weights.forEach((weight, id) => {
      // if (!Number.isFinite(input[id])) console.log({ 'very bad value': input[id] });
      sum += (weight - input[id]) ** 2;
    });
    this.value = Math.sqrt(sum);
    if (Number.isNaN(this.value)) {
      console.error({ input, weights: this.weights });
      throw new Error(`Value not a number ${JSON.stringify(this.weights, null, 2)} ${JSON.stringify(input, null, 2)}`);
    }
    return this;
  };
  this.train = (input = []) => {
    this.weights = this.weights.map((weight, id) => weight + hexagonsContainer.currentLearningRate.getValue() * (input[id] - weight));
    this.neighboursRadius.forEach((neighbour) => {
      const { hexagon, proximity } = neighbour;
      hexagon.weights = hexagon.weights.map((weight, id) => {
        const w = weight + proximity * (input[id] - weight);
        if (Number.isNaN(w)) throw new Error('weight is not a number');
        return w;
      });
    });
    // console.log({ min, max });
  };

  this.updateColor = () => {
    if (Number.isNaN(this.value)) {
      console.log(this);
      throw new Error(JSON.stringify({ badValue: this.value }, null, 2));
    }
    if (Math.abs(this.value) > 200) throw new Error(JSON.stringify({ value: this.value }, null, 2));
    mesh.material.color.setHSL(Math.max(0, Math.min(1, this.value)) * 0.7, 0.75, 0.5);
  };
}

/**
 *
 * @param {Hexagon} hexagon
 * @param {Number} distance
 * @param {Number} proximity
 */
function HexagonWrapper(hexagon, distance, proximity) {
  this.hexagon = hexagon;
  this.distance = distance;
  this.proximity = proximity;
}
