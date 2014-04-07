// Environmental setup
var env = {
	// color space ranges to graph
	L: [0, 100.0],
	A: [-128.0, 128.0],
	B: [-128.0, 128.0],
	state: {
		L: 24.0,
		up: true,
		step: 1.0
	},
	cell: {
		width: 1,//px
		border: 0,//px
		margin: 0//px
	},
	gridlines: {
		on: true,
		hashSpacing: 30//px
	},
	// These values are calculated from the config above and
	// the browser env by intializeEnvironment
	plot: {
		canvas: null,
		cols: 0,
		rows: 0,
		width: 0,
		height: 0
	},
	// Node where L* is written 
	lstar: null
};

// create the setup
var intializeEnvironment = function(w) {
	var main = document.getElementsByTagName("main")[0];
	var header = document.getElementsByTagName("header")[0];
	var footer = document.getElementsByTagName("footer")[0];
	var body = document.getElementsByTagName("body")[0];

	// hide main and clear any existing child nodes
	main.style.display = "none";
	while (main.firstChild) {
	    main.removeChild(main.firstChild);
	}

	// calculate the size of the main area
	var mainWidth = body.scrollWidth;
	var mainHeight = body.scrollHeight - header.scrollHeight - 
		footer.scrollHeight-4;

	// determine cell size (square)
	var cellDim = env.cell.width + 
		env.cell.border*2 + 
		env.cell.margin*2;
	env.plot.cols = Math.floor(mainWidth / cellDim);
	env.plot.rows = Math.floor((mainHeight-2) / cellDim);

	//evenly distribute the extra padding in main
	var extraPaddingWidth = (mainWidth - 
		env.plot.cols * env.cell.width)/2;
	var extraPaddingHeight = (mainHeight - 2 - 
		env.plot.rows * env.cell.width)/2;
	main.style["padding"] = extraPaddingWidth + "px " + 
		extraPaddingHeight + "px";

	//set the environment data minus the padding
	env.plot.width = mainWidth-extraPaddingWidth*2;
	env.plot.height = mainHeight-extraPaddingHeight*2;

	// create a canvas in main with the appropriate dimensions
	var canvas = env.plot.canvas = document.createElement("canvas");
	canvas.setAttribute("id", "cielabPlot");
	canvas.setAttribute("width", env.plot.width + "px");
	canvas.setAttribute("height", env.plot.height + "px");
	main.appendChild(canvas);

	//fill in the initial L*
	env.lstar = document.getElementById("l-star");
	while (env.lstar.firstChild) {
	    env.lstar.removeChild(env.lstar.firstChild);
	}
	env.lstar.appendChild(document.createTextNode(env.state.L.toString()));

	//show main
	main.style.display = "block";
};

// convert from LAB to XYZ
// helper function
var finv = function(t) {
	//      6.0/29.0
	if (t > 0.20689303442296383) { 
		return t*t*t;//t^3
	}// else {
	// 3.0 * (6.0/29.0)^2 *      (t-4.0/29.0);
	return 0.12841854934601665 * (t-0.13793103448275862);
};
//sRGB reference white (D65)
//[0.3127,0.3290,0.3583];
// 2 degrees observance, D65
// https://github.com/THEjoezack/ColorMine/blob/master/ColorMine/ColorSpaces/Conversions/XyzConverter.cs
var XYZnorm = [0.95047, 1.00, 1.08883];
var termVector = [];
var transLabToXyz = function(LAB) {
	var Lterm = (LAB[0]+16.0)/116.0;
	LAB[0] = XYZnorm[0] * finv(Lterm + LAB[1]/500.0);
	LAB[1] = XYZnorm[1] * finv(Lterm);
	LAB[2] = XYZnorm[2] * finv(Lterm - LAB[2]/200.0);
};

//convert from XYZ to sRGB
var xyzToRgb = [
	//XYZ->sRGB D50
	//http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html#WSMatrices 
	//3.1338561, -1.6168667, -0.4906146,
	//-0.9787684,  1.9161415,  0.0334540,
	// 0.0719453, -0.2289914,  1.4052427,
	//XYZ->sRGB D65
	//From http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
	3.2404542, -1.5371385, -0.4985314,
	-0.9692660,  1.8760108,  0.0415560,
	0.0556434, -0.2040259,  1.0572252
	//From somewhere else
	//3.240479, -1.537150, -0.498535,
	//-0.969256, 1.875992,  0.041556,
	//0.055648, -0.204043, 1.057311
];
var transXyzToNominalRgb = function(XYZ) {
	var x = XYZ[0], y = XYZ[1], z = XYZ[2], m=xyzToRgb;
	XYZ[0] = x * m[0] + y * m[1] + z * m[2];
	XYZ[1] = x * m[3] + y * m[4] + z * m[5];
    XYZ[2] = x * m[6] + y * m[7] + z * m[8];
};

