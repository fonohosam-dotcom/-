import React, { useState } from "react";
import { Image as ImageIcon, Loader2, Sparkles, AlertCircle } from "lucide-react";

export default function ImageGenerator({ onGenerate }: { onGenerate?: (url: string) => void }) {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const aspectRatios = ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, aspectRatio }),
      });
      const data = await response.json();
      if (data.success && data.imageUrl) {
        setGeneratedImage(data.imageUrl);
        if (onGenerate) onGenerate(data.imageUrl);
      } else {
        setError(data.error || "Failed to generate image");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white border border-[#E5E3DA] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-slate-800">مُولّد الصور بالذكاء الاصطناعي</h3>
          <p className="text-sm text-slate-500">قم بتوليد صور للمشاريع والحملات بجودة عالية</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">وصف الصورة (Prompt)</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="مثال: صورة لمدرسة حديثة في قرية نائية وقت الغروب..."
            className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-none h-24 text-sm"
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">نسبة العرض إلى الارتفاع (Aspect Ratio)</label>
          <div className="flex flex-wrap gap-2">
            {aspectRatios.map((ratio) => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-colors ${
                  aspectRatio === ratio
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              جاري التوليد...
            </>
          ) : (
            <>
              <ImageIcon className="w-5 h-5" />
              توليد الصورة
            </>
          )}
        </button>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {generatedImage && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h4 className="text-sm font-bold text-slate-800 mb-3">النتيجة:</h4>
            <div className="rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
              <img
                src={generatedImage}
                alt={prompt}
                referrerPolicy="no-referrer"
                className="max-w-full h-auto object-contain max-h-[400px]"
              />
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2 font-mono">
              Generated via Gemini AI - {aspectRatio}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
