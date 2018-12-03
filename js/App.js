/*global document, window, alert, console, require, google, lightDreamStyle, locations, Place, ko*/
// the above line used for the remedy for jslint errors "‘someVariable’ was used before it was defined"
var map;
var markers = []; // Create a new blank array for all the listing markers.

function initMap() {
    // Constructor creates a new map - only center and zoom are required.
    'use strict';
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 29.9592427, lng: 31.2573508},
        zoom: 16,
        mapTypeControl: false
    });

    map.setOptions({styles: lightDreamStyle}); // use map style


    // add markers from data file
    var i;
    for (i = 0; i < locations.length; i += 1) {
        markers.push(new Place(locations[i]));
    }
}

// This is the PLACE DETAILS search - it's the most detailed so it's only
// executed when a marker is selected, indicating the user wants more
// details about that place.
function getPlacesDetails(marker, infowindow) {
    'use strict';
    var service = new google.maps.places.PlacesService(map);
    service.getDetails({
        placeId: marker.id
    }, function (place, status) {
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
                    {maxHeight: 100, maxWidth: 200}
                ) + '">';
            }
            innerHTML += '</div>';
            infowindow.setContent(innerHTML);
            infowindow.open(map, marker);
            // Make sure the marker property is cleared if the infowindow is closed.
            infowindow.addListener('closeclick', function () {
                infowindow.marker = null;
            });
        }
    });
}

// ViewModel function
function ViewModel() {
    'use strict';
    // initialize the Map
    initMap();
    // connect search input and list all locations using Knockout
    this.searchInput = ko.observable("");
    var self = this;
    this.locations = ko.computed(function () {
        var result = [];
        markers.forEach(function (marker) {
            if (marker.title.toLowerCase().includes(self.searchInput().toLowerCase())) {
                result.push(marker);
                marker.setVisible(true);
            } else {
                marker.setVisible(false);
            }
        });
        return result;
    }, this);
}

// Initialize the application
function initApp() {
    'use strict';
    ko.applyBindings(new ViewModel());
}

// create a Place
var Place = function (place) {
    'use strict';
    this.title = place.title;
    this.type = place.type;
    var point = new google.maps.LatLng(place.lat, place.lng),
        marker = new google.maps.Marker({
            position: point,
            title: place.title,
            map: map,
            id: place.place_id
        }),

    // Create a single infowindow to be used with the place details information
    // so that only one is open at once.
        placeInfoWindow = new google.maps.InfoWindow();

    // If a marker is clicked, do a place details search on it in the next function.
    marker.addListener('click', function () {
        if (placeInfoWindow.marker === this) {
            console.log("This infowindow already is on this marker!");
        } else {
            getPlacesDetails(this, placeInfoWindow);
        }
    });

    this.marker = marker;
    this.setVisible = function (visibile) {
        this.marker.setVisible(visibile);
    };

    //this.marker.addListener('click', createInfowindow);
    // trigger click event to show info window
    this.showInfo = function () {
        google.maps.event.trigger(this.marker, 'click');
    };
};
