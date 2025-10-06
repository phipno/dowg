<template>
  <div class="globe-container" :class="{ 'animate-in': isVisible, 'menu-mode': !isVisible, 'globe-mode': isVisible }">
    <div id="info">
      <h3>🌍 {{ datasetName }}</h3>
      <p>Drag to rotate • Scroll to zoom</p>
    </div>
    <div class="controls">
      Drag = Rotate • Scroll = Zoom • Press P = Spawn Entity
    </div>
    <button class="back-button" @click="$router.push('/')">
      ← Back to Menu
    </button>
    <div ref="globeContainer" id="globeViz"></div>
  </div>
</template>

<script>
import { useGlobe } from '@/composables/useGlobe';

export default {
  name: 'GlobeVisualization',
  props: {
    dataset: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      isVisible: false,
      datasetName: '',
      spawnedEntities: [],
      mousePosition: null,
      raycaster: null,
      currentEntity: null
    }
  },
  emits: ['back'],
  computed: {
    globeData() {
      return this.dataset ? this.dataset.data : this.getDefaultData();
    }
  },
  mounted() {
    this.datasetName = this.dataset ? this.dataset.name : 'Global View';
    // Initialize globe immediately for initial display
    this.initGlobe();
    // Trigger animation after component is mounted
    this.$nextTick(() => {
      setTimeout(() => {
        this.isVisible = true;
      }, 100);
    });
  },
  beforeUnmount() {
    // Clean up event listeners and animation frame
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    document.removeEventListener('keydown', this.handleKeyDown);
  },
  methods: {
    initGlobe() {
      // Load Three.js and Globe.gl
      this.loadScript("https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.min.js")
        .then(() => this.loadScript("https://cdn.jsdelivr.net/npm/globe.gl"))
        .then(() => this.setupGlobe())
        .catch((err) => console.error("Error loading scripts:", err));
    },

    loadScript(src) {
      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    },

    setupGlobe() {
      useGlobe({
        container: this.$refs.globeContainer,
        enableInteractions: true,
        spawnEntities: true,
        onCountryClick: (f) => {
          console.log("Country clicked:", f.properties.ADMIN);
        }
      }).then(({ globe }) => {
        this.scene = globe.scene(); // For later entity logic
      });
    },
    

    spawnEntity() {
      // Safety check
      if (!this.scene || typeof THREE === 'undefined') {
        console.log('Scene or THREE.js not ready');
        return;
      }
      
      // Remove existing entity if any
      if (this.currentEntity) {
        this.removeEntity(this.currentEntity);
      }
      
      // Get target position on globe surface using mouse position
      const targetPosition = this.getMouseTargetOnGlobe();
      if (!targetPosition) {
        console.log('No target position found');
        return;
      }
      
      // Create a ragdoll-like entity above the target position
      const entity = this.createRagdollEntity(targetPosition);
      this.currentEntity = entity;
      this.spawnedEntities.push(entity);
      this.scene.add(entity.group);
      
      // Remove entity after 5 seconds
      setTimeout(() => {
        this.removeEntity(entity);
        if (this.currentEntity === entity) {
          this.currentEntity = null;
        }
      }, 5000);
    },
    
    getMouseTargetOnGlobe() {
      // Safety check
      if (!this.raycaster || !this.camera || typeof THREE === 'undefined') {
        return null;
      }
      
      // Update raycaster with current mouse position and camera
      this.raycaster.setFromCamera(this.mousePosition, this.camera);
      
      // Create a sphere geometry to represent the globe for intersection
      const globeGeometry = new THREE.SphereGeometry(100, 32, 32);
      const globeMesh = new THREE.Mesh(globeGeometry);
      
      // Calculate intersections
      const intersects = this.raycaster.intersectObject(globeMesh);
      
      if (intersects.length > 0) {
        return intersects[0].point;
      }
      
      return null;
    },
    
    createRagdollEntity(targetPosition) {
      if (!targetPosition || typeof THREE === 'undefined') {
        return null;
      }
      
      const group = new THREE.Group();
      
      // Create a larger, more visible ragdoll
      const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      // Head (larger)
      const headGeometry = new THREE.SphereGeometry(1.2, 8, 6);
      const headMaterial = new THREE.MeshLambertMaterial({ color: color });
      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 3.2;
      group.add(head);
      
      // Body (larger)
      const bodyGeometry = new THREE.CylinderGeometry(0.8, 1.2, 3.2, 8);
      const bodyMaterial = new THREE.MeshLambertMaterial({ color: color });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 0.8;
      group.add(body);
      
      // Arms (larger)
      const armGeometry = new THREE.CylinderGeometry(0.32, 0.4, 2.4, 6);
      const armMaterial = new THREE.MeshLambertMaterial({ color: color });
      
      const leftArm = new THREE.Mesh(armGeometry, armMaterial);
      leftArm.position.set(-1.6, 0.8, 0);
      leftArm.rotation.z = Math.PI / 4;
      group.add(leftArm);
      
      const rightArm = new THREE.Mesh(armGeometry, armMaterial);
      rightArm.position.set(1.6, 0.8, 0);
      rightArm.rotation.z = -Math.PI / 4;
      group.add(rightArm);
      
      // Legs (larger)
      const legGeometry = new THREE.CylinderGeometry(0.32, 0.4, 2.8, 6);
      const legMaterial = new THREE.MeshLambertMaterial({ color: color });
      
      const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
      leftLeg.position.set(-0.6, -2.0, 0);
      group.add(leftLeg);
      
      const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
      rightLeg.position.set(0.6, -2.0, 0);
      group.add(rightLeg);
      
      // Position above target with some height
      const spawnHeight = 40;
      group.position.set(
        targetPosition.x,
        targetPosition.y + spawnHeight,
        targetPosition.z
      );
      
      // Physics properties
      const entity = {
        group: group,
        velocity: new THREE.Vector3(0, -0.3, 0), // Much slower fall
        angularVelocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.05,
          (Math.random() - 0.5) * 0.05,
          (Math.random() - 0.5) * 0.05
        ),
        onGround: false,
        targetPosition: targetPosition.clone(),
        bounce: 0.1,
        friction: 0.9
      };
      
      return entity;
    },
    
    updateEntities() {
      this.spawnedEntities.forEach(entity => {
        if (!entity.onGround) {
          // Apply gravity (much slower)
          entity.velocity.y -= 0.05;
          
          // Update position
          entity.group.position.add(entity.velocity);
          
          // Update rotation
          entity.group.rotation.x += entity.angularVelocity.x;
          entity.group.rotation.y += entity.angularVelocity.y;
          entity.group.rotation.z += entity.angularVelocity.z;
          
          // Check if hit ground (globe surface)
          const distanceFromCenter = entity.group.position.length();
          const globeRadius = 100; // Approximate globe radius
          
          if (distanceFromCenter <= globeRadius + 5) {
            entity.onGround = true;
            
            // Position exactly on the target surface
            const direction = entity.targetPosition.clone().normalize();
            entity.group.position.copy(direction.multiplyScalar(globeRadius + 2));
            
            // Stop movement
            entity.velocity.set(0, 0, 0);
            entity.angularVelocity.set(0, 0, 0);
          }
        } else {
          // On ground - keep positioned on surface
          const direction = entity.group.position.clone().normalize();
          entity.group.position.copy(direction.multiplyScalar(100 + 2));
        }
      });
    },
    
    removeEntity(entity) {
      const index = this.spawnedEntities.indexOf(entity);
      if (index > -1) {
        this.scene.remove(entity.group);
        this.spawnedEntities.splice(index, 1);
      }
    }
  }
};
</script>

