#!/usr/bin/env python3
"""Procedural sound effects for the Hajj journey video (timed to the scenes in index.html).
Writes sfx-track.wav (stereo, 44.1 kHz, 92 s). Optional real recordings dropped in ./external are mixed in too."""
import os, subprocess, sys, wave
import numpy as np

SR = 44100
DUR = 92
N = DUR * SR
rng = np.random.default_rng(7)
MURM = .5  # synthetic crowd murmur is turned down because real chants are mixed in
L = np.zeros(N, np.float32)
R = np.zeros(N, np.float32)
HERE = os.path.dirname(os.path.abspath(__file__))


# ---------- building blocks ----------
def tt(d): return np.arange(int(d * SR)) / SR
def noise(d): return rng.standard_normal(int(d * SR)).astype(np.float32)


def fftfilt(x, lo=None, hi=None, order=2):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); m = np.ones_like(f)
    if lo: m = m / (1 + (lo / np.maximum(f, 1e-3)) ** (2 * order))
    if hi: m = m / (1 + (f / hi) ** (2 * order))
    return np.fft.irfft(X * m, len(x)).astype(np.float32)


def formant(x, fc, bw):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X / (1 + ((f - fc) / bw) ** 4), len(x)).astype(np.float32)


def ramp(d, pts):
    return np.interp(tt(d), [p[0] for p in pts], [p[1] for p in pts]).astype(np.float32)


def norm(x): return (x / (np.std(x) + 1e-9)).astype(np.float32)


def sweep(d, f0, f1, bw=.5):
    n = noise(d); out = np.zeros_like(n); B = 2048; H = B // 2; win = np.hanning(B)
    f = np.fft.rfftfreq(B, 1 / SR)
    for s0 in range(0, len(n) - B, H):
        fc = np.interp((s0 + H) / len(n), [0, 1], [f0, f1])
        out[s0:s0 + B] += np.fft.irfft(np.fft.rfft(n[s0:s0 + B] * win) / (1 + ((f - fc) / (fc * bw)) ** 4), B)
    return norm(out)


