import { motion, AnimatePresence } from "framer-motion";
import {
  Gavel,
  X,
  FileText,
  Shield,
  ShieldAlert,
  Lock,
  ShieldCheck,
  Eye,
  Heart,
  Copyright,
} from "lucide-react";

export function TermsModal({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-[#141210] border border-white/[0.08] shadow-2xl"
          >
            <div className="sticky top-0 flex items-center justify-between px-5 py-4 bg-[#141210]/95 backdrop-blur-md border-b border-white/[0.06] rounded-t-3xl sm:rounded-t-2xl">
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/20 sm:hidden" />
              <div className="flex items-center gap-2 pt-1 sm:pt-0">
                <Gavel className="text-primary" size={18} />
                <h3 className="font-bold text-white text-base">
                  参赛协议 & 安全声明
                </h3>
              </div>
              <button
                onClick={onClose}
                className="size-8 rounded-lg hover:bg-white/[0.08] flex items-center justify-center transition-colors"
              >
                <X className="text-slate-400" size={20} />
              </button>
            </div>
            <div className="px-5 py-6 space-y-6 text-sm leading-relaxed text-slate-300">
              <section>
                <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                  <FileText className="text-primary" size={16} />
                  参赛规则
                </h4>
                <ul className="space-y-1.5 text-slate-400">
                  <li>
                    ·
                    所有赛道不限身份、不限年龄、不限技术背景，线上提交，无需到场。
                  </li>
                  <li>
                    · 须提交项目说明书（10页以内）+
                    演示视频（3分钟以内），海报与链接为选填。
                  </li>
                  <li>· 每个邮箱仅可报名一次，每位参赛者每赛道限一份作品。</li>
                  <li>· 组委会保留对违规作品取消参赛资格的权利。</li>
                </ul>
              </section>
              <section>
                <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                  <Shield className="text-primary" size={16} />
                  安全与责任使用
                </h4>
                <div className="mb-3 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <p className="text-amber-200 text-xs leading-relaxed">
                    <span className="font-bold">⚠️ 重要提示：</span>
                    参赛作品须严格遵守以下原则，组委会将对违反上述原则的作品保留取消参赛资格的权利。参赛者须对自身作品的安全性负责。
                  </p>
                </div>
                <div className="space-y-2.5">
                  {[
                    {
                      icon: Lock,
                      title: "数据安全",
                      desc: "严禁非法获取或泄露用户隐私数据；运行环境做好权限隔离",
                    },
                    {
                      icon: ShieldCheck,
                      title: "合规使用",
                      desc: "不违法、不违背公序良俗，仅用可信插件",
                    },
                    {
                      icon: Eye,
                      title: "透明可控",
                      desc: "鼓励清晰展示「虾」的行为边界与安全机制",
                    },
                    {
                      icon: Heart,
                      title: "社会责任",
                      desc: "鼓励用「虾」创造社会价值",
                    },
                    {
                      icon: Copyright,
                      title: "尊重知识产权",
                      desc: "生成内容须尊重原创版权。组委会保留取消违规作品资格的权利。参赛者须对作品安全负责。",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex gap-3 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05]"
                    >
                      <item.icon
                        className="text-primary/70 flex-shrink-0 mt-0.5"
                        size={16}
                      />
                      <span className="text-slate-400">
                        <span className="text-white font-semibold">
                          {item.title}：
                        </span>
                        {item.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
              <section>
                <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                  <ShieldAlert className="text-primary" size={16} />
                  隐私政策
                </h4>
                <ul className="space-y-1.5 text-slate-400">
                  <li>
                    · 个人信息仅用于赛事通知和奖项发放，不对外出售或滥用。
                  </li>
                  <li>· 参赛者授权组委会在宣传中展示项目标题与获奖信息。</li>
                  <li>· 参赛者保留对自身作品的完整知识产权。</li>
                </ul>
              </section>
              <p className="text-slate-600 text-xs pt-2 border-t border-white/[0.05]">
                主办：北京中关村学院 · 中关村人工智能研究院 · AI商学院
                <br />
                赞助：北京中关村学院教育基金会 · 海淀区西北旺政府
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
