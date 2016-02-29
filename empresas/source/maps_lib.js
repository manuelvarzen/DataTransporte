/*!
 * Searchable Map Template with Google Fusion Tables
 * http://derekeder.com/searchable_map_template/
 *
 * Copyright 2012, Derek Eder
 * Licensed under the MIT license.
 * https://github.com/derekeder/FusionTable-Map-Template/wiki/License
 *
 * Date: 12/10/2012
 * 
 *script del archivo index_sanciones.html
 */
 
var MapsLib = MapsLib || {};
var MapsLib = {
  
  //Setup section - put your Fusion Table details here
  //Using the v1 Fusion Tables API. See https://developers.google.com/fusiontables/docs/v1/migration_guide for more info
  
  //the encrypted Table ID of your Fusion Table (found under File => About)
  //NOTE: numeric IDs will be depricated soon
  fusionTableId:      "1ZEu0F_NDkW5YmztS9ib5P9IRvbb4_Vhxr1aZf38", //Directorio_sanciones_rev8 
  
  //*New Fusion Tables Requirement* API key. found at https://code.google.com/apis/console/   
  //*Important* this key is for demonstration purposes. please register your own.   

  googleApiKey:       "AIzaSyAhHF1z0DW7_tv5aRCsA5F92C1jfFMSB38", //On Google Developer Console TransporData 

  //name of the location column in your Fusion Table. 
  //NOTE: if your location column name has spaces in it, surround it with single quotes 
  //example: locationColumn:     "'my location'",
  locationColumn:     "LATITUD",  

  map_centroid:       new google.maps.LatLng(-12.033154691277574, -77.0154218422249), //center that your map defaults to
  locationScope:      "lima",      //geographical area appended to all address searches
  recordName:         "result",       //for showing number of results
  recordNamePlural:   "results", 
  
  searchRadius:       500,            //in meters ~ 500 
  defaultZoom:        11,             //zoom level when map is loaded (bigger is more zoomed in)
  addrMarkerImage: 'http://maps.gstatic.com/mapfiles/arrow.png',
  currentPinpoint: null,
  
  initialize: function() {
    $( "#result_count" ).html(""); 
  
    geocoder = new google.maps.Geocoder();
    var myOptions = {
      zoom: MapsLib.defaultZoom,
      center: MapsLib.map_centroid,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map($("#map_canvas")[0],myOptions);
    
    MapsLib.searchrecords = null;
    
    //reset filters
    $("#search_address").val(MapsLib.convertToPlainString($.address.parameter('address')));
    var loadRadius = MapsLib.convertToPlainString($.address.parameter('radius'));
    if (loadRadius != "") $("#search_radius").val(loadRadius);
    else $("#search_radius").val(MapsLib.searchRadius);
    $(":checkbox").attr("checked", "checked");
    $("#result_count").hide();
     
    //run the default search
    MapsLib.doSearch();
  },
  
  doSearch: function(location) {
    MapsLib.clearSearch();
    var address = $("#search_address").val();
    MapsLib.searchRadius = $("#search_radius").val();

    var whereClause = MapsLib.locationColumn + " not equal to ''";
    
//-----custom filters-------
var type_column = "TYPE_NOMBRE_INFRACCION";
var searchType = type_column + " IN (-1,";
if ( $("#cbType1").is(':checked')) searchType += "1,";
if ( $("#cbType2").is(':checked')) searchType += "2,";
if ( $("#cbType3").is(':checked')) searchType += "3,";
whereClause += " AND " + searchType.slice(0, searchType.length - 1) + ")";
//-------end of custom filters--------
var type_column = "TYPE_CLASE_INFRACCION";
if ( $("#rbType1").is(':checked')) whereClause += " AND " + type_column + "=5";
if ( $("#rbType2").is(':checked')) whereClause += " AND " + type_column + "=6";
if ( $("#rbType3").is(':checked')) whereClause += " AND " + type_column + "=7";
    //-------end of custom filters--------
    
    if (address != "") {
      if (address.toLowerCase().indexOf(MapsLib.locationScope) == -1)
        address = address + " " + MapsLib.locationScope;
  
      geocoder.geocode( { 'address': address}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          MapsLib.currentPinpoint = results[0].geometry.location;
          
          $.address.parameter('address', encodeURIComponent(address));
          $.address.parameter('radius', encodeURIComponent(MapsLib.searchRadius));
          map.setCenter(MapsLib.currentPinpoint);
          map.setZoom(14);
          
          MapsLib.addrMarker = new google.maps.Marker({
            position: MapsLib.currentPinpoint, 
            map: map, 
            icon: MapsLib.addrMarkerImage,
            animation: google.maps.Animation.DROP,
            title:address
          });
          
          whereClause += " AND ST_INTERSECTS(" + MapsLib.locationColumn + ", CIRCLE(LATLNG" + MapsLib.currentPinpoint.toString() + "," + MapsLib.searchRadius + "))";
          
          MapsLib.drawSearchRadiusCircle(MapsLib.currentPinpoint);
          MapsLib.submitSearch(whereClause, map, MapsLib.currentPinpoint);
        } 
        else {
          alert("We could not find your address: " + status);
        }
      });
    }
    else { //search without geocoding callback
      MapsLib.submitSearch(whereClause, map);
    }
  },
  
  submitSearch: function(whereClause, map, location) {
    //get using all filters
    //NOTE: styleId and templateId are recently added attributes to load custom marker styles and info windows
    //you can find your Ids inside the link generated by the 'Publish' option in Fusion Tables
    //for more details, see https://developers.google.com/fusiontables/docs/v1/using#WorkingStyles 

/////////////////////////////////////////////////////////////////
Layer1 = new google.maps.FusionTablesLayer({
query: {
select: "GEOMETRY",
from: "1lnECV1dbhKyHp7flSIVZB7kLqXbSqDv4E6UX-_U" //capa_pob_LimaMetrop
},
map: map,
styleId: 3,
templateId: 5
});
//////////////////////////////////////////////////////////////////
    MapsLib.searchrecords = new google.maps.FusionTablesLayer({
      query: {
        from:   MapsLib.fusionTableId,
        select: MapsLib.locationColumn,
        where:  whereClause
      },
      styleId: 3,
      templateId: 5
    });
    MapsLib.searchrecords.setMap(map);
    MapsLib.getCount(whereClause);
 //   MapsLib.getList(whereClause);
  },
  
  clearSearch: function() {
    if (MapsLib.searchrecords != null)
      MapsLib.searchrecords.setMap(null);
    if (MapsLib.addrMarker != null)
      MapsLib.addrMarker.setMap(null);  
    if (MapsLib.searchRadiusCircle != null)
      MapsLib.searchRadiusCircle.setMap(null);
  },
  
  findMe: function() {
    // Try W3C Geolocation (Preferred)
    var foundLocation;
    
    if(navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        foundLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
        MapsLib.addrFromLatLng(foundLocation);
      }, null);
    }
    else {
      alert("Sorry, we could not find your location.");
    }
  },
  
  addrFromLatLng: function(latLngPoint) {
    geocoder.geocode({'latLng': latLngPoint}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        if (results[1]) {
          $('#search_address').val(results[1].formatted_address);
          $('.hint').focus();
          MapsLib.doSearch();
        }
      } else {
        alert("Geocoder failed due to: " + status);
      }
    });
  },
  
  drawSearchRadiusCircle: function(point) {
      var circleOptions = {
        strokeColor: "#4b58a6",
        strokeOpacity: 0.3,
        strokeWeight: 1,
        fillColor: "#4b58a6",
        fillOpacity: 0.05,
        map: map,
        center: point,
        clickable: false,
        zIndex: -1,
        radius: parseInt(MapsLib.searchRadius)
      };
      MapsLib.searchRadiusCircle = new google.maps.Circle(circleOptions);
  },
  
  query: function(selectColumns, whereClause, callback) {
    var queryStr = [];
    queryStr.push("SELECT " + selectColumns);
    queryStr.push(" FROM " + MapsLib.fusionTableId);
    queryStr.push(" WHERE " + whereClause);
  
    var sql = encodeURIComponent(queryStr.join(" "));
    $.ajax({url: "https://www.googleapis.com/fusiontables/v1/query?sql="+sql+"&callback="+callback+"&key="+MapsLib.googleApiKey, dataType: "jsonp"});
  },

  handleError: function(json) {
    if (json["error"] != undefined) {
      var error = json["error"]["errors"]
      console.log("Error in Fusion Table call!");
      for (var row in error) {
        console.log(" Domain: " + error[row]["domain"]);
        console.log(" Reason: " + error[row]["reason"]);
        console.log(" Message: " + error[row]["message"]);
      }
    }
  },
  
  getCount: function(whereClause) {
    var selectColumns = "Count()";
    MapsLib.query(selectColumns, whereClause,"MapsLib.displaySearchCount");
  },
