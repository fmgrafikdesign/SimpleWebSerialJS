# 1.4.1

- fix: Add web serial api types to dependencies
- fix: Make SerialConnection readable + writable types more generic

# 1.4.0

- feat: Add other library types as type exports so users can explicitly type their code
- feat: Add possibility to use custom delimiters for line break transformer
- feat: Log erroneous data in readLoop if logIncomingSerialData option is set
- dev: Rename and refactor parseAsNumber functionality to parseNumbersRecursively
- dev: Add unit tests for line break transformer class

# 1.3.1

- fix: Add examples folder back to distributed files

# 1.3.0

- feat: Rewrite library in Typescript
- feat: Add declaration file generation to build process
- chore: Delete unused folder

# 1.2.0

- Switch to rslib for bundling the library
- Change the dist path for cjs to `dist/index.cjs.js`
- Change the dist path for ESM to `dist/esm.mjs`
- Update package.json to reflect the changed dist paths for cjs and esm accordingly
- Add unit and build tests
- Add husky for pre-commit hooks as a first step to something like CI / QA
- Change linting rules a bit and apply auto-fixes

# 1.0.1 + 1.1.0 + 1.1.1

- I forgot doing a changelog for this and can't remember, I'm sorry. :(

# 1.0.0

Breaking changes:

- Renamed the global namespace from SimpleSerial to SimpleWebSerial
- Renamed every occurrence of SimpleSerial to SimpleWebSerial, simple-serial to simple-web-serial etc.
- Renamed most methods, most importantly `connect` has been renamed to `setupSerialConnection`
- Renamed the `requestButton` constructor property to `requestElement`.
- the `requestAccessOnPageLoad` property is now `false` by default. Set it to true if you want the library to show you the modal: `setupSerialConnect({ requestAcccessOnPageLoad: true })`

Other changes:
- Reworked the inner workings of the library, more methods are exposed now which allows better control in the hands of experienced developers
- Improved examples
- Added linting
