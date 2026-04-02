"use client";

import { useState, useEffect, useRef } from "react";

interface ReferenceInputProps {
  onAnalysisComplete: (analysis: Record<string, unknown>) => void;
}

const STEPS = [
  { label: "페이지 접속 중", duration: 5 },
  { label: "스크린샷 캡처 중", duration: 10 },
  { label: "레이아웃 분석 중", duration: 8 },
  { label: "디자인 요소 추출 중", duration: 7 },
  { label: "분석 결과 정리 중", duration: 5 },
];

const COOLDOWN_SECONDS = 62; // API rate limit 리셋 대기 (1분+여유)

export default function ReferenceInput({
  onAnalysisComplete,
}: ReferenceInputProps) {
  const [urls, setUrls] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progressStep, setProgressStep] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // 쿨다운 상태
  const [cooldown, setCooldown] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const pendingAnalysis = useRef<Record<string, unknown> | null>(null);

  // 분석 중 경과 시간 & 프로그레스
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 0.5);
      setProgressPercent((prev) => (prev >= 90 ? 90 : prev + 0.8));
    }, 500);
    return () => clearInterval(interval);
  }, [loading]);

  // 단계 라벨 순환
  useEffect(() => {
    if (!loading) return;
    let stepIndex = 0;
    const stepInterval = setInterval(() => {
      stepIndex = (stepIndex + 1) % STEPS.length;
      setProgressStep(stepIndex);
    }, 6000);
    return () => clearInterval(stepInterval);
  }, [loading]);

  // 쿨다운 카운트다운
  useEffect(() => {
    if (!cooldown) return;
    if (cooldownLeft <= 0) {
      setCooldown(false);
      if (pendingAnalysis.current) {
        onAnalysisComplete(pendingAnalysis.current);
        pendingAnalysis.current = null;
      }
      return;
    }
    const timer = setTimeout(() => {
      setCooldownLeft((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldown, cooldownLeft, onAnalysisComplete]);

  const addUrl = () => {
    if (urls.length < 5) setUrls([...urls, ""]);
  };

  const removeUrl = (index: number) => {
    if (urls.length > 1) setUrls(urls.filter((_, i) => i !== index));
  };

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const handleAnalyze = async () => {
    const validUrls = urls.filter((u) => u.trim() !== "");
    if (validUrls.length === 0) {
      setError("최소 1개의 URL을 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");
    setProgressStep(0);
    setProgressPercent(0);
    setElapsedTime(0);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: validUrls }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "분석에 실패했습니다.");
      }

      setProgressPercent(100);

      // window에 완료 시각 기록 (ProductForm에서 참조)
      if (typeof window !== "undefined") {
        (window as Window & { __lastApiCallTime?: number }).__lastApiCallTime =
          Date.now();
      }

      // 분석 완료 → 쿨다운 시작 (rate limit 리셋 대기)
      pendingAnalysis.current = data.analysis;
      setLoading(false);
      setCooldown(true);
      setCooldownLeft(COOLDOWN_SECONDS);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "분석 중 오류가 발생했습니다.";
      setError(message);
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}분 ${secs}초` : `${secs}초`;
  };

  const cooldownProgress = ((COOLDOWN_SECONDS - cooldownLeft) / COOLDOWN_SECONDS) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Step 1. 레퍼런스 등록
        </h2>
        <p className="text-gray-500">
          참고할 상품페이지 URL을 입력하세요 (최대 5개)
        </p>
      </div>

      <div className="space-y-3">
        {urls.map((url, index) => (
          <div key={index} className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                {index + 1}
              </span>
              <input
                type="url"
                value={url}
                onChange={(e) => updateUrl(index, e.target.value)}
                placeholder="https://example.com/product-page"
                className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900 bg-white"
                disabled={loading || cooldown}
              />
            </div>
            {urls.length > 1 && (
              <button
                onClick={() => removeUrl(index)}
                className="px-3 py-3 text-gray-400 hover:text-red-500 transition"
                disabled={loading || cooldown}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {urls.length < 5 && !loading && !cooldown && (
        <button
          onClick={addUrl}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          URL 추가
        </button>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* 분석 중 프로그레스 UI */}
      {loading && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-10 h-10">
                <svg className="animate-spin w-10 h-10" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="16" fill="none" stroke="#DBEAFE" strokeWidth="4" />
                  <circle cx="20" cy="20" r="16" fill="none" stroke="#3B82F6" strokeWidth="4"
                    strokeDasharray="80" strokeDashoffset="60" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-blue-800 font-semibold text-base">{STEPS[progressStep].label}...</p>
                <p className="text-blue-500 text-xs">경과 시간: {formatTime(elapsedTime)}</p>
              </div>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%`, background: "linear-gradient(90deg, #3B82F6, #6366F1, #8B5CF6)" }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-blue-400">{urls.filter(u => u.trim() !== "").length}개 URL 분석 중</span>
              <span className="text-xs text-blue-500 font-medium">{Math.round(progressPercent)}%</span>
            </div>
            <div className="flex items-center justify-center gap-2 mt-4">
              {STEPS.map((_, i) => (
                <div key={i} className={`rounded-full transition-all duration-300 ${
                  i < progressStep ? "w-2 h-2 bg-blue-600"
                    : i === progressStep ? "w-3 h-3 bg-blue-500 animate-pulse"
                    : "w-2 h-2 bg-blue-200"
                }`} />
              ))}
            </div>
          </div>
          <p className="text-center text-gray-400 text-xs">페이지 크기에 따라 30초~2분 소요될 수 있습니다</p>
        </div>
      )}

      {/* 쿨다운 UI: 분석 완료 후 rate limit 대기 */}
      {cooldown && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xl">
              ✅
            </div>
            <div>
              <p className="text-green-800 font-bold text-base">레퍼런스 분석 완료!</p>
              <p className="text-green-600 text-xs">API 한도 초과 방지를 위해 잠시 대기합니다</p>
            </div>
          </div>

          {/* 카운트다운 원형 표시 */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#D1FAE5" strokeWidth="6" />
                <circle
                  cx="40" cy="40" r="34" fill="none" stroke="#10B981" strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - cooldownProgress / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-green-700">{cooldownLeft}</span>
                <span className="text-xs text-green-500">초</span>
              </div>
            </div>
            <p className="text-sm text-green-700 font-medium">
              {cooldownLeft}초 후 상품정보 입력으로 이동합니다
            </p>
          </div>

          {/* 진행 바 */}
          <div className="w-full bg-green-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500"
              style={{ width: `${cooldownProgress}%`, transition: "width 1s linear" }}
            />
          </div>
        </div>
      )}

      <button
        onClick={handleAnalyze}
        disabled={loading || cooldown}
        className={`w-full py-4 font-semibold rounded-xl transition text-lg ${
          loading || cooldown
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            분석 중...
          </span>
        ) : cooldown ? (
          `대기 중 (${cooldownLeft}초)...`
        ) : (
          "분석 시작"
        )}
      </button>
    </div>
  );
}
