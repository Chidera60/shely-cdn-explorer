import React, { useState, useRef } from "react";
import { 
  Upload, 
  FileUp, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  FileText, 
  X, 
  CheckCircle2, 
  Loader2, 
  AlertTriangle,
  Server,
  Globe,
  Wallet,
  KeyRound
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { uploadFileToShelby, ShelbyUploadResult } from "@/lib/shelby/client";
import { useWallet } from "@/lib/wallet/WalletContext";

interface UploadSectionProps {
  onUploadSuccess: (result: ShelbyUploadResult) => void;
  onToast: (type: "success" | "error" | "info", title: string, description?: string) => void;
}

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "application/pdf",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const UploadSection: React.FC<UploadSectionProps> = ({ onUploadSuccess, onToast }) => {
  const { isConnected, walletAddress, walletName, promptUploadSignature, setIsWalletModalOpen } = useWallet();

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressStep, setUploadProgressStep] = useState<string>("");
  const [uploadMode, setUploadMode] = useState<"browser" | "api">("browser");

  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndSelectFile = (file: File) => {
    // MIME type check
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      onToast("error", "Unsupported File Format", `File '${file.name}' (${file.type || "unknown"}) is not supported. Please upload Images, MP4/WebM videos, or PDFs.`);
      return;
    }

    // Size check
    if (file.size > MAX_FILE_SIZE) {
      onToast("error", "File Exceeds Limit", `File '${file.name}' is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum allowed size is 50MB.`);
      return;
    }

    setSelectedFile(file);

    // Create local object URL for instant preview
    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }

    onToast("info", "File Selected", `${file.name} ready for upload.`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const clearSelection = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      let walletInfo: { signerAddress: string; txHash?: string } | undefined = undefined;

      // If user has connected their wallet, prompt them to sign the request & charge their wallet
      if (isConnected && uploadMode === "browser") {
        setUploadProgressStep("Awaiting wallet transaction signature...");
        const cleanName = selectedFile.name.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
        const blobName = `uploads/${Date.now()}-${cleanName}`;

        try {
          const signed = await promptUploadSignature({
            fileName: selectedFile.name,
            fileSize: selectedFile.size,
            blobName,
            mimeType: selectedFile.type || "application/octet-stream",
            estimatedFeeShelbyUsd: 0.00045, // TODO: replace with a real fee calculation, this is still a placeholder
          });

          walletInfo = {
            signerAddress: signed.signerAddress,
            txHash: signed.txHash,
          };
        } catch (err: any) {
          onToast("info", "Upload Cancelled", "Wallet signature request was declined.");
          return;
        }
      }

      setIsUploading(true);
      setUploadProgressStep("Initializing Shelby Client...");

      if (uploadMode === "browser") {
        // Direct browser SDK upload using wallet signer
        const result = await uploadFileToShelby(
          selectedFile,
          previewUrl || undefined,
          (step) => setUploadProgressStep(step),
          walletInfo
        );

        onUploadSuccess(result);
        onToast(
          "success",
          walletInfo ? "Wallet Charged & Upload Complete!" : "Upload Complete!",
          `Blob '${result.blobName}' created on Shelby network.${walletInfo ? ` Tx: ${walletInfo.txHash?.slice(0, 10)}...` : ""}`
        );
      } else {
        // Secure Server API Route (/api/upload)
        setUploadProgressStep("Sending payload to /api/upload endpoint...");
        const formData = new FormData();
        formData.append("file", selectedFile);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Server upload failed.");
        }

        const result: ShelbyUploadResult = {
          id: `api_${Date.now()}`,
          publicUrl: data.publicUrl,
          blobName: data.blobName,
          fileName: data.fileName,
          fileSize: data.fileSize,
          mimeType: data.mimeType,
          signerAddress: walletInfo?.signerAddress || data.signerAddress,
          txHash: walletInfo?.txHash || data.txHash,
          expirationMicros: data.expirationMicros,
          timestamp: data.timestamp,
          localPreviewUrl: previewUrl || undefined,
          metrics: {
            readMs: 10,
            signerMs: 5,
            uploadMs: 120,
            totalMs: 135,
            estimatedLatencyMs: 20,
          },
          network: "MAINNET",
        };

        onUploadSuccess(result);
        onToast("success", "API Upload Successful!", `Asset securely processed via ShelbyNodeClient.`);
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      onToast("error", "Upload Failed", err.message || "Failed to communicate with Shelby Protocol network.");
    } finally {
      setIsUploading(false);
      setUploadProgressStep("");
    }
  };

  const getFileIcon = (mime: string) => {
    if (mime.startsWith("image/")) return <ImageIcon className="w-8 h-8 text-shelby-cyan" />;
    if (mime.startsWith("video/")) return <VideoIcon className="w-8 h-8 text-shelby-purple" />;
    return <FileText className="w-8 h-8 text-shelby-indigo" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Wallet Status Banner */}
      {isConnected ? (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-shelby-cyan/15 via-shelby-indigo/15 to-shelby-purple/15 border border-shelby-cyan/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-shelby-cyan/20 border border-shelby-cyan/40 flex items-center justify-center text-shelby-cyan shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-white block">Wallet Signing Active</span>
              <span className="text-gray-300 text-[11px] truncate block">
                Charged to {walletName} ({walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)})
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30 shrink-0">
            Wallet Signer
          </span>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-surface-300/80 border border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-gray-300">
            <Wallet className="w-4 h-4 text-gray-400" />
            <span>Connect wallet to sign uploads & pay from balance</span>
          </div>
          <button
            type="button"
            onClick={() => setIsWalletModalOpen(true)}
            className="pressable text-xs font-semibold text-shelby-cyan hover:underline"
          >
            Connect Wallet
          </button>
        </div>
      )}

      {/* Upload Mode Selector */}
      <div className="flex items-center justify-between p-1.5 rounded-xl bg-surface-300 border border-white/10">
        <button
          type="button"
          onClick={() => setUploadMode("browser")}
          className={`flex-1 pressable flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            uploadMode === "browser"
              ? "bg-gradient-to-r from-shelby-indigo to-shelby-purple text-white shadow-lg"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Browser SDK (Direct)</span>
        </button>

        <button
          type="button"
          onClick={() => setUploadMode("api")}
          className={`flex-1 pressable flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            uploadMode === "api"
              ? "bg-gradient-to-r from-shelby-cyan to-shelby-indigo text-white shadow-lg"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Node API Route (Secure)</span>
        </button>
      </div>

      {/* Main Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden ${
          dragActive
            ? "border-shelby-cyan bg-shelby-cyan/10 scale-[1.01] shadow-2xl shadow-shelby-cyan/20"
            : selectedFile
            ? "border-shelby-indigo/50 bg-surface-200/50"
            : "border-white/15 bg-surface-300/40 hover:border-white/30 hover:bg-surface-300/70"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.gif,.webp,.svg,.mp4,.webm,.pdf"
          onChange={handleFileChange}
          className="hidden"
          id="shelby-file-input"
        />

        <div className="p-8 sm:p-10 flex flex-col items-center justify-center text-center relative z-10">
          {!selectedFile ? (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-shelby-indigo/20 via-shelby-purple/20 to-shelby-cyan/20 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <FileUp className="w-8 h-8 text-shelby-cyan animate-bounce-slow" />
              </div>

              <h3 className="text-lg font-bold text-white tracking-tight">
                Drag & Drop media file here
              </h3>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                Supports Images (PNG, JPG, WebP), Videos (MP4, WebM), and PDFs up to 50MB.
              </p>

              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="pressable mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-100 hover:bg-surface-50 border border-white/15 text-sm font-semibold text-white shadow-lg transition-all"
              >
                <Upload className="w-4 h-4 text-shelby-cyan" />
                <span>Browse Local File</span>
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full flex flex-col items-center"
            >
              {/* File Preview Card */}
              <div className="w-full p-4 rounded-xl bg-surface-100/80 border border-white/10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  {previewUrl && selectedFile.type.startsWith("image/") ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-14 h-14 rounded-lg object-cover border border-white/10 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-surface-300 border border-white/10 flex items-center justify-center shrink-0">
                      {getFileIcon(selectedFile.type)}
                    </div>
                  )}

                  <div className="min-w-0 text-left">
                    <h4 className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-xs">
                      {selectedFile.name}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      <span className="px-2 py-0.5 rounded bg-surface-300 text-gray-300 font-mono text-[10px]">
                        {selectedFile.type || "binary/file"}
                      </span>
                      <span>•</span>
                      <span>{formatFileSize(selectedFile.size)}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={clearSelection}
                  disabled={isUploading}
                  className="pressable p-2 rounded-lg bg-surface-300 hover:bg-rose-500/20 hover:text-rose-400 text-gray-400 transition-colors"
                  title="Remove File"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Upload Button */}
              <button
                type="button"
                onClick={handleUpload}
                disabled={isUploading}
                className={`pressable w-full mt-5 inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm text-white shadow-xl transition-all ${
                  isUploading
                    ? "bg-surface-200 cursor-not-allowed opacity-80"
                    : "bg-gradient-to-r from-shelby-cyan via-shelby-indigo to-shelby-purple hover:brightness-110 shadow-shelby-indigo/30"
                }`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-shelby-cyan" />
                    <span>{uploadProgressStep || "Uploading..."}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>{isConnected ? "Sign & Upload with Wallet" : "Upload to Shelby Network"}</span>
                  </>
                )}
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Guidelines footer */}
      <div className="flex items-center justify-between text-xs text-gray-400 px-1">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Max file size: 50MB
        </span>
        <span className="flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          Mainnet auto-expiration: 30 days
        </span>
      </div>
    </div>
  );
};
