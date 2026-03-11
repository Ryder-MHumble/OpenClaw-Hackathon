import { useState, useEffect } from "react";

/**
 * 检测设备类型：B端（Web/Desktop）或 C端（Mobile/App）
 *
 * B端特征：
 * - 桌面浏览器（Chrome, Firefox, Safari 等）
 * - 屏幕宽度 >= 1024px
 * - 支持鼠标事件
 *
 * C端特征：
 * - 移动设备（iOS, Android）
 * - 屏幕宽度 < 1024px
 * - 触摸设备
 * - 在 App 内打开（通过 User-Agent 检测）
 */
export function useDeviceType() {
  const [deviceType, setDeviceType] = useState("web");

  useEffect(() => {
    const detectDevice = () => {
      // 检测是否为移动设备
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );

      // 检测是否为触摸设备
      const isTouchDevice =
        () =>
          (navigator.maxTouchPoints !== undefined &&
            navigator.maxTouchPoints > 0) ||
          (navigator.msMaxTouchPoints !== undefined &&
            navigator.msMaxTouchPoints > 0) ||
          window.matchMedia("(pointer:coarse)").matches;

      // 检测屏幕宽度
      const isSmallScreen = window.innerWidth < 1024;

      // 检测是否在 App 内打开（可选，根据实际情况调整）
      const isInApp =
        navigator.userAgent.includes("OpenClaw") ||
        navigator.userAgent.includes("WebView");

      // 综合判断：移动设备或小屏幕或触摸设备 = C端
      if (isMobile || isSmallScreen || isTouchDevice()) {
        setDeviceType("mobile");
      } else {
        setDeviceType("web");
      }
    };

    detectDevice();

    // 监听窗口大小变化
    const handleResize = () => {
      detectDevice();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    deviceType,
    isWeb: deviceType === "web",
    isMobile: deviceType === "mobile",
  };
}
