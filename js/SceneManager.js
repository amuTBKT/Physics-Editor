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

				if (navigator.checkPointInAABB(e.offsetX, e.offsetY, shape.bounds)){
					var point = navigator.worldPointToScreen(shape.position[0], shape.position[1]);
					distance = (point[0] - e.offsetX) * (point[0] - e.offsetX) + (point[1] - e.offsetY) * (point[1] - e.offsetY);
					if (minDistance > distance){
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