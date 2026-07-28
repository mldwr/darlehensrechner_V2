import { mount } from 'svelte'
import '@digicreon/mucss/dist/mu.css'
import App from './App.svelte'

const app = mount(App, {
  target: document.getElementById('app'),
})

export default app
