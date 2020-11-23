<template> 
   
  <div class="root" @click="add">   
     <!-- <div>
      <button type="button"
     v-bind:class="{'start':start,'stop':!start}" class="optBtn" @click="startQuery">
      {{this.startLabelText}}
      </button> 
      </div> -->
    <draggable
      class="list"
      v-model="stockList"
      v-bind="dragOptions"
      @start="drag = true"
      @end="drag = false"
      :disabled="editIndex !== -1"
    >
      <transition-group type="transition" :name="!drag ? 'flip-list' : null">
        <div
          class="item"
          v-for="(stock, index) in stockList"
          :key="'stock' + index"
          @dblclick.stop="done($event, index)"
          @click.stop="editing(index)"
        >
          <p v-if="index !== editIndex">
          <span class="stockId">  {{ stock.stockId }} </span>
           <span class="stockName">  {{ stock.stockName }} </span>
             开盘
            <span class="todayPrice">{{stock.todayPrice}}</span> 
            /
              实时
             <span v-bind:class="{'currentPrice-up':stock.todayPrice < stock.currentPrice,'currentPrice-down':stock.todayPrice >= stock.currentPrice}">{{stock.currentPrice}}</span>
             /
             最低
            <span class="todayMinPrice">{{stock.todayMinPrice}}</span> 
               /
               最高
            <span class="todayMaxPrice">{{stock.todayMaxPrice}}</span> 

            </p>
          <div class="edit" v-else>
            <input
              v-model="stock.stockId"
              v-focus
              @click.stop="return false"
              @keyup.27="cancel(index)"
              @keyup.13="edited"
              spellcheck="false"
            />
            <i class="iconfont icon-select" @click.stop="edited"></i>
            <i class="iconfont icon-close" @click.stop="clear(index)"></i>
          </div>
        </div>
      </transition-group>
    </draggable>   
 
 
 
  </div> 
</template>
<script>
import draggable from "vuedraggable";
import CursorSpecialEffects from "@/utils/fireworks";
import { ipcRenderer } from "electron";
import DB from "@/utils/db";
import { getNowDate, getNowDateTime } from "@/utils/common";
import axios from "axios";  

