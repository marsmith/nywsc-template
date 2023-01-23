import appConfig from "../appConfig.json";

import 'leaflet/dist/leaflet.css';
import 'jquery';
import { basemapLayer } from 'esri-leaflet';

//global variables
var theMap;
var layer;

//instantiate map
document.addEventListener('DOMContentLoaded', pageLoad, false);

function pageLoad() {
    //click listener for mobile menu
    document.getElementById("mobile-main-menu").addEventListener("click", showMenu);

    //add app title from config
    var element = document.getElementsByClassName("app-title");  // Find the elements
    for(var i = 0; i < element.length; i++){
        element[i].innerText= appConfig.app["title"];    // Change the content
    }

    //add about text
    var element = document.getElementById("about-text");  // Find the elements
    element.innerText = appConfig.app["about-text"]

    //print config
    console.log('appConfig: ', appConfig)

    //load map
    loadMap()
}

function showMenu() {
    console.log('in show menu')
    var body = document.body;
    body.classList.toggle("isOpenMenu");
}

function loadMap () {

	//create map
	theMap = L.map('mapDiv',{
        center : new L.LatLng(appConfig.map.MapY,appConfig.map.MapX),
        zoom: appConfig.map.MapZoom
    });
    
	//basemap
	layer= L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
		attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
		maxZoom: 16
	}).addTo(theMap);

	//define layers

    //call initial function


    //basemap switcher
    const radios = document.querySelectorAll('input')
    for (const radio of radios) {
      radio.onclick = (e) => {
          setBasemap(e.target.value)
      }
    }
    //EVENTS
}

function setBasemap(baseMap) {

	switch (baseMap) {
		case 'Streets': baseMap = 'Streets'; break;
		case 'Topo': baseMap = 'Topographic'; break;
		case 'Satellite': baseMap = 'Satellite'; break;
		case 'Gray': baseMap = 'Gray'; break;
		case 'NatGeo': baseMap = 'NationalGeographic'; break;
	}

	if (layer) 	theMap.removeLayer(layer);
	layer = basemapLayer(baseMap);
	theMap.addLayer(layer);
}