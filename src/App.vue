<template>
  <div class="app-container">
    <div class="split-layout" :class="{ 'menu-mode': showMenu, 'globe-mode': !showMenu }">
      <div class="left-panel">
        <StartMenu 
          :class="{ 'visible': showMenu, 'hidden': !showMenu }"
          @start="startVisualization" 
        />
      </div>
      <div class="right-panel">
        <GlobeVisualization 
          :class="{ 'visible': !showMenu, 'hidden': showMenu }"
          :dataset="selectedDataset" 
          @back="returnToMenu"
        />
      </div>
    </div>
  </div>
</template>

<script>
import StartMenu from './components/StartMenu.vue'
import GlobeVisualization from './components/GlobeVisualization.vue'

export default {
  name: 'App',
  components: {
    StartMenu,
    GlobeVisualization
  },
  data() {
    return {
      showMenu: true,
      selectedDataset: null
    }
  },
  methods: {
    startVisualization(dataset) {
      this.selectedDataset = dataset;
      this.showMenu = false;
    },
    returnToMenu() {
      this.showMenu = true;
    }
  }
}
</script>

<style>
body { 
  margin: 0; 
  padding: 0; 
  background: #000; 
  overflow: hidden; 
  font-family: Arial; 
}

#app {
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100vh;
}

.app-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.split-layout {
  display: flex;
  width: 100%;
  height: 100%;
  transition: all 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.menu-mode .left-panel {
  width: 50%;
  transition: all 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.menu-mode .right-panel {
  width: 50%;
  transition: all 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.globe-mode .left-panel {
  width: 0%;
  transition: all 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.globe-mode .right-panel {
  width: 100%;
  transition: all 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.left-panel {
  position: relative;
  overflow: hidden;
}

.right-panel {
  position: relative;
  overflow: hidden;
}
</style>
