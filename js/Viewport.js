var Viewport = (function(){

	function InputHandler(){
		// mouse tracking variables
		this.pointerWorldPos = [0, 0, 0, 0];		// mouse_down and current position of cursor in world coordinate
		this.start = [0, 0];						// [mouse_on_down.x  , mouse_on_down.y  ]
		this.current = [0, 0];						// [mouse_on_up.x    , mouse_on_up.y    ]
		this.delta = [0, 0];						// [mouse_delta_pos.x, mouse_delta_pos.y]
		this.mouseSensitivity = 1;					// navigation speed, depends on scale of the viewport
		this.mouseStatus = [0, 0];					// [is_down, is_left = 1 or is_right = 2]
		this.selectionArea = [0, 0, 0, 0, 0];		// [x, y, width, height, is_active]
		this.selection = []							// array of selected objects
		this.CTRL_PRESSED = 0;
		this.SHIFT_PRESSED = 0;
		this.ALT_PRESSED = 0;
		this.SNAPPING_ENABLED = 0;
		this.snappingData = [0, 0.1, 10];			// [snap_pos, delta_scale, delta_angle]
		this.transformTool = InputHandler.TRANSFORM_TOOL_TRANSLATION;
		this.pivotMode = InputHandler.PIVOT_LOCAL_MODE;

		this.inGameMode = 0;
	}

	InputHandler.IS_LEFT_MOUSE_BUTTON = 1;
	InputHandler.IS_RIGHT_MOUSE_BUTTON = 2;
	InputHandler.PIVOT_LOCAL_MODE = 3;
	InputHandler.PIVOT_SELECTION_MIDDLE = 4;
	InputHandler.TRANSFORM_TOOL_SCALE = 5;
	InputHandler.TRANSFORM_TOOL_ROTATION = 6;
	InputHandler.TRANSFORM_TOOL_TRANSLATION = 7;

	InputHandler.prototype.isMouseDown = function(){
		return this.mouseStatus[0] == 1;
	};

	InputHandler.prototype.isRightClick = function(){
		return this.mouseStatus[1] == InputHandler.IS_RIGHT_MOUSE_BUTTON;
	};

	InputHandler.prototype.isLeftClick = function(){
		return this.mouseStatus[1] == InputHandler.IS_LEFT_MOUSE_BUTTON;
	};

	InputHandler.prototype.activateTranslationTool = function(){
		this.transformTool = InputHandler.TRANSFORM_TOOL_TRANSLATION;
	};

	InputHandler.prototype.activateScaleTool = function(){
		this.transformTool = InputHandler.TRANSFORM_TOOL_SCALE;
	};

	InputHandler.prototype.activateRotationTool = function(){
		this.transformTool = InputHandler.TRANSFORM_TOOL_ROTATION;
	};

	InputHandler.prototype.activateLocalPivotMode = function(){
		this.pivotMode = InputHandler.PIVOT_LOCAL_MODE;
	};

	InputHandler.prototype.activateSelectionPivotMode = function(){
		this.pivotMode = InputHandler.PIVOT_SELECTION_MIDDLE;
	};

	// to handle canvas panning and zooming
	function Navigator(){
		// canvas manipulating parameters
		this.panning = [0, 0];						// canvas translation.[x, y]
		this.origin = [0, 0];						// canvas origin.[x, y]
		this.scale = 1;								// canvas scale (scaleX = scaleY)
		this.scaleLimits = [0.5, 3];					// [min scale, max scale]
		this.grid = [0, 0];							// [range, cell_size]
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

	// to render viewport
	function Renderer(context){
		this.context = context;
		this.width = 0;
		this.height = 0;
		this.clearColor = "#000";
		this.shapeColor = "rgba(228, 177, 177, 0.6)";
		this.shapeSelectedColor = "rgba(228, 228, 177, 0.6)";
		this.bodySelectedColor = "rgba(0, 177, 177, 0.6)";
		this.staticBodyColor = "rgba(177, 228,177, 0.6)";
		this.vertexColor = "rgba(255, 0, 0, 1)";
		this.boundsColor = "rgba(228, 177, 177, 1)";
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

	Renderer.prototype.setStageWidthHeight = function(w, h){
		this.width = w;
		this.height = h;
	};

	Renderer.prototype.renderJoint = function(joint){
		this.context.fillStyle = "#0f0";
		this.renderCircle(joint.position[0], joint.position[1], 5, true);

		this.setLineDash(5, 5);
		this.context.lineWidth = 2;
		this.context.strokeStyle = "#aaa";
		if (joint.jointType == Joint.JOINT_DISTANCE){
			this.context.moveTo(joint.bodyA.position[0], joint.bodyA.position[1]);
			this.context.lineTo(joint.bodyB.position[0], joint.bodyB.position[1]);
			this.context.stroke();
		}
		else if (joint.jointType == Joint.JOINT_REVOLUTE && joint.enableLimit){
			// draw lower angle vector line
			this.context.strokeStyle = "#f00";
			this.context.beginPath();
			this.context.moveTo(joint.localAnchorB[0], joint.localAnchorB[1]);
			var x = joint.localAnchorB[0] + 100 * Math.cos(joint.lowerAngle * Math.PI / 180);
			var y = joint.localAnchorB[1] + 100 * Math.sin(joint.lowerAngle * Math.PI / 180);
			this.context.lineTo(x, y);
			this.context.stroke();
			this.context.closePath();
			
			// draw lower angle arc
			this.context.arc(joint.localAnchorB[0], joint.localAnchorB[1], 30, joint.lowerAngle * Math.PI / 180, 0, false);
	    	this.context.stroke();

	    	// draw upper angle vector line
	    	this.context.strokeStyle = "#00f";
	    	this.context.beginPath();
	    	this.context.moveTo(joint.localAnchorB[0], joint.localAnchorB[1]);
			x = joint.localAnchorB[0] + 100 * Math.cos(joint.upperAngle * Math.PI / 180);
			y = joint.localAnchorB[1] + 100 * Math.sin(joint.upperAngle * Math.PI / 180);
			this.context.lineTo(x, y);
			this.context.stroke();
			this.context.closePath();

			// draw upper angle arc
			this.context.arc(joint.localAnchorB[0], joint.localAnchorB[1], 30, 0, joint.upperAngle * Math.PI / 180, false);
	    	this.context.stroke();
		}

		this.context.lineWidth = 1;
		this.setLineDash(0, 0);
	};

	Renderer.prototype.renderBody = function(body){
		// update aabb
		body.calculateBounds();

		// render sprite
		if (body.sprite){
			this.context.save();
			
			// if sprite is contained in a spritesheet	
			if (body.spriteData.length > 0){
				var sourceX = body.spriteData[0],
					sourceY = body.spriteData[1],
					sourceW = body.spriteData[2],
					sourceH = body.spriteData[3],
					imageW 	= body.spriteData[4];
					imageH	= body.spriteData[5];

				// handle sprite rotation and translation
				this.context.translate(body.position[0], body.position[1]);
				this.context.rotate(body.rotation * Math.PI / 180);

				// draw sprite
				this.context.drawImage(body.sprite, sourceX, sourceY, sourceW, sourceH, -imageW / 2, -imageH / 2, imageW, imageH);
			}
			// sprite is a separate image
			else {
				var imageW 	= body.sprite.width;// * body.scaleXY[0],
					imageH	= body.sprite.height;// * body.scaleXY[1];
				
				// handle sprite rotation and translation
				this.context.translate(body.position[0], body.position[1]);
				this.context.rotate(body.rotation * Math.PI / 180);
				
				// draw sprite
				this.context.drawImage(body.sprite, -imageW / 2, -imageH / 2, imageW, imageH);
			}
			
			this.context.restore();
		}

		// render shapes
		for (var i = 0; i < body.shapes.length; i++){
			this.renderShape(body.shapes[i], body.bodyType == 0 ? this.staticBodyColor : 0);
		}

		// render aabb 
		if (body.isSelected){
			this.context.strokeStyle = this.bodySelectedColor;
			this.context.lineWidth = 2;
			this.renderBox(body.bounds[0], body.bounds[1], body.bounds[2], body.bounds[3], false);
			this.context.lineWidth = 1;
		}

		// draw position of body
		this.context.fillStyle = "#000";
		this.context.fillRect(body.position[0] - 5, body.position[1] - 5, 10, 10);
	};

	Renderer.prototype.renderShape = function(shape, bodyColor){
		shape.calculateBounds();

		if (shape.vertices.length > 1){
			this.context.beginPath();
			this.context.moveTo(shape.vertices[0].x, shape.vertices[0].y);
			
			if (shape.inEditMode)
				this.renderVertex(shape.vertices[0]);
			
			for (var i = 1; i < shape.vertices.length; i++){
				context.lineTo(shape.vertices[i].x, shape.vertices[i].y);
				if (shape.inEditMode){
					this.renderVertex(shape.vertices[i]);
				}
			}
			
			if (shape.shapeType == Shape.SHAPE_CHAIN){
				this.context.strokeStyle = "#f00"
				this.context.stroke();
			}
			else {
				this.context.closePath();
				this.context.fillStyle = bodyColor || this.shapeColor;
				if (shape.isSelected){
					this.context.fillStyle = this.shapeSelectedColor;
				}
				this.context.fill();
			}

			// render aabb for polygon
			if (shape.isSelected){
				this.context.strokeStyle = "#ff0";
				this.context.lineWidth = 2;
				this.renderBox(shape.bounds[0], shape.bounds[1], shape.bounds[2], shape.bounds[3], false);
				this.context.lineWidth = 1;
			}

			this.context.strokeStyle = "#000";
		}

		// draw position of shape
		this.context.fillStyle = "#000";
		this.context.fillRect(shape.position[0] - 5, shape.position[1] - 5, 10, 10);

		// draw centroid of shape
		this.context.fillStyle = "#ff0";
		this.context.fillRect(shape.centroid[0] - 5, shape.centroid[1] - 5, 10, 10);
	};

	Renderer.prototype.renderGrid = function(range, cell_size_unused){
		var cell_size = 10;
		for (var x = -range; x <= range; x += cell_size){
			this.context.moveTo(x * cell_size, -range * cell_size);
			this.context.lineTo(x * cell_size,  range * cell_size);
		}
		for (var y = -range; y <= range; y += cell_size){
			this.context.moveTo(-range * cell_size, y * cell_size);
			this.context.lineTo( range * cell_size, y * cell_size);	
		}
		this.context.strokeStyle = "#f00";
		this.context.lineWidth = 0.15 + 0.05 / cell_size;
		this.context.stroke();

		cell_size = 5;
		for (var x = -range; x <= range; x += cell_size){
			if (x == 0){									// to darken y - axis
				this.context.moveTo(-0.05 * cell_size, -range * cell_size);
				this.context.lineTo(-0.05 * cell_size,  range * cell_size);

				this.context.moveTo(-0.025 * cell_size, -range * cell_size);
				this.context.lineTo(-0.025 * cell_size,  range * cell_size);

				this.context.moveTo(x * cell_size, -range * cell_size);
				this.context.lineTo(x * cell_size,  range * cell_size);

				this.context.moveTo(0.025 * cell_size, -range * cell_size);
				this.context.lineTo(0.025 * cell_size,  range * cell_size);

				this.context.moveTo(0.05 * cell_size, -range * cell_size);
				this.context.lineTo(0.05 * cell_size,  range * cell_size);
			}
			this.context.moveTo(x * cell_size, -range * cell_size);
			this.context.lineTo(x * cell_size,  range * cell_size);
		}
		for (var y = -range; y <= range; y += cell_size){
			if (y == 0){									// to darken x - axis
				this.context.moveTo(-range * cell_size, -0.05 * cell_size);
				this.context.lineTo( range * cell_size, -0.05 * cell_size);

				this.context.moveTo(-range * cell_size, -0.025 * cell_size);
				this.context.lineTo( range * cell_size, -0.025 * cell_size);	

				this.context.moveTo(-range * cell_size, y * cell_size);
				this.context.lineTo( range * cell_size, y * cell_size);

				this.context.moveTo(-range * cell_size, 0.025 * cell_size);
				this.context.lineTo( range * cell_size, 0.025 * cell_size);	

				this.context.moveTo(-range * cell_size, 0.05 * cell_size);
				this.context.lineTo( range * cell_size, 0.05 * cell_size);	
			}
			this.context.moveTo(-range * cell_size, y * cell_size);
			this.context.lineTo( range * cell_size, y * cell_size);	
		}
		this.context.strokeStyle = "#0f0";
		this.context.lineWidth = 0.1 + 0.05 / cell_size;
		this.context.stroke();
		this.context.lineWidth = 1;
		this.context.strokeStyle = "#000";
		
		// draw scale
		this.context.fillStyle = "#0f0";
		this.context.font = 10 * (1 + 0.6 / cell_size) + "px Arial";
		for (var x = -range; x <= range; x += cell_size){
			if (x != 0 && (x * cell_size) % 100 == 0){			
				this.context.fillText(x * cell_size, x * cell_size - 10, (-20 / cell_size));
				this.renderCircle(x * cell_size, 0, 3 * (1 + 0.5 / cell_size), true);
			}
		}
		for (var y = -range; y <= range; y += cell_size){
			if (y != 0 && (y * cell_size) % 100 == 0){
				this.context.fillText(y * cell_size, (20 / cell_size), y * cell_size + 5);
				this.renderCircle(0, y * cell_size, 3 * (1 + 0.5 / cell_size), true);
			}
		}
	};

	Renderer.prototype.renderBox = function(x, y, w, h, fill){
		if (fill) this.context.fillRect(x - w / 2, y - h / 2, w, h);
		this.context.strokeRect(x - w / 2, y - h / 2, w, h);
	};

	Renderer.prototype.renderCircle = function(x, y, r, fill){
		this.context.beginPath();
    	this.context.arc(x, y, r, 0, 2 * Math.PI, false);
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
		this.navigator.panning[0] += canvas.width / 2;			// move origin-x to center of viewport (canvas)
		this.navigator.panning[1] += canvas.height / 2;			// move origin-y to center of viewport (canvas)
		this.inputHandler = new InputHandler();
		this.renderer = new Renderer(this.context);
		this.renderer.setStageWidthHeight(canvas.width, canvas.height);

		this.sceneManager = sceneManager;

		this.gameView;

		// prevent default right click behaviour
		this.canvas.addEventListener("contextmenu", function(e){
			e.preventDefault();
		});
	}

	Viewport.prototype.onKeyDown = function(e){
		// return if in game mode
		if (this.inputHandler.inGameMode)
			return;

		if (e.which == 17){
			this.inputHandler.CTRL_PRESSED = 1;
		}
		else if (e.which == 16){
			this.inputHandler.SHIFT_PRESSED = 1;
		}
		else if (e.which == 18){
			this.inputHandler.ALT_PRESSED = 0;
		}
		else if (e.which == 83){
			this.inputHandler.SNAPPING_ENABLED = !this.inputHandler.SNAPPING_ENABLED;
		}
	};

	Viewport.prototype.onKeyUp = function(e){
		// return if in game mode
		if (this.inputHandler.inGameMode)
			return;

		if (e.which == 17){
			this.inputHandler.CTRL_PRESSED = 0;
		}
		else if (e.which == 16){
			this.inputHandler.SHIFT_PRESSED = 0;
		}
		else if (e.which == 18){
			this.inputHandler.ALT_PRESSED = 0;
		}

		else if (e.which == 46){		// delete selected object
			this.sceneManager.deleteSelectedObjects();
		}
		
		else if (e.which == 87){		// w - key pressed => enable translation tool
			this.inputHandler.activateTranslationTool();
		}
		else if (e.which == 69){		// e - key pressed => enable rotationtool
			this.inputHandler.activateRotationTool();
		}
		else if (e.which == 82){		// r - key pressed => enable scale tool
			this.inputHandler.activateScaleTool();
		}

		else if (e.which == 68 && this.inputHandler.SHIFT_PRESSED){
			this.sceneManager.duplicateSelection();
		}
	};

	Viewport.prototype.onMouseDown = function(e){
		var inputHandler = this.inputHandler;
		inputHandler.mouseStatus[0] = 1;

		inputHandler.pointerWorldPos[0] = this.navigator.screenPointToWorld(e.offsetX, e.offsetY)[0];
		inputHandler.pointerWorldPos[1] = this.navigator.screenPointToWorld(e.offsetX, e.offsetY)[1];

		// check whether right button is pressd or not
		if (e.which)
			inputHandler.mouseStatus[1] = (e.which == 3) + 1;
    	else if (e.button)
    		inputHandler.mouseStatus[1] = (e.button == 2) + 1;

		inputHandler.start = [e.offsetX, e.offsetY];

		if (inputHandler.mouseStatus[1] == InputHandler.IS_RIGHT_MOUSE_BUTTON)
			return;

		// return if in game mode
		if (this.inputHandler.inGameMode)
			return;

		// select bodies
		if (!this.sceneManager.onMouseDown(e, this.inputHandler, this.navigator)){
			inputHandler.selectionArea[0] = e.offsetX;
			inputHandler.selectionArea[1] = e.offsetY;
			inputHandler.selectionArea[4] = 1;
		}

		// selected object goes to inputHandler.selection[]
		else {
			if (this.sceneManager.state == this.sceneManager.STATE_DEFAULT_MODE){
				inputHandler.selection = this.sceneManager.selectedBodies;
			}
			else if (this.sceneManager.state == this.sceneManager.STATE_BODY_EDIT_MODE){
				inputHandler.selection = this.sceneManager.selectedShapes;
			}
			else if (this.sceneManager.state == this.sceneManager.STATE_SHAPE_EDIT_MODE){
				inputHandler.selection = this.sceneManager.selectedVertices;
			}
		}
	};

	Viewport.prototype.onMouseMove = function(e){
		var inputHandler = this.inputHandler, navigator = this.navigator, sceneManager = this.sceneManager;

		inputHandler.pointerWorldPos[2] = navigator.screenPointToWorld(e.offsetX, e.offsetY)[0];
		inputHandler.pointerWorldPos[3] = navigator.screenPointToWorld(e.offsetX, e.offsetY)[1];

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

			// return if in game mode
			if (this.inputHandler.inGameMode){
				inputHandler.selectionArea[2] = 0;
				inputHandler.selectionArea[3] = 0;
				return;
			}

			if (inputHandler.selectionArea[4]){
				return;
			}

			// edit bodies and shapes
			inputHandler.snappingData[0] = navigator.cell_size * 5;
			sceneManager.transformSelection(inputHandler.delta, inputHandler);
		}
	};

	Viewport.prototype.onMouseUp = function(e){
		var inputHandler = this.inputHandler, sceneManager = this.sceneManager;
		inputHandler.mouseStatus[0] = 0;

		// return if in game mode
		if (this.inputHandler.inGameMode)
			return;

		if (inputHandler.selectionArea[4]){
			var startPoint = this.screenPointToWorld(inputHandler.selectionArea[0], inputHandler.selectionArea[1]),
				endPoint = this.screenPointToWorld(e.offsetX, e.offsetY);
			var lineSegment  = new LineSegment(startPoint[0], startPoint[1], endPoint[0], endPoint[1]);

			// edit bodies and shapes
			if (sceneManager.state == sceneManager.STATE_DEFAULT_MODE){
				if (!inputHandler.SHIFT_PRESSED){
					sceneManager.selectedBodies = [];
				}
				for (var i = 0; i < sceneManager.bodies.length; i++){
					if (lineSegment.checkInBoundsAABB(sceneManager.bodies[i].bounds)){
						if (sceneManager.selectedBodies.indexOf(sceneManager.bodies[i]) < 0){
							sceneManager.selectedBodies.push(sceneManager.bodies[i]);
						}
						sceneManager.bodies[i].isSelected = true;
					}
					else {
						if (!inputHandler.SHIFT_PRESSED){
							sceneManager.bodies[i].isSelected = false;
						}
					}
				}
			}
			else if (sceneManager.state == sceneManager.STATE_BODY_EDIT_MODE){
				if (!inputHandler.SHIFT_PRESSED){
					sceneManager.selectedShapes = [];
				}
				for (var i = 0; i < sceneManager.selectedBodies[0].shapes.length; i++){
					
					if (lineSegment.checkInBoundsAABB(sceneManager.selectedBodies[0].shapes[i].bounds)){
						if (sceneManager.selectedShapes.indexOf(sceneManager.selectedBodies[0].shapes[i]) < 0){
							sceneManager.selectedShapes.push(sceneManager.selectedBodies[0].shapes[i]);
						}
						sceneManager.selectedBodies[0].shapes[i].isSelected = true;
					}
					else {
						if (!inputHandler.SHIFT_PRESSED){
							sceneManager.selectedBodies[0].shapes[i].isSelected = false;
						}
					}
				}
			}
			else if (sceneManager.state == sceneManager.STATE_SHAPE_EDIT_MODE){
				if (!inputHandler.SHIFT_PRESSED){
					sceneManager.selectedVertices = [];
				}
				for (var i = 0; i < sceneManager.selectedShapes[0].vertices.length; i++){
					var vertex = sceneManager.selectedShapes[0].vertices[i];
					if (lineSegment.checkInBoundsAABB([vertex.x, vertex.y, vertex.width, vertex.height])){
						if (sceneManager.selectedVertices.indexOf(sceneManager.selectedShapes[0].vertices[i]) < 0){
							sceneManager.selectedVertices.push(sceneManager.selectedShapes[0].vertices[i]);
						}
						sceneManager.selectedShapes[0].vertices[i].isSelected = true;
					}
					else{
						if (!inputHandler.SHIFT_PRESSED){
							sceneManager.selectedShapes[0].vertices[i].isSelected = false;	
						}
					}
				}
			}

			// selected object goes to inputHandler.selection[]
			if (sceneManager.state == sceneManager.STATE_DEFAULT_MODE){
				inputHandler.selection = sceneManager.selectedBodies;
			}
			else if (sceneManager.state == sceneManager.STATE_BODY_EDIT_MODE){
				inputHandler.selection = sceneManager.selectedShapes;
			}
			else if (this.sceneManager.state == sceneManager.STATE_SHAPE_EDIT_MODE){
				inputHandler.selection = sceneManager.selectedVertices;
			}
		}

		inputHandler.selectionArea = [0, 0, 0, 0, 0];
	};

	Viewport.prototype.onClick = function(e){
		// var sceneManager = this.sceneManager,
		// 	inputHandler = this.inputHandler;
	};

	Viewport.prototype.onDoubleClick = function(e){
		// var sceneManager = this.sceneManager,
		// 	inputHandler = this.inputHandler;
	};

	// viewport scaling
	Viewport.prototype.onMouseWheel = function(e){
		var mouseX = e.offsetX;
	    var mouseY = e.offsetY;
	    var wheel = e.wheelDelta / 120;

	    var navigator = this.navigator;

	    var zoom = 1 + Math.sign(wheel) * Math.min(Math.abs(wheel / 20), 0.1);

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

	Viewport.prototype.draw = function(gameView){
		var inputHandler = this.inputHandler, navigator = this.navigator, renderer = this.renderer, sceneManager = this.sceneManager;
		
		// clear screen
		renderer.clear(navigator.origin[0], navigator.origin[1], renderer.width / navigator.scale, renderer.height / navigator.scale);

		// saving the current state of the canvas
		renderer.getContext().save();

		// applying panning to canvas
		renderer.getContext().translate(navigator.panning[0], navigator.panning[1]);
		
		// rendering the grid
		navigator.range = 1000;
		navigator.cell_size = 10 / Math.max(1, Math.min(parseInt(navigator.scale), 2));
		renderer.renderGrid(navigator.range, navigator.cell_size);

		if (!inputHandler.inGameMode){
			// rendering the bodies
			for (var i = 0; i < sceneManager.bodies.length; i++){
				renderer.renderBody(sceneManager.bodies[i]);
			}

			// rendering the joints
			for (var i = 0; i < sceneManager.joints.length; i++){
				renderer.renderJoint(sceneManager.joints[i]);
			}

			// draw selection area if active
			if (inputHandler.selectionArea[4]){
				var position = this.screenPointToWorld(inputHandler.selectionArea[0], inputHandler.selectionArea[1]),
					width = inputHandler.selectionArea[2] / navigator.scale,
					height = inputHandler.selectionArea[3] / navigator.scale;

				this.renderer.setLineDash(5, 5);
				renderer.getContext().strokeStyle = "#fff";
				this.renderer.renderBox(position[0] + width / 2, position[1] + height / 2, width, height, false);
				renderer.getContext().strokeStyle = "#000";
				this.renderer.setLineDash(0, 0);
			}
		}
		else {
			if (gameView){
				gameView.updateGameLogic();
			}
		}

		// restoring the saved canvas state
		renderer.getContext().restore();
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

	Viewport.prototype.getSceneManager = function(){
		return this.sceneManager;
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