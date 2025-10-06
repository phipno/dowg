<template>
  <div class="start-menu-layout" :class="{ 'globe-mode': isGlobeMode }">
    <div class="menu-panel" :class="{ hidden: isGlobeMode }">
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

    <div class="globe-panel" :class="{ expanded: isGlobeMode }">
      <MiniGlobe 
        :dataset="selectedDatasetData" 
        :isActive="isGlobeMode" 
      />
    </div>
  </div>
</template>

<script>
import MiniGlobe from './MiniGlobe.vue';

export default {
  name: 'StartMenu',
  components: { MiniGlobe },
  data() {
  return {
    selectedDataset: null,
    isGlobeMode: false,
    datasets: [
      {id: 'deaths_in_armed_conflict', name: 'Deaths in Armed Conflict', description: 'Global data on fatalities from armed conflicts.', icon: '🤯'},
    ]
  }
},
computed: {
  selectedDatasetData() {
    return this.datasets.find(d => d.id === this.selectedDataset) || null;
  }
},
methods: {
  selectDataset(id) {
    this.selectedDataset = id;
  },
  startVisualization() {
    if (this.selectedDataset) {
      this.isGlobeMode = true;
    }
  }
}

}
</script>

<style scoped>

@media (max-width: 768px) {
  .start-menu-layout {
    flex-direction: column;
  }

  .menu-panel, .globe-panel {
    width: 100%;
    height: 50%;
  }
}


.globe-panel {
  width: 60%;
  transition: width 1s ease;
  position: relative;
  overflow: hidden;
}

.globe-panel.expanded {
  width: 100%;
}


.menu-panel {
  padding: 20px;
}

.start-menu-layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #111;
  color: white;
  transition: all 1s ease;
}

.menu-panel {
  width: 40%;
  padding: 40px;
  transition: transform 1s ease, opacity 1s ease;
  z-index: 2;
  background-color: rgba(0, 0, 0, 0.85);
}

.menu-panel.hidden {
  transform: translateX(-100%);
  opacity: 0;
  pointer-events: none;
}

.globe-panel {
  width: 60%;
  position: relative;
  overflow: hidden;
}

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

.start-button.enabled {
  background-color: #4ecdc4;
  color: #000;
}
.start-button:disabled {
  background-color: #444;
  color: #999;
  cursor: not-allowed;
}

.mini-globe {
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.9;
  z-index: 1;
}

</style>
