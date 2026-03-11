import { useState } from "react";
import { API_BASE_URL } from "../../config/api";

export function ProjectViewer({ participant, activeTab, setActiveTab, videoEmbedUrl }) {
  const [loadingStates, setLoadingStates] = useState({
    pdf: true,
    video: true,
    poster: true,
  });
  const [failedLoads, setFailedLoads] = useState({
    pdf: false,
    video: false,
    poster: false,
  });

  const tabs = [
    { id: "pdf", label: "项目说明书", icon: "picture_as_pdf" },
    { id: "video", label: "演示视频", icon: "play_circle" },
    { id: "links", label: "项目链接", icon: "link" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Tab 切换 */}
      <div className="flex gap-2 p-4 border-b border-white/10 bg-background-dark/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? "bg-primary text-white"
                : "bg-white/5 text-slate-400 hover:bg-white/10"
            }`}
          >
            <span className="material-symbols-outlined text-base">
              {tab.icon}
            </span>
            <span className="text-sm">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "pdf" &&
          (participant.pdf_url ? (
            <div className="w-full h-full relative">
              {loadingStates.pdf && (
                <div className="absolute inset-0 flex items-center justify-center bg-background-dark/40 z-10">
                  <div className="flex flex-col items-center gap-3">
                    <svg
                      className="animate-spin size-8 text-primary"
                      viewBox="0 0 24 24"
                      fill="none"
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
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    <span className="text-xs text-slate-400">加载中...</span>
                  </div>
                </div>
              )}
              <iframe
                src={`${API_BASE_URL}/api/proxy-pdf?url=${encodeURIComponent(participant.pdf_url)}`}
                className="w-full h-full"
                title="项目说明书"
                onLoad={() =>
                  setLoadingStates((prev) => ({ ...prev, pdf: false }))
                }
                onError={() => {
                  setLoadingStates((prev) => ({ ...prev, pdf: false }));
                  setFailedLoads((prev) => ({ ...prev, pdf: true }));
                }}
              />
              {failedLoads.pdf && (
                <div className="absolute inset-0 flex items-center justify-center bg-background-dark/40 z-10">
                  <div className="flex flex-col items-center gap-4 bg-background-dark/80 p-6 rounded-lg">
                    <span className="material-symbols-outlined text-4xl text-yellow-500">
                      warning
                    </span>
                    <div className="text-center">
                      <p className="text-sm font-medium mb-2">
                        无法在当前窗口加载PDF
                      </p>
                      <p className="text-xs text-slate-400 mb-4">
                        请点击下方按钮在新窗口打开
                      </p>
                    </div>
                    <a
                      href={participant.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-all"
                    >
                      在新窗口打开 PDF
                    </a>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
              <span className="material-symbols-outlined text-6xl mb-4 opacity-30">
                picture_as_pdf
              </span>
              <p className="text-sm">暂无项目计划书</p>
            </div>
          ))}

        {activeTab === "video" &&
          (participant.video_url && videoEmbedUrl ? (
            <div className="w-full h-full relative flex items-center justify-center bg-background-dark/20">
              {loadingStates.video && (
                <div className="absolute inset-0 flex items-center justify-center bg-background-dark/40 z-10">
                  <div className="flex flex-col items-center gap-3">
                    <svg
                      className="animate-spin size-8 text-primary"
                      viewBox="0 0 24 24"
                      fill="none"
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
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    <span className="text-xs text-slate-400">加载中...</span>
                  </div>
                </div>
              )}
              <iframe
                src={videoEmbedUrl}
                className="w-full h-full"
                title="演示视频"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={() =>
                  setLoadingStates((prev) => ({ ...prev, video: false }))
                }
                onError={() => {
                  setLoadingStates((prev) => ({ ...prev, video: false }));
                  setFailedLoads((prev) => ({ ...prev, video: true }));
                }}
              />
              {failedLoads.video && (
                <div className="absolute inset-0 flex items-center justify-center bg-background-dark/40 z-10">
                  <div className="flex flex-col items-center gap-4 bg-background-dark/80 p-6 rounded-lg">
                    <span className="material-symbols-outlined text-4xl text-yellow-500">
                      warning
                    </span>
                    <div className="text-center">
                      <p className="text-sm font-medium mb-2">
                        无法在当前窗口加载视频
                      </p>
                      <p className="text-xs text-slate-400 mb-4">
                        请点击下方按钮在新窗口打开
                      </p>
                    </div>
                    <a
                      href={participant.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-all"
                    >
                      在新窗口打开视频
                    </a>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
              <span className="material-symbols-outlined text-6xl mb-4 opacity-30">
                play_circle
              </span>
              <p className="text-sm">暂无演示视频</p>
            </div>
          ))}

        {activeTab === "links" && (
          <div className="p-6 space-y-4">
            <div className="space-y-3">
              {participant.repo_url && (
                <a
                  href={participant.repo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                >
                  <span className="material-symbols-outlined text-primary">
                    code
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium mb-1">项目仓库</p>
                    <p className="text-xs text-slate-400 truncate">
                      {participant.repo_url}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">
                    open_in_new
                  </span>
                </a>
              )}
              {participant.poster_url && (
                <a
                  href={participant.poster_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                >
                  <span className="material-symbols-outlined text-primary">
                    image
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium mb-1">项目海报</p>
                    <p className="text-xs text-slate-400 truncate">
                      {participant.poster_url}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">
                    open_in_new
                  </span>
                </a>
              )}
              {!participant.repo_url && !participant.poster_url && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <span className="material-symbols-outlined text-6xl mb-4 opacity-30">
                    link_off
                  </span>
                  <p className="text-sm">暂无项目链接</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
