"use client";

import { useState, useRef } from "react";

interface PagePreviewProps {
  html: string;
  onBack: () => void;
  onRegenerate: () => void;
}

export default function PagePreview({
  html,
  onBack,
  onRegenerate,
}: PagePreviewProps) {
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [showCode, setShowCode] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const downloadHtml = () => {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product-page.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyHtml = async () => {
    await navigator.clipboard.writeText(html);
    alert("HTML 코드가 클립보드에 복사되었습니다.");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Step 3. 결과 확인
          </h2>
          <p className="text-gray-500 text-sm">
            생성된 상품페이지를 확인하세요
          </p>
        </div>
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          ← 이전 단계
        </button>
      </div>

      {/* 툴바 */}
      <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
        <div className="flex gap-2">
          {/* 뷰 모드 토글 */}
          <div className="flex bg-white rounded-lg border border-gray-200">
            <button
              onClick={() => setViewMode("desktop")}
              className={`px-4 py-2 text-sm rounded-lg transition ${
                viewMode === "desktop"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <svg
                className="w-4 h-4 inline-block mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              데스크톱
            </button>
            <button
              onClick={() => setViewMode("mobile")}
              className={`px-4 py-2 text-sm rounded-lg transition ${
                viewMode === "mobile"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <svg
                className="w-4 h-4 inline-block mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              모바일
            </button>
          </div>

          <button
            onClick={() => setShowCode(!showCode)}
            className={`px-4 py-2 text-sm rounded-lg border transition ${
              showCode
                ? "bg-gray-800 text-white border-gray-800"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
            }`}
          >
            {"</>"}  코드 보기
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onRegenerate}
            className="px-4 py-2 text-sm rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
          >
            다시 생성
          </button>
          <button
            onClick={copyHtml}
            className="px-4 py-2 text-sm rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
          >
            코드 복사
          </button>
          <button
            onClick={downloadHtml}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            HTML 다운로드
          </button>
        </div>
      </div>

      {/* 미리보기 / 코드 */}
      {showCode ? (
        <div className="bg-gray-900 rounded-xl p-6 overflow-auto max-h-[700px]">
          <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
            {html}
          </pre>
        </div>
      ) : (
        <div
          className={`bg-gray-100 rounded-xl overflow-hidden flex justify-center p-4 ${
            viewMode === "mobile" ? "" : ""
          }`}
        >
          <div
            className={`bg-white shadow-2xl rounded-lg overflow-hidden transition-all duration-300 ${
              viewMode === "mobile" ? "w-[375px]" : "w-full max-w-[1440px]"
            }`}
            style={{
              height: viewMode === "mobile" ? "812px" : "700px",
            }}
          >
            <iframe
              ref={iframeRef}
              srcDoc={html}
              className="w-full h-full border-0"
              title="상품페이지 미리보기"
              sandbox="allow-scripts"
            />
          </div>
        </div>
      )}
    </div>
  );
}