export default {
  name: "Stock",
  components: {
    draggable,
  },
  data() {
    return {
      stockList: [],
      drag: false,
      editIndex: -1,
      tempItem: null,
      dblclick: false,
      setIntervalTime:2000,
      timer:0,
      startLabelText:"开始",
      start:false
    };
  },
  methods: {
    getStockPrefix(stock){ 
      if(stock===null)
        return null;
      let prefix =  "0123".indexOf(stock.stockId.substring(0,1))>=0
       ?"sz":"sh";
       return  prefix+stock.stockId; 
    },  
    queryStockInfos()
    {  
      let stocks = [];
      let stockIds =  this.stockList.filter(a=> a.stockId).map(a=> this.getStockPrefix(a));
       axios.get(`http://hq.sinajs.cn/list=${stockIds.join(',')}`)
      .then(response =>{ 
        try
        {
          let stocks =  response.data.split(';');
          let stockInfos = stocks.map((stock,index)=>{
            let data = stock.split('=')[1]; 
            if(data)
            {  
              let params = data.substring(1,data.length-1).split(',');
              return {
                          stockId:stockIds[index].substring(2),
                          stockName:params[0],
                          todayPrice:params[1],
                          yesterdayPrice:params[2],
                          currentPrice:params[3],
                          todayMaxPrice:params[4],
                          todayMinPrice:params[5],
                          createdTime:params[30]+' '+params[31],
                      };
            }  
          }); 
          stocks = stockInfos.filter(a=>a);  
          this.stockList = stocks;
          DB.set("stockList", stocks);
        }
        catch(err){
            console.log(err);
        }  
      })
      .catch(e=>{
        console.error("query stock info error : "+e); 
      });
      return stocks;
    },  
    getStockList() {  
      const list = DB.get("stockList");  
      if (list===undefined || list.length<=0) {   
        this.stockList = [ 
          {
            stockId:"000001",
            stockName:"平安银行", 
            todayPrice:0,
            yesterdayPrice:0,
            currentPrice:0,
            todayMaxPrice:0,
            todayMinPrice:0,
            createdTime:getNowDateTime()
          },
        ];  
        return;
      }
      this.stockList = list;
    },
    add() {
      
      console.log('add');
      if (this.editIndex !== -1) {
        this.edited();
        return;
      }

      this.stockList.push({
            stockId:"",
            stockName:"",  
            todayPrice:0,
            yesterdayPrice:0,
            currentPrice:0,
            todayMaxPrice:0,
            todayMinPrice:0,
            createdTime:getNowDateTime()
      });
       
      const index = this.stockList.length - 1;
      this.tempItem = Object.assign({}, this.stockList[index]); 
      this.editing(index); 
    },
    editing(index) {  
      this.editIndex = index;  
      // setTimeout(() => {
      //   if (this.dblclick) {
      //     return;
      //   }

      //   if (this.editIndex !== -1) {
      //     this.edited();
      //   } 
         
      //   this.tempItem = Object.assign({}, this.stockList[index]);    
      // }, 220);
    },
    edited() { 
      console.log('edited');
      this.stockList = this.stockList.filter((p) => {
        return p.stockId;
      });
      this.editIndex = -1; 
      DB.set("stockList", this.stockList);
    },
    cancel(index) { 
      console.log('cancel');
      this.$set(this.stockList, index, this.tempItem);
      this.edited();
    },
    clear(index) {
      if (!this.stockList[index].stockId) {
        this.edited();
        return;
      }

      this.stockList[index].stockId = "";
    },
    done(event, index) {
      debugger
      console.log('done');
      if (this.editIndex !== -1) {
        return;
      }

      this.dblclick = true;
      setTimeout(() => {
        this.dblclick = false;
      }, 500);

      CursorSpecialEffects.handleMouseDown(event);

      DB.insert(
        "stockList",
        Object.assign(
          { done_date: getNowDate(), done_datetime: getNowDateTime() },
          this.stockList[index]
        )
      );
      this.stockList.splice(index, 1);
      DB.set("stockList", this.stockList);
    },
    startQuery(){ 
      //默认定时刷新
      this.timer =  setInterval(()=>{
       this.queryStockInfos(); 
       console.log(`fresh,${this.setIntervalTime/1000}s`);
      },this.setIntervalTime);   
      this.start = true;
      this.startLabelText = "停止";
    },
    stopQuery(){
      console.log('clear timer: '+this.timer);
      clearInterval(this.timer);
            this.start = false;
      this.startLabelText = "开始";
    }
  },
  computed: {
    dragOptions() {
      return {
        animation: 200,
        group: "description",
        disabled: false,
        ghostClass: "ghost",
      };
    }, 
  },
  created() {  
    ipcRenderer.invoke("getDataPath").then((storePath) => {
      DB.initDB(storePath); 
      this.getStockList();  
      if(this.timer===0) {
        this.startQuery();
      } 
     });
  },
  destroyed() {
    this.stopQuery();
  },
  directives: {
    focus: {
      inserted: function(el) {
        el.focus();
      },
    },
  },
};
</script>

<style lang="scss" scoped>
.root {
  width: 100%;
  min-height: 100%;
  box-sizing: border-box;
  padding: 0 15px 28px 15px;
  .list {
    .item {
      height: 28px;
      p {
        width: 100%;
        height: 100%;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
        cursor: pointer;
        user-select: none;
        line-height: 28px; 
        // color: rgba($color: #63e21a8f, $alpha: 0.9); 

        .stockId{
          color: rgba($color: #00ff00, $alpha: 0.9);
        }
        .stockName{
           color: rgba($color: #00ffdd, $alpha: 0.9); 
        }
        .todayPrice{
            color: rgba($color: #2020f3bd, $alpha: 0.8); 
        }

        .todayMinPrice{
            color: rgba($color: #35f10f, $alpha: 0.8); 
        }

         .todayMaxPrice{
            color: rgba($color: #fa53b4, $alpha: 0.8); 
        }

        .currentPrice-up{
            color: rgba($color: #f80e0ee5, $alpha: 0.8); 
        } 
        
        .currentPrice-down{
            color: rgba($color: #63e21a8f, $alpha: 0.9); 
        }

      }
      .edit {
        display: flex;
        width: 100%;
        height: 100%;
        justify-content: space-between;
        input {
          flex: 1;
          height: 100%;
          outline: none;
          border: none;
          background: transparent;
          font-size: 16px;
          line-height: 28px;
        }
        i {
          line-height: 28px;
          padding: 0 5px;
          cursor: pointer;
        }
      }
    }
    .item:hover {
      p {
        color: rgba($color: #d5f811, $alpha: 0.9);
      }
    }
  }
  .optBtn{
     font-size: 20px;  
  }
  .start{
          color:rgb(51, 241, 25);
          background: #d5f811;
    }
    .stop{
          color: #ff0000;
          background: #d5f811;
    }
}

.flip-list-move {
  transition: transform 0.5s;
}
.no-move {
  transition: transform 0s;
}
.ghost {
  opacity: 0.5;
}

</style>
