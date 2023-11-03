# 1.0.0

Breaking changes:

- Renamed the global namespace from SimpleSerial to SimpleWebSerial
- Renamed every occurrence of SimpleSerial to SimpleWebSerial, simple-serial to simple-web-serial etc.
- Renamed most methods, most importantly `connect` has been renamed to `setupSerialConnection`
- the `requestAccessOnPageLoad` property is now `false` by default. Set it to true if you want the library to show you the modal: `setupSerialConnect({ requestAcccessOnPageLoad: true })`

Other changes:
- Reworked the inner workings of the library, more methods are exposed now which allows better control in the hands of experienced developers
- Improved examples
- Added linting
