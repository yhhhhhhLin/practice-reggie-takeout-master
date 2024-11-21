<!--
  - Copyright © 2023 Enaium <enaium@outlook.com>
  -
  - This work is free. You can redistribute it and/or modify it under the
  - terms of the Do What The Fuck You Want To Public License, Version 2,
  - as published by Sam Hocevar. See http://www.wtfpl.net/ for more details.
  -->

<script setup>
import {computed, onMounted, reactive} from "vue";
import {imgPath} from "@/js/frontend/common.js";
import {cartListApi} from "@/api/frontend/main.js";
import {getDefaultAddressApi} from "@/api/frontend/address.js";
import {useRouter} from "vue-router";
import {addOrderApi, orderPayment} from "@/api/frontend/order.js";
import {base} from "@/js/frontend/base.js";
import {Dialog} from "vant";

const router = useRouter()

const payMethods = [
  {id: 1, name: "微信支付", icon: "wechat"},
  {id: 2, name: "支付宝", icon: "alipay"},
];

// 显示支付弹窗
const showPaymentDialog = () => {
  data.showPayDialog = true;
};

// 切换支付方式
const selectPayMethod = (methodId) => {
  data.selectedPayMethod = methodId;
};

// 切换配送方式
const changeDeliveryStatus = (status) => {
  data.deliveryStatus = status;
};


const data = reactive({
  address: {
    phone: '',//手机号
    consignee: '',//姓名
    detail: '',//详细地址
    sex: '1',
    id: undefined
  },
  orderNumber: null,
  selectedPayMethod: 1,
  deliveryStatus: 1,
  showPayDialog: false,
  finishTime: '',//送达时间
  cartData: [],
  note: ''//备注信息
})

const goodsNum = computed(() => {
  let num = 0
  data.cartData.forEach(item => {
    num += item.number
  })
  if (num < 99) {
    return num
  } else {
    return '99+'
  }
})

const goodsPrice = computed(() => {
  let price = 0
  data.cartData.forEach(item => {
    price += (item.number * item.amount)
  })
  return price
})

onMounted(() => {
  initData()
  base()
})

const goBack = () => {
  router.back()
};
const initData = () => {
  //获取默认的地址
  defaultAddress()
  //获取购物车的商品
  getCartData()
};
//获取默认地址
const defaultAddress = async () => {
  const res = await getDefaultAddressApi()
  if (res.code === 1) {
    data.address = res.data
    getFinishTime()
  } else {
    await router.push({path: "/frontend/address-edit"})
  }
};
//获取送达时间
const getFinishTime = () => {
  let now = new Date()
  let year = now.getFullYear()
  let month = now.getMonth() + 1
  let day = now.getDate()
  let hour = now.getHours() + 1
  let minute = now.getMinutes()


  if (month.toString().length < 2) {
    month = '0' + month
  }
  if (day.toString().length < 2) {
    day = '0' + day
  }
  if (hour.toString().length < 2) {
    hour = '0' + hour
  }
  if (minute.toString().length < 2) {
    minute = '0' + minute
  }
  data.finishTime = year + "-" + month + "-" + day + " " + hour + ':' + minute
};
const toAddressPage = () => {
  router.push({path: "/frontend/address"})
};
//获取购物车数据
const getCartData = async () => {
  const res = await cartListApi({})
  if (res.code === 1) {
    data.cartData = res.data
  } else {
    $notify({type: 'warning', message: res.msg});
  }
};

const goToPaySuccess = async () => {
  const params = {
    remark: data.note,
    payMethod: 1,
    addressBookId: data.address.id,
    estimatedDeliveryTime: data.finishTime,
    deliveryStatus: data.deliveryStatus,
    packAmount: 0,
    tablewareNumber: 0,
    tablewareStatus: 0,
    amount: goodsPrice.value

  }
  const res = await addOrderApi(params)
  data.orderNumber = res.data.orderNumber
  // 如果创建订单成功，那么弹出选择支付方式
  if (res.code === 1) {
    showPaymentDialog()
  }

};

