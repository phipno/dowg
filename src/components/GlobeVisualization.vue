<template>
  <div>
    <div id="info">
      <h3>🌍 Global Statistics</h3>
      <p>Drag to rotate • Scroll to zoom</p>
    </div>
    <div class="controls">
      Drag = Rotate • Scroll = Zoom • Click = Toggle Auto-rotate
    </div>
    <div ref="globeContainer" id="globeViz"></div>
  </div>
</template>

<script>
export default {
  name: 'GlobeVisualization',
  mounted() {
    this.initGlobe();
  },
  beforeUnmount() {
    // Clean up event listeners and animation frame
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  },
  methods: {
    initGlobe() {
      // Load Three.js and three-globe from CDN
      this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js')
        .then(() => {
          return this.loadScript('https://unpkg.com/three-globe@2.28.0/dist/three-globe.min.js');
        })
        .then(() => {
          this.setupGlobe();
        })
        .catch(error => {
          console.error('Error loading Three.js libraries:', error);
        });
    },
    
    loadScript(src) {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    },
    
    setupGlobe() {
      // Check if libraries are loaded
      if (typeof THREE === 'undefined' || typeof ThreeGlobe === 'undefined') {
        console.error('Three.js or ThreeGlobe not loaded');
        return;
      }
      
      // Simple manual controls
      this.mouseDown = false;
      this.lastMouseX = 0;
      this.lastMouseY = 0;
      this.autoRotate = true;
      
      this.globe = new ThreeGlobe()
        .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
        .showAtmosphere(true)
        .atmosphereColor('#3a228a');

      this.scene = new THREE.Scene();
      this.scene.add(this.globe);
      this.scene.add(new THREE.AmbientLight(0xcccccc, 0.9));

      this.renderer = new THREE.WebGLRenderer();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.$refs.globeContainer.appendChild(this.renderer.domElement);

      this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      this.camera.position.z = 300;

      // Mouse controls
      this.renderer.domElement.addEventListener('mousedown', this.handleMouseDown);
      this.renderer.domElement.addEventListener('mouseup', this.handleMouseUp);
      this.renderer.domElement.addEventListener('mouseleave', this.handleMouseUp);
      this.renderer.domElement.addEventListener('mousemove', this.handleMouseMove);
      this.renderer.domElement.addEventListener('wheel', this.handleWheel);
      this.renderer.domElement.addEventListener('click', this.handleClick);

      // Add sample data
      const sampleData = [
        { name: "New York", lat: 40.7128, lng: -74.0060, value: 500, radius: 0.3, color: "red" },
        { name: "London", lat: 51.5074, lng: -0.1278, value: 400, radius: 0.25, color: "blue" },
        { name: "Tokyo", lat: 35.6762, lng: 139.6503, value: 600, radius: 0.35, color: "green" }
      ];

      this.globe.pointsData(sampleData)
        .pointLat(d => d.lat)
        .pointLng(d => d.lng)
        .pointRadius(d => d.radius)
        .pointColor(d => d.color)
        .pointAltitude(0.05);

      this.animate();
    },
    
    handleMouseDown(e) {
      this.mouseDown = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    },
    
    handleMouseUp() {
      this.mouseDown = false;
    },
    
    handleMouseMove(e) {
      if (!this.mouseDown) return;
      const deltaX = e.clientX - this.lastMouseX;
      const deltaY = e.clientY - this.lastMouseY;
      this.globe.rotation.y += deltaX * 0.01;
      this.globe.rotation.x += deltaY * 0.01;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.autoRotate = false;
    },
    
    handleWheel(e) {
      this.camera.position.z += e.deltaY * 0.1;
      this.camera.position.z = Math.max(150, Math.min(500, this.camera.position.z));
      this.autoRotate = false;
    },
    
    handleClick() {
      this.autoRotate = !this.autoRotate;
    },
    
    animate() {
      this.animationId = requestAnimationFrame(this.animate);
      if (this.autoRotate) {
        this.globe.rotation.y += 0.003;
        this.globe.rotation.x += 0.003;
      }
      this.renderer.render(this.scene, this.camera);
    }
  }
}
</script>

<style scoped>
#globeViz { 
  width: 100vw; 
  height: 100vh; 
  cursor: grab; 
}

#globeViz:active { 
  cursor: grabbing; 
}

#info { 
  position: absolute; 
  top: 20px; 
  left: 20px; 
  color: white; 
  background: rgba(0,0,0,0.7); 
  padding: 15px; 
  border-radius: 5px; 
  z-index: 100;
}

.controls { 
  position: absolute; 
  bottom: 20px; 
  left: 20px; 
  color: white; 
  background: rgba(0,0,0,0.7); 
  padding: 10px; 
  border-radius: 5px; 
  font-size: 12px;
}
</style>
