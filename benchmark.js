import { performance } from 'perf_hooks';
import { YouTubePlayables } from './src/YouTubePlayables.js';

const iterations = 100000;
const testString = "This is a test string without surrogates. " + "\uD800\uDC00".repeat(100) + " Lone: \uD801";

const start = performance.now();
for (let i = 0; i < iterations; i++) {
    YouTubePlayables.hasLoneSurrogates(testString);
}
const end = performance.now();
console.log(`Baseline time: ${end - start} ms`);
