import { POST } from '../src/app/api/admin/resolve-citations/route';

async function main() {
    console.log('--- Iniciando FASE 3 (Grafo Citacional Local) ---');
    const response = await POST();
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
    console.log('--- FASE 3 Finalizada ---');
}

main().catch(console.error).finally(() => process.exit(0));
