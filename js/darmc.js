var map, toc, darmcLayer, identifyTask,identifyParams,identifyListener;
			
            
require(["dojo/_base/connect","dojo/dom", "dojo/parser", "dijit/registry", "dojo/on","esri/map","esri/toolbars/navigation","esri/layers/ArcGISTiledMapServiceLayer", 
	"esri/layers/ArcGISDynamicMapServiceLayer","agsjs/dijit/TOC","dijit/layout/BorderContainer","dijit/layout/ContentPane",
	"dijit/layout/AccordionContainer","dijit/layout/TabContainer","esri/dijit/Popup", "dijit/Toolbar","dojo/fx", "dojo/domReady!"], 

	function(connect, dom, parser, registry, on, Map, Navigation, ArcGISTiledMapServiceLayer, ArcGISDynamicMapServiceLayer,TOC,BorderContainer,
		ContentPane, AccordionContainer,TabContainer,Popup){
            
	// call the parser to create the dijit layout dijits
	parser.parse(); // note djConfig.parseOnLoad = false;
	var navToolbar;
				
	var popup = new esri.dijit.Popup({
		fillSymbol: new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255,0,0]), 2), new dojo.Color([255,255,0,0.25]))
	}, dojo.create("div"));
				
	map = new Map("map", {	
		center: [12, 46],
		infoWindow:popup,
		zoom: 5,
		sliderPosition: "top-right"
	});

	navToolbar = new Navigation(map);
    //on(navToolbar, "onExtentHistoryChange", extentHistoryChangeHandler);

    registry.byId("zoomin").on("click", function () {navToolbar.activate(Navigation.ZOOM_IN);});
    registry.byId("zoomout").on("click", function () {navToolbar.activate(Navigation.ZOOM_OUT);});
    registry.byId("zoomfullext").on("click", function () {navToolbar.zoomToFullExtent();});
    registry.byId("zoomprev").on("click", function () {navToolbar.zoomToPrevExtent();});
    registry.byId("zoomnext").on("click", function () {navToolbar.zoomToNextExtent();});
    registry.byId("pan").on("click", function () {navToolbar.activate(Navigation.PAN);});



    /*function extentHistoryChangeHandler () {
        registry.byId("zoomprev").disabled = navToolbar.isFirstExtent();
        registry.byId("zoomnext").disabled = navToolbar.isLastExtent();
    }*/
              
	darmcLayer = new ArcGISDynamicMapServiceLayer("http://cga6.cga.harvard.edu/arcgis/rest/services/darmc/roman/MapServer", {opacity: 0.8});
    basemap = new ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/arcgis/rest/services/World_Shaded_Relief/MapServer");
    map.addLayer(basemap);         
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
			identifyTask = new esri.tasks.IdentifyTask("http://cga1.cga.harvard.edu/arcgis/rest/services/darmc/roman/MapServer");
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

		//document.getElementsByClassName("agsjsTOCServiceLayerPD").onclick = function(){console.log("test")}
