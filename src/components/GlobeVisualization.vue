<template>
  <div>
    <div id="info">
      <h3>🌍 Global Statistics</h3>
      <p>Click a country to zoom • Scroll to zoom • Drag to rotate</p>
    </div>
    <div class="controls">
      Scroll = Zoom • Click = Toggle Zoom on Country
    </div>
    <div ref="globeContainer" id="globeViz"></div>
  </div>
</template>

<script>
export default {
  name: "GlobeVisualization",
  mounted() {
    this.initGlobe();
  },
  beforeUnmount() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
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
  },
};
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
  background: rgba(0, 0, 0, 0.7);
  padding: 15px;
  border-radius: 5px;
  z-index: 100;
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
}
</style>
