<template>
  <div class="root" @click="add">
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
            {{ stock.stockId }}.{{ stock.stockName }} 
            <span class="basePrice">{{stock.basePrice}}</span> / <span v-bind:class="{'currentPrice-up':stock.basePrice < stock.currentPrice,'currentPrice-down':stock.basePrice >= stock.currentPrice}">{{stock.currentPrice}}</span>
            </p>
          <div class="edit" v-else>
            <input
              v-model="stock.stockId"
              v-focus
              @click.stop="return false;"
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
    };
  },
  methods: {
    getStockList() {  
      const list = DB.get("stockList");  
      if (list===undefined) {   
        this.stockList = [ 
          {
            stockId:"000001",
            stockName:"平安银行",
            basePrice:17.5,
            currentPrice:18.5,
            createTime: getNowDateTime()
          },
        ];  
        return;
      }
      this.stockList = list;
    },
    add() {
      if (this.editIndex !== -1) {
        this.edited();
        return;
      }

      this.stockList.push({
            stockId:"000001",
            stockName:"",
            basePrice:0,
            currentPrice:0,
            createTime: getNowDateTime()
      });
      const index = this.stockList.length - 1;
      this.tempItem = Object.assign({}, this.stockList[index]);
      this.editIndex = index;
      //this.editing(index);
      //ToDo:爬取股票价格
    },
    editing(index) {
      setTimeout(() => {
        if (this.dblclick) {
          return;
        }

        if (this.editIndex !== -1) {
          this.edited();
        }

        this.tempItem = Object.assign({}, this.stockList[index]);

        this.editIndex = index;
      }, 220);
    },
    edited() {
      this.stockList = this.stockList.filter((p) => {
        return p.stockId;
      });
      this.editIndex = -1;

      DB.set("stockList", this.stockList);
    },
    cancel(index) {
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
      if (this.editIndex !== -1) {
        return;
      }

      this.dblclick = true;
      setTimeout(() => {
        this.dblclick = false;
      }, 500);

      CursorSpecialEffects.handleMouseDown(event);

      DB.insert(
        "doneList",
        Object.assign(
          { done_date: getNowDate(), done_datetime: getNowDateTime() },
          this.stockList[index]
        )
      );
      this.stockList.splice(index, 1);
      DB.set("stockList", this.stockList);
    }, 
    // queryStock(stockId){
    // } 
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
    console.log('stock page call created');
    ipcRenderer.invoke("getDataPath").then((storePath) => {
      DB.initDB(storePath); 
      this.getStockList();
    });
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
        color: rgba($color: #63e21a8f, $alpha: 0.9); 

        .basePrice{
            color: rgba($color: #e7f707fa, $alpha: 0.9); 
        }

        .currentPrice-up{
            color: rgba($color: #f80e0ebe, $alpha: 0.9); 
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
        color: rgba($color: #ffffff, $alpha: 0.9);
      }
    }
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
