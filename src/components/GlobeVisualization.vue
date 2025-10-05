<template>
  <div class="globe-container" :class="{ 'animate-in': isVisible, 'menu-mode': !isVisible, 'globe-mode': isVisible }">
    <div id="info">
      <h3>🌍 {{ datasetName }}</h3>
      <p>Drag to rotate • Scroll to zoom</p>
    </div>
    <div class="controls">
      Drag = Rotate • Scroll = Zoom • Press P = Spawn Entity
    </div>
    <button class="back-button" @click="goBack">
      ← Back to Menu
    </button>
    <div ref="globeContainer" id="globeViz"></div>
  </div>
</template>

<script>
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
      if (typeof Globe === "undefined") return console.error("Globe.gl not loaded");

        // eslint-disable-next-line no-undef
        const world = new Globe(this.$refs.globeContainer)

        .globeImageUrl("//cdn.jsdelivr.net/npm/three-globe/example/img/earth-dark.jpg")
        .pointOfView({ altitude: 3 }, 0);

      // Load CSV & GeoJSON
      Promise.all([
        fetch("/datasets/deaths-in-armed-conflicts-based-on-where-they-occurred.csv").then((res) => res.text()),
        fetch("/datasets/ne_110m_admin_0_countries(2).geojson").then((res) => res.json()),
      ]).then(([csvText, countries]) => {
        const rows = csvText
          .trim()
          .split("\n")
          .slice(1)
          .map((line) => {
            const [Entity, Year, Best, Low, High] = line.split(",");
            return { Entity, Year: +Year, Best: +Best, Low: +Low, High: +High };
          });

        const latestYear = Math.max(...rows.map((r) => r.Year));
        const latestData = Object.fromEntries(
          rows.filter((r) => r.Year === latestYear).map((r) => [r.Entity.toLowerCase(), r])
        );

        const features = countries.features.filter((f) => f.properties.ISO_A2 !== "AQ");
        features.forEach((f) => {
          const entity = f.properties.ADMIN.toLowerCase();
          f.properties.deaths = latestData[entity]?.Best ?? 0;
        });

        const maxDeaths = Math.max(...features.map((f) => f.properties.deaths || 0));
        const minDeaths = 0;

        const interpolateColor = (color1, color2, factor) => {
          const c1 = new THREE.Color(color1);
          const c2 = new THREE.Color(color2);
          return c1.lerp(c2, factor).getStyle();
        };

        const getColor = (deaths) => {
          if (!deaths || deaths <= 0) return "green";
          const t = (Math.log(1 + deaths) - Math.log(1 + minDeaths)) / (Math.log(1 + maxDeaths) - Math.log(1 + minDeaths));
          return interpolateColor("green", "red", t);
        };

        world
          .polygonsData(features)
          .polygonCapColor((f) => getColor(f.properties.deaths))
          .polygonSideColor(() => "rgba(255,255,255,0.05)")
          .polygonStrokeColor(() => "#111")
          .polygonLabel(
            ({ properties: d }) =>
              `<b>${d.ADMIN} (${d.ISO_A2})</b><br/>Deaths (latest year ${latestYear}): <b>${d.deaths}</b>`
          );

        const makeRagdollMesh = () => {
          const group = new THREE.Group();
          const material = new THREE.MeshStandardMaterial({ color: 0xff5555, roughness: 0.7 });

          const head = new THREE.Mesh(new THREE.SphereGeometry(0.02), material);
          head.position.y = 0.06;
          group.add(head);

          const body = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.05, 8), material);
          group.add(body);

          const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.04, 8), material);
          leftLeg.position.set(-0.01, -0.045, 0);
          group.add(leftLeg);

          const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.04, 8), material);
          rightLeg.position.set(0.01, -0.045, 0);
          group.add(rightLeg);

          return group;
        };

        const spawnRagdollsAt = (center) => {
          const ragdolls = Array.from({ length: 5 }, () => ({
            lat: center.lat + (Math.random() - 0.5) * 0.3,
            lng: center.lng + (Math.random() - 0.5) * 0.3,
          }));

          world
            .customLayerData(ragdolls)
            .customThreeObject(makeRagdollMesh)
            .customThreeObjectUpdate((obj, d) => {
              const { x, y, z } = world.getCoords(d);
              obj.position.set(x, y, z);
            });
        };

        let zoomedCountry = null;

        const getPolygonCentroid = (feature) => {
          try {
            const coords = feature.geometry.coordinates[0];
            if (!coords || !coords.length) return null;
            const lonSum = coords.reduce((sum, [lon]) => sum + lon, 0);
            const latSum = coords.reduce((sum, [, lat]) => sum + lat, 0);
            return { lat: latSum / coords.length, lng: lonSum / coords.length };
          } catch {
            return null;
          }
        };

        const smoothPointOfView = (target, duration = 2000) => {
          const start = world.pointOfView();
          const startTime = performance.now();
          const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

          const animate = () => {
            const now = performance.now();
            const t = Math.min((now - startTime) / duration, 1);
            const eased = easeInOutQuad(t);

            world.pointOfView(
              {
                lat: start.lat + (target.lat - start.lat) * eased,
                lng: start.lng + (target.lng - start.lng) * eased,
                altitude: start.altitude + (target.altitude - start.altitude) * eased,
              },
              0
            );

            if (t < 1) requestAnimationFrame(animate);
          };
          animate();
        };

        world.onPolygonClick((f) => {
          const centroid = getPolygonCentroid(f);
          if (!centroid) return;
          const countryName = f.properties.ADMIN;

          if (zoomedCountry === countryName) {
            smoothPointOfView({ lat: 0, lng: 0, altitude: 3 }, 2000);
            zoomedCountry = null;
            world.customLayerData([]);
          } else {
            smoothPointOfView({ lat: centroid.lat, lng: centroid.lng, altitude: 0.7 }, 2000);
            zoomedCountry = countryName;
            spawnRagdollsAt(centroid);
          }
        });
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
