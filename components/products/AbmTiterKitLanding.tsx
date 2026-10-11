import AbmTiterMediaClient from "./AbmTiterMediaClient";
import landing from "@/data/abm-titer-landing.json";

export const TITER_PATH = "genetic-materials/kits-for-viral-vectors/qpcr-virus-titer-kits";

export const TITER_KITS = [
  { sku: "LV900", name: "qPCR Lentivirus Titer Kit", system: "Lentivirus", vector: "HIV-1-based lentivirus", method: "RT-qPCR", input: "Supernatant or concentrated virus", description: "A single-step RT-qPCR assay for quantifying HIV-1-based lentiviral stocks." },
  { sku: "G931", name: "qPCR AAV Titer Kit", system: "AAV", vector: "AAV", method: "qPCR", input: "Purified AAV or supernatant", description: "Measures AAV genome copies with CMV and ITR primer options." },
  { sku: "G949", name: "qPCR Retrovirus Titer Kit", system: "Retrovirus", vector: "Retrovirus", method: "RT-qPCR", input: "Supernatant or purified sample", description: "A single-step RT-qPCR assay for quantifying retroviral stocks." },
] as const;

export default function AbmTiterKitLanding() {
  return (
    <AbmTiterMediaClient>
      {/* Reviewed static source: scripts, forms, prices and third-party embeds are removed at import. */}
      <div dangerouslySetInnerHTML={{ __html: landing.html }} />
    </AbmTiterMediaClient>
  );
}
