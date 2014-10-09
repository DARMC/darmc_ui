var map, toc, darmcLayer, identifyTask,identifyParams,identifyListener;
            
require(["dojo/parser","dojo/_base/connect","dojo/dom", "dijit/registry", "dojo/on",  "dojo/_base/array", "esri/arcgis/utils", "esri/map","esri/geometry/Extent","esri/toolbars/navigation","esri/layers/ArcGISTiledMapServiceLayer", 
  "esri/layers/ArcGISDynamicMapServiceLayer","agsjs/dijit/TOC","dijit/layout/BorderContainer","dijit/layout/ContentPane", "agsjs/layers/GoogleMapsLayer",
  "esri/dijit/Popup", "esri/tasks/IdentifyTask", "esri/tasks/IdentifyParameters", 'dijit/Dialog',
  "dijit/Toolbar", "esri/dijit/Print", "esri/tasks/PrintTemplate", "esri/tasks/LegendLayer", "dijit/form/Button", "dijit/Menu", "dojo/domReady!"], 

function(parser, connect, dom, registry, on, arrayUtils, arcgisUtils, Map, Extent, Navigation, ArcGISTiledMapServiceLayer, ArcGISDynamicMapServiceLayer,TOC, BorderContainer,
    ContentPane, GoogleMapsLayer, Popup, IdentifyTask, IdentifyParameters, Dialog, Toolbar, Print, PrintTemplate, LegendLayer){

  // call the parser to create the dijit layout dijits
  parser.parse(); // note djConfig.parseOnLoad = false;

  var navToolbar;
  var dialogMeasure = new Dialog({style: "width: 300px"});
  var popup = new Popup({},dojo.create("div"))
  var mapurl = "http://cga6.cga.harvard.edu/arcgis/rest/services/darmc/roman/MapServer"
  var geometryService = new esri.tasks.GeometryService("http://sampleserver3.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");
  var initialExtent = new Extent({"xmin":-1356246,"ymin":2180686,"xmax":5237841,"ymax":7669400,"spatialReference":{"wkid":102100}});
  //var printUrl = "http://cga6.cga.harvard.edu/arcgis/rest/services/darmc/darmcprintlegend/GPServer/Export%20Web%20Map";
  var printUrl = "http://cga6.cga.harvard.edu/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task";
  var currentBasemap = [];
 
  map = new Map("map", {  
    center: [12, 46],
    infoWindow:popup,
    zoom: 5,
    sliderPosition: "top-right"
  });

  navToolbar = new Navigation(map);
  navToolbar.zoomToFullExtent = function() { map = this.map; map.setExtent(initialExtent);}
    
  registry.byId("zoomin").on("click", function () {navToolbar.activate(Navigation.ZOOM_IN);});
  registry.byId("zoomout").on("click", function () {navToolbar.activate(Navigation.ZOOM_OUT);});
  registry.byId("zoomfullext").on("click", function () {navToolbar.zoomToFullExtent();});
  registry.byId("zoomprev").on("click", function () {navToolbar.zoomToPrevExtent();});
  registry.byId("zoomnext").on("click", function () {navToolbar.zoomToNextExtent();});
  registry.byId("pan").on("click", function () {navToolbar.activate(Navigation.PAN);});
  
  darmcLayer = new ArcGISDynamicMapServiceLayer(mapurl, {id:"fooLayer"});
  
  var relief = new ArcGISTiledMapServiceLayer("http://services.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer");
  var street = new ArcGISTiledMapServiceLayer("http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer");
  var topo = new ArcGISTiledMapServiceLayer("http://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer");
  //var stamenterrain = new ArcGISTiledMapServiceLayer("http://b.tile.stamen.com/terrain/{level}/{col}/{row}.jpg");
  var awmc = new esri.layers.WebTiledLayer("http://c.tiles.mapbox.com/v3/isawnyu.map-knmctlkh/{level}/{col}/{row}.png");  
  var googleterrain = new GoogleMapsLayer({id:"terrain"});
  //var googlesatellite = new GoogleMapsLayer({id:"satellite"});
  //var googleroadmap = new GoogleMapsLayer({id:"roadmap"});
 
  currentBasemap.push(relief);
  map.addLayer(relief);

  // locator
  var locator = new esri.tasks.Locator("http://cga6.cga.harvard.edu/arcgis/rest/services/darmc/DARMC_locator/GeocodeServer");
  dojo.connect(locator, "onAddressToLocationsComplete", showResults);
  dojo.connect(geometryService, "onLengthsComplete", outputDistance);
  dojo.connect(geometryService, "onAreasAndLengthsComplete", outputArea);
  // basemap
  
  function changeLayer(layerName) {
      map.removeLayer(currentBasemap[0])
      currentBasemap.length = 0;
      currentBasemap.push(layerName)
      map.addLayer(layerName)
      map.reorderLayer(layerName, 0);
  }

  dom.byId("bmSelect").onchange = function () {
      var newBasemap = dom.byId("bmSelect").value
      //Default to the imagery basemap if "none Selected" is the choice in the dropdown 
      if (newBasemap === "none") {
          changeLayer(street)
      } else {
          //The following allows you to map the dropdown values with an object reference to the tiled service layers created above
          var bmList = ({
              "relief": relief, "topo": topo, "street": street, "awmc":awmc, "googleterrain":googleterrain});

          //Find the selected basemap in the array above and use the associated object to add the selected theme layer to the map
          for (var x in bmList) {
              if (x === newBasemap) {
                  //console.log(bmList[x].id)
                  //if(bmList[x].id == 'satellite'){map.addLayer(googlesatellite)}
                  changeLayer(bmList[x])
              }
          }
      }
  }
  
  // DARMC geocoder
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

  // measure the area   
  registry.byId("area").on("click", activateArea);
  function activateArea() {       
    if (dijit.byId("area").checked){
      dojo.disconnect(identifyListener);
      tb_area = new esri.toolbars.Draw(map);  
      var areasAndLengthParams = new esri.tasks.AreasAndLengthsParameters();
      //on draw end add graphic, project it, and get new length
      dojo.connect(tb_area, "onDrawEnd", function(geometry) {
        map.graphics.clear();
        var graphic = map.graphics.add(new esri.Graphic(geometry, new esri.symbol.SimpleFillSymbol()));      
        //setup the parameters for the areas and lengths operation                        
        areasAndLengthParams.areaUnit = esri.tasks.GeometryService.UNIT_METER;
        geometryService.simplify([geometry], function(simplifiedGeometries) {
          areasAndLengthParams.polygons = simplifiedGeometries;
          geometryService.areasAndLengths(areasAndLengthParams);
        });
      });
      tb_area.activate(esri.toolbars.Draw.POLYGON);
    }
    else {
      tb_area.deactivate();
      identifyListener = dojo.connect(map, "onClick", executeIdentifyTask);
      map.graphics.clear();
    }       
  }

  function outputArea(result_area) {    
    var content = "<i>Roman (actus quadratus): </i>" + dojo.number.format(result_area.areas[0]* 0.000793651) + "<br/><i>Square Meter: </i>" + dojo.number.format(result_area.areas[0]) + "<br/><i>Hectares: </i>" + dojo.number.format(result_area.areas[0]/10000) +  "<br/><i>Acres: </i>" + dojo.number.format(result_area.areas[0] * 0.00024711);
    dialogMeasure.set("title", "Measure Area");
    dialogMeasure.set("content", content);
    dialogMeasure.show()
  }

  // measure the distance
  registry.byId("distance").on("click", activateDistance);
  function activateDistance() {       
    if (dijit.byId("distance").checked){
      dojo.disconnect(identifyListener);
      tb_distance = new esri.toolbars.Draw(map);  
      var lengthParams = new esri.tasks.LengthsParameters();
      //on draw end add graphic, project it, and get new length
      dojo.connect(tb_distance, "onDrawEnd", function(geometry) {
        map.graphics.clear();
        lengthParams.polylines = [geometry];
        lengthParams.lengthUnit = esri.tasks.GeometryService.UNIT_METER;
        lengthParams.geodesic = true;
        geometryService.lengths(lengthParams);
        var graphic = map.graphics.add(new esri.Graphic(geometry, new esri.symbol.SimpleLineSymbol()));
      });
      tb_distance.activate(esri.toolbars.Draw.POLYLINE);
    }
    else {
      tb_distance.deactivate();
      identifyListener = dojo.connect(map, "onClick", executeIdentifyTask);
      map.graphics.clear();
    }       
  }

  function outputDistance(result_dist) {
    var content = "<i>Roman Foot (Pes): </i>" + dojo.number.format(result_dist.lengths[0]/ 0.296) + "<br/><i>Roman Mile </i>: " +  dojo.number.format(result_dist.lengths[0]/ 1480) + "<br/><i>Gallic Leuga: </i>" +  dojo.number.format(result_dist.lengths[0]/ 2200) + "<br /><i>Byzantine foot: </i>" + dojo.number.format(result_dist.lengths[0]/ 0.3123) + "<br /><i>Byzantine Mile: </i>" + dojo.number.format(result_dist.lengths[0]/ 1581) + "<br /><i>Meters: </i>" + dojo.number.format(result_dist.lengths[0]);
    dialogMeasure.set("title", "Measure Distance");
    dialogMeasure.set("content", content);
    dialogMeasure.show()
  }


  
   
  map.on('layers-add-result', function(evt){
    // overwrite the default visibility of service.TOC will honor the overwritten value.
    darmcLayer.setVisibleLayers([54,58]);
    //try {
      toc = new TOC({
        map: map,
        layerInfos: [{
          layer: darmcLayer,
          title: ""
          //collapsed: false, // whether this root layer should be collapsed initially, default false.
          //slider: false // whether to display a transparency slider.
        }]
        }, 'tocDiv');
        toc.startup();
        toc.on('load', function(){
        if (console) 
          console.log('TOC loaded');
        
        });
        // print
    var layoutTemplate, templateNames, mapOnlyIndex, templates, printTitle = "DARMC 2.0 ";
    var legendLayer = new LegendLayer();
    legendLayer.layerId = "fooLayer"
    var arrayLegend = [];  
    var arrayLegendDefault = [0,30,76]  
    var arrayLegend = arrayLegendDefault.concat(toc.layerInfos[0].layer.visibleLayers);
    arrayLegend.sort()
    legendLayer.subLayerIds = arrayLegend;
    // create an array of objects that will be used to create print templates
    var layouts = [{
      name: "Letter ANSI A Landscape", 
      label: "Landscape (PDF)", 
      format: "pdf", 
      options: { 
        legendLayers: [legendLayer], // empty array means no legend
        scalebarUnit: "Meters",
        titleText: printTitle + ", Letter ANSI A Landscape",
        copyrightText: "CGA",
        authorText: "Giovanni Zambotti"
      }
    }];
    console.log(layouts)
    
    // create the print templates
    var templates = arrayUtils.map(layouts, function(lo) {
      var t = new PrintTemplate();
      t.layout = lo.name;   
      t.label = lo.label;
      t.format = lo.format;
      t.layoutOptions = lo.options;
      return t;
    });  

    var printer = new Print({
      map: map,
      templates: templates,
      url: printUrl
    }, dom.byId("print_button"));

    printer.startup();  

    //} catch (e) {  alert(e); }
    
    });
    map.addLayers([darmcLayer]);
    dojo.connect(map,"onLoad",mapReady);
    console.log(toc);

    

// end of example actions
});


  



// identify function
function mapReady(map){       
      identifyTask = new esri.tasks.IdentifyTask("http://cga6.cga.harvard.edu/arcgis/rest/services/darmc/roman/MapServer");
      //identifyTask = new esri.tasks.IdentifyTask("http://cga1.cga.harvard.edu/arcgis/rest/services/darmc/roman/MapServer");
      identifyParams = new esri.tasks.IdentifyParameters(); 
      identifyListener = dojo.connect(map,"onClick",executeIdentifyTask);       
      dojo.connect(map,"onClick",function (){
        var layersON = toc.layerInfos[0].layer.visibleLayers; 
        layersON.push();             
        console.debug(layersON);            
        //create identify tasks and setup parameters            
        identifyParams.layerOption = esri.tasks.IdentifyParameters.LAYER_OPTION_ALL;            
        identifyParams.tolerance = 5;
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
          console.log(result.layerId);            
          var template = new esri.InfoTemplate("", "${*}", "");
          feature.setInfoTemplate(template);
            
        return feature;         
        });
      });
      map.infoWindow.setFeatures([ deferred ]);
      map.infoWindow.show(evt.mapPoint);
}
