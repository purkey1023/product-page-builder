"use client";

import { useState, useEffect, useRef } from "react";
import ReferenceInput from "./components/ReferenceInput";
import ProductForm from "./components/ProductForm";
import PagePreview from "./components/PagePreview";
import ApiKeySettings from "./components/ApiKeySettings";

type Step = "reference" | "product" | "preview";

const COOLDOWN_SEC = 65; // analyze 후 generate 전 대기 시간 (rate limit 방지)

export default function Home() {
  const [step, setStep] = useState<Step>("reference");
  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(null);
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [cooldown, setCooldown] = useState(0); // 남은 쿨다운 초
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const steps = [
    { key: "reference", label: "레퍼런스 등록", num: 1 },
    { key: "product", label: "상품정보 입력", num: 2 },
    { key: "preview", label: "결과 확인", num: 3 },
  ];

  // 분석 완료 → 쿨다운 시작
  const handleAnalysisComplete = (result: Record<string, unknown>) => {
    setAnalysis(result);
    setStep("product");
    setCooldown(COOLDOWN_SEC);

    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  const handleReset = () => {
    setStep("reference");
    setAnalysis(null);
    setGeneratedHtml("");
    setCooldown(0);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">상품페이지 빌더</h1>
            <p className="text-sm text-gray-500">레퍼런스 기반 상품페이지 자동 생성</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition flex items-center gap-1.5"
              title="처음부터 다시 시작"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              새로 시작
            </button>
            <ApiKeySettings />
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            {steps.map((s, i) => (
              <div key={s.key} className="flex items-center gap-3">
                {i > 0 && (
                  <div className={`w-12 h-0.5 ${steps.findIndex((x) => x.key === step) >= i ? "bg-blue-500" : "bg-gray-200"}`} />
                )}
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === s.key ? "bg-blue-600 text-white"
                      : steps.findIndex((x) => x.key === step) > steps.findIndex((x) => x.key === s.key)
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-200 text-gray-500"
                  }`}>
                    {steps.findIndex((x) => x.key === step) > steps.findIndex((x) => x.key === s.key) ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : s.num}
                  </div>
                  <span className={`text-sm ${step === s.key ? "text-blue-700 font-medium" : "text-gray-500"}`}>
                    {s.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 쿨다운 배너 */}
      {cooldown > 0 && step === "product" && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-3">
            <div className="relative w-10 h-10 flex-shrink-0">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#fde68a" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f59e0b" strokeWidth="3"
                  strokeDasharray={`${((COOLDOWN_SEC - cooldown) / COOLDOWN_SEC) * 100} 100`}
                  strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-amber-700">
                {cooldown}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800">
                API 쿨다운 중 — {cooldown}초 후 생성 가능
              </p>
              <p className="text-xs text-amber-600">
                분석에 사용된 API 토큰이 초기화되는 시간입니다. 이 시간이 지나면 자동으로 생성 버튼이 활성화됩니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {step === "reference" && (
            <ReferenceInput onAnalysisComplete={handleAnalysisComplete} />
          )}

          {step === "product" && analysis && (
            <ProductForm
              analysis={analysis}
              cooldownRemaining={cooldown}
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
