import Hexagon from './Hexagon.js';

/**
 * @extends {Array<Hexagon>}
 */
export default class HexagonsContainer extends Array {
  constructor(...args) {
    super(...args);

    this.learningRate = new EventEmitter().setValue(0.1);
    this.lastEpoch = new EventEmitter().setValue(100);
    this.currentEpoch = new EventEmitter().setValue(0);
    this.maxNeighborhood = new EventEmitter().setValue(1);
    this.neighborhoodSize = new EventEmitter().setValue(1);
    this.currentLearningRate = new EventEmitter().setValue(this.learningRate.getValue());
    this.run = new EventEmitter().setValue(0);
    this.rowCount = new EventEmitter().setValue(8);
    this.columnCount = new EventEmitter().setValue(8);

    /**
     * @type {HTMLInputElement}
     */
    this.learningRateNode = null;
    this.nextEpoch = () => {
      this.currentEpoch.setValue(this.currentEpoch.getValue() + 1);
      this.currentLearningRate.setValue(
        this.learningRate.getValue()
        * Math.exp(-this.currentEpoch.getValue()
        / this.lastEpoch.getValue()),
      );
      this.neighborhoodSize.setValue(
        this.maxNeighborhood.getValue()
        * Math.exp(-this.currentEpoch.getValue()
        / this.lastEpoch.getValue()),
      );
      this.forEach((hexagon) => {
        hexagon.calculateNeighboursRadius();
      });
    };
    this.calculateError = (datas = []) => {
      let error = 0;
      datas.forEach((data) => {
        error += this.getWinner(data).value;
      });
      return error;
    };
    this.getWeights = () => {
      const weights = [];
      this.forEach((hexagon) => {
        weights.push([...hexagon.weights]);
      });
      return weights;
    };

    this.setWeights = (weights = []) => {
      this.forEach((hexagon, id) => {
        hexagon.weights = [...weights[id]];
      });
    };
    /**
     *
     * @param {number[]} input
     * @returns {Hexagon}
     */
    this.getWinner = (input = []) => {
      let min = null;

      this.forEach((hexagon) => {
        hexagon.run(input);
        if (!min) {
          min = hexagon;
        }
        if (min.value > hexagon.value) min = hexagon;
      });
      return min;
    };
    this.createDOM = () => {
      this.nodeContainer = document.getElementById('hexagonContainer');
      const table = getAndAddTable(this.nodeContainer);
      table.append(
        createRow('Learning rate', this.learningRate),
        createRow('Current learning rate', this.currentLearningRate),
        createRow('Epoch', this.currentEpoch),
        createRow('Max epoch', this.lastEpoch),
        createRow('Neighborhood distance', this.neighborhoodSize),
        createRow('Columns', this.columnCount),
        createRow('Rows', this.rowCount),
      );
      const nodeGroupButton = ce('div');
      nodeGroupButton.className = 'group-button';
      getAndAddButton(nodeGroupButton, 'Start', (event) => {
        event.preventDefault();
        if (!this.run.getValue()) this.run.setValue(1);
      });
      getAndAddButton(nodeGroupButton, 'Stop', (event) => {
        event.preventDefault();
        if (this.run.getValue()) this.run.setValue(0);
      });
      getAndAddButton(nodeGroupButton, 'Restart', (event) => {
        event.preventDefault();
        this.run.setValue(0);
        this.learningRate.setValue(0.1);
        this.lastEpoch.setValue(100);
        this.currentEpoch.setValue(0);
        this.maxNeighborhood.setValue(1);
        this.neighborhoodSize.setValue(1);
        this.currentLearningRate.setValue(this.learningRate.getValue());
        this.nextEpoch();
      });
      getAndAddButton(nodeGroupButton, 'Play', (event) => {
        event.preventDefault();
        this.run.setValue(2);
      });
      this.nodeContainer.append(nodeGroupButton);

      // this.learningRateNode = getAndAddInput(nodeContainer, 'learningRate', 'Learning rate', 0, 1);
      // this.learningRateNode.value = this.learningRate;
      // this.learningRateNode.addEventListener('change', () => {
      //   this.learningRate.setValue(this.learningRateNode.value);
      // });
      // this.currentEpochNode = getAndAddInput(nodeContainer, 'currentEpoch', 'Epoka', 1, this.lastEpoch);
      // this.currentEpochNode.value = this.currentEpoch;
      // this.neighborhoodSizeNode = getAndAddInput(nodeContainer, 'neighborhoodSize', 'Sąsiedztwo', 1, this.neighborhoodSize);
      // this.neighborhoodSizeNode.addEventListener('change', () => {
      //   this.maxNeighborhood.setValue(this.neighborhoodSizeNode.value);
      // });
      // this.currentEpochNode.value = this.currentEpoch;
    };
  }


  /**
   *
   * @param {HTMLInputElement} element
   */
  setLearningRateInput(element) {
    this.learningRateInput = element;
    element.addEventListener('change', () => {
      this.learningRate = element.value;
    });
    element.setAttribute('value', this.learningRate);
  }

  /**
   *
   * @param {number} id
   * @returns {Hexagon}
   */
  getHexagon(id) {
    return this[id];
  }
}

function ce(tagName) {
  return document.createElement(tagName);
}

function getAndAddInput(container, name, label, min, max) {
  const labelElement = document.createElement('label');
  labelElement.setAttribute('for', name);
  labelElement.innerHTML = label;
  container.append(labelElement);
  const input = document.createElement('input');
  input.setAttribute('type', 'number');
  input.setAttribute('id', name);
  input.setAttribute('name', name);
  if (!Number.isNaN(min)) { input.setAttribute('min', min); }
  if (!Number.isNaN(max)) { input.setAttribute('min', max); }
  container.append(input);
  return input;
}

function createRow(name, eventEmitter) {
  const tr = ce('tr');
  const tdName = ce('td');
  tdName.innerHTML = name;
  const tdGetter = ce('td');
  eventEmitter.addEventListener((value) => {
    tdGetter.innerHTML = value;
  });
  tdGetter.innerHTML = eventEmitter.getValue();
  const tdSetter = ce('td');
  const inputSetter = ce('input');
  inputSetter.type = 'number';
  inputSetter.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      eventEmitter.setValue(inputSetter.value);
    }
  });
  tdSetter.append(inputSetter);

  tr.append(tdName, tdGetter, tdSetter);
  return tr;
}

function getAndAddTable(container) {
  const table = ce('table');
  table.className = 'table d-inline-table';
  table.style.width = 'auto';
  container.append(table);
  return table;
}

function getAndAddButton(container, name, listener) {
  const button = ce('button');
  button.className = 'btn btn-primary';
  button.innerHTML = name;
  container.append(button);
  if (listener) {
    button.addEventListener('click', listener);
  }

  return button;
}

function EventEmitter() {
  let value = 0;
  const listeners = [];
  this.getValue = () => value;
  this.setValue = (val) => {
    value = Number.parseFloat(val);
    listeners.forEach((fn) => {
      fn(val);
    });
    return this;
  };
  this.addEventListener = (listener) => {
    listeners.push(listener);
  };
}
