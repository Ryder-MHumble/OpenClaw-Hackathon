import { motion } from "framer-motion";
import { PanelHeader, MonoField } from "./FormInputs";

export function Step1PersonalInfo({ formData, set }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-panel rounded-2xl overflow-hidden"
    >
      <PanelHeader
        label="01_PERSONAL.INFO"
        ready={
          !!(
            formData.fullName &&
            formData.email &&
            formData.organization
          )
        }
      />
      <div className="p-4 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 sm:gap-x-12 gap-y-6 sm:gap-y-8">
        <MonoField label="name" required>
          <input
            className="mono-input"
            placeholder="真实姓名"
            type="text"
            value={formData.fullName}
            required
            onChange={(e) => set("fullName", e.target.value)}
          />
        </MonoField>
        <MonoField label="email" required>
          <input
            className="mono-input"
            placeholder="用于接收赛事通知"
            type="email"
            value={formData.email}
            required
            onChange={(e) => set("email", e.target.value)}
          />
        </MonoField>
        <MonoField label="organization" required>
          <input
            className="mono-input"
            placeholder="公司、大学或研究所"
            type="text"
            value={formData.organization}
            required
            onChange={(e) => set("organization", e.target.value)}
          />
        </MonoField>
        <MonoField label="phone" required>
          <input
            className="mono-input"
            placeholder="便于紧急联系（选填）"
            type="tel"
            value={formData.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </MonoField>
      </div>
    </motion.div>
  );
}
