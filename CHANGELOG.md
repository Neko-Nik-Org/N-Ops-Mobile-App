# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). It has no tagged releases yet.

## [Unreleased]

### Added

- Landscape on every screen (including iPhone) and a layout for tablets: a centered column in
  portrait, full width in landscape, and a permanent side drawer from 900 px wide.
- Drawer navigation replacing the bottom tabs, with every Admin UI menu entry except Super admin.
  Pages that aren't built yet show a placeholder.
- A top bar on every screen with the menu button, page title, tag picker and notifications.
- Tag picker that scopes the whole app to one tag (or all tags); the choice is remembered.
- PIN lock: create a 6-digit PIN after linking (easy PINs like 000000, 123456, 112233 are refused), unlock with it on every start and after a minute in the background (Face ID / fingerprint first). 3 wrong PINs wait 5 minutes; 9 wrong in total unlink the phone. "Forgot PIN?" unlinks and starts the link flow again.
- Profile: Change PIN (asks for the current PIN first) and an Auto-lock setting (immediately, 1, 5 or 15 min). The app switcher shows a plain cover instead of the dashboard.
- Biometric unlock is bound to the faces/fingers on the phone: adding one turns it off until the PIN is entered, and turning it on in Profile asks for the PIN first.
- Loading kit: spinner, progress bar, skeleton, banner, and a loading state on the main button.
- Native splash (react-native-bootsplash): a plain frame, #FAF9F6 or #0B1118 by the OS theme, kept until the app is ready. Android 12+ uses a transparent system splash icon.
- Open-source project files: GPL-3.0 license headers, contributing guide, security policy, code of
  conduct, issue and pull request templates, and CI.

### Changed

- The workspace switcher moved from Home into the drawer.
- Welcome and Scan use a split layout on short landscape screens.
