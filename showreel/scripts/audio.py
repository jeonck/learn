"""15초 쇼릴 사운드트랙 — numpy만으로 합성한다.

영상과 같은 src/timeline.json의 BPM·큐(임팩트, 타이핑, 휘시, 라이저, 정적)를 읽어
모든 소리가 화면의 사건과 같은 샘플에 떨어지게 한다.

    python3 scripts/audio.py            → out/audio.wav (48kHz, 16bit, 스테레오)
"""
import json
import os
import wave

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TL = json.load(open(os.path.join(ROOT, "src/timeline.json"), encoding="utf-8"))
CUE = TL["cues"]

SR = 48000
DUR = TL["duration"]
N = int(DUR * SR)
BEAT = 60 / TL["bpm"]
rng = np.random.default_rng(128)


def b(n):
    return n * BEAT


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


# ───────────────────────── buses (L, R)
BUS = {k: np.zeros((2, N)) for k in ("drums", "bass", "music", "fx", "ui")}
SEND = {k: np.zeros((2, N)) for k in ("short", "long")}


def put(bus, sig, t0, gain=1.0, pan=0.0, send=None, send_amt=0.0):
    """sig(모노 또는 2채널)를 t0초 위치에 더한다. pan: -1(좌)~1(우)"""
    i0 = int(round(t0 * SR))
    if sig.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        sig = np.stack([sig * l, sig * r]) * np.sqrt(2)
    s0 = max(0, -i0)
    i0 = max(0, i0)
    n = min(sig.shape[1] - s0, N - i0)
    if n <= 0:
        return
    seg = sig[:, s0 : s0 + n] * gain
    BUS[bus][:, i0 : i0 + n] += seg
    if send:
        SEND[send][:, i0 : i0 + n] += seg * send_amt


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def noise(dur):
    return rng.standard_normal(int(dur * SR))


def onepole_lp(x, fc):
    """고정 컷오프 1극 저역통과 (FFT 영역에서 적용 — 루프 없음)"""
    n = len(x)
    f = np.fft.rfftfreq(n * 2, 1 / SR)
    H = 1 / np.sqrt(1 + (f / fc) ** 2)
    return np.fft.irfft(np.fft.rfft(x, n * 2) * H)[:n]


def bandpass(x, lo, hi):
    n = len(x)
    f = np.fft.rfftfreq(n * 2, 1 / SR)
    H = ((f >= lo) & (f <= hi)).astype(float)
    H = np.convolve(H, np.hanning(31) / np.hanning(31).sum(), mode="same")
    return np.fft.irfft(np.fft.rfft(x, n * 2) * H)[:n]


def sweep_filter(x, center_fn, q=1.2, block=2048):
    """시간에 따라 중심 주파수가 움직이는 밴드패스 (overlap-add)"""
    hop = block // 4
    win = np.hanning(block)
    out = np.zeros(len(x) + block)
    xp = np.concatenate([x, np.zeros(block)])
    f = np.fft.rfftfreq(block, 1 / SR)
    for s in range(0, len(x), hop):
        fc = center_fn(s / SR)
        H = np.exp(-0.5 * (np.log2(np.maximum(f, 1) / fc) / (0.5 / q)) ** 2)
        out[s : s + block] += np.fft.irfft(np.fft.rfft(xp[s : s + block] * win) * H) * win
    return out[: len(x)] / 1.5


def saw_additive(freq, t, bright=1.0, max_h=40):
    """대역 제한 톱니파: 배음 가중치로 필터를 흉내 (bright는 스칼라 또는 시간배열)"""
    y = np.zeros_like(t)
    bright = np.broadcast_to(np.asarray(bright, dtype=float), t.shape)
    for k in range(1, max_h + 1):
        fk = freq * k
        if fk > 16000:
            break
        cutoff = 200 + bright * 5000
        w = 1 / np.sqrt(1 + (fk / cutoff) ** 4)
        y += np.sin(2 * np.pi * fk * t + k * 0.3) * w / k
    return y


