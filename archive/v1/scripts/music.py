"""Generate the original 45-second score and sound effects from timeline.json."""
from __future__ import annotations

import json
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((ROOT / "timeline.json").read_text(encoding="utf-8"))
SR = 44100
DURATION = CONFIG["duration"]
BPM = CONFIG["bpm"]
BEAT = 60 / BPM
N = round(DURATION * SR)
RNG = np.random.default_rng(20260928)
MIX = np.zeros((N, 2), dtype=np.float32)


def hz(midi: int) -> float:
    return 440 * 2 ** ((midi - 69) / 12)


def add(t0: float, signal: np.ndarray, gain: float = 1, pan: float = 0) -> None:
    start = round(t0 * SR)
    if start >= N:
        return
    if start < 0:
        signal = signal[-start:]
        start = 0
    length = min(len(signal), N - start)
    if length <= 0:
        return
    left = np.sqrt((1 - pan) / 2) * gain
    right = np.sqrt((1 + pan) / 2) * gain
    MIX[start:start + length, 0] += signal[:length] * left
    MIX[start:start + length, 1] += signal[:length] * right


def tone(freq: float, duration: float, attack=.015, decay=.4) -> np.ndarray:
    t = np.arange(round(duration * SR), dtype=np.float32) / SR
    env = np.minimum(1, t / attack) * np.exp(-t / decay)
    wave_ = np.sin(2 * np.pi * freq * t) + .22 * np.sin(2 * np.pi * freq * 2.01 * t)
    return (wave_ * env).astype(np.float32)


def pad(chord: list[int], start: float, duration: float, strength: float) -> None:
    t = np.arange(round(duration * SR), dtype=np.float32) / SR
    env = np.minimum(1, t / 1.1) * np.minimum(1, (duration - t) / 1.3)
    for j, note in enumerate(chord):
        f = hz(note)
        signal = (np.sin(2 * np.pi * f * t) + .18 * np.sin(2 * np.pi * f * 1.004 * t)) * env
        add(start, signal.astype(np.float32), strength / len(chord), (j - 1) * .35)


def kick(at: float, gain: float) -> None:
    t = np.arange(round(.55 * SR), dtype=np.float32) / SR
    phase = 2 * np.pi * (54 * t + 70 * .035 * (1 - np.exp(-t / .035)))
    signal = np.sin(phase) * np.exp(-t * 13)
    add(at, signal.astype(np.float32), gain)


def tick(at: float, gain: float, bright=False) -> None:
    t = np.arange(round(.14 * SR), dtype=np.float32) / SR
    noise = RNG.standard_normal(len(t)).astype(np.float32)
    signal = np.diff(noise, prepend=0) if bright else noise
    signal *= np.exp(-t * (60 if bright else 38))
    add(at, signal.astype(np.float32), gain, float(RNG.uniform(-.35, .35)))


def impact(at: float, gain: float) -> None:
    kick(at, .6 * gain)
    t = np.arange(round(1.7 * SR), dtype=np.float32) / SR
    noise = RNG.standard_normal(len(t)).astype(np.float32)
    sweep = noise * np.exp(-t * 7)
    add(at, sweep, .13 * gain, -.25)
    add(at, tone(hz(45), 1.5, .01, .55), .16 * gain, .2)


chords = [[50, 57, 62], [48, 55, 60], [46, 53, 58], [48, 55, 64]]
for bar in range(18):
    start = bar * 4 * BEAT
    energy = .65 if bar < 3 else .95 if bar < 7 else 1.1 if bar < 15 else .85
    pad(chords[bar % 4], start, 4 * BEAT + .8, .16 * energy)
    for beat in range(4):
        at = start + beat * BEAT
        kick(at, (.18 if beat in (0, 2) else .09) * energy)
        tick(at + BEAT / 2, .015 * energy, True)
        if beat in (1, 3):
            tick(at, .035 * energy)
    for step in range(8):
        note = chords[bar % 4][step % 3] + (12 if step % 4 else 24)
        add(start + step * BEAT / 2, tone(hz(note), .62, .008, .22), .055 * energy, -.35 if step % 2 else .35)
    bass = chords[bar % 4][0] - 12
    add(start, tone(hz(bass), 1.1, .01, .4), .12 * energy)

for cue in CONFIG["cues"]:
    at, kind, strength = cue["t"], cue["name"], cue["strength"]
    if kind == "impact":
        impact(at, strength)
    elif kind == "chime":
        for i, note in enumerate([74, 81, 86]):
            add(at + i * .17, tone(hz(note), 2.1, .005, .8), .12 * strength, (i - 1) * .6)
    elif kind == "riser":
        t = np.arange(round(2.4 * SR), dtype=np.float32) / SR
        signal = RNG.standard_normal(len(t)).astype(np.float32) * (t / 2.4) ** 2
        add(at, signal, .035 * strength)

fade_in = np.minimum(1, np.arange(N, dtype=np.float32) / (.2 * SR))
fade_out = np.minimum(1, (N - np.arange(N, dtype=np.float32)) / (1.4 * SR))
MIX *= (fade_in * fade_out)[:, None]
peak = np.max(np.abs(MIX))
MIX *= .83 / max(peak, 1e-9)
OUT = ROOT / "out" / "soundtrack.wav"
OUT.parent.mkdir(exist_ok=True)
with wave.open(str(OUT), "wb") as stream:
    stream.setnchannels(2)
    stream.setsampwidth(2)
    stream.setframerate(SR)
    stream.writeframes((MIX * 32767).astype("<i2").tobytes())
print(f"wrote {OUT} ({DURATION}s, stereo {SR} Hz)")
