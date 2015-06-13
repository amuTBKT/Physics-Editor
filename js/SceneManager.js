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
	// this.STATE_SHAPE_DRAW_MODE = 4;

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

	// SceneManager.prototype.checkPointInShape = function(px, py, polyVerts){
	// 	var i, len, v1, v2, edge, c;
	// 	for (i = 0, len = polyVerts.length; i < len; i++) {

	// 	    v1 = [polyVerts[i][0] - px, polyVerts[i][1] - py];
		    
	// 	    v2 = (polyVerts[i+1 > len-1 ? 0 : i+1][0] - px, polyVerts[i+1 > len-1 ? 0 : i+1][1] - py)
	    	
	//     	edge = [v1[0] - v2[0], v1[1] - v2[1]];

	//     	c = edge[0] * v1[1] - edge[1] * v1[0];
	//     	if (c < 0) { 
	//     		return false; 
	//     	}
	//   	}
	// 	return true
	// };

	SceneManager.prototype.checkCollisionWithChainShape = function(pointx, pointy, shape){
		var lineSegment, index = 0;
		for (var i = 0; i < shape.vertices.length; i++){
			if (i == shape.vertices.length - 1){
				lineSegment = new LineSegment(shape.vertices[i].x, shape.vertices[i].y, shape.vertices[0].x, shape.vertices[0].y);
			}
			else{
				lineSegment = new LineSegment(shape.vertices[i].x, shape.vertices[i].y, shape.vertices[i + 1].x, shape.vertices[i + 1].y);
			}

			if (lineSegment.distanceFromPoint(pointx, pointy) < 25){
				if (lineSegment.checkInBoundsX(pointx) || lineSegment.checkInBoundsY(pointy)){
					return true;		
				}
			}
		}
		return false;
	}

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
			
			if (!inputHandler.SHIFT_PRESSED){
				this.selectedShapes = [];
			}
			var minDistance = 1000000000, distance, shapeInBounds = false;
			for (var i = 0; i < this.selectedBodies[0].shapes.length; i++){
				var shape = this.selectedBodies[0].shapes[i];
				
				if (!inputHandler.SHIFT_PRESSED){
					shape.isSelected = false;
				}

				// var screenCoords = [], check = false;
				// for (var i = 0; i < shape.vertices.length; i++){
				// 	screenCoords[i] = navigator.worldPointToScreen(shape.vertices[i].x, shape.vertices[i].y);
				// }
				
				// check =	this.checkPointInShape(e.offsetX, e.offsetY, screenCoords);

				if (navigator.checkPointInAABB(e.offsetX, e.offsetY, shape.bounds)){
					var point = navigator.worldPointToScreen(shape.position[0], shape.position[1]);
					distance = (point[0] - e.offsetX) * (point[0] - e.offsetX) + (point[1] - e.offsetY) * (point[1] - e.offsetY);
					if (minDistance > distance){
						if (shape.shapeType == Shape.SHAPE_CHAIN){
							var screenPointToWorld = navigator.screenPointToWorld(e.offsetX, e.offsetY);
							if (!this.checkCollisionWithChainShape(screenPointToWorld[0], screenPointToWorld[1], shape)){
								continue;
							}
						}
						if (!inputHandler.SHIFT_PRESSED){
							this.selectedShapes[0] = shape;
							shape.isSelected = true;
						}
						else {
							if (this.selectedShapes.indexOf(shape) < 0){
								this.selectedShapes.push(shape);
								shape.isSelected = true;
							}
						}
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

	SceneManager.prototype.transformSelection = function(delta, inputHandler){
		if (this.state == this.STATE_DEFAULT_MODE){
			if (inputHandler.transformTool == 7){
				for (var i = 0; i < this.selectedBodies.length; i++){
					this.selectedBodies[i].move(delta[0], delta[1]);
				}
				return;	
			}

			if (inputHandler.pivotMode == 3){			// InputHandler.PIVOT_LOCAL_MODE
				for (var i = 0; i < this.selectedBodies.length; i++){
					if (inputHandler.transformTool == 5){
						this.selectedBodies[i].scale(delta[0], delta[1]);
					}
					else if (inputHandler.transformTool == 6){
						this.selectedBodies[i].rotate(delta[0]);
					}
				}
				return;
			}

			var pivot = [0, 0];
			for (var i = 0; i < this.selectedBodies.length; i++){
				pivot[0] += this.selectedBodies[i].position[0];
				pivot[1] += this.selectedBodies[i].position[1];
			}
			pivot[0] /= this.selectedBodies.length;
			pivot[1] /= this.selectedBodies.length;

			for (var i = 0; i < this.selectedBodies.length; i++){
				if (inputHandler.transformTool == 5){
					this.selectedBodies[i].scale(delta[0], delta[1], pivot[0], pivot[1]);
				}
				else if (inputHandler.transformTool == 6){
					this.selectedBodies[i].rotate(delta[0], pivot[0], pivot[1]);
				} 
			}
		}

		else if (this.state == this.STATE_BODY_EDIT_MODE){
			if (inputHandler.transformTool == 7){
				for (var i = 0; i < this.selectedShapes.length; i++){
					this.selectedShapes[i].move(delta[0], delta[1]);
				}
				return;	
			}

			if (inputHandler.pivotMode == 3){
				for (var i = 0; i < this.selectedShapes.length; i++){
					if (inputHandler.transformTool == 5){
						this.selectedShapes[i].scale(delta[0], delta[1]);
					}
					else if (inputHandler.transformTool == 6){
						this.selectedShapes[i].rotate(delta[0]);	
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
				if (inputHandler.transformTool == 5){
					this.selectedShapes[i].scale(delta[0], delta[1], pivot[0], pivot[1]);
				}
				else if (inputHandler.transformTool == 6){
					this.selectedShapes[i].rotate(delta[0], pivot[0], pivot[1]);
				}
			}
		}

		else if (this.state == this.STATE_SHAPE_EDIT_MODE){
			if (inputHandler.transformTool == 7){
				for (var i = 0; i < this.selectedVertices.length; i++){
					this.selectedVertices[i].move(delta[0], delta[1]);
				}
				return;	
			}

			if (this.selectedVertices.length < 1)
				return;

			var pivot = [0, 0];
			for (var i = 0; i < this.selectedVertices.length; i++){
				pivot[0] += this.selectedVertices[i].x;
				pivot[1] += this.selectedVertices[i].y;
			}
			pivot[0] /= this.selectedVertices.length;
			pivot[1] /= this.selectedVertices.length;

			for (var i = 0; i < this.selectedVertices.length; i++){
				var vertex = this.selectedVertices[i];
				if (inputHandler.transformTool == 5){
					vertex.move(-pivot[0], -pivot[1]);
					vertex.x *= delta[0];
					vertex.y *= delta[1];
					vertex.move(pivot[0], pivot[1]);
				}
				else if (inputHandler.transformTool == 6){
					var x = vertex.x - pivot[0];
					var y = vertex.y - pivot[1];
					var newAngle = delta[0] + Math.atan2(y, x) * 180 / Math.PI;
					var length = Math.pow(x * x + y * y, 0.5);
					vertex.x = pivot[0] + length * Math.cos(newAngle * Math.PI / 180);
					vertex.y = pivot[1] + length * Math.sin(newAngle * Math.PI / 180);
				}
			}
		}
	};

	SceneManager.prototype.addBody = function(body){
		this.bodies.push(body);
	};

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