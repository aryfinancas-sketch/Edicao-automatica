"""Compõe a trilha original dos vídeos: eletrônica corporativa leve e otimista
(110 BPM, I-V-vi-IV em Dó), feita só com síntese, sem amostras de terceiros.

Uso: python3 compor_trilha.py saida.wav --versao vsl|curtos [--compassos N]

vsl:    começa contida (pad + arpejo) e abre com batida e baixo no compasso 9;
        pausa da batida no meio e volta.
curtos: batida desde o início, para prender nos primeiros segundos.
"""
import argparse
import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt
import wave

SR = 44100
BPM = 110
BATIDA = 60 / BPM
COMPASSO = 4 * BATIDA
rng = np.random.default_rng(7)

# I - V - vi - IV em Dó (notas MIDI)
ACORDES = [
    [48, 55, 60, 64, 67],   # C
    [43, 55, 59, 62, 67],   # G
    [45, 57, 60, 64, 69],   # Am
    [41, 53, 57, 60, 65],   # F
]
BAIXOS = [36, 31, 33, 29]


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def filtro(x, tipo, freq, ordem=2):
    sos = butter(ordem, freq, btype=tipo, fs=SR, output='sos')
    return sosfilt(sos, x)


def envelope(n, ataque, decaimento, sustentacao=0.0, liberacao=0.0):
    t = np.arange(n) / SR
    env = np.where(t < ataque, t / max(ataque, 1e-4), sustentacao + (1 - sustentacao) * np.exp(-(t - ataque) / max(decaimento, 1e-4)))
    if liberacao > 0:
        fim = int(liberacao * SR)
        if fim < n:
            env[-fim:] *= np.linspace(1, 0, fim)
    return env


def serra(f, n, desafinar=0.0):
    t = np.arange(n) / SR
    fase = (f * (1 + desafinar) * t) % 1.0
    return 2 * fase - 1


def colocar(trilha, sinal, inicio):
    i = int(inicio * SR)
    if i >= trilha.shape[-1]:
        return
    fim = min(trilha.shape[-1], i + sinal.shape[-1])
    trilha[..., i:fim] += sinal[..., : fim - i]


def pad(acorde, dur, brilho):
    n = int(dur * SR)
    s = np.zeros(n)
    for m in acorde[1:]:
        for d in (-0.004, 0.0, 0.005):
            s += serra(hz(m), n, d)
    s = filtro(s, 'lowpass', brilho)
    return s * envelope(n, 0.35, 10, 0.85, 0.4) * 0.05


def pluck(m, dur=0.35):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = hz(m)
    s = 0.7 * np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t) + 0.1 * serra(f, n)
    return filtro(s * envelope(n, 0.003, 0.11), 'lowpass', 4500) * 0.16


def bumbo():
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    f = 45 + 85 * np.exp(-t * 28)
    fase = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(fase) * envelope(n, 0.001, 0.12) * 0.55


def palma():
    n = int(0.22 * SR)
    ruido = rng.standard_normal(n)
    s = filtro(ruido, 'bandpass', [900, 2600]) * envelope(n, 0.002, 0.06)
    return s * 0.22


def chimbal(aberto=False):
    n = int((0.18 if aberto else 0.06) * SR)
    s = filtro(rng.standard_normal(n), 'highpass', 7000) * envelope(n, 0.001, 0.05 if aberto else 0.015)
    return s * (0.07 if aberto else 0.05)


def baixo(m, dur):
    n = int(dur * SR)
    f = hz(m)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) + 0.25 * filtro(serra(f, n), 'lowpass', 400)
    return s * envelope(n, 0.005, 0.18, 0.5, 0.03) * 0.22


def reverb(x, segundos=1.8, mistura=0.22):
    n = int(segundos * SR)
    ir = rng.standard_normal((2, n)) * np.exp(-np.arange(n) / SR * (6.9 / segundos))
    ir = filtro(ir, 'lowpass', 6000)
    ir /= np.abs(ir).sum(axis=1, keepdims=True) ** 0.5 * 30
    molhado = np.stack([fftconvolve(x[c], ir[c])[: x.shape[1]] for c in range(2)])
    return x + mistura * molhado


