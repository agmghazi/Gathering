var bodyBox = document.querySelector("body").getBoundingClientRect();
var bodyBottomMargin = bodyBox.bottom - bodyBox.height;
var divmap = document.getElementById("divmap");
fitMapToWindow();
window.onresize = fitMapToWindow;
function fitMapToWindow() {
    divmap.style.height = window.innerHeight - divmap.getBoundingClientRect().top - bodyBottomMargin + "px";
}

var countriesDDL = document.getElementById("countries");
var citiesLabel = document.getElementById("citiesLabel");
var citiesDDL = document.getElementById("cities");
var countries = [];
var Country = function (name, cities) {
    this.name = name;
    this.cities = cities
}
var result = document.getElementById('result');

require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/FeatureLayer",
    "esri/request",
    "esri/widgets/Legend",
    "esri/widgets/BasemapToggle"]
    , function (Map, MapView, FeatureLayer, esriRequest, Legend, BasemapToggle) {

        var labelSymbol0 = {
            type: "text",
            color: "black",
            font: {
                size: 8,
                weight: "bold"
            },
            haloSize: 1,
            haloColor: "white"
        };

        var labelSymbol1 = {
            type: "text",
            color: "red",
            font: {
                size: 12,
                weight: "bold"
            },
            haloSize: 1,
            haloColor: "white"
        };

        const labelClassCity = {
            labelExpressionInfo: { expression: "$feature.CITY_NAME" },
            labelPlacement: "center-right",
            symbol: labelSymbol0
        };

        var rendererCity = {
            type: "class-breaks",
            field: "pop",
            classBreakInfos: [
                {
                    minValue: -1000,
                    maxValue: 999999,
                    symbol: {
                        type: "simple-marker",
                        color: "blue",
                        size: 5,
                        outline: {
                            color: [128, 128, 128, 0.5],
                            width: "0.5px"
                        }
                    },
                    label: "Less than 1,000,000"
                },
                {
                    minValue: 1000000,
                    maxValue: 100000000,
                    symbol: {
                        type: "simple-marker",
                        style: "triangle",
                        size: 8,
                        color: "red",
                        outline: {
                            color: [128, 128, 128, 0.5],
                            width: "0.5px"
                        }
                    },
                    label: "More than or equal 1,000,000"
                }
            ]
        };

        var uniqueCityRenderer = {
            type: "unique-value",
            field: "CITY_NAME",
            legendOptions: { title: "Name" },
            defaultSymbol: {
                type: "simple-marker",
                color: "black",
                size: 5,
                outline: {
                    color: [128, 128, 128, 0.5],
                    width: "0.5px"
                }
            },
            uniqueValueInfos: [{
                value: "City",
                symbol: {
                    type: "simple-marker",
                    style: "triangle",
                    size: 12,
                    color: "red",
                    outline: {
                        color: [128, 128, 128, 0.5],
                        width: "0.5px"
                    }
                }
            }],
        };

        var layerCities = new FeatureLayer({
            url: "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/ArcGIS/rest/services/world_cities/FeatureServer/0",
            popupTemplate: {
                title: "{CITY_NAME} city.",
                content:
                    `<ul id="popup">
                            <li>CITY_NAME: {CITY_NAME}</li>
                            <li>ADMIN_NAME: {ADMIN_NAME}</li>
                            <li>CNTRY_NAME: {CNTRY_NAME}</li>
                            <li>STATUS: {STATUS}</li>
                            <li>POP: {POP}</li>
                            <li>POP_CLASS: {POP_CLASS}</li>
                        </ul>`
            },
            renderer: rendererCity
        });

        var layerCountries = new FeatureLayer({
            url: "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/ArcGIS/rest/services/World_borders/FeatureServer/0",
            renderer: {
                type: "simple",
                symbol: {
                    type: "simple-fill",
                    color: [255, 128, 0, 0.2],
                    outline: {
                        width: 1,
                        color: "yellow"
                    }
                }
            },
            definitionExpression: "NAME = 'null'",
            visible: false
        });

        var map = new Map({
            basemap: "gray",
            layers: [layerCountries, layerCities]
        });

        // Hide Basemap Labels Layer (Refernce Layer)
        map.basemap.load().then(function () {
            map.basemap.referenceLayers.items[0].visible = false;
        });

        var mapView = new MapView({
            map: map,
            container: 'divmap',
            center: [31, 31],
            zoom: 3,
        });

        // Basemap Toggle Widget
        var basemapToggle = new BasemapToggle({
            view: mapView,
            nextBasemap: "satellite"
        });
        mapView.ui.add(basemapToggle, "bottom-left");

        // Legend Widget
        var legend = new Legend({
            view: mapView,
            layerInfos: [{
                layer: layerCities,
                title: "Cities"
            }]
        });
        mapView.ui.add(legend, "bottom-right");


        // Get List of Countries
        var citiesLayerUrl = layerCities.url + "/0/query";
        var myOpts = {
            query: {
                where: "pop > 1000000",
                outFields: "CITY_NAME, CNTRY_NAME, POP, ADMIN_NAME, STATUS, POP_RANK, POP_CLASS",
                f: "json",
            }
        };
        esriRequest(citiesLayerUrl, myOpts).then(function (e) {
            for (let i = 0; i < e.data.features.length; i++) {
                var currentCountry = e.data.features[i].attributes.CNTRY_NAME;
                if (!countries.map(function (e) { return e.name }).includes(currentCountry)) {
                    countries.push(new Country(currentCountry, [e.data.features[i].attributes.CITY_NAME]));
                }
                else {
                    countries.filter(function (e) { return e.name == currentCountry })[0].cities.push(e.data.features[i].attributes.CITY_NAME);
                }
            }

            countries.slice().map(function (country) { return country.name })
                .sort()
                .forEach(cName => {
                    var option = document.createElement('option');
                    option.value = cName;
                    option.textContent = cName;
                    countriesDDL.appendChild(option);
                });

            countries.forEach(country => {
                country.cities.sort();
            });
        });

        var countryZoom;
        var selectedCountry;

        countriesDDL.addEventListener('change', function () {

            selectedCountry = this.value;

            if (selectedCountry === "All") {

                mapView.popup.close();

                citiesLabel.style.visibility = "hidden";
                citiesDDL.innerHTML = ``;
                citiesDDL.style.visibility = "hidden";
                result.style.visibility = "hidden";

                layerCountries.definitionExpression = "NAME = 'null'";
                layerCountries.visible = false;

                layerCities.definitionExpression = null;
                layerCities.labelingInfo = null;
                layerCities.renderer = rendererCity;
                layerCities.queryExtent().then(function (e) {
                    mapView.goTo({
                        target: e.extent,
                        zoom: 3,
                    }, {
                        duration: 500
                    })
                });
            }
            else {
                var cities = countries.filter(function (e) { return e.name == selectedCountry })[0].cities;

                citiesLabel.style.visibility = "visible";
                citiesDDL.style.visibility = "visible";
                result.style.visibility = "visible";

                result.textContent = selectedCountry + " has "
                    + (cities.length > 0 ? cities.length + (cities.length == 1 ? " city" : " cities") : " no cities")
                    + " with population more than one million."

                citiesDDL.innerHTML = `<option value="All">All</option>`;
                cities.forEach(city => {
                    var option = document.createElement('option');
                    option.value = city;
                    option.textContent = city;
                    citiesDDL.appendChild(option);
                });

                zoomToCountry(selectedCountry);
            }

        });

        citiesDDL.addEventListener('change', function () {

            var selectedCity = this.value;

            if (selectedCity === "All") {
                zoomToCountry(selectedCountry);
            }
            else {

                labelClassCity.where = "CITY_NAME = '" + selectedCity + "' AND CNTRY_NAME LIKE '%" + selectedCountry + "%'";
                labelClassCity.symbol = labelSymbol1;
                layerCities.labelingInfo = labelClassCity;

                uniqueCityRenderer.uniqueValueInfos[0].value = selectedCity;
                layerCities.renderer = uniqueCityRenderer;

                // Zoom to city
                layerCities.queryExtent({ where: labelClassCity.where }).then(function (e) {
                    mapView.goTo({
                        target: e.extent,
                        zoom: countryZoom + 1,
                    }, {
                        duration: 500
                    });
                });

                // popup selectedCity
                myOpts.query.where = labelClassCity.where;
                esriRequest(citiesLayerUrl, myOpts).then(function (f) {
                    var pt = f.data.features[0].geometry;
                    pt.spatialReference = f.data.spatialReference;
                    mapView.popup.open({
                        location: pt,
                        features: [{
                            attributes: f.data.features[0].attributes,
                            popupTemplate: layerCities.popupTemplate
                        }],
                    });
                });

            }
        });

        function zoomToCountry(countryName) {

            mapView.popup.close();

            labelClassCity.where = null;
            labelClassCity.symbol = labelSymbol0;
            layerCities.labelingInfo = labelClassCity;
            layerCities.renderer = rendererCity;
            layerCities.definitionExpression = "CNTRY_NAME = '" + countryName + "'";

            layerCountries.definitionExpression = "NAME LIKE '%" + countryName + "%'";
            layerCountries.visible = true;
            layerCountries.queryExtent().then(function (e) {
                mapView.goTo({
                    target: e.extent
                }, {
                    duration: 1500
                }).then(function () {
                    countryZoom = mapView.zoom;
                });
            });
        };
    }
);