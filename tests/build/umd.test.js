import { test, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

test('UMD: Library and its functions are available after loading it via script tag', async () => {
    const dom = new JSDOM('<!DOCTYPE html><body></body>', {
        runScripts: 'dangerously', // Allows executing scripts
        resources: 'usable', // Loads external resources
    });

    // Access the window object from JSDOM
    const { window } = dom;

    expect(window.SimpleWebSerial).not.toBeDefined();

    const scriptPath = path.resolve(__dirname, '../../dist/simple-web-serial.min.js');

    console.log('script path:', scriptPath);
    // Read and execute the script in the JSDOM environment
    const scriptContent = fs.readFileSync(scriptPath, 'utf-8');
    const scriptEl = window.document.createElement('script');
    scriptEl.textContent = scriptContent;
    // Evaluate scriptContent in the context of the window
    window.eval(scriptContent);

    // Directly check if the library is available on the window object
    expect(window.SimpleWebSerial).toBeDefined();
    expect(window.SimpleWebSerial.setupSerialConnection).toBeDefined();
});