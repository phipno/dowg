// /composables/useGlobe.js

export async function useGlobe({
  container,
  skipDataLoad = false,
  enableInteractions = false,
  spawnEntities = false,
  onCountryClick = null
}) {
  // Load libraries
  await loadScript("https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.min.js");
  await loadScript("https://cdn.jsdelivr.net/npm/globe.gl");

  const THREE = window.THREE;
  const Globe = window.Globe;

  const globe = Globe()(container)
    .globeImageUrl("//cdn.jsdelivr.net/npm/three-globe/example/img/earth-dark.jpg")
    .backgroundColor("rgba(0,0,0,0)")
    .pointOfView({ altitude: 2.5 }, 0);

  // Load data

  if (!skipDataLoad) {
    const [csvText, countries] = await Promise.all([
      fetch("/datasets/deaths-in-armed-conflicts-based-on-where-they-occurred.csv").then(res => res.text()),
      fetch("/datasets/ne_110m_admin_0_countries(2).geojson").then(res => res.json()),
    ]);

    const rows = csvText
      .trim()
      .split("\n")
      .slice(1)
      .map(line => {
        const [Entity, Year, Best, Low, High] = line.split(",");
        return { Entity, Year: +Year, Best: +Best, Low: +Low, High: +High };
      });
    const latestYear = Math.max(...rows.map(r => r.Year));
    const latestData = Object.fromEntries(
      rows.filter(r => r.Year === latestYear).map(r => [r.Entity.toLowerCase(), r])
    );
    const features = countries.features.filter(f => f.properties.ISO_A2 !== "AQ");
    features.forEach(f => {
      const entity = f.properties.ADMIN.toLowerCase();
      f.properties.deaths = latestData[entity]?.Best ?? 0;
    });
    const maxDeaths = Math.max(...features.map(f => f.properties.deaths || 0));
    const interpolateColor = (color1, color2, factor) => {
      const c1 = new THREE.Color(color1);
      const c2 = new THREE.Color(color2);
      return c1.lerp(c2, factor).getStyle();
    };
    const getColor = (deaths) => {
      if (!deaths || deaths <= 0) return "green";
      const t = (Math.log(1 + deaths)) / (Math.log(1 + maxDeaths));
      return interpolateColor("green", "red", t);
    };
    globe
      .polygonsData(features)
      .polygonCapColor((f) => getColor(f.properties.deaths))
      .polygonSideColor(() => "rgba(255,255,255,0.05)")
      .polygonStrokeColor(() => "#111")
      .polygonLabel(
        ({ properties: d }) =>
          `<b>${d.ADMIN} (${d.ISO_A2})</b><br/>Deaths (latest year ${latestYear}): <b>${d.deaths}</b>`
      );
    // Optional interactions
    if (enableInteractions) {
      let zoomedCountry = null;
      const getCentroid = (feature) => {
        try {
          const coords = feature.geometry.coordinates[0];
          const lonSum = coords.reduce((sum, [lon]) => sum + lon, 0);
          const latSum = coords.reduce((sum, [, lat]) => sum + lat, 0);
          return { lat: latSum / coords.length, lng: lonSum / coords.length };
        } catch {
          return null;
        }
      };
      const smoothPointOfView = (target, duration = 2000) => {
        const start = globe.pointOfView();
        const startTime = performance.now();
        const easeInOutQuad = t => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
        const animate = () => {
          const now = performance.now();
          const t = Math.min((now - startTime) / duration, 1);
          const eased = easeInOutQuad(t);
          globe.pointOfView({
            lat: start.lat + (target.lat - start.lat) * eased,
            lng: start.lng + (target.lng - start.lng) * eased,
            altitude: start.altitude + (target.altitude - start.altitude) * eased,
          }, 0);
          if (t < 1) requestAnimationFrame(animate);
        };
        animate();
      };
      globe.onPolygonClick((f) => {
        const centroid = getCentroid(f);
        if (!centroid) return;
        const name = f.properties.ADMIN;
        if (zoomedCountry === name) {
          smoothPointOfView({ lat: 0, lng: 0, altitude: 3 }, 2000);
          zoomedCountry = null;
          globe.customLayerData([]);
        } else {
          smoothPointOfView({ lat: centroid.lat, lng: centroid.lng, altitude: 0.7 }, 2000);
          zoomedCountry = name;
          if (spawnEntities) {
            spawnRagdolls(centroid);
          }
        }
        if (onCountryClick) onCountryClick(f);
      });
    }
    function spawnRagdolls(center) {
      const ragdolls = Array.from({ length: 5 }, () => ({
        lat: center.lat + (Math.random() - 0.5) * 0.3,
        lng: center.lng + (Math.random() - 0.5) * 0.3,
      }));
      globe
        .customLayerData(ragdolls)
        .customThreeObject(() => {
          const group = new THREE.Group();
          const material = new THREE.MeshStandardMaterial({ color: 0xff5555 });
          const head = new THREE.Mesh(new THREE.SphereGeometry(0.02), material);
          head.position.y = 0.06;
          group.add(head);
          const body = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.05, 8), material);
          group.add(body);
          return group;
        })
        .customThreeObjectUpdate((obj, d) => {
          const { x, y, z } = globe.getCoords(d);
          obj.position.set(x, y, z);
        });
      }
    }
  return { globe };
} 

function loadScript(src) {
    return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
} 
