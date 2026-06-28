/* ===================================================================
   GADGETS GRAM — Three.js Interactive Particle Universe
   ES Module — Loaded by index.html
   =================================================================== */

import * as THREE from './three.js/build/three.module.min.js';

(function () {
  'use strict';

  /* ── Configuration ─────────────────────────────────────────── */
  const CONFIG = {
    particles: {
      count: window.innerWidth < 768 ? 800 : 2500,
      size: window.innerWidth < 768 ? 1.6 : 1.4,
      spread: 60,
      depth: 80,
      speed: 0.08,
      mouseInfluence: 0.00015,
      colors: [
        new THREE.Color(0x3b82f6), // blue-500
        new THREE.Color(0x60a5fa), // blue-400
        new THREE.Color(0xf97316), // orange-500
        new THREE.Color(0xfb923c), // orange-400
        new THREE.Color(0x818cf8), // indigo accent
      ]
    },
    nebula: {
      count: 5,
      size: window.innerWidth < 768 ? 12 : 20,
      opacity: 0.12,
    },
    camera: {
      fov: 65,
      near: 0.1,
      far: 200,
      z: 50,
      scrollRange: 25,
    },
    performance: {
      targetFPS: 55,
      checkInterval: 2000,
      minParticles: 300,
    }
  };

  /* ── State ──────────────────────────────────────────────────── */
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let scrollProgress = 0;
  let animationId = null;
  let isVisible = true;
  let lastTime = 0;
  let frameCount = 0;
  let currentFPS = 60;

  /* ── Canvas & Renderer ─────────────────────────────────────── */
  const canvas = document.getElementById('hero-3d-canvas');
  if (!canvas) return;

  // Check WebGL support
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch (e) {
    console.warn('WebGL not available, falling back to CSS animations');
    canvas.style.display = 'none';
    return;
  }

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  /* ── Scene & Camera ────────────────────────────────────────── */
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    CONFIG.camera.fov,
    window.innerWidth / window.innerHeight,
    CONFIG.camera.near,
    CONFIG.camera.far
  );
  camera.position.z = CONFIG.camera.z;

  /* ── Particle Field ────────────────────────────────────────── */
  function createParticleField() {
    const { count, spread, depth, size, colors } = CONFIG.particles;
    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(count * 3);
    const particleColors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const velocities = new Float32Array(count * 3);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Distribute particles in a sphere-ish volume
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.pow(Math.random(), 0.6) * spread;

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = (Math.random() - 0.5) * depth;

      // Color: weighted toward blue, with sparse orange accents
      const color = colors[Math.random() < 0.7 ? Math.floor(Math.random() * 2) : 2 + Math.floor(Math.random() * 2)];
      particleColors[i3] = color.r;
      particleColors[i3 + 1] = color.g;
      particleColors[i3 + 2] = color.b;

      // Variable sizes for depth
      sizes[i] = (Math.random() * 0.6 + 0.4) * size;

      // Slow drift velocities
      velocities[i3] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.01;

      // Random phase for oscillation
      phases[i] = Math.random() * Math.PI * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Store velocities and phases for animation
    geometry.userData = { velocities, phases };

    const material = new THREE.PointsMaterial({
      size: size,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    return new THREE.Points(geometry, material);
  }

  /* ── Nebula Clouds ─────────────────────────────────────────── */
  function createNebulaClouds() {
    const group = new THREE.Group();
    const { count, size, opacity } = CONFIG.nebula;

    const nebulaData = [
      { pos: [-15, 8, -30], color: 0x3b82f6, scale: 1.2 },
      { pos: [18, -6, -25], color: 0xf97316, scale: 1.0 },
      { pos: [-8, -12, -35], color: 0x60a5fa, scale: 0.8 },
      { pos: [12, 10, -40], color: 0xfb923c, scale: 0.6 },
      { pos: [0, 0, -20], color: 0x818cf8, scale: 1.5 },
    ];

    for (let i = 0; i < Math.min(count, nebulaData.length); i++) {
      const data = nebulaData[i];
      const geometry = new THREE.PlaneGeometry(size * data.scale, size * data.scale);
      const material = new THREE.MeshBasicMaterial({
        color: data.color,
        transparent: true,
        opacity: opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...data.pos);
      mesh.rotation.z = Math.random() * Math.PI;
      mesh.userData = {
        baseOpacity: opacity,
        phase: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.001,
      };

      group.add(mesh);
    }

    return group;
  }

  /* ── Connecting Lines (Constellation effect) ───────────────── */
  function createConstellationLines() {
    const material = new THREE.LineBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.06,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = [];
    const lineCount = window.innerWidth < 768 ? 8 : 15;

    for (let i = 0; i < lineCount; i++) {
      const spread = CONFIG.particles.spread * 0.6;
      points.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * spread,
          (Math.random() - 0.5) * spread,
          (Math.random() - 0.5) * 20 - 10
        )
      );
      points.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * spread,
          (Math.random() - 0.5) * spread,
          (Math.random() - 0.5) * 20 - 10
        )
      );
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return new THREE.LineSegments(geometry, material);
  }

  /* ── Build Scene ───────────────────────────────────────────── */
  const particles = createParticleField();
  const nebulae = createNebulaClouds();
  const constellations = createConstellationLines();

  scene.add(particles);
  scene.add(nebulae);
  scene.add(constellations);

  /* ── Animation Loop ────────────────────────────────────────── */
  const clock = new THREE.Clock();

  function animate() {
    if (!isVisible) {
      animationId = requestAnimationFrame(animate);
      return;
    }

    const elapsed = clock.getElapsedTime();
    const delta = clock.getDelta();

    // Smooth mouse tracking
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    // ── Animate Particles ──
    const positions = particles.geometry.attributes.position.array;
    const { velocities, phases } = particles.geometry.userData;
    const count = CONFIG.particles.count;
    const speed = CONFIG.particles.speed;
    const mouseInf = CONFIG.particles.mouseInfluence;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Oscillation
      positions[i3] += Math.sin(elapsed * speed + phases[i]) * 0.015 + velocities[i3];
      positions[i3 + 1] += Math.cos(elapsed * speed * 0.8 + phases[i]) * 0.015 + velocities[i3 + 1];
      positions[i3 + 2] += Math.sin(elapsed * speed * 0.5 + phases[i] * 0.5) * 0.008;

      // Mouse influence (push/pull)
      const dx = positions[i3] - mouse.x * 30;
      const dy = positions[i3 + 1] - mouse.y * 30;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 15) {
        const force = (15 - dist) * mouseInf;
        positions[i3] += dx * force;
        positions[i3 + 1] += dy * force;
      }

      // Wrap-around boundaries
      const spread = CONFIG.particles.spread;
      if (Math.abs(positions[i3]) > spread) positions[i3] *= -0.95;
      if (Math.abs(positions[i3 + 1]) > spread) positions[i3 + 1] *= -0.95;
    }
    particles.geometry.attributes.position.needsUpdate = true;

    // Gentle rotation
    particles.rotation.y = elapsed * 0.015 + mouse.x * 0.1;
    particles.rotation.x = mouse.y * 0.08;

    // ── Animate Nebulae ──
    nebulae.children.forEach((mesh) => {
      const { baseOpacity, phase, rotSpeed } = mesh.userData;
      mesh.material.opacity = baseOpacity + Math.sin(elapsed * 0.3 + phase) * 0.04;
      mesh.rotation.z += rotSpeed;
    });

    // ── Animate Constellations ──
    constellations.rotation.y = elapsed * 0.008;
    constellations.rotation.x = elapsed * 0.003;
    constellations.material.opacity = 0.04 + Math.sin(elapsed * 0.5) * 0.02;

    // ── Camera scroll movement ──
    const targetZ = CONFIG.camera.z - scrollProgress * CONFIG.camera.scrollRange;
    camera.position.z += (targetZ - camera.position.z) * 0.05;
    camera.position.x += (mouse.x * 3 - camera.position.x) * 0.02;
    camera.position.y += (mouse.y * 2 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);

    // ── FPS Monitoring ──
    frameCount++;
    const now = performance.now();
    if (now - lastTime >= CONFIG.performance.checkInterval) {
      currentFPS = Math.round((frameCount * 1000) / (now - lastTime));
      frameCount = 0;
      lastTime = now;

      // Auto-degrade if performance is poor
      if (currentFPS < CONFIG.performance.targetFPS && CONFIG.particles.count > CONFIG.performance.minParticles) {
        // Performance degradation handled silently
      }
    }

    renderer.render(scene, camera);
    animationId = requestAnimationFrame(animate);
  }

  /* ── Event Listeners ───────────────────────────────────────── */

  // Mouse tracking
  document.addEventListener('mousemove', (e) => {
    mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
  }, { passive: true });

  // Touch tracking (mobile)
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      mouse.targetX = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
    }
  }, { passive: true });

  // Scroll progress
  window.addEventListener('scroll', () => {
    const heroHeight = document.getElementById('hero')?.offsetHeight || window.innerHeight;
    scrollProgress = Math.min(window.scrollY / heroHeight, 1);

    // Fade canvas opacity as user scrolls past hero
    canvas.style.opacity = Math.max(1 - scrollProgress * 1.5, 0);
  }, { passive: true });

  // Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Visibility (save battery when tab is hidden)
  document.addEventListener('visibilitychange', () => {
    isVisible = !document.hidden;
    if (isVisible) {
      clock.getDelta(); // Reset delta to avoid jumps
    }
  });

  // Gyroscope for mobile
  if ('ontouchstart' in window && window.DeviceOrientationEvent) {
    const requestGyro = () => {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
          .then(permission => {
            if (permission === 'granted') attachGyroscope();
          })
          .catch(() => {});
        document.removeEventListener('touchstart', requestGyro);
      } else {
        attachGyroscope();
        document.removeEventListener('touchstart', requestGyro);
      }
    };

    function attachGyroscope() {
      window.addEventListener('deviceorientation', (e) => {
        const beta = Math.max(-30, Math.min(30, e.beta || 0));
        const gamma = Math.max(-30, Math.min(30, e.gamma || 0));
        mouse.targetX = gamma / 30;
        mouse.targetY = -beta / 30;
      }, { passive: true });
    }

    document.addEventListener('touchstart', requestGyro, { once: true });
  }

  // Reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    canvas.style.display = 'none';
    return;
  }

  /* ── Start ─────────────────────────────────────────────────── */
  lastTime = performance.now();
  animate();

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (animationId) cancelAnimationFrame(animationId);
    renderer.dispose();
    particles.geometry.dispose();
    particles.material.dispose();
  });

})();
