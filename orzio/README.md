# Vídeos de venda da Orzio

Produção automática da VSL, dos Reels/TikToks e dos Stories descritos em
`comando_claude_code_vsl_orzio.md`, a partir dos prints das telas do app e de
uma narração gerada na ElevenLabs.

## O que fica fora do git (repositório público)

- `telas_orig/` e `telas/`: prints do app (a pasta `telas/` é a versão tratada:
  título "DONO" coberto e final do cartão trocado para 1234).
- `voz/`, `trilha/`, `saida/narracao/`, `saida/rascunhos/`, `saida/.cache/`.

## Passo a passo

1. Coloque os prints em `telas/` (mesma estrutura do zip `orzio_telas`).
2. Rascunho sem voz, para aprovar o visual (regra 5):
   `npm run rascunho` → `saida/rascunhos/`
3. Aprovação: `npm run aprovar`
4. Narração:
   - MP3 único do site da ElevenLabs, com as 32 falas em ordem separadas por
     pausas: `npm run narracao -- --arquivo=voz/narracao.mp3`
     (em duas partes: `--arquivo=parte1.mp3 --arquivo2=parte2.mp3`)
   - ou pela API (precisa de `ELEVENLABS_API_KEY` e acesso a api.elevenlabs.io):
     `npm run narracao -- --api`
5. Vídeos finais: `npm run montar` → `saida/*.mp4` e `saida/legendas/*.srt`.
   Cada vídeo passa pela verificação de dados pessoais (OCR, 1 quadro/s).
   Para conferir de novo: `npm run verificar`.

Opcional: uma trilha em `trilha/` entra a -20 dB sob a voz.

## Onde mexer

- `orzio/roteiros.mjs`: falas, títulos e enquadramentos de cada cena.
- `orzio/lib/graficos.mjs`: mockups do WhatsApp, planilha, extrato, logo e cartão final.
- `orzio/lib/camera.py`: movimento de câmera sobre os prints.
- `orzio/lib/legendas.mjs`: estilo e posição de títulos e legendas.
- `orzio/lib/mascara-navegador.js` e `orzio/lib/navegador.mjs`: máscara e travas
  para uma futura gravação ao vivo do app (testadas com `npm run testar-mascara`).
