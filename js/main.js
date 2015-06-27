var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;

var canvas, context, scale = 1;
var viewport, sceneManager, gameView;

function cloneArray(obj){
	 if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }
}

function loadVertex(obj){
	var vertices = [];
	for (var i = 0; i < obj.length; i++){
		var vertex = new Vertex();
		vertex.x = obj[i].x;
		vertex.y = obj[i].y;
		vertex.width = obj[i].width;
		vertex.height = obj[i].height;
		vertices.push(vertex);
	}
	return vertices;
}

function loadShape(obj){
	var shapes = [];
	for (var i = 0; i < obj.length; i++){
		var shape = new Shape(Shape.SHAPE_NONE);
		shape.shapeType = obj[i].shapeType;
		shape.position = cloneArray(obj[i].position);						// position
		shape.scaleXY = cloneArray(obj[i].scaleXY);						// scale
		shape.rotation = obj[i].rotation;							// only for editor purpose
		shape.vertices = loadVertex(obj[i].vertices);
		shape.bounds = cloneArray(obj[i].bounds);					// AABB for selecting
		shape.centroid = cloneArray(obj[i].centroid);						// centroid for shape

		// fixture properties
		shape.friction = obj[i].friction;
		shape.restitution = obj[i].restitution;
		shape.density = obj[i].density;
		shape.isSensor = obj[i].isSensor;

		if (shape.shapeType == Shape.SHAPE_BOX){
			shape.width = obj[i].width;
			shape.height = obj[i].height;
		}
		else if (shape.shapeType == Shape.SHAPE_CIRCLE){
			shape.radius = obj[i].radius;
		}

		shapes.push(shape);
	}
	return shapes;
}

function loadBody(obj){
	var body = new Body();
	body.name = obj.name;	// for editor
	body.userData = obj.userData;						// for physics body
	body.texture = obj.texture;
	body.sprite = obj.sprite;
	body.spriteData = cloneArray(obj.spriteData);					// [source-x, source-y, width, height, image-w, image-h]
	body.shapes = loadShape(obj.shapes);
	body.position = cloneArray(obj.position);
	body.scaleXY = cloneArray(obj.scaleXY);
	body.rotation = obj.rotation;
	body.bounds = cloneArray(obj.bounds);
	
	body.bodyType = obj.bodyType;	// default to dynmic body
	body.isBulllet = obj.isBulllet;
	body.isFixedRotation = obj.isFixedRotation;
	return body;
}

