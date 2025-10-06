<template>
  <div ref="container" class="mini-globe" />
</template>

<script>
import { useGlobe } from '@/composables/useGlobe';

export default {
  name: 'MiniGlobe',
  props: {
    dataset: Object,
    isActive: Boolean,
  },
  data() {
    return {
      globeInstance: null,
      polygonsAdded: false,
    };
  },
  async mounted() {
    // Initialize globe with just the globe image (no polygons)
    this.globeInstance = await useGlobe({
      container: this.$refs.container,
      enableInteractions: false,
      spawnEntities: false,
      onCountryClick: null,
      // We can modify useGlobe to optionally skip loading dataset on init
      skipDataLoad: true, // custom flag to skip dataset loading
    });
  },
  watch: {
    isActive(newVal) {
      if (newVal && this.dataset && !this.polygonsAdded) {
        this.loadDatasetPolygons();
      } else if (!newVal && this.polygonsAdded) {
        this.clearDatasetPolygons();
      }
    }
  },
  methods: {
    async loadDatasetPolygons() {
      // load data for the selected dataset and display polygons
      // This might involve calling useGlobe again or a method on globeInstance

      // Example: if useGlobe returns globe object that can update polygons
      const globe = this.globeInstance.globe;

      // Fetch dataset CSV and GeoJSON (same as your useGlobe function does)
      const [csvText, countries] = await Promise.all([
        fetch("/datasets/deaths-in-armed-conflicts-based-on-where-they-occurred.csv").then(res => res.text()),
        fetch("/datasets/ne_110m_admin_0_countries(2).geojson").then(res => res.json()),
      ]);

      // Process CSV, countries, etc. (your existing logic)

      // Then update polygons on the globe instance:
      globe.polygonsData(countries.features);

      this.polygonsAdded = true;
    },
    clearDatasetPolygons() {
      this.globeInstance.globe.polygonsData([]);
      this.polygonsAdded = false;
    }
  }
}
</script>

<style scoped>
.mini-globe {
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.9;
  z-index: 1;
}
</style>
