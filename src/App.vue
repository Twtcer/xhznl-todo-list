<template>
  <div id="app" :class="{ unfocused: ignoreMouse }">
    <div class="mask"></div>
    <div class="drag-nav">
      <b>{{ appName }}</b> 
    </div>
    <div class="nav">
      <div class="link">  
        <router-link draggable="true" to="/">Stock</router-link> |
        <router-link draggable="false" to="/todo">Todo</router-link> |
        <router-link draggable="false" to="/done">Done</router-link> 
      </div>
      <div class="tools">
        <transition-group name="fade" mode="out-in">
          <i class="iconfont icon-export" key="export" @click="exportData"></i>
          <i class="iconfont icon-eye-close" key="hide" @click="hideWindow"></i>

          <i
            :class="['iconfont', ignoreMouse ? 'icon-lock' : 'icon-unlock']"
            key="lock"
            @mouseenter="setIgnoreMouseEvents(false)"
            @mouseleave="setIgnoreMouseEvents(ignoreMouse)"
            @click="ignoreMouse = !ignoreMouse"
          ></i>

          <i class="iconfont icon-close" key="close" @click="close"></i>
            
        </transition-group>
      </div>
    </div>
    <div class="main scrollbar scrollbar-y">
      <transition name="fade-transform" mode="out-in">
        <!-- <keep-alive> -->
        <router-view />
        <!-- </keep-alive> -->
      </transition>
    </div>
    <div class="state-panel"> 
        <div class="item sh "> 上证: <span>3309.22</span> </div> 
        <div class="item sz "> 深证:<span>  12022 </span> </div>
         <div class="item hk "> 港股:<span>  19022 </span> </div>
    </div>
  </div>
</template>

<script>
import pkg from "../package.json";

import { ipcRenderer } from "electron";

export default {
  data() {
    return {
      appName: pkg.name,
      ignoreMouse: false,
    };
  },
  methods: {
    setIgnoreMouseEvents(ignore) {
      ipcRenderer.invoke("setIgnoreMouseEvents", ignore);
    },
    exportData() {
      ipcRenderer.invoke("exportData");
    },
    hideWindow() {
      ipcRenderer.invoke("hideWindow");
    },
    close(){
      ipcRenderer.invoke("handleClose");
    }
  },
};
</script>

<style lang="scss" scoped>
#app {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background-color: rgba($color: #31303065, $alpha: 0.6);
  border-radius: 5px;
  .mask {
    display: none;
    position: absolute;
    z-index: 999;
    width: 100%;
    height: 100%;
  }
  .drag-nav {
    -webkit-app-region: drag;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 20px;
    padding: 0 20px;
    box-sizing: border-box;
    font-size: 12px;
    b,
    i {
      color: rgba($color: #ffffff, $alpha: 0.9);
    }
  }
  .nav {
    display: flex;
    justify-content: space-between;
    height: 26px;
    padding: 0 20px;
    color: #cccccc;
    user-select: none;
    .link {
      a {
        font-weight: bold;
        color: #cccccc;
        text-decoration: none;
        &.router-link-exact-active {
          font-size: 20px;
          color: #ffffff;
        }
        &:hover {
          color: rgba($color: #ffffff, $alpha: 0.6);
        }
      }
    }
    .tools {
      display: flex;
      i {
        font-size: 20px;
        line-height: 26px;
        padding: 0 5px;
        cursor: pointer;
      }
    }
  }
  .main {
    flex: 1;
    margin: 10px 0;
    overflow-y: auto;
    &:hover::-webkit-scrollbar-thumb {
      display: block;
    }
  }
}
#app.unfocused {
  opacity: 0.8;
  .mask {
    display: block;
  }
  .tools {
    z-index: 1000;
  }
}

.state-panel{
 height: 40px;
 background-color: rgba($color: #c3cec3, $alpha: 0.8);
 display: flex;
 flex-flow: row wrap;
 align-content: flex-start;
 
 .item{
   line-height: 40px;
   font-size: 20px;  
     flex: 0 0 33%; 
 }

 .sh{
   color: rgba($color: #ff0000, $alpha: 0.4);
 }
 .sz{
   color: rgba($color: #00ff00, $alpha: 0.4);
 }
 .hk{
   color: rgba($color: #0000ff, $alpha: 0.4);
 }
}

</style>
