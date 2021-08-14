# euphony

*Euphony* is a lightweight audio playback and visualization library for Javscript with zero dependencies and full Typescript support

Despite being designed with audio visulization in mind it can just as well be used for simple audio playback. The library allows for easy loading, playing, pausing, synchronization, visualization and more of audio files

For more thorough documentation see: TODO: ADD LINK

*If you are a developer looking to work on euphony itself or otherwise need to see implementation details see: TODO: ADD LINK*

## Set Up

To install via npm use
```bash
npm install @ninefour/euphony
```
Then in your node.js file import as needed
```js
import { Playback, Group } from '@ninefour/euphony';
```

## Usage

***Note**: Almost all browsers require user interaction (usually a click) before allowing audio playback. For clarity and brevity these examples work assuming said user interaction has already happened*

### Basic Playback

Load a local audio file and play it back
```js
const audio = new Source();
audio.load('/path/to/audio.mp3').then(audio.play());
```
Or load an external audio file
```js
audio.load('http://yoursite.com/path/to/audio.mp3');
```

If you have multiple audio sources that need to be downmixed you can make use of euphony's groups
```js
const melody = new Source();
const percussion = new Source();
const song = new Group({ sources: [melody, percussion] });

Promise.all([
	melody.load('/path/to/melody.mp3'),
	percussion.load('/path/to/percussion.mp3')
]).then(song.play());
```
You can even create sub-groups
```js
// melody
const melody = new Source();
// percussion group
const kick = new Source();
const hat = new Source();
const snare = new Source();
const percussion = new Group({ sources: [kick, hat, snare] })

// put it all together
const song = new Group({ sources: [melody, percussion] });
```
Options for configuring your Playbacks can be given in the constructor, set afterwards individually, or all at once in a group
```js
// set in constructor
const melody = new Source({ volume: 0.8, loop: true })
// set individually
const percussion = new Source();
percussion.volume = 0.5;
percussion.loop = true;

// set all at once with a group
const song = new Group({ sources: [melody, percussion] })
song.setAll("loop", false);
```
### Visualization

All Playbacks and Groups come with an attached Analyser that allows for easy computation and retrival of frequency and or waveform data. To save on computational resources analysis data is only computed when specifically called. Further, the analysis is split between computing frequency and waveform data seperately with `updateFrequency()` and `updateWaveform()` respectively

For conveniece the frequency or waveform data can be updated for all members of a group by calling `updateFrequencyAll()` or `updateWaveformAll()`

The data available on `updateFrequency()` is as follows:

- ***Frequency***:  Array of normalized frequency data where each member of the array is a number between 0.0 and 1.0 representing the amplitude of the frequency at a given frequency band starting from 0 hz
- ***Ampltiude***: The mean normalized frequency data representing the overall amplitude of the audio
- ***Signal***: A boolean signal that is true when the amplitude is over a given threshold

The data available on `updateWaveform()` is as follows:

- ***Waveform***: TODO: FIGURE OUT WAVEFORM

### Example Visualization Set Up

A basic example template of how one might go about setting up *euphony* to playback audio and retrieve audio analysis data to use in an animation
```js
// initialize audio
const melody = new Playback({ loop: true });
const percussion = new Playback({ loop: true });
const song = new Group({ sources: [melody, percussion] });
Promise.all([
	melody.load('/path/to/melody.mp3'),
	percussion.load('/path/to/percussion.mp3')
]).then(song.play());

// set up render loop
const render = () => {
	// update frequency data (can be individual or as a group)
	melody.analyser.updateFrequency();
	percussion.analyser.updateFrequency();
	song.analyser.updateFrequency();
	// or waveform data (can be individual or as a group)
	song.analyser.updateWaveformAll();
	
	// access data to use in animations...
	console.log(song.analyser.freqeuncy);
	console.log(melody.analyser.signal);
	console.log(percussion.analyser.waveform);
	// ...
}
requestAnimationFrame(render);
```

## Example Projects

For some more real world examples of *euphony* in action check out these codesandboxes:

- TODO: ADD LINKS