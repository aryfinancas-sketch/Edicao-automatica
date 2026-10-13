// Registra que as telas mascaradas foram aprovadas (regra 5 do briefing).
import fs from 'node:fs';
import { ARQ_APROVACAO, PASTAS } from '../config.mjs';

fs.mkdirSync(PASTAS.previas, { recursive: true });
fs.writeFileSync(ARQ_APROVACAO, `Telas aprovadas em ${new Date().toISOString()}\n`);
console.log('Aprovação registrada. Agora rode "npm run montar".');
