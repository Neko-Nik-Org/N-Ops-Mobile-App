# Contributing to N-Ops Mobile App

Thanks for helping. Bug reports, feature proposals, documentation fixes, and code are all welcome.
By taking part you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

> **Security issues:** do not open a public issue. Follow [SECURITY.md](SECURITY.md) instead.

## Before you start

- Search the [existing issues](https://github.com/Neko-Nik-Org/N-Ops-Mobile-App/issues) first.
- For anything bigger than a small fix, open an issue to agree on the approach before writing code.
- The app follows the [N-Ops Main API](https://github.com/Neko-Nik-Org/N-Ops-Main-API) and mirrors
  the [Admin UI](https://github.com/Neko-Nik-Org/N-Ops-Admin-UI) menu. A change that needs a new or
  different endpoint usually starts in the API repository.

## Set up

Requirements: Node.js 22.11+, npm, and the
[React Native environment](https://reactnative.dev/docs/set-up-your-environment) for iOS (Xcode,
CocoaPods) and/or Android (Android Studio, JDK).

```bash
git clone https://github.com/Neko-Nik-Org/N-Ops-Mobile-App.git
cd N-Ops-Mobile-App
npm install
cd ios && bundle install && bundle exec pod install && cd ..   # iOS only
npm start               # Metro
npm run ios             # or: npm run android
```

## Make your change

1. Fork the repository and branch from `main`, e.g. `fix/scan-landscape` or `feat/tag-filter`.
2. Follow the layout of `src/`: `screens/`, `components/` (shared UI), `lib/` (API, session, state),
   `theme/`. The drawer menu lives in `src/lib/menu.ts` and mirrors the Admin UI sidebar.
3. Every source file starts with the GPL-3.0 license header used in the existing files.
4. Add or update tests in `__tests__/` for what you changed.
5. Check your work. CI runs the same checks on every pull request:

   ```bash
   npm run lint && npm run typecheck && npm test
   ```

Check layouts in portrait and landscape, on a phone and a tablet, when you change UI.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/), e.g. `feat: add tag picker`,
`fix: keep the scan screen usable in landscape`, `docs: explain linking`.

## Open a pull request

- Describe what changed and why, and link the issue (`Closes #123`).
- Include screenshots or a short recording for UI changes (light and dark, portrait and landscape).
- Keep pull requests focused. Add a line under **Unreleased** in [CHANGELOG.md](CHANGELOG.md) for
  user-visible changes.

## License

By contributing, you agree that your contributions are licensed under the
[GNU General Public License v3.0](LICENSE), the same license as the project.
