"use client";

import { useState } from "react";
import ReferenceInput from "./components/ReferenceInput";
import ProductForm from "./components/ProductForm";
import PagePreview from "./components/PagePreview";
import ApiKeySettings from "./components/ApiKeySettings";

type Step = "reference" | "product" | "preview";

export default function Home() {
  const [step, setStep] = useState<Step>("reference");
  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(
    null
  );
  const [generatedHtml, setGeneratedHtml] = useState("");

  const steps = [
    { key: "reference", label: "레퍼런스 등록", num: 1 },
    { key: "product", label: "상품정보 입력", num: 2 },
    { key: "preview", label: "결과 확인", num: 3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              상품페이지 빌더
            </h1>
            <p className="text-sm text-gray-500">
              레퍼런스 기반 상품페이지 자동 생성
            </p>
          </div>
          <ApiKeySettings />
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            {steps.map((s, i) => (
              <div key={s.key} className="flex items-center gap-3">
                {i > 0 && (
                  <div
                    className={`w-12 h-0.5 ${
                      steps.findIndex((x) => x.key === step) >= i
                        ? "bg-blue-500"
                        : "bg-gray-200"
                    }`}
                  />
                )}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step === s.key
                        ? "bg-blue-600 text-white"
                        : steps.findIndex((x) => x.key === step) >
                            steps.findIndex((x) => x.key === s.key)
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {steps.findIndex((x) => x.key === step) >
                    steps.findIndex((x) => x.key === s.key) ? (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      s.num
                    )}
                  </div>
                  <span
                    className={`text-sm ${
                      step === s.key
                        ? "text-blue-700 font-medium"
                        : "text-gray-500"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {step === "reference" && (
            <ReferenceInput
              onAnalysisComplete={(result) => {
                setAnalysis(result);
                setStep("product");
              }}
            />
          )}

          {step === "product" && analysis && (
            <ProductForm
              analysis={analysis}
              onGenerate={(html) => {
                setGeneratedHtml(html);
                setStep("preview");
              }}
              onBack={() => setStep("reference")}
            />
          )}

          {step === "preview" && generatedHtml && (
            <PagePreview
              html={generatedHtml}
              onBack={() => setStep("product")}
              onRegenerate={() => setStep("product")}
            />
          )}
        </div>
      </main>
    </div>
  );
}
