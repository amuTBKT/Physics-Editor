/** a 24 bit uncompressed bitmap loader */
var BMPImageLoader = (function () {
	
	function BMPImage(){
		this.pixels = [];	// pixel information
		this.width  = 0;	// width of the bitmap
		this.height = 0;	// height of the bitmap
	} 

	BMPImage.prototype.getPixelAt = function(x, y){
		var wx = Math.min(this.width, Math.max(0, x));
		var wy = Math.min(this.height, Math.max(0, y));
		var r = this.pixels[3 * (this.width * wy + wx) + 0],
			g = this.pixels[3 * (this.width * wy + wx) + 1],
			b = this.pixels[3 * (this.width * wy + wx) + 2];
		return [r, g, b];
	};

	BMPImage.prototype.dispose = function(){
		delete this.pixels;
	};

	/**
	*
	* @param bytes
	*		string
	* @param offset
	*		starting position for a 4 characters long string 
	*/
	function toInt(bytes, offset) {
		// this might be a hack, but worked every time for me 
		return 	(bytes.charCodeAt(offset + 0)) + (bytes.charCodeAt(offset + 1)) * 256 +
				(bytes.charCodeAt(offset + 2)) * 256 * 256 + (bytes.charCodeAt(offset + 3) * 256 * 256 * 256);
	}
	
	/**
	*
	* @param bytes
	*		string
	* @param offset
	*		starting position for a 2 characters long string
	*/
	function toShort(bytes, offset) {
		return (bytes.charCodeAt(offset + 0)) + (bytes.charCodeAt(offset + 1));
	}

	function BMPImageLoader(){
		this.counter = 0;
	}

	/** similar to ifstream but instead here counter is used to track the position of next character to be read */
	BMPImageLoader.prototype.readInt = function(string){
		var r = toInt(string, this.counter);
		this.counter += 4;
		return r;
	};

	/** similar to ifstream but instead here counter is used to track the position of next character to be read */
	BMPImageLoader.prototype.readShort = function(string){
		var r = toShort(string, this.counter);
		this.counter += 2;
		return r;
	};

	/**
	*
	* @param binaryFile
	*		bitmap image as a binary string (refer FileReader API for reading a file as binary string)
	* returns
	*		BMPImage 
	*/
	BMPImageLoader.prototype.loadBMP = function(binaryFile){
		// check if file is a bitmap
		var b = binaryFile.charAt(this.counter++);
		var m = binaryFile.charAt(this.counter++);
		if (b != 'B' && m != 'M'){
			// not a bitmap
			console.log("%cIt's not a bmp", "color:#f00;");
			// reset the counter for loading another files
			this.counter = 0;
			return;
		}

		// skip 8 characters
		for (var i = 0; i < 8; i++){
			this.counter++;
		}
			
		var image = new BMPImage();

		// position from where pixel data starts
		var dataOffset = this.readInt(binaryFile);
		
		// size of header
		var headerSize = this.readInt(binaryFile);
		
		switch (headerSize){
			case 40:
				image.width = this.readInt(binaryFile);
				image.height = this.readInt(binaryFile);
				// console.log(image.width + " " + image.height);
				this.counter += 2;
				var format = this.readShort(binaryFile);
				if (format != 24){
					console.log("%cImage is not 24 bit", "color:#f00;");
					// reset the counter for loading another files
					this.counter = 0;
					return;
				}
				var isComprssed = this.readShort(binaryFile);
				if (isComprssed != 0){
					console.log("%cImage is compressed", "color:#f00;");
					// reset the counter for loading another files
					this.counter = 0;
					return;
				}
			break;
			case 12:
				image.width = this.readShort(line);
				image.height = this.readShort(line);
				this.counter += 2;
				var format = this.readShort(binaryFile);
				if (format != 24){
					console.log("%cImage is not 24 bit", "color:#f00;");
					// reset the counter for loading another files
					this.counter = 0;
					return;
				}
			break;
			default:
				// bitmap not supported
				console.log("%cBitmap not supported", "color:#f00;");
				// reset the counter for loading another files
				this.counter = 0;
			break;
		}

		this.counter += 2;
		var rawBitmapData = this.readInt(binaryFile);

		// store pixel data in a temporary array
		var pixelsChar = binaryFile.slice(dataOffset, rawBitmapData + dataOffset);

		// getting the data in right format
		var width = parseInt(image.width), height = parseInt(image.height);
		// amount of pixel data in one row 
		var bytesPerRow = parseInt(rawBitmapData / height);//parseInt(parseInt((width * 3.0 + 3.0) / 3.0) * 3.0) - parseInt((width * 3.0) % 3.0);

		var pixels = [];
		for(var y = 0; y < height; y++){
			for(var x = 0; x < width; x++){
				// bgr -> rgb
				// bitmap contains pixel color in [blue, green, red] format, but we need [red, green, blue]	
				for(var c = 0; c < 3; c++){
					// convert character to integer (store pixel information in [0, 255] range rather than as character)
					pixels[3 * (width * y + x) + c] = pixelsChar[parseInt(bytesPerRow * (height - y - 1) + 3 * x + (2 - c))].charCodeAt(0);
				}
			}
		}
		// delete the temporary array
		delete pixelsChar;

		// reset the counter for loading another files
		this.counter = 0;

		// set image pixels
		image.pixels = pixels;

		return image;
	};

	return BMPImageLoader;

})();