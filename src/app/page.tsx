import { Metadata } from "next";
import PageReplacementSimulator from "./PageReplacementSimulator";

export const metadata: Metadata = {
  title: "Simulator de Algorimos de Substituição de Página",
}

export default function Home() {
  return (
    <div className="flex items-center justify-items-center min-h-screen font-[family-name:var(--font-geist-sans)]">
      <PageReplacementSimulator />
    </div>
  );
}
