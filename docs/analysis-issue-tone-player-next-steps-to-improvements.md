# Analysis: iOS Audio Issue and Next Steps for Tone.Player-Based Engine

## Summary

- [Overview](#overview)
- [Current Architecture (High-Level)](#current-architecture-high-level)
- [GrainPlayer vs Player in This Product](#grainplayer-vs-player-in-this-product)
- [Why Granular Synthesis Helps a Shrutibox](#why-granular-synthesis-helps-a-shrutibox)
- [Why the iOS Fallback Uses TonePlayer](#why-the-ios-fallback-uses-toneplayer)
- [What Is Lost When Switching to TonePlayer on iOS](#what-is-lost-when-switching-to-toneplayer-on-ios)
- [When Is TonePlayer Enough](#when-is-toneplayer-enough)
- [Recommended Next Steps](#recommended-next-steps)
- [Summary](#summary-1)

## Overview

This document summarizes the current state of the iOS audio engine for the Shrutibox virtual instrument, explains the role of `Tone.GrainPlayer` vs `Tone.Player`, and proposes concrete next steps to improve sound quality on iOS without reintroducing silence or instability.[file:1]

The focus is on using `Tone.Player` as a robust fallback on iOS while preserving as much of the acoustic realism of the granular engine as is practical.[file:1]

## Current Architecture (High-Level)

- The app is a SPA built with React 19 and Vite 7, running in the browser (Safari/WebKit on iOS).[file:1]
- Audio is implemented almost entirely with Tone.js 15.1.22 on top of the Web Audio API.[file:1]
- State management is handled with Zustand 5.[file:1]

### Dual Engine Design

- **Desktop / Android**
  - Instrument: `MKS Realistic` (and others).
  - Engine: `RealisticGrainAudioManager` / `AccordionPadAudioManager`.
  - Core primitive: `Tone.GrainPlayer` with a dual-player granular strategy (crossfades, overlap, manual cycling).[file:1]

- **iOS / iPadOS**
  - Same instrument IDs exposed to the UI.
  - Engine: `SampleAudioManager` per instrument.
  - Core primitive: `Tone.Player` with native loop.[file:1]

Platform selection is done via an `isIOS()` helper and a dual instrument registry, choosing the granular engine on desktop and the sample-based engine on iOS.[file:1]

## GrainPlayer vs Player in This Product

### Tone.GrainPlayer (Granular Engine)

In this project, `Tone.GrainPlayer` is used to:

- Play short **grains** (e.g., 0.5 s) of a buffer with overlap, producing a timbre that feels more **alive** and less static.[file:1]
- Implement **dual-player cycling**: one granular player fades in while another fades out, so the loop never hits a single, sharp discontinuity point in the underlying file.[file:1]
- Control grain size, overlap, and cycle positions (loopStart, loopEnd, cycleStart) to approximate a continuous air flow rather than a mechanical loop.[file:1]
- Support **bellows-like behaviour**:
  - `bellows stagger`: low notes start first, higher notes enter with per-semitone delays, approximating how a real shrutibox speaks when the bellows move.[file:1]
  - More organic **release behaviour** (e.g., high → low turning off order).[file:1]

On desktop/Android, the grain engine yields a drone that:

- Has richer **micro-variation** in timbre.
- Hides loop points using long crossfades.
- Feels closer to an acoustic box with flowing air.[file:1]

### Tone.Player (Sample Engine)

On iOS, `SampleAudioManager` uses `Tone.Player` with `loop: true` and a fixed loop window, currently around 1.0–5.0 seconds.[file:1]

- Pros:
  - Simple, robust, and more predictable on iOS WebKit.
  - Directly based on `AudioBufferSourceNode.loop` semantics.[file:1]

- Cons in the current implementation:
  - The short loop window (~4 seconds) means any discontinuity in the source MP3 (phase, amplitude mismatch) repeats frequently, causing **audible clicks**.[file:1]
  - `fadeIn` / `fadeOut` are applied to the beginning and end of the playback, not to each internal loop cycle.[file:1]
  - The iOS engine does **not** currently implement `setChorusEnabled`; the chorus toggle in the UI is effectively inert on iOS.[file:1]
  - `bellows stagger` is not ported, so chords start more mechanically (all notes at once) and release more uniformly.[file:1]

Result: the iOS sound is more **flat**, more obviously looped, and misses several higher-level behaviours that exist on desktop.[file:1]

## Why Granular Synthesis Helps a Shrutibox

A physical shrutibox is a drone instrument where sound quality depends on:

- How air **starts** and **stops** in the reeds.
- How low notes can respond slightly before high notes.
- Continuous airflow with subtle **micro-variations** in timbre.
- Loops that do not sound like a cut-and-paste pad.[file:1]

The granular engine contributes to this by:

- Layering overlapping grains to avoid obvious repetitions.
- Using long crossfades between granular players so that the underlying file’s loop point is never directly exposed.[file:1]
- Allowing musical behaviours like bellows stagger and more nuanced release timing.[file:1]

In short: the granular approach makes the virtual instrument feel more like a **physical box with air** and less like a static sample on repeat.[file:1]

## Why the iOS Fallback Uses Tone.Player

On iOS / iPadOS (Safari/WebKit), there are known issues with Tone.js and `Tone.GrainPlayer`:

- The audio context can be suspended due to autoplay policies and user gesture requirements; long async chains between a click and `resume()` may invalidate user activation.[file:1]
- Even when the `AudioContext` is `running`, `Tone.GrainPlayer` appears to be **unreliable**: grains do not always schedule correctly, leading to **silence** without clear console errors.[file:1]
- `Tone.Player` is more stable on iOS because it relies directly on `AudioBufferSourceNode.loop` rather than on a custom granular scheduler.[file:1]

Because of this, the product currently:

- Uses a granular engine on desktop/Android for maximum realism.[file:1]
- Falls back to a simpler `Tone.Player`-based engine on iOS to guarantee that **sound always plays**, even though quality is lower.[file:1]

## What Is Lost When Switching to Tone.Player on iOS

When moving from the granular engine to the simple loop engine on iOS, the following dimensions degrade:[file:1]

- **Texture**
  - Desktop: 0.5 s grains with overlap create a more “alive” timbre.
  - iOS: a flat loop over a short audio window.[file:1]

- **Loop crossings**
  - Desktop: dual-player crossfade with long fade and delayed fade-out of the previous player; the loop point is effectively hidden.
  - iOS: built-in loop over a 4 s window; any discontinuity in the file is repeated, causing clicks.[file:1]

- **Onset when playing chords**
  - Desktop: bellows stagger (per-semitone delays) causes low notes to enter first.
  - iOS: notes start together, more synthetic.[file:1]

- **Release behaviour**
  - Desktop: bellows-inspired release patterns (e.g., high → low).
  - iOS: more uniform and short stop.[file:1]

- **Chorus FX**
  - Desktop: `setChorusEnabled` toggles a chorus with conservative parameters.
  - iOS: `SampleAudioManager` does not implement this method, so the UI toggle does not affect the sound.[file:1]

## When Is Tone.Player Enough?

If the underlying audio files are prepared correctly (loop points aligned in phase and amplitude, or crossfades baked into the file), `Tone.Player` can be sufficient for a shrutibox-like instrument, especially on constrained platforms like iOS.[file:1]

With well-prepared samples, `Tone.Player` can provide:

- Seamless loops (assuming correct offline processing).
- A natural **fade-in** at note start (`fadeIn`).
- A natural **fade-out** at note stop (`fadeOut`).[file:1]

What it does **not** give you by default is:

- Granular micro-variation of the timbre.
- Long dual-player crossfades that are independent of the file loop point.
- Advanced behaviours like staggered onset/release beyond what you program around it.[file:1]

Therefore, a pragmatic strategy is:

- Use `Tone.Player` on iOS with **better source material** and a richer control layer (stagger, chorus, volume envelopes).
- Keep the granular engine on desktop/Android as the “full fidelity” mode where the platform is more predictable.[file:1]

## Recommended Next Steps

The following steps aim to improve iOS sound quality **without** changing the technology stack and without relying again on `Tone.GrainPlayer` on iOS.[file:1]

### 1. Improve the iOS Sample Engine (Tone.Player)

1. **Wire chorus into `SampleAudioManager`**
   - Implement `setChorusEnabled` in the sample-based engine so the UI toggle actually changes audio on iOS.
   - Use the same or similar chorus node and `wet` parameter as in the granular engine to keep behaviour consistent.[file:1]

2. **Adjust loop window configuration**
   - Stop using a very short loop window (`loopStart = 1.0`, `loopEnd = 5.0`).
   - Either:
     - Extend `loopEnd` to the full buffer duration, or
     - Use dedicated, offline-processed loop files where the loop is known to be seamless.[file:1]

3. **Port bellows-like behaviours**
   - Reuse the `bellows stagger` logic from the granular engine: order notes by chromatic index and apply per-semitone delays when starting multiple notes.
   - Optionally, apply a similar approach to release, so turning off notes feels more like the bellows closing.[file:1]

This set of changes is marked in the original research document as **low effort / low risk**, because they do not alter the Web Audio unlocking logic or the core scheduling mechanism.[file:1]

### 2. Use Preprocessed Loop Materials on iOS

1. **Switch to pre-crossfaded assets**
   - The project already has audio resources generated offline with crossfades baked into the file under a prefix like `/sounds-mks-xfade`.[file:1]
   - Update the iOS instrument registry to load these preprocessed files instead of the raw ones.

2. **Simplify loop parameters**
   - Configure `Tone.Player` with `loopStart: 0` and `loopEnd: null` (full duration) for these assets, relying on the internal crossfade baked into the file.[file:1]

This is described in the research document as a **“strong loop quality improvement without going back to granular”** and is still compatible with the current architecture.[file:1]

### 3. Keep Granular Engine as Desktop/Android High-Fidelity Mode

- Maintain `RealisticGrainAudioManager` on platforms where `Tone.GrainPlayer` behaves reliably.
- Consider a feature flag for experimenting with granular playback on iOS on a controlled subset of devices, but keep the default iOS path on `Tone.Player` until stability is proven.[file:1]

### 4. Future Research (Optional, Higher Risk)

These ideas are not required for the next iteration, but they form the long-term research backlog:[file:1]

- Re-evaluate `Tone.GrainPlayer` on the latest iOS / Safari versions with isolated demos and feature flags.[file:1]
- Prototype an **AudioWorklet**-based granular/crossfade engine that does scheduling in the audio thread instead of relying on timers on the main thread.[file:1]
- Investigate automatic loop point selection (zero-crossing, phase alignment) to prepare better source loops offline.[file:1]

## Summary

- `Tone.GrainPlayer` gives the shrutibox instrument a more realistic, organic drone on desktop/Android, but is unreliable on iOS.
- `Tone.Player` is stable on iOS but currently configured in a way that produces more mechanical, click-prone loops and lacks several higher-level behaviours (chorus, stagger, nuanced release).
- The recommended next step is **not** to replace Tone.js, but to:
  - Improve the `Tone.Player` iOS engine (chorus, stagger, longer loop window).
  - Switch to **offline pre-crossfaded assets** where available.
  - Keep granular synthesis as a high-fidelity option where the platform allows it.[file:1]
