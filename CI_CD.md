# N-Ops Mobile App: CI/CD (GitHub Actions + Fastlane)

App: `com.nekonik.nops` · Scheme/workspace: `NOpsApp` · Apple team: `3C34G7BUNH`

## What it does

| Trigger | Android | iOS |
|---|---|---|
| Pull request | lint, type-check, tests | lint, type-check, tests |
| Push to `main` | signed AAB → Play **internal** | signed IPA → **TestFlight** |
| Tag `v*` (e.g. `v1.4.0`) | signed AAB → Play **production** | signed IPA → **App Store Connect** (not submitted for review) |

Pipeline: `.github/workflows/mobile-ci-cd.yml`. Lanes: `android/fastlane/Fastfile`, `ios/fastlane/Fastfile`.

---

## Step 1: Install Fastlane locally

```bash
bundle install          # Gemfile already includes fastlane
git add Gemfile.lock && git commit -m "Add Gemfile.lock"
```

## Step 2: Android one-time setup

1. **Create an upload keystore** (back it up somewhere safe; never commit it):
   ```bash
   keytool -genkeypair -v -keystore upload.keystore -alias upload \
     -keyalg RSA -keysize 2048 -validity 10000
   base64 -i upload.keystore | pbcopy      # Linux: base64 -w0 upload.keystore
   ```
2. **Google Play service account**
   - Google Cloud Console → create a service account → create a JSON key.
   - Play Console → *Users and permissions* → invite the service account email → grant release permissions for the app.
3. **Upload the first AAB manually** in Play Console (the API cannot create the app). Enable Play App Signing.
4. If the app has never been reviewed, set repo variable `PLAY_RELEASE_STATUS=draft` until it is.
5. If Play already has version codes, set repo variable `ANDROID_VERSION_CODE_OFFSET` so that `run_number + offset` is higher than the current max.

How signing works: `android/app/build.gradle` reads `android/keystore.properties` (gitignored). CI writes that file and `upload.keystore` from secrets at build time. `versionCode` comes from the `ANDROID_VERSION_CODE` env var set by CI (falls back to `2` locally).

## Step 3: iOS one-time setup

1. **Create the app** in App Store Connect with bundle ID `com.nekonik.nops`.
2. **App Store Connect API key**: Users and Access → Integrations → App Store Connect API → generate a key with *App Manager* role. Note the **Key ID** and **Issuer ID**, then download the `.p8` (only possible once):
   ```bash
   base64 -i AuthKey_XXXXXX.p8 | pbcopy
   ```
3. **Fastlane Match** (run on your Mac):
   - Create an empty **private** git repo, e.g. `Neko-Nik-Org/ios-certificates`.
   - Export `MATCH_GIT_URL` and run from `ios/`:
     ```bash
     bundle exec fastlane match appstore --readonly false
     ```
   - Choose a passphrase (this is `MATCH_PASSWORD`). Match creates the distribution certificate and App Store profile and pushes them encrypted. (`Matchfile` is read-only by default so CI never creates certs.)
4. **Access token for the certificates repo**: create a GitHub fine-grained PAT with *read* access to that repo, then:
   ```bash
   echo -n "your-github-username:ghp_xxx" | base64
   ```
5. If you add app extensions (widgets, notification service), add their bundle IDs to `ios/fastlane/Matchfile`.

### What the three Match values are

Match keeps your iOS distribution certificate and provisioning profile **encrypted in a separate private git repo**. The CI runner is a fresh machine every run, so it must download and decrypt them each time. That takes three values:

| Value | What it is | How to get it |
|---|---|---|
| `MATCH_GIT_URL` | HTTPS clone URL of the private certificates repo (not the app repo), e.g. `https://github.com/Neko-Nik-Org/ios-certificates.git`. | Create an empty private repo and copy its HTTPS URL. |
| `MATCH_PASSWORD` | Passphrase that encrypts the files in that repo. Anyone with the repo and this passphrase can decrypt your signing identity. If you lose it, you must revoke and recreate the certificates. | You choose it the first time you run `fastlane match appstore`. Store it in a password manager. |
| `MATCH_GIT_BASIC_AUTHORIZATION` | Login CI uses to clone the private repo. It is base64 of `github-username:token`, sent as an HTTP `Authorization: Basic …` header. | Create a fine-grained PAT with **read-only** access to the certificates repo only, then run `echo -n "username:ghp_xxx" \| base64`. |

Git access (`MATCH_GIT_URL` + `MATCH_GIT_BASIC_AUTHORIZATION`) lets CI **download** the files. `MATCH_PASSWORD` lets it **decrypt** them. Both are required.

## Step 4: Add GitHub secrets

Repo → Settings → Secrets and variables → Actions. The deploy jobs use an Environment named **`production`** (Settings → Environments → New environment); add required reviewers there if you want approval before releases.

