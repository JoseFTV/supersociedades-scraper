import Link from 'next/link';
import { ArrowRight, Search, Zap, Layers, Shield, Scale } from 'lucide-react';

export default function LandingPage() {

  return (
    <div className="min-h-screen bg-lexia-bg text-lexia-black font-sans selection:bg-lexia-teal/30">
      
      {/* Navbar (Minimal for public view) */}
      <nav className="w-full h-16 border-b border-lexia-teal/10 flex items-center justify-between px-6 md:px-12 backdrop-blur-md sticky top-0 z-50 bg-lexia-bg/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-lexia-teal to-blue-500 shadow-lg" />
          <span className="text-xl font-bold tracking-tight">Lexia<span className="text-lexia-teal">Analytics</span></span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/cases" className="flex items-center gap-2 px-4 py-2 bg-lexia-teal text-lexia-white text-sm font-semibold rounded-lg hover:bg-lexia-teal/90 transition-all shadow-md">
            Ir al Dashboard
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative w-full pt-32 pb-40 overflow-hidden flex flex-col items-center justify-center text-center px-4">
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-lexia-teal/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl -z-10" />

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight">
          Inteligencia Jurídica para <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-lexia-teal to-blue-600">
            Litigio Societario
          </span>
        </h1>
        
        <p className="mt-6 text-lg md:text-xl text-gray-500 max-w-2xl">
          La primera plataforma en Colombia impulsada por IA para analizar, predecir y construir estrategias legales ganadoras ante la Superintendencia de Sociedades.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center">
          <Link href="/cases" className="flex items-center gap-2 px-8 py-4 bg-lexia-teal text-white rounded-xl font-semibold text-lg hover:bg-lexia-teal/90 transition-all shadow-lg hover:shadow-lexia-teal/30 hover:-translate-y-1">
            Ir a la Plataforma <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="#features" className="px-8 py-4 bg-white border border-gray-200 text-lexia-black rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all">
            Descubrir Módulos
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="w-full py-24 bg-white/50 border-y border-gray-100 px-4 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Un Ecosistema Legal Potenciado</h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto">Nuestros algoritmos de extracción dual transforman miles de páginas de sentencias en datos tácticos accionables.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all hover:border-lexia-teal/30">
              <div className="w-14 h-14 bg-lexia-teal/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Search className="w-7 h-7 text-lexia-teal" />
              </div>
              <h3 className="text-xl font-bold mb-3">Buscador Semántico</h3>
              <p className="text-gray-500 leading-relaxed">
                Abandona las palabras clave. Busca por supuestos fácticos (ej: "socio minoritario expulsado sin quórum") y encuentra jurisprudencia análoga con IA vectorial.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all hover:border-blue-500/30">
              <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Copiloto Estratégico</h3>
              <p className="text-gray-500 leading-relaxed">
                Genera memorandos listos para presentar, redactados bajo el Estándar Lexia, argumentando desde la postura institucional más reciente de la Delegatura.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all hover:border-lexia-teal/30">
              <div className="w-14 h-14 bg-lexia-teal/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Layers className="w-7 h-7 text-lexia-teal" />
              </div>
              <h3 className="text-xl font-bold mb-3">Evolución Jurisprudencial</h3>
              <p className="text-gray-500 leading-relaxed">
                Visualiza giros doctrinales en el tiempo y descubre estadísticamente qué tipo de pruebas documentales o testimoniales ganan más casos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="w-full py-32 flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-4xl font-bold mb-6">El Futuro del Arbitraje y Litigio.</h2>
        <p className="text-xl text-gray-500 mb-10 max-w-lg">
          Únete a la plataforma construida por y para firmas boutique.
        </p>
        <Link href="/cases" className="px-10 py-5 bg-lexia-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-all shadow-2xl flex items-center gap-3">
          Ingresar a la Plataforma <Shield className="w-5 h-5" />
        </Link>
      </section>

      {/* Footer minimal */}
      <footer className="w-full py-8 border-t border-gray-100 text-center flex flex-col items-center">
        <div className="flex items-center gap-2 opacity-50 mb-2">
           <Scale className="w-4 h-4" />
           <span className="font-semibold text-sm tracking-tight">LexiaAnalytics</span>
        </div>
        <p className="text-sm text-gray-400">© 2026 Lexia Abogados. Prototipo Privado.</p>
      </footer>
    </div>
  );
}
