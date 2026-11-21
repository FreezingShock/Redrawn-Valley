/* Valley map: the geography. Hand-keyed from approximate coordinates (degrees, [lng, lat]) so the map can be drawn and
   re-drawn in code. This is a schematic: rivers, freeways and the valley edge are placed by eye from public maps and
   are good to roughly a quarter mile, not surveyed. Pins come from assets/places.json, not from this file.
   Loaded before map.js; see DESIGN.md > Valley map. */
(function () {
  window.RVMapGeo = {
    /* Map extent. Projection is equirectangular scaled by cos(34.2 deg), 3000 units per degree of latitude. */
    bounds: { w: -118.80, e: -118.22, s: 34.10, n: 34.37, lat0: 34.2, unit: 3000 },

    /* The valley floor, clockwise from the southwest. Everything outside it is drawn as hills. */
    floor: [[-118.655, 34.168], [-118.635, 34.152], [-118.60, 34.148], [-118.565, 34.143], [-118.53, 34.140], [-118.50, 34.133],
      [-118.475, 34.128], [-118.455, 34.134], [-118.425, 34.137], [-118.395, 34.137], [-118.36, 34.133], [-118.335, 34.140],
      [-118.318, 34.158], [-118.312, 34.185], [-118.318, 34.215], [-118.335, 34.245], [-118.355, 34.265], [-118.375, 34.285],
      [-118.395, 34.302], [-118.42, 34.315], [-118.455, 34.318], [-118.49, 34.312], [-118.52, 34.298], [-118.55, 34.292],
      [-118.585, 34.28], [-118.615, 34.268], [-118.645, 34.25], [-118.66, 34.225], [-118.665, 34.195]],

    /* Water. Rivers are open lines, basins are closed shapes. */
    rivers: [
      { id: 'la', name: 'Los Angeles River', w: 3, pts: [[-118.603, 34.195], [-118.57, 34.184], [-118.535, 34.176], [-118.505, 34.170], [-118.475, 34.168], [-118.45, 34.162], [-118.425, 34.157], [-118.40, 34.150], [-118.375, 34.145], [-118.35, 34.140], [-118.33, 34.133], [-118.305, 34.125]] },
      { id: 'tj', name: 'Tujunga Wash', w: 2, pts: [[-118.378, 34.268], [-118.385, 34.245], [-118.395, 34.220], [-118.398, 34.195], [-118.396, 34.170], [-118.40, 34.150]] }
    ],
    basins: [
      { name: 'Sepulveda Basin', pts: [[-118.505, 34.162], [-118.475, 34.159], [-118.455, 34.167], [-118.460, 34.185], [-118.49, 34.190], [-118.508, 34.178]] },
      { name: 'Hansen Dam', pts: [[-118.395, 34.262], [-118.372, 34.262], [-118.362, 34.276], [-118.38, 34.286], [-118.40, 34.276]] }
    ],

    /* Roads. `shield` is the number drawn on the route; `at` is the share along the line where it sits. */
    roads: [
      { id: '101', shield: '101', at: [0.12, 0.62], pts: [[-118.665, 34.161], [-118.63, 34.163], [-118.60, 34.164], [-118.565, 34.1635], [-118.53, 34.161], [-118.50, 34.158], [-118.47, 34.1545], [-118.44, 34.1505], [-118.41, 34.1455], [-118.385, 34.1405], [-118.355, 34.135], [-118.33, 34.128], [-118.31, 34.11]] },
      { id: '405', shield: '405', at: [0.18, 0.7], pts: [[-118.468, 34.11], [-118.470, 34.15], [-118.469, 34.19], [-118.472, 34.23], [-118.475, 34.265], [-118.485, 34.295], [-118.50, 34.325]] },
      { id: '118', shield: '118', at: [0.2, 0.7], pts: [[-118.64, 34.2625], [-118.60, 34.2675], [-118.56, 34.2745], [-118.52, 34.278], [-118.48, 34.2785], [-118.45, 34.2865], [-118.425, 34.2975], [-118.41, 34.3095]] },
      { id: '5', shield: '5', at: [0.45], pts: [[-118.42, 34.318], [-118.42, 34.28], [-118.405, 34.255], [-118.38, 34.23], [-118.355, 34.20], [-118.335, 34.175], [-118.315, 34.155], [-118.29, 34.125]] },
      { id: '170', shield: '170', at: [0.55], pts: [[-118.408, 34.145], [-118.41, 34.17], [-118.405, 34.20], [-118.395, 34.225], [-118.385, 34.24]] },
      { id: '134', shield: '134', at: [0.5], pts: [[-118.385, 34.1405], [-118.355, 34.15], [-118.325, 34.15], [-118.29, 34.14]] },
      { id: 'topanga', shield: '27', minor: true, at: [0.4], pts: [[-118.606, 34.125], [-118.604, 34.175], [-118.601, 34.222], [-118.60, 34.262], [-118.606, 34.298]] }
    ],

    /* Neighborhood and place names. tier 1 always, 2 from about 1.5x zoom, 3 from about 3x. */
    names: [
      { t: 'Woodland Hills', g: [-118.627, 34.150], tier: 1 }, { t: 'Canoga Park', g: [-118.598, 34.205], tier: 2 },
      { t: 'West Hills', g: [-118.646, 34.208], tier: 2 }, { t: 'Chatsworth', g: [-118.606, 34.252], tier: 1 },
      { t: 'Northridge', g: [-118.535, 34.240], tier: 1 }, { t: 'Reseda', g: [-118.536, 34.2], tier: 2 },
      { t: 'Tarzana', g: [-118.552, 34.151], tier: 2 }, { t: 'Encino', g: [-118.50, 34.144], tier: 2 },
      { t: 'Van Nuys', g: [-118.447, 34.2], tier: 1 }, { t: 'Sherman Oaks', g: [-118.445, 34.136], tier: 2 },
      { t: 'Studio City', g: [-118.382, 34.124], tier: 3 }, { t: 'North Hollywood', g: [-118.372, 34.171], tier: 1 },
      { t: 'Burbank', g: [-118.325, 34.185], tier: 1 }, { t: 'Sun Valley', g: [-118.37, 34.222], tier: 2 },
      { t: 'Pacoima', g: [-118.425, 34.262], tier: 2 }, { t: 'San Fernando', g: [-118.445, 34.283], tier: 2 },
      { t: 'Sylmar', g: [-118.445, 34.307], tier: 1 }, { t: 'Granada Hills', g: [-118.505, 34.265], tier: 2 },
      { t: 'Porter Ranch', g: [-118.552, 34.283], tier: 3 }, { t: 'Panorama City', g: [-118.447, 34.226], tier: 3 },
      { t: 'Warner Center', g: [-118.597, 34.181], tier: 3 }, { t: 'Calabasas', g: [-118.675, 34.143], tier: 2 }
    ],
    /* Big range names, drawn wide and faint. rot is degrees. */
    ranges: [
      { t: 'Santa Monica Mountains', g: [-118.54, 34.112], rot: -2 }, { t: 'Santa Susana Mountains', g: [-118.70, 34.31], rot: -34 },
      { t: 'San Gabriel Mountains', g: [-118.33, 34.335], rot: 18 }, { t: 'Verdugo Mountains', g: [-118.268, 34.22], rot: -74 },
      { t: 'Simi Hills', g: [-118.735, 34.225], rot: -80 }
    ],
    /* Where a river name sits (screen label, small). */
    waterNames: [{ t: 'Los Angeles River', g: [-118.52, 34.1795], rot: 6 }, { t: 'Tujunga Wash', g: [-118.4, 34.236], rot: -86 }]
  };
})();
