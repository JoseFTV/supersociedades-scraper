require('dotenv').config({ override: true });
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.case.count()
  .then(n => { console.log('OK — ' + n + ' casos'); return p.$disconnect(); })
  .catch(e => { console.error('ERROR:', e.message); return p.$disconnect(); });
