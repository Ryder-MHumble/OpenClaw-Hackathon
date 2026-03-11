import { useEffect, useRef } from "react";

export default function LobsterSwimAnimation() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Optimize canvas rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "low";

    // Set canvas size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setCanvasSize();

    // Particle class for collision effects
    class Particle {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.life = 20;
        this.maxLife = 20;
        this.size = 2 + Math.random() * 4;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.95;
        this.vy *= 0.95;
        this.life--;
      }

      draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = `rgba(255, 120, 80, ${alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }

      isAlive() {
        return this.life > 0;
      }
    }

    // Lobster class with fighting system
    class Lobster {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = 15 + Math.random() * 25;
        this.speed = 0.5 + Math.random() * 0.7;
        this.depth = Math.random();
        this.angle = Math.random() * Math.PI * 2;
        this.wobbleOffset = Math.random() * Math.PI * 2;
        this.changeDirTimer = 0;
        this.changeDirInterval = 80 + Math.random() * 100;

        // Fighting system
        this.isFighting = false;
        this.fightTarget = null;
        this.fightCooldown = 0;
        this.clawSwingAngle = 0;
        this.clawSwingSpeed = 0;
        this.hitFlash = 0;
        this.shakeX = 0;
        this.shakeY = 0;

        // Life cycle
        this.lifespan = 300 + Math.random() * 300;
        this.age = 0;
      }

      checkCollision(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const collisionRadius = (this.size + other.size) * 0.6;
        return distance < collisionRadius;
      }

      findNearestTarget(lobsters) {
        let nearest = null;
        let minDist = Infinity;
        for (const other of lobsters) {
          if (other === this) continue;
          const dx = this.x - other.x;
          const dy = this.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDist && dist < 200) {
            minDist = dist;
            nearest = other;
          }
        }
        return nearest;
      }

      update(lobsters) {
        // Cooldown management
        if (this.fightCooldown > 0) {
          this.fightCooldown--;
        }

        // Find target for fighting
        if (
          !this.isFighting &&
          this.fightCooldown === 0 &&
          Math.random() < 0.02
        ) {
          const target = this.findNearestTarget(lobsters);
          if (target) {
            this.isFighting = true;
            this.fightTarget = target;
            this.clawSwingSpeed = 0.3;
          }
        }

        // Fighting behavior
        let collisionEvent = null;
        if (this.isFighting && this.fightTarget) {
          // Check collision
          if (this.checkCollision(this.fightTarget)) {
            this.hitFlash = 10;
            this.fightTarget.hitFlash = 10;
            this.shakeX = (Math.random() - 0.5) * 4;
            this.shakeY = (Math.random() - 0.5) * 4;

            collisionEvent = {
              x: (this.x + this.fightTarget.x) / 2,
              y: (this.y + this.fightTarget.y) / 2,
            };
          }

          // Move towards target
          const dx = this.fightTarget.x - this.x;
          const dy = this.fightTarget.y - this.y;
          this.angle = Math.atan2(dy, dx);

          // Claw swinging
          this.clawSwingAngle += this.clawSwingSpeed;
          if (Math.abs(this.clawSwingAngle) > 0.5) {
            this.clawSwingSpeed *= -1;
          }

          // Random end fighting
          if (Math.random() < 0.01) {
            this.isFighting = false;
            this.fightTarget = null;
            this.fightCooldown = 60 + Math.random() * 120;
            this.clawSwingAngle = 0;
          }
        }

        // Normal movement
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.wobbleOffset) * this.speed * 0.5;

        // Direction changes
        this.changeDirTimer++;
        if (this.changeDirTimer > this.changeDirInterval) {
          this.angle += (Math.random() - 0.5) * 0.5;
          this.changeDirTimer = 0;
          this.changeDirInterval = 80 + Math.random() * 100;
        }

        this.wobbleOffset += 0.05;
        this.age++;

        // Decay effects
        this.shakeX *= 0.8;
        this.shakeY *= 0.8;
        this.hitFlash = Math.max(0, this.hitFlash - 1);

        // Wrap around screen
        if (this.x > canvas.width + 100) this.x = -50;
        if (this.x < -100) this.x = canvas.width + 50;
        if (this.y > canvas.height + 100) this.y = -50;
        if (this.y < -100) this.y = canvas.height + 50;

        return collisionEvent;
      }

      draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.shakeX, this.y + this.shakeY);
        ctx.rotate(this.angle);

        const lifeAlpha =
          this.age < 30
            ? this.age / 30
            : this.age > this.lifespan - 30
              ? (this.lifespan - this.age) / 30
              : 1;
        const baseOpacity = 0.3 + this.depth * 0.6;
        const op = baseOpacity * lifeAlpha;
        const s = this.size;

        // Color boost when fighting or hit
        const redBoost = this.isFighting ? 40 : 0;
        const flashBoost = this.hitFlash * 15;
        const colorR = Math.min(255, 255 + flashBoost);
        const colorG = Math.min(150, 88 + redBoost);

        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Body
        ctx.fillStyle = `rgba(${colorR}, ${colorG}, 51, ${op * 0.95})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.8, s * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Abdomen segments
        ctx.fillStyle = `rgba(${colorR}, ${colorG}, 51, ${op * 0.9})`;
        ctx.beginPath();
        ctx.ellipse(s * 0.8, 0, s * 0.35, s * 0.375, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(${colorR}, ${colorG}, 51, ${op * 0.85})`;
        ctx.beginPath();
        ctx.ellipse(s * 1.25, 0, s * 0.25, s * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(${colorR}, ${colorG}, 51, ${op * 0.8})`;
        ctx.beginPath();
        ctx.ellipse(s * 1.6, 0, s * 0.175, s * 0.225, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tail fan
        ctx.fillStyle = `rgba(${colorR}, ${colorG}, 51, ${op * 0.75})`;
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

        // Eyes
        ctx.fillStyle = `rgba(${colorR}, ${colorG}, 51, ${op})`;
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

        // Antennae
        ctx.strokeStyle = `rgba(${colorR}, ${colorG + 20}, 80, ${op * 0.8})`;
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

        // Claws with fighting animation
        ctx.strokeStyle = `rgba(${colorR}, ${colorG}, 51, ${op * 0.9})`;
        ctx.lineWidth = s * 0.14;

        // Upper claw
        ctx.save();
        if (this.isFighting) {
          ctx.rotate(this.clawSwingAngle);
        }
        ctx.beginPath();
        ctx.moveTo(-s * 0.4, -s * 0.3);
        ctx.quadraticCurveTo(-s * 0.9, -s * 0.5, -s * 1.2, -s * 0.4);
        ctx.stroke();
        ctx.fillStyle = `rgba(${colorR}, ${colorG}, 51, ${op * 0.9})`;
        ctx.beginPath();
        ctx.moveTo(-s * 1.2, -s * 0.4);
        ctx.lineTo(-s * 1.4, -s * 0.6);
        ctx.lineTo(-s * 1.25, -s * 0.25);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-s * 1.2, -s * 0.4);
        ctx.lineTo(-s * 1.45, -s * 0.3);
        ctx.lineTo(-s * 1.25, -s * 0.18);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Lower claw
        ctx.save();
        if (this.isFighting) {
          ctx.rotate(-this.clawSwingAngle);
        }
        ctx.strokeStyle = `rgba(${colorR}, ${colorG}, 51, ${op * 0.9})`;
        ctx.lineWidth = s * 0.14;
        ctx.beginPath();
        ctx.moveTo(-s * 0.4, s * 0.3);
        ctx.quadraticCurveTo(-s * 0.9, s * 0.5, -s * 1.2, s * 0.4);
        ctx.stroke();
        ctx.fillStyle = `rgba(${colorR}, ${colorG}, 51, ${op * 0.9})`;
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
        ctx.restore();

        // Legs
        ctx.strokeStyle = `rgba(${colorR}, ${colorG + 20}, 80, ${op * 0.7})`;
        ctx.lineWidth = s * 0.07;
        const legXOffsets = [-s * 0.1, s * 0.1, s * 0.3];
        for (const lx of legXOffsets) {
          ctx.beginPath();
          ctx.moveTo(lx, -s * 0.48);
          ctx.quadraticCurveTo(
            lx - s * 0.05,
            -s * 0.75,
            lx - s * 0.1,
            -s * 0.9,
          );
          ctx.stroke();
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

    // Initialize lobsters and particles
    const lobsters = [];
    const particles = [];
    const minLobsterCount = 6; // 减少龙虾数量从12到6

    for (let i = 0; i < minLobsterCount; i++) {
      lobsters.push(new Lobster());
    }

    let animationId;
    let lastTime = performance.now();
    const targetFPS = 30; // 限制帧率到30fps
    const frameInterval = 1000 / targetFPS;

    const animate = (currentTime) => {
      const deltaTime = currentTime - lastTime;

      // 限制帧率
      if (deltaTime < frameInterval) {
        animationId = requestAnimationFrame(animate);
        return;
      }

      lastTime = currentTime - (deltaTime % frameInterval);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw lobsters
      for (let i = lobsters.length - 1; i >= 0; i--) {
        const lobster = lobsters[i];
        const event = lobster.update(lobsters);

        // Handle collision events
        if (event) {
          for (let j = 0; j < 8; j++) {
            particles.push(new Particle(event.x, event.y));
          }
        }

        if (lobster.isAlive()) {
          lobster.draw(ctx);
        } else {
          lobsters.splice(i, 1);
        }
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.update();
        if (particle.isAlive()) {
          particle.draw(ctx);
        } else {
          particles.splice(i, 1);
        }
      }

      // Spawn new lobsters
      while (lobsters.length < minLobsterCount) {
        lobsters.push(new Lobster());
      }

      animationId = requestAnimationFrame(animate);
    };

    animate(performance.now());

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
