audio-frequency-tempered
========================

Distributes the data returned from [AnalyserNode.getByteFrequencyData()](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode) according to a logarithmic scale. Low frequency bins are shared by multiple bars, while high frequency ones are bundled together.

The technique comes from Henrique Vianna's [audioMotion-analyzer](https://github.com/hvianna/audioMotion-analyzer).

## Install
```
npm install audio-frequency-tempered
```

## Example
```js
const { createAudioBars, updateAudioBars } = require('audio-frequency-tempered');

// create audio context, analyser, data array
// omitted: source, gain, connect, etc.
const audioCtx = new AudioContext();
const analyser = audioCtx.createAnalyser();
const audioData = new Uint8Array(analyser.frequencyBinCount);

// create audio bars
const audioBars = createAudioBars({ groupLevel: 8 });

// on update
analyser.getByteFrequencyData(audioData);
updateAudioBars(audioData);

audioBars.forEach(bar => console.log(bar));
```
Output:

```js
{ value: 0.6078, factor: 1, iniBin: 6, endBin: 9 }
{ value: 0.8196, factor: 1, iniBin: 10, endBin: 18 }
{ value: 0.8980, factor: 1, iniBin: 19, endBin: 37 }
{ value: 0.7254, factor: 1, iniBin: 38, endBin: 73 }
{ value: 0.5215, factor: 1, iniBin: 74, endBin: 146 }
{ value: 0.4352, factor: 1, iniBin: 147, endBin: 292 }
{ value: 0.4627, factor: 1, iniBin: 293, endBin: 584 }
{ value: 0.4313, factor: 1, iniBin: 585, endBin: 1167 }
{ value: 0.3411, factor: 1, iniBin: 1168, endBin: 2333 }
{ value: 0.0000, factor: 1, iniBin: 2334, endBin: 3110 }
```


## Demo

[![demo](https://user-images.githubusercontent.com/880280/104137034-d2fb9b00-5391-11eb-90e6-3ad94b1808c4.png)](https://brunoimbrizi.github.io/audio-frequency-tempered/demo/)

[audio-frequency-tempered demo](https://brunoimbrizi.github.io/audio-frequency-tempered/demo/)

## Usage

### `createAudioBars(options)`

- `options`
  - `groupLevel` (default `5`) 1 to 8, where 1 = 1/24 octave and 8 = full octave
  - `sampleRate` (default `44100`) audioContext.sampleRate
  - `frequencyBinCount` (default `1024`) analyser.frequencyBinCount
  - `minFreq` (default `20`) minimum frequency (Hz)
  - `maxFreq` (default `22000`) maximum frequency (Hz)

**Returns** an array of 'bar' objects `{ iniBin, endBin, factor, value }`

- `iniBin` - initial bin of the analyser frequency data
- `endBin` - end bin of the analyser frequency data
- `factor` - interpolation factor - when multiple bars share the same bin
- `value` - normalised maximum energy value of the frequencies between `iniBin` and `endBin`


### `updateAudioBars(audioData)`

- `audioData` Uint8Array passed to analyser.getByteFrequencyData

**Returns** null


### `getAudioBars()`

**Returns** the previously created array of audio bars.


### `getAudioEnergy()`

**Returns** the average audio energy (sum of bar values / number of bars).


## See Also

- [audioMotion-analyzer](https://github.com/hvianna/audioMotion-analyzer)
- [Creating a frequency bar graph](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API#creating_a_frequency_bar_graph)

## License

MIT, see [LICENSE](LICENSE) for details.
