var Viewport = (function(canvas){

	function InputHandler(){
		// mouse tracking variables
		this.start = [0, 0];						// [mouse_on_down.x  , mouse_on_down.y  ]
		this.current = [0, 0];						// [mouse_on_up.x    , mouse_on_up.y    ]
		this.delta = [0, 0];						// [mouse_delta_pos.x, mouse_delta_pos.y]
		this.mouseSensitivity = 1;					// navigation speed, depends on scale of the viewport
		this.mouseStatus = [0, 0];					// [is_down, is_left = 1 or is_right = 2]
		this.selectionArea = [0, 0, 0, 0, 0];		// [x, y, width, height, is_active]
	}

	InputHandler.IS_LEFT_MOUSE_BUTTON = 1;
	InputHandler.IS_RIGHT_MOUSE_BUTTON = 2;

	InputHandler.prototype.isMouseDown = function(){
		return this.mouseStatus[0] == 1;
	};

	InputHandler.prototype.isRightClick = function(){
		return this.mouseStatus[1] == InputHandler.IS_RIGHT_MOUSE_BUTTON;
	};

	InputHandler.prototype.isLeftClick = function(){
		return this.mouseStatus[1] == InputHandler.IS_LEFT_MOUSE_BUTTON;
	};

	function Navigator(){
		// canvas manipulating parameters
		this.panning = [0, 0];						// canvas translation.[x, y]
		this.origin = [0, 0];						// canvas origin.[x, y]
		this.scale = 1;								// canvas scale (scaleX = scaleY)
		this.scaleLimits = [0.5, 3]					// [min scale, max scale]
	}

	Navigator.prototype.screenPointToWorld = function(x, y){
		return 	[
					(x / this.scale - this.panning[0] + this.origin[0]), 
					(y / this.scale - this.panning[1] + this.origin[1])
				];
	};

	Navigator.prototype.worldPointToScreen = function(x, y){
		return 	[
					(x + this.panning[0] - this.origin[0]) * this.scale, 
					(y + this.panning[1] - this.origin[1]) * this.scale
				];	
	};

	Navigator.prototype.checkPointInAABB = function(x, y, bounds){
		// world parametes to screen
		var width = bounds[2] * this.scale;
		var height = bounds[3] * this.scale;
		var position = worldPointToScreen(bounds[0], bounds[1]);
		// ------------------------- //
		return ((x >= position[0] - width / 2 && x <= position[0] + width / 2) & (y >= position[1] - height / 2 && y <= position[1] + height / 2));
	};

	function Renderer(context){
		this.context = context;
		this.clearColor = "rgba(255, 255, 255, 0)";
		this.shapeColor = "rgba(0, 0, 255, 0.75)";
		this.vertexColor = "rgba(255, 0, 0, 1)";
		this.boundsColor = "rgba(0, 0, 0, 1)";
	}

	Renderer.prototype.renderVertex = function(v){
		this.context.fillStyle = this.vertexColor;
			
		if (v.isSelected){
			this.context.strokeStyle = "#0f0";
			
			this.context.lineWidth = 5;
			this.renderBox(v.x, v.y, v.width, v.height);
			this.context.lineWidth = 1.0;
			
			// reset
			this.context.strokeStyle = "#000";
		}
	};

	Renderer.prototype.renderShape = function(shape){
		shape.calculateBounds();

		if (shape.vertices.length > 1){
			this.context.beginPath();
			this.context.moveTo(this.vertices[0].x, this.vertices[0].y);
			
			if (shape.inEditMode)
				this.renderVertex(shape.vertices[0]);
			
			for (var i = 1; i < shape.vertices.length; i++){
				context.lineTo(shape.vertices[i].x, shape.vertices[i].y);
				if (shape.inEditMode)	
					this.renderVertex(shape.vertices[i]);
			}
			
			if (shape.shapeType == Shape.SHAPE_CHAIN){
				this.context.stroke();
			}
			else {
				this.context.closePath();
				this.context.fillStyle = this.shapeColor;
				this.context.fill();
			}

			// render aabb for polygon
			if (shape.isSelected){
				this.context.strokeStyle = "#0f0";
				this.context.lineWidth = 5;
			}

			this.renderBox(bounds[0], bounds[1], bounds[2], bounds[3]);
		}

		// TODO: create GUI layer for managing pivot and centroid and update their position and draw them here

		// draw position of shape
		this.context.fillStyle = "#000";
		this.context.fillRect(shape.position[0] - 5, shape.position[1] - 5, 10, 10);

		// draw centroid of shape
		this.context.fillStyle = "#ff0";
		this.context.fillRect(shape.centroid[0] - 5, shape.centroid[1] - 5, 10, 10);
	};

	Renderer.prototype.renderBox = function(x, y, w, h){
		this.context.fillRect(x - w / 2, y - h / 2, w, h);
		this.context.strokeRect(x - w / 2, y - h / 2, w, h);
	};

	Renderer.prototype.renderCircle = function(x, y, r){
		this.context.beginPath();
    	this.context.arc(x + r / 2, y + r / 2, r, 0, 2 * Math.PI, false);
    	// this.context.fill();
    	this.context.closePath();
    	this.context.stroke();
	};

	Renderer.prototype.setLineDash = function(x_div, y_div){
		this.context.setLineDash([x_div, y_div]);
	};

	Renderer.prototype.clear = function(x, y, w, h){
		this.context.fillStyle = this.clearColor;
		this.context.clearRect(x, y, w, h);
		context.fillRect(x, y, w, h);
	};

	Renderer.prototype.getContext = function(){
		return this.context;
	};

	function Viewport(canvas){
		this.canvas = canvas;
		this.context = canvas.getContext("2d");
		this.navigator = new Navigator();
		this.inputHandler = new InputHandler();
		this.renderer = new Renderer(this.context);

		// prevent default right click behaviour
		this.canvas.addEventListener("contextmenu", function(e){
			e.preventDefault();
		});
	}


	Viewport.prototype.onMouseDown = function(e){
		var inputHandler = this.inputHandler;
		inputHandler.mouseStatus[0] = 1;

		// check whether right button is pressd or not
		if (e.which)
			inputHandler.mouseStatus[1] = (e.which == 3) + 1;
    	else if (e.button)
    		inputHandler.mouseStatus[1] = (e.button == 2) + 1;

		inputHandler.start = [e.offsetX, e.offsetY];

		if (inputHandler.mouseStatus[1] == InputHandler.IS_RIGHT_MOUSE_BUTTON)
			return;

		// select bodies

		inputHandler.selectionArea[0] = e.offsetX;
		inputHandler.selectionArea[1] = e.offsetY;
		inputHandler.selectionArea[4] = 1;
	};

	Viewport.prototype.onMouseMove = function(e){
		var inputHandler = this.inputHandler, navigator = this.navigator;
		if (inputHandler.mouseStatus[0]){
			inputHandler.selectionArea[2] = (e.offsetX - inputHandler.selectionArea[0]);
			inputHandler.selectionArea[3] = (e.offsetY - inputHandler.selectionArea[1]);

			inputHandler.current = [e.offsetX, e.offsetY];

			inputHandler.delta[0] = inputHandler.current[0] - inputHandler.start[0];
			inputHandler.delta[0] *= inputHandler.mouseSensitivity / navigator.scale;
			inputHandler.delta[1] = inputHandler.current[1] - inputHandler.start[1];
			inputHandler.delta[1] *= inputHandler.mouseSensitivity / navigator.scale;

			// if (editBody){
			// 	selection.move(delta[0], delta[1]);
			// }
			// else {
				if (inputHandler.mouseStatus[1] == InputHandler.IS_RIGHT_MOUSE_BUTTON){
					navigator.panning[0] += inputHandler.delta[0];
					navigator.panning[1] += inputHandler.delta[1];

					inputHandler.selectionArea[2] = 0;
					inputHandler.selectionArea[3] = 0;
				}
			// }

			inputHandler.start[0] = inputHandler.current[0];
			inputHandler.start[1] = inputHandler.current[1];

			return;
		}

		// check for bodies and shape
	};

	Viewport.prototype.onMouseUp = function(e){
		var inputHandler = this.inputHandler;
		inputHandler.mouseStatus[0] = 0;
		inputHandler.selectionArea = [0, 0, 0, 0, 0];
	};

	// viewport scaling
	Viewport.prototype.onMouseWheel = function(e){
		var mouseX = e.offsetX;
	    var mouseY = e.offsetY;
	    var wheel = e.wheelDelta / 120;

	    var navigator = this.navigator;

	    var zoom = 1 + wheel / 2;

	    if (zoom > 1){
	    	if (navigator.scale > navigator.scaleLimits[1]) 
	    		return;
	    }
		else{
			if (navigator.scale < navigator.scaleLimits[0]) 
				return;
		}

	    this.context.translate(
	        navigator.origin[0],
	        navigator.origin[1]
	    );
	    this.context.scale(zoom,zoom);
	    this.context.translate(
	        -( mouseX / navigator.scale + navigator.origin[0] - mouseX / ( navigator.scale * zoom ) ),
	        -( mouseY / navigator.scale + navigator.origin[1] - mouseY / ( navigator.scale * zoom ) )
	    );

	    navigator.origin[0] = ( mouseX / navigator.scale + navigator.origin[0] - mouseX / ( navigator.scale * zoom ) );
	    navigator.origin[1] = ( mouseY / navigator.scale + navigator.origin[1] - mouseY / ( navigator.scale * zoom ) );
	    navigator.scale *= zoom;
	};

	Viewport.prototype.draw = function(){
		var inputHandler = this.inputHandler, navigator = this.navigator, renderer = this.renderer;
		
		// clear screen
		renderer.clear(navigator.origin[0], navigator.origin[1], 1520 / navigator.scale, 561 / navigator.scale);

		// applying panning to canvas
		renderer.getContext().save();
		renderer.getContext().translate(navigator.panning[0], navigator.panning[1]);

		// draw selection area if active
		if (inputHandler.selectionArea[4]){
			var position = this.screenPointToWorld(inputHandler.selectionArea[0], inputHandler.selectionArea[1]),
				width = inputHandler.selectionArea[2] / navigator.scale,
				height = inputHandler.selectionArea[3] / navigator.scale;

			this.renderer.setLineDash(5, 5);
			this.renderer.renderBox(position[0] + width / 2, position[1] + height / 2, width, height);
			this.renderer.setLineDash(1, 0);
		}

		renderer.renderCircle(100, 100, 100);

		// renderer.getContext().restore();
	};

	Viewport.prototype.screenPointToWorld = function(x, y){
		return 	this.navigator.screenPointToWorld(x, y);
	};

	Viewport.prototype.worldPointToScreen = function(x, y){
		return 	this.navigator.worldPointToScreen(x, y);
	};

	Viewport.prototype.getNavigator = function(){
		return this.navigator;
	};

	Viewport.prototype.getInputHandler = function(){
		return this.inputHandler;
	};

	Viewport.prototype.getRenderer = function(){
		return this.renderer;
	};

	var instance;
    return {
        getInstance: function(){
            if (instance == null) {
                instance = new Viewport(canvas);
                // Hide the constructor so the returned objected can't be new'd...
                instance.constructor = null;
            }
            return instance;
        }
   	};

})(canvas);