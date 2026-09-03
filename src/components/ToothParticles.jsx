'use client';
import { useEffect, useRef } from 'react';

// Large floating orbs
class Orb {
    constructor(w, h) {
        this.w = w;
        this.h = h;
        this.reset(true);
    }

    reset(init = false) {
        this.x = Math.random() * this.w;
        this.y = init ? Math.random() * this.h : this.h + 100;
        this.radius = Math.random() * 40 + 15; // 15–55px
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = -(Math.random() * 0.25 + 0.08); // slow upward drift
        this.opacity = Math.random() * 0.25 + 0.08; // 0.08–0.33

        // Color palette: purples and violets only
        const colors = [
            [139, 92, 246],   // purple
            [99, 102, 241],   // indigo
            [168, 85, 247],   // violet
            [124, 58, 237],   // dark violet
            [79, 70, 229],    // dark indigo
            [147, 51, 234],   // purple-600
            [192, 132, 252],  // light purple
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];

        // Subtle pulsing
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.pulseSpeed = Math.random() * 0.008 + 0.003;
        this.pulseAmp = Math.random() * 0.08 + 0.03;

        // Wobble
        this.wobblePhase = Math.random() * Math.PI * 2;
        this.wobbleSpeed = Math.random() * 0.005 + 0.002;
        this.wobbleAmp = Math.random() * 0.8 + 0.2;
    }

    update() {
        this.x += this.speedX + Math.sin(this.wobblePhase) * this.wobbleAmp;
        this.y += this.speedY;
        this.wobblePhase += this.wobbleSpeed;
        this.pulsePhase += this.pulseSpeed;

        // Wrap around horizontally
        if (this.x < -this.radius * 2) this.x = this.w + this.radius;
        if (this.x > this.w + this.radius * 2) this.x = -this.radius;

        // Reset when off-screen top
        if (this.y < -this.radius * 2) {
            this.reset();
        }
    }

    draw(ctx) {
        const pulse = Math.sin(this.pulsePhase) * this.pulseAmp;
        const alpha = Math.max(0, this.opacity + pulse);
        const [r, g, b] = this.color;

        // Glow effect
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius * 1.5
        );
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${(alpha * 0.6).toFixed(3)})`);
        gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${(alpha * 0.3).toFixed(3)})`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core circle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
        ctx.fill();
    }
}

// Tiny star particles
class Star {
    constructor(w, h) {
        this.w = w;
        this.h = h;
        this.reset(true);
    }

    reset(init = false) {
        this.x = Math.random() * this.w;
        this.y = init ? Math.random() * this.h : this.h + 10;
        this.radius = Math.random() * 1.8 + 0.5; // 0.5–2.3px tiny dots
        this.speedY = -(Math.random() * 0.15 + 0.03);
        this.speedX = (Math.random() - 0.5) * 0.1;
        this.opacity = Math.random() * 0.6 + 0.2;

        // Twinkle
        this.twinklePhase = Math.random() * Math.PI * 2;
        this.twinkleSpeed = Math.random() * 0.03 + 0.01;

        // Colors: warm pinks, whites
        const colors = [
            [255, 182, 193], // light pink
            [255, 200, 200], // soft pink
            [220, 200, 255], // lavender
            [200, 220, 255], // ice blue
            [255, 255, 255], // white
            [255, 210, 180], // peach
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.twinklePhase += this.twinkleSpeed;

        if (this.x < -5) this.x = this.w + 5;
        if (this.x > this.w + 5) this.x = -5;
        if (this.y < -5) this.reset();
    }

    draw(ctx) {
        const twinkle = (Math.sin(this.twinklePhase) + 1) / 2;
        const alpha = this.opacity * (0.4 + twinkle * 0.6);
        const [r, g, b] = this.color;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
        ctx.fill();
    }
}

export default function ToothParticles({
    orbCount = 18,
    starCount = 120,
    className = '',
    style = {},
}) {
    const canvasRef = useRef(null);
    const orbsRef = useRef([]);
    const starsRef = useRef([]);
    const animationRef = useRef(null);
    const dimRef = useRef({ w: 0, h: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const resize = () => {
            const parent = canvas.parentElement;
            if (!parent) return;
            const dpr = window.devicePixelRatio || 1;
            const rect = parent.getBoundingClientRect();
            const w = rect.width;
            const h = rect.height;

            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            dimRef.current = { w, h };

            // Re-create particles
            orbsRef.current = Array.from({ length: orbCount }, () => new Orb(w, h));
            starsRef.current = Array.from({ length: starCount }, () => new Star(w, h));
        };

        resize();
        window.addEventListener('resize', resize);

        const animate = () => {
            const { w, h } = dimRef.current;
            ctx.clearRect(0, 0, w, h);

            // Draw stars first (behind orbs)
            starsRef.current.forEach(s => {
                s.update();
                s.draw(ctx);
            });

            // Draw orbs on top
            orbsRef.current.forEach(o => {
                o.update();
                o.draw(ctx);
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [orbCount, starCount]);

    return (
        <canvas
            ref={canvasRef}
            className={className}
            style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 0,
                ...style,
            }}
        />
    );
}
