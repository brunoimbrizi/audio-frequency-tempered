const { createAudioBars, updateAudioBars } = require('../index.js');
const Tweakpane = require('tweakpane');

// local vars
let audio, audioCtx, audioData, audioBars, analyser;
let canvas, ctx;

const setup = () => {
	// init canvas
	canvas = document.querySelector('canvas');
	canvas.width = 960;
	canvas.height = 480;
	
	ctx = canvas.getContext('2d');
	
	// init play/pause button
	const btn = document.querySelector('button');
	btn.addEventListener('click', () => {
		audioCtx.resume();
		if (audio.paused) audio.play();
		else audio.pause();

		audioBars.forEach(bar => console.log(bar));
	});

	// init audio
	audio = document.querySelector('audio');
	// https://freesound.org/people/mvrasseli/sounds/553495/
	audio.src = 'assets/553495.mp3';
	audio.loop = true;

	const AudioContext = window.AudioContext || window.webkitAudioContext;
	audioCtx = new AudioContext();

	const source = audioCtx.createMediaElementSource(audio);

	analyser = audioCtx.createAnalyser();
	analyser.fftSize = 8192;
	analyser.smoothingTimeConstant = 0.5;

	audioData = new Uint8Array(analyser.frequencyBinCount);

	source.connect(analyser);
	analyser.connect(audioCtx.destination);

	// init tempered scale
	const { sampleRate } = audioCtx;
	const { frequencyBinCount } = analyser;
	audioBars = createAudioBars({ sampleRate, frequencyBinCount });

	// init parameters panel
	createPane();

	// init labels
	drawLabels();
};

const animate = () => {
	requestAnimationFrame(animate);

	analyser.getByteFrequencyData(audioData);
	updateAudioBars(audioData);
	drawBars();
};

const drawBars = () => {
	let { width, height } = canvas;
	let x, y, w, h;

	height -= 20;

	ctx.fillStyle = '#eee';
	ctx.fillRect(0, 0, width, height);
	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, width, 1);
	ctx.fillRect(0, height - 1, width, 1);

	w = Math.round(width / audioBars.length) - 1;

	audioBars.forEach((bar, i) => {
		h = bar.value * height;
		x = i * (w + 1);
		y = height - h;
		ctx.fillRect(x, y, w, h);
	});
};

const drawLabels = (opt = {}) => {
	const { width, height } = canvas;
	const { minFreq = 20, maxFreq = 22000 } = opt;

	ctx.fillStyle = '#eee';
	ctx.fillRect(0, height - 20, width, 20);

	ctx.fillStyle = 'black';
	ctx.font = '12px sans-serif';
	ctx.textAlign = 'left';
	ctx.fillText(`${minFreq} Hz`, 0, height);
	ctx.textAlign = 'right';
	ctx.fillText(`${maxFreq} Hz`, width, height);
};

// parameters panel
const createPane = () => {
	let folder;
	const pane = new Tweakpane();

	const levels = {
		'1 (1/24 octave)' : '1',
		'2 (1/12 octave)' : '2',
		'3 (1/8 octave)' 	: '3',
		'4 (1/6 octave)' 	: '4',
		'5 (1/4 octave)' 	: '5',
		'6 (1/3 octave)' 	: '6',
		'7 (1/2 octave)' 	: '7',
		'8 (1 octave)' 		: '8',
	};

	const params = {
		groupLevel: 5,
		minFreq: 20,
		maxFreq: 22000,
	};

	const onChange = () => {
		const { sampleRate } = audioCtx;
		const { frequencyBinCount } = analyser;
		const { groupLevel, minFreq, maxFreq } = params;

		audioBars = createAudioBars({ sampleRate, frequencyBinCount, groupLevel, minFreq, maxFreq });

		drawLabels(params);
	};

	folder = pane.addFolder({ title: 'Parameters' });
  folder.addInput(params, 'groupLevel', { options: levels }).on('change', onChange);
  folder.addInput(params, 'minFreq', { min: 0, max: 440, step: 1 }).on('change', onChange);
  folder.addInput(params, 'maxFreq', { min: 880, max: 22000, step: 1 }).on('change', onChange);
};

setup();
animate();