def adsr(n, a=0.005, d=0.1, s=0.6, r=0.1, total=None):
    total = total or n / SR
    t = np.arange(n) / SR
    env = np.where(t < a, t / a, s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    rel_start = total - r
    env *= np.where(t > rel_start, np.clip(1 - (t - rel_start) / r, 0, 1), 1)
    return env


# ───────────────────────── instruments
def kick(gain=1.0, t0=0.0, punch=1.0):
    t = tt(0.55)
    f = 42 + 130 * np.exp(-t * 32) * punch + 25 * np.exp(-t * 8)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 6.5)
    body = np.tanh(body * 1.8)
    click = onepole_lp(noise(0.55), 3200) * np.exp(-t * 300) * 0.35
    put("drums", body + click, t0, gain * 0.95)


def clap(t0, gain=1.0):
    t = tt(0.35)
    n = bandpass(noise(0.35), 900, 4200)
    env = np.zeros_like(t)
    for d in (0.0, 0.011, 0.022):
        env += np.where(t >= d, np.exp(-(t - d) * 180), 0)
    env += np.where(t >= 0.03, np.exp(-(t - 0.03) * 14) * 0.5, 0)
    put("drums", n * env, t0, gain * 0.55, pan=0.05, send="short", send_amt=0.35)


def hat(t0, gain=1.0, open_=False, pan=0.25):
    dur = 0.25 if open_ else 0.06
    t = tt(dur)
    n = np.diff(noise(dur + 1 / SR))
    n = bandpass(n, 7000, 16000)
    put("drums", n * np.exp(-t * (14 if open_ else 70)), t0, gain * 0.28, pan=pan)


def snare(t0, gain=1.0, pan=0.0):
    t = tt(0.3)
    tone = np.sin(2 * np.pi * 185 * t) * np.exp(-t * 30)
    n = bandpass(noise(0.3), 1200, 9000) * np.exp(-t * 22)
    put("drums", tone * 0.6 + n, t0, gain * 0.5, pan=pan, send="short", send_amt=0.3)


def bass_note(t0, dur, midi, gain=1.0):
    t = tt(dur)
    f = mtof(midi)
    bright = 0.05 + 0.35 * np.exp(-t * 9)
    y = saw_additive(f, t, bright, 24) + 0.6 * np.sin(2 * np.pi * f * t)
    put("bass", y * adsr(len(t), 0.004, 0.2, 0.75, 0.05), t0, gain * 0.5)


def pad_chord(t0, dur, notes, gain=1.0, bright=0.12, attack=0.4):
    t = tt(dur)
    y = np.zeros((2, len(t)))
    for i, m in enumerate(notes):
        for det, pan in ((-0.09, -0.6), (0.0, 0.0), (0.08, 0.6)):
            f = mtof(m + det)
            v = saw_additive(f, t + i * 0.37, bright, 18)
            l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
            y[0] += v * l
            y[1] += v * r
    env = adsr(len(t), attack, 1.0, 1.0, min(0.4, dur / 3))
    put("music", y * env / (len(notes) * 2.2), t0, gain, send="long", send_amt=0.5)


def stab(t0, notes, gain=1.0, dur=0.28, pan=0.0):
    t = tt(dur)
    y = np.zeros_like(t)
    for m in notes:
        for det in (-0.12, 0.12):
            y += saw_additive(mtof(m + det), t, 0.15 + 0.6 * np.exp(-t * 18), 28)
    env = np.exp(-t * 9) * np.minimum(1, t / 0.002)
    put("music", y * env / len(notes), t0, gain * 0.32, pan=pan, send="long", send_amt=0.35)


def pluck(t0, midi, gain=1.0, pan=0.0, decay=14):
    t = tt(0.35)
    f = mtof(midi)
    y = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) * np.exp(-t * 30)
    put("music", y * np.exp(-t * decay) * np.minimum(1, t / 0.001), t0, gain * 0.22, pan=pan,
        send="long", send_amt=0.45)


