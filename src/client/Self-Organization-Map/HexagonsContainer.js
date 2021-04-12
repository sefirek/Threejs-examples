import Hexagon from './Hexagon.js';

/**
 * @extends {Array<Hexagon>}
 */
export default class HexagonsContainer extends Array {
  constructor(...args) {
    super(...args);

    this.learningRate = new EventEmitter(this).setValue(0.1);
    this.lastEpoch = new EventEmitter(this).setValue(100);
    this.currentEpoch = new EventEmitter(this).setValue(0);
    this.maxNeighborhood = new EventEmitter(this).setValue(1);
    this.neighborhoodSize = new EventEmitter(this).setValue(1);
    this.currentLearningRate = new EventEmitter(this).setValue(this.learningRate.getValue());
    this.run = new EventEmitter(this);
    this.rowCount = new EventEmitter(this).setValue(8);
    this.columnCount = new EventEmitter(this).setValue(8);
    this.optimalWeights = new EventEmitter(this);
    this.optimalError = new EventEmitter(this).setValue(0);
    this.optimalData = new EventEmitter().setValue({ weights: [], error: null });
    this.currentError = new EventEmitter(this).setValue(0);

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
      // if (weights.length === 0) throw new Error('Weights size 0');
      return weights;
    };

    this.setWeights = (weights = []) => {
      try {
        this.forEach((hexagon, id) => {
          hexagon.weights = [...weights[id]];
        });
      } catch (e) {
        console.error({ hc: this, weights });
        throw new Error('The sizes of the arrays are not the same');
      }
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
      const rowInterfaceContainer = ce('div');
      rowInterfaceContainer.className = 'row-interface-container';

      const table = getAndAddTable(rowInterfaceContainer);
      table.append(
        createRow('Learning rate', this.learningRate),
        createRow('Current learning rate', this.currentLearningRate),
        createRow('Epoch', this.currentEpoch),
        createRow('Max epoch', this.lastEpoch),
        createRow('Max Neighborhood distance', this.maxNeighborhood),
        createRow('Neighborhood distance', this.neighborhoodSize),
        createRow('Columns', this.columnCount),
        createRow('Rows', this.rowCount),
      );
      const nodeGroupButton = ce('div');
      nodeGroupButton.className = 'group-button';
      getAndAddButton(nodeGroupButton, 'Start', (event) => {
        event.preventDefault();
        this.run.setValue(1);
      });
      getAndAddButton(nodeGroupButton, 'Stop', (event) => {
        event.preventDefault();
        this.run.setValue(0);
      });
      getAndAddButton(nodeGroupButton, 'Restart', (event) => {
        event.preventDefault();
        this.learningRate.setValue(0.1);
        this.lastEpoch.setValue(100);
        this.currentEpoch.setValue(0);
        this.maxNeighborhood.setValue(1);
        this.neighborhoodSize.setValue(1);
        this.currentLearningRate.setValue(this.learningRate.getValue());
        this.nextEpoch();
        this.run.setValue(0);
      });
      getAndAddButton(nodeGroupButton, 'Play', (event) => {
        event.preventDefault();
        this.run.setValue(2);
      });
      rowInterfaceContainer.append(nodeGroupButton);
      this.nodeContainer.append(rowInterfaceContainer);

      const jsonContainer = ce('div');
      jsonContainer.className = 'json-container';
      const textarea = ce('textarea');
      this.optimalWeights.addEventListener((weights) => {
        this.optimalData.setValue(Object.assign(this.optimalData.getValue(), { weights }));
      });
      this.optimalError.addEventListener((error) => {
        this.optimalData.setValue(Object.assign(this.optimalData.getValue(), { error }));
      });

      jsonContainer.append(textarea);

      const groupButton = ce('div');
      groupButton.className = 'group-button';

      getAndAddButton(groupButton, 'Set', (event) => {
        event.preventDefault();
        if (!textarea.value) {
          throw new Error('InnerHTML is empty');
        }
        const json = JSON.parse(textarea.value);
        this.optimalData.setValue(json);
      });
      this.optimalData.addEventListener((current) => {
        textarea.value = JSON.stringify(current, null, 2);
      });

      getAndAddButton(groupButton, 'Copy', (event) => {
        event.preventDefault();

        const rangePre = new Range();
        rangePre.setStart(textarea, 0);
        rangePre.setEnd(textarea, 1);

        const selection = document.getSelection();
        selection.empty();
        selection.addRange(rangePre);
        document.execCommand('copy');
        selection.removeRange(rangePre);
      });

      jsonContainer.append(groupButton);
      this.nodeContainer.append(jsonContainer);
    };
    Object.keys(this).forEach((key) => {
      const obj = this[key];
      if (obj instanceof EventEmitter) obj.name = key;
    });
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

  isOptimalWeightsValidSize() {
    const weights = this.getWeights();
    const h = weights.length;
    const w = weights[0].length;
    const optData = this.optimalData.getValue();
    if (!(optData && optData.weights)) return false;
    const oH = optData.weights.length;
    const oW = oH ? optData.weights[0].length : 0;
    if (h !== oH || w !== oW) return false;
    return true;
  }
}

function ce(tagName) {
  return document.createElement(tagName);
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
  let value = null;
  const listeners = [];
  this.getValue = () => value;
  this.setValue = (val) => {
    let curr = Number.parseFloat(val);
    if (Number.isNaN(curr) || Array.isArray(val)) curr = val;
    if (curr === value && Array.isArray(curr)) {
      throw new Error('the same array instance');
    }
    if (curr === value && typeof curr !== 'object') return this;
    const prev = value;
    value = curr;
    listeners.forEach((fn) => {
      fn(value, prev);
    });
    return this;
  };
  this.addEventListener = (listener) => {
    listeners.push(listener);
  };
}
