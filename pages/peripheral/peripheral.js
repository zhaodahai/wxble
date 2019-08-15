// pages/peripheral/peripheral.js

import { BTManager, ConnectStatus} from '../../wx-ant-ble/index.js';

Page({

  /**
   * 页面的初始数据
   */
  data: {
    device: {},
    connected: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let device = JSON.parse(options.device);
    this.setData({ device });
    
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.initBluetooth();
  },

  initBluetooth() {

    // 初始化蓝牙管理器
    this.bt = new BTManager();

    this.setData({connected: this.bt.connectStatus === ConnectStatus.connected})

    // 注册状态回调
    this.bt.registerDidUpdateConnectStatus(res => {
      console.log('peripheral registerDidUpdateConnectStatus', res);
      if (res.connectStatus === ConnectStatus.disconnected) {
        this.setData({ connected: false });
        wx.showToast({
          title: res.message,
          icon: 'none'
        })
      }
    });
  },

  _selectCharacteristic(e) {

    let { sid, cid } = e.currentTarget.dataset;
    let services = this.data.device.services;    
    wx.navigateTo({
      url: '/pages/characteristic/characteristic?cdata='+JSON.stringify({
        suuid: services[sid].serviceId,
        cuuid: services[sid].characteristics[cid].uuid,
        properties: services[sid].characteristics[cid].properties
      })+'&notifyUUIDs='+JSON.stringify(this.parseNotifyUUIDs())+'&connected='+this.data.connected,
    })
  },

  parseNotifyUUIDs() {
    let uuids = [];
    for (let service of this.data.device.services) {
      for (let char of service.characteristics) {
        if (char.properties.notify) {
          uuids.push({
            suuid: service.serviceId,
            cuuid: char.uuid,
            isListening: false
          })
        }
      }
    }
    console.log(uuids)
    return uuids;
  },

  _about() {
    wx.navigateTo({
      url: '/pages/about/about',
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    this.bt.disconnect();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})