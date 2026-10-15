"""Synthesise a royalty-free bed + UI sound effects synced to the timeline.

Usage: python3 audio.py <sfx.json> <out.wav>
"""
import json
import sys
import wave

import numpy as np

SR = 44100
rng = np.random.default_rng(7)


def env(n, a=.01, r=.3):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / r)
    return e


def tone(f, dur, a=.005, r=.25, kind='sine'):
    n = int(dur * SR)
    t = np.arange(n) / SR
    w = np.sin(2 * np.pi * f * t)
    if kind == 'tri':
        w = 2 / np.pi * np.arcsin(w)
    return w * env(n, a, r)


def noise_sweep(dur, f0, f1, amp=1.0):
    n = int(dur * SR)
    x = rng.standard_normal(n)
    # one-pole lowpass with a moving cutoff
    fc = np.geomspace(f0, f1, n)
    alpha = 1 - np.exp(-2 * np.pi * fc / SR)
    y = np.zeros(n)
    acc = 0.0
    for i in range(n):
        acc += alpha[i] * (x[i] - acc)
        y[i] = acc
    shape = np.sin(np.pi * np.linspace(0, 1, n)) ** 2
    return y / (np.abs(y).max() + 1e-9) * shape * amp


def mx(*parts):
    """Sum signals of different lengths."""
    out = np.zeros(max(len(p) for p in parts))
    for p in parts:
        out[:len(p)] += p
    return out


SFX = {
    'whoosh': lambda: noise_sweep(.45, 300, 5000, .28),
    'click': lambda: mx(tone(1800, .05, .001, .012) * .35, tone(900, .06, .001, .02) * .2),
    'tick': lambda: tone(1320, .08, .001, .03) * .25,
    'pop': lambda: mx(tone(880, .18, .002, .06, 'tri') * .3, tone(1320, .12, .002, .04) * .15),
    'type': lambda: np.concatenate([np.pad(tone(2400 + 300 * (k % 3), .03, .001, .008) * .12, (0, int(.055 * SR))) for k in range(10)]),
    'ding': lambda: mx(tone(1568, 1.0, .002, .35) * .25, tone(2349, .8, .002, .25) * .12),
    'success': lambda: np.concatenate([tone(784, .14, .002, .1) * .25, tone(988, .14, .002, .1) * .25, tone(1319, .6, .002, .3) * .3]),
    'hit': lambda: mx(tone(55, .9, .002, .35) * .55, noise_sweep(.5, 4000, 300, .18)),
}


def music(dur):
    """Warm pad + soft pluck arpeggio, 100 bpm, Am - F - C - G."""
    n = int(dur * SR)
    out = np.zeros(n + SR * 3)
    beat = 60 / 100
    bar = beat * 4
    chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
    mf = lambda m: 440 * 2 ** ((m - 69) / 12)
    t = 0.0
    k = 0
    while t < dur:
        ch = chords[k % 4]
        i0 = int(t * SR)
        # pad
        for m in ch:
            p = tone(mf(m), bar + .8, .5, 1.6, 'tri') * .045
            p += tone(mf(m) * 1.003, bar + .8, .5, 1.6) * .03
            out[i0:i0 + len(p)] += p
        bass = tone(mf(ch[0] - 12), bar, .02, .9) * .12
        out[i0:i0 + len(bass)] += bass
        # arpeggio eighths
        arp = ch + [ch[1] + 12]
        for j in range(8):
            ti = int((t + j * beat / 2) * SR)
            pl = tone(mf(arp[j % 4] + 12), .4, .003, .12) * .05
            out[ti:ti + len(pl)] += pl
        # soft kick on beats 1 and 3, shaker on off-beats
        for j in (0, 2):
            ti = int((t + j * beat) * SR)
            kd = int(.25 * SR)
            tt = np.arange(kd) / SR
            kick = np.sin(2 * np.pi * (50 + 90 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 12) * .22
            out[ti:ti + kd] += kick
        for j in range(4):
            ti = int((t + j * beat + beat / 2) * SR)
            sh = rng.standard_normal(int(.05 * SR)) * env(int(.05 * SR), .002, .015) * .025
            out[ti:ti + len(sh)] += sh
        t += bar
        k += 1
    out = out[:n]
    fade = int(2.5 * SR)
    out[-fade:] *= np.linspace(1, 0, fade)
    out[:int(.6 * SR)] *= np.linspace(0, 1, int(.6 * SR))
    return out


def main():
    data = json.load(open(sys.argv[1]))
    dur = data['dur']
    n = int(dur * SR)
    mix = music(dur)
    fx = np.zeros(n + SR * 3)
    for e in data['sfx']:
        s = SFX[e['type']]()
        i = int(e['t'] * SR)
        fx[i:i + len(s)] += s
    mix = mix + fx[:n] * .9
    mix /= max(1.0, np.abs(mix).max() / .89)
    st = np.stack([mix, mix], 1)
    pcm = (st * 32767).astype('<i2')
    with wave.open(sys.argv[2], 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


if __name__ == '__main__':
    main()
