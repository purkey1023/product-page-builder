"use client";

import { useState } from "react";

interface ProductFormProps {
  analysis: Record<string, unknown>;
  onGenerate: (html: string) => void;
  onBack: () => void;
}

export default function ProductForm({
  analysis,
  onGenerate,
  onBack,
}: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    price: "",
    shortDescription: "",
    features: [""],
    detailDescription: "",
    targetAudience: "",
    tone: "premium" as "premium" | "casual" | "trustworthy" | "trendy",
    images: [] as string[],
  });

  const tones = [
    { value: "premium", label: "고급스러운", emoji: "✨" },
    { value: "casual", label: "캐주얼", emoji: "😊" },
    { value: "trustworthy", label: "신뢰감", emoji: "🛡" },
    { value: "trendy", label: "트렌디", emoji: "🔥" },
  ];

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...form.features];
    newFeatures[index] = value;
    setForm({ ...form, features: newFeatures });
  };

  const addFeature = () => {
    setForm({ ...form, features: [...form.features, ""] });
  };

  const removeFeature = (index: number) => {
    if (form.features.length > 1) {
      setForm({
        ...form,
        features: form.features.filter((_, i) => i !== index),
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setForm((prev) => ({
            ...prev,
            images: [...prev.images, ev.target!.result as string],
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setForm({
      ...form,
      images: form.images.filter((_, i) => i !== index),
    });
  };

  const handleGenerate = async () => {
    if (!form.name.trim() || !form.shortDescription.trim()) {
      setError("상품명과 한줄 설명은 필수입니다.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis,
          product: {
            ...form,
            features: form.features.filter((f) => f.trim() !== ""),
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "페이지 생성에 실패했습니다.");
      }

      onGenerate(data.html);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "페이지 생성 중 오류가 발생했습니다.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Step 2. 상품 정보 입력
          </h2>
          <p className="text-gray-500">
            생성할 상품페이지의 정보를 입력하세요
          </p>
        </div>
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          ← 이전 단계
        </button>
      </div>

      {/* 분석 요약 */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
        <p className="text-green-700 text-sm font-medium">
          레퍼런스 분석 완료 ✓
        </p>
        <p className="text-green-600 text-xs mt-1">
          {(analysis as { sections?: unknown[] }).sections
            ? `${(analysis as { sections: unknown[] }).sections.length}개 섹션 구조 감지됨`
            : "분석 결과 적용 중"}
        </p>
      </div>

      {/* 기본 정보 */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800">기본 정보</h3>

        <div>
          <label className="block text-sm text-gray-600 mb-1">
            상품명 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="예: 프리미엄 콜라겐 부스터 세럼"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 bg-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">가격</label>
            <input
              type="text"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="예: 39,000원"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              타겟 고객
            </label>
            <input
              type="text"
              value={form.targetAudience}
              onChange={(e) =>
                setForm({ ...form, targetAudience: e.target.value })
              }
              placeholder="예: 20-30대 여성"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">
            한줄 설명 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.shortDescription}
            onChange={(e) =>
              setForm({ ...form, shortDescription: e.target.value })
            }
            placeholder="예: 피부 깊숙이 채우는 고농축 콜라겐의 힘"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 bg-white"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">상세 설명</label>
          <textarea
            value={form.detailDescription}
            onChange={(e) =>
              setForm({ ...form, detailDescription: e.target.value })
            }
            placeholder="상품에 대한 자세한 설명을 입력하세요..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-gray-900 bg-white"
          />
        </div>
      </div>

      {/* 특징/장점 */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-800">특징 / 장점</h3>
        {form.features.map((feature, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={feature}
              onChange={(e) => updateFeature(index, e.target.value)}
              placeholder={`특징 ${index + 1}`}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 bg-white"
            />
            {form.features.length > 1 && (
              <button
                onClick={() => removeFeature(index)}
                className="px-3 text-gray-400 hover:text-red-500"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addFeature}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
        >
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          특징 추가
        </button>
      </div>

      {/* 톤앤매너 */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-800">톤앤매너</h3>
        <div className="grid grid-cols-2 gap-3">
          {tones.map((tone) => (
            <button
              key={tone.value}
              onClick={() =>
                setForm({
                  ...form,
                  tone: tone.value as typeof form.tone,
                })
              }
              className={`p-4 rounded-xl border-2 text-left transition ${
                form.tone === tone.value
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="text-xl">{tone.emoji}</span>
              <p className="font-medium text-gray-800 mt-1">{tone.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 이미지 업로드 */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-800">상품 이미지</h3>
        <div className="grid grid-cols-4 gap-3">
          {form.images.map((img, index) => (
            <div key={index} className="relative aspect-square">
              <img
                src={img}
                alt={`상품 이미지 ${index + 1}`}
                className="w-full h-full object-cover rounded-xl"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ))}
          <label className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="text-xs text-gray-400 mt-1">이미지 추가</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>
        <p className="text-xs text-gray-400">
          이미지가 없으면 플레이스홀더가 사용됩니다
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition text-lg"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            페이지 생성 중...
          </span>
        ) : (
          "상품페이지 생성"
        )}
      </button>
    </div>
  );
}