| Secret | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | base64 of `upload.keystore` |
| `ANDROID_KEYSTORE_PASSWORD` | keystore password |
| `ANDROID_KEY_ALIAS` | `upload` |
| `ANDROID_KEY_PASSWORD` | key password |
| `PLAY_JSON_KEY` | full contents of the service-account JSON |
| `ASC_KEY_ID` | App Store Connect key ID |
| `ASC_ISSUER_ID` | App Store Connect issuer ID |
| `ASC_KEY_P8_BASE64` | base64 of the `.p8` file |
| `APPLE_TEAM_ID` | `3C34G7BUNH` |
| `MATCH_GIT_URL` | `https://github.com/<org>/ios-certificates.git` |
| `MATCH_PASSWORD` | Match passphrase |
| `MATCH_GIT_BASIC_AUTHORIZATION` | base64 of `username:token` |

Optional repo **variables**: `PLAY_RELEASE_STATUS`, `ANDROID_VERSION_CODE_OFFSET`.

## Step 5: Test locally (optional but recommended)

```bash
# Android: export the env vars from step 4 (PLAY_JSON_KEY_PATH = path to the JSON file), then
cd android && bundle exec fastlane android beta

# iOS
cd ios && bundle exec fastlane ios beta
```

## Step 6: Release

```bash
# Beta: merge to main
git checkout main && git pull && git merge feature/x && git push

# Production: bump versions first (see below), then tag
git tag v1.4.0 && git push origin v1.4.0
```

Before tagging, bump `versionName` in `android/app/build.gradle` and `MARKETING_VERSION` in Xcode (both currently `1.0.1`). Build numbers (`versionCode`, `CURRENT_PROJECT_VERSION`) are set automatically from the GitHub run number.

After a production upload, finish the release by hand: promote/review in Play Console and submit for review in App Store Connect.

---

## Troubleshooting

- **"No signing certificate found"**: Match was run for a different bundle ID, or the scheme/target doesn't match `NOpsApp`.
- **"Version code X has already been used"**: raise `ANDROID_VERSION_CODE_OFFSET`.
- **Play: "Only releases with status draft may be created on draft app"**: set `PLAY_RELEASE_STATUS=draft`.
- **Match fails in CI with a write error**: expected, CI is read-only. Re-run match locally with `--readonly false`.
- **Xcode "Bundle React Native code" can't find node**: check `ios/.xcode.env` has `export NODE_BINARY=$(command -v node)`.
- **iOS job is slow/expensive**: macOS minutes cost more on private repos. Limit the `ios` job to tags (`if: startsWith(github.ref, 'refs/tags/v')`).

## Security notes

- Never commit `*.keystore`, `keystore.properties`, the Play JSON, or the `.p8` (the first two are gitignored).
- Team ID and bundle ID in the repo are identifiers, not secrets.
- Back up the upload keystore and the Match passphrase outside GitHub.

## Safety checklist (do these once)

**GitHub repo settings**
1. **Protect `main`**: Settings → Branches → add a rule: require a pull request, require the `checks` job to pass, block force-push and deletion. Every push to `main` ships a beta, so nothing unreviewed should reach it.
2. **Protect release tags**: Settings → Rules → Rulesets → restrict who can create `v*` tags. A tag publishes to production.
3. **Require approval on `production`**: Settings → Environments → `production` → *Required reviewers* (and limit *Deployment branches and tags* to `main` and `v*`). Both deploy jobs use this environment, so no store upload happens without a human click.
4. **Fork PRs**: Settings → Actions → General → *Require approval for first-time contributors* (or all outside collaborators). Deploy jobs already skip on `pull_request`, and GitHub does not pass secrets to fork PRs, but this stops strangers burning your minutes.
5. **Put secrets in the `production` environment**, not repo-level, so only the approved deploy jobs can read them.
6. **Turn on secret scanning and push protection**: Settings → Code security.

**Workflow**
7. The workflow sets `permissions: contents: read`, so the default `GITHUB_TOKEN` can't write to the repo. Keep it that way; add extra permissions per job only if a job needs them.
8. Never `echo` a secret or run `set -x` in a step that touches one. GitHub masks secrets in logs, but only exact matches (a base64 or re-encoded copy is not masked).
9. Optional hardening: pin third-party actions to a full commit SHA instead of `@v4`, and let Dependabot update them (`.github/dependabot.yml`, ecosystem `github-actions`).

**Credentials**
10. **Least privilege**: the Play service account gets release permission for this app only; the App Store Connect key uses *App Manager* (not Admin); the Match PAT is read-only on the certificates repo only.
11. **Set expirations**: give the GitHub PAT an expiry (e.g. 90 days) and calendar a reminder. When it expires, iOS builds fail at the Match step.
12. **Rotate on any leak or when someone leaves**: revoke the PAT, the ASC key and the Play service account key; generate new ones and update the secrets. The upload keystore can be reset through Play Console support if it is ever lost or exposed (that is why Play App Signing is on).
13. **Backups**: keep `upload.keystore`, its passwords, the `.p8` and the Match passphrase in a password manager or vault, with at least two people who can recover them.

**Releases**
14. **Staged rollout**: for production, use a staged percentage in Play Console and phased release in App Store Connect, so a bad build reaches few users first.
15. **Test the beta first**: always let a build soak on internal/TestFlight before tagging the same commit.
16. **Roll back by shipping forward**: store builds can't be recalled; fix and release a new version (build numbers always increase automatically).
17. **If a secret leaks in git history**: rotating it is what matters, because deleting the commit does not undo the exposure.
