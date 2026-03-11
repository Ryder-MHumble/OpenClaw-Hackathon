import { motion } from "framer-motion";
import LobsterCharacter from "../LobsterCharacter";

export default function SafetyScene({ isActive, lobsterPos }) {
  const principles = [
    {
      icon: "lock",
      title: "数据安全",
      desc: "严禁非法获取或泄露用户隐私数据。参赛作品不得将 OpenClaw 暴露于公网，运行环境须做好权限隔离。",
    },
    {
      icon: "balance",
      title: "合规使用",
      desc: "不得用于违反法律法规及公序良俗的用途。严格管理插件来源，仅使用经可信渠道验证的扩展程序。",
    },
    {
      icon: "target",
      title: "透明可控",
      desc: "鼓励清晰展示虾的行为边界与安全机制。懂得有所不为、知道边界在哪里的虾，才是可靠的虾。",
    },
    {
      icon: "library_books",
      title: "尊重知识产权",
      desc: "虾所生成的内容应充分尊重原创版权与创作者权益。",
    },
    {
      icon: "handshake",
      title: "社会责任",
      desc: "以虾助力弱势群体、提升公共服务效率的作品，将获得评审的额外关注。",
    },
  ];

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: isActive ? 1 : 0 }}
        transition={{ duration: 0.8 }}
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(100,200,150,0.1) 0%, transparent 70%)",
        }}
      />

      <LobsterCharacter
        size={95}
        x={lobsterPos.x}
        y={lobsterPos.y}
        rotation={0}
        opacity={isActive ? 1 : 0}
      />

      <motion.div
        className="absolute top-16 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : -20 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="material-symbols-outlined text-3xl" style={{ color: "#ff5833" }}>
            security
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">安全与负责任使用</h2>
        </div>
        <p className="text-slate-400 text-sm">参赛作品须严格遵守以下原则</p>
      </motion.div>

      <div className="absolute inset-0 flex items-center justify-center px-6 pt-40 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl">
          {principles.map((principle, i) => (
            <motion.div
              key={i}
              className="p-5 rounded-xl backdrop-blur-sm"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,88,51,0.2)",
              }}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{
                opacity: isActive ? 1 : 0,
                y: isActive ? 0 : 20,
                scale: isActive ? 1 : 0.95,
              }}
              transition={{
                delay: isActive ? 0.2 + i * 0.12 : 0,
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ scale: 1.02, borderColor: "rgba(255,88,51,0.4)" }}
            >
              <motion.div
                className="flex items-center justify-center w-10 h-10 rounded-lg mb-3"
                style={{ background: "rgba(255,88,51,0.15)" }}
                initial={{ scale: 0, rotate: -20 }}
                animate={{
                  scale: isActive ? 1 : 0,
                  rotate: isActive ? 0 : -20,
                }}
                transition={{
                  delay: isActive ? 0.35 + i * 0.12 : 0,
                  duration: 0.4,
                  type: "spring",
                  bounce: 0.5,
                }}
              >
                <span
                  className="material-symbols-outlined text-lg"
                  style={{ color: "#ff5833" }}
                >
                  {principle.icon}
                </span>
              </motion.div>

              <h3 className="text-base font-bold text-white mb-2">{principle.title}</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {principle.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        className="absolute bottom-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: isActive ? 1 : 0 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        <p className="text-slate-500 text-xs font-mono">
          组委会将对违反上述原则的作品保留取消参赛资格的权利
        </p>
      </motion.div>
    </div>
  );
}
