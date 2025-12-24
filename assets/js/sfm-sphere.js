// Structure-from-Motion Sphere with Cursor Interaction
class SFMSphere {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.resize();

    // Sphere parameters
    this.radius = 150;
    this.dots = [];
    this.numDots = 200;
    this.baseRotationSpeed = 0.005;
    this.rotationSpeed = this.baseRotationSpeed;
    this.angleX = 0;
    this.angleY = 0;

    // Cursor interaction
    this.mouseX = this.canvas.width / 2;
    this.mouseY = this.canvas.height / 2;
    this.maxSpeedMultiplier = 3;
    this.clickFlipActive = false;
    this.clickFlipDuration = 0;
    this.clickFlipMaxDuration = 60; // frames

    this.initDots();
    this.setupEventListeners();
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  initDots() {
    // Create random dots on sphere surface
    for (let i = 0; i < this.numDots; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      this.dots.push({
        theta: theta,
        phi: phi,
        baseSize: 2 + Math.random() * 2
      });
    }
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.resize());

    this.canvas.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });

    this.canvas.addEventListener('click', () => {
      this.clickFlipActive = true;
      this.clickFlipDuration = 0;
    });
  }

  projectDot(dot) {
    const { theta, phi } = dot;

    // Spherical to Cartesian
    let x = this.radius * Math.sin(phi) * Math.cos(theta);
    let y = this.radius * Math.sin(phi) * Math.sin(theta);
    let z = this.radius * Math.cos(phi);

    // Rotate around Y axis
    const cosY = Math.cos(this.angleY);
    const sinY = Math.sin(this.angleY);
    const x1 = x * cosY - z * sinY;
    const z1 = x * sinY + z * cosY;

    // Rotate around X axis
    const cosX = Math.cos(this.angleX);
    const sinX = Math.sin(this.angleX);
    const y1 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;

    // Orthographic projection (no perspective - keeps ambiguity!)
    const screenX = x1 + this.canvas.width / 2;
    const screenY = y1 + this.canvas.height / 2;

    return {
      x: screenX,
      y: screenY,
      z: z2,
      depth: z2
    };
  }

  calculateRotationSpeed() {
    // Distance from cursor to center
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const dx = this.mouseX - centerX;
    const dy = this.mouseY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);

    // Closer cursor = faster rotation
    const normalizedDistance = Math.max(0, 1 - distance / maxDistance);
    const speedMultiplier = 1 + normalizedDistance * (this.maxSpeedMultiplier - 1);

    this.rotationSpeed = this.baseRotationSpeed * speedMultiplier;
  }

  draw() {
    // Clear with transparency for background effect
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Project and sort dots by depth
    const projectedDots = this.dots.map(dot => ({
      ...this.projectDot(dot),
      baseSize: dot.baseSize
    }));

    // Sort by depth (back to front)
    projectedDots.sort((a, b) => a.depth - b.depth);

    // Draw dots
    projectedDots.forEach(dot => {
      let size = dot.baseSize;
      let opacity = 0.3;

      // Click effect: add depth cues (size variation) to force perceptual flip
      if (this.clickFlipActive) {
        const flipProgress = this.clickFlipDuration / this.clickFlipMaxDuration;
        const flipStrength = Math.sin(flipProgress * Math.PI); // Pulse effect

        // Size based on depth (creates depth cue)
        const depthFactor = (dot.depth + this.radius) / (2 * this.radius);
        size = dot.baseSize * (1 + flipStrength * depthFactor * 0.8);
        opacity = 0.3 + flipStrength * 0.3;
      }

      // Get color based on theme
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const color = isDark ? '173, 181, 189' : '55, 65, 81'; // --text colors

      this.ctx.fillStyle = `rgba(${color}, ${opacity})`;
      this.ctx.beginPath();
      this.ctx.arc(dot.x, dot.y, size, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  animate() {
    this.calculateRotationSpeed();

    // Update rotation
    this.angleY += this.rotationSpeed;
    this.angleX += this.rotationSpeed * 0.3;

    // Update click flip effect
    if (this.clickFlipActive) {
      this.clickFlipDuration++;
      if (this.clickFlipDuration >= this.clickFlipMaxDuration) {
        this.clickFlipActive = false;
        this.clickFlipDuration = 0;
      }
    }

    this.draw();
    requestAnimationFrame(() => this.animate());
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SFMSphere('sfm-canvas');
});