def tick(t0, freq=2600, gain=1.0, pan=0.0):
    t = tt(0.03)
    y = np.sin(2 * np.pi * freq * t) * np.exp(-t * 260)
    put("ui", y, t0, gain * 0.2, pan=pan, send="short", send_amt=0.25)


def whoosh(t0, dur, gain=1.0, up=True, pan_from=-0.8, pan_to=0.8):
    n = noise(dur)
    lo, hi = (500, 7000) if up else (7000, 500)
    y = sweep_filter(n, lambda s: lo * (hi / lo) ** min(1, s / dur), q=1.0)
    t = tt(dur)
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5
    y *= env
    pan = np.linspace(pan_from, pan_to, len(t))
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    put("fx", np.stack([y * l, y * r]) * 1.4, t0 - dur / 2, gain * 0.5, send="long", send_amt=0.3)


def riser(t_from, t_to, gain=1.0):
    dur = t_to - t_from
    t = tt(dur)
    n = sweep_filter(noise(dur), lambda s: 300 * (9000 / 300) ** (s / dur) ** 1.6, q=1.6)
    f = 180 * 2 ** (3 * (t / dur) ** 2)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25
    env = (t / dur) ** 2.2
    put("fx", (n + tone) * env, t_from, gain * 0.5, send="long", send_amt=0.4)


def impact(t0, power=1.0):
    t = tt(2.2)
    f = 55 * np.exp(-t * 1.2) + 28
    boom = np.tanh(2 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2))
    crack = onepole_lp(noise(2.2), 3500) * np.exp(-t * 11)
    air = bandpass(noise(2.2), 3000, 14000) * np.exp(-t * 3.5) * 0.25
    put("fx", boom * 0.9 + crack * 0.5 + air, t0, power * 0.75, send="long", send_amt=0.5)
    # 임팩트 직전 역방향 스웰 (반전된 노이즈 꼬리)
    rd = 0.45
    tr = tt(rd)
    rev = bandpass(noise(rd), 2000, 12000) * (tr / rd) ** 3
    put("fx", rev, t0 - rd, power * 0.3, send="long", send_amt=0.4)


def glitch_burst(t0, dur, gain=1.0):
    t = tt(dur)
    y = np.sign(np.sin(2 * np.pi * (800 + 2400 * rng.random()) * t))
    crush = np.repeat(noise(dur)[:: 60], 60)[: len(t)]
    chop = (np.floor(t * 70) % 2).astype(float)
    put("fx", (y * 0.4 + crush * 0.3) * chop * np.exp(-t * 6), t0, gain * 0.3,
        pan=float(rng.uniform(-0.5, 0.5)))


# ───────────────────────── arrangement (F단조)
CH = {
    "Fm": [53, 56, 60, 63],  # F Ab C Eb (Fm7)
    "Db": [49, 53, 56, 60],  # Db F Ab C (Dbmaj7)
    "Ab": [56, 60, 63, 67],
    "Eb": [51, 55, 58, 62],
    "Fm9": [53, 56, 60, 63, 67],
}
BASS_ROOT = {"Fm": 29, "Db": 25, "Ab": 32, "Eb": 27}
bars = ["Fm", "Db", "Fm", "Db", "Ab", "Eb", "Db", "Fm9"]

# 인트로 (b0–b8): 링이 퍼질 때마다 심장박동 같은 서브 킥, 패드, 타이핑 틱
for k in range(4):
    kick(0.55 if k else 0.8, b(k), punch=0.6)
pad_chord(0, b(4), CH["Fm"], gain=0.8, bright=0.06, attack=0.6)
pad_chord(b(4), b(4), CH["Db"], gain=0.9, bright=0.1, attack=0.2)
for k in range(4, 6):
    kick(0.6, b(k), punch=0.8)
for k in (6, 7):
    kick(0.9, b(k))
    for e in range(2):
        hat(b(k + e * 0.5 + 0.25), 0.6, pan=0.3)
