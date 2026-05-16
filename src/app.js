import './styles/splash.css';
import './lib/splash.js'; // attaches window.PizzaHeroSplash
import { mount } from 'svelte';
import App from './App.svelte';

let app;

function boot() {
  app = mount(App, { target: document.getElementById('app') });
}

// Skip the splash on every reload during dev (and after the first time)
// so it doesn't get annoying. Set localStorage.ethanSkipSplash = '1' to bypass.
const skipSplash = (() => {
  try { return localStorage.getItem('ethanSkipSplash') === '1'; } catch (e) { return false; }
})();

if (skipSplash || !window.PizzaHeroSplash) {
  boot();
} else {
  window.PizzaHeroSplash.show({
    tagline: 'GAMING',
    onDismiss: boot,
  });
}

export default app;
