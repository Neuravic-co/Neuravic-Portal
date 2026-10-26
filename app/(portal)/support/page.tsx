import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";
import { FAQS } from "@/lib/support";
import { ItToolkit } from "./it-toolkit";

export const metadata: Metadata = { title: "IT & support" };

export default function SupportPage() {
  return (
    <>
      <ItToolkit />

      <section className="card faq faq--spaced" aria-labelledby="faq-title">
        <div className="card__head">
          <div>
            <h2 className="card__title" id="faq-title">
              Quick fixes
            </h2>
            <p className="card__sub">Common problems and what to try first</p>
          </div>
        </div>
        {FAQS.map((item) => (
          <details key={item.question}>
            <summary>
              {item.question}
              <ChevronDown aria-hidden="true" />
            </summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </section>
    </>
  );
}
