import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";

export const metadata: Metadata = {
  title: {
    template: '%s | Lexia Analytics',
    default: 'Dashboard | Lexia Analytics',
  },
  description: 'Plataforma de inteligencia jurídica para litigios ante la Superintendencia de Sociedades de Colombia.',
  robots: { index: false, follow: false }, // Private app, no indexing
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen w-full">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative selection:bg-lexia-teal/30">
        {/* Top Navigation */}
        <TopNav />
        
        {/* Main Page Scrollable Area */}
        <main className="flex-1 overflow-y-auto bg-lexia-bg relative">
          <div className="relative z-10 w-full h-full p-4 md:p-8 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
