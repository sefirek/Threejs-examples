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
    this.optimalData = new EventEmitter().setValue({ weights: null, error: null });
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
      this.optimalWeights.addEventListener((current) => {
        this.optimalData.setValue(Object.assign(this.optimalData.getValue(), { weights: current }));
        textarea.value = JSON.stringify(this.optimalData.getValue(), null, 2);
      });
      this.optimalError.addEventListener((current) => {
        this.optimalData.setValue(Object.assign(this.optimalData.getValue(), { error: current }));
        textarea.value = JSON.stringify(this.optimalData.getValue(), null, 2);
      });

      jsonContainer.append(textarea);

      const groupButton = ce('div');
      groupButton.className = 'group-button';

      getAndAddButton(groupButton, 'Set', (event) => {
        event.preventDefault();
        try {
          if (!textarea.value) {
            console.error({ textarea });
            throw new Error('InnerHTML is empty');
          }
          const json = JSON.parse(textarea.value);
          this.optimalData.setValue(json);
        } catch (e) {
          console.error({ innerHTML: textarea.innerHTML });
          throw e;
        }
      });
      this.optimalData.addEventListener((current) => {
        this.optimalWeights.setValue(current.weights);
        this.optimalError.setValue(current.error);
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

function EventEmitter(parent) {
  if (parent) {
    const parentHandler = parent;
    const keys = Object.keys(parentHandler);
    this.name = '';
    for (let i = 0; i < keys; i += 1) {
      if (parentHandler[keys[i]] === this) {
        this.name = keys[i];
        break;
      }
    }
  }
  let value = null;
  const listeners = [];
  this.getValue = () => value;
  this.setValue = (val) => {
    let curr = Number.parseFloat(val);
    if (Number.isNaN(curr) || Array.isArray(val)) curr = val;
    if (curr === value) return this;
    listeners.forEach((fn) => {
      fn(curr, value);
    });
    value = curr;
    return this;
  };
  this.addEventListener = (listener) => {
    listeners.push(listener);
  };
}
