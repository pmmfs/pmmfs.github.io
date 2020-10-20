// Keep track of filters
var filters = {
    country1: "",
    country2: "",
};

// default display
function init() {

    // maps
    buildMapModel();
    buildMapResponse();
    buildMapClasses();  

    // supervised ML: feature selection pie charts
    buildPieCharts();

    // Dropdown of indices selections
    var selector = d3.select("#selDataset");

    d3.json("data/indexSelections.json").then((data) => {
        var indexSelections = data.selections;
        indexSelections.forEach((choice) => {
          selector
            .append("option")
            .text(choice)
            .property("value", choice);
        });
    });

    // Default bar charts (top & bott 5 countries for indices)
    buildWorldCharts("Government Response"); 

    // the infection - country list dropdown
    // Dropdown of country1 selection
    var country1Selector = d3.select("#selCountry1");

    d3.json("data/countryCounts.json").then((data) => {
        var countrySelections1 = data.countries;
        console.log(countrySelections1)
        countrySelections1.forEach((country) => {
            country1Selector
            .append("option")
            .text(country)
            .property("value", country);
        });
    });

    // Dropdown of country2 selection
    var country2Selector = d3.select("#selCountry2");

    d3.json("data/countryCounts.json").then((data) => {
        var countrySelections2 = data.countries;
        console.log(countrySelections2)
        countrySelections2.forEach((country) => {
            country2Selector
            .append("option")
            .text(country)
            .property("value", country);
        });
    });

    // Dropdown of country3 selection
    var country3Selector = d3.select("#selCountry3"); 
    d3.json("data/rampUpCounts1.json").then((data) => {
        var countrySelections3 = data.countries;
        console.log(countrySelections3)
        countrySelections3.forEach((country) => {
            country3Selector
            .append("option")
            .text(country)
            .property("value", country);
        });
    });

    // Dropdown of country4 selection
    var country4Selector = d3.select("#selCountry4"); 
    d3.json("data/rampUpCounts1.json").then((data) => {
        var countrySelections4 = data.countries;
        console.log(countrySelections4)
        countrySelections4.forEach((country) => {
            country4Selector
            .append("option")
            .text(country)
            .property("value", country);
        });
    });

    updateFilters1();
    updateFilters2();

    // heatmap for correlations between variables
    buildHeatmap();

    // dropdown showing lists of countries for classes 0,1,2
    var class0Selector = d3.select("#selClass0");
    var class1Selector = d3.select("#selClass1");
    var class2Selector = d3.select("#selClass2");

    d3.json("data/classes_countryList.json").then((data) => {
        var class0Selections = data.C0;
        var class1Selections = data.C1;
        var class2Selections = data.C2;

        class0Selections.forEach((country) => {
            class0Selector
            .append("option")
            .text(country)
            .property("value", country);
        });
        class1Selections.forEach((country) => {
            class1Selector
            .append("option")
            .text(country)
            .property("value", country);
        });
        class2Selections.forEach((country) => {
            class2Selector
            .append("option")
            .text(country)
            .property("value", country);
        });
    });

    // boxplots for country classes
    buildBoxplots();
};

// Activate default display function
init();

// //-------------------------------mapModel-------------------------------------------------------
function buildMapModel() {

    // Create tile layers that will be background options for the map
    let dark = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/dark-v10/tiles/{z}/{x}/{y}?access_token={accessToken}", {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        accessToken: API_KEY
    });
    
    let light = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/light-v10/tiles/{z}/{x}/{y}?access_token={accessToken}", {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        accessToken: API_KEY
    });

    // Create a base layer that holds all tile layers
    let baseMaps = {
        "Dark": dark,
        "Light": light
    };

    // Create overlay layers for the map 
    let predictions = new L.layerGroup();
    let actual = new L.layerGroup();
    let countries = new L.layerGroup();
    
    let overlays = {
        "Predictions": predictions,
        "Actual": actual,
        "Country Borders": countries
    };

    // Create a map object with a center & zoom level
    let map = L.map("mapModel", {
        center: [20.52, 20.34],
        zoom: 2.45,
        layers: [dark]
    });

    // Pass map layers into our layers control & add the layers control to the map
    L.control.layers(baseMaps, overlays).addTo(map);

    // Access data
    let caseDeathData = "data/countryCoords_new.json";
    let countriesData = "data/countriesIndices.json";

    // Function returns style data for the overlay layers
    function styleInfo_predictions(feature) {
        return {
            opacity: 1,
            fillOpacity: 1,
            fillColor: getColor_predictions(feature.properties.pred_totDeaths),
            color: "#000000",
            radius: getRadius(feature.properties.pred_totDeaths),
            stroke: true,
            weight: 0.5
        };
    }

    // Function determines circle color based on case/death count
    function getColor_predictions(predictions) {
        if (predictions > 25000) {
            return "rgb(103,0,31)";
        }
        if (predictions > 20000) {
            return "rgb(178,24,43)";
        }
        if (predictions > 15000) {
            return "rgb(214,96,77)";
        }
        if (predictions > 10000) {
            return "rgb(244,165,130)";
        }
        if (predictions > 5000) {
            return "rgb(253,219,199)";
        }
        return "#FFFF99";
    }

    function styleInfo_reality(feature) {
        return {
            opacity: 1,
            fillOpacity: 1,
            fillColor: getColor_reality(feature.properties.real_totDeaths),
            color: "#000000",
            radius: getRadius(feature.properties.real_totDeaths),
            stroke: true,
            weight: 0.5
        };
    }

    // Function determines circle color based on case/death count
    function getColor_reality(real) {
        if (real > 25000) {
            return "rgb(5,48,97)";
        }
        if (real > 20000) {
            return "rgb(33,102,172)";
        }
        if (real > 15000) {
            return "rgb(67,147,195)";
        }
        if (real > 10000) {
            return "rgb(146,197,222)";
        }
        if (real > 5000) {
            return "rgb(209,229,240)";
        }
        return "#9999FF";
    }

    // Function determines radius based on case/death count
    // case counts of 0 will be plotted with a radius of 0.5
    function getRadius(counts) {
        if (counts > 25000) {
            return 50;
        }
        if (counts < 1000) {
            return 5;
        }
        if (counts < 5000) {
            return 10;
        }
        return counts / 500;
    }

    // Grab the JSON data
    d3.json(caseDeathData).then(function(data) {
        // Create a JSON layer with the retrieved data
        L.geoJson(data, {

            // Turn each feature into a circleMarker on the map
            pointToLayer: function(feature, latlng) {
                return L.circleMarker(latlng);
            },
            // Set style for each feature's layer using styleInfo function
            style: styleInfo_predictions,
            // Create popup
            onEachFeature: function(feature, layer) {
                layer.bindPopup("<h4>" + feature.properties.CountryName + "</h4>Predicted Total Deaths: "
                + feature.properties.pred_totDeaths + "<br>Actual Total Deaths: "
                + feature.properties.real_totDeaths + "<br>% Difference From Actual: "
                + feature.properties.diff_totDeaths)
            }
        }).addTo(predictions);
        // Add predictions layer to the map
        predictions.addTo(map);
    });

    // Grab the JSON data
    d3.json(caseDeathData).then(function(data) {
        // Create a JSON layer with the retrieved data
        L.geoJson(data, {

            // Turn each feature into a circleMarker on the map
            pointToLayer: function(feature, latlng) {
                return L.circleMarker(latlng);
            },
            // Set style for each feature's layer using styleInfo function
            style: styleInfo_reality,
            // Create popup
            onEachFeature: function(feature, layer) {
                layer.bindPopup("<h4>" + feature.properties.CountryName + "</h4>Actual Total Deaths: "
                + feature.properties.real_totDeaths);
            }
        }).addTo(actual);
    });

    // Set color for country borders
    let styleInfo_countries = {   
        fillOpacity: 0,
        color: "#808080",
        stroke: true,
        weight: 1
    };

    // Grab the GeoJSON data
    d3.json(countriesData).then(function(data) {

        // Create a GeoJSON layer with the retrieved data
        L.geoJson(data, {
            style: styleInfo_countries,
        }).addTo(countries);
    });

    // Add a "legend control object" of colors corresponding to quake magnitudes
    let legend = L.control({
        position: "bottomleft"
    });

    // Add details for the legend
    legend.onAdd = function() {
        // create a div with a class "legend"
        let div = L.DomUtil.create('div', 'legend'); 
        const cases = ["0", "5K", "10K", "15K", "20K", "25K"];
        const colors = [
            "#FFFF99",
            "rgb(253,219,199)",
            "rgb(244,165,130)",
            "rgb(214,96,77)",
            "rgb(178,24,43)",
            "rgb(103,0,31)"
        ];
        const colors_actual = [
            "#9999FF",
            "rgb(209,229,240)",
            "rgb(146,197,222)",
            "rgb(67,147,195)",
            "rgb(33,102,172)",
            "rgb(5,48,97)"
        ];

        // Loop through count intervals to generate a label with a colored square for each interval.
    for (var i = 0; i < cases.length; i++) {
            div.innerHTML +=
            "<i style='background: " + colors[i] + "'></i> " + "<e style='background: " + colors_actual[i] + "'></e> " + cases[i] + (cases[i + 1] ? "&ndash;" + cases[i + 1] + "<br><br>" : "+");
        };
        return div;
    }

    // Add legend to the map
    legend.addTo(map);

}

