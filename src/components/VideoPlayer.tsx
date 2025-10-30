import { useEffect, useRef, useState } from "react";

interface VideoPlayerProps {
  url: string;
  className?: string;
}

interface VideoStatus {
  canPlay: boolean;
  metaLoaded: boolean;
  headersOk: boolean;
  mime: string;
  ranges: string;
  error: string;
}

export default function VideoPlayer({ url, className = "" }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<VideoStatus>({
    canPlay: false,
    metaLoaded: false,
    headersOk: false,
    mime: "",
    ranges: "",
    error: "",
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    fetch(url, { method: "HEAD" })
      .then((res) => {
        const mime = res.headers.get("content-type") || "—";
        const ranges = res.headers.get("accept-ranges") || "—";
        const headersOk =
          mime.startsWith("video/") && ranges.includes("bytes");
        setStatus((s) => ({ ...s, mime, ranges, headersOk }));
        console.info("HEAD check:", { mime, ranges, headersOk });
      })
      .catch((err) => {
        console.warn("HEAD request failed", err);
      });

    const handleError = () => {
      const e = video.error;
      if (!e) return;
      const codes: Record<number, string> = {
        1: "MEDIA_ERR_ABORTED – загрузка прервана пользователем",
        2: "MEDIA_ERR_NETWORK – ошибка сети или CORS",
        3: "MEDIA_ERR_DECODE – формат/кодек не поддерживается",
        4: "MEDIA_ERR_SRC_NOT_SUPPORTED – источник или MIME неверный",
      };
      const msg = codes[e.code] || "Неизвестная ошибка";
      console.error("Video error:", e);
      setStatus((s) => ({ ...s, error: msg }));
    };

    const handleLoadedMetadata = () =>
      setStatus((s) => ({ ...s, metaLoaded: true }));
    const handleCanPlay = () =>
      setStatus((s) => ({ ...s, canPlay: true }));

    video.addEventListener("error", handleError);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("canplay", handleCanPlay);

    video.load();

    return () => {
      video.removeEventListener("error", handleError);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("canplay", handleCanPlay);
    };
  }, [url]);

  return (
    <div className={`relative flex flex-col items-center w-full ${className}`}>
      <video
        ref={videoRef}
        controls
        playsInline
        preload="auto"
        className="max-w-full max-h-full object-contain bg-black"
        src={url}
        style={{ width: '100%', height: 'auto' }}
      >
        Ваш браузер не поддерживает видео.
      </video>

      {status.error && (
        <div
          className="absolute bottom-2 left-2 text-[10px] bg-black/80 text-white p-2 rounded font-mono leading-tight"
          style={{ whiteSpace: "pre-wrap", maxWidth: "90%" }}
        >
          {[
            `🎞 MIME: ${status.mime}`,
            `📦 Accept-Ranges: ${status.ranges}`,
            `✅ Headers OK: ${status.headersOk ? "да" : "нет"}`,
            `📍 Metadata loaded: ${status.metaLoaded ? "да" : "нет"}`,
            `▶️ Can play: ${status.canPlay ? "да" : "нет"}`,
            `❌ Ошибка: ${status.error}`,
          ].join("\n")}
        </div>
      )}
    </div>
  );
}
