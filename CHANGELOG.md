# Changelog
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.5.2] - 2021-09-24

### Added

- Added option for `registration_server` [(#50)](https://github.com/Holo-Host/web-sdk/pull/50)

## [0.5.1] - 2021-07-06

### Added
- Option to allow `signIn`/`signUp` to be cancelled and remain anonymous (on by default) [(#39)](https://github.com/Holo-Host/web-sdk/pull/39)

## [0.5.0] - 2021-03-15
### Added
- `holoInfo` method to get host url from `chaperone` [(#34)][]

[(#34)]: https://github.com/Holo-Host/web-sdk/pull/34

## [0.4.0] - 2021-03-02
### Added
- added signals.
- added branding field to configuring the branding shown on the log in/sign-up screen

## [0.3.1] - 2021-02-04
### Fixed
- Bump COMB version.

## [0.3.0] - 2021-02-04
### Added
- `signalCb` arg to constructor, that is passed to `COMB`.

## [0.2.2] - 2021-01-11
### Fixed
- `.ready` now throws any errors thrown by `.connect` and `COMB.connect`
