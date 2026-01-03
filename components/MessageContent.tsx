import { useState, useEffect } from "react";

interface MessageContentProps {
  content: string;
  formattedContent?: string;
  format?: string;
  className?: string;
  type?: string;
  fileUrl?: string;
  fileInfo?: {
    mimetype?: string;
    size?: number;
    w?: number;
    h?: number;
  };
  getMediaUrl?: (mxcUrl: string) => string;
  fetchAuthenticatedMedia?: (mxcUrl: string) => Promise<string>;
  onImageClick?: (imageUrl: string, imageName: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function MessageContent({
  content,
  formattedContent,
  format,
  className = "text-gray-200 text-xs sm:text-sm break-words",
  type = "m.text",
  fileUrl,
  fileInfo,
  getMediaUrl,
  fetchAuthenticatedMedia,
  onImageClick,
}: MessageContentProps) {
  const [blobUrl, setBlobUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Fetch authenticated media for images
  useEffect(() => {
    console.log("MessageContent useEffect triggered", {
      type,
      fileUrl,
      hasFetchFunc: !!fetchAuthenticatedMedia,
    });

    if (type !== "m.image" || !fileUrl) {
      console.log("MessageContent: Skipping image fetch", { type, fileUrl });
      return;
    }

    // If it's already an HTTP(S) URL (from custom backend/R2), use it directly
    if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
      console.log("MessageContent: Using direct HTTP URL:", fileUrl);
      setBlobUrl(fileUrl);
      setLoading(false);
      setError(false);
      return;
    }

    // Otherwise, it's an MXC URL that needs fetching
    if (!fetchAuthenticatedMedia) {
      console.log("MessageContent: No fetch function for MXC URL");
      setError(true);
      return;
    }

    let cancelled = false;

    const loadImage = async () => {
      console.log("MessageContent: Starting image load for MXC:", fileUrl);
      try {
        const url = await fetchAuthenticatedMedia(fileUrl);
        if (cancelled) return;

        if (url) {
          setBlobUrl(url);
          setError(false);
        } else {
          setError(true);
        }
      } catch (err) {
        if (cancelled) return;
        setError(true);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    setLoading(true);
    setError(false);
    loadImage();

    // Cleanup
    return () => {
      cancelled = true;
      // Only revoke blob URLs, not HTTP URLs
      if (blobUrl && blobUrl.startsWith("blob:")) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [type, fileUrl, fetchAuthenticatedMedia]); // Don't include blobUrl in dependencies

  // Handle image messages
  if (type === "m.image" && fileUrl) {
    console.log("MessageContent: Image message detected", {
      type,
      fileUrl,
      loading,
      error,
      blobUrl,
    });

    if (loading) {
      return (
        <div className="my-2 px-4 py-3 bg-gray-800/60 border border-gray-700/50 rounded-lg">
          <div className="flex items-center gap-3 text-gray-400 text-sm">
            <div className="animate-spin">
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <span>Loading image...</span>
          </div>
        </div>
      );
    }

    if (error || !blobUrl) {
      return (
        <div className="my-2 px-4 py-3 bg-red-900/20 border border-red-700/50 rounded-lg">
          <p className="text-sm text-red-300">
            Failed to load image: {content}
          </p>
        </div>
      );
    }

    return (
      <div className="my-2">
        <div
          onClick={() => onImageClick?.(blobUrl, content)}
          className="cursor-pointer inline-block"
        >
          <img
            src={blobUrl}
            alt={content}
            className="max-w-full max-h-96 rounded-lg shadow-lg hover:opacity-90 transition-opacity"
            style={{
              maxWidth: fileInfo?.w ? Math.min(fileInfo.w, 400) : 400,
            }}
            onError={() => {
              setError(true);
            }}
          />
        </div>
        {content && <p className="text-xs text-gray-400 mt-1">{content}</p>}
      </div>
    );
  }

  // Handle file messages
  if (type === "m.file" && fileUrl && getMediaUrl) {
    const httpUrl = getMediaUrl(fileUrl);
    return (
      <div className="my-2">
        <a
          href={httpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700/50 rounded-lg transition-all duration-200 max-w-sm group"
        >
          <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-indigo-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate group-hover:text-indigo-300 transition-colors">
              {content}
            </p>
            {fileInfo?.size && (
              <p className="text-xs text-gray-500">
                {formatFileSize(fileInfo.size)}
              </p>
            )}
          </div>
          <svg
            className="w-5 h-5 text-gray-400 group-hover:text-indigo-400 transition-colors flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        </a>
      </div>
    );
  }

  // Handle formatted text messages
  if (format === "org.matrix.custom.html" && formattedContent) {
    return (
      <div
        className={`prose prose-invert prose-sm max-w-none break-words
                   prose-p:my-1 prose-p:leading-relaxed
                   prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:border prose-pre:border-gray-700
                   prose-code:text-indigo-300 prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                   prose-code:before:content-[''] prose-code:after:content-['']
                   prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline
                   prose-strong:text-white prose-strong:font-bold
                   prose-em:text-gray-200 prose-em:italic
                   prose-h1:text-white prose-h2:text-white prose-h3:text-white
                   prose-ul:my-1 prose-ol:my-1 prose-li:my-0
                   prose-blockquote:border-l-indigo-500 prose-blockquote:bg-gray-800/50 prose-blockquote:py-1
                   ${className}`}
        dangerouslySetInnerHTML={{ __html: formattedContent }}
      />
    );
  }

  // Handle plain text messages
  return <p className={className}>{content}</p>;
}
