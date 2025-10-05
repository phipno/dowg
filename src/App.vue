<template>
  <GlobeVisualization />
</template>

<script>
import GlobeVisualization from './components/GlobeVisualization.vue'

export default {
  name: 'App',
  components: {
    GlobeVisualization
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
</style>
