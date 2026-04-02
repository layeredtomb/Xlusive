import { useEffect, useRef } from 'react';
import './GalaxyBackground.css';

export default function GalaxyBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let stars = [];
    const numStars = 600;
    
    // Mouse tracking
    let mouse = { x: 0, y: 0 };
    let center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    
    // Smooth mouse interpolation
    let smoothMouse = { x: center.x, y: center.y };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      center.x = canvas.width / 2;
      center.y = canvas.height / 2;
      if (mouse.x === 0 && mouse.y === 0) {
        mouse.x = center.x;
        mouse.y = center.y;
        smoothMouse.x = center.x;
        smoothMouse.y = center.y;
      }
      initStars();
    };

    class Star {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.z = Math.random() * canvas.width;
        this.size = Math.random() * 1.5;
        this.color = this.getRandomColor();
      }
      
      getRandomColor() {
        const colors = [
          'rgba(255, 255, 255', 
          'rgba(200, 200, 255', 
          'rgba(255, 200, 255', 
          'rgba(180, 220, 255'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
      }

      update(speed) {
        this.z -= speed;
        if (this.z <= 0) {
          this.z = canvas.width;
          this.x = Math.random() * canvas.width;
          this.y = Math.random() * canvas.height;
        }
      }
      
      draw() {
        let x, y, radius;
        let focalLength = canvas.width;
        
        x = (this.x - center.x) * (focalLength / this.z) + center.x;
        y = (this.y - center.y) * (focalLength / this.z) + center.y;
        radius = this.size * (focalLength / this.z);
        
        // Dynamic parallax shift based on smooth mouse
        const mouseShiftX = (smoothMouse.x - center.x) * 0.1 * (focalLength / this.z);
        const mouseShiftY = (smoothMouse.y - center.y) * 0.1 * (focalLength / this.z);

        ctx.beginPath();
        ctx.arc(x - mouseShiftX, y - mouseShiftY, radius, 0, Math.PI * 2);
        
        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color + ', 1)';
        
        const opacity = (1 - this.z / canvas.width);
        ctx.fillStyle = `${this.color}, ${opacity})`;
        ctx.fill();
        ctx.closePath();
        
        // Reset shadow for performance on next draw
        ctx.shadowBlur = 0;
      }
    }

    const initStars = () => {
      stars = [];
      for (let i = 0; i < numStars; i++) {
        stars.push(new Star());
      }
    };

    window.addEventListener('resize', resize);
    resize();

    const render = () => {
      // Create rich galaxy background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#0a0a0f');
      gradient.addColorStop(0.3, '#100a1f');
      gradient.addColorStop(0.7, '#1f1035');
      gradient.addColorStop(1, '#0e0b16');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Smooth mouse movement for more organic feel
      smoothMouse.x += (mouse.x - smoothMouse.x) * 0.05;
      smoothMouse.y += (mouse.y - smoothMouse.y) * 0.05;

      const baseSpeed = 1.2;
      // Slight speed boost based on mouse distance from center
      const speedMultiplier = 1 + (Math.abs(mouse.x - center.x) + Math.abs(mouse.y - center.y)) * 0.0005;
      const speed = baseSpeed * speedMultiplier;

      stars.forEach((star) => {
        star.update(speed);
        star.draw();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="galaxy-background"></canvas>;
}
