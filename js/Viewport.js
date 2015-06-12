var Viewport = (function(){

	function InputHandler(){
		// mouse tracking variables
		this.start = [0, 0];						// [mouse_on_down.x  , mouse_on_down.y  ]
		this.current = [0, 0];						// [mouse_on_up.x    , mouse_on_up.y    ]
		this.delta = [0, 0];						// [mouse_delta_pos.x, mouse_delta_pos.y]
		this.mouseSensitivity = 1;					// navigation speed, depends on scale of the viewport
		this.mouseStatus = [0, 0];					// [is_down, is_left = 1 or is_right = 2]
		this.selectionArea = [0, 0, 0, 0, 0];		// [x, y, width, height, is_active]
		this.selection = []							// array of selected objects
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
		var position = this.worldPointToScreen(bounds[0], bounds[1]);
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
			
			this.context.lineWidth = 2;
			this.renderBox(v.x, v.y, v.width, v.height, false);
			this.context.lineWidth = 1;
			
			// reset
			this.context.strokeStyle = "#000";
		}

		this.renderBox(v.x, v.y, v.width, v.height, true);
	};

	Renderer.prototype.renderBody = function(body){
		// update aabb
		body.calculateBounds();

		for (var i = 0; i < body.shapes.length; i++){
			this.renderShape(body.shapes[i]);
		}

		// render aabb 
		if (body.isSelected){
			this.context.strokeStyle = "#0f0";
			this.context.lineWidth = 2;
		}

		this.renderBox(body.bounds[0], body.bounds[1], body.bounds[2], body.bounds[3], false);
		this.context.lineWidth = 1;
	}

	Renderer.prototype.renderShape = function(shape){
		shape.calculateBounds();

		if (shape.vertices.length > 1){
			this.context.beginPath();
			this.context.moveTo(shape.vertices[0].x, shape.vertices[0].y);
			
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
				this.context.lineWidth = 2;
			}
			else {
				this.context.strokeStyle = "#000";
				this.context.lineWidth = 1;	
			}

			this.renderBox(shape.bounds[0], shape.bounds[1], shape.bounds[2], shape.bounds[3], false);
			this.context.lineWidth = 1;
		}

		// TODO: create GUI layer for managing pivot and centroid and update their position and draw them here

		// draw position of shape
		this.context.fillStyle = "#000";
		this.context.fillRect(shape.position[0] - 5, shape.position[1] - 5, 10, 10);

		// draw centroid of shape
		this.context.fillStyle = "#ff0";
		this.context.fillRect(shape.centroid[0] - 5, shape.centroid[1] - 5, 10, 10);
	};

	Renderer.prototype.renderBox = function(x, y, w, h, fill){
		if (fill) this.context.fillRect(x - w / 2, y - h / 2, w, h);
		this.context.strokeRect(x - w / 2, y - h / 2, w, h);
	};

	Renderer.prototype.renderCircle = function(x, y, r, fill){
		this.context.beginPath();
    	this.context.arc(x + r / 2, y + r / 2, r, 0, 2 * Math.PI, false);
    	if (fill) this.context.fill();
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

	function Viewport(canvas, sceneManager){
		this.canvas = canvas;
		this.context = canvas.getContext("2d");
		this.navigator = new Navigator();
		this.inputHandler = new InputHandler();
		this.renderer = new Renderer(this.context);
		this.sceneManager = sceneManager;

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
		if (!this.sceneManager.onMouseDown(e, this.inputHandler, this.navigator)){
			inputHandler.selectionArea[0] = e.offsetX;
			inputHandler.selectionArea[1] = e.offsetY;
			inputHandler.selectionArea[4] = 1;
		}
	};

	Viewport.prototype.onMouseMove = function(e){
		var inputHandler = this.inputHandler, navigator = this.navigator, sceneManager = this.sceneManager;
		if (inputHandler.mouseStatus[0]){
			inputHandler.selectionArea[2] = (e.offsetX - inputHandler.selectionArea[0]);
			inputHandler.selectionArea[3] = (e.offsetY - inputHandler.selectionArea[1]);

			inputHandler.current = [e.offsetX, e.offsetY];

			inputHandler.delta[0] = inputHandler.current[0] - inputHandler.start[0];
			inputHandler.delta[0] *= inputHandler.mouseSensitivity / navigator.scale;
			inputHandler.delta[1] = inputHandler.current[1] - inputHandler.start[1];
			inputHandler.delta[1] *= inputHandler.mouseSensitivity / navigator.scale;

			inputHandler.start[0] = inputHandler.current[0];
			inputHandler.start[1] = inputHandler.current[1];

			// panning
			if (inputHandler.mouseStatus[1] == InputHandler.IS_RIGHT_MOUSE_BUTTON){
				navigator.panning[0] += inputHandler.delta[0];
				navigator.panning[1] += inputHandler.delta[1];

				inputHandler.selectionArea[2] = 0;
				inputHandler.selectionArea[3] = 0;

				return;
			}

			// edit bodies and shapes
			if (sceneManager.state == sceneManager.STATE_DEFAULT_MODE){
				for (var i = 0; i < sceneManager.selectedBodies.length; i++){
					sceneManager.selectedBodies[i].move(inputHandler.delta[0], inputHandler.delta[1]);
				}
			}
			else if (sceneManager.state == sceneManager.STATE_BODY_EDIT_MODE){
				for (var i = 0; i < sceneManager.selectedShapes.length; i++){
					sceneManager.selectedShapes[i].move(inputHandler.delta[0], inputHandler.delta[1]);
				}
			}
			else if (sceneManager.state == sceneManager.STATE_SHAPE_EDIT_MODE){
				for (var i = 0; i < sceneManager.selectedVertices.length; i++){
					sceneManager.selectedVertices[i].move(inputHandler.delta[0], inputHandler.delta[1]);
				}
			}
		}

		// check for bodies and shape
	};

	Viewport.prototype.onMouseUp = function(e){
		var inputHandler = this.inputHandler, sceneManager = this.sceneManager;
		inputHandler.mouseStatus[0] = 0;

		if (inputHandler.selectionArea[4]){
			var startPoint = this.screenPointToWorld(inputHandler.selectionArea[0], inputHandler.selectionArea[1]),
				endPoint = this.screenPointToWorld(e.offsetX, e.offsetY);
			var lineSegment  = new LineSegment(startPoint[0], startPoint[1], endPoint[0], endPoint[1]);
			// for (var i = 0; i < shape.vertices.length; i++){
			// 	if (lineSegment.checkInBoundsX(shape.vertices[i].x) && lineSegment.checkInBoundsY(shape.vertices[i].y)){
			// 		shape.vertices[i].highlight = true;
			// 	}
			// 	else {
			// 		shape.vertices[i].highlight = false;
			// 	}
			// }
			// console.log(lineSegment);
			// console.log(lineSegment.checkInBoundsAABB([500, 200, 200, 200]));

			// edit bodies and shapes
			if (sceneManager.state == sceneManager.STATE_DEFAULT_MODE){
				sceneManager.selectedBodies = [];
				for (var i = 0; i < sceneManager.bodies.length; i++){
					if (lineSegment.checkInBoundsAABB(sceneManager.bodies[i].bounds)){
						sceneManager.selectedBodies.push(sceneManager.bodies[i]);
						sceneManager.bodies[i].isSelected = true;
					}
					else {
						sceneManager.bodies[i].isSelected = false;
					}
				}
			}
			else if (sceneManager.state == sceneManager.STATE_BODY_EDIT_MODE){
				sceneManager.selectedShapes = [];
				for (var i = 0; i < sceneManager.selectedBodies[0].shapes.length; i++){
					if (lineSegment.checkInBoundsAABB(sceneManager.selectedBodies[0].shapes[i].bounds)){
						sceneManager.selectedShapes.push(sceneManager.selectedBodies[0].shapes[i]);
						sceneManager.selectedBodies[0].shapes[i].isSelected = true;
					}
					else {
						sceneManager.selectedBodies[0].shapes[i].isSelected = false;
					}
				}
			}
			else if (sceneManager.state == sceneManager.STATE_SHAPE_EDIT_MODE){
				sceneManager.selectedVertices = [];
				for (var i = 0; i < sceneManager.selectedShapes[0].vertices.length; i++){
					var vertex = sceneManager.selectedShapes[0].vertices[i];
					if (lineSegment.checkInBoundsAABB([vertex.x, vertex.y, vertex.width, vertex.height])){
						sceneManager.selectedVertices.push(sceneManager.selectedShapes[0].vertices[i]);
						sceneManager.selectedShapes[0].vertices[i].isSelected = true;
					}
					else{
						sceneManager.selectedShapes[0].vertices[i].isSelected = false;	
					}
				}
			}
		}

		inputHandler.selectionArea = [0, 0, 0, 0, 0];
	};

	Viewport.prototype.onClick = function(e){
		// var sceneManager = this.sceneManager,
		// 	inputHandler = this.inputHandler;

		// if (sceneManager.state == sceneManager.STATE_BODY_EDIT_MODE){
		// 	sceneManager.selectedShapes = [];
		// 	for (var i = 0; i < sceneManager.selectedBodies[0].shapes.length; i++){
		// 		if (this.navigator.checkPointInAABB(e.offsetX, e.offsetY, sceneManager.selectedBodies[0].shapes[i].bounds)){
		// 			sceneManager.selectedBodies[0].shapes[i].isSelected = true;
		// 			sceneManager.selectedShapes[0] = sceneManager.selectedBodies[0].shapes[i];
		// 			break;
		// 		}
		// 		else {
		// 			sceneManager.selectedBodies[0].shapes[i].isSelected = false;
		// 			sceneManager.selectedBodies[0].shapes[i].inEditMode = false;
		// 		}
		// 	}
		// 	return;
		// }

		// if (sceneManager.state == sceneManager.STATE_DEFAULT_MODE){
		// 	for (var i = 0; i < sceneManager.bodies.length; i++){
		// 		sceneManager.selectedBodies = [];
		// 		if (this.navigator.checkPointInAABB(e.offsetX, e.offsetY, sceneManager.bodies[i].bounds)){
		// 			sceneManager.bodies[i].isSelected = true;
		// 			sceneManager.selectedBodies[0] = sceneManager.bodies[i];
		// 			break;
		// 		}
		// 		else {
		// 			sceneManager.bodies[i].isSelected = false;	
		// 		}
		// 	}
		// }		
	}

	Viewport.prototype.onDoubleClick = function(e){
		// var sceneManager = this.sceneManager,
		// 	inputHandler = this.inputHandler;

		// if (sceneManager.state == sceneManager.STATE_BODY_EDIT_MODE){
		// 	sceneManager.selectedShapes = [];
		// 	for (var i = 0; i < sceneManager.selectedBodies[0].shapes.length; i++){
		// 		if (this.navigator.checkPointInAABB(e.offsetX, e.offsetY, sceneManager.selectedBodies[0].shapes[i].bounds)){
		// 			sceneManager.selectedBodies[0].shapes[i].isSelected = true;
		// 			sceneManager.selectedBodies[0].shapes[i].inEditMode = true;
		// 			sceneManager.selectedShapes[0] = sceneManager.selectedBodies[0].shapes[i];
		// 			sceneManager.state = sceneManager.STATE_SHAPE_EDIT_MODE;
		// 			return;
		// 		}
		// 		else {
		// 			sceneManager.selectedBodies[0].shapes[i].isSelected = false;
		// 			sceneManager.selectedBodies[0].shapes[i].inEditMode = false;
		// 		}
		// 	}
		// }

		// if (sceneManager.state == sceneManager.STATE_DEFAULT_MODE){
		// 	for (var i = 0; i < sceneManager.bodies.length; i++){
		// 		sceneManager.selectedBodies = [];
		// 		if (this.navigator.checkPointInAABB(e.offsetX, e.offsetY, sceneManager.bodies[i].bounds)){
		// 			sceneManager.bodies[i].isSelected = true;
		// 			sceneManager.selectedBodies[0] = sceneManager.bodies[i];
		// 			sceneManager.state = sceneManager.STATE_BODY_EDIT_MODE;
		// 			break;
		// 		}
		// 		else {
		// 			sceneManager.bodies[i].isSelected = false;	
		// 		}
		// 	}
		// }
	}

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
			this.renderer.renderBox(position[0] + width / 2, position[1] + height / 2, width, height, false);
			this.renderer.setLineDash(0, 0);
		}

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
                instance = new Viewport(canvas, sceneManager);
                // Hide the constructor so the returned objected can't be new'd...
                instance.constructor = null;
            }
            return instance;
        }
   	};

})();