def eco(x, atraso, ganho=0.35, repeticoes=4):
    y = x.copy()
    d = int(atraso * SR)
    for k in range(1, repeticoes + 1):
        canal = k % 2  # alterna esquerda/direita
        y[canal, d * k:] += x[1 - canal, : -d * k] * ganho ** k
    return y


def compor(versao, compassos):
    total = compassos * COMPASSO + 3
    n = int(total * SR)
    harmonia = np.zeros((2, n))
    ritmo = np.zeros((2, n))
    graves = np.zeros((2, n))

    inicio_batida = 8 if versao == 'vsl' else 1
    pausa = range(24, 28) if versao == 'vsl' else range(20, 22)
    ultimo = compassos - 2

    for c in range(compassos):
        t0 = c * COMPASSO
        acorde = ACORDES[c % 4]
        brilho = 900 + min(1, c / max(1, inicio_batida)) * 1800
        p = pad(acorde, COMPASSO + 0.4, brilho)
        colocar(harmonia, np.stack([p, p]), t0)

        # Arpejo em colcheias (sobe e desce nas notas do acorde)
        notas = [acorde[2], acorde[3], acorde[4], acorde[3] + 12, acorde[4], acorde[3], acorde[2] + 12, acorde[4]]
        for k, m in enumerate(notas):
            if versao == 'vsl' and c < 2 and k % 2:
                continue
            pl = pluck(m)
            esq, dir_ = (0.75, 1.0) if k % 2 else (1.0, 0.75)
            colocar(harmonia, np.stack([pl * esq, pl * dir_]), t0 + k * BATIDA / 2)

        com_batida = inicio_batida <= c < ultimo + 1 and c not in pausa
        if com_batida:
            for b in range(4):
                colocar(ritmo, np.stack([bumbo()] * 2), t0 + b * BATIDA)
                colocar(ritmo, np.stack([chimbal()] * 2) * np.array([[0.8], [1.0]]), t0 + b * BATIDA + BATIDA / 2)
                if b in (1, 3):
                    colocar(ritmo, np.stack([palma()] * 2), t0 + b * BATIDA)
            if c % 4 == 3:
                colocar(ritmo, np.stack([chimbal(True)] * 2), t0 + 3.5 * BATIDA)
            for k in range(8):
                bx = baixo(BAIXOS[c % 4] + (12 if k in (3, 7) else 0), BATIDA / 2)
                colocar(graves, np.stack([bx, bx]), t0 + k * BATIDA / 2)
        elif versao == 'vsl' and c == inicio_batida - 1:
            # Subida de ruído antes da batida entrar
            nn = int(COMPASSO * SR)
            sub = filtro(rng.standard_normal(nn), 'highpass', 2000) * np.linspace(0, 1, nn) ** 2 * 0.06
            colocar(ritmo, np.stack([sub, sub]), t0)

    # "Respiro" (sidechain): harmonia e baixo abaixam a cada bumbo.
    batidas = np.arange(n) / SR % BATIDA
    respiro = 1 - 0.45 * np.exp(-batidas / 0.09)
    ativo = np.zeros(n)
    for c in range(compassos):
        if inicio_batida <= c < ultimo + 1 and c not in pausa:
            ativo[int(c * COMPASSO * SR): int((c + 1) * COMPASSO * SR)] = 1
    ativo = np.convolve(ativo, np.ones(2000) / 2000, mode='same')
    respiro = 1 - (1 - respiro) * ativo

    harmonia = eco(harmonia, BATIDA * 0.75)
    mix = reverb(harmonia * respiro) + reverb(ritmo, 1.2, 0.08) + graves * respiro
    mix = filtro(mix, 'highpass', 30)
    # Final: fade suave
    fim = int(3.5 * SR)
    mix[:, -fim:] *= np.linspace(1, 0, fim) ** 1.5
    mix /= np.abs(mix).max() * 1.12
    return mix


def salvar(arq, mix):
    dados = (np.clip(mix.T, -1, 1) * 32767).astype('<i2')
    with wave.open(arq, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(dados.tobytes())


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('saida')
    ap.add_argument('--versao', choices=['vsl', 'curtos'], default='vsl')
    ap.add_argument('--compassos', type=int, default=None)
    a = ap.parse_args()
    compassos = a.compassos or (60 if a.versao == 'vsl' else 32)
    salvar(a.saida, compor(a.versao, compassos))
