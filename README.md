# Tracka

## Project Setup

```sh
npm install
```

Create a `.env.local` file:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_GOOGLE_AUTH_WEB_CLIENT_ID=...
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

## Android Setup

### Get Signing Report

```sh
npm run build && npx cap sync
(cd android && ./gradlew signingReport)
```

### Firebase Console Config

- Open [the Firebase console](https://console.firebase.google.com/)
- Create a new Firebase project
- Go to the [Firebase Console > Settings > General](https://console.firebase.google.com/project/tracka/settings/general) page:
  - Add a "web" app:
    - App nickname: `tracka-webapp`
    - Also setup Firebase Hosting for this app: [x]
    - Copy the config settings it shows:
      ```
        apiKey: "TBC",
        authDomain: "tracka.firebaseapp.com",
        projectId: "tracka",
        storageBucket: "tracka.firebasestorage.app",
        messagingSenderId: "TBC",
        appId: "TBC"
      ```
  - Add an "android" app:
    - Android package name: `dev.michaelomichael.tracka`
    - App nickname: `tracka-android-app`
    - Don't bother about downloading the json at this point.
    - Don't bother about the "Add Firebase SDK" stuff either.
  - Configure the "android" app:
    - Add fingerprints to the "android" app:
      - Grab any of the SHA-1 fingerprints from the signingReport above. (They're all the same.)
      - Add one for SHA-256 too.
- Go to the [Firebase Console > Security > Authentication](https://console.firebase.google.com/project/tracka/authentication/providers) page:
  - Go to Sign-in method -> Google:
    - Enabled: [√]
    - Save
    - Download the `google-services.json` file for `tracka-android-app` to `android/app/google-services.json`
    - When the dialog closes, click "Google" again to edit it.
    - Expand the "Web SDK configuration" section and copy the "Web client ID"
    - Save (again, probably not required)
  - Go to Settings -> Authorized domains:
    - Add your local IP address e.g. `192.168.0.29` (run `ifconfig | grep "inet 192"`)

- I don't _think_ you need to do anything manually in the [Google Auth Platform console](https://console.cloud.google.com/auth/overview?project=tracka).
  - If you go here you should see the clients created.
  - I had previously gone in and clicked the "Get Started" button to go through the wizard:
    - App name: `tracka`
    - Support email: TBC
    - Audience: External
    - Contact email addresses: TBC
    - Create

### Android Studio Config

Plug in your phone and make sure it's unlocked.

```sh
export ANDROID_SDK_ROOT="$HOME/Library/Android/sdk"
export PATH="${ANDROID_SDK_ROOT}/platform-tools:$PATH"
adb devices
    # A status of 'device' means your phone is properly initialised/trusted

npx cap open android
    # Android Studio should open
```

- Make sure your phone is selected as the target device (dropdown in top-centre of window chrome, or choose "Device Manager" on RHS).
- Select the "Logcat" view.
  - The default `package:mine` filter is fine.
- Hit the "play" button.

N.B. If you make any changes to the app, I believe you need to do the `npm run build && npx cap sync` again and, in Android Studio, File -> Reload All from Disk.

### Try It

Try it with the webapp on the phone:

```sh
npm run dev

# Find your local IP address e.g. 192.168.0.29
ifconfig | grep "inet 192"
```

Note: if your local IP address has changed then you'll need to go back in to [Firebase Authentication > Settings > Authorised domains](https://console.firebase.google.com/project/tracka/authentication/settings) and add the new IP.

On phone, go to http://192.168.0.29:5173/ and try the same login sequence.

To troubleshoot the web browser on the phone, can go to here on the computer: [chrome://inspect/#devices](chrome://inspect/#devices).
