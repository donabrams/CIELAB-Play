// Constants to tweak
var Lmin = 0;
var Lmax = 155.0;
var Amin = -250.0;
var Amax = 155.0;
var Bmin = -155.0;
var Bmax = 180.0;

var defaultBlockWidth = 1; //px
var blockBorder = 0;//1;//px
var blockMargin = 0;//3;//px

// create the setup
var createBlocks = function(w) {
	var main = w.document.getElementsByTagName("main")[0];
	var header = w.document.getElementsByTagName("header")[0];
	var footer = w.document.getElementsByTagName("footer")[0];
	var body = w.document.getElementsByTagName("body")[0];
	var axis = w.document.getElementsByTagName("aside")[0];

	// hide main
	main.style.display = "none";

	// get and set the dimensions of main
	var mainWidth = body.scrollWidth;
	var mainHeight = body.scrollHeight - header.scrollHeight - footer.scrollHeight-4;
	console.log(body.scrollHeight + "," + header.scrollHeight + "," + footer.scrollHeight);
	main.style.height = mainHeight + "px";
	main.style.width = mainWidth + "px";

	// determine block sizes
	var cellWidth = defaultBlockWidth + blockBorder*2 + blockMargin*2;
	var cols = Math.floor(mainWidth / cellWidth);
	var rows = Math.floor((mainHeight-2) / cellWidth);
	main.data = main.data || {};
	main.data.rows = rows;
	main.data.cols = cols;

	//evenly distribute the extra padding
	var extraPaddingWidth = (mainWidth - cols * cellWidth)/2;
	var extraPaddingHeight = (mainHeight - 2 - rows * cellWidth)/2;
	main.style["padding-left"] = extraPaddingWidth + "px";
	main.style["padding-right"] = extraPaddingWidth + "px";
	main.style["padding-top"] = extraPaddingHeight + "px";
	main.style["padding-bottom"] = extraPaddingHeight + "px";

	// set up the axis
	var hashDist = 30;
	var hash, i;
	var bPerHash = (Bmax - Bmin) * hashDist/mainHeight;
	for (i=0;i<mainHeight/hashDist;i++) {
		hash = document.createElement("div");
		if (i == 0) {
			hash.innerHTML = "B*";
			hash.style["font-weight"] = 800;
		} else {
			hash.innerHTML = Math.floor(Bmin + i*bPerHash);
		}
		hash.classList.add("gridline");
		hash.style.bottom = (footer.scrollHeight + hashDist*i + extraPaddingHeight + 2) + "px";
		hash.style.width = (mainWidth-extraPaddingWidth*2) + "px";
		axis.appendChild(hash);
	}
	var aPerHash = (Amax - Amin) * hashDist/mainWidth;
	for (i=0;i<mainWidth/hashDist;i++) {
		hash = document.createElement("div");
		if (i == 0) {
			hash.innerHTML = "A*";
			hash.style["font-weight"] = 800;
		} else {
			hash.innerHTML = Math.floor(Amin + i * aPerHash);
		}
		hash.classList.add("gridline");
		hash.classList.add("vert");
		hash.style.top = (header.scrollHeight + extraPaddingWidth) + "px";
		hash.style.left = (hashDist*i) + "px";
		hash.style.width = (mainHeight-extraPaddingHeight*2) + "px";
		axis.appendChild(hash);
	}
	//axis[0].style.top = header.scrollHeight + "px";
	//axis[0].style.width = mainHeight + "px";

	// create the blocks
	var r = 0, c = 0, block;
	for (;r < rows;r++) {
		c = 0;
		for (;c < cols;c++) {
			block = document.createElement("div");
			block.classList.add("block");
			block.style.width = defaultBlockWidth + "px";
			block.style.height = defaultBlockWidth + "px";
			block.data = block.data || {};
			block.data.col = c;
			block.data.row = r;
			main.appendChild(block);
		}
	}

	//show main
	main.style.display = "block";
};

// convert from LAB to XYZ
//sRGB reference white (D65)
//var Xn=0.3127;
//var Yn=0.3290;
//var Zn=0.3583;
var XYZnorm = [0.3127,0.3290,0.3583];
// helper function
var finv = function(t) {
	//      6.0/29.0
	if (t > 0.20689303442296383) { 
		return t*t*t;//t^3
	} else {
		// 3.0 * (6.0/29.0)^2 *      (t-4.0/29.0);
		return 0.12841854934601665 * (t-0.13793103448275862); 
	}
};
var termVector = [];
var transLabToXyz = function(LAB) {
	var Lterm = (LAB[0]+16.0)/116.0;
	termVector[0] = finv(Lterm + LAB[1]/500.0);
	termVector[1] = finv(Lterm);
	termVector[2] = finv(Lterm - LAB[2]/200.0);
	vec3.mul(LAB, XYZnorm, termVector);
};

//convert from XYZ to RGB
//XYZ -> nominal sRGB matrix
var xyzToRgb = [
	3.240479, -1.537150, -0.498535,
	-0.969256, 1.875992,  0.041556,
	0.055648, -0.204043, 1.057311
];
var transXyzToNominalRgb = function(XYZ) {
	vec3.transformMat3(XYZ, XYZ, xyzToRgb);
};

// take rgb where each channel is [0,1.0] and convert to #RRGGBB
var zeroPad = function(a, n) {
	return a.length >= n ? a.substr(0,3) : zeroPad("0" + a, n);
};
var nominalChannelToAbs = function(nominalChannel) {
	return zeroPad(Math.floor((nominalChannel*256.0)).toString(16), 2);
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


// get the average A and B for the col/row
var Lrange = Lmax - Lmin;
var Arange = Amax - Amin;
var Brange = Bmax - Bmin;
var transNominalCoordsToLab = function(perc) {
	perc[0] = Lmin + Lrange * perc[0];
	perc[1] = Amin + Arange * perc[1];
	perc[2] = Bmin + Brange * perc[2];
};

var toLog = [];
var toLog2 = [];


// composite function that converts %s to a color
var getColorForNominalCoords = function(v) {
	transNominalCoordsToLab(v);
	transLabToXyz(v);
	transXyzToNominalRgb(v);
	var color = getColorFromNominalRgb(v);
	return color;
};

var vector = [];


var colorBlocks = function(w, depthPerc) {
	var main = w.document.getElementsByTagName("main")[0];
	var cols = main.data.cols;
	var rows = main.data.rows;
	var cells = main.children;
	var i = 0, cell;
	for (;i < cells.length;i++) {
		vector[0] = depthPerc;
		// get mean % if grid is 0-1 in each direction
		cell = cells[i];
		vector[1] = (cell.data.col+0.5)/cols;
		vector[2] = (cell.data.row+0.5)/rows;
		var color = getColorForNominalCoords(vector);
		if (color != "") {
			cell.style["background-color"] = color;
			//cell.setAttribute("title",color);
		} else {
			cell.style["background-color"] = "#FFF";
			//cell.setAttribute("title","");
		}
	}
};

window.addEventListener("load", function() {(function(w) {
	createBlocks(w);
	var depthPerc = .80;
	var up = true;
	var step = 0.01;
	var stepAndRender = function() {
		depthPerc = up ? (depthPerc + step) : (depthPerc - step);
		if (depthPerc > 1.0) {
			depthPerc = 1.0;
			up = false;
		} else if (depthPerc < 0.0) {
			depthPerc = 0.0;
			up = true;
		}
		colorBlocks(w, depthPerc);
		document.getElementById("l-star").innerHTML = depthPerc*Lmax;
		setTimeout(stepAndRender, 0);
	};
	setTimeout(stepAndRender, 0);

}(window))}, false);