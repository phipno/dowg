<template>
  <div class="start-menu">
    <div class="menu-container">
      <h1 class="title">🌍 Globe Visualization</h1>
      <p class="subtitle">Select a dataset to explore global data</p>
      
      <div class="dataset-selection">
        <h3>Choose Dataset:</h3>
        <div class="dataset-options">
          <div 
            v-for="dataset in datasets" 
            :key="dataset.id"
            class="dataset-option"
            :class="{ selected: selectedDataset === dataset.id }"
            @click="selectDataset(dataset.id)"
          >
            <div class="dataset-icon">{{ dataset.icon }}</div>
            <div class="dataset-info">
              <h4>{{ dataset.name }}</h4>
              <p>{{ dataset.description }}</p>
              <span class="data-count">{{ dataset.pointCount }} data points</span>
            </div>
          </div>
        </div>
      </div>
      
      <button 
        class="start-button"
        :class="{ enabled: selectedDataset !== null }"
        :disabled="selectedDataset === null"
        @click="startVisualization"
      >
        Start Visualization
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StartMenu',
  data() {
    return {
      selectedDataset: null,
      datasets: [
        {
          id: 'population',
          name: 'Population Density',
          description: 'Global population distribution and density patterns',
          icon: '👥',
          pointCount: 150,
          data: this.generateRandomData('population')
        },
        {
          id: 'temperature',
          name: 'Temperature Anomalies',
          description: 'Climate temperature variations across regions',
          icon: '🌡️',
          pointCount: 200,
          data: this.generateRandomData('temperature')
        },
        {
          id: 'economic',
          name: 'Economic Activity',
          description: 'GDP and economic indicators by region',
          icon: '💰',
          pointCount: 120,
          data: this.generateRandomData('economic')
        }
      ]
    }
  },
  methods: {
    selectDataset(datasetId) {
      this.selectedDataset = datasetId;
    },
    
    startVisualization() {
      if (this.selectedDataset) {
        const selectedData = this.datasets.find(d => d.id === this.selectedDataset);
        // Use router to navigate to /globe and pass dataset as query param
        this.$router.push({
          path: '/globe',
          query: { dataset: JSON.stringify(selectedData) }
        });
      }
    },
    
    generateRandomData(type) {
      const data = [];
      const cities = [
        { name: "New York", lat: 40.7128, lng: -74.0060 },
        { name: "London", lat: 51.5074, lng: -0.1278 },
        { name: "Tokyo", lat: 35.6762, lng: 139.6503 },
        { name: "Paris", lat: 48.8566, lng: 2.3522 },
        { name: "Sydney", lat: -33.8688, lng: 151.2093 },
        { name: "Moscow", lat: 55.7558, lng: 37.6176 },
        { name: "Cairo", lat: 30.0444, lng: 31.2357 },
        { name: "São Paulo", lat: -23.5505, lng: -46.6333 },
        { name: "Mumbai", lat: 19.0760, lng: 72.8777 },
        { name: "Beijing", lat: 39.9042, lng: 116.4074 }
      ];
      
      cities.forEach(city => {
        let value, radius, color;
        
        switch(type) {
          case 'population':
            value = Math.random() * 1000 + 100;
            radius = Math.random() * 0.3 + 0.1;
            color = `hsl(${Math.random() * 60 + 180}, 70%, 50%)`; // Blue-green range
            break;
          case 'temperature':
            value = Math.random() * 20 - 10; // -10 to +10
            radius = Math.random() * 0.4 + 0.15;
            color = value > 0 ? `hsl(${Math.random() * 60}, 70%, 50%)` : `hsl(${Math.random() * 60 + 200}, 70%, 50%)`; // Red for hot, blue for cold
            break;
          case 'economic':
            value = Math.random() * 5000 + 500;
            radius = Math.random() * 0.5 + 0.2;
            color = `hsl(${Math.random() * 60 + 40}, 70%, 50%)`; // Yellow-orange range
            break;
        }
        
        data.push({
          name: city.name,
          lat: city.lat,
          lng: city.lng,
          value: value,
          radius: radius,
          color: color
        });
      });
      
      return data;
    }
  }
}
</script>

<style scoped>
.start-menu {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 1;
  transform: translateX(0);
  transition: all 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.start-menu.hidden {
  opacity: 0;
  transform: translateX(-100%);
}

.menu-container {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px;
  max-width: 600px;
  width: 90%;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.title {
  font-size: 3rem;
  margin: 0 0 10px 0;
  color: #fff;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
}

.subtitle {
  font-size: 1.2rem;
  color: #ccc;
  margin: 0 0 40px 0;
}

.dataset-selection h3 {
  color: #fff;
  margin: 0 0 20px 0;
  font-size: 1.5rem;
}

.dataset-options {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;
}

.dataset-option {
  display: flex;
  align-items: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid transparent;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.dataset-option:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.dataset-option.selected {
  border-color: #4CAF50;
  background: rgba(76, 175, 80, 0.1);
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.3);
}

.dataset-icon {
  font-size: 2.5rem;
  margin-right: 20px;
  min-width: 60px;
}

.dataset-info h4 {
  color: #fff;
  margin: 0 0 5px 0;
  font-size: 1.3rem;
}

.dataset-info p {
  color: #ccc;
  margin: 0 0 5px 0;
  font-size: 0.9rem;
}

.data-count {
  color: #4CAF50;
  font-size: 0.8rem;
  font-weight: bold;
}

.start-button {
  background: linear-gradient(45deg, #4CAF50, #45a049);
  color: white;
  border: none;
  padding: 15px 40px;
  font-size: 1.2rem;
  font-weight: bold;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 10px 20px rgba(76, 175, 80, 0.3);
  min-width: 200px;
}

.start-button:disabled {
  background: #666;
  cursor: not-allowed;
  box-shadow: none;
  opacity: 0.5;
}

.start-button.enabled:hover {
  transform: translateY(-3px);
  box-shadow: 0 15px 30px rgba(76, 175, 80, 0.4);
}

.start-button.enabled:active {
  transform: translateY(-1px);
}
</style>
