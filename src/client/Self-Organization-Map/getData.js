export default async function getData(inputSize) {
  const datas = [];
  const response = await fetch('EURUSD5.csv');
  const text = await response.text();
  const textLines = text.split('\n');
  const ohlcList = [];
  textLines.forEach((textLine) => {
    ohlcList.push(new OHLC(textLine));
  });
  let min = Number.MAX_VALUE;
  let max = Number.MIN_VALUE;
  for (let i = inputSize + 1; i < ohlcList.length; i += 1) {
    const data = [];
    const prevOHLC = ohlcList[i - inputSize];
    for (let j = inputSize - 1; j >= 0; j -= 1) {
      const { close } = ohlcList[i - j];
      const phase = Math.tan((close / prevOHLC.close) / (i - j));
      data.push(phase);
      if (datas.length < 10000) {
        if (phase > max) max = phase;
        if (phase < min) min = phase;
      }
    }
    datas.push(data);
  }
  const h = max - min;
  const result = datas.map(data => data.map(x => (max - x) / h)).slice(0, 10000);
  return result;
}

function OHLC(textLine) {
  const params = textLine.split(',');
  this.open = Number.parseFloat(params[2]);
  this.high = Number.parseFloat(params[3]);
  this.low = Number.parseFloat(params[4]);
  this.close = Number.parseFloat(params[5]);
}
