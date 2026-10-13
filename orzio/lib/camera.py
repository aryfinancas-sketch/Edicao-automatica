"""Câmera virtual sobre os prints do app: zoom e movimento suaves, destaque
verde no elemento citado e toque discreto. Gera um MP4 a partir de um JSON.

Uso: python3 camera.py especificacao.json

{
  "saida": "clip.mp4", "fps": 30, "canvas": [1080, 1920],
  "caixa": [40, 310, 1000, 1080], "raio": 28, "moldura": true,
  "fusao": 8,
  "planos": [
    {"imagem": "tela.jpg", "quadros": 90,
     "de": [cx, cy, largura], "para": [cx, cy, largura],
     "destaque": [x, y, w, h] | null, "toque": [x, y] | null}
  ]
}
As coordenadas são em pixels do print. A altura do enquadramento sai da
proporção da caixa. Planos seguidos se misturam numa fusão de "fusao" quadros.
"""
import json
import math
import subprocess
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFilter

VERDE = (16, 185, 129)


def suave(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def fundo(w, h):
    img = Image.new('RGB', (w, h), (7, 11, 10))
    topo = Image.new('RGB', (w, h), (11, 21, 18))
    mascara = Image.linear_gradient('L').resize((w, h))
    img = Image.composite(img, topo, mascara)
    brilho = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(brilho)
    r = int(w * 0.75)
    d.ellipse([w // 2 - r, -int(r * 0.9), w // 2 + r, int(r * 0.9)], fill=70)
    brilho = brilho.filter(ImageFilter.GaussianBlur(w // 6))
    verde = Image.new('RGB', (w, h), (6, 78, 59))
    return Image.composite(verde, img, brilho)


def mascara_arredondada(w, h, raio):
    m = Image.new('L', (w, h), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, w - 1, h - 1], radius=raio, fill=255)
    return m


def enquadrar(img, centro, bw, bh):
    cx, cy, largura = centro
    altura = largura * bh / bw
    x0, y0 = cx - largura / 2, cy - altura / 2
    # Mantém o enquadramento dentro do print sempre que ele couber.
    iw, ih = img.size
    if largura <= iw:
        x0 = max(0.0, min(x0, iw - largura))
    if altura <= ih:
        y0 = max(0.0, min(y0, ih - altura))
    else:
        y0 = (ih - altura) / 2
    quadro = img.transform((bw, bh), Image.EXTENT, (x0, y0, x0 + largura, y0 + altura),
                           Image.BICUBIC, fillcolor=(0, 0, 0))
    if largura < bw:  # ampliação: devolve um pouco de nitidez
        quadro = quadro.filter(ImageFilter.UnsharpMask(radius=1.4, percent=55, threshold=2))
    escala = bw / largura
    return quadro, (x0, y0, escala)


def mapear(transf, x, y):
    x0, y0, e = transf
    return (x - x0) * e, (y - y0) * e


def interpolar(a, b, p):
    return [a[i] + (b[i] - a[i]) * p for i in range(3)]


def desenhar_plano(plano, img, f, bw, bh):
    n = plano['quadros']
    t = f / max(1, n - 1)
    p = suave((t - 0.06) / 0.72)
    centro = interpolar(plano['de'], plano.get('para') or plano['de'], p)
    centro[2] /= 1 + 0.025 * t  # leve aproximação contínua
    quadro, transf = enquadrar(img, centro, bw, bh)
    camada = Image.new('RGBA', (bw, bh), (0, 0, 0, 0))

    dst = plano.get('destaque')
    if dst:
        alfa = suave((t - 0.22) / 0.18)
        if alfa > 0:
            x, y, w, h = dst
            ax, ay = mapear(transf, x - 8, y - 8)
            bx, by = mapear(transf, x + w + 8, y + h + 8)
            brilho = Image.new('RGBA', (bw, bh), (0, 0, 0, 0))
            ImageDraw.Draw(brilho).rounded_rectangle([ax, ay, bx, by], radius=18, outline=VERDE + (int(200 * alfa),), width=12)
            brilho = brilho.filter(ImageFilter.GaussianBlur(10))
            camada = Image.alpha_composite(camada, brilho)
            linha = Image.new('RGBA', (bw, bh), (0, 0, 0, 0))
            ImageDraw.Draw(linha).rounded_rectangle([ax, ay, bx, by], radius=16, outline=VERDE + (int(255 * alfa),), width=4)
            camada = Image.alpha_composite(camada, linha)

    toque = plano.get('toque')
    if toque:
        ini, fim = plano.get('toque_janela', [0.45, 0.8])
        if ini <= t <= fim + 0.15:
            k = (t - ini) / max(0.01, fim - ini)
            alfa = min(1.0, k * 4) * (1 - suave((t - fim) / 0.15))
            pressao = 0.8 if 0.35 < k < 0.7 else 1.0
            tx, ty = mapear(transf, *toque)
            r = 26 * pressao
            ImageDraw.Draw(camada).ellipse([tx - r, ty - r, tx + r, ty + r],
                                           fill=(255, 255, 255, int(90 * alfa)),
                                           outline=(255, 255, 255, int(230 * alfa)), width=3)
            if 0.35 < k < 1.2:
                onda = 26 + 40 * min(1, (k - 0.35) / 0.6)
                ImageDraw.Draw(camada).ellipse([tx - onda, ty - onda, tx + onda, ty + onda],
                                               outline=VERDE + (int(160 * alfa * (1 - min(1, (k - 0.35) / 0.6))),), width=4)
    return Image.alpha_composite(quadro.convert('RGBA'), camada).convert('RGB')


def main():
    spec = json.load(open(sys.argv[1]))
    W, H = spec['canvas']
    bx, by, bw, bh = spec['caixa']
    fps = spec.get('fps', 30)
    fusao = spec.get('fusao', 8)
    planos = spec['planos']
    imagens = {p['imagem']: Image.open(p['imagem']).convert('RGB') for p in planos}

    base = fundo(W, H)
    moldura = spec.get('moldura', True)
    mascara = mascara_arredondada(bw, bh, spec.get('raio', 28)) if moldura else None
    if moldura:
        sombra = Image.new('L', (W, H), 0)
        ImageDraw.Draw(sombra).rounded_rectangle([bx - 6, by + 10, bx + bw + 6, by + bh + 22], radius=34, fill=170)
        sombra = sombra.filter(ImageFilter.GaussianBlur(24))
        base = Image.composite(Image.new('RGB', (W, H), (0, 0, 0)), base, sombra)
        borda = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(borda).rounded_rectangle([bx - 2, by - 2, bx + bw + 1, by + bh + 1], radius=spec.get('raio', 28) + 2,
                                                outline=VERDE + (110,), width=3)

    # Linha do tempo: cada plano começa "fusao" quadros antes do fim do anterior.
    inicios, cursor = [], 0
    for i, p in enumerate(planos):
        inicios.append(cursor)
        cursor += p['quadros'] - (fusao if i < len(planos) - 1 else 0)
    total = spec.get('quadros', cursor)

    proc = subprocess.Popen([
        'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
        '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(fps), '-i', '-',
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', spec['saida'],
    ], stdin=subprocess.PIPE)

    for f in range(total):
        visiveis = [(i, f - inicios[i]) for i, p in enumerate(planos) if 0 <= f - inicios[i] < p['quadros']]
        if not visiveis:
            visiveis = [(len(planos) - 1, planos[-1]['quadros'] - 1)]
        quadro = None
        for i, fl in visiveis:
            q = desenhar_plano(planos[i], imagens[planos[i]['imagem']], fl, bw, bh)
            if quadro is None:
                quadro = q
            else:
                alfa = suave((f - inicios[i]) / max(1, fusao))
                quadro = Image.blend(quadro, q, alfa)
        tela = base.copy()
        tela.paste(quadro, (bx, by), mascara)
        if moldura:
            tela = Image.alpha_composite(tela.convert('RGBA'), borda).convert('RGB')
        proc.stdin.write(tela.tobytes())
    proc.stdin.close()
    if proc.wait() != 0:
        sys.exit('ffmpeg falhou')


if __name__ == '__main__':
    main()
