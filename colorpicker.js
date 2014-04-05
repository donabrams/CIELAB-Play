window.addEventListener("load", function() {(function(w) {
	var main = w.document.getElementsByTagName("main")[0];
	var header = w.document.getElementsByTagName("header")[0];
	var footer = w.document.getElementsByTagName("footer")[0];
	var body = w.document.getElementsByTagName("body")[0];

	// get and set the dimensions of main
	var mainWidth = body.scrollWidth;
	var mainHeight = body.scrollHeight - header.scrollHeight - footer.scrollHeight-4;
	console.log(body.scrollHeight + "," + header.scrollHeight + "," + footer.scrollHeight);
	main.style.height = mainHeight + "px";
	main.style.width = mainWidth + "px";

	// determine block sizes
	var defaultBlockWidth = 30; //px
	var blockBorder = 1;//px
	var blockMargin = 3;//px
	var rows = mainWidth / (defaultBlockWidth + blockBorder*2 + blockMargin*2);
	var cols = (mainHeight-2) / (defaultBlockWidth + blockBorder*2 + blockMargin*2);

	var r = 0, c = 0, block;
	for (;r < rows;r++) {
		c = 0;
		for (;c < cols;c++) {
			block = document.createElement("div");
			block.classList.add("block");
			block.style.width = defaultBlockWidth + "px";
			block.style.height = defaultBlockWidth + "px";
			main.appendChild(block);
		}
	}

	main.style.display = "block";
}(window))}, false);