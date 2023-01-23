import appConfig from "../appConfig.json";
import siteListJSON from "../SiteList.json"
import tripListJSON from "../TripList.json"

import 'leaflet/dist/leaflet.css';
import leaflet from 'leaflet';
import convex from '@turf/convex';
import 'jquery';
import 'usgs-search-api/dist/search_api.css';
import 'usgs-search-api';
import { basemapLayer } from 'esri-leaflet';

//global variables
var theMap;
var siteList = {};
var tripList = {};
var layer, hullLayer, selectLayer, siteSelectLayer, sitesLayer, tripLineLayer;
var submitObj;

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

	//console.log('Application Information: ' + process.env.NODE_ENV + ' ' + 'version ' + VERSION);
	//$('#appVersion').html('Application Information: ' + process.env.NODE_ENV + ' ' + 'version ' + VERSION);

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
	hullLayer = L.featureGroup().addTo(theMap);
	selectLayer = L.featureGroup().addTo(theMap);
    siteSelectLayer = L.featureGroup().addTo(theMap);
	sitesLayer = L.featureGroup().addTo(theMap);
    tripLineLayer = L.featureGroup().addTo(theMap);

    var officeIcon = L.divIcon({className: 'officeMarker'});
    var officeGeoJsonLayer = L.geoJson(appConfig.map["officeGeoJSON"], {
            pointToLayer: function (feature, latlng) {
                return L.marker(latlng, {icon: officeIcon});
            },       
            onEachFeature: function (feature, layer) {
                layer.bindPopup(feature.properties.names);
            }
        });
    theMap.addLayer(officeGeoJsonLayer);

    //send halo layer to back
    selectLayer.bringToBack()

    //draw initial sites
    drawSites();

    //basemap switcher
    const radios = document.querySelectorAll('input')
    for (const radio of radios) {
      radio.onclick = (e) => {
          setBasemap(e.target.value)
      }
    }

    // add search control with options
    theMap.addControl(
        L.control.search({
            // extended control options:
            position           : "topright",
            // search_api widget options:
            width              : 400,
            placeholder        : "Search for a place in NY",
            search_states      : "ny",
            menu_height        : 400,
            include_gnis_minor : true,
            include_area_code  : true,
            include_usgs_gw: true
            // ...all search_api widget options are supported...
        })
    );

    //EVENTS

    //open popup on site click
    sitesLayer.on('click', function(e) { 
        openPopup(e);
    });
    

    $('#centerSelect').on('change', function() {
        
		var selectedCenter = $('#centerSelect :selected').text();
		$('#tripSelect option[value!="default"]').remove();

        console.log("centerSelect", selectedCenter)
		selectCenter(selectedCenter);
	});

    $('#tripSelect').on('change', function() {
        var trips = [];
        $.each($("#tripSelect :selected"), function(){          
            var trip = {tripName: $(this).text(), tripOwner: $(this).val(), tripCenter: $('#centerSelect :selected').text()}  
            trips.push(trip);
        });

        //console.log("selected trips:", trips)

		selectTrip(trips);
	});

    $('#siteSelect').on('change', function() {

       console.log("siteSelect", this.value)

       drawSiteSelectHalo($('#siteSelect').val())
	});

    $( "#openSiteModal").on('click', function() {

        //clear existing table
        $('#siteTableBody').empty();

        //instantiate/clear submit object        
        submitObj = {
            possible_drivers: [],
            trips_involved: [],
            offices_involved: [],
            time_capacity: 8,
            sites: []
        };

        console.log('in open site modal', submitObj)

        var selectedSites = $('#siteSelect').val()

        $('#siteSelect > option:selected').each(function() {

            var siteObj = {
                siteID: $(this).val(), 
                rat_rating: String(Math.floor(Math.random() * 5)),   //random for now
                override_priority: (Math.floor(Math.random() * 51) / 10), //random for now
                trip_name: $(this).attr('trip-name'),
                office: $(this).attr('office'),
                trip_owner: $(this).attr('trip-owner')
            }

            submitObj.sites.push(siteObj)

            //add this person as a driver if we dont have it
            if (submitObj.possible_drivers.indexOf(siteObj.trip_owner) == -1) {
                submitObj.possible_drivers.push(siteObj.trip_owner)
            }

            //add this trip if we dont have it
            if (submitObj.trips_involved.indexOf(siteObj.trip_name) == -1) {
                submitObj.trips_involved.push(siteObj.trip_name)
            }

            //add this office if we dont have it
            if (submitObj.offices_involved.indexOf(siteObj.office) == -1) {
                submitObj.offices_involved.push(siteObj.office)
            }

            //only append a row if it doesn't exist
            if ($('#siteTableBody').text().indexOf(siteObj.siteID) == -1) {
                $('#siteTableBody').append('<tr class="siteRow"><th scope="row" class="site-id">' + siteObj.siteID + '</th><td scope="row" class="site-rating"><input class="usa-input usa-focus" id="input-focus" name="input-focus" value=' + siteObj.rat_rating + '></td><td scope="row" class="site-priority"><input class="usa-input usa-focus" id="input-focus" name="input-focus" value=' + siteObj.override_priority + '></td><td scope="row" class="site-trip">' + siteObj.trip_name + '</td><td scope="row" class="site-office">' + siteObj.office + '</td><td scope="row" class="site-owner">' + siteObj.trip_owner + '</td></tr>');
            }
    
        });

        console.log("DONE", submitObj.sites)

        //populate form
        $('#officeList').append(submitObj.offices_involved.join(', '))
        $('#tripList').append(submitObj.trips_involved.join(', '))
        $('#driverList').append(submitObj.possible_drivers.join(', '))

    });

    $( "#submitSites").on('click', function() {

        //start spinner
        $("#submitLoader").show();
        $("#submitSites").prop("disabled",true);

        //console.log("begin submitSites", submitObj);

        $('.siteRow .site-id').each(function(i, row) {
            //console.log("submitSites", row)

            submitObj.sites.forEach(function (site, index) {

                if (site.siteID == $(row).text()) {
                    var rating_val = $(row).parent().children('.site-rating').find('input').val();
                    var override_val = $(row).parent().children('.site-priority').find('input').val();
                    //console.log('overrides:',  rating_val, override_val);

                    //update the values if they have changed or not
                    site.rat_rating = rating_val;
                    site.override_priority = override_val;
                }
            });
        });

        //console.log("end submitSites", submitObj);

        fetch(appConfig.map["m5APIurl"], {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submitObj)
            })
            .then(response => response.json())
            .then(data => {
                console.log("in post response", data);

                //close modal
                $("#closeSubmitModal").trigger("click");

                //hide loading spinner
                $("#submitLoader").hide();
                $("#submitSites").prop("disabled",false);

                //display the result
                loadRoutes(data)
            }); 
    });
}

