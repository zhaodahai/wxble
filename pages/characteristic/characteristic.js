// pages/characteristic/characteristic.js

import { BTManager, ConnectStatus } from '../../wx-ant-ble/index.js';

import _ from '../../utils/util.js';


Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 特征信息
    characteristic:{},
    // 是否连接
    connected: false,
    // 是否正在监听
    isListening: false,
    // scrollview 滚动到底部
    scrollTop: 0,
    // 输入框的内容
    inputValue: '',
    // 输入框聚焦
    inputFocus: false,
    // 该设备所有能监听的特征
    notifyUUIDs: [
      // {
      //   suuid:'0000FFFF-0000-0000-0000-090909090909',
      //   cuuid:'0000FFFF-0000-0000-0000-090909090909',
      //   isListening: false
      // }, {
      //   suuid: '0000FFFF-0000-0000-0000-090909090909',
      //   cuuid: '0000FFFF-0000-0000-0000-090909090909',
      //   isListening: false
      // }, {
      //   suuid: '0000FFFF-0000-0000-0000-090909090909',
      //   cuuid: '0000FFFF-0000-0000-0000-090909090909',
      //   isListening: false
      // }, {
      //   suuid: '0000FFFF-0000-0000-0000-090909090909',
      //   cuuid: '0000FFFF-0000-0000-0000-090909090909',
      //   isListening: false
      // }
    ],
    // 特征值
    cv:[
      // {
      //   time:'15:22:09',
      //   value: '5A0077766655555FFBB999'
      // }
    ],
    // 输入命令历史
    wv:[
      // {
      //   time: '15:22:09',
      //   value: 'FFFF'
      // }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    
    // console.log(options)
    options.cdata && this.parseOptions(options);

    this.initBluetooth();

    this.parseCmdStorage();
  },

  parseCmdStorage() {
    let thiz = this;
    wx.getStorage({
      key: 'cmds',
      success: function (res) {
        console.log('parseCmdStorage', res)
        let v = thiz.checkUUIDExist(res.data);
        console.log('v' , v)
        if (v) {
          thiz.setData({wv: v.wv});
        }
      },
    })
  },

  checkUUIDExist(data) {
    let { suuid, cuuid } = this.data.characteristic;
    for (let v of data) {
      if (v.suuid && v.cuuid && v.suuid === suuid && v.cuuid === cuuid) {
        return v;
      }
    }
    return null;
  },

  addCmdStorage(wv) {
    let thiz = this;
    let { suuid, cuuid } = this.data.characteristic;
    if (!suuid || !cuuid) return;
    wx.getStorage({
      key: 'cmds',
      success: function(res) {
        console.log('addCmdStorage', res)
        let data = res.data;
        let v = thiz.checkUUIDExist(data);
        if (v) {
          v.wv = wv;
        } else {
          data.push({
            suuid,
            cuuid,
            wv
          })
        }
        wx.setStorage({
          key: 'cmds',
          data,
        })
      },
    })
  },

  deleteCmdStorage(wv) {
    let thiz = this;
    let { suuid, cuuid } = this.data.characteristic;
    if (!suuid || !cuuid) return;
    wx.getStorage({
      key: 'cmds',
      success: function (res) {
        console.log('addCmdStorage', res)
        let data = res.data;
        let v = thiz.checkUUIDExist(data);
        if (v) {
          v.wv = wv;
        } 
        wx.setStorage({
          key: 'cmds',
          data,
        })
      },
    })
  },

  parseOptions(opt) {

    // this.setData({ connected: options.connected });
    let cdata = JSON.parse(opt.cdata);
    let notifyUUIDs = JSON.parse(opt.notifyUUIDs);
    let connected = opt.connected === 'true';

    let {suuid , cuuid , properties} = cdata;

    this.setData({ connected, notifyUUIDs, characteristic: { suuid, cuuid, properties }});

  },

  initBluetooth() {

    // 初始化蓝牙管理器
    this.bt = new BTManager();

    // 注册状态回调
    this.bt.registerDidUpdateConnectStatus(res => {
      // console.log('characteristic registerDidUpdateConnectStatus', res);
      if (res.connectStatus === ConnectStatus.disconnected) {
        this.setData({ connected: false });
        wx.showToast({
          title: res.message,
          icon: 'none'
        })
      }
    });

    this.bt.registerDidUpdateValueForCharacteristic(this.didUpdateValueForCharacteristic.bind(this));
  },

  didUpdateValueForCharacteristic(res) {
    console.log('characteristic registerDidUpdateValueForCharacteristic', res);
    
    let v = {
      time: _.formatTime(new Date()),
      value: res.value,
      type: 'r'
    }
    let cv = this.data.cv;
    cv.push(v);
    this.setData({cv ,scrollTop: cv.length*30})
    
  },

  _read() {
    let { suuid, cuuid } = this.data.characteristic;
    this.bt.read({suuid , cuuid})
    .then(res => {
      console.log('characteristic read', res);
    }).catch(e => {
      console.log('characteristic read', e);
    })
  },

  _listen(e , idx) {
    let index;
    if (e && e.currentTarget) {
      index = e.currentTarget.id
    } else {
      index = idx;
    }
    let { suuid, cuuid, isListening } = this.data.notifyUUIDs[index];
    this.bt.notify({
      suuid, cuuid, state: !isListening
    }).then(res => {
      console.log('characteristic notify', res);
      this.setData({ [`notifyUUIDs[${index}].isListening`]: !isListening });
    }).catch(e => {
      console.log('characteristic notify', e);
    })
  },

  _empty() {
    this.setData({cv:[]});
  },

  _send() {

    if(!this.data.inputValue)  return;

    function checkCmdInWv(cmd) {
      return this.data.wv.some(v => {
        return v.value === cmd;
      })
    }

    let v = {
      time: _.formatTime(new Date()),
      value: this.data.inputValue,
      type: 'w'
    };

    if (!checkCmdInWv.call(this,this.data.inputValue)) {
      this.data.wv.unshift(v)
      this.setData({wv:this.data.wv});
      this.addCmdStorage(this.data.wv);
    }

    let cv = this.data.cv;
    cv.push(v);
    this.setData({ cv, scrollTop: cv.length * 30 })

    let { suuid, cuuid } = this.data.characteristic;
    this.bt.write({
      suuid,
      cuuid,
      value: this.data.inputValue
    }).then(res => {
      console.log('characteristic write', res);
    }).catch(e => {
      console.log('characteristic write', e);
    })

  },

  _deleteInput() {
    this.setData({inputValue:''});
  },

  _selectCmd(e) {
    let index = e.currentTarget.id;
    this.setData({inputValue: this.data.wv[index].value})
  },

  _deleteCmd(e) {
    let index = e.currentTarget.id;
    this.data.wv.splice(index, 1);
    this.setData({ wv: this.data.wv });
    this.deleteCmdStorage(this.data.wv);
  },

  _bindinput(e) {
    console.log(e)
    // return e.detail.value.replace(/[^\w\/]/ig, '').toUpperCase();

    this.setData({ inputValue: e.detail.value.replace(/[^0-9a-fA-F]/ig, '').toUpperCase()});

  },

  _inputFocus(e) {
    this.setData({ inputFocus:true})
  },


  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    this.stopListen();
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    this.stopListen();
  },

  stopListen() {
    this.data.notifyUUIDs.forEach((v,i) => {
      if (v.isListening) {
        this._listen('',i);
      }
    })
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