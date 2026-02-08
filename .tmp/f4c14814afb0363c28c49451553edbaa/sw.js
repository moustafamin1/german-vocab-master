import {clientsClaim as workbox_core_clientsClaim} from '/Users/moustafa/Documents/Anigravity/German hellper/node_modules/workbox-core/clientsClaim.mjs';
import {precacheAndRoute as workbox_precaching_precacheAndRoute} from '/Users/moustafa/Documents/Anigravity/German hellper/node_modules/workbox-precaching/precacheAndRoute.mjs';
import {cleanupOutdatedCaches as workbox_precaching_cleanupOutdatedCaches} from '/Users/moustafa/Documents/Anigravity/German hellper/node_modules/workbox-precaching/cleanupOutdatedCaches.mjs';
import {registerRoute as workbox_routing_registerRoute} from '/Users/moustafa/Documents/Anigravity/German hellper/node_modules/workbox-routing/registerRoute.mjs';
import {NavigationRoute as workbox_routing_NavigationRoute} from '/Users/moustafa/Documents/Anigravity/German hellper/node_modules/workbox-routing/NavigationRoute.mjs';
import {createHandlerBoundToURL as workbox_precaching_createHandlerBoundToURL} from '/Users/moustafa/Documents/Anigravity/German hellper/node_modules/workbox-precaching/createHandlerBoundToURL.mjs';/**
 * Welcome to your Workbox-powered service worker!
 *
 * You'll need to register this file in your web app.
 * See https://goo.gl/nhQhGp
 *
 * The rest of the code is auto-generated. Please don't update this file
 * directly; instead, make changes to your Workbox build configuration
 * and re-run your build process.
 * See https://goo.gl/2aRDsh
 */








self.skipWaiting();

workbox_core_clientsClaim();


/**
 * The precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
workbox_precaching_precacheAndRoute([
  {
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  },
  {
    "url": "index.html",
    "revision": "33861ea14cfda4dc140e267cebafadaa"
  },
  {
    "url": "assets/index-DXPURBhI.js",
    "revision": null
  },
  {
    "url": "assets/index-CmilOYjE.css",
    "revision": null
  },
  {
    "url": "pwa-192x192.png",
    "revision": "f65cdefe9a89f0c23b414331beb850a2"
  },
  {
    "url": "pwa-512x512.png",
    "revision": "f65cdefe9a89f0c23b414331beb850a2"
  },
  {
    "url": "manifest.webmanifest",
    "revision": "82e6e9aa1a6f4ac68280b7b2086ced2a"
  }
], {});
workbox_precaching_cleanupOutdatedCaches();
workbox_routing_registerRoute(new workbox_routing_NavigationRoute(workbox_precaching_createHandlerBoundToURL("index.html")));






