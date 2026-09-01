# Mobile App Build Instructions

When asked to generate the APK or AAB for the mobile application in this project, **DO NOT** use `expo build` or `eas build`. This project uses standard Android tooling (Gradle / Android Studio) for compiling the React Native Android application.

## Generating the APK
To build the Android release APK, use the `build:apk` script configured in `mobile/package.json`:
```bash
cd mobile
npm run build:apk
```
*Note: This runs `cd android && gradlew assembleRelease` on Windows.*

The resulting APK will be generated at:
`mobile/android/app/build/outputs/apk/release/app-release.apk`

## Generating the App Bundle (AAB)
To build the Android App Bundle for Google Play, use the `build:aab` script:
```bash
cd mobile
npm run build:aab
```
*Note: This runs `cd android && gradlew bundleRelease` on Windows.*

The resulting AAB will be generated at:
`mobile/android/app/build/outputs/bundle/release/app-release.aab`
