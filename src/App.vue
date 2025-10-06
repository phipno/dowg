<template>
  <div class="app-container">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App'
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
