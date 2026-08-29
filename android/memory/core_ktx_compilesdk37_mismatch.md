---
name: core-ktx-compilesdk37-mismatch
description: androidx.core-ktx 1.19.0 requires compileSdk 37, which this project doesn't have installed and avoids; pin to 1.18.0
metadata:
  type: project
---

`gradle/libs.versions.toml` at one point had `coreKtx = "1.19.0"`, which triggered this at
build/sync time:

```
Dependency 'androidx.core:core:1.19.0' requires ... compile against version 37 or later ...
:app is currently compiled against android-36.1.
```

**Why:** androidx.core (and core-ktx) 1.19.0 bumped its required compileSdk to 37. Only
`android-36.1` is installed in the local SDK, and this project deliberately stays on
`compileSdk 36.1` rather than 37 — see [[agp-kotlin-plugin-conflict]], which documents that the
declarative `compileSdk { version = release(37) {...} }` block previously produced an
uninstallable `android-37.0` target hash mismatch. Chasing compileSdk 37 is the wrong fix here.

**How to apply:** Keep `coreKtx` pinned to `1.18.0` (the last release built against
`compileSdk 36.1`) unless/until the project deliberately moves to API 37 with the SDK platform
actually installed. Verified via `./gradlew :app:checkDebugAarMetadata` passing clean after the
downgrade. If a future dependency bump reintroduces this warning, downgrade the offending
androidx artifact rather than bumping compileSdk, unless the user explicitly wants to move to 37.

See also [[cafemanagment-project-overview]].
