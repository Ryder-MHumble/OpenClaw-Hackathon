import { useEffect, useRef } from "react";

export default function LobsterSwimAnimation() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setCanvasSize();

    // Lobster class
    class Lobster {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = 15 + Math.random() * 25;
        this.speed = 0.3 + Math.random() * 0.8;
        this.depth = Math.random(); // 0-1, for opacity
        this.angle = Math.random() * Math.PI * 2;
        this.wobbleOffset = Math.random() * Math.PI * 2;
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.changeDirTimer = 0;
        this.changeDirInterval = 60 + Math.random() * 120;

        // Life cycle
        this.lifespan = 300 + Math.random() * 300;
        this.age = 0;
      }

      update() {
        // Update position with sine wave for natural swimming
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.wobbleOffset) * this.speed * 0.5;

        // Occasional direction changes
        this.changeDirTimer++;
        if (this.changeDirTimer > this.changeDirInterval) {
          this.angle += (Math.random() - 0.5) * 0.5;
          this.changeDirTimer = 0;
          this.changeDirInterval = 60 + Math.random() * 120;
        }

        this.wobbleOffset += 0.05;
        this.age++;

        // Wrap around screen
        if (this.x > canvas.width + 100) this.x = -50;
        if (this.x < -100) this.x = canvas.width + 50;
        if (this.y > canvas.height + 100) this.y = -50;
        if (this.y < -100) this.y = canvas.height + 50;
      }

      draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        const lifeAlpha =
          this.age < 30
            ? this.age / 30
            : this.age > this.lifespan - 30
              ? (this.lifespan - this.age) / 30
              : 1;
        const baseOpacity = 0.3 + this.depth * 0.6;
        const op = baseOpacity * lifeAlpha;
        const s = this.size; // shorthand

        // === 与 LobsterLogo SVG 相同的横向造型 ===
        // 坐标系：龙虾朝左游（头在-x方向），尾扇在+x方向
        // SVG viewBox 0 0 80 60，中心约在(40,30)，这里以 s=1 对应 SVG 的 1/20

        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // ── 头胸甲（主体椭圆）──
        ctx.fillStyle = `rgba(255, 88, 51, ${op * 0.95})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.8, s * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // ── 腹部节段（向右依次缩小）──
        ctx.fillStyle = `rgba(255, 88, 51, ${op * 0.9})`;
        ctx.beginPath();
        ctx.ellipse(s * 0.8, 0, s * 0.35, s * 0.375, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 88, 51, ${op * 0.85})`;
        ctx.beginPath();
        ctx.ellipse(s * 1.25, 0, s * 0.25, s * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 88, 51, ${op * 0.8})`;
        ctx.beginPath();
        ctx.ellipse(s * 1.6, 0, s * 0.175, s * 0.225, 0, 0, Math.PI * 2);
        ctx.fill();

        // ── 尾扇（右端，5 片）──
        ctx.fillStyle = `rgba(255, 88, 51, ${op * 0.75})`;
        const fanAngles = [-0.55, -0.28, 0, 0.28, 0.55];
        for (const fa of fanAngles) {
          ctx.beginPath();
          ctx.moveTo(s * 1.75, 0);
          ctx.quadraticCurveTo(
            s * 1.75 + Math.cos(fa) * s * 0.3,
            Math.sin(fa) * s * 0.3,
            s * 1.75 + Math.cos(fa) * s * 0.55,
            Math.sin(fa) * s * 0.55,
          );
          ctx.lineTo(
            s * 1.75 + Math.cos(fa) * s * 0.45,
            Math.sin(fa) * s * 0.55 + Math.cos(fa) * s * 0.06,
          );
          ctx.quadraticCurveTo(
            s * 1.75 + Math.cos(fa) * s * 0.2,
            Math.sin(fa) * s * 0.2,
            s * 1.75,
            0,
          );
          ctx.fill();
        }

        // ── 眼睛（头部左侧，上下各一）──
        ctx.fillStyle = `rgba(255, 88, 51, ${op})`;
        ctx.beginPath();
        ctx.arc(-s * 0.65, -s * 0.3, s * 0.14, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-s * 0.65, s * 0.3, s * 0.14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(15, 5, 2, ${op})`;
        ctx.beginPath();
        ctx.arc(-s * 0.65, -s * 0.3, s * 0.065, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-s * 0.65, s * 0.3, s * 0.065, 0, Math.PI * 2);
        ctx.fill();

        // ── 触角（长，从眼部向左前方延伸）──
        ctx.strokeStyle = `rgba(255, 100, 65, ${op * 0.8})`;
        ctx.lineWidth = s * 0.07;
        ctx.beginPath();
        ctx.moveTo(-s * 0.62, -s * 0.3);
        ctx.quadraticCurveTo(-s * 1.1, -s * 0.8, -s * 1.5, -s * 1.3);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-s * 0.62, s * 0.3);
        ctx.quadraticCurveTo(-s * 1.1, s * 0.8, -s * 1.5, s * 1.3);
        ctx.stroke();

        ctx.lineWidth = s * 0.045;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(-s * 0.62, -s * 0.3);
        ctx.quadraticCurveTo(-s * 0.95, -s * 0.55, -s * 1.15, -s * 0.75);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-s * 0.62, s * 0.3);
        ctx.quadraticCurveTo(-s * 0.95, s * 0.55, -s * 1.15, s * 0.75);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // ── 上方大螯（claw，向左上伸出）──
        ctx.strokeStyle = `rgba(255, 88, 51, ${op * 0.9})`;
        ctx.lineWidth = s * 0.14;
        ctx.beginPath();
        ctx.moveTo(-s * 0.4, -s * 0.3);
        ctx.quadraticCurveTo(-s * 0.9, -s * 0.5, -s * 1.2, -s * 0.4);
        ctx.stroke();
        // 螯钳上叶
        ctx.fillStyle = `rgba(255, 88, 51, ${op * 0.9})`;
        ctx.beginPath();
        ctx.moveTo(-s * 1.2, -s * 0.4);
        ctx.lineTo(-s * 1.4, -s * 0.6);
        ctx.lineTo(-s * 1.25, -s * 0.25);
        ctx.closePath();
        ctx.fill();
        // 螯钳下叶
        ctx.beginPath();
        ctx.moveTo(-s * 1.2, -s * 0.4);
        ctx.lineTo(-s * 1.45, -s * 0.3);
        ctx.lineTo(-s * 1.25, -s * 0.18);
        ctx.closePath();
        ctx.fill();

        // ── 下方大螯（claw，向左下伸出）──
        ctx.strokeStyle = `rgba(255, 88, 51, ${op * 0.9})`;
        ctx.lineWidth = s * 0.14;
        ctx.beginPath();
        ctx.moveTo(-s * 0.4, s * 0.3);
        ctx.quadraticCurveTo(-s * 0.9, s * 0.5, -s * 1.2, s * 0.4);
        ctx.stroke();
        ctx.fillStyle = `rgba(255, 88, 51, ${op * 0.9})`;
        ctx.beginPath();
        ctx.moveTo(-s * 1.2, s * 0.4);
        ctx.lineTo(-s * 1.4, s * 0.6);
        ctx.lineTo(-s * 1.25, s * 0.25);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-s * 1.2, s * 0.4);
        ctx.lineTo(-s * 1.45, s * 0.3);
        ctx.lineTo(-s * 1.25, s * 0.18);
        ctx.closePath();
        ctx.fill();

        // ── 步足（上下各 3 对，从头胸甲伸出）──
        ctx.strokeStyle = `rgba(255, 100, 65, ${op * 0.7})`;
        ctx.lineWidth = s * 0.07;
        const legXOffsets = [-s * 0.1, s * 0.1, s * 0.3];
        for (const lx of legXOffsets) {
          // 上侧
          ctx.beginPath();
          ctx.moveTo(lx, -s * 0.48);
          ctx.quadraticCurveTo(
            lx - s * 0.05,
            -s * 0.75,
            lx - s * 0.1,
            -s * 0.9,
          );
          ctx.stroke();
          // 下侧
          ctx.beginPath();
          ctx.moveTo(lx, s * 0.48);
          ctx.quadraticCurveTo(lx - s * 0.05, s * 0.75, lx - s * 0.1, s * 0.9);
          ctx.stroke();
        }

        ctx.restore();
      }

      isAlive() {
        return this.age < this.lifespan;
      }
    }

    // Initialize lobsters
    const lobsters = [];
    const minLobsterCount = 10;

    // Create initial lobsters
    for (let i = 0; i < minLobsterCount; i++) {
      lobsters.push(new Lobster());
    }

    let animationId;
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw lobsters
      for (let i = lobsters.length - 1; i >= 0; i--) {
        const lobster = lobsters[i];
        lobster.update();

        if (lobster.isAlive()) {
          lobster.draw(ctx);
        } else {
          lobsters.splice(i, 1);
        }
      }

      // Spawn new lobsters if count is below target
      while (lobsters.length < minLobsterCount) {
        lobsters.push(new Lobster());
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      setCanvasSize();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
