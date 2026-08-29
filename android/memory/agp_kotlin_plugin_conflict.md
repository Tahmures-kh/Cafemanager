---
name: agp-kotlin-plugin-conflict
description: AGP 9.2.1 auto-applies Kotlin Android support; explicitly applying org.jetbrains.kotlin.android crashes the build
metadata:
  type: project
---

With AGP 9.2.1 (this project's version), `com.android.application` already registers a `kotlin`
project extension itself. Also applying `alias(libs.plugins.kotlin.android)` in `app/build.gradle.kts`
then fails with:

```
Cannot add extension with name 'kotlin', as there is an extension already registered with that name.
```

**Why:** Verified empirically — removing the `kotlin.android` plugin (while keeping `kotlin.compose`
and `kotlin.serialization`, which happily hook into AGP's own `kotlin` extension) let the build
configure and compile successfully. Bumping the Kotlin version to match what AGP pulls in transitively
(2.2.10) did NOT fix it — the fix is dropping the plugin entirely, not version-aligning it.

**How to apply:** In this project's `app/build.gradle.kts`, the `plugins {}` block should only contain
`android.application`, `kotlin.compose`, and `kotlin.serialization` — do not re-add `kotlin.android`.
If a future AGP/Kotlin upgrade changes this, re-test by temporarily applying only `android.application`
and running `./gradlew :app:help` — if it succeeds, AGP is still self-applying Kotlin support.

Also note: this AGP version's declarative `compileSdk { version = release(N) { minorApiLevel = M } }`
DSL produces a target hash like `android-N.M`, but for whole releases without a minor level, the plain
`compileSdk = N` form is more reliable (the declarative block without `minorApiLevel` produced an
uninstallable `android-37.0` target hash mismatch in practice).

See also [[cafemanagment-project-overview]].
