  var map;
  // Create a new blank array for all the listing markers.
  var markers = [];
  // This global polygon variable is to ensure only ONE polygon is rendered.
  var polygon = null;
  // Create placemarkers array to use in multiple functions to have control
  // over the number of places that show.
  var placeMarkers = [];

  
  function initMap() {
	// Constructor creates a new map - only center and zoom are required.
	map = new google.maps.Map(document.getElementById('map'), {
	  center: {lat: 27.994805, lng: -82.7344864},
	  zoom: 18,
	  mapTypeControl: false
	});
	
	
	var largeInfowindow = new google.maps.InfoWindow();

	
	   // The following group uses the location array to create an array of markers on initialize.
	for (var i = 0; i < locations.length; i++) {
	  // Get the position from the location array.
	  var position = locations[i].location;
	  var title = locations[i].title;
	  // Create a marker per location, and put into markers array.
	  var marker = new google.maps.Marker({
		position: position,
		title: title,
		animation: google.maps.Animation.DROP,
		id: i
	  });
	  // Push the marker to our array of markers.
	  markers.push(marker);
	  // Create an onclick event to open an infowindow at each marker.
	  marker.addListener('click', function() {
		populateInfoWindow(this, largeInfowindow);
	  });
	  
	}
	showListings()
  }
	  
	  
  // This function populates the infowindow when the marker is clicked. We'll only allow
  // one infowindow which will open at the marker that is clicked, and populate based
  // on that markers position.
  function populateInfoWindow(marker, infowindow) {
	// Check to make sure the infowindow is not already opened on this marker.
	if (infowindow.marker != marker) {
	  infowindow.marker = marker;
	  infowindow.setContent('<div>' + marker.title + '</div>');
	  infowindow.open(map, marker);
	  // Make sure the marker property is cleared if the infowindow is closed.
	  infowindow.addListener('closeclick',function(){
		infowindow.setMarker = null;
	  });
	}
  	var streetViewService = new google.maps.StreetViewService();
	var radius = 50;

  // In case the status is OK, which means the pano was found, compute the
  // position of the streetview image, then calculate the heading, then get a
  // panorama from that and set the options
  function getStreetView(data, status) {
	if (status == google.maps.StreetViewStatus.OK) {
	  var nearStreetViewLocation = data.location.latLng;
	  var heading = google.maps.geometry.spherical.computeHeading(
		nearStreetViewLocation, marker.position);
		infowindow.setContent('<div>' + marker.title + '</div><div id="pano"></div>');
		var panoramaOptions = {
		  position: nearStreetViewLocation,
		  pov: {
			heading: heading,
			pitch: 30
		  }
		};
	  var panorama = new google.maps.StreetViewPanorama(
		document.getElementById('pano'), panoramaOptions);
	} else {
	  infowindow.setContent('<div>' + marker.title + '</div>' +
		'<div>No Street View Found</div>');
	}
  }
  // Use streetview service to get the closest streetview image within
  // 50 meters of the markers position
  streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
  // Open the infowindow on the correct marker.
  infowindow.open(map, marker);
  }
  
	// This function will loop through the markers array and display them all.
  function showListings() {
	var bounds = new google.maps.LatLngBounds();
	// Extend the boundaries of the map for each marker and display the marker
	for (var i = 0; i < markers.length; i++) {
	  markers[i].setMap(map);
	  bounds.extend(markers[i].position);
	}
	map.fitBounds(bounds);
  }

	
  // This function will loop through the listings and hide them all.
  function hideListings() {
	for (var i = 0; i < markers.length; i++) {
	  markers[i].setMap(null);
	}
  }
 