// function to build feature selection pie charts
function buildPieCharts() {

    // Total Cases
    var trace1 = {
        labels: ['Population','Population Density','Median Age','Economic Support Index','Health/Containment Index','Stringency Index'],
        textposition: "inside",
        values: [20.22,  2.79,  6.77 , 25.12, 19.18,25.91713592],
        marker:{
            colors:['rgb(214,96,77,0.75)', 'rgb(209,229,240,0.75)', 'rgb(253,219,199,0.75)', 'rgb(178,24,43,0.75)','rgb(244,165,130,0.75)','rgb(103,0,31,0.75)']},
        'type': 'pie'    
       };
    var data1 = [trace1];
    var layout1 = {
        title: "Feature Importance for Total Cases",
        titlefont: {
            size: 22
        },
        plot_bgcolor: "rgba(0, 0, 0, 0)",
        paper_bgcolor: "rgba(0, 0, 0, 0)",
        font: {
            size: 15,
            color: '#FFFFFF',
        },
        width: 525,
        height: 525
    };
    Plotly.newPlot("pieTC", data1, layout1, {displayModeBar: false});

    // Total Deaths
    var trace2 = {
        labels: ['Population','Population Density','Median Age','Total Cases','Economic Support Index','Health/Containment Index','Stringency Index'],
        textposition: "inside",
        values: [ 2.32,  0.50,  3.17, 83.23,  1.97, 0.40,  8.41],
        marker:{
            colors:['rgb(146,197,222,0.75)', 'rgb(253,219,199,0.75)', 'rgb(67,147,195,0.75)','rgb(5,48,97,0.75)','rgb(209,229,240,0.75)','rgb(244,165,130,0.75)','rgb(33,102,172,0.75)']},
        'type': 'pie'    
       };
    var data2 = [trace2];
    var layout2 = {
        title: "Feature Importance for Total Death",
        titlefont: {
            size: 22
        },
        plot_bgcolor: "rgba(0, 0, 0, 0)",
        paper_bgcolor: "rgba(0, 0, 0, 0)",
        font: {
            size: 15,
            color: '#FFFFFF'
        },
        width: 525,
        height: 525
    };
    Plotly.newPlot("pieTD", data2, layout2, {displayModeBar: false});
}

// function to update filters - new case/deaths
function updateFilters1() {

    // Save the element, value, and id of the filters that were changed
    let countryFilter1 = d3.select("#selCountry1").property("value");
    let countryFilter2 = d3.select("#selCountry2").property("value");
 
    // If a filter value was entered then add that filterId and value
    // to the filters list. Otherwise, clear that filter from the filters object
    if (countryFilter1 && countryFilter2) {
        filters.country1 = countryFilter1;
        filters.country2 = countryFilter2;
    } else if (countryFilter1 && !countryFilter2) {
        filters.country1 = countryFilter1;
        filters.country2 = countryFilter1;
    } else if (!countryFilter1 && countryFilter2) {
        filters.country1 = countryFilter2;
        filters.country2 = countryFilter2;
    } else if (!countryFilter1 && !countryFilter2) {
        filters.country1 = "Canada";
        filters.country2 = "United States";
    }
    console.log(filters);

    // Call function to apply filter and build the line charts
    lineCharts();
}
// function to update filters - new case/deaths
function updateFilters2() {

    // Save the element, value, and id of the filters that were changed
    //NEW**MK
    let countryFilter3 = d3.select("#selCountry3").property("value");
    let countryFilter4 = d3.select("#selCountry4").property("value");

    // If a filter value was entered then add that filterId and value
    // to the filters list. Otherwise, clear that filter from the filters object
    //NEW**MK   
    if (countryFilter3 && countryFilter4) {
        filters.country3 = countryFilter3;
        filters.country4 = countryFilter4;
    } else if (countryFilter3 && !countryFilter4) {
        filters.country3 = countryFilter3;
        filters.country4 = countryFilter3;
    } else if (!countryFilter3 && countryFilter4) {
        filters.country3 = countryFilter4;
        filters.country4 = countryFilter4;
    } else if (!countryFilter3 && !countryFilter4) {
        filters.country3 = "1. Global Average";
        filters.country4 = "United States";
    }
    console.log(filters);

    // Call function to apply filter and build the line charts
    rampUpCharts();
}