# 문장 A/B/밴드/태그라인 글자마다 틱
for cue in CUE["typing"]:
    chars = list(cue["text"])
    j = 0
    for i, ch in enumerate(chars):
        if ch == " ":
            continue
        tick(b(cue["beat"]) + i * cue["stagger"], freq=2200 + 380 * (j % 5), gain=0.9,
             pan=-0.4 + 0.8 * i / max(1, len(chars) - 1))
        j += 1
# "움직일 때" 16분음표 홉
for i in range(4):
    pluck(b(5 + i * 0.25), [65, 68, 72, 75][i], 0.8, pan=-0.3 + 0.2 * i)
# 슬램 에코 8분음표
for k in range(4):
    stab(b(6 + k * 0.5), CH["Db"], gain=0.35 if k else 0.8, pan=(-0.3, 0.3)[k % 2])

# 메인 그루브 (b8–b24)
for bar in range(2, 6):
    c = bars[bar]
    for q in range(4):
        beat = bar * 4 + q
        kick(1.0, b(beat))
        if q in (1, 3):
            clap(b(beat))
        hat(b(beat + 0.5), 0.9, open_=(q == 3), pan=0.3)
        hat(b(beat + 0.25), 0.4, pan=-0.3)
        hat(b(beat + 0.75), 0.45, pan=-0.3)
        # 오프비트 베이스 (킥을 피해 사이드체인 느낌)
        bass_note(b(beat + 0.5), b(0.45), BASS_ROOT[c] + 12)
        bass_note(b(beat + 0.75), b(0.22), BASS_ROOT[c] + 12 + (7 if q % 2 else 0), 0.7)
    pad_chord(b(bar * 4), b(4), CH[c], gain=0.55, bright=0.18, attack=0.02)

# 01 키네틱 타이포: 밴드 등장 스탭
stab(b(9), CH["Fm"], 0.8)
stab(b(10), CH["Fm"], 0.5, pan=-0.3)
stab(b(10.75), CH["Fm"], 0.5, pan=0.3)
# 02 셰이프: 8분음표 모양 액션 = 펜타토닉 플럭 아르페지오
penta = [65, 68, 70, 72, 75, 77, 80]
for k in range(10):
    pluck(b(13 + k * 0.5), penta[(k * 3) % len(penta)] + (12 if k % 4 == 3 else 0), 0.9,
          pan=(-0.5, 0.5)[k % 2])
# 03 공간: 반짝이는 16분 아르페지오 + 긴 리버브
arp = [72, 75, 79, 84, 79, 75]
for k in range(16):
    pluck(b(16 + k * 0.25), arp[k % len(arp)], 0.45, pan=np.sin(k) * 0.7, decay=6)
pad_chord(b(16), b(4), [c + 12 for c in CH["Ab"]], gain=0.35, bright=0.3, attack=0.5)
# 04 데이터: 오도미터 틱 (카운트가 느려지듯 간격이 벌어진다)
for row in range(3):
    s0 = b(20) + 0.11 + row * 0.13
    tk = 0.0
    step = 0.018
    while tk < 1.0:
        tick(s0 + tk, freq=3400 - row * 500, gain=0.35 * (1 - tk), pan=-0.6)
        tk += step
        step *= 1.13
for i in range(12):
    pluck(b(20) + 0.25 + i * 0.04, 60 + i * 2, 0.35, pan=0.6)

# 05 몽타주 (b24–b28): 컷마다 스탭 + 스네어, 스터터
for i in range(6):
    t0 = b(24 + i * 0.5)
    kick(1.0, t0)
    stab(t0, CH["Db"] if i < 4 else CH["Eb"], 0.85, pan=(-0.25, 0.25)[i % 2])
    snare(t0 + b(0.25), 0.5)
    hat(t0 + b(0.25), 0.6, pan=0.3)
for i in range(4):
    bass_note(b(24 + i), b(0.9), BASS_ROOT["Db" if i < 2 else "Eb"] + 12)
