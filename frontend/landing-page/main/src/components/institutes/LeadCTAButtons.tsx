"use client";

import { ArrowRight } from "lucide-react";
import { openLeadDialog } from "@/lib/leads";

/** CTA buttons for the FinalCTA section — open the demo / contact dialogs. */
export default function LeadCTAButtons() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
      <button
        onClick={() => openLeadDialog("demo")}
        className="px-8 py-4 bg-white text-primary-700 rounded-xl font-bold text-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        Book a Demo <ArrowRight className="w-5 h-5" />
      </button>
      <button
        onClick={() => openLeadDialog("contact")}
        className="px-8 py-4 bg-white/10 border-2 border-white/40 text-white rounded-xl font-bold text-lg hover:bg-white/20 transition-all text-center"
      >
        Talk to Us
      </button>
    </div>
  );
}
