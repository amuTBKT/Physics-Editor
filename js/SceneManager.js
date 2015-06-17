var SceneManager = (function(){

	function SceneManager(){
		this.STATE_DEFAULT_MODE 	= 0;
		this.STATE_SHAPE_EDIT_MODE 	= 1;
		this.STATE_BODY_EDIT_MODE 	= 2;
		this.STATE_SHAPE_DRAW_MODE  = 3;

		this.state = this.STATE_DEFAULT_MODE;
		this.bodies = [];
		this.selectedBodies = [];
		this.selectedShapes = [];
		this.selectedVertices = [];
	}

	SceneManager.prototype.enterDefaultMode = function(){
		this.state = this.STATE_DEFAULT_MODE;

		if (this.selectedShapes.length > 0){
			this.selectedShapes[0].inEditMode = false;
			this.selectedShapes[0].isSelected = false;
		}
	};

	SceneManager.prototype.enterBodyEditMode = function(){
		if (this.selectedBodies.length > 1)
			return;

		if (this.selectedShapes.length > 0)
			this.selectedShapes[0].inEditMode = false;
		
		this.state = this.STATE_BODY_EDIT_MODE;
	};

	SceneManager.prototype.enterShapeEditMode = function(){
		if (this.state != this.STATE_BODY_EDIT_MODE)
			return;

		if (this.selectedShapes.length != 1)
			return;

		this.state = this.STATE_SHAPE_EDIT_MODE;
		this.selectedShapes[0].inEditMode = true;
	};

	SceneManager.prototype.deleteSelectedObjects = function(){
		if (this.state == this.STATE_DEFAULT_MODE){
			for (var i = 0; i < this.selectedBodies.length; i++){
				this.removeBody(this.selectedBodies[i]);
			}
		}
		else if (this.state == this.STATE_BODY_EDIT_MODE){
			for (var i = 0; i < this.selectedShapes.length; i++){
				this.selectedBodies[0].removeShapeGivenShape(this.selectedShapes[i]);
			}
		}
		else if (this.state == this.STATE_SHAPE_EDIT_MODE){
			for (var i = 0; i < this.selectedVertices.length; i++){
				this.selectedShapes[0].removeVertexGivenVertex(this.selectedVertices[i]);
			}
		}
	};

	// don't use only aabb collision detection for chain shapes, instead use its edges
	SceneManager.prototype.checkCollisionWithChainShape = function(pointx, pointy, shape){
		var lineSegment, index = 0;
		for (var i = 0; i < shape.vertices.length; i++){
			if (i == shape.vertices.length - 1){
				lineSegment = new LineSegment(shape.vertices[i].x, shape.vertices[i].y, shape.vertices[0].x, shape.vertices[0].y);
			}
			else{
				lineSegment = new LineSegment(shape.vertices[i].x, shape.vertices[i].y, shape.vertices[i + 1].x, shape.vertices[i + 1].y);
			}

			// use some threshold to determine collision
			if (lineSegment.distanceFromPoint(pointx, pointy) < 10){
				if (lineSegment.checkInBoundsX(pointx) || lineSegment.checkInBoundsY(pointy)){
					return true;		
				}
			}
		}
		return false;
	}

	// for selecting objects
	SceneManager.prototype.onMouseDown = function(e, inputHandler, navigator){
		if (this.state == this.STATE_SHAPE_EDIT_MODE){
			// for rendering vertices
			this.selectedShapes[0].inEditMode = true;
			
			// for adding vertex to the selected shape
			if (inputHandler.CTRL_PRESSED){
				var point = navigator.screenPointToWorld(e.offsetX, e.offsetY);
				this.selectedShapes[0].addVertex(new Vertex(point[0], point[1], 10, 10));
				return true;
			}

			// for handling multiple vertices
			if (this.selectedVertices.length > 1) {
				for (var i = 0; i < this.selectedVertices.length; i++){
					var vertex = this.selectedVertices[i];
					if (navigator.checkPointInAABB(e.offsetX, e.offsetY, [vertex.x, vertex.y, vertex.width, vertex.height])){
						if (inputHandler.SHIFT_PRESSED){
							break;
						}
						return true;
					}
				}
			}

			if (!inputHandler.SHIFT_PRESSED){
				this.selectedVertices = [];			
			}
			var vertexInBounds = false;
			for (var i = 0; i < this.selectedShapes[0].vertices.length; i++){
				var vertex = this.selectedShapes[0].vertices[i];

				if (!inputHandler.SHIFT_PRESSED){
					vertex.isSelected = false;
				}
				if (navigator.checkPointInAABB(e.offsetX, e.offsetY, [vertex.x, vertex.y, vertex.width, vertex.height])){
					if (!inputHandler.SHIFT_PRESSED){
						this.selectedVertices[0] = vertex;
						vertex.isSelected = true;
					}
					else {
						if (this.selectedVertices.indexOf(vertex) < 0){
							this.selectedVertices.push(vertex);
							vertex.isSelected = true;
						}
					}
					vertexInBounds = true;
				}
			}
			return vertexInBounds;
		}

		if (this.state == this.STATE_BODY_EDIT_MODE){
			// for handling multiple shapes
			if (this.selectedShapes.length > 1) {
				for (var i = 0; i < this.selectedShapes.length; i++){
					var shape = this.selectedShapes[i];
					if (navigator.checkPointInAABB(e.offsetX, e.offsetY, shape.bounds)){
						// check for chain shapes
						if (shape.shapeType == Shape.SHAPE_CHAIN){
							var screenPointToWorld = navigator.screenPointToWorld(e.offsetX, e.offsetY);
							if (!this.checkCollisionWithChainShape(screenPointToWorld[0], screenPointToWorld[1], shape)){
								continue;
							}
						}
						
						if (inputHandler.SHIFT_PRESSED){
							break;
						}
						return true;
					}
				}
			}
			
			// don't reset selecteShapes array if shift is pressed (multiple selection)			
			if (!inputHandler.SHIFT_PRESSED){
				this.selectedShapes = [];
			}
			var minDistance = 1000000000, distance, shapeInBounds = false;
			for (var i = 0; i < this.selectedBodies[0].shapes.length; i++){
				var shape = this.selectedBodies[0].shapes[i];
				
				if (!inputHandler.SHIFT_PRESSED){
					shape.isSelected = false;
				}

				// check if test point is in the shape
				if (navigator.checkPointInAABB(e.offsetX, e.offsetY, shape.bounds)){
					
					var point = navigator.worldPointToScreen(shape.position[0], shape.position[1]);
					distance = (point[0] - e.offsetX) * (point[0] - e.offsetX) + (point[1] - e.offsetY) * (point[1] - e.offsetY);
					// check for minimum distance in case the test point is in multiple shapes 
					if (minDistance > distance){

						// if shape is chain_shape the check for intersection between test point and its edges with some threshold 
						if (shape.shapeType == Shape.SHAPE_CHAIN){
							var screenPointToWorld = navigator.screenPointToWorld(e.offsetX, e.offsetY);
							if (!this.checkCollisionWithChainShape(screenPointToWorld[0], screenPointToWorld[1], shape)){
								continue;
							}
						}

						// multiple selection is disabled
						if (!inputHandler.SHIFT_PRESSED){
							this.selectedShapes[0] = shape;
							shape.isSelected = true;
						}
						// user is holding shift, so multiple selection is active
						else {
							// check if the shape is already selected
							if (this.selectedShapes.indexOf(shape) < 0){
								this.selectedShapes.push(shape);
								shape.isSelected = true;
							}
						}

						// shape selected so return true
						shapeInBounds = true;
						minDistance = distance;
					}
				}
			}
			return shapeInBounds;
		}

		if (this.state == this.STATE_DEFAULT_MODE){
			// for handling multiple bodies
			if (this.selectedBodies.length > 1){
				for (var i = 0; i < this.selectedBodies.length; i++){
					var body = this.selectedBodies[i];
					if (navigator.checkPointInAABB(e.offsetX, e.offsetY, body.bounds)){
						if (inputHandler.SHIFT_PRESSED){
							break;
						}
						return true;
					}
				}	
			}

			if (!inputHandler.SHIFT_PRESSED){
				this.selectedBodies = [];
			}
			var minDistance = 1000000000, distance, bodyInBounds = false;
			for (var i = 0; i < this.bodies.length; i++){
				var body = this.bodies[i];
				
				if(!inputHandler.SHIFT_PRESSED){
					body.isSelected = false;
				}

				if (navigator.checkPointInAABB(e.offsetX, e.offsetY, body.bounds)){
					var point = navigator.worldPointToScreen(body.position[0], body.position[1]);
					distance = (point[0] - e.offsetX) * (point[0] - e.offsetX) + (point[1] - e.offsetY) * (point[1] - e.offsetY);
					if (minDistance > distance){
						if (!inputHandler.SHIFT_PRESSED){
							this.selectedBodies[0] = body;
							body.isSelected = true;
						}
						else {
							if (this.selectedBodies.indexOf(body) < 0){
								this.selectedBodies.push(body);
								body.isSelected = true;
							}
						}
						minDistance = distance;
					}
					bodyInBounds = true;
				}
			}
			return bodyInBounds;
		}
		return false;
	};

	/**
	*
	* params x,	 			position on x - axis, null if only y pos is to be set (use null only when move = 0)
	* params y,    			position on y - axis, null if only x pos is to be set (use null only when move = 0)
	* params move, 			1 for moving, 0 for setting position
	* params inputHandler, 	information about pivot mode and snapping data
	*/
	SceneManager.prototype.setPositionOfSelectedObjects = function(x, y, move, inputHandler){
		if (this.state == this.STATE_DEFAULT_MODE){
			for (var i = 0; i < this.selectedBodies.length; i++){
				if (move){
					this.selectedBodies[i].move(x, y);
					if (inputHandler.SNAPPING_ENABLED){
						this.selectedBodies[i].setPosition(parseInt(inputHandler.pointerWorldPos[2] / inputHandler.snappingData[0]) * inputHandler.snappingData[0],
								 parseInt(inputHandler.pointerWorldPos[3] / inputHandler.snappingData[0]) * inputHandler.snappingData[0]);
					}
				}
				else{
					var px = x == null ? this.selectedBodies[i].position[0] : x;
					var py = y == null ? this.selectedBodies[i].position[1] : y;
					this.selectedBodies[i].setPosition(px, py);
				}
			}
		}
		else if (this.state == this.STATE_BODY_EDIT_MODE){
			for (var i = 0; i < this.selectedShapes.length; i++){
				if (move){
					this.selectedShapes[i].move(x, y);
					if (inputHandler.SNAPPING_ENABLED){
						this.selectedShapes[i].setPosition(parseInt(inputHandler.pointerWorldPos[2] / inputHandler.snappingData[0]) * inputHandler.snappingData[0],
								 parseInt(inputHandler.pointerWorldPos[3] / inputHandler.snappingData[0]) * inputHandler.snappingData[0]);
					}
				}
				else {
					var px = x == null ? this.selectedShapes[i].position[0] : x;
					var py = y == null ? this.selectedShapes[i].position[1] : y;
					this.selectedShapes[i].setPosition(px, py);
				}
			}
		}
		else if (	this.state == this.STATE_SHAPE_EDIT_MODE && 
					this.selectedShapes[0].shapeType != Shape.SHAPE_BOX && 
					this.selectedShapes[0].shapeType != Shape.SHAPE_CIRCLE){
			for (var i = 0; i < this.selectedVertices.length; i++){
				if (move){
					this.selectedVertices[i].x = x + this.selectedVertices[i].x * move;
					this.selectedVertices[i].y = y + this.selectedVertices[i].y * move;

					if (inputHandler.SNAPPING_ENABLED){
						this.selectedVertices[i].x = parseInt(inputHandler.pointerWorldPos[2] / inputHandler.snappingData[0]) * inputHandler.snappingData[0];
						this.selectedVertices[i].y = parseInt(inputHandler.pointerWorldPos[3] / inputHandler.snappingData[0]) * inputHandler.snappingData[0];
					}	
				}
				else {
					var px = x == null ? this.selectedVertices[i].x : x;
					var py = y == null ? this.selectedVertices[i].y : y;
					this.selectedVertices[i].x = px;
					this.selectedVertices[i].y = py;	
				}
			}
		}
	};

	/**
	*
	* params sx,	 			x scale, null if only y scale is to be set (use null only when scale = 0)
	* params sy,    			y scale, null if only x scale is to be set (use null only when scale = 0)
	* params scale, 			1 for scaling, 0 for setting scale
	* params inputHandler, 	information about pivot mode and snapping data
	*/
	SceneManager.prototype.setScaleOfSelectedObjects = function(sx, sy, scale, inputHandler){
		if (this.state == this.STATE_DEFAULT_MODE){
			if (inputHandler.pivotMode == 3){								// InputHandler.PIVOT_LOCAL_MODE
				for (var i = 0; i < this.selectedBodies.length; i++){
					if (scale){
						this.selectedBodies[i].scale(sx, sy);
					}
					else {
						var sclx = sx == null ? this.selectedBodies[i].scaleXY[0] : sx;
						var scly = sy == null ? this.selectedBodies[i].scaleXY[1] : sy;
						this.selectedBodies[i].setScale(sclx, scly);	
					}
				}
				return;
			}

			// if selection center is used as pivot (selection center)
			var pivot = [0, 0];
			for (var i = 0; i < this.selectedBodies.length; i++){
				pivot[0] += this.selectedBodies[i].position[0];
				pivot[1] += this.selectedBodies[i].position[1];
			}
			pivot[0] /= this.selectedBodies.length;
			pivot[1] /= this.selectedBodies.length;

			for (var i = 0; i < this.selectedBodies.length; i++){
				if (scale){
					this.selectedBodies[i].scale(sx, sy, pivot[0], pivot[1]);
				}
				else {
					var sclx = sx == null ? this.selectedBodies[i].scaleXY[0] : sx;
					var scly = sy == null ? this.selectedBodies[i].scaleXY[1] : sy;
					this.selectedBodies[i].setScale(sclx, scly, pivot[0], pivot[1]);	
				}
			}
		}
		else if (this.state == this.STATE_BODY_EDIT_MODE){
			if (inputHandler.pivotMode == 3){
				for (var i = 0; i < this.selectedShapes.length; i++){
					if (scale){
						this.selectedShapes[i].scale(sx, sy);	
					}
					else {
						var sclx = sx == null ? this.selectedShapes[i].scaleXY[0] : sx;
						var scly = sy == null ? this.selectedShapes[i].scaleXY[1] : sy;
						this.selectedShapes[i].setScale(sclx, scly);
					}
				}
				return;
			}

			var pivot = [0, 0];
			for (var i = 0; i < this.selectedShapes.length; i++){
				pivot[0] += this.selectedShapes[i].position[0];
				pivot[1] += this.selectedShapes[i].position[1];
			}
			pivot[0] /= this.selectedShapes.length;
			pivot[1] /= this.selectedShapes.length;

			for (var i = 0; i < this.selectedShapes.length; i++){
				if (scale){
					this.selectedShapes[i].scale(sx, sy, pivot[0], pivot[1]);
				}
				else {
					var sclx = sx == null ? this.selectedShapes[i].scaleXY[0] : sx;
					var scly = sy == null ? this.selectedShapes[i].scaleXY[1] : sy;
					this.selectedShapes[i].setScale(sclx, scly, pivot[0], pivot[1]);
				}
			}
		}
		else if (	this.state == this.STATE_SHAPE_EDIT_MODE && 
					this.selectedShapes[0].shapeType != Shape.SHAPE_BOX && 
					this.selectedShapes[0].shapeType != Shape.SHAPE_CIRCLE){
			if (this.selectedVertices.length < 1)
				return;

			// here we always use selection center pivot mode
			var pivot = [0, 0];
			for (var i = 0; i < this.selectedVertices.length; i++){
				pivot[0] += this.selectedVertices[i].x;
				pivot[1] += this.selectedVertices[i].y;
			}
			pivot[0] /= this.selectedVertices.length;
			pivot[1] /= this.selectedVertices.length;

			for (var i = 0; i < this.selectedVertices.length; i++){
				var vertex = this.selectedVertices[i];	
				vertex.move(-pivot[0], -pivot[1]);
				var sclx = sx == null ? 1 : sx;
				var scly = sy == null ? 1 : sy;
				vertex.x *= sclx;
				vertex.y *= scly;
				vertex.move(pivot[0], pivot[1]);
			}
		}
	};

	/**
	*
	* params angle,	 		rotation
	* params rotate,    	1 for rotating, 0 for setting rotation (do not use rotate = 0 when editing vertices)
	* params inputHandler, 	information about pivot mode and snapping data
	*/
	SceneManager.prototype.setRotationOfSelectedObjects = function(angle, rotate, inputHandler){
		if (this.state == this.STATE_DEFAULT_MODE){
			if (inputHandler.pivotMode == 3){								// InputHandler.PIVOT_LOCAL_MODE
				for (var i = 0; i < this.selectedBodies.length; i++){
					if (rotate){
						this.selectedBodies[i].rotate(angle);
					}
					else {
						this.selectedBodies[i].setRotation(angle);
					}
				}
				return;
			}

			// if selection center is used as pivot (selection center)
			var pivot = [0, 0];
			for (var i = 0; i < this.selectedBodies.length; i++){
				pivot[0] += this.selectedBodies[i].position[0];
				pivot[1] += this.selectedBodies[i].position[1];
			}
			pivot[0] /= this.selectedBodies.length;
			pivot[1] /= this.selectedBodies.length;

			for (var i = 0; i < this.selectedBodies.length; i++){
				if (rotate){
					this.selectedBodies[i].rotate(angle, pivot[0], pivot[1]);
				}
				else {
					this.selectedBodies[i].setRotation(angle, pivot[0], pivot[1]);	
				}
			}
		}
		else if (this.state == this.STATE_BODY_EDIT_MODE){
			if (inputHandler.pivotMode == 3){
				for (var i = 0; i < this.selectedShapes.length; i++){
					if (rotate){
						this.selectedShapes[i].rotate(angle);	
					}
					else {
						this.selectedShapes[i].setRotation(angle);
					}
					
				}
				return;
			}

			var pivot = [0, 0];
			for (var i = 0; i < this.selectedShapes.length; i++){
				pivot[0] += this.selectedShapes[i].position[0];
				pivot[1] += this.selectedShapes[i].position[1];
			}
			pivot[0] /= this.selectedShapes.length;
			pivot[1] /= this.selectedShapes.length;

			for (var i = 0; i < this.selectedShapes.length; i++){
				if (rotate){
					this.selectedShapes[i].rotate(angle, pivot[0], pivot[1]);
				}
				else {
					this.selectedShapes[i].setRotation(angle, pivot[0], pivot[1]);
				}
			}
		}
		else if (	this.state == this.STATE_SHAPE_EDIT_MODE && 
					this.selectedShapes[0].shapeType != Shape.SHAPE_BOX && 
					this.selectedShapes[0].shapeType != Shape.SHAPE_CIRCLE){
			if (this.selectedVertices.length < 1)
				return;

			// here we always use selection center pivot mode
			var pivot = [0, 0];
			for (var i = 0; i < this.selectedVertices.length; i++){
				pivot[0] += this.selectedVertices[i].x;
				pivot[1] += this.selectedVertices[i].y;
			}
			pivot[0] /= this.selectedVertices.length;
			pivot[1] /= this.selectedVertices.length;

			for (var i = 0; i < this.selectedVertices.length; i++){
				var vertex = this.selectedVertices[i];
				var x = vertex.x - pivot[0];
				var y = vertex.y - pivot[1];
				var newAngle = angle + rotate * Math.atan2(y, x) * 180 / Math.PI;
				var length = Math.pow(x * x + y * y, 0.5);
				vertex.x = pivot[0] + length * Math.cos(newAngle * Math.PI / 180);
				vertex.y = pivot[1] + length * Math.sin(newAngle * Math.PI / 180);
			}
		}
	};

	/* 
	*
	* params delta, 		array for x and y axis manipulation
	* params inputHandler, 	info about pivot mode and snapping data
	*/
	SceneManager.prototype.transformSelection = function(delta, inputHandler){
		if (inputHandler.transformTool == 5){					// scale
			this.setScaleOfSelectedObjects(1 + delta[0] / 10, 1 - delta[1] / 10, 1, inputHandler);
		}
		else if (inputHandler.transformTool == 6){				// rotate
			this.setRotationOfSelectedObjects(delta[0], 1, inputHandler);
			
		}
		else if (inputHandler.transformTool == 7){				// translate
			this.setPositionOfSelectedObjects(delta[0], delta[1], 1, inputHandler);
		}
	};

	SceneManager.prototype.addBody = function(body){
		this.bodies.push(body);
	};

	/**
	*
	* params shapeType, shape to start with (use polygon or chain for editing it)
	* params asCircle,  1 if circle shape is to be generated, otherwise defaults to box (use only when polygon or chain shape is created)
	* creates new body and adds it to the scene
	*/
	SceneManager.prototype.createBody = function(shapeType, asCircle){
		var body = new Body();

		if (shapeType == Shape.SHAPE_POLYGON || shapeType == Shape.SHAPE_CHAIN){
			asCircle = asCircle || 0;
			var shape = new Shape(shapeType, asCircle);
		}
		else {
			var shape = new Shape(shapeType);
		}

		body.addShape(shape);
		this.addBody(body);
	};

	/**
	*
	* params shapeType, shape to be created (use polygon or chain for editing it)
	* params asCircle,  1 if circle shape is to be generated, otherwise defaults to box (use only when polygon or chain shape is created)
	* creates new shape and adds it to the selected body
	*/
	SceneManager.prototype.createShape = function(shapeType, asCircle){
		if (this.state != this.STATE_BODY_EDIT_MODE)
			return;

		if (shapeType == Shape.SHAPE_POLYGON || shapeType == Shape.SHAPE_CHAIN){
			asCircle = asCircle || 0;
			var shape = new Shape(shapeType, asCircle);
		}
		else {
			var shape = new Shape(shapeType);
		}

		this.selectedBodies[0].addShape(shape);
	};

	// removes body from the scene
	SceneManager.prototype.removeBody = function(body){
		for (var i = 0; i < this.bodies.length; i++){
			if (this.bodies[i] == body){
				if (i == 0){
					this.bodies.shift();
				}
				else if (i == this.bodies.length - 1){
					this.bodies.pop();
				}
				else {
					this.bodies.splice(i, 1);
				}
				break;
			}
		}
	};

	var instance;
	return{
		getInstance: function(){
			if (instance == null){
				instance = new SceneManager();
				instance.constructor = null;
			}
			return instance;
		}
	};

})();