function lineCharts() {
    // Line charts: dates as x-axis, cases or deaths as y-axis
    d3.json("data/countryCounts.json").then((data) => {

        var filteredData = data.counts;

        // Loop through all of the filters and keep any data that
        // matches the filter values
        Object.keys(filters).forEach((key) => {
            if (key === "country1") {
                filteredData1 = filteredData.filter(country => country.country_name === filters[key]);
            }
            if (key === "country2") {
                filteredData2 = filteredData.filter(country => country.country_name === filters[key]);
            }
        });

        // Chosen countries
        // Assign counts data to variables
        var name1 = filteredData1[0].country_name;
        var dates1 = filteredData1[0].dates;
        var newCases1 = filteredData1[0].new_cases;
        var totCases1 = filteredData1[0].total_cases;
        var newDeaths1 = filteredData1[0].new_deaths;
        var totDeaths1 = filteredData1[0].total_deaths;

        var name2 = filteredData2[0].country_name;
        var dates2 = filteredData2[0].dates;
        var newCases2 = filteredData2[0].new_cases;
        var totCases2 = filteredData2[0].total_cases;
        var newDeaths2 = filteredData2[0].new_deaths;
        var totDeaths2 = filteredData2[0].total_deaths;

        // Line Chart: New Cases
        var newCases_country1 = {
            x: dates1,
            y: newCases1,
            name: name1,
            type: "scatter",
            line: {
                color: "rgb(178,28,43)"
            }
        };
        var newCases_country2 = {
            x: dates2,
            y: newCases2,
            name: name2,
            type: "scatter",
            line: {
                color: "rgb(67,147,195)"
            }
        };
                
        countryData_newCases = [newCases_country1, newCases_country2];

        var layoutChart_newCases = {
            title: "New Cases",
            titlefont: {
                size: 25
            },
            xaxis: {
                showgrid: false,
                tickcolor: "#FFFFFF",
                title: {
                    text: "Date",
                    font: {
                        size: 18
                    }
                }
            },
            yaxis: {
                showline: true,
                showgrid: false,
                tickcolor: "#FFFFFF",
                title: {
                    text: "Number of New Cases",
                    font: {
                        size: 18
                    }
                }
            },
            width: 500,
            height: 400,
            plot_bgcolor: "rgba(0, 0, 0, 0)",
            paper_bgcolor: "rgba(0, 0, 0, 0)",
            font: {
                size: 13,
                color: '#FFFFFF'
            }
        };
        
        Plotly.newPlot("lineNewCases", countryData_newCases, layoutChart_newCases, {displayModeBar: false});
        
        // Total Cases Chart
        totCases_country1 = {
            x: dates1,
            y: totCases1,
            name: name1,
            type: "scatter",
            line: {
                color: "rgb(178,28,43)"
            }
        };
        totCases_country2 = {
            x: dates2,
            y: totCases2,
            name: name2,
            type: "scatter",
            line: {
                color: "rgb(67,147,195)"
            }
        };
        
        countryData_totCases = [totCases_country1, totCases_country2];

        var layoutChart_totCases = {
            title: "Total Cases",
            titlefont: {
                size: 25
            },
            xaxis: {
                showgrid: false,
                tickcolor: "#FFFFFF",
                title: {
                    text: "Date",
                    font: {
                        size: 18
                    }
                }
            },
            yaxis: {
                showline: true,
                showgrid: false,
                tickcolor: "#FFFFFF",
                title: {
                    text: "Number of Total Cases",
                    font: {
                        size: 18
                    }
                }
            },
            width: 500,
            height: 400,
            plot_bgcolor: "rgba(0, 0, 0, 0)",
            paper_bgcolor: "rgba(0, 0, 0, 0)",
            font: {
                size: 13,
                color: '#FFFFFF'
            }
        };
        
        Plotly.newPlot("lineTotalCases", countryData_totCases, layoutChart_totCases, {displayModeBar: false});
        
        // New Deaths Chart
        newDeaths_country1 = {
            x: dates1,
            y: newDeaths1,
            name: name1,
            type: "scatter",
            line: {
                color: "rgb(178,28,43)"
            }
        };
        newDeaths_country2 = {
            x: dates2,
            y: newDeaths2,
            name: name2,
            type: "scatter",
            line: {
                color: "rgb(67,147,195)"
            }
        };

        countryData_newDeaths = [newDeaths_country1, newDeaths_country2];

        var layoutChart_newDeaths = {
            title: "New Deaths",
            titlefont: {
                size: 25
            },
            xaxis: {
                showgrid: false,
                tickcolor: "#FFFFFF",
                title: {
                    text: "Date",
                    font: {
                        size: 18
                    }
                }
            },
            yaxis: {
                showline: true,
                showgrid: false,
                tickcolor: "#FFFFFF",
                title: {
                    text: "Number of New Deaths",
                    font: {
                        size: 18
                    }
                }
            },
            width: 500,
            height: 400,
            plot_bgcolor: "rgba(0, 0, 0, 0)",
            paper_bgcolor: "rgba(0, 0, 0, 0)",
            font: {
                size: 13,
                color: '#FFFFFF'
            }
        };

        Plotly.newPlot("lineNewDeaths", countryData_newDeaths, layoutChart_newDeaths, {displayModeBar: false});
        
        // Total Deaths Chart
        totDeaths_country1 = {
            x: dates1,
            y: totDeaths1,
            name: name1,
            type: "scatter",
            line: {
                color: "rgb(178,28,43)"
            }
        };
        totDeaths_country2 = {
            x: dates2,
            y: totDeaths2,
            name: name2,
            type: "scatter",
            line: {
                color: "rgb(67,147,195)"
            }
        };

        countryData_totDeaths = [totDeaths_country1, totDeaths_country2];

        var layoutChart_totDeaths = {
            title: "Total Deaths",
            titlefont: {
                size: 25
            },
            xaxis: {
                showgrid: false,
                tickcolor: "#FFFFFF",
                title: {
                    text: "Date",
                    font: {
                        size: 18
                    }
                }
            },
            yaxis: {
                showline: true,
                showgrid: false,
                tickcolor: "#FFFFFF",
                title: {
                    text: "Number of Total Deaths",
                    font: {
                        size: 18
                    }
                }
            },
            width: 500,
            height: 400,
            plot_bgcolor: "rgba(0, 0, 0, 0)",
            paper_bgcolor: "rgba(0, 0, 0, 0)",
            font: {
                size: 13,
                color: '#FFFFFF'
            }
        };

        Plotly.newPlot("lineTotalDeaths", countryData_totDeaths, layoutChart_totDeaths, {displayModeBar: false});
    });
}
// Attach an event to listen for changes to the filter
d3.selectAll("#submit1-btn").on("click", updateFilters1);

