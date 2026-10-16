#!/usr/bin/env python3
"""Cuts scene-sized clips (snapped to quiet points, with fades) out of the Talbiyah and Takbeer recordings.
usage: cut_chants.py talbiyah.mp3 takbeer.mp3"""
import subprocess, sys, os
import numpy as np

SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'external', 'clips')
os.makedirs(OUT, exist_ok=True)


def load(fp):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', fp, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2)


def envelope(a, hop=.02):
    m = a.mean(1); h = int(hop * SR); n = len(m) // h
    e = np.sqrt((m[:n * h].reshape(n, h) ** 2).mean(1))
    k = np.ones(5) / 5
    return np.convolve(e, k, 'same')


def snap(env, t, win, hop=.02):
    i0 = max(0, int((t - win) / hop)); i1 = min(len(env), int((t + win) / hop))
    return (i0 + int(np.argmin(env[i0:i1]))) * hop


# name, source, source start (s), length (s)
CUTS = [
    ('talbiyah_airport', 'tal', 150, 6.2), ('talbiyah_bus', 'tal', 330, 6.5), ('talbiyah_mina', 'tal', 520, 5.6),
    ('talbiyah_arafat', 'tal', 700, 6.4), ('talbiyah_muzdalifah', 'tal', 880, 5.0),
    ('takbeer_jamarat', 'tak', 2, 5.2), ('takbeer_tashreeq', 'tak', 16, 5.6), ('takbeer_return', 'tak', 30, 4.5),
]
src = {'tal': load(sys.argv[1]), 'tak': load(sys.argv[2])}
envs = {k: envelope(v) for k, v in src.items()}
for name, s, t0, ln in CUTS:
    a, e = src[s], envs[s]
    st = snap(e, t0, 1.5); en = snap(e, st + ln, 1.0)
    c = a[int(st * SR):int(en * SR)].copy()
    f = int(.35 * SR); c[:f] *= np.linspace(0, 1, f)[:, None]; c[-f:] *= np.linspace(1, 0, f)[:, None]
    rms = np.sqrt((c ** 2).mean()); c *= .16 / rms
    fp = os.path.join(OUT, name + '.flac')
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', fp], input=c.astype('<f4').tobytes())
    print(name, f'{st:.2f}-{en:.2f}s', f'({en - st:.1f}s)')
