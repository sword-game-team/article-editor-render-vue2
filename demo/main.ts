import Vue from 'vue'
import App from './App.vue'
import './demo.css'

Vue.config.productionTip = false

new Vue({
  render: (createElement) => createElement(App),
}).$mount('#app')
