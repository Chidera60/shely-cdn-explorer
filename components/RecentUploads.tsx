"use client";

import React, { useEffect, useState } from "react";
import { History, FileText, Image as ImageIcon, Video as VideoIcon, ChevronRight } from "lucide-react";
import { getHistory, ShelbyUploadResult } from "@/lib/shelby/client";

interface RecentUploadsProps {
  onSelect: (result: ShelbyUploadResult) => void;
  activeBlobName?: string;
}

export const RecentUploads: React.FC<RecentUploadsProps> = ({ onSelect, activeBlobName }) => {
  const [history, setHistory] = useState<ShelbyUploadResult[]>([]);

  useEffect(() => {
    setHistory(getHistory());
  }, [activeBlobName]);

  if (history.length === 0) return null;

  const getFileIcon = (mime: string) => {
    if (mime.startsWith("image/")) return <ImageIcon className="w-3.5 h-3.5 text-shelby-cyan" />;
    if (mime.startsWith("video/")) return <VideoIcon className="w-3.5 h-3.5 text-shelby-purple" />;
    return <FileText className="w-3.5 h-3.5 text-shelby-indigo" />;
  };

  return (
    <div className="p-4 rounded-2xl border border-white/10 bg-surface-300/40 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-shelby-indigo" />
          <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
            Recent Upload History
          </h3>
        </div>
        <span className="text-[10px] text-gray-400 font-mono">{history.length} assets</span>
      </div>

      <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
        {history.map((item) => {
          const isActive = activeBlobName === item.blobName;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className={`pressable flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                isActive
                  ? "bg-shelby-indigo/20 border-shelby-indigo/50 text-white"
                  : "bg-surface-400/50 border-white/5 text-gray-300 hover:bg-surface-400 hover:border-white/10"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {getFileIcon(item.mimeType)}
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate max-w-[200px]">{item.fileName}</p>
                  <p className="text-[10px] font-mono text-gray-400 truncate">{item.blobName}</p>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
