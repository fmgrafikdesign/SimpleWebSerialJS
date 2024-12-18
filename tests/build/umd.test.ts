import { test, expect } from 'vitest';
// @ts-expect-error There seem to be issues with @types/jsdom, so I'm opting not to install them and instead suppress the error
import { JSDOM } from 'jsdom';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';

test('UMD: Library and its functions are available after loading it via script tag', async () => {
    const dom = new JSDOM('<!DOCTYPE html><body></body>', {
        runScripts: 'dangerously', // Allows executing scripts
        resources: 'usable', // Loads external resources
    });

    const { window } = dom;

    expect(window.SimpleWebSerial).not.toBeDefined();

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const scriptPath = resolve(__dirname, '../../dist/simple-web-serial.min.js');

    // Read and execute the script in the JSDOM environment
    const scriptContent = readFileSync(scriptPath, 'utf-8');
    const scriptEl = window.document.createElement('script');
    scriptEl.textContent = scriptContent;
    window.eval(scriptContent);

    // Directly check if the library is available on the window object
    expect(window.SimpleWebSerial).toBeDefined();
    expect(window.SimpleWebSerial.setupSerialConnection).toBeDefined();
});