// take rgb where each channel is [0,1.0] and convert to #RRGGBB
var zeroPad = function(a, n) {
	return a.length >= n ? a.substr(0,3) : zeroPad("0" + a, n);
};
var nominalChannelToAbs = function(nominalChannel) {
	//this if/else is gamma correction
	if (nominalChannel <= 0.0031308) {
		nominalChannel = 12.92*nominalChannel;
	} else {
		nominalChannel = 1.055*Math.pow(nominalChannel, 1.0/2.4) - 0.055;
	}
	return zeroPad(Math.floor((nominalChannel*255)).toString(16), 2);
};
var getColorFromNominalRgb = function(nominalRGB) {
	if (nominalRGB[0] > 1.0 || nominalRGB[0] < 0.0 ||
		nominalRGB[1] > 1.0 || nominalRGB[1] < 0.0 ||
		nominalRGB[2] > 1.0 || nominalRGB[2] < 0.0) {
		return "";
	}
	var r = nominalChannelToAbs(nominalRGB[0]);
	var g = nominalChannelToAbs(nominalRGB[1]);
	var b = nominalChannelToAbs(nominalRGB[2]);
	return "#" + r + g + b;
};

// composite function that converts %s to a color
var getColorForLab = function(v) {
	transLabToXyz(v);
	transXyzToNominalRgb(v);
	var color = getColorFromNominalRgb(v);
	return color;
};

//TODO: We'll add in border/margin later.
var renderPlot = function() {
	var canvas = env.plot.canvas;
	var ctx = canvas.getContext("2d");
	//clear the canvas
	ctx.clearRect(0,0,env.plot.width,env.plot.height);

	//cache these vars locally for now
	var cellSize = env.cell.width;
	var rows = env.plot.rows;
	var cols = env.plot.cols;
	//calculate the increases in A/B per row/col
	var aPerRow = (env.A[1] - env.A[0])/rows;
	var bPerCol = (env.B[1] - env.B[0])/cols;

	// Iterate state per col/row and draw the cells
	var r, c, 
		color,
		vector=[],
		x, y,
		L=env.state.L,
		a, b,
		aInit = env.A[0] + aPerRow/2.0,
		bInit = env.B[0] + bPerCol/2.0;
	for (r=0, y=0, a=aInit; r<rows; r++, y+=cellSize, a+=aPerRow) {
		for(c=0, x=0, b=bInit; c<cols; c++, x+=cellSize, b+=bPerCol) {
			vector[0] = L;
			vector[1] = a;
			vector[2] = b;
			color = getColorForLab(vector);
			if (color !== "") {
				ctx.fillStyle = color;
				ctx.fillRect(x, y, cellSize, cellSize);
			}
		}
	}
	//render gridlines
	if (env.gridlines.on) {
		ctx.fillStyle = "#000000";
		var i=0;

		//vertical lines
		for(x=0;x<env.plot.width;x+= env.gridlines.hashSpacing) {
			i++;
			ctx.fillRect(x, 0, (i % 5 === 0 ? 2: 1) , env.plot.height);
			// B = B per Col / pixels per Col * pixels per Hash * hash #
			ctx.strokeText(Math.floor(env.B[0]+bPerCol*cols/env.plot.width*x).toString(), x, env.gridlines.hashSpacing/2);
		}
		//horizontal lines
		for(y=0;y<env.plot.height;y+= env.gridlines.hashSpacing) {
			i++;
			ctx.fillRect(0, y, env.plot.width, (i % 5 === 0 ? 2: 1));
			// A = A per Row / pixels per Row * pixels per Hash * hash #
			ctx.strokeText(Math.floor(env.A[0]+aPerRow*rows/env.plot.height*y).toString(), 0, y);
		
		}
	}
};
var render = function() {
	renderPlot();
	// update text of L*
	env.lstar.replaceChild(
		document.createTextNode(env.state.L.toString()),
		env.lstar.firstChild);
};
var step = function() {
	// progress the state
	env.state.L = env.state.up ? (env.state.L + env.state.step) : (env.state.L - env.state.step);
	// cap the state at its bounds
	if (env.state.L > env.L[1]) {
		env.state.L = env.L[1];
		env.state.up = false;
	} else if (env.state.L < env.L[0]) {
		env.state.L = env.L[0];
		env.state.up = true;
	}
};
var timeoutId;
var stepAndRender = function() {
	// progress the state
	step();
	// do a render of the plot
	render();
	// queue the next cycle
	timeoutId = setTimeout(stepAndRender, 0);
};
var restartRenderer = function() {
	// stop current renderer cycle
	if (timeoutId) {
		clearTimeout(timeoutId);
	}
	// kick off the cycle
	timeoutId = setTimeout(stepAndRender, 0);
};
// initialize and start on load of page
window.addEventListener("load", function() {
		intializeEnvironment();
		restartRenderer();
	}, false);