function loadRoutes(data) {

    //first clear other maplayers
    hullLayer.clearLayers();
    selectLayer.clearLayers();
    siteSelectLayer.clearLayers();

    //clear dropdown selections
    $("#centerSelect").val([]);
    $("#tripSelect").val([]);
    $("#siteSelect").val([]);

    //hide dropdowns
    $("#tripSelect").hide();
    $("#siteSelect").hide();

    //show result route, symbolize and add to legend

    if (data.features.length > 0) {
        $('#legend').show();

        data.features.forEach(function (feature, index) {
            //console.log("in loadroutes feature loop:", feature);
    
            //loop over site list to get site latlon
            $.each(siteList, function( index, site ) {
                if (site.properties.siteID === feature.properties.sites) {
    
                    var mapIcon = L.divIcon({className: 'routeStop', html: '<div id="stop' + feature.properties.stop + '" class="route' + feature.properties.route + '" >' + feature.properties.stop + '</div>'});
                    var marker = L.marker(site.getLatLng(), {icon: mapIcon});
                    
   
                    marker.bindPopup('<pre>'+JSON.stringify(feature.properties,null,' ').replace(/[\{\}"]/g,'')+'</pre>');
                    theMap.addLayer(marker);

                    //change marker color to match route

                    //CHANGE TO LOOP
                    $('.route' + feature.properties.route).each(function(){
                        $(this).parent().addClass('change' + feature.properties.route);
                    });

                    //$('#route' + feature.properties.route).parent().addClass('change' + feature.properties.route);

                    //add line item to legend
                    var routeIdx = (parseInt(feature.properties.route) - 1)
                    $('#legendTable').append('<tr class="legendLine" ' + feature.properties.route + '" ><td><hr size="8" width="90%" color="'+ appConfig.map["routeColors"][routeIdx] + '"></td><td>' + feature.properties.driver + ' Stop ' + feature.properties.stop + '</td></tr>')
                
                }
            });

            //add linestrings
            var lineLayer = L.geoJSON(feature, {
                onEachFeature: function (feature, layer) {  

                    //get zero based index
                    var routeIdx = (parseInt(layer.feature.properties.route) - 1)

                    layer.setStyle({color : appConfig.map.routeColors[routeIdx ]}) 
                    layer.bindPopup('<pre>'+JSON.stringify(feature.properties,null,' ').replace(/[\{\}"]/g,'')+'</pre>');
                }
            })

            tripLineLayer.addLayer(lineLayer);
        });




    }



}

function openPopup(e) {	
	//console.log('OPENING POPUP...',e);

	//bind and open popup with dynamic content
	e.layer.bindPopup(e.layer.properties.popupContent, {minWidth: 300}).openPopup();
}

function selectCenter(selectedCenter) {

	selectLayer.clearLayers();
	hullLayer.clearLayers();

	//draw halo for selected center sites
	sitesLayer.eachLayer(function (layer) {

		if (layer.properties.office === selectedCenter) {
			//console.log('found a matching site', layer.properties);
			drawSelectHalo(layer.properties.siteID);
		}
	});

	//get convex hull and zoom to
	if (selectLayer.getLayers().length <= 2) theMap.flyToBounds(selectLayer.getBounds());
	else getConvexHull(selectedCenter);

	//populate trip select
	$('#tripSelect').show();
	$.each(tripList, function( index, center ) {
		if (center.WSC.OfficeName.indexOf(selectedCenter) !== -1) {
			//append trips to select
			$.each(center.WSC.Trip, function( index, trip ) {
				$('#tripSelect').append($('<option></option>').attr('value',trip.TripOwner).text(trip.TripName));
			});
		}
	});
}

function selectTrip(tripData) {

    //clear selected site selections
    $("#siteSelect").empty()

    //show the site select dropdown
    $('#siteSelect').show();

	//clear old trip selection
    siteSelectLayer.clearLayers();
	selectLayer.clearLayers();
	hullLayer.clearLayers();

    //add all sites from selected trips to selectLayer

    console.log("selectTrip", tripData)

    var sitesInTrips = [];
    var select_sites = [];

    $.each(tripData, function( index, selectedTrip) {
        console.log(selectedTrip)

        $.each(tripList, function( index, center ) {
            
            if (center.WSC.OfficeName.indexOf(selectedTrip.tripCenter) !== -1) {

                    $.each(center.WSC.Trip, function( index, trip ) {
                        console.log("trip", trip)
                        //if we found the selected trip loop over its sites
                        if (trip.TripName == selectedTrip.tripName) {
                        	$.each(trip.Sites, function( index, site) {

                                sitesInTrips.push(site)
                        		drawSelectHalo(site);
                                //console.log("site", site)

                                

                                //add to siteSelect if its not already there
                                if($("#siteSelect option:contains('" + site + "')").length ==0) {

                                    //build new option
                                    var newOption = $('<option></option>').attr('value',site).attr('trip-name', trip.TripName).attr('trip-owner',trip.TripOwner).attr('trip-id', trip.TripID).attr('office',center.WSC.OfficeName).text(site);
    
                                    //if its in our sample list select it
                                    if (appConfig.map.sampleSiteList.indexOf(site) !== -1) {
                                        newOption.attr('selected','selected');

                                        
                                        select_sites.push(site)
                                    }


                                    //add it
                                    $('#siteSelect').append(newOption);
                                
                                }


                        	});
                        }
                    });
                }
            });
    });

    
    drawSiteSelectHalo(select_sites)



	//get convex hull and zoom to
	if (selectLayer.getLayers().length <= 2) theMap.flyToBounds(selectLayer.getBounds());
	else getConvexHull(tripData.tripName);

    console.log("sites in selected trips:", sitesInTrips)
    console.log("sites subset:", appConfig.map.sampleSiteList)
}

function drawSelectHalo(siteID) {

	$.each(siteList, function( index, site ) {
		if (site.properties.siteID === siteID) {
			var haloMarker = L.circleMarker(site.getLatLng(), {color: 'yellow', weight: 0, fillOpacity: 0.5, radius: 5, pane:'shadowPane'});
			selectLayer.addLayer(haloMarker);
		}
	});
}

function drawSiteSelectHalo(sites) {

    //console.log('in drawSiteSelecthalo', sites)
    siteSelectLayer.clearLayers();

    $.each(sites, function( index, site_to_select ) {
        $.each(siteList, function( index, site ) {
            if (site.properties.siteID === site_to_select) {

                //add halo if its not already there
                var haloMarker = L.circleMarker(site.getLatLng(), {color: 'red', weight: 0, fillOpacity: 0.5, radius: 8, pane:'shadowPane'});
                siteSelectLayer.addLayer(haloMarker);
            }
        });
    });


}

function getConvexHull(text) {
	//create convex hull
	var hull = convex(selectLayer.toGeoJSON());

	//console.log('sites selection geojson:', JSON.stringify(selectLayer.toGeoJSON()))

	//console.log('hull geojson:', JSON.stringify(hull))
	// var hullGeoJSONlayer = L.geoJSON(hull)
	var hullGeoJSONlayer = L.geoJSON(hull).bindPopup(text, {minWidth: 200});
	hullLayer.addLayer(hullGeoJSONlayer);

	//zoom map
	theMap.flyToBounds(hullLayer.getBounds());
}

function drawSites() {
    
	//console.log('In drawSites()');


	//create request URL and get sites
    // fetch(appConfig.map["siteListJSON"])
    //     .then(response => response.json())
    //     .then(data => {

            siteListJSON.SitesCollection.forEach(function (site, index) {
                //console.log("SITE",site)
                //give all sites the default background marker
                siteList[site.SiteID] = L.circleMarker([site.Attributes.latDD, site.Attributes.lonDD], {color: 'gray', weight: 0, fillOpacity: 0.8, radius: 2});
    
                //overload the properties into the leaflet marker for that site
                siteList[site.SiteID].properties = {};
                siteList[site.SiteID].properties.siteID = site.SiteID;
                siteList[site.SiteID].properties.siteName = site.Attributes.station_nm;
                siteList[site.SiteID].properties.siteType = site.Attributes.site_type;
                siteList[site.SiteID].properties.nws_id = site.Attributes.nws_id;
                siteList[site.SiteID].properties.office= site.Attributes.Office;
    
                //Need to still write some popup data that will even apply if site isn't in a trip or out of site
                siteList[site.SiteID].properties.popupContent = '<b>' + site.SiteID + '</b></br></br>' + site.Attributes.station_nm + '</br><a href="https://waterdata.usgs.gov/nwis/inventory/?site_no=' + site.SiteID + '" target="_blank">Access Data</a></br><div id="graphContainer" style="width:100%; height:200px;display:none;"></div><div class="container" style="width:100%;"><div class="row"><div class="col-md-4 graphLoader" id="nwisGraphLoader"><p><i class="fa fa-circle-o-notch fa-spin fa-3x fa-fw graph-loader"></i>Loading NWIS...</p></div><div class="col-md-4 graphLoader" id="ahpsGraphLoader"><p><i class="fa fa-circle-o-notch fa-spin fa-3x fa-fw graph-loader"></i>Loading AHPS...</p></div><div class="col-md-4 graphLoader" id="nwmGraphLoader"><p><i class="fa fa-circle-o-notch fa-spin fa-3x fa-fw graph-loader"></i>Loading NWM..</p></div></div></div>';
    
                siteList[site.SiteID].properties.defaultPopupContent = siteList[site.SiteID].properties.popupContent;
    
                //add to layergroup
                sitesLayer.addLayer(siteList[site.SiteID]);
    
                //check if we have this office yet in drop down, if not add it
                if($("#centerSelect option:contains('" + site.Attributes.Office + "')").length ==0) {
    
                    $('#centerSelect').append($('<option></option>').attr('value',site.Attributes.Office).text(site.Attributes.Office));
                }
                
    
            });
    
            loadTrips();

        //});
}

function loadTrips() {
	//$.getJSON(tripListJSON, function(data) {
		tripList = tripListJSON.TripsCollection;
        
		tripList.forEach(function (WSC, index) {
            
            for (var tripID in WSC.WSC.Trip) {
                var trip = WSC.WSC.Trip[tripID]
                //console.log("trip", trip)
                trip.Sites.forEach(function (site, index) {
                    //console.log("site", site)
                    //check if site exists in master siteList
                    if (siteList[site]) {
                        //add trip data to the site object
                        siteList[site].properties.tripName = trip.TripName;
                        siteList[site].properties.tripOwner = trip.TripOwner;
                        
                        //full popup with graphs
                        //siteList[site].properties.popupContent = '<b>' + site + '</b></br></br>' + siteList[site].properties.siteName+ '</br><a href="https://waterdata.usgs.gov/nwis/inventory/?site_no=' + site + '" target="_blank">Access Data</a></br></br><b>Office: </b>' + WSC.OfficeName + '</br><b>Trip Name: </b>' + siteList[site].properties.tripName + '</br><b>Trip Owner: </b>' + siteList[site].properties.tripOwner + '<div id="graphContainer" style="width:100%; height:200px;display:none;"></div><div class="container" style="width:100%;"><div class="row"><div class="col-md-4 graphLoader" id="nwisGraphLoader"><p><i class="fa fa-cog fa-spin fa-3x fa-fw graph-loader"></i>Loading NWIS...</p></div><div class="col-md-4 graphLoader" id="ahpsGraphLoader"><p><i class="fa fa-cog fa-spin fa-3x fa-fw graph-loader"></i>Loading AHPS...</p></div><div class="col-md-4 graphLoader" id="nwmGraphLoader"><p><i class="fa fa-cog fa-spin fa-3x fa-fw graph-loader"></i>Loading NWM..</p></div></div></div>';

                        //popup no graph
                        siteList[site].properties.popupContent = '<b>' + site + '</b></br></br>' + siteList[site].properties.siteName+ '</br><a href="https://waterdata.usgs.gov/nwis/inventory/?site_no=' + site + '" target="_blank">Access Data</a></br></br><b>Office: </b>' + siteList[site].properties.office + '</br><b>Trip Name: </b>' + siteList[site].properties.tripName + '</br><b>Trip Owner: </b>' + siteList[site].properties.tripOwner;

                        siteList[site].properties.defaultPopupContent = siteList[site].properties.popupContent;
                    }
                    else {
                        console.log('This site does not exist in the master SiteList.json: ', site);
                    }
                });
            }

		});
	//});
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