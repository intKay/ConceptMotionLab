"""Generate the score and sound effects from the shared film timeline."""
from __future__ import annotations

import json
import wave
import subprocess
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
    wave_ = np.sin(2 * np.pi * freq * t + 1.7 * np.exp(-t * 12) * np.sin(2 * np.pi * freq * 2 * t)) + .18 * np.sin(2 * np.pi * freq * 2.01 * t)
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


def bass(at: float, note: int, length: float, strength: float) -> None:
    t = np.arange(round(length * SR), dtype=np.float32) / SR
    f = hz(note)
    sig = sum(np.sin(2*np.pi*f*h*t) / (h*h) for h in range(1, 7))
    env = np.minimum(1, t/.006)*np.exp(-t/length*3)*np.minimum(1,(length-t)/.025)
    add(at, (sig*env).astype(np.float32), strength)


def snare(at: float, gain: float) -> None:
    t = np.arange(round(.25 * SR), dtype=np.float32) / SR
    n = RNG.standard_normal(len(t)).astype(np.float32)
    high = n - np.convolve(n, np.ones(8)/8, mode='same')
    sig = high*np.exp(-t*22)+.35*np.sin(2*np.pi*185*t)*np.exp(-t*35)
    add(at, sig.astype(np.float32), gain)


def shimmer(at: float, dur: float, strength: float) -> None:
    for j, note in enumerate([74,81,86,88]):
        add(at+j*.055, tone(hz(note),dur,.004,dur*.38),strength*.32,(j-1.5)*.35)


chords = [[50, 57, 62, 65], [46, 53, 60, 65], [53, 57, 60, 65], [48, 55, 62, 64]]
lead = [[74,77,81,77,74,72,69,72], [74,77,82,81,77,74,72,70], [77,81,84,81,79,77,74,72], [76,79,86,84,81,79,76,74]]
bars = int(np.ceil(DURATION/(4*BEAT)))
for bar in range(bars):
    start = bar * 4 * BEAT
    breakdown = 20 <= start < 26
    ending = start >= 44
    energy = .7 if start < 4 else .9 if start < 10 else .5 if breakdown else 1.12 if 31 <= start < 41 else .82 if ending else .92
    chord = chords[(bar//2) % 4]
    pad(chord, start, 4 * BEAT + .65, .16 * energy)
    for beat in range(4):
        at = start + beat * BEAT
        if not breakdown or beat==0:
            kick(at, (.32 if beat in (0, 2) else .18) * energy)
        if not ending:
            tick(at+BEAT/2, .018*energy, True)
            if bar>=6 and not breakdown: tick(at+BEAT*.75,.007*energy,True)
        if beat in (1,3) and not breakdown and not ending: snare(at,.073*energy)
        if not ending: bass(at+(BEAT/2 if beat%2 else 0),chord[0]-12,BEAT*.8,.14*energy)
    for step in range(8 if not breakdown else 4):
        spacing=BEAT/2 if not breakdown else BEAT
        note=chord[step%4]+12
        at=start+step*spacing
        sound=tone(hz(note), .8, .007, .19 if not breakdown else .5)
        add(at,sound,.04*energy,-.55 if step%2 else .55)
        add(at+BEAT*.75,sound,.012*energy,.65 if step%2 else -.65)
    if bar>=6 and not breakdown and not ending:
        for step,note in enumerate(lead[(bar//2)%4]):
            if step%2 and start<31: continue
            at=start+step*BEAT/2
            add(at,tone(hz(note),.75,.018,.28),.055*energy,(step%3-1)*.23)
    if bar in (4,9,14,20):
        for k in range(8): snare(start+3*BEAT+k*BEAT/8,.018+.006*k)

for cue in CONFIG["cues"]:
    at, kind, strength = cue["t"], cue["name"], cue["strength"]
    if kind == "impact":
        impact(at, strength)
    elif kind in ("chime", "glass"):
        shimmer(at,2.2,strength*.18)
    elif kind == "riser":
        duration=cue.get('duration',.8)
        t = np.arange(round(duration * SR), dtype=np.float32) / SR
        n = RNG.standard_normal(len(t)).astype(np.float32)
        low = np.convolve(n,np.ones(24)/24,mode='same')
        p=t/duration
        signal=(low*(1-p)+n*p*.22)*p**1.6*np.minimum(1,(duration-t)/.015)
        add(at,signal.astype(np.float32),.14*strength,-.4)
        add(at+.028,signal.astype(np.float32),.1*strength,.5)

# Tiny pitched contacts match the Galton segment; the macro edits follow the cues.
for j in range(40):
    add(10+j*.117, tone(hz(79+j%7),.095,.002,.023),.012,(j%9-4)/5)

fade_in = np.minimum(1, np.arange(N, dtype=np.float32) / (.2 * SR))
fade_out = np.minimum(1, (N - np.arange(N, dtype=np.float32)) / (1.4 * SR))
MIX *= (fade_in * fade_out)[:, None]
peak = np.max(np.abs(MIX))
MIX = np.tanh(MIX * 1.6)
MIX *= .88 / max(np.max(np.abs(MIX)), 1e-9)
OUT = ROOT / "out" / "soundtrack.wav"
OUT.parent.mkdir(exist_ok=True)
with wave.open(str(OUT), "wb") as stream:
    stream.setnchannels(2)
    stream.setsampwidth(2)
    stream.setframerate(SR)
    stream.writeframes((MIX * 32767).astype("<i2").tobytes())
# Two-pass normalization supplies a measured loudness target for the final mix.
RAW = OUT.with_name('soundtrack-raw.wav')
OUT.replace(RAW)
target = 'loudnorm=I=-16:TP=-3:LRA=9'
measurement = subprocess.run(['ffmpeg','-hide_banner','-i',str(RAW),'-af',target+':print_format=json','-f','null','-'],capture_output=True,text=True,check=True).stderr
stats=json.loads(measurement[measurement.rindex('{'):measurement.rindex('}')+1])
filter_=target+f":measured_I={stats['input_i']}:measured_TP={stats['input_tp']}:measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}:offset={stats['target_offset']}:linear=true"
subprocess.run(['ffmpeg','-y','-v','error','-i',str(RAW),'-af',filter_,'-ar',str(SR),'-c:a','pcm_s16le',str(OUT)],check=True)
print(f"wrote {OUT} ({DURATION}s, stereo {SR} Hz, {BPM} BPM)")
