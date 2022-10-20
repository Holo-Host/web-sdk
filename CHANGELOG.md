# Changelog

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.8-prerelease] - 2022-10-20

### Changed
- Updates api to new js client pattern [(#79)]
  - WebSdk implements the AppAgentClient interface
  - Zome call now unwraps succesful results and throws errors
  - See changes to README for full details of api changes
- Switched to typescript [(#78)]
- Bumped webpack version [(#78)]
- switched to yarn [(#78)]

[(#79)]: https://github.com/Holo-Host/web-sdk/pull/79
[(#78)]: https://github.com/Holo-Host/web-sdk/pull/78

## [0.6.7-prerelease] - 2022-08-17

### Fixed
- COMB undefined error

## [0.6.6-prerelease] - 2022-06-03

### Changed
- updated `comb` to v0.3.0

## [0.6.5-prerelease] - 2022-05-30

### Removed
- `isPubPortal`, `publisherName` and `infoLink` auth options

### Changed
- Renamed `skipRegistration` option to `requireRegistrationCode`

## [0.6.4-prerelease] - 2022-03-28
No change

## [0.6.3-prerelease] - 2022-03-28
### Fixed
- Race condition between client state and content of events

### Changed
- Updated api to reflect changes in chaperone. Emits single `agent-state` event when: switching to a new agent, availability changes, or on unrecoverable agent state. This replaces previous events `available`, `unavailable`, `unrecoverable-agent-state`
- Uses `should_show_form` field of `agent_state` to update form state
- No longer awaits agent state before returning from `signIn/Up/Out`

### Removed
- `.ready` method

### Added
- `isPubPortal` auth option

## [0.6.2-prerelease] - 2022-03-22

### Fixed
- Import issue, `main` and `module` values updated

## [0.6.1-prerelease] - 2022-03-22

### Added
`webSdkApi` instances now have `isAvailable`, `agentInfo` and `happId` fields that are updated as chaperone state changes [(#61)](https://github.com/Holo-Host/web-sdk/pull/61)

### Fixed
- No longer throws an error if `available` event is received before `.ready` is called.

### Changed
- renamed `registrationServer` to `membraneProofServer`, in constructor and `registration_server` to `membrane_proof_server` in connection to chaperone.

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