// initialize canvas and context
function init(){
	canvas = document.getElementById("canvas");
	canvas.width = SCREEN_WIDTH * 0.8;
	canvas.height = SCREEN_HEIGHT * 0.8;

	// var object = JSON.parse('{"STATE_DEFAULT_MODE":0,"STATE_SHAPE_EDIT_MODE":1,"STATE_BODY_EDIT_MODE":2,"STATE_SHAPE_DRAW_MODE":3,"state":0,"bodies":[{"name":"body0","userData":"","texture":"","spriteData":[],"shapes":[{"shapeType":0,"position":[-210,75],"scaleXY":[1,1],"rotation":0,"vertices":[{"x":-260,"y":25,"width":10,"height":10,"isSelected":false},{"x":-160,"y":25,"width":10,"height":10,"isSelected":false},{"x":-160,"y":125,"width":10,"height":10,"isSelected":false},{"x":-260,"y":125,"width":10,"height":10,"isSelected":false}],"bounds":[-210,75,100,100],"centroid":[-210,75],"isSelected":false,"inEditMode":false,"friction":1,"restitution":0.25,"density":1,"isSensor":0,"width":100,"height":100}],"position":[-210,75],"scaleXY":[1,1],"rotation":0,"bounds":[-210,75,100,100],"isSelected":false,"bodyType":2,"isBulllet":0,"isFixedRotation":false},{"name":"body1","userData":"","texture":"","spriteData":[],"shapes":[{"shapeType":1,"position":[99,-179],"scaleXY":[1,1],"rotation":0,"vertices":[{"x":149,"y":-179,"width":10,"height":10,"isSelected":false},{"x":139.45084971874738,"y":-149.61073738537635,"width":10,"height":10,"isSelected":false},{"x":114.45084971874738,"y":-131.44717418524232,"width":10,"height":10,"isSelected":false},{"x":83.54915028125264,"y":-131.44717418524232,"width":10,"height":10,"isSelected":false},{"x":58.54915028125263,"y":-149.61073738537635,"width":10,"height":10,"isSelected":false},{"x":49,"y":-179,"width":10,"height":10,"isSelected":false},{"x":58.54915028125263,"y":-208.38926261462365,"width":10,"height":10,"isSelected":false},{"x":83.54915028125262,"y":-226.55282581475768,"width":10,"height":10,"isSelected":false},{"x":114.45084971874736,"y":-226.55282581475768,"width":10,"height":10,"isSelected":false},{"x":139.45084971874735,"y":-208.38926261462368,"width":10,"height":10,"isSelected":false}],"bounds":[99,-179,100,95.10565162951536],"centroid":[99,-179],"isSelected":false,"inEditMode":false,"friction":1,"restitution":0.25,"density":1,"isSensor":0,"radius":50}],"position":[99,-179],"scaleXY":[1,1],"rotation":0,"bounds":[99,-179,100,95.10565162951536],"isSelected":false,"bodyType":2,"isBulllet":0,"isFixedRotation":false},{"name":"body2","userData":"","texture":"","spriteData":[],"shapes":[{"shapeType":2,"position":[91,100],"scaleXY":[1,1],"rotation":0,"vertices":[{"x":41,"y":50,"width":10,"height":10,"isSelected":false},{"x":141,"y":50,"width":10,"height":10,"isSelected":false},{"x":141,"y":150,"width":10,"height":10,"isSelected":false},{"x":41,"y":150,"width":10,"height":10,"isSelected":false}],"bounds":[91,100,100,100],"centroid":[91,100],"isSelected":false,"inEditMode":false,"friction":1,"restitution":0.25,"density":1,"isSensor":0}],"position":[91,100],"scaleXY":[1,1],"rotation":0,"bounds":[91,100,100,100],"isSelected":false,"bodyType":2,"isBulllet":0,"isFixedRotation":false},{"name":"body3","userData":"","texture":"","spriteData":[],"shapes":[{"shapeType":0,"position":[-114,-92],"scaleXY":[1,1],"rotation":0,"vertices":[{"x":-164,"y":-142,"width":10,"height":10,"isSelected":false},{"x":-64,"y":-142,"width":10,"height":10,"isSelected":false},{"x":-64,"y":-42,"width":10,"height":10,"isSelected":false},{"x":-164,"y":-42,"width":10,"height":10,"isSelected":false}],"bounds":[-114,-92,100,100],"centroid":[-114,-92],"isSelected":false,"inEditMode":false,"friction":1,"restitution":0.25,"density":1,"isSensor":0,"width":100,"height":100}],"position":[-114,-92],"scaleXY":[1,1],"rotation":0,"bounds":[-114,-92,100,100],"isSelected":false,"bodyType":2,"isBulllet":0,"isFixedRotation":false}],"joints":[],"selectedBodies":[],"selectedShapes":[],"selectedVertices":[],"selectedJoints":[],"constructor":null}');
	
	sceneManager = SceneManager.getInstance();
	// for (var i = 0; i < object.bodies.length; i++){
	// 	sceneManager.addBody(loadBody(object.bodies[i]));
	// }

	viewport = Viewport.getInstance(canvas, sceneManager);
	context = viewport.getRenderer().context;

	viewport.canvas.addEventListener("mousewheel", function(e){
		viewport.onMouseWheel(e);
	});
	viewport.canvas.addEventListener("mousedown", function(e){
		e.preventDefault();
		viewport.onMouseDown(e);

		if (viewport.getInputHandler().selection.length != 1){
			$("#pos_x")[0].value = 0;
			$("#pos_y")[0].value = 0;
			return;
		}

		if (viewport.getInputHandler().selection[0] instanceof Vertex){
			$("#pos_x")[0].value = viewport.getInputHandler().selection[0].x.toFixed(2);
			$("#pos_y")[0].value = viewport.getInputHandler().selection[0].y.toFixed(2);
			return;
		}

		$("#pos_x")[0].value = viewport.getInputHandler().selection[0].position[0].toFixed(2);
		$("#pos_y")[0].value = viewport.getInputHandler().selection[0].position[1].toFixed(2);
		// console.log("mousedown");
	});
	viewport.canvas.addEventListener("mousemove", function(e){
		e.preventDefault();
		viewport.onMouseMove(e);

		if (viewport.getInputHandler().selection.length != 1){
			$("#pos_x")[0].value = "";
			$("#pos_y")[0].value = "";
			return;
		}
		
		if (viewport.getInputHandler().selection[0] instanceof Vertex){
			$("#pos_x")[0].value = viewport.getInputHandler().selection[0].x.toFixed(2);
			$("#pos_y")[0].value = viewport.getInputHandler().selection[0].y.toFixed(2);
			return;
		}
		
		$("#pos_x")[0].value = viewport.getInputHandler().selection[0].position[0].toFixed(2);
		$("#pos_y")[0].value = viewport.getInputHandler().selection[0].position[1].toFixed(2);
		// console.log("mousemove");
	}, false);
	viewport.canvas.addEventListener("mouseup", function(e){
		viewport.onMouseUp(e);
		// console.log("mouseup");
	}, false);
	viewport.canvas.addEventListener("click", function(e){
		viewport.onClick(e);
		// console.log("mouseclick");
	}, false);
	viewport.canvas.addEventListener("dblclick", function(e){
		viewport.onDoubleClick(e);
		// console.log("mousedblclick");
	}, false);
	window.addEventListener("keydown", function(e){
		// console.log(e.which);
		viewport.onKeyDown(e);
	});
	window.addEventListener("keyup", function(e){
		// console.log(e.which);
		viewport.onKeyUp(e);

		if (e.which == 13){
			gameView.paused = !gameView.paused;
		}

		else if (e.which == 32){
			if (gameView){
				gameView = null;
				viewport.getInputHandler().inGameMode = 0;
			}
			else {
				gameView = new GameView(canvas, viewport.getNavigator());
				gameView.setup(sceneManager.exportWorld());
				// gameView.setup("resources/scene.json", true);
				viewport.getInputHandler().inGameMode = 1;
			}
		}
	});

	$("#transformTools").find("a").each(function(index){
		var action = $(this).data("event");
		mixin(this, viewport.getInputHandler(), action);
		
		this.addEventListener("click", function(e){
			e.preventDefault();
			e.target[action]();
		});
	});

	$("#pivotTools").find("a").each(function(index){
		var action = $(this).data("event");
		mixin(this, viewport.getInputHandler(), action);
		
		this.addEventListener("click", function(e){
			e.preventDefault();
			e.target[action]();
		});
	});

	$("#sceneMode").find("a").each(function(index){
		var action = $(this).data("event");
		mixin(this, viewport.getSceneManager(), action);
		
		this.addEventListener("click", function(e){
			e.preventDefault();
			e.target[action]();
		});
	});

	$("#pos_x")[0].addEventListener("keyup", function(e){
		if (e.which == 13){
			if (!isNaN(parseFloat(this.value))){
				//console.log(parseFloat(this.value));
				if (viewport.getInputHandler().transformTool == 5){
					viewport.sceneManager.setScaleOfSelectedObjects(parseFloat(this.value), null, 0, viewport.getInputHandler());	
				}
				else if (viewport.getInputHandler().transformTool == 7){
					viewport.sceneManager.setPositionOfSelectedObjects(parseFloat(this.value), null, 0, viewport.getInputHandler());	
				}
				else if (viewport.getInputHandler().transformTool == 6){
					viewport.sceneManager.setRotationOfSelectedObjects(parseFloat(this.value), 0, viewport.getInputHandler());	
				}
			}
		}
	});

	$("#pos_y")[0].addEventListener("keyup", function(e){
		if (e.which == 13){
			if (!isNaN(parseFloat(this.value))){
				// console.log(parseFloat(this.value));
				if (viewport.getInputHandler().transformTool == 5){
					viewport.sceneManager.setScaleOfSelectedObjects(null, parseFloat(this.value), 0, viewport.getInputHandler());
				}
				else if (viewport.getInputHandler().transformTool == 7){
					viewport.sceneManager.setPositionOfSelectedObjects(null, parseFloat(this.value), 0, viewport.getInputHandler());	
				}
			}
		}
	});

	$("#create_menu").find("a").each(function(index){
		//var action = $(this).data("event");
		mixin(this, viewport.getSceneManager(), "createBody");
		
		var params = parseInt($(this).data("shape"));
		
		this.addEventListener("click", function(e){
			e.preventDefault();
			var shapeType = parseInt(params / 10);
			if (shapeType == 0){
				e.target["createBody"](shapeType);
			}
			else {
				e.target["createBody"](shapeType, params % 10);	
			}
		});
	});

	sceneManager.createBody(Shape.SHAPE_BOX);
	sceneManager.createBody(Shape.SHAPE_CIRCLE);
	sceneManager.createBody(Shape.SHAPE_POLYGON);
}

function mixin(target, source, methods){
	for (var ii = 2, ll = arguments.length; ii < ll; ii++){
		var method = arguments[ii];

		target[method] = source[method].bind(source);
	}
}

// update loop 
function render() {	
	viewport.draw(gameView);
	
	setTimeout(render, 1000.0 / 60.0);
}
//-------------------------------------------//

// function UpdateLoop(){
// 	app.updateGameLogic();
// 	requestAnimationFrame(UpdateLoop);
// }

init();

setTimeout(render, 1000.0 / 60.0);