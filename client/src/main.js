import Vue from 'vue'
import App from './App.vue'
import ApolloClient from 'apollo-boost'
import VueApollo from 'vue-apollo'

// Creating an instance of the Apollo Client and connecting it to the GraphQL API endpoint
const apolloClient = new ApolloClient({
  uri: 'http://localhost:4000/graphql'
})

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
  apolloProvider
}).$mount('#app')

// Using the VueApollo plugin to integrate Apollo with the Vue application
Vue.use(VueApollo)
// Creating an Apollo Provider to make the Apollo instance available to all components
const apolloProvider = new VueApollo({
  defaultClient: apolloClient
})