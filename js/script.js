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
	  center: {lat: 29.9593243, lng: 31.2598278},
	  zoom: 18,
	  mapTypeControl: false
	});
	// This autocomplete is for use in the search within time entry box.
	var timeAutocomplete = new google.maps.places.Autocomplete(
		document.getElementById('search-within-time-text'));
	// This autocomplete is for use in the geocoder entry box.
	var zoomAutocomplete = new google.maps.places.Autocomplete(
		document.getElementById('zoom-to-area-text'));
	// Bias the boundaries within the map for the zoom to area text.
	zoomAutocomplete.bindTo('bounds', map);
	// Create a searchbox in order to execute a places search
	var searchBox = new google.maps.places.SearchBox(
		document.getElementById('places-search'));
	// Bias the searchbox to within the bounds of the map.
	searchBox.setBounds(map.getBounds());
	// These are the real estate listings that will be shown to the user.
	// Normally we'd have these in a database instead.
	var locations = [
	  {title: 'Park Ave Penthouse', location: {lat: 40.7713024, lng: -73.9632393}},
	  {title: 'Chelsea Loft', location: {lat: 40.7444883, lng: -73.9949465}},
	  {title: 'Union Square Open Floor Plan', location: {lat: 40.7347062, lng: -73.9895759}},
	  {title: 'East Village Hip Studio', location: {lat: 40.7281777, lng: -73.984377}},
	  {title: 'TriBeCa Artsy Bachelor Pad', location: {lat: 40.7195264, lng: -74.0089934}},
	  {title: 'Chinatown Homey Space', location: {lat: 40.7180628, lng: -73.9961237}}
	];
	var largeInfowindow = new google.maps.InfoWindow();
	// Initialize the drawing manager.
	var drawingManager = new google.maps.drawing.DrawingManager({
	  drawingMode: google.maps.drawing.OverlayType.POLYGON,
	  drawingControl: true,
	  drawingControlOptions: {
		position: google.maps.ControlPosition.TOP_LEFT,
		drawingModes: [
		  google.maps.drawing.OverlayType.POLYGON
		]
	  }
	});
	// Style the markers a bit. This will be our listing marker icon.
	var defaultIcon = makeMarkerIcon('0091ff');
	// Create a "highlighted location" marker color for when the user
	// mouses over the marker.
	var highlightedIcon = makeMarkerIcon('FFFF24');
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
		icon: defaultIcon,
		id: i
	  });
	  // Push the marker to our array of markers.
	  markers.push(marker);
	  // Create an onclick event to open the large infowindow at each marker.
	  marker.addListener('click', function() {
		populateInfoWindow(this, largeInfowindow);
	  });
	  // Two event listeners - one for mouseover, one for mouseout,
	  // to change the colors back and forth.
	  marker.addListener('mouseover', function() {
		this.setIcon(highlightedIcon);
	  });
	  marker.addListener('mouseout', function() {
		this.setIcon(defaultIcon);
	  });
	}
	document.getElementById('zoom-to-area').addEventListener('click', function() {
	  zoomToArea();
	});
	document.getElementById('search-within-time').addEventListener('click', function() {
	  searchWithinTime();
	});
	// Listen for the event fired when the user selects a prediction from the
	// picklist and retrieve more details for that place.
	searchBox.addListener('places_changed', function() {
	  searchBoxPlaces(this);
	});
	// Listen for the event fired when the user selects a prediction and clicks
	// "go" more details for that place.
	document.getElementById('go-places').addEventListener('click', textSearchPlaces);

  }
  // This function populates the infowindow when the marker is clicked. We'll only allow
  // one infowindow which will open at the marker that is clicked, and populate based
  // on that markers position.
  function populateInfoWindow(marker, infowindow) {
	// Check to make sure the infowindow is not already opened on this marker.
	if (infowindow.marker != marker) {
	  // Clear the infowindow content to give the streetview time to load.
	  infowindow.setContent('');
	  infowindow.marker = marker;
	  // Make sure the marker property is cleared if the infowindow is closed.
	  infowindow.addListener('closeclick', function() {
		infowindow.marker = null;
	  });
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
  }
  // This function will loop through the markers array and display them all.
  ///function showListings() {
	var bounds = new google.maps.LatLngBounds();
	// Extend the boundaries of the map for each marker and display the marker
	for (var i = 0; i < markers.length; i++) {
	  markers[i].setMap(map);
	  bounds.extend(markers[i].position);
	}
	map.fitBounds(bounds);
  // This function takes the input value in the find nearby area text input
  // locates it, and then zooms into that area. This is so that the user can
  // show all listings, then decide to focus on one area of the map.
  function zoomToArea() {
	// Initialize the geocoder.
	var geocoder = new google.maps.Geocoder();
	// Get the address or place that the user entered.
	var address = document.getElementById('zoom-to-area-text').value;
	// Make sure the address isn't blank.
	if (address == '') {
	  window.alert('You must enter an area, or address.');
	} else {
	  // Geocode the address/area entered to get the center. Then, center the map
	  // on it and zoom in
	  geocoder.geocode(
		{ address: address,
		  componentRestrictions: {locality: 'New York'}
		}, function(results, status) {
		  if (status == google.maps.GeocoderStatus.OK) {
			map.setCenter(results[0].geometry.location);
			map.setZoom(15);
		  } else {
			window.alert('We could not find that location - try entering a more' +
				' specific place.');
		  }
		});
	  }
	}
  // This function fires when the user selects a searchbox picklist item.
  // It will do a nearby search using the selected query string or place.
  function searchBoxPlaces(searchBox) {
	hideMarkers(placeMarkers);
	var places = searchBox.getPlaces();
	if (places.length == 0) {
	  window.alert('We did not find any places matching that search!');
	} else {
	// For each place, get the icon, name and location.
	  createMarkersForPlaces(places);
	}
  }
  // This function firest when the user select "go" on the places search.
  // It will do a nearby search using the entered query string or place.
  function textSearchPlaces() {
	var bounds = map.getBounds();
	hideMarkers(placeMarkers);
	var placesService = new google.maps.places.PlacesService(map);
	placesService.textSearch({
	  query: document.getElementById('places-search').value,
	  bounds: bounds
	}, function(results, status) {
	  if (status === google.maps.places.PlacesServiceStatus.OK) {
		createMarkersForPlaces(results);
	  }
	});
  }
  // This function creates markers for each place found in either places search.
  function createMarkersForPlaces(places) {
	var bounds = new google.maps.LatLngBounds();
	for (var i = 0; i < places.length; i++) {
	  var place = places[i];
	  var icon = {
		url: place.icon,
		size: new google.maps.Size(35, 35),
		origin: new google.maps.Point(0, 0),
		anchor: new google.maps.Point(15, 34),
		scaledSize: new google.maps.Size(25, 25)
	  };
	  // Create a marker for each place.
	  var marker = new google.maps.Marker({
		map: map,
		icon: icon,
		title: place.name,
		position: place.geometry.location,
		id: place.place_id
	  });
	  // Create a single infowindow to be used with the place details information
	  // so that only one is open at once.
	  var placeInfoWindow = new google.maps.InfoWindow();
	  // If a marker is clicked, do a place details search on it in the next function.
	  marker.addListener('click', function() {
		if (placeInfoWindow.marker == this) {
		  console.log("This infowindow already is on this marker!");
		} else {
		  getPlacesDetails(this, placeInfoWindow);
		}
	  });
	  placeMarkers.push(marker);
	  if (place.geometry.viewport) {
		// Only geocodes have viewport.
		bounds.union(place.geometry.viewport);
	  } else {
		bounds.extend(place.geometry.location);
	  }
	}
	map.fitBounds(bounds);
  }
// This is the PLACE DETAILS search - it's the most detailed so it's only
// executed when a marker is selected, indicating the user wants more
// details about that place.
function getPlacesDetails(marker, infowindow) {
  var service = new google.maps.places.PlacesService(map);
  service.getDetails({
	placeId: marker.id
  }, function(place, status) {
	if (status === google.maps.places.PlacesServiceStatus.OK) {
	  // Set the marker property on this infowindow so it isn't created again.
	  infowindow.marker = marker;
	  var innerHTML = '<div>';
	  if (place.name) {
		innerHTML += '<strong>' + place.name + '</strong>';
	  }
	  if (place.formatted_address) {
		innerHTML += '<br>' + place.formatted_address;
	  }
	  if (place.formatted_phone_number) {
		innerHTML += '<br>' + place.formatted_phone_number;
	  }
	  if (place.opening_hours) {
		innerHTML += '<br><br><strong>Hours:</strong><br>' +
			place.opening_hours.weekday_text[0] + '<br>' +
			place.opening_hours.weekday_text[1] + '<br>' +
			place.opening_hours.weekday_text[2] + '<br>' +
			place.opening_hours.weekday_text[3] + '<br>' +
			place.opening_hours.weekday_text[4] + '<br>' +
			place.opening_hours.weekday_text[5] + '<br>' +
			place.opening_hours.weekday_text[6];
	  }
	  if (place.photos) {
		innerHTML += '<br><br><img src="' + place.photos[0].getUrl(
			{maxHeight: 100, maxWidth: 200}) + '">';
	  }
	  innerHTML += '</div>';
	  infowindow.setContent(innerHTML);
	  infowindow.open(map, marker);
	  // Make sure the marker property is cleared if the infowindow is closed.
	  infowindow.addListener('closeclick', function() {
		infowindow.marker = null;
	  });
	}
  });
}