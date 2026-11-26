# N-Ops Mobile App

**Mobile app (iOS and Android, phone and tablet) for [N-Ops](https://nops.app), the open-source infrastructure control plane by Neko Nik, in partnership with YSPL.**

> One platform. Complete infrastructure control.

- Mobile app repository: https://github.com/Neko-Nik-Org/N-Ops-Mobile-App
- Backend (Main API): https://github.com/Neko-Nik-Org/N-Ops-Main-API
- Web admin console: https://github.com/Neko-Nik-Org/N-Ops-Admin-UI

## Project status

The app follows the [Main API](https://github.com/Neko-Nik-Org/N-Ops-Main-API) and mirrors the
[Admin UI](https://github.com/Neko-Nik-Org/N-Ops-Admin-UI) menu. Some parts are wired to the
backend, and others are placeholders for planned features.

| Area                                                                  | Status                                                |
| --------------------------------------------------------------------- | ----------------------------------------------------- |
| Link this phone (QR code or typed code, session renewal, unlink)      | ✅ Live (`/auth/device/*`, `/auth/verify`)            |
| Tag list and tag scoping                                              | 🚧 List is live (`/tag/list`); data isn't filtered yet |
| Overview, Servers, Approvals, Alerts                                  | 🚧 Layout ready, waiting on backend endpoints         |
| Vault, Tools, Metrics, Workflows, Service management/logs, Admin pages | 📋 Planned (menu entries show a placeholder)          |

## Features

- Drawer navigation with the Admin UI menu (a permanent side panel on wide tablets)
- Portrait and landscape on phones and tablets
- Tag picker that scopes the whole app
- Linking by scanning a QR code from the Admin UI, with biometric unlock for approvals
- Light, dark, and system themes
- Session tokens kept in the device Keychain/Keystore and sent in the `x-nops-token` header

## Tech stack

React Native 0.88 · React 19 · TypeScript · React Navigation (native stack, drawer) ·
Reanimated · Vision Camera · Jest

## Quick start

Requirements: Node.js 22.11+, npm, and the
[React Native environment](https://reactnative.dev/docs/set-up-your-environment) for your platform.
You also need a running [N-Ops Main API](https://github.com/Neko-Nik-Org/N-Ops-Main-API) to link to.

```bash
git clone https://github.com/Neko-Nik-Org/N-Ops-Mobile-App.git
cd N-Ops-Mobile-App
npm install
cd ios && bundle install && bundle exec pod install && cd ..   # iOS only
npm start          # Metro
npm run ios        # or: npm run android
```

| Script              | What it does               |
| ------------------- | -------------------------- |
| `npm start`         | Start Metro                |
| `npm run ios`       | Build and run on iOS       |
| `npm run android`   | Build and run on Android   |
| `npm run lint`      | ESLint                     |
| `npm run typecheck` | Type-check                 |
| `npm test`          | Jest                       |

To link a phone, open **Account › Devices** in the Admin UI and scan the QR code (or type the user
ID and one-time code).

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) and the
[Code of Conduct](CODE_OF_CONDUCT.md). Report security issues privately, as described in
[SECURITY.md](SECURITY.md).

## License

[GNU General Public License v3.0](LICENSE). Every source file carries the license header.
