var map, toc, darmcLayer, identifyTask,identifyParams,identifyListener;
			
            
require(["dojo/parser","dojo/_base/connect","dojo/dom", "dijit/registry", "dojo/on","esri/map","esri/toolbars/navigation","esri/layers/ArcGISTiledMapServiceLayer", 
	"esri/layers/ArcGISDynamicMapServiceLayer","agsjs/dijit/TOC","esri/dijit/BasemapGallery","esri/dijit/Basemap", "esri/dijit/BasemapLayer","dijit/layout/BorderContainer","dijit/layout/ContentPane",
	"dijit/layout/AccordionContainer","dijit/layout/TabContainer","esri/dijit/Popup", "dijit/Toolbar","dijit/form/Button", "dijit/Menu", "dojo/domReady!"], 

	function(parser, connect, dom, registry, on, Map, Navigation, ArcGISTiledMapServiceLayer, ArcGISDynamicMapServiceLayer,TOC, BasemapGallery, Basemap, BasemapLayer, BorderContainer,
		ContentPane, AccordionContainer,TabContainer,Popup, Toolbar){
            
	// call the parser to create the dijit layout dijits
	parser.parse(); // note djConfig.parseOnLoad = false;

	var navToolbar;
	var popup = new Popup({},dojo.create("div"))
				
	map = new Map("map", {	
		center: [12, 46],
		infoWindow:popup,
		zoom: 5,
		sliderPosition: "top-right"
	});

	navToolbar = new Navigation(map);
    
    registry.byId("zoomin").on("click", function () {navToolbar.activate(Navigation.ZOOM_IN);});
    registry.byId("zoomout").on("click", function () {navToolbar.activate(Navigation.ZOOM_OUT);});
    registry.byId("zoomfullext").on("click", function () {navToolbar.zoomToFullExtent();});
    registry.byId("zoomprev").on("click", function () {navToolbar.zoomToPrevExtent();});
    registry.byId("zoomnext").on("click", function () {navToolbar.zoomToNextExtent();});
    registry.byId("pan").on("click", function () {navToolbar.activate(Navigation.PAN);});
          
	darmcLayer = new ArcGISDynamicMapServiceLayer("http://cga6.cga.harvard.edu/arcgis/rest/services/darmc/roman/MapServer");
    //basemap1 = new ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/arcgis/rest/services/World_Shaded_Relief/MapServer");
    //map.addLayer(basemap1);

    var locator = new esri.tasks.Locator("http://cga6.cga.harvard.edu/arcgis/rest/services/darmc/DARMC_locator/GeocodeServer");
	dojo.connect(locator, "onAddressToLocationsComplete", showResults);	

    
    var basemaps = [];                
	var basemapOSM = new Basemap({layers: [new BasemapLayer({type: "OpenStreetMap"})], id: "bmOSM",	title: "Open Street Map"});
	var basemapOcean = new Basemap({layers: [new BasemapLayer({type: "Ocean"})],id: "bmESRIOcean",title: "Ocean Basemap"});
	var basemapTopo = new Basemap({layers: [new BasemapLayer({type: "Topo"})], id: "bmESRITopo", title: "Esri Topo"});

	basemaps.push(basemapOSM, basemapOcean, basemapTopo);
	

	var basemapGallery = new BasemapGallery({showArcGISBasemaps: true, basemaps: basemaps,	map: map}, "basemapGallery");
												
	basemapGallery.startup();
	
	dojo.forEach(basemapGallery.basemaps, function(basemap) {            
		//Add a menu item for each basemap, when the menu items are selected
		dijit.byId("basemapMenu").addChild(new dijit.MenuItem({
			label: basemap.title,
			onClick: dojo.hitch(this, function() {							
				basemapGallery.select(basemap.id);
			})
		}));          
	});			

    basemapGallery.select('bmOSM');
    registry.byId("locateButton").on("click", locate);	
	function locate() {
		map.graphics.clear();
		var add = dojo.byId("placeName").value; //.split(",");
		var address = {
			Name : add,
			County: ""
		};
		locator.addressToLocations(address,["Loc_name"]);
	}
			
			function showResults(candidates) {
				var candidate;
				var symbol =  new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 8, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0,43,255]), 1), new dojo.Color([162,245,239,0.5]));
				var infoTemplate = new esri.InfoTemplate("Location", "Name: ${address}<br />Score: ${score}<br />");
				candidate_holder = []
				var geom;
				var uExtent=null;
				var iBuffer=3000;
				var sResult="";
				dojo.every(candidates,function(candidate){					
					//if (candidate.score > 0) {
						console.log(candidate.score);
						var attributes = { address: candidate.address, score:candidate.score};
						geom = esri.geometry.geographicToWebMercator(candidate.location);
						/*if (uExtent==null) {
							uExtent=new esri.geometry.Extent(geom.x-iBuffer,geom.y-iBuffer,geom.x+iBuffer, geom.y+iBuffer);
						} 
						else {
							uExtent=uExtent.union(new esri.geometry.Extent(geom.x-iBuffer,geom.y-iBuffer,geom.x+iBuffer, geom.y+iBuffer))
						}*/
						var graphic = new esri.Graphic(geom, symbol, attributes, infoTemplate);
						//add a graphic to the map at the geocoded location
						map.graphics.add(graphic);
						//add a text symbol to the map listing the location of the matched address.
						var displayText = candidate.address;
						var font = new esri.symbol.Font("8pt",esri.symbol.Font.STYLE_NORMAL, esri.symbol.Font.VARIANT_NORMAL,esri.symbol.Font.WEIGHT_BOLD,"Helvetica");
						var textSymbol = new esri.symbol.TextSymbol(displayText,font,new dojo.Color("#000"));
						textSymbol.setOffset(0,8);
						candidate_holder.push(candidate.score)
						//sResult+="<a href='JavaScript:zoomToIt(" +geom.x + "," + geom.y + ")'>" + candidate.address + "</a><br />";
						map.graphics.add(new esri.Graphic(geom, textSymbol));
						return true; //break out of loop after one candidate with score greater  than 80 is found.
					//}
					//else{console.log("text");alert("No place found! Please try it again.");}
					
				});
				//map.setExtent(uExtent, true);
				console.log(candidate_holder, candidate_holder.sort()[candidate_holder.length -1])
				if(candidate_holder.sort()[candidate_holder.length -1] < 40 || candidate_holder.sort()[candidate_holder.length -1] == undefined){alert("No place found! Please try it again.");}
			//sResult+="<br/><a href='JavaScript:dojo.byId(\"geocodeResult\").style.visibility=\"hidden\";return false'>Close</a>";
			//dojo.byId("geocodeResult").innerHTML=sResult;
			//dojo.byId("geocodeResult").style.visibility="visible";
			
			//map.centerAndZoom(geom,12);
		}
	
    


    map.on('layers-add-result', function(evt){
        // overwrite the default visibility of service. TOC will honor the overwritten value.
        darmcLayer.setVisibleLayers([54,58]);
        //try {
		toc = new TOC({
			map: map,
			layerInfos: [{
					layer: darmcLayer,
					title: "",					
					//collapsed: false, // whether this root layer should be collapsed initially, default false.
					//slider: true // whether to display a transparency slider.
					}]
				}, 'tocDiv');
				toc.startup();
				toc.on('load', function(){
                if (console) 
					//console.log('TOC loaded');
					console.log(toc.layerInfos[0].layer.visibleLayers);	
				});
                //} catch (e) {  alert(e); }
				});
				map.addLayers([darmcLayer]);
				dojo.connect(map,"onLoad",mapReady);
            });
		
	

		function mapReady(map){				
			//identifyTask = new esri.tasks.IdentifyTask("http://cga6.cga.harvard.edu/arcgis/rest/services/darmc/roman/MapServer");
			identifyTask = new esri.tasks.IdentifyTask("http://cga6.cga.harvard.edu/arcgis/rest/services/darmc/roman/MapServer");
			identifyParams = new esri.tasks.IdentifyParameters();	
			identifyListener = dojo.connect(map,"onClick",executeIdentifyTask);				
			dojo.connect(map,"onClick",function (){
				var layersON = toc.layerInfos[0].layer.visibleLayers; 
				layersON.push(); 						 
				//console.debug(layersON);						
				//create identify tasks and setup parameters 						
				identifyParams.layerOption = esri.tasks.IdentifyParameters.LAYER_OPTION_ALL;						
				identifyParams.tolerance = 3;
				identifyParams.returnGeometry = true;						
				identifyParams.layerIds = [layersON];								    
				identifyParams.width  = map.width;
				identifyParams.height = map.height;						
			});								  
				//resize the map when the browser resizes
				dojo.connect(dijit.byId('map'), 'resize', map,map.resize);
		    }
			
		function executeIdentifyTask(evt){
			identifyParams.geometry = evt.mapPoint;
			identifyParams.mapExtent = map.extent;						
			var deferred = identifyTask.execute(identifyParams);
			deferred.addCallback(function(response) {     
				console.debug("# of features: " + response.length);
			    // response is an array of identify result objects    
				// Let's return an array of features.		  
				return dojo.map(response, function(result) {										
					var feature = result.feature;					
					// I did not enter all the layers because I am not sure it's the best way to hadle it
					// and also it does not really work. From most of the layer I get "No information available."
					console.debug(result.layerId);						
					switch (result.layerId) {
						// Roman Empire
						/*case 1: var template = new esri.InfoTemplate("", "Name: ${PLACE_NAME}<br/>Pleiades ID : <i>${PLEIADESID}</i><br/> <a href='${PLEIADESURL}' target='_blank'>Pleiades URL</a>", "");feature.setInfoTemplate(template); break;*/
						case 1: var template = new esri.InfoTemplate("", "${*}", "");feature.setInfoTemplate(template); break;
						case 2: var template = new esri.InfoTemplate("", "${*}", "");feature.setInfoTemplate(template); break;
						case 3: var template = new esri.InfoTemplate("", "${*}", "");feature.setInfoTemplate(template); break;
						case 4: var template = new esri.InfoTemplate("", "${*}", "");feature.setInfoTemplate(template); break;
						case 6: var template = new esri.InfoTemplate("", "${*}", "");feature.setInfoTemplate(template); break;
						case 7: var template = new esri.InfoTemplate("", "${*}", "");feature.setInfoTemplate(template); break;
						case 8: var template = new esri.InfoTemplate("", "${*}", "");feature.setInfoTemplate(template); break;
						case 9: var template = new esri.InfoTemplate("", "${*}", "");feature.setInfoTemplate(template); break;
						case 10: var template = new esri.InfoTemplate("", "${*}", "");feature.setInfoTemplate(template); break;
						case 11: var template = new esri.InfoTemplate("", "${*}", "");feature.setInfoTemplate(template); break;
						case 12: var template = new esri.InfoTemplate("", "${*}", "");feature.setInfoTemplate(template); break;
						case 13: var template = new esri.InfoTemplate("", "${*}", "");feature.setInfoTemplate(template); break;
						case 14: var template = new esri.InfoTemplate("", "${*}", "");feature.setInfoTemplate(template); break;
						case 15: var template = new esri.InfoTemplate("", "${*}", "");feature.setInfoTemplate(template); break;
						case 16: var template = new esri.InfoTemplate("", "${*}", "");feature.setInfoTemplate(template); break;
						case 17: var template = new esri.InfoTemplate("", "${*}", "");feature.setInfoTemplate(template); break;
						case 18: var template = new esri.InfoTemplate("", "${*}", "");feature.setInfoTemplate(template); break;							
						case 19: var template = new esri.InfoTemplate("", "${*}", "");feature.setInfoTemplate(template); break;							
						case 21: var template = new esri.InfoTemplate("", "${*}", "");feature.setInfoTemplate(template); break;							
						case 22: var template = new esri.InfoTemplate("", "${*}", "");feature.setInfoTemplate(template); break;
						case 23: var template = new esri.InfoTemplate("", "${*}", "");feature.setInfoTemplate(template); break;
						case 24: var template = new esri.InfoTemplate("", "${*}", "");feature.setInfoTemplate(template); break;
						case 25: var template = new esri.InfoTemplate("", "${*}", "");feature.setInfoTemplate(template); break;
						case 26: var template = new esri.InfoTemplate("", "${*}", "");feature.setInfoTemplate(template); break;
						case 27: var template = new esri.InfoTemplate("", "${*}", "");feature.setInfoTemplate(template); break;
						case 28: var template = new esri.InfoTemplate("", "${*}", "");feature.setInfoTemplate(template); break;
						case 29: var template = new esri.InfoTemplate("", "${*}", "");feature.setInfoTemplate(template); break;
						case 30: var template = new esri.InfoTemplate("", "${*}", "");feature.setInfoTemplate(template); break;
						case 31: var template = new esri.InfoTemplate("", "${*}", "");feature.setInfoTemplate(template); break;
						case 32: var template = new esri.InfoTemplate("", "${*}", "");feature.setInfoTemplate(template); break;
						case 33: var template = new esri.InfoTemplate("", "${*}", "");feature.setInfoTemplate(template); break;							
						case 34: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 35: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;	
						case 36: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;	
						case 38: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;	
						case 39: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;	
						case 40: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;							
						// Medieval Kingdoms							
						case 42: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 43: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;					
						case 45: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 46: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 47: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 48: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 49: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 51: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 52: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 54: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 55: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 56: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 57: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 59: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 60: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 62: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 63: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 64: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 67: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 68: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 70: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 71: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 73: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 74: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 76: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;							
						case 77: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;							
						// Civilization Feature
						case 80: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 81: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 83: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 84: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 86: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 87: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;							
						case 89: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;							
						case 90: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 91: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 92: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 94: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 95: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 96: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 97: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 98: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 99: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 100: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;							
						case 103: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 104: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 105: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 106: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 107: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;							
						case 109: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 110: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 111: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 112: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 113: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 114: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 116: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 117: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 118: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 119: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;						
						case 122: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;							
						case 124: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 125: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;							
						case 127: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 128: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 130: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 131: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 132: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 133: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 134: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 137: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 138: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 139: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 140: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;							
						case 141: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;
						case 142: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;							
						case 144: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;							
						case 145: var template = new esri.InfoTemplate("", "${*}", ""); feature.setInfoTemplate(template); break;							
					}						
						
				return feature;					
				});
			});
			map.infoWindow.setFeatures([ deferred ]);
			map.infoWindow.show(evt.mapPoint);

			

	}



		
			