function rampUpCharts() {
    // Line charts: dates as x-axis, cases or deaths as y-axis
    d3.json("data/rampUpCounts1.json").then((data) => {
        console.log(data);

        var filteredData = data.counts;
        console.log(filteredData);

        // Loop through all of the filters and keep any data that
        // matches the filter values
        Object.keys(filters).forEach((key) => {
            if (key === "country3") {
                filteredData1 = filteredData.filter(country => country.country_name === filters[key]);
                console.log(filteredData1);
            }
            if (key === "country4") {
                filteredData2 = filteredData.filter(country => country.country_name === filters[key]);
                console.log(filteredData2);
            }
        });

        // Chosen countries
        // Assign counts data to variables
        var name1 = filteredData1[0].country_name;
        var minStringency1 = filteredData1[0].min_stringency;
        var maxStringency1 = filteredData1[0].max_stringency;
        var rampStart1 = filteredData1[0].ramp_start;
        var rampEnd1 = filteredData1[0].ramp_end;
        var rampLength1 = filteredData1[0].ramp_length;
        var thirtyDays1 = filteredData1[0].thirty_days;
        var sixtyDays1 = filteredData1[0].sixty_days;
        var ninetyDays1 = filteredData1[0].ninety_days;
        var oneTwentyDays1 = filteredData1[0].one_twenty_days;
        var percentPopCasesBeg1 = filteredData1[0].percent_pop_cases_beg;
        var percentPopCases301 = filteredData1[0].percent_pop_cases_30;
        var percentPopCases601 = filteredData1[0].percent_pop_cases_60;
        var percentPopCases901 = filteredData1[0].percent_pop_cases_90;
        var percentPopCases1201 = filteredData1[0].percent_pop_cases_120;
        var percentPopDeathsBeg1 = filteredData1[0].percent_pop_deaths_beg;
        var percentPopDeaths301 = filteredData1[0].percent_pop_deaths_30;
        var percentPopDeaths601 = filteredData1[0].percent_pop_deaths_60;
        var percentPopDeaths901 = filteredData1[0].percent_pop_deaths_90;
        var percentPopDeaths1201 = filteredData1[0].percent_pop_deaths_120;

        var name2 = filteredData2[0].country_name;
        var minStringency2 = filteredData2[0].min_stringency;
        var maxStringency2 = filteredData2[0].max_stringency;
        var rampStart2 = filteredData2[0].ramp_start;
        var rampEnd2 = filteredData2[0].ramp_end;
        var rampLength2 = filteredData2[0].ramp_length;
        var thirtyDays2 = filteredData2[0].thirty_days;
        var sixtyDays2 = filteredData2[0].sixty_days;
        var ninetyDays2 = filteredData2[0].ninety_days;
        var oneTwentyDays2 = filteredData2[0].one_twenty_days;
        var percentPopCasesBeg2 = filteredData2[0].percent_pop_cases_beg;
        var percentPopCases302 = filteredData2[0].percent_pop_cases_30;
        var percentPopCases602 = filteredData2[0].percent_pop_cases_60;
        var percentPopCases902 = filteredData2[0].percent_pop_cases_90;
        var percentPopCases1202 = filteredData2[0].percent_pop_cases_120;
        var percentPopDeathsBeg2 = filteredData2[0].percent_pop_deaths_beg;
        var percentPopDeaths302 = filteredData2[0].percent_pop_deaths_30;
        var percentPopDeaths602 = filteredData2[0].percent_pop_deaths_60;
        var percentPopDeaths902 = filteredData2[0].percent_pop_deaths_90;
        var percentPopDeaths1202 = filteredData2[0].percent_pop_deaths_120;
        
        // Set the x & y axis for ramp up
        var xAxisStringency1 = rampStart1.concat(rampEnd1);
        var xAxisStringency2 = rampStart2.concat(rampEnd2);
        var yAxisStringency1 = minStringency1.concat(maxStringency1); 
        var yAxisStringency2 = minStringency2.concat(maxStringency2);      
        
        // Set the x & y axis for total cases
        var xAxisCases1 = rampStart1.concat(thirtyDays1, sixtyDays1, ninetyDays1, oneTwentyDays1);
        var xAxisCases2 = rampStart2.concat(thirtyDays2, sixtyDays2, ninetyDays2, oneTwentyDays2);
        var yAxisCases1 = percentPopCasesBeg1.concat(percentPopCases301, percentPopCases601, percentPopCases901, percentPopCases1201);
        var yAxisCases2 = percentPopCasesBeg2.concat(percentPopCases302, percentPopCases602, percentPopCases902, percentPopCases1202);
        
        // Set the x & y axis for total deaths
        var xAxisDeaths1 = rampStart1.concat(thirtyDays1, sixtyDays1, ninetyDays1, oneTwentyDays1);
        var xAxisDeaths2 = rampStart2.concat(thirtyDays2, sixtyDays2, ninetyDays2, oneTwentyDays2);
        var yAxisDeaths1 = percentPopDeathsBeg1.concat(percentPopDeaths301, percentPopDeaths601, percentPopDeaths901, percentPopDeaths1201);
        var yAxisDeaths2 = percentPopDeathsBeg2.concat(percentPopDeaths302, percentPopDeaths602, percentPopDeaths902, percentPopDeaths1202);

        // Total Cases Chart
        var rampUp_country1 = {
            x: xAxisStringency1,
            y: yAxisStringency1,
            name: name1 + " - Ramp Up",
            fill: 'tonexty',
            type: "scatter",
            line: {
                color: "rgb(178,28,43)"
            }
        };
        var rampUp_country2 = {
            x: xAxisStringency2,
            y: yAxisStringency2,
            name: name2 + " - Ramp Up",
            fill: 'tonexty',
            yaxis: 'y2',
            type: "scatter",
            line: {
                color: "rgb(67,147,195)"
            }
        };
        var totCases_country1 = {
            x: xAxisCases1,
            y: yAxisCases1,
            name: name1 + " - Total Cases",
            yaxis: 'y3',
            type: "scatter",
            line: {
                color: "rgb(178,28,43)"
            }
        };
        var totCases_country2 = {
            x: xAxisCases2,
            y: yAxisCases2,
            name: name2 + " - Total Cases",
            yaxis: 'y4',
            type: "scatter",
            line: {
                color: "rgb(67,147,195)"
            }
        };
        var countryData_totCases1 = [totCases_country2, totCases_country1, rampUp_country2, rampUp_country1];

        var layoutChart_totCases1 = {
            title: "Ramp Up with Total Cases",
            showlegend: true,
            legend: {
                x: 0.1,
                y: -0.6
            },
            titlefont: {
                size: 25
            },
            xaxis: {
                showgrid: false,
                tickcolor: "#FFFFFF",
            },
            yaxis: {
                showline: true,
                showgrid: false,
                tickcolor: "#FFFFFF",
                range: [0,100],
                title: {
                    text: "Stringency Index",
                    font: {
                        size: 20
                    }
                }
            },
            yaxis2: {
                showline: true,
                showgrid: false,
                tickcolor: "#FFFFFF",
                range: [0,100],
                side: "left",
                overlaying: 'y',
                anchor: 'free'
            },
            yaxis3: {
                showline: true,
                showgrid: false,
                tickcolor: "#FFFFFF",
                side: "right",
                overlaying: 'y',
                range: [0,5],
                title: {
                    text: "% of Population",
                    font: {
                        size: 20
                    }
                },
                anchor: 'x'
            },
            yaxis4: {
                showline: true,
                showgrid: false,
                tickcolor: "#FFFFFF",
                side: "right",
                anchor: 'x',
                range: [0,5],
                overlaying: 'y',
            },
            width: 525,
            height: 425,
            plot_bgcolor: "rgba(0, 0, 0, 0)",
            paper_bgcolor: "rgba(0, 0, 0, 0)",
            font: {
                color: '#FFFFFF'
            }
        };
        
        Plotly.newPlot("rampUpCases", countryData_totCases1, layoutChart_totCases1,{displayModeBar: false});
        
        // Total Deaths Chart
        var rampUp_country1 = {
            x: xAxisStringency1,
            y: yAxisStringency1,
            name: name1 + " - Ramp Up",
            fill: 'tonexty',
            type: "scatter",
            line: {
                color: "rgb(178,28,43)"
            }
        };
        var rampUp_country2 = {
            x: xAxisStringency2,
            y: yAxisStringency2,
            name: name2 + " - Ramp Up",
            fill: 'tonexty',
            yaxis: 'y2',
            type: "scatter",
            line: {
                color: "rgb(67,147,195)"
            }
        };
        var totDeaths_country1 = {
            x: xAxisDeaths1,
            y: yAxisDeaths1,
            name: name1 + " - Total Deaths",
            yaxis: 'y3',
            type: "scatter",
            line: {
                color: "rgb(178,28,43)"
            }
        };
        var totDeaths_country2 = {
            x: xAxisDeaths2,
            y: yAxisDeaths2,
            name: name2 + " - Total Deaths",
            yaxis: 'y4',
            type: "scatter",
            line: {
                color: "rgb(67,147,195)"
            }
        };
        var countryData_totDeaths1 = [totDeaths_country2, totDeaths_country1, rampUp_country2, rampUp_country1];

        var layoutChart_totDeaths1 = {
            title: "Ramp Up with Total Deaths",
            showlegend: true,
            legend: {
                x: 0.1,
                y: -0.6
            },
            titlefont: {
                size: 25
            },
            xaxis: {
                showgrid: false,
                tickcolor: "#FFFFFF",
            },
            yaxis: {
                showline: true,
                showgrid: false,
                tickcolor: "#FFFFFF",
                range: [0,100],
                title: {
                    text: "Stringency Index",
                    font: {
                        size: 20
                    }
                }
            },
            yaxis2: {
                showline: true,
                showgrid: false,
                tickcolor: "#FFFFFF",
                range: [0,100],
                side: "left",
                overlaying: 'y',
                anchor: 'free'
            },
            yaxis3: {
                showline: true,
                showgrid: false,
                tickcolor: "#FFFFFF",
                side: "right",
                overlaying: 'y',
                range: [0,0.09],
                title: {
                    text: "% of Population",
                    font: {
                        size: 20
                    }
                },
                anchor: 'x'
            },
            yaxis4: {
                showline: true,
                showgrid: false,
                tickcolor: "#FFFFFF",
                side: "right",
                anchor: 'x',
                range: [0,0.09],
                overlaying: 'y',
            },
            width: 525,
            height: 425,
            plot_bgcolor: "rgba(0, 0, 0, 0)",
            paper_bgcolor: "rgba(0, 0, 0, 0)",
            font: {
                color: '#FFFFFF'
            }
        };
        Plotly.newPlot("rampUpDeaths", countryData_totDeaths1, layoutChart_totDeaths1,{displayModeBar: false});
    });
}

