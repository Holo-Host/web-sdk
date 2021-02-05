# Changelog
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Changed
- `.zomeCall`, `.appInfo`, `.signUp`, `.signIn`, and `.signOut` all now expect to receive a [data-translator](https://www.npmjs.com/package/@holo-host/data-translator) packed message, and unpack it and return the payload or throw the error.

## [0.3.1] - 2021-02-04
### Fixed
- Bump COMB version.

## [0.3.0] - 2021-02-04
### Added
- `signalCb` arg to constructor, that is passed to `COMB`.

## [0.2.2] - 2021-01-11
### Fixed
- `.ready` now throws any errors thrown by `.connect` and `COMB.connect`
