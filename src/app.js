// ------------------------------------------------------------------------------
// ----- NY WSC TEMPLATE --------------------------------------------------------
// ------------------------------------------------------------------------------

// copyright:   2020 Martyn Smith - USGS NY WSC

// authors:  Martyn J. Smith - USGS NY WSC

// purpose:  Template for USGS NY WSC Web Maps

// updates:
// 07.08.2020 mjs - Created

//CSS imports
import 'bootstrap/dist/css/bootstrap.css';
import 'leaflet/dist/leaflet.css';
import './styles/main.css';

//JS imports
import 'bootstrap';
import 'leaflet';
import { basemapLayer } from 'esri-leaflet';
import '@fortawesome/fontawesome-free/js/fontawesome';
import '@fortawesome/fontawesome-free/js/solid';

//global variables here
var theMap, layer;

if (process.env.NODE_ENV !== 'production') {
  require('./index.html');
}

//instantiate map
$( document ).ready(function() {
	console.log('Application Information: ' + process.env.NODE_ENV + ' ' + 'version ' + VERSION);
	$('#appVersion').html('Application Information: ' + process.env.NODE_ENV + ' ' + 'version ' + VERSION);

	//create map
	theMap = L.map('mapDiv',{zoomControl: false, preferCanvas: true});

	//add zoom control with your options
	L.control.zoom({position:'topright'}).addTo(theMap);  
	L.control.scale().addTo(theMap);

	//basemap
	layer= L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
		attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
		maxZoom: 16
	}).addTo(theMap);

	//set initial view
	theMap.setView([MapY, MapX], MapZoom);
		
	
	/*  START EVENT HANDLERS */
	// Add minus icon for collapse element which is open by default
	$(".collapse.show").each(function(){
		console.log('in collapse show')
		$(this).prev(".card-header").find("svg").addClass("fa-minus").removeClass("fa-plus");
	});
	
	// Toggle plus minus icon on show hide of collapse element
	$(".collapse").on('show.bs.collapse', function(){
		$(this).prev(".card-header").find("svg").removeClass("fa-plus").addClass("fa-minus");
	}).on('hide.bs.collapse', function(){
		$(this).prev(".card-header").find("svg").removeClass("fa-minus").addClass("fa-plus");
	});


	$('.basemapBtn').click(function() {
		$('.basemapBtn').removeClass('slick-btn-selection');
		$(this).addClass('slick-btn-selection');
		var baseMap = this.id.replace('btn','');
		setBasemap(baseMap);
	});

	$('#mobile-main-menu').click(function() {
		$('body').toggleClass('isOpenMenu');
	});

	$('#aboutButton').click(function() {
		$('#aboutModal').modal('show');
	});	


	$('.app-title').html(appTitle);

	/*  END EVENT HANDLERS */
});

function setBasemap(baseMap) {

	switch (baseMap) {
		case 'Streets': baseMap = 'Streets'; break;
		case 'Satellite': baseMap = 'Imagery'; break;
		case 'Topo': baseMap = 'Topographic'; break;
		case 'Terrain': baseMap = 'Terrain'; break;
		case 'Gray': baseMap = 'Gray'; break;
		case 'NatGeo': baseMap = 'NationalGeographic'; break;
	}

	if (layer) 	theMap.removeLayer(layer);
	layer = basemapLayer(baseMap);
	theMap.addLayer(layer);
	if (layerLabels) theMap.removeLayer(layerLabels);
	if (baseMap === 'Gray' || baseMap === 'Imagery' || baseMap === 'Terrain') {
		layerLabels = basemapLayer(baseMap + 'Labels');
		theMap.addLayer(layerLabels);
	}
}