def place(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i < 0: sig = sig[-i:]; pan = pan if np.isscalar(pan) else pan[-i:]; i = 0
    n = min(len(sig), N - i)
    if n <= 0: return
    s = sig[:n] * gain
    p = np.full(n, pan, np.float32) if np.isscalar(pan) else np.asarray(pan[:n], np.float32)
    p = np.clip(p, -1, 1)
    L[i:i + n] += s * np.sqrt((1 - p) / 2); R[i:i + n] += s * np.sqrt((1 + p) / 2)


def panramp(d, a, b, ease=True):
    u = tt(d) / d
    if ease: u = np.where(u < .5, 2 * u * u, 1 - 2 * (1 - u) ** 2)
    return (a + (b - a) * u).astype(np.float32)


def reverb(x, taps=((.09, .45), (.19, .32), (.31, .22), (.47, .14))):
    out = x.copy()
    for d, g in taps:
        k = int(d * SR); out[k:] += x[:-k] * g
    return out


# ---------- sound designs ----------
def jet(d, lvl, whine=2300, wlvl=.5, rumble=1.0):
    body = norm(fftfilt(noise(d), 250, 3000)) * .9 + norm(fftfilt(noise(d), 50, 220)) * rumble
    t = tt(d); w = np.sin(2 * np.pi * whine * t + 2 * np.sin(2 * np.pi * .6 * t)) + .4 * np.sin(2 * np.pi * whine * 2.02 * t)
    return (norm(body) + wlvl * w) * ramp(d, lvl)


def engine(d, rpm, lvl):
    f = ramp(d, rpm); ph = np.cumsum(2 * np.pi * f / SR)
    x = sum(np.sin(k * ph + k) / k ** .8 for k in range(1, 10))
    x = np.tanh(1.4 * x / 2) + .35 * norm(fftfilt(noise(d), 40, 500))
    x = fftfilt(x, 25, 1100) * (1 + .25 * np.sin(2 * np.pi * 9 * tt(d)))
    return norm(x) * ramp(d, lvl)


def hiss(d, lo=2500, lvl=None):
    x = norm(fftfilt(noise(d), lo, 9000))
    return x * (ramp(d, lvl) if lvl else ramp(d, [(0, 0), (.02, 1), (d * .35, .6), (d, 0)]))


def thump(d=.14, f=90, lo=120, hi=1100):
    t = tt(d)
    return norm(fftfilt(noise(d), lo, hi)) * np.exp(-t / .02) * .8 + np.sin(2 * np.pi * f * t) * np.exp(-t / .03)


STEP = [thump(.14, 85 + k * 12) for k in range(4)]


def footsteps(t0, d, rate, gain, pan=0.0, jitter=.25):
    t = t0 + rng.random() * .1
    while t < t0 + d:
        place(STEP[int(rng.integers(4))], t, gain * (.7 + .5 * rng.random()), pan if np.isscalar(pan) else pan)
        t += (1 / rate) * (1 + jitter * (rng.random() - .5))


def murmur(d, nv=14, lvl=None):
    t = tt(d); out = np.zeros(len(t), np.float32)
    for _ in range(nv):
        f0 = rng.uniform(95, 210) * (1 + .03 * np.sin(2 * np.pi * rng.uniform(.3, .9) * t + rng.uniform(0, 6)))
        saw = (2 * np.mod(np.cumsum(f0 / SR), 1) - 1).astype(np.float32)
        src = saw * .7 + norm(noise(d)) * .35
        v = formant(src, rng.uniform(300, 800), 130) + .6 * formant(src, rng.uniform(1000, 2400), 280)
        syl = np.clip(np.sin(2 * np.pi * rng.uniform(2, 4.5) * t + rng.uniform(0, 6.3)) + .8 * np.sin(2 * np.pi * rng.uniform(.25, .9) * t + rng.uniform(0, 6.3)) - .1, 0, None)
        out += norm(v) * syl * (.4 + rng.random())
    out = fftfilt(out, 110, 4000)
    out = norm(out)
    return out * (ramp(d, lvl) if lvl else 1) * MURM


def wind(d, lvl):
    t = tt(d)
    x = norm(fftfilt(noise(d), 70, 650)) * (1 + .5 * np.sin(2 * np.pi * .23 * t + 1) + .3 * np.sin(2 * np.pi * .61 * t))
    return norm(x) * ramp(d, lvl)


def crickets(d, lvl, n=7):
    t = tt(d); out = np.zeros(len(t), np.float32)
    for _ in range(n):
        f = rng.uniform(4300, 5400); rate = rng.uniform(28, 36); per = rng.uniform(.55, 1.0); duty = rng.uniform(.3, .5); off = rng.uniform(0, 1)
        gate = ((np.mod(t * rate, 1) < .55) & (np.mod(t / per + off, 1) < duty)).astype(np.float32)
        gate = fftfilt(gate, None, 400)
        out += np.sin(2 * np.pi * f * t) * gate * rng.uniform(.5, 1)
    return norm(out) * ramp(d, lvl)


def tak(f=1900):
    d = .16; t = tt(d)
    return (np.sin(2 * np.pi * f * t) * .6 + np.sin(2 * np.pi * f * 2.3 * t) * .3 + norm(fftfilt(noise(d), 1800, 9000)) * .5) * np.exp(-t / .018)


def cloth_thud():
    d = .2; t = tt(d)
    return (norm(fftfilt(noise(d), 100, 700)) * .7 + np.sin(2 * np.pi * 170 * t)) * np.exp(-t / .035)


def throw_whoosh():
    d = .3
    return sweep(d, 1800, 600, .7) * np.hanning(int(d * SR)) * .8


def bell(f, d=1.6):
    t = tt(d); x = np.zeros_like(t)
    for h, g, dec in [(1, 1, 1.0), (2.76, .5, .6), (5.4, .25, .35), (8.9, .12, .2)]:
        x += np.sin(2 * np.pi * f * h * t) * g * np.exp(-t / (dec * d * .5))
    return x * np.minimum(1, t / .004)


def ding_dong():
    a = bell(880, 1.4); b = bell(660, 1.8); out = np.zeros(int(2.6 * SR), np.float32)
    out[:len(a)] += a; out[int(.55 * SR):int(.55 * SR) + len(b)] += b
    return out * .5


def chime():
    out = np.zeros(int(3 * SR), np.float32)
    for k, f in enumerate([523.25, 659.25, 783.99, 1046.5]):
        b = bell(f, 1.8); i = int(k * .13 * SR); out[i:i + len(b)] += b
    return out * .45


def whoosh(d, up):
    x = sweep(d, 350, 3800, .6) if up else sweep(d, 3800, 350, .6)
    return x * np.sin(np.pi * np.arange(len(x)) / len(x)) ** 1.5


def eio(u):
    u = np.clip(u, 0, 1); return np.where(u < .5, 4 * u ** 3, 1 - (-2 * u + 2) ** 3 / 2)


# ---------- timeline ----------
# transitions (iris) at each scene boundary
for b in [5, 12, 19, 27, 33, 40, 46, 52, 59, 66, 72, 77, 84]:
    place(whoosh(.45, True), b - .45, .32); place(whoosh(.45, False), b, .32)
    place(thump(.3, 55, 30, 300), b - .02, .35)

# 1 intro
place(sweep(1.1, 400, 3500, .6) * np.hanning(int(2.2 * SR))[:int(1.1 * SR)], .1, .35)
place(chime(), .55, .6)

# 2 flight out (5-12)
place(jet(7, [(0, 0), (.8, .5), (5.5, .5), (7, .15)], whine=2100, wlvl=.25, rumble=.6), 5, .22, panramp(7, .5, -.5))

# 3 airport (12-19)
t0 = 12
place(jet(1.8, [(0, 0), (1.2, 1), (1.8, .8)], whine=2600, wlvl=.5), t0, .5, panramp(1.8, .9, .45))
place(sweep(.35, 2500, 1700, .5) * ramp(.35, [(0, 0), (.03, 1), (.35, 0)]) + thump(.35, 70, 30, 300), t0 + .6, .55, .8)
place(jet(2.4, [(0, .2), (.3, 1), (2.4, 0)], whine=1500, wlvl=0, rumble=1.4), t0 + .7, .55, panramp(2.4, .6, .35))
place(jet(3.5, [(0, .5), (.5, .45), (3.5, 0)], whine=1900, wlvl=.6, rumble=.2), t0 + 2.5, .24, .35)
place(ding_dong(), t0 + 3.6, .32, 0)
footsteps(t0 + 3.4, 3.3, 3.2, .18, -.2)

# 4 tafweej bus (19-27)
t0 = 19
bx = lambda p: 2400 + (1050 - 2400) * (1 - (1 - np.clip(p / .4, 0, 1)) ** 3)
u = tt(3.4) / 3.4; arr = 1 - (1 - np.clip(u / (3.2 / 3.4), 0, 1)) ** 3
place(engine(3.4, [(0, 55), (3.2, 30), (3.4, 28)], [(0, 0), (1.5, 1), (3.4, .6)]), t0, .5, (.9 - .8 * arr))
place(hiss(1.1, 2200), t0 + 3.2, .45, .15); place(hiss(.5, 3000), t0 + 3.75, .3, .1)
place(engine(4.5, [(0, 28), (4.5, 27)], [(0, .35), (3, .3), (4.5, 0)]), t0 + 3.4, .22, .1)
footsteps(t0 + 3.7, 4.0, 3.4, .2, -.3)

# 5 mina (27-33)
t0 = 27
d = 4.2; p = np.clip((tt(d) / 6 - .02) / .58, 0, 1); x = 2450 - (2450 + 520) * eio(p)
pan = np.clip((x - 960) / 1000, -1, 1); g = 1 / (1 + ((x - 960) / 800) ** 2)
place(engine(d, [(0, 45), (d, 38)], [(0, 1), (d, 1)]) * g.astype(np.float32), t0 + .1, .55, pan)
place(wind(6, [(0, .3), (6, .3)]), t0, .28)
place(murmur(4, 8, [(0, 0), (1, .5), (4, .6)]), t0 + 2, .2)
footsteps(t0 + 1.3, 4.5, 3.6, .2, panramp(6, .6, -.4)[0] if False else .0)

# 6 arafat (33-40)
t0 = 33
place(wind(7, [(0, .3), (7, .4)]), t0, .3)
place(murmur(7, 18, [(0, 0), (1.5, .6), (5.5, .8), (7, .3)]), t0, .5)
place(reverb(murmur(7, 10, [(0, 0), (2, .4), (6, .5), (7, .1)])), t0, .22)

# 7 muzdalifah (40-46)
t0 = 40
place(crickets(6, [(0, 0), (.8, .8), (5, .8), (6, .3)]), t0, .22)
place(wind(6, [(0, .35), (6, .25)]), t0, .22)
place(murmur(6, 8, [(0, 0), (1, .3), (5, .3), (6, 0)]), t0, .12)
for j in range(7):
    m = 1
    while True:
        s = (m - j * .29) / .75; m += 1
        if s > 5.8: break
        if s > .5:
            place(cloth_thud(), t0 + s, .35, 0)
            place(tak(1300) * .3, t0 + s - .2, .12, -.2)

# 8 jamarat (46-52)
t0 = 46
place(wind(6, [(0, .2), (6, .2)]), t0, .16)
place(murmur(6, 14, [(0, 0), (1, .45), (5, .45), (6, 0)]), t0, .35)
xs = [1250, 1370, 1490, 1610, 1730, 690, 570, 450]
for i, x in enumerate(xs):
    m = 0
    while True:
        s = 2.6 * m - i * .37; m += 1
        if s > 5.4: break
        if s > .2:
            place(throw_whoosh(), t0 + s, .35, (x - 960) / 960 * .8)
            place(tak(1700 + 90 * i), t0 + s + .9, .55, .02)
            place(thump(.15, 120, 100, 900), t0 + s + .9, .2, .02)

# 9 tawaf (52-59)
t0 = 52
place(reverb(murmur(7, 16, [(0, 0), (1, .5), (6, .6), (7, 0)])), t0, .42)
place(wind(7, [(0, .15), (7, .15)]), t0, .12)
footsteps(t0 + .5, 6.2, 5.5, .06, 0, .5)

# 10 tashreeq (59-66)
t0 = 59
ph = tt(7) / 7 * 3; nt = np.clip((.5 - .5 * np.cos(2 * np.pi * ph)) * 1.6 - .25, 0, 1).astype(np.float32)
place(crickets(7, [(0, 0), (7, 1)]) * nt, t0, .22)
place(wind(7, [(0, .3), (7, .3)]) * (1 - .6 * nt), t0, .2)
place(murmur(7, 10, [(0, .4), (7, .4)]) * (1 - nt), t0, .14)
for day in range(3):
    footsteps(t0 + day * 7 / 3, 1.7, 5, .12, 0, .5)

# 11 back to lodging (66-72)
t0 = 66
u = tt(2.6) / 2.6; arr = 1 - (1 - np.clip(u / (2.4 / 2.6), 0, 1)) ** 3
place(engine(2.6, [(0, 55), (2.4, 30), (2.6, 28)], [(0, 0), (1.2, 1), (2.6, .6)]), t0, .5, (.9 - .8 * arr))
place(hiss(1.1, 2200), t0 + 2.4, .45, .15)
place(wind(6, [(0, .2), (6, .2)]), t0, .15)
footsteps(t0 + 2.7, 3.2, 3.4, .2, -.3)

# 12 depart (72-77)
t0 = 72
footsteps(t0 + .3, 3.6, 3.8, .2, .2)
place(sweep(3.6, 400, 900, .8) * ramp(3.6, [(0, 0), (.4, .35), (3.2, .35), (3.6, 0)]), t0 + .3, .12, .3)  # rolling luggage
place(hiss(.6, 3000), t0 + 3.7, .35, -.1)
d = 1.5; u = tt(d) / d; pan = (.1 - 1.1 * eio(u)).astype(np.float32)
place(engine(d, [(0, 30), (d, 62)], [(0, .7), (.4, 1), (d, .1)]), t0 + 3.8, .55, pan)

# 13 flight home (77-84)
t0 = 77
place(jet(3, [(0, .4), (1.2, 1), (3, .35)], whine=2500, wlvl=.45, rumble=1.3), t0, .5, panramp(3, -.7, -.2))
place(jet(4.5, [(0, .45), (1.5, .4), (4.5, .1)], whine=2100, wlvl=.25, rumble=.6), t0 + 2.6, .22, panramp(4.5, -.2, .6))

# 14 outro
place(chime(), 85.1, .7)
place(bell(1046.5, 3.5) * .5, 86.4, .35)

# ---------- real recordings (Talbiyah / Takbeer clips cut by cut_chants.py) ----------
CLIPS = [  # file, start time (s), gain
    ('talbiyah_airport', 12.8, .9), ('talbiyah_bus', 19.7, .5), ('talbiyah_mina', 27.5, .85),
    ('talbiyah_arafat', 33.6, .95), ('talbiyah_muzdalifah', 40.7, .5),
    ('takbeer_jamarat', 46.5, .9), ('takbeer_tashreeq', 59.8, .7), ('takbeer_return', 66.6, .5),
]
for name, t, g in CLIPS:
    fp = os.path.join(HERE, 'external', 'clips', name + '.flac')
    if not os.path.exists(fp):
        print('missing clip', fp); continue
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', fp, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True).stdout
    a = np.frombuffer(raw, np.float32).reshape(-1, 2)
    i = int(t * SR); n = min(len(a), N - i)
    L[i:i + n] += a[:n, 0] * g; R[i:i + n] += a[:n, 1] * g

# ---------- write ----------
p999 = float(np.percentile(np.abs(np.concatenate([L, R])), 99.9))
k = .6 / p999
st = (np.tanh(np.stack([L, R], 1) * k) * .95 * 32767).astype('<i2')
out = os.path.join(HERE, 'sfx-track.wav')
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())
print('wrote', out, 'p99.9', round(p999, 2))
