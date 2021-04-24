/* eslint-disable no-use-before-define */


export default async function getData(inputSize) {
  inputSize = 96;
  const DATA_SIZE = 10000;
  const dataContainer = new DataContainer(4);

  const ohlcList = await getOHLCList(DATA_SIZE);

  async function getOHLCList(dataSize) {
    const response = await fetch('EURUSD5.csv');
    const text = await response.text();
    const textLines = text.split('\n');
    const list = [];
    for (let i = 0; i < dataSize; i += 1) {
      list.push(new OHLC(textLines[i]));
    }
    return list;
  }

  normalizeOHLC();

  function normalizeOHLC() {
    let min = Number.MAX_VALUE;
    let max = Number.MIN_VALUE;
    ohlcList.forEach((ohlc) => {
      if (dataContainer.length < DATA_SIZE) {
        if (ohlc.high > max) max = ohlc.high;
        if (ohlc.low < min) min = ohlc.low;
      }
    });

    const h = max - min;
    ohlcList.forEach((data) => {
      data.open = (data.open - min) / h;
      data.high = (data.high - min) / h;
      data.low = (data.low - min) / h;
      data.close = (data.close - min) / h;
    });
  }

  const updateProgressFunc = createProgressDOM();

  function createProgressDOM() {
    const containerNode = document.createElement('div');
    containerNode.className = 'progress-container';

    const progressNode = document.createElement('progress');
    progressNode.max = 100;
    progressNode.value = 0;

    const percentNode = document.createElement('div');
    percentNode.className = 'percent-progress-value';
    percentNode.innerHTML = '0%';

    containerNode.append(progressNode, percentNode);
    document.body.append(containerNode);

    function updatePercent(percentValue) {
      progressNode.value = percentValue;
      percentNode.innerHTML = `${percentValue}%`;
    }

    updatePercent.containerNode = containerNode;
    return updatePercent;
  }

  const maxSizePow = Math.min(2, Math.log2(DATA_SIZE / inputSize / 2));

  const loops = getLoopSize();

  function getLoopSize() {
    let loopSize = 0;
    for (let i = 0; i < maxSizePow; i += 1) {
      loopSize += ohlcList.length - (inputSize * (2 ** i));
    }
    return loopSize;
  }

  const gen = progressGenerator();

  function* progressGenerator() {
    let loopIndex = 0;
    for (let sizePow = 0; sizePow < maxSizePow; sizePow += 1) {
      const currentInputSize = inputSize * (2 ** sizePow);
      for (let i = currentInputSize; i < ohlcList.length; i += 1) {
        loopIndex += 1;
        const ohlcArray = new OHLCArray();
        const resultProgress = (loopIndex / loops) * 100;
        updateProgressFunc(Math.floor(resultProgress));
        for (let j = inputSize - 1; j >= 0; j -= 1) {
          // requestAnimationFrame(() => {

          const ohlc = ohlcList[i - j];
          ohlcArray.push(ohlc);
        }
        ohlcArray.calculate();
        dataContainer.push(ohlcArray);
        yield resultProgress;
      }
    }
  }

  await progressAnimation();

  async function progressAnimation() {
    const promise = new Promise((resolve) => {
      const interval = setInterval(() => {
        const next = gen.next();
        if (next.done) {
          updateProgressFunc.containerNode.remove();
          clearInterval(interval);
          resolve();
        }
      }, 0);
    });
    return promise;
  }


  dataContainer.normalize();
  return dataContainer.getOutput();
}

/**
 * @type {Array<OHLCArray>}
 */
class DataContainer extends Array {
  constructor(ohlcArrayOutputSize = 4) {
    super();
    this.ohlcArrayOutputSize = ohlcArrayOutputSize;
    this.minMaxes = [];
    for (let i = 0; i < ohlcArrayOutputSize; i += 1) {
      this.minMaxes.push(new MinMax(i));
    }
  }

  push(ohlcArray) {
    for (let i = 0; i < this.minMaxes.length; i += 1) {
      this.minMaxes[i].updateMinMax(ohlcArray.output);
    }
    super.push(ohlcArray);
  }

  normalize() {
    for (let i = 0; i < this.ohlcArrayOutputSize; i += 1) {
      const minMax = this.minMaxes[i];
      const min = minMax.getMin();
      const height = minMax.getHeight();
      for (let ohlcArrayId = 0; ohlcArrayId < this.length; ohlcArrayId += 1) {
        const ohlcArray = this[ohlcArrayId];
        const value = ohlcArray.output[i];
        try {
          ohlcArray.output[i] = (value - min) / height;
          if (!Number.isFinite(ohlcArray.output[i])) throw new Error(`Value is not finite: output[${i}] = ${ohlcArray.output[i]}`);
        } catch (e) {
          console.error({ value, min, height });
          console.error({ ohlcArray });
          throw e;
        }
      }
    }
  }

  getOutput() {
    return this.map(ohlcArray => ohlcArray.output);
  }
}

function MinMax(ohlcArrayOutputValueId) {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  const getValue = createValueGetterFunction(ohlcArrayOutputValueId);
  this.updateMinMax = (ohlcDataOutput) => {
    const value = getValue(ohlcDataOutput);
    if (min > value) {
      min = value;
    }
    if (max < value) {
      max = value;
    }
  };
  this.getMin = () => min;
  this.getMax = () => max;
  this.getHeight = () => max - min;
}

function createValueGetterFunction(ohlcArrayOutputValueId) {
  return ohlcArrayOutput => ohlcArrayOutput[ohlcArrayOutputValueId];
}

/**
 * @extends {Array<OHLC>}
 */
class OHLCArray extends Array {
  /**
     *
     * @param {OHLC[]} ohlcList
     */
  constructor() {
    super();
    this.min = null;
    this.max = null;
    this.output = null;
    this.calculate = () => {
      const last = this.getLast();
      const minIndex = this.indexOf(this.min);
      const maxIndex = this.indexOf(this.max);
      const minDistance = 0.00001 * (this.length - minIndex) / this.length;
      const maxDistance = 0.00001 * (this.length - maxIndex) / this.length;
      const height = this.max.high - this.min.low;
      let minMaxAngle = Math.tan((maxIndex > minIndex ? this.max.high - this.min.low : this.min.low - this.max.high))
        / (Math.abs((maxIndex - minIndex)) / this.length * Math.PI / 2);
      if (!Number.isFinite(minMaxAngle)) {
        minMaxAngle = 0;
      }
      this.output = [
        Math.tan(((this.max.high - last.close) / maxDistance) * Math.PI / 2),
        Math.tan(((last.close - this.min.low) / minDistance) * Math.PI / 2),
        height,
        minMaxAngle,
      ];
      return this;
    };
  }

  push(ohlc) {
    const copy = Object.assign({}, ohlc);
    super.push(copy);
    if (!this.min || (this.min.low > ohlc.low)) this.min = copy;
    if (!this.max || (this.max.high < ohlc.high)) this.max = copy;
  }

  getFirst() {
    return this[0];
  }

  getLast() {
    return this[this.length - 1];
  }
}

function OHLC(textLine) {
  const params = textLine.split(',');
  this.open = Number.parseFloat(params[2]);
  this.high = Number.parseFloat(params[3]);
  this.low = Number.parseFloat(params[4]);
  this.close = Number.parseFloat(params[5]);
}