// Attach an event to listen for changes to the filter
d3.selectAll("#submit2-btn").on("click", updateFilters2);

//--------------------------------------MapResponse------------------------------------------
function buildMapResponse() {

    // Create tile layers that will be background options for the map
    let dark = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/dark-v10/tiles/{z}/{x}/{y}?access_token={accessToken}", {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        accessToken: API_KEY
    });

    let light = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/light-v10/tiles/{z}/{x}/{y}?access_token={accessToken}", {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        accessToken: API_KEY
    });

    // Create a base layer that holds all tile layers
    let baseMaps = {
        "Dark": dark,
        "Light": light
    };

    // Create overlay layers for the map
    let govResp = new L.layerGroup();
    let string = new L.layerGroup();
    let health = new L.layerGroup();
    let econ = new L.layerGroup();

    let overlays = {
        "Government Response (G)": govResp,
        "Stringency (S)": string,
        "Containment/Health (H)": health,
        "Economic Support (E)": econ
    };

    // Create a map object with a center & zoom level
    let map = L.map("mapResponse", {
        center: [40.52, -0.34],
        zoom: 1.5,
        layers: [dark]
    });

    // Pass map layers into our layers control & add the layers control to the map
    L.control.layers(baseMaps, overlays).addTo(map);

    // Access data
    let countriesData = "data/countriesIndices.json";

    // Gov Resp
    // Function returns style data for the overlay layer
    function styleInfo_govResp(feature) {
        return {
            opacity: 1,
            fillOpacity: 0.8,
            fillColor: getColor_govResp(feature.properties.govResp_index),
            color: "#000000",
            stroke: true,
            weight: 0.5
        };
    }
    // Function determines circle color based on index score
    function getColor_govResp(index) {
        if (index > 80) {
            return "rgb(103,0,31,0.9)";
        }
        if (index > 60) {
            return "rgb(178,24,43,0.9)";
        }
        if (index > 40) {
            return "rgb(214,96,77,0.9)";
        }
        if (index > 20) {
            return "rgb(244,165,130,0.9)";
        }
        if (index >= 0) {
            return "rgb(253,219,199,0.9)";
        }
    }
    // String
    // Function returns style data for the overlay layer
    function styleInfo_string(feature) {
        return {
            opacity: 1,
            fillOpacity: 0.6,
            fillColor: getColor_string(feature.properties.string_index),
            color: "#000000",
            stroke: true,
            weight: 0.5
        };
    }
    // Function determines circle color based on index score
    function getColor_string(index) {
        if (index > 80) {
            return "rgb(253,141,60)";
        }
        if (index > 60) {
            return "rgb(254,178,76)";
        }
        if (index > 40) {
            return "rgb(254,217,118)";
        }
        if (index > 20) {
            return "rgb(255,237,160)";
        }
        if (index >= 0) {
            return "rgb(255,255,204)";
        }
    }
    // Health
    // Function returns style data for the overlay layer
    function styleInfo_health(feature) {
        return {
            opacity: 1,
            fillOpacity: 0.7,
            fillColor: getColor_health(feature.properties.health_index),
            color: "#000000",
            stroke: true,
            weight: 0.8
        };
    }
    // Function determines circle color based on index score
    function getColor_health(index) {
        if (index > 80) {
            return "rgb(0,109,44)";
        }
        if (index > 60) {
            return "rgb(35,139,69)";
        }
        if (index > 40) {
            return "rgb(65,171,93)";
        }
        if (index > 20) {
            return "rgb(116,196,118)";
        }
        if (index >= 0) {
            return "rgb(161,217,155)";
        }
    }
    // Econ
    // Function returns style data for the overlay layer
    function styleInfo_econ(feature) {
        return {
            opacity: 1,
            fillOpacity: 0.7,
            fillColor: getColor_econ(feature.properties.econ_index),
            color: "#000000",
            stroke: true,
            weight: 0.5
        };
    }
    // Function determines circle color based on index score
    function getColor_econ(index) {
        if (index > 80) {
            return "rgb(5,48,97,0.95)";
        }
        if (index > 60) {
            return "rgb(33,102,172,0.95)";
        }
        if (index > 40) {
            return "rgb(67,147,195,0.95)";
        }
        if (index > 20) {
            return "rgb(146,197,222,0.95)";
        }
        if (index >= 0) {
            return "rgb(209,229,240,0.95)";
        }
    }

    // Grab the JSON data
    d3.json(countriesData).then(function(data) {
        // Create a JSON layer with the retrieved data
        L.geoJson(data, {
            
            // Set style for each feature's layer using styleInfo function
            style: styleInfo_govResp,
            // Create popup
            onEachFeature: function(feature, layer) {
                layer.bindPopup("<h4>" + feature.properties.name + "</h4>"
                + "G Index Score: " + feature.properties.govResp_index + "/100<br>"
                + "G Ranking: " + feature.properties.govResp_rank + "th out of 179 countries<br>"
                + "G Percentile: " + feature.properties.govResp_percentile
                );
            }
        }).addTo(govResp);

        L.geoJson(data, {
            
            // Set style for each feature's layer using styleInfo function
            style: styleInfo_string,
            // Create popup
            onEachFeature: function(feature, layer) {
                layer.bindPopup("<h4>" + feature.properties.name + "</h4>"
                + "S Index Score: " + feature.properties.string_index + "/100<br>"
                + "S Ranking: " + feature.properties.string_rank + "th out of 179 countries<br>"
                + "S Percentile: " + feature.properties.string_percentile
                );
            }
        }).addTo(string);

        L.geoJson(data, {
            
            // Set style for each feature's layer using styleInfo function
            style: styleInfo_health,
            // Create popup
            onEachFeature: function(feature, layer) {
                layer.bindPopup("<h4>" + feature.properties.name + "</h4>"
                + "H Index Score: " + feature.properties.health_index + "/100<br>"
                + "H Ranking: " + feature.properties.health_rank + "th out of 179 countries<br>"
                + "H Percentile: " + feature.properties.health_percentile
                );
            }
        }).addTo(health);

        L.geoJson(data, {
            
            // Set style for each feature's layer using styleInfo function
            style: styleInfo_econ,
            // Create popup
            onEachFeature: function(feature, layer) {
                layer.bindPopup("<h4>" + feature.properties.name + "</h4>"
                + "E Index Score: " + feature.properties.econ_index + "/100<br>"
                + "E Ranking: " + feature.properties.econ_rank + "th out of 160 countries<br>"
                + "E Percentile: " + feature.properties.econ_percentile
                );
            }
        }).addTo(econ);

        // Add countries layer to the map
        govResp.addTo(map);
    });
};