for k in range(3):
    t0 = b(27 + k * 0.25)
    kick(1.1, t0)
    snare(t0, 0.8 + 0.2 * k)
    stab(t0, [n + k for n in CH["Eb"]], 1.0)

# 06 엔드 카드 (b28–): 최종 코드 + 로고 마크 플럭
pad_chord(b(28), DUR - b(28), CH["Fm9"], gain=1.0, bright=0.22, attack=0.01)
bass_note(b(28), DUR - b(28), 29, 1.1)
kick(1.2, b(28))
for i, m in enumerate([72, 79, 84]):
    pluck(b(29) + i * 0.08, m, 1.0, pan=(-0.4, 0, 0.4)[i])
whoosh(b(29.5) + 0.2, 0.45, 0.35, up=True, pan_from=-0.5, pan_to=0.5)
for i in range(0, 40, 3):
    tick(b(30.4) + i * (b(0.7) / 40), freq=4200, gain=0.35, pan=0.2)

# 공용 큐
for im in CUE["impacts"]:
    impact(b(im["beat"]), im["power"])
for w in CUE["whooshes"]:
    whoosh(b(w["beat"]), w["len"], 0.9, up=w["beat"] % 8 != 0)
for r in CUE["risers"]:
    riser(b(r["from"]), b(r["to"]), 0.9)
for g in CUE["glitches"]:
    glitch_burst(b(g["beat"]) - 0.06, g["len"], 1.0)
for i in range(1, 6):
    glitch_burst(b(24 + i * 0.5), 0.05, 0.5)


# ───────────────────────── reverb (합성 IR 컨볼루션)
def make_ir(dur, decay, lp):
    t = tt(dur)
    ir = np.stack([onepole_lp(noise(dur), lp), onepole_lp(noise(dur), lp)]) * np.exp(-t / decay)
    ir[:, : int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
    return ir / np.sqrt((ir ** 2).sum() / 2)


def convolve(x, ir):
    n = x.shape[1] + ir.shape[1]
    nfft = 1 << (n - 1).bit_length()
    out = np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)
    return out[:, : x.shape[1]]


wet = convolve(SEND["short"], make_ir(0.6, 0.12, 7000)) * 0.35 + convolve(
    SEND["long"], make_ir(2.8, 0.7, 5000)
) * 0.3

# ───────────────────────── mix + 사이드체인
kick_times = [b(k) for k in range(6, 28)] + [b(28)]
duck = np.ones(N)
t_all = np.arange(N) / SR
for kt in kick_times:
    i0 = int(kt * SR)
    seg = t_all[i0 : i0 + int(0.3 * SR)] - kt
    duck[i0 : i0 + len(seg)] = np.minimum(duck[i0 : i0 + len(seg)], 1 - 0.6 * np.exp(-seg / 0.09))

mix = (
    BUS["drums"] * 1.0
    + BUS["bass"] * duck * 0.9
    + BUS["music"] * duck * 0.8
    + BUS["fx"] * 0.9
    + BUS["ui"] * 1.0
    + wet * duck * 0.9
)

# 정적의 16분음표 (b27.75–b28): 완전한 무음
for g in CUE["gaps"]:
    i0, i1 = int(b(g["from"]) * SR), int(b(g["to"]) * SR)
    ramp = int(0.004 * SR)
    mix[:, i0 - ramp : i0] *= np.linspace(1, 0, ramp)
    mix[:, i0:i1] = 0

# 마스터: 소프트 클립 → 정규화 → 영상과 같은 페이드아웃
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix /= np.max(np.abs(mix)) / 0.89
fade_start = DUR - 0.45
fi = int(fade_start * SR)
mix[:, fi:] *= np.cos(np.linspace(0, np.pi / 2, N - fi)) ** 2

out = os.path.join(ROOT, "out/audio.wav")
os.makedirs(os.path.dirname(out), exist_ok=True)
pcm = (np.clip(mix.T, -1, 1) * 32767).astype("<i2")
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print(f"{out}  {DUR:.1f}s  peak {np.max(np.abs(mix)):.2f}")
