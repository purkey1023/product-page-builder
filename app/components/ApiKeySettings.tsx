"use client";

import { useState, useEffect } from "react";

declare global {
  interface Window {
    electronAPI?: {
      getApiKey: () => Promise<string>;
      setApiKey: (key: string) => Promise<boolean>;
      hasApiKey: () => Promise<boolean>;
    };
  }
}

export default function ApiKeySettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(true);
  const [saved, setSaved] = useState(false);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    if (window.electronAPI) {
      setIsElectron(true);
      window.electronAPI.hasApiKey().then(setHasKey);
      window.electronAPI.getApiKey().then((key) => {
        if (key) setApiKey(key);
      });
    }
  }, []);

  if (!isElectron) return null;

  const handleSave = async () => {
    if (window.electronAPI && apiKey.trim()) {
      await window.electronAPI.setApiKey(apiKey.trim());
      setHasKey(true);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setIsOpen(false);
      }, 1500);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
          hasKey
            ? "border-gray-300 text-gray-600 hover:bg-gray-50"
            : "border-red-300 text-red-600 bg-red-50 hover:bg-red-100 animate-pulse"
        }`}
      >
        {hasKey ? "⚙️ API 키" : "🔑 API 키 설정 필요"}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Anthropic API 키 설정
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Claude API를 사용하기 위한 키를 입력해주세요.
            </p>

            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-api03-..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={!apiKey.trim()}
                className="flex-1 px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saved ? "✅ 저장됨!" : "저장"}
              </button>
            </div>

            {saved && (
              <p className="text-sm text-green-600 text-center mt-3">
                API 키가 저장되었습니다. 서버가 재시작됩니다.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
