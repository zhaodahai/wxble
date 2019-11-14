// pages/home/home.js


import { BTManager, ConnectStatus } from '../../wx-ant-ble/index.js';



Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 扫描到的设备
    devices: [],
    // 过滤最小信号强度
    filterRssi: -100,
    // 过滤名称
    filterName: '',
    // 是否显示filter
    showFilter: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.initBluetooth();
  },

  initBluetooth() {

    // 初始化蓝牙管理器
    this.bt = new BTManager({
      debug: false
    });

    // 注册状态回调
    this.bt.registerDidUpdateConnectStatus(this.didUpdateConnectStatus.bind(this));
    // 注册发现外设回调
    this.bt.registerDidDiscoverDevice(this.didDiscoverDevice.bind(this));    
  },

  didUpdateConnectStatus(res) {
    console.log('home registerDidUpdateConnectStatus', res);
    if (res.connectStatus === ConnectStatus.connected){
      wx.hideLoading();
      wx.navigateTo({
        url: '/pages/peripheral/peripheral?device='+JSON.stringify(res.device),
      })
    } else if (res.connectStatus === ConnectStatus.disconnected) {
      wx.hideLoading();
      wx.showToast({
        title: res.message,
        icon: 'none'
      })
    }
  },

  didDiscoverDevice(res) {
    // console.log('home didDiscoverDevice', res);
    if (res.timeout) {
      console.log('home didDiscoverDevice','扫描超时');
      wx.showModal({
        content: '扫描超时',
        showCancel: false,
      })
    } else {
      let device = res.device;
      let devices = this.data.devices;
      // 检查重复上报设备，更新信息
      function checkDuplicateDevice(d , ds) {
        for (let v of ds) {
          if (v.deviceId === d.deviceId) {
            Object.assign(v , d);
            return true;
          }
        }
        return false;
      }
      // 更新 & 过滤 
      if (!checkDuplicateDevice(device , devices) && device.RSSI>=this.data.filterRssi) {
        devices.push(device);
      }
      this.setData({devices});
    }
  },

  _scan () {
    function scanDevice() {
      this.bt.scan({
        services: [],
        allowDuplicatesKey: false,
        interval: 0,
        timeout: 15000,
        deviceName: '',
        containName: this.data.filterName
      }).then(res => {
        console.log('home scan success', res);
      }).catch(e => {
        console.log('home scan fail', e);
        this.destoryTimer();
        wx.showToast({
          title: e.message,
          icon: 'none'
        });
      });
    }
    scanDevice.call(this);
    // 重复调用前先销毁之前的计时器
    this.destoryTimer();
    this.scanTimer = setInterval(scanDevice.bind(this),5000)
  },

  _stopScan() {
    this.destoryTimer();
    this.bt.stopScan().then(res => {
      console.log('home stopScan success', res);
    }).catch(e => {
      console.log('home stopScan fail', e);
    })
  },

  // 销毁计时器
  destoryTimer() {
    this.scanTimer && clearInterval(this.scanTimer);
    this.scanTimer = null;
  },

  _refresh() {
    this.bt.disconnect();
    this.setData({ devices:[]});
    this._stopScan();
    this._scan();
  },

  _connect(e) {
    this._stopScan();
    let index = e.currentTarget.id;
    let device = this.data.devices[index];
    this.bt.connect(device).then(res => {
      console.log('home connect success', res);
    }).catch(e => {
      wx.showToast({ 
        title: e.message,
        icon: 'none'
      });
      console.log('home connect fail', e);
    });
    wx.showLoading({
      title: '连接' + device.name,
    });
  },

  _sort () {
    let devices = this.data.devices.sort((a ,b) => {
      return b.RSSI - a.RSSI;
    })
    this.setData({devices})
  },

  _about() {
    wx.navigateTo({
      url: '/pages/about/about',
    })
  },

  _bindinput(e) {
    this.setData({ filterName: e.detail.value});
  },

  _bindchanging(e) {
    this.setData({ filterRssi: e.detail.value });
  },

  _displayFilter() {
    if (this.data.showFilter) {
      let devices = this.data.devices.filter(v => {
        return v.RSSI >= this.data.filterRssi && (v.name && ~v.name.toLowerCase().indexOf(this.data.filterName.toLowerCase()))
      });
      this.setData({devices})
    }
    this.setData({showFilter: !this.data.showFilter});
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    this._stopScan();
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    this._stopScan();
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