const freqToIndex = require('audio-frequency-to-index');
const clamp = require('clamp');

let _audioBars = [];
let _audioEnergy = 0;

// based on https://github.com/hvianna/audioMotion-analyzer/blob/master/src/audioMotion-analyzer.js

/**
 * Creates a list of objects distributing frequency bins according to the equal-tempered scale.
 * groupLevel 				- 1 to 8, where 1 = 1/24 octave and 8 = full octave
 * sampleRate 				- audioContext.sampleRate
 * frequencyBinCount 	- analyser.frequencyBinCount
 * minFreq 						- skip frequencies lower than (Hz)
 * maxFreq 						- skip frequencies higher than (Hz)
 */
const createAudioBars = ({
	groupLevel 				= 5,
	sampleRate 				= 44100,
	frequencyBinCount = 1024,
	minFreq 					= 20,
	maxFreq 					= 22000,
} = {}) => {
	const root24 = 2 ** (1 / 24);
	const c0 = 440 * root24 ** -114; // ~16.35 Hz	
	const temperedScale = [];

	let freq, bin, bar, minLog, logWidth, group;
	let i = 0;

	// group levels = 24 / n
	// 1: 	1/24 octave
	// 2: 	1/12 octave
	// 3: 	1/8  octave
	// 4: 	1/6  octave
	// 5: 	1/4  octave
	// 6: 	1/3  octave
	// 7: 	1/2  octave
	// 8: 	1    octave
	group = clamp(groupLevel, 1, 8);
	if (group == 5) group = 6;
	else if (group == 6) group = 8;
	else if (group == 7) group = 12;
	else if (group == 8) group = 24;

	// equal tempered scale
	while ((freq = c0 * root24 ** i) <= maxFreq ) {
		if (freq >= minFreq && i % group == 0) temperedScale.push(freq);
		i++;
	}

	minLog = Math.log10(temperedScale[0]);
	logWidth = 1.0 / (Math.log10(temperedScale[temperedScale.length - 1]) - minLog);

	let prevBin = 0;
	let prevIdx = -1;
	let nBars = 0;
	let idx, nextBin;

	_audioBars = [];

	temperedScale.forEach((freq, index) => {
		bin = freqToIndex(freq, sampleRate, frequencyBinCount);
		idx = (prevBin > 0 && prevBin + 1 <= bin) ? prevBin + 1 : bin;

		// same bin used by multiple bars
		if (idx == prevIdx) nBars++;
		else {
			// set interpolation factor on previous bars using the same bin
			if (nBars > 1) {
				for (let i = 0; i < nBars; i++) {
					_audioBars[_audioBars.length - nBars + i].factor = (i + 1) / nBars;
				}
			}
			prevIdx = idx;
			nBars = 1;
		}

		prevBin = nextBin = bin;

		// use half the bins between this and next band
		if (temperedScale[index + 1] !== undefined) {
			nextBin = freqToIndex(temperedScale[index + 1], sampleRate, frequencyBinCount);
			if (nextBin - bin > 1) prevBin += Math.round((nextBin - bin) * 0.5);
		}

		// bar object
		// iniBin: 	initial bin of analyser frequency data
		// endBin: 	end bin of analyser frequency data
		// factor: 	interpolation factor, in case of multiple bars sharing the same bin
		// value: 	calculated on update, max reading between iniBin and endBin 
		bar = {
			iniBin: idx,
			endBin: prevBin - idx > 0 ? prevBin : idx,
			factor: 1,
			value: 	0,
		};

		_audioBars.push(bar);
	});

	return _audioBars;
};

/**
 * Updates bars according to the given audio frequency data.
 * audioData - Uint8Array passed to analyser.getByteFrequencyData
 */
const updateAudioBars = (audioData) => {
	let prevValue;
	let value = 0;
	let energy = 0;

	_audioBars.forEach((bar, i) => {
		value = 0;

		// bin shared by multiple bars
		if (bar.iniBin == bar.endBin) {
			prevValue = bar.iniBin ? audioData[bar.iniBin - 1] : audioData[bar.iniBin];
			value = prevValue + (audioData[bar.iniBin] - prevValue) * bar.factor;
		}
		// bar using multiple bins
		else {
			// get highest value in range
			for (let j = bar.iniBin; j <= bar.endBin; j++) {
				value = Math.max(value, audioData[j]);
			}
		}

		bar.value = value / 255;
		energy += bar.value;
	});

	// average energy
	_audioEnergy = energy / _audioBars.length;
};

const getAudioBars = () => {
	return _audioBars;
};

const getAudioEnergy = () => {
	return _audioEnergy;
};

module.exports = {
	createAudioBars,
	updateAudioBars,
	getAudioBars,
	getAudioEnergy,
};