// -------------------index descriptions & charts------------------------
// Charts according to dropdown selection
function buildWorldCharts(choice) {
    
     d3.json("data/indexSelections.json").then((data) => {
        var indices = data.indices;
        // Filter so data is only the selected data
        let resultArray = indices.filter(indicesObj => indicesObj.index == choice);
        let result = resultArray[0];

        // index descriptions
        var card_header = d3.select("#index-name");
        var card_descript = d3.select("#index-description");

        card_header.html("");
        card_header.append("h5").text(result.index);

        card_descript.html("");
        card_descript.append("p").text(result.indexDescription);

        // Top 5 Countries
        // Assign index data to variables
        var indexValues_top5 = result.values.slice(0,5);
        var countryNames_top5 = result.country_names.slice(0,5);
        
        // Horiz bar chart
        var dataBar = [{
            type: "bar",
            x: indexValues_top5,
            y: countryNames_top5,
            text: countryNames_top5,
            orientation: "h",
            marker: {
                color: ["rgb(103,0,31)", "rgb(178,24,43)", "rgb(214,96,77)", "rgb(244,165,130)", 
            "rgb(253,219,199)"],
                opacity: 0.9
            }
        }];

        var layoutBar = {
            title: "Top 5 Countries",
            titlefont: {
                size: 25
            },
            xaxis: {
                title: {
                    text: "Index Score",
                    font: {
                        size: 18
                    }
                },
                gridcolor: "#7B7B7B",
                tickcolor: "#FFFFFF",
                dtick: 25,
                range: [0,100]
            },
            yaxis: {
                autorange: "reversed",
                tickcolor: "#FFFFFF"
            },
            plot_bgcolor: "rgba(0, 0, 0, 0)",
            paper_bgcolor: "rgba(0, 0, 0, 0)",
            font: {
                size: 11,
                color: '#FFFFFF'
            },
            width: 350,
            height: 350
        };

        Plotly.newPlot("barTop5", dataBar, layoutBar, {displayModeBar: false});

        // Bottom 5 Countries
        // Assign index data to variables
        var indexValues_bott5 = result.values.slice(-6,-1);
        var countryNames_bott5 = result.country_names.slice(-6,-1);
        
        // Horiz bar chart
        var dataBar = [{
            type: "bar",
            x: indexValues_bott5,
            y: countryNames_bott5,
            text: countryNames_bott5,
            orientation: "h",
            marker: {
                color: ["rgb(209,229,240)", "rgb(146,197,222)", "rgb(67,147,195)", "rgb(33,102,172)", 
            "rgb(5,48,97)"],
                opacity: 0.9
            }
        }];

        var layoutBar = {
            title: "Bottom 5 Countries",
            titlefont: {
                size: 25
            },
            xaxis: {
                title: {
                    text: "Index Score",
                    font: {
                        size: 18
                    }
                },
                gridcolor: "#7B7B7B",
                tickcolor: "#FFFFFF"
            },
            yaxis: {
                autorange: "reversed",
                tickcolor: "#FFFFFF"
            },
            plot_bgcolor: "rgba(0, 0, 0, 0)",
            paper_bgcolor: "rgba(0, 0, 0, 0)",
            font: {
                size: 11,
                color: '#FFFFFF'
            },
            width: 350,
            height: 350
        };

        Plotly.newPlot("barBottom5", dataBar, layoutBar, {displayModeBar: false});
    
    });
};

// When user selects index from dropdown, activate these functions
function indexChanged(newChoice) {
    buildWorldCharts(newChoice);
};

