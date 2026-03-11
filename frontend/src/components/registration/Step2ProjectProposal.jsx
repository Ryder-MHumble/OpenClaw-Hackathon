import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import {
  PanelHeader,
  MonoField,
  AssetUrlRow,
  TerminalInput,
} from "./FormInputs";
import { TRACKS } from "../../constants/registration";

export function Step2ProjectProposal({ formData, set }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-panel rounded-2xl overflow-hidden"
    >
      <PanelHeader
        label="02_PROJECT.PROPOSAL"
        ready={
          !!(
            formData.track &&
            formData.projectTitle &&
            formData.projectDescription &&
            formData.pdfUrl &&
            formData.videoUrl
          )
        }
      />

      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
        {/* Track selector */}
        <div>
          <label className="font-mono text-xs text-slate-400 tracking-widest uppercase block font-semibold mb-3">
            track.selection <span className="text-primary ml-1">*</span>
          </label>
          <p className="text-xs text-slate-500 mb-3">
            选择你的参赛赛道（不限身份 · 不限年龄 · 不限技术背景）
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TRACKS.map((track) => {
              const isSelected = formData.track === track.id;
              return (
                <motion.button
                  key={track.id}
                  type="button"
                  onClick={() => set("track", track.id)}
                  whileTap={{ scale: 0.97 }}
                  className={`relative flex flex-col p-3 sm:p-4 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer
                    ${
                      isSelected
                        ? `${track.bg} ${track.activeBorder} shadow-lg`
                        : `bg-white/[0.02] ${track.border} hover:bg-white/[0.04]`
                    }`}
                >
                  <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                    <span className="text-xl sm:text-2xl">{track.emoji}</span>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={track.color}
                      >
                        <CheckCircle size={16} className="sm:w-4 sm:h-4" />
                      </motion.div>
                    )}
                  </div>
                  <p
                    className={`font-bold text-xs sm:text-sm ${isSelected ? track.color : "text-slate-300"}`}
                  >
                    {track.title}
                  </p>
                  <p
                    className={`text-[10px] sm:text-xs mt-0.5 ${isSelected ? "text-slate-300" : "text-slate-500"}`}
                  >
                    {track.subtitle}
                  </p>
                  <p
                    className={`text-[10px] sm:text-xs mt-1.5 sm:mt-2 leading-snug ${isSelected ? "text-slate-400" : "text-slate-600"}`}
                  >
                    {track.desc}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Project title */}
        <MonoField label="project.title" required>
          <input
            className="mono-input text-base font-semibold"
            placeholder="你的龙虾叫什么名字 / 能做什么事"
            type="text"
            value={formData.projectTitle}
            required
            onChange={(e) => set("projectTitle", e.target.value)}
          />
        </MonoField>

        {/* Project description */}
        <MonoField label="project.description" required>
          <textarea
            className="w-full bg-[rgba(255,255,255,0.02)] border-b-2 border-[rgba(100,80,75,0.5)] focus:border-primary/80 focus:bg-[rgba(255,255,255,0.04)] focus:outline-none text-slate-100 text-sm placeholder:text-slate-500 px-4 py-4 resize-none leading-relaxed transition-all rounded-t-lg"
            placeholder="你的虾能干什么？解决了什么问题？效果如何？…"
            rows={4}
            value={formData.projectDescription}
            required
            onChange={(e) => set("projectDescription", e.target.value)}
          />
          <p className="text-right font-mono text-[10px] text-slate-500 mt-1">
            {formData.projectDescription.length} chars
          </p>
        </MonoField>

        {/* Material links */}
        <div>
          <p className="font-mono text-xs text-slate-400 tracking-widest uppercase mb-1.5 font-semibold">
            assets.manifest
          </p>
          <p className="text-xs text-slate-500 mb-3 leading-relaxed">
            将文件上传至 Google Drive / 腾讯文档 / 飞书 / 钉钉后粘贴分享链接
          </p>
          <div className="space-y-2.5">
            <AssetUrlRow
              badge="项目说明书"
              badgeColor="text-red-400 bg-red-400/10 border-red-400/20"
              placeholder="项目说明书链接（10页以内 · 必填）"
              value={formData.pdfUrl}
              onChange={(v) => set("pdfUrl", v)}
            />
            <AssetUrlRow
              badge="项目海报"
              badgeColor="text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
              placeholder="宣传海报图片链接（必填）"
              value={formData.posterUrl}
              onChange={(v) => set("posterUrl", v)}
            />
            <AssetUrlRow
              badge="vid://"
              badgeColor="text-purple-400 bg-purple-400/10 border-purple-400/20"
              placeholder="演示视频链接（YouTube / Bilibili · 3分钟以内 · 必填）"
              value={formData.videoUrl}
              onChange={(v) => set("videoUrl", v)}
            />
          </div>
        </div>

        {/* Links */}
        <div>
          <p className="font-mono text-xs text-slate-400 tracking-widest uppercase mb-3 font-semibold">
            project.links
          </p>
          <div className="space-y-2.5">
            <TerminalInput
              prefix="git://"
              placeholder="GitHub 仓库地址（选填）"
              value={formData.repoUrl}
              onChange={(v) => set("repoUrl", v)}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