// Agregamos lo siguiente desde code.google.com/p/oregon-epht/source
displayCount: function(whereClause) {
    var selectColums = "Count()";
    Mapslib.query(selectColumns, whereClause, "MapsLib.displaySearchCount");
},
//Fin de lo que agregamos... 
  displaySearchCount: function(json) { 
    MapsLib.handleError(json);
    var numRows = 0;
    if (json["rows"] != null)
      numRows = json["rows"][0];
    
    var name = MapsLib.recordNamePlural;
    if (numRows == 1)
    name = MapsLib.recordName;
    $( "#result_count" ).fadeOut(function() {
        $( "#result_count" ).html(MapsLib.addCommas(numRows) + " " + name + " found");
      });
    $( "#result_count" ).fadeIn();
  },

/* getList: function(whereClause) {
  var selectColumns = "PLACA, FECHA_INFRACCION, NOMBRE_CLASE_INFRACCION, APELLIDOS_INFRACTOR ";
  MapsLib.query(selectColumns, whereClause, "MapsLib.displayList");
},
displayList: function(json) {
  MapsLib.handleError(json);
  var data = json["rows"];
  var template = "";
  var results = $("#results_list");
  results.hide().empty(); //hide the existing list and empty it out first
  if (data == null) {
    //clear results list
    results.append("<li><span class='lead'>No results found</span></li>");
  }
  else {
    for (var row in data) {
      template = "\
        <div class='row-fluid item-list'>\
          <div class='span12'>\
            <strong>" + data[row][0] + "</strong>\
            <br />\
            " + data[row][1] + "\
            <br />\
            " + data[row][2] + "\
            <br />\
            " + data[row][3] + "\
          </div>\
        </div>"
      results.append(template);
    }
  }
  results.fadeIn();
}, */
  addCommas: function(nStr) {
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
      x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
  },
  
  //converts a slug or query string in to readable text
  convertToPlainString: function(text) {
    if (text == undefined) return '';
  	return decodeURIComponent(text);
  }
}
