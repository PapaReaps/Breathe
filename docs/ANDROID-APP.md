# The Android app

Breathe Money comes two ways. Both are free, and both are the same app:

| | Web link | Android app (APK) |
|---|---|---|
| Get it | Open [papareaps.github.io/Breathe](https://papareaps.github.io/Breathe/) | Download the `.apk` from [Releases](https://github.com/PapaReaps/Breathe/releases) |
| Phones | Any phone or computer | Android only |
| Works offline | After the first visit | Always: the app's files are inside it |
| Updates | By itself | Optional "check for updates" in Settings, then **Download and install** |
| Your numbers | Kept in that browser | Kept inside the app |

iPhones can't install an app from a file. On an iPhone, open the web link and use **Share → Add to Home Screen**.

## Installing the APK

1. On your Android phone, tap **[this download link](https://github.com/PapaReaps/Breathe/releases/latest/download/breathe-money.apk)** (or point the camera at the QR code on a friend's phone: **Menu → Settings → Help and sharing → Share Breathe Money**). The download starts straight away, then tap **Open**. You can also pick the file ending in `.apk` from the [latest release](https://github.com/PapaReaps/Breathe/releases/latest).
2. Android asks whether your browser may "install unknown apps". That's Android's standard check for anything that doesn't come from the Play Store. Allow it for this one install (you can switch it off again afterwards).
3. Tap **Install**, then **Open**.

**Updating:** in the app, go to **Menu → Settings → Updates**. Tap **Check now**, or switch on **Check once a day when I open the app**. When a new version is out, the app says so (in Settings, and as a small note on the home screen). In **Menu → Settings → App options → Updates**, tap **Download and install**. The first time, Android asks you to allow Breathe Money to install apps ("Allow from this source"): switch it on, come back and tap **Install now**. Android then asks "Do you want to update this app?": tap **Update**. Your numbers stay. There's also a link to get it from GitHub by hand.

How it's kept safe: the app only downloads from Breathe Money's own GitHub releases (any other address is refused), checks the file really is Breathe Money, and Android refuses any update not signed with the same key as the installed app. The `REQUEST_INSTALL_PACKAGES` permission is used for this alone. If the app ever goes on the Play Store, this would be removed, since Play does updates itself.

Versions before v0.14.0 can check but not download: update to v0.14.0 by hand once.

Versions before v0.12.0 don't have the check, so update to v0.12.0 by hand once from the [Releases page](https://github.com/PapaReaps/Breathe/releases).

**Moving numbers between the web link and the app:** they keep separate copies. In the one with your numbers, use **Menu → Your data and backups → Save a backup file** (protected is best). In the other, use **Use a backup file**.

## What's different inside the app

- **Saving a backup** opens Android's share sheet, so you choose where the file goes (Files, Drive, and so on). The app keeps no copy for itself.
- **Google Drive backup is switched off.** Android normally copies app data to your Google account, and to a new phone. Breathe turns both off, so your numbers never leave the phone. A backup file you save yourself is the way to move them.
- **No offline helper is needed.** The app's files are already on the phone.
- **It asks for no permissions** except the one Android needs to show web pages inside an app.
- **Leave a tip** (Menu → Settings → Help and sharing) opens Stripe's secure payment page **over the app**, in a Chrome Custom Tab. Close it to come straight back to Breathe. The app only ever opens Stripe's own payment links, sends nothing to them, and never sees card details. Tips are optional and unlock nothing.
- **It contacts nothing, unless you ask it to check for updates** (or tap a tip amount, which opens Stripe's page). The check is off until you switch it on (or tap **Check now**). It asks GitHub one question, "what's the newest Breathe Money version?", at most once a day. It sends no numbers, no account, no cookies and nothing about you, though GitHub can see that a phone asked, from its internet address, as with visiting any website. The link it opens, and the file it downloads, are built by the app, never taken from the answer.

## The opening breath

Both versions open with a **deep breath**: the word "breathe" starts light, fills out and rises a little as it breathes in, holds, then settles, with a soft shadow beneath it like a chest rising and falling. Then the app fades in. It takes about three seconds. In the Android app, Android first shows the plain background colour the moment you tap the icon, then the word breathes on the same colour, so the hand-over is seamless. Light and dark follow your setting, and with "reduce motion" switched on it's the still word, which fades as soon as the app is ready. It plays only when the app starts fresh, not every time you switch back to it. The font (Nunito, free under the SIL Open Font Licence) is inside the app, so nothing is fetched from anywhere.

## For contributors: how it's built

- **Capacitor** (free and open source) wraps the built web app (`apps/money/dist`) in a small Android app. The Android project is `apps/money/android`. Its settings are in `apps/money/capacitor.config.ts`.
- The recipe `.github/workflows/android.yml`:
  - **On every push to `main`:** runs the tests, then builds a **test copy**. Find it under the run in the **Actions** tab, under **Artifacts**. It's signed with a throwaway key, so it's for trying out, not for sharing.
  - **On every version tag** (for example `v0.10.0`): runs the tests, builds the **real copy** signed with the Breathe key, and publishes a **GitHub Release** with the `.apk` and the notes from `docs/releases/<tag>.md`.
- To try it on your own computer you'd need Android Studio. You don't need it: GitHub builds everything.

### Making a release

1. Write `docs/releases/vX.Y.Z.md` (what's new, in plain words) and push it.
2. Make the tag and push it: `git tag vX.Y.Z` then `git push origin vX.Y.Z`.
3. Wait for **Build Android app** to finish (a few minutes). The release appears on the Releases page.

The version number becomes the app's version (`v0.10.0` is "0.10.0"). Each release must have a higher number than the last, or phones won't install it as an update.

### Setting up the signing key (one time)

Every version must be signed with the **same key**, or phones refuse to install it over the old one. The key lives only in two places: a private file kept safe offline, and GitHub's encrypted secrets. It is never in the code.

In the repository on GitHub: **Settings → Secrets and variables → Actions → New repository secret**. Add three:

| Name | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | The whole text of `breathe-release.p12.base64.txt` |
| `ANDROID_KEYSTORE_PASSWORD` | The password in `KEEP-THIS-SAFE.txt` |
| `ANDROID_KEY_ALIAS` | `breathe` |

**Keep the key folder safe and private** (a USB stick or a password manager, not a shared folder). If the key is lost, the app can still be released, but people would have to uninstall the old one first, and their numbers would go with it unless they'd saved a backup. If the key leaks, someone else could make an "update" that phones would accept, so never share it.

## Not done yet, on purpose

- **Google Play Store.** It removes the "unknown apps" step and gives automatic updates, but needs a one-time $25 Google developer account. Possible later. Google has its own rules about tips inside apps, so those would be checked first.
- **App Store (iPhone).** It needs a paid Apple developer account ($99 a year) and a Mac. For now, iPhones use the web link.