const confirmPayment = async () => {
  const params = {
    orderNumber: data.orderNumber,
    payMethod: data.selectedPayMethod,
  }
  const res = await orderPayment(params)
  if (res.code === 1) {
    await router.push({path: "/frontend/pay-success"})
  } else {
    $notify({type: 'warning', message: res.msg});
  }
}

//网络图片路径转换
const imgPathConvert = path => imgPath(path);
</script>

<template>
  <div id="add_order" class="app">
    <div class="divHead">
      <div class="divTitle">
        <i class="el-icon-arrow-left" @click="goBack"></i>菩提阁
      </div>
    </div>
    <div class="divContent">
      <div class="divAddress">
        <div @click="toAddressPage">
          <div class="address">{{ data.address.detail }}</div>
          <div class="name">
            <span>{{ data.address.consignee }}{{ data.address.sex === '1' ? '先生' : '女士' }}</span>
            <span>{{ data.address.phone }}</span>
          </div>
          <i class="el-icon-arrow-right"></i>
        </div>
        <div class="divSplit"></div>
        <div class="divFinishTime">预计{{ data.finishTime }}送达</div>
      </div>
      <div class="deliveryStatus">
        <div class="deliveryTitle">配送方式</div>
        <div class="deliveryOptions">
          <div
              class="deliveryOption"
              :class="{ active: data.deliveryStatus === 1 }"
              @click="changeDeliveryStatus(1)"
          >
            <span>立即送达</span>
          </div>
          <div
              class="deliveryOption"
              :class="{ active: data.deliveryStatus === 2 }"
              @click="changeDeliveryStatus(2)"
          >
            <span>具体时间送达</span>
            <span v-if="data.deliveryStatus === 2" class="deliveryTime">{{ data.finishTime }}</span>
          </div>
        </div>
      </div>
      <div class="order">
        <div class="title">订单明细</div>
        <div class="divSplit"></div>
        <div class="itemList">
          <div class="item" v-for="(item,index) in data.cartData" :key="index">
            <el-image :src="imgPathConvert(item.image)">
              <div slot="error" class="image-slot">
                <img src="@/assets/frontend/noImg.png" alt=""/>
              </div>
            </el-image>
            <div class="desc">
              <div class="name">{{ item.name }}</div>
              <div class="numPrice">
                <span class="num">x{{ item.number }}</span>
                <div class="price">
                  <span class="spanMoney">￥</span>{{ item.amount }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="note">
        <div class="title">备注</div>
        <el-input
            v-model="data.note"
            rows="2"
            autosize
            type="textarea"
            maxlength="50"
            placeholder="请输入您需要备注的信息"
            show-word-limit
        />
      </div>
    </div>
    <div class="divCart">
      <div
          :class="{imgCartActive: data.cartData && data.cartData.length > 0, imgCart:!data.cartData || data.cartData.length<1}"></div>
      <div :class="{divGoodsNum:1===1, moreGoods:data.cartData && data.cartData.length > 99}"
           v-if="data.cartData && data.cartData.length > 0">{{ goodsNum }}
      </div>
      <div class="divNum">
        <span>￥</span>
        <span>{{ goodsPrice }}</span>
      </div>
      <div class="divPrice"></div>
      <div
          :class="{btnSubmitActive: data.cartData && data.cartData.length > 0, btnSubmit:!data.cartData || data.cartData.length<1}"
          @click="goToPaySuccess">去支付
      </div>
    </div>
  </div>

  <div>
    <Dialog v-model:show="data.showPayDialog" :show-confirm-button="false" class="dialogFlavor">
      <div class="dialogTitle">选择支付方式</div>
      <div class="payMethodList">
        <div
            v-for="method in payMethods"
            :key="method.id"
            class="payMethodItem"
            :class="{ active: data.selectedPayMethod === method.id }"
            @click="selectPayMethod(method.id)"
        >
          <i :class="`iconfont icon-${method.icon}`"></i>
          <span>{{ method.name }}</span>
        </div>
      </div>
      <div class="dialogFooter">
        <el-button type="primary" @click="confirmPayment">确认支付</el-button>
        <el-button @click="data.showPayDialog = false">取消</el-button>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
@import "@/styles/frontend/index.css";
@import "@/styles/frontend/add-order.css";
</style>