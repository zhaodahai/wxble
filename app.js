//app.js

const ald = require('./utils/ald-stat.js')

App({

  onLaunch: function () {
    this.checkCmdsStorage();
  },

  checkCmdsStorage() {
    wx.getStorage({
      key: 'cmds',
      success: function(res) {

      },
      fail: function (res) {
        wx.setStorage({
          key: 'cmds',
          data: [],
        })
      },
    })
  },

  globalData: {
    userInfo: null
  }
})