//---------------------------------heatmap----------------------------------------------------
function buildHeatmap() {
    d3.json("data/heatmapData.json").then((heatmapData) => {
        var z_data = heatmapData.z;
        var x_data = heatmapData.x;
        var y_data = heatmapData.y;

        var data = [
            {
            z: z_data,
            x: x_data,
            y: y_data,
            type: 'heatmap',
            hoverongaps: false,
            colorscale: "RdBu"
            }
        ];
        var layout = {
            annotations: [],
            width: 850,
            height: 600,
            xaxis: {
                tickcolor: "#FFFFFF",
                tickangle: 45,
                automargin: true,
                showgrid: false
            },
            yaxis: {
                tickcolor: "#FFFFFF",
                automargin: true,
                showgrid: false
            },
            plot_bgcolor: "rgba(0, 0, 0, 0)",
            paper_bgcolor: "rgba(0, 0, 0, 0)",
            font: {
                size: 13,
                color: '#FFFFFF'
            }
        };
        for (var i = 0; i < y_data.length; i++) {
            for (var j = 0; j < x_data.length; j++) {
                var currentValue = z_data[i][j];
                if (Math.abs(currentValue) > 0.2) {
                    var textColor = "white";
                }
                else if (currentValue == "nan") {
                    var textColor = "#373737";
                } else {
                    var textColor = 'black';
                }
                var result = {
                    xref: 'x1',
                    yref: 'y1',
                    x: x_data[j],
                    y: y_data[i],
                    text: z_data[i][j],
                    font: {
                        color: textColor,
                        family: 'Arial',
                        size: 13
                    },
                    showarrow: false
                };
                layout.annotations.push(result);
            }
        }
    Plotly.newPlot('heatmap', data, layout, {displayModeBar: false});
    });
}

//---------------------------------mapClasses-------------------------------------------------
function buildMapClasses() {

    // Create tile layers that will be background options for the map
    let dark = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/dark-v10/tiles/{z}/{x}/{y}?access_token={accessToken}", {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        accessToken: API_KEY
    });
   
    let light = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/light-v10/tiles/{z}/{x}/{y}?access_token={accessToken}", {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        accessToken: API_KEY
    });

    // Create a base layer that holds all tile layers
    let baseMaps = {
        "Dark": dark,
        "Light": light
    };

    // Create classes layers for the map
    let class0 = new L.layerGroup();
    let class1 = new L.layerGroup();
    let class2 = new L.layerGroup();

    let overlays = {
        "Class 0": class0,
        "Class 1": class1,
        "Class 2": class2,
    };

    // Create a map object with a center & zoom level
    let map = L.map("mapClasses", {
        center: [50.52, 5.34],
        zoom: 1.5,
        layers: [dark]
    });

    // Pass map layers into our layers control & add the layers control to the map
    L.control.layers(baseMaps, overlays).addTo(map);

    // Access data
    let countryClass0 = "data/countryClass0.json";
    let countryClass1 = "data/countryClass1.json";
    let countryClass2 = "data/countryClass2.json";

    // Function returns style data for the overlay layers
    function styleInfo_class0() {
        return {
            opacity: 1,
            fillOpacity: 0.6,
            fillColor: "rgb(214,96,77)",
            color: "#000000",
            stroke: true,
            weight: 1
        };
    }
    function styleInfo_class1() {
        return {
            opacity: 1,
            fillOpacity: 0.8,
            fillColor: "rgb(244,165,130)",
            color: "#000000",
            stroke: true,
            weight: 1
        };
    }
    function styleInfo_class2() {
        return {
            opacity: 1,
            fillOpacity: 0.6,
            fillColor: "rgb(178,24,43)",
            color: "#000000",
            stroke: true,
            weight: 1
        };
    }

    // Grab the JSON data
    d3.json(countryClass0).then(function(data) {
        // Create a JSON layer with the retrieved data
        L.geoJson(data, {
            
            // Set style for each feature's layer using styleInfo function
            style: styleInfo_class0,
            // Create popup
            onEachFeature: function(feature, layer) {
                layer.bindPopup("<h4>" + feature.properties.name + "</h4>"
                + feature.properties.class);
            }
        }).addTo(class0);
        // Add class0 layer to the map
        class0.addTo(map);
    });

    // Grab the JSON data
    d3.json(countryClass1).then(function(data) {
        // Create a JSON layer with the retrieved data
        L.geoJson(data, {
            // Set style for each feature's layer using styleInfo function
            style: styleInfo_class1,
            // Create popup
            onEachFeature: function(feature, layer) {
                layer.bindPopup("<h4>" + feature.properties.name + "</h4>"
                + feature.properties.class);
            }
        }).addTo(class1);
        // Add class1 layer to the map
        class1.addTo(map);
    });

    // Grab the JSON data
    d3.json(countryClass2).then(function(data) {
        // Create a JSON layer with the retrieved data
        L.geoJson(data, {
            // Set style for each feature's layer using styleInfo function
            style: styleInfo_class2,
            // Create popup
            onEachFeature: function(feature, layer) {
                layer.bindPopup("<h4>" + feature.properties.name + "</h4>"
                + feature.properties.class);
            }
        }).addTo(class2);
        // Add class2 layer to the map
        class2.addTo(map);
    });
}

