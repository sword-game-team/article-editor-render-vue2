import Vue from 'vue'
import App from './App.vue'
import ResourceQuestionDemo from './ResourceQuestionDemo.vue'
import './demo.css'

Vue.config.productionTip = false

new Vue({
  render: (createElement) => createElement(new URLSearchParams(window.location.search).get('demo') === 'resource-question' ? ResourceQuestionDemo : App),
}).$mount('#app')
