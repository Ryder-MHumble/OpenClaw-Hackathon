import { useState, useEffect } from "react";

/**
 * 设备检测工具
 * 用于判断当前访问设备是移动端（C端）还是桌面端（B端）
 */

/**
 * 检测是否为移动设备
 * @returns {boolean} true 表示移动端（C端），false 表示桌面端（B端）
 */
export const isMobileDevice = () => {
  // 检测 User Agent
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;

  // 移动设备的 User Agent 特征
  const mobileRegex =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i;

  // 检测触摸屏
  const hasTouchScreen =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;

  // 检测屏幕宽度（小于 1024px 视为移动端）
  const isSmallScreen = window.innerWidth < 1024;

  return mobileRegex.test(userAgent) || (hasTouchScreen && isSmallScreen);
};

/**
 * React Hook: 实时监听设备类型变化
 * @returns {boolean} true 表示移动端（C端），false 表示桌面端（B端）
 */
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(isMobileDevice());

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(isMobileDevice());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
};