function buildBoxplots() {
    d3.json("data/boxplots.json").then((boxplotsData) => {
        var GR_C0_y = boxplotsData.GR_C0_y;
        var GR_C1_y = boxplotsData.GR_C1_y;
        var GR_C2_y = boxplotsData.GR_C2_y;

        var age_C0_y = boxplotsData.age_C0_y;
        var age_C1_y = boxplotsData.age_C1_y;
        var age_C2_y = boxplotsData.age_C2_y;

        var mob_C0_y = boxplotsData.mobil_C0_y;
        var mob_C1_y = boxplotsData.mobil_C1_y;
        var mob_C2_y = boxplotsData.mobil_C2_y;

        var firstNCMaxND_C0_y = boxplotsData.firstNCMaxND_C0_y;
        var firstNCMaxND_C1_y = boxplotsData.firstNCMaxND_C1_y;
        var firstNCMaxND_C2_y = boxplotsData.firstNCMaxND_C2_y;

        var maxND_C0_y = boxplotsData.maxND_C0_y;
        var maxND_C1_y = boxplotsData.maxND_C1_y;
        var maxND_C2_y = boxplotsData.maxND_C2_y;

        var TC3MO_C0_y = boxplotsData.TC3MO_C0_y;
        var TC3MO_C1_y = boxplotsData.TC3MO_C1_y;
        var TC3MO_C2_y = boxplotsData.TC3MO_C2_y;

    // GR
    var trace1 = {
        y: GR_C0_y,
        type: "box",
        name: 'Class 0',
        marker: {
            color: "rgb(214,96,77)"
        },
        boxpoints: 'all',
        boxmean: true
    };

    var trace2 = {
        y: GR_C1_y,
        type: "box",
        name: 'Class 1',
        marker: {
            color: "rgb(244,165,130)"
        },
        boxpoints: 'all',
        boxmean: true
    };

    var trace3 = {
        y: GR_C2_y,
        type: "box",
        name: 'Class 2',
        marker: {
            color: "rgb(178,24,43)"
        },
        boxpoints: 'all',
        boxmean: true
    };

    var data = [trace1, trace2, trace3];

    var layout = {
        title: "Government Response Index",
        titlefont: {
            size: 22
        },
        width: 475,
        height: 375,
        plot_bgcolor: "rgba(0, 0, 0, 0)",
        paper_bgcolor: "rgba(0, 0, 0, 0)",
        font: {
            size: 15,
            color: '#FFFFFF'
        },
        yaxis: {
            gridcolor: "#000000"
        }
    };

    Plotly.newPlot("boxplot_GR", data, layout, {displayModeBar: false});

    // Age
    var trace4 = {
        y: age_C0_y,
        type: "box",
        name: 'Class 0',
        marker: {
            color: "rgb(214,96,77)"
        },
        boxpoints: 'all',
        boxmean: true
    };

    var trace5 = {
        y: age_C1_y,
        type: "box",
        name: 'Class 1',
        marker: {
            color: "rgb(244,165,130)"
        },
        boxpoints: 'all',
        boxmean: true
    };

    var trace6 = {
        y: age_C2_y,
        type: "box",
        name: 'Class 2',
        marker: {
            color: "rgb(178,24,43)"
        },
        boxpoints: 'all',
        boxmean: true
    };

    var data = [trace4, trace5, trace6];

    var layout = {
        title: "Median Age",
        titlefont: {
            size: 22
        },
        width: 475,
        height: 375,
        plot_bgcolor: "rgba(0, 0, 0, 0)",
        paper_bgcolor: "rgba(0, 0, 0, 0)",
        font: {
            size: 15,
            color: '#FFFFFF'
        },
        yaxis: {
            gridcolor: "#000000"
        }
    };

    Plotly.newPlot("boxplot_age", data, layout, {displayModeBar: false});

    // Mobility: outdoors
    var trace7 = {
        y: mob_C0_y,
        type: "box",
        name: 'Class 0',
        marker: {
            color: "rgb(214,96,77)"
        },
        boxpoints: 'all',
        boxmean: true
    };

    var trace8 = {
        y: mob_C1_y,
        type: "box",
        name: 'Class 1',
        marker: {
            color: "rgb(244,165,130)"
        },
        boxpoints: 'all',
        boxmean: true
    };

    var trace9 = {
        y: mob_C2_y,
        type: "box",
        name: 'Class 2',
        marker: {
            color: "rgb(178,24,43)"
        },
        boxpoints: 'all',
        boxmean: true
    };

    var data = [trace7, trace8, trace9];

    var layout = {
        title: "Mobility (Non-Residential)",
        titlefont: {
            size: 22
        },
        width: 475,
        height: 375,
        plot_bgcolor: "rgba(0, 0, 0, 0)",
        paper_bgcolor: "rgba(0, 0, 0, 0)",
        font: {
            size: 15,
            color: '#FFFFFF'
        },
        yaxis: {
            gridcolor: "#000000"
        }
    };

    Plotly.newPlot("boxplot_mobil", data, layout, {displayModeBar: false});

    // First NC To Max ND
    var trace10 = {
        y: firstNCMaxND_C0_y,
        type: "box",
        name: 'Class 0',
        marker: {
            color: "rgb(214,96,77)"
        },
        boxpoints: 'all',
        boxmean: true
    };

    var trace11 = {
        y: firstNCMaxND_C1_y,
        type: "box",
        name: 'Class 1',
        marker: {
            color: "rgb(244,165,130)"
        },
        boxpoints: 'all',
        boxmean: true
    };

    var trace12 = {
        y: firstNCMaxND_C2_y,
        type: "box",
        name: 'Class 2',
        marker: {
            color: "rgb(178,24,43)"
        },
        boxpoints: 'all',
        boxmean: true
    };

    var data = [trace10, trace11, trace12];

    var layout = {
        title: "Days From 1st Case to <br> Max. Number of New Deaths",
        titlefont: {
            size: 22
        },
        width: 475,
        height: 375,
        plot_bgcolor: "rgba(0, 0, 0, 0)",
        paper_bgcolor: "rgba(0, 0, 0, 0)",
        font: {
            size: 15,
            color: '#FFFFFF'
        },
        yaxis: {
            gridcolor: "#000000"
        }
    };

    Plotly.newPlot("boxplot_firstNCMaxND", data, layout, {displayModeBar: false});

    // Max ND
    var trace13 = {
        y: maxND_C0_y,
        type: "box",
        name: 'Class 0',
        marker: {
            color: "rgb(214,96,77)"
        },
        boxpoints: 'all',
        boxmean: true
    };

    var trace14 = {
        y: maxND_C1_y,
        type: "box",
        name: 'Class 1',
        marker: {
            color: "rgb(244,165,130)"
        },
        boxpoints: 'all',
        boxmean: true
    };

    var trace15 = {
        y: maxND_C2_y,
        type: "box",
        name: 'Class 2',
        marker: {
            color: "rgb(178,24,43)"
        },
        boxpoints: 'all',
        boxmean: true
    };

    var data = [trace13, trace14, trace15];

    var layout = {
        title: "Max. Number of New Deaths",
        titlefont: {
            size: 22
        },
        width: 475,
        height: 375,
        plot_bgcolor: "rgba(0, 0, 0, 0)",
        paper_bgcolor: "rgba(0, 0, 0, 0)",
        font: {
            size: 15,
            color: '#FFFFFF'
        },
        yaxis: {
            gridcolor: "#000000"
        }
    };

    Plotly.newPlot("boxplot_maxND", data, layout);

    // TC 3MO
    var trace16 = {
        y: TC3MO_C0_y,
        type: "box",
        name: 'Class 0',
        marker: {
            color: "rgb(214,96,77)"
        },
        boxpoints: 'all',
        boxmean: true
    };

    var trace17 = {
        y: TC3MO_C1_y,
        type: "box",
        name: 'Class 1',
        marker: {
            color: "rgb(244,165,130)"
        },
        boxpoints: 'all',
        boxmean: true
    };

    var trace18 = {
        y: TC3MO_C2_y,
        type: "box",
        name: 'Class 2',
        marker: {
            color: "rgb(178,24,43)"
        },
        boxpoints: 'all',
        boxmean: true
    };

    var data = [trace16, trace17, trace18];

    var layout = {
        title: "Total Cases<br>(3 Months After 1st Case)",
        titlefont: {
            size: 22
        },
        width: 475,
        height: 375,
        plot_bgcolor: "rgba(0, 0, 0, 0)",
        paper_bgcolor: "rgba(0, 0, 0, 0)",
        font: {
            size: 15,
            color: '#FFFFFF'
        },
        yaxis: {
            gridcolor: "#000000"
        }
    };

    Plotly.newPlot("boxplot_TC3MO", data, layout, {displayModeBar: false});
    });
}