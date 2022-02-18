# Changelog

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- No longer throws an error if `available` event is received before `.ready` is called.

## [0.6.0-prerelease] - 2022-02-11
### Removed
- Removes `signalCB` param (is replaced with `signal` event)

### Added

- Added option for `anonymous_allowed` among the customized authentication options

- Adds `unrecoverable-agent-state` and `signal` to alert types

- Adds `cellData` and `stateDump` calls

### Updated
- Replaces `connected` and `disconnected` with `available` and `unavailable`

- Updates ready fn to return after `available` event is received, instead of immediately following the ws connection

- Updates return value for auth calls (signIn/signUp/signOut)

- Updates the `connect` method to be static and take the `chaperoneUrl` and `authFormCustomization` params (previously passed directly into the class constructor)

- Updates the class constructor params to take the `child` process created by Postmate once connected to Chaperone


## [0.5.3] - 2021-10-10

### Added

- Added option for `skip_registration` [(#51)](https://github.com/Holo-Host/web-sdk/pull/51)

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