<style scoped>
#globeViz {
  width: 100vw;
  height: 100vh;
  cursor: grab;
  position: relative;
  z-index: 1;
}

#globeViz:active {
  cursor: grabbing;
}

.globe-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.4;
  transform: translateX(0);
  transition: all 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.globe-container.menu-mode {
  opacity: 0.4;
  transform: translateX(0);
}

.globe-container.globe-mode {
  opacity: 1;
  transform: translateX(0);
}

.globe-container.animate-in {
  opacity: 1;
  transform: translateX(0);
}

#globeViz { 
  width: 100%; 
  height: 100%; 
  cursor: grab;
  position: relative;
  z-index: 1;
}

#globeViz:active {
  cursor: grabbing;
}

#info {
  position: absolute;
  top: 20px;
  left: 20px;
  color: white;
  background: rgba(0, 0, 0, 0.7);
  padding: 15px;
  border-radius: 5px;
  z-index: 100;
  opacity: 0;
  transform: translateY(-20px);
  transition: all 0.6s ease 0.3s;
}

.globe-container.animate-in #info {
  opacity: 1;
  transform: translateY(0);
}

.controls {
  position: absolute;
  bottom: 20px;
  left: 20px;
  color: white;
  background: rgba(0, 0, 0, 0.7);
  padding: 10px;
  border-radius: 5px;
  font-size: 12px;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.6s ease 0.5s;
}

.globe-container.animate-in .controls {
  opacity: 1;
  transform: translateY(0);
}

.back-button {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  padding: 10px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  z-index: 200;
  opacity: 0;
  transform: translateY(-20px);
  transition: all 0.6s ease 0.7s;
}

.globe-container.animate-in .back-button {
  opacity: 1;
  transform: translateY(0);
}

.back-button:hover {
  background: rgba(0, 0, 0, 0.9);
  border-color: rgba(255, 255, 255, 0.6);
  transform: translateY(-2px);
}
</style>
