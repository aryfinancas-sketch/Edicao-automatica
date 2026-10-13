"""Alinha um MP3 com todas as falas em sequência quando ele não tem as pausas
longas entre as cenas: estima onde cada fala termina pelo tamanho do texto e
escolhe, por programação dinâmica, as pausas reais mais próximas e mais longas.

Uso: python3 alinhar_texto.py narracao.mp3 falas.json saida.json [ajustes.json]
ajustes.json (opcional): {"11": 86.56} move o fim da fala 11 para a pausa mais
próxima desse instante (em segundos).
"""
import json, re, subprocess, sys, math
arq, falas_json, saida = sys.argv[1], sys.argv[2], sys.argv[3]
ajustes = json.load(open(sys.argv[4])) if len(sys.argv) > 4 else {}
falas = json.load(open(falas_json))
def silencios(n, d):
    r = subprocess.run(['ffmpeg','-hide_banner','-i',arq,'-af',f'silencedetect=n={n}dB:d={d}','-f','null','-'],capture_output=True,text=True).stderr
    s=[float(x) for x in re.findall(r'silence_start: ([\d.]+)',r)]; e=[float(x) for x in re.findall(r'silence_end: ([\d.]+)',r)]
    return list(zip(s,e))
dur=float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',arq],capture_output=True,text=True).stdout)
sil=silencios(-45,0.12)
ini = sil[0][1] if sil and sil[0][0]<0.05 else 0.0
fim = sil[-1][0] if sil and sil[-1][1]>dur-0.05 else dur
cands=[(a,b) for a,b in sil if a>ini+0.3 and b<fim-0.3]
# peso de cada fala: caracteres + custo fixo de respiração
w=[len(t)+12 for t in falas]; tot=sum(w)
E=[]; acc=0
for k in range(len(falas)-1):
    acc+=w[k]; E.append(ini+(fim-ini)*acc/tot)
K=len(E); N=len(cands); sig=2.2
INF=1e18
dp=[[INF]*N for _ in range(K)]; bk=[[-1]*N for _ in range(K)]
def custo(k,j):
    a,b=cands[j]; t=(a+b)/2; L=b-a
    return ((t-E[k])/sig)**2 - 3.0*math.log(L/0.12)
for j in range(N): dp[0][j]=custo(0,j)
for k in range(1,K):
    best=INF; bi=-1
    for j in range(N):
        if j>0 and dp[k-1][j-1]<best: best=dp[k-1][j-1]; bi=j-1
        if bi>=0: dp[k][j]=best+custo(k,j); bk[k][j]=bi
j=min(range(N),key=lambda j:dp[K-1][j]); esc=[0]*K
for k in range(K-1,-1,-1): esc[k]=j; j=bk[k][j]
cortes=[cands[j] for j in esc]
for k_txt, t in ajustes.items():
    k = int(k_txt) - 1
    cortes[k] = min(cands, key=lambda c: abs((c[0]+c[1])/2 - t))
cortes.sort()
segs=[]; a=ini
for (s,e) in cortes: segs.append((a,s)); a=e
segs.append((a,fim))
taxa=[len(falas[i])/(b-a) for i,(a,b) in enumerate(segs)]
med=sorted(taxa)[len(taxa)//2]
print(f'arquivo={arq} pausas candidatas={N} custo={dp[K-1][esc[-1]]:.1f}')
for i,((a,b),t) in enumerate(zip(segs,taxa)):
    L = cortes[i][1]-cortes[i][0] if i<K else 0
    flag = ' <-- ritmo estranho' if abs(t/med-1)>0.25 else ''
    print(f'{i+1:2d} {a:7.2f}-{b:7.2f} ({b-a:4.1f}s) pausa_depois={L:.2f}s {t:5.1f} car/s{flag}  {falas[i][:45]}')
json.dump(segs, open(saida,'w'))
