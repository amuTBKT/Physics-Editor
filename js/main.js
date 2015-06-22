var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;

var canvas, context, scale = 1, game_canvas;
var viewport, sceneManager, gameView;
var pShape, polygon, diagonals;

// initialize canvas and context
function init(){
	canvas = document.getElementById("canvas");
	canvas.width = SCREEN_WIDTH * 0.8;
	canvas.height = SCREEN_HEIGHT * 0.8;

	game_canvas = document.getElementById("game_viewport");
	game_canvas.width = SCREEN_WIDTH * 0.8;
	game_canvas.height = SCREEN_HEIGHT * 0.8;

	sceneManager = SceneManager.getInstance();

	viewport = Viewport.getInstance(canvas, sceneManager);
	context = viewport.getRenderer().context;

	viewport.canvas.addEventListener("mousewheel", function(e){
		viewport.onMouseWheel(e);
	});
	viewport.canvas.addEventListener("mousedown", function(e){
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
	});
	viewport.canvas.addEventListener("mouseup", function(e){
		viewport.onMouseUp(e);
		// console.log("mouseup");
	});
	viewport.canvas.addEventListener("click", function(e){
		viewport.onClick(e);
		// polygon.addPoint(e.offsetX, e.offsetY);
		// console.log("mouseclick");
	});
	viewport.canvas.addEventListener("dblclick", function(e){
		viewport.onDoubleClick(e);
		// console.log("mousedblclick");
	});
	window.addEventListener("keydown", function(e){
		// console.log(e.which);
		viewport.onKeyDown(e);
	});
	window.addEventListener("keyup", function(e){
		// console.log(e.which);
		viewport.onKeyUp(e);

		if (e.which == 13){
			pShape = sceneManager.bodies[2].shapes[0].toPhysics();
			polygon.makeCCW();
			diagonals = polygon.decomp();
		}

		else if (e.which == 32){
			if (gameView){
				gameView = null;
				game_canvas.style.zIndex = 1;
				viewport.getInputHandler().inGameMode = 0;
			}
			else {
				gameView = new GameView(game_canvas);
				gameView.setup(sceneManager.exportWorld());
				// gameView.setup("resources/scene.json", true);
				game_canvas.style.zIndex = 3;
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

	sceneManager.createBody(Shape.SHAPE_BOX);
	sceneManager.createBody(Shape.SHAPE_CIRCLE);
	sceneManager.createBody(Shape.SHAPE_POLYGON);

	polygon = new Polygon();
	// polygon.addPoint(100, 100);
	// polygon.addPoint(150, 100);
	// polygon.addPoint(150, 150);
	// polygon.addPoint(200, 100);
	// polygon.addPoint(200, 0);
	// polygon.addPoint(300, 200);
	// polygon.addPoint(200, 300);
	// polygon.addPoint(100, 300);
	// polygon.addPoint(100, 100);
}

function mixin(target, source, methods){
	for (var ii = 2, ll = arguments.length; ii < ll; ii++){
		var method = arguments[ii];

		target[method] = source[method].bind(source);
	}
}

// update loop 
function render() {	
	viewport.draw();

	if (gameView){
		if (gameView.hasLoaded)
			gameView.updateGameLogic();
	}

	if (polys.length == 0 && polygon && polygon.size() > 0){
		context.strokeStyle = "#fff";
		polygon.draw(context);
	}

	if (diagonals && diagonals.length > 0){
		context.strokeStyle = "#fff";
		for (var i = 0; i < diagonals.length; i++){
			context.moveTo(diagonals[i].first.x, diagonals[i].first.y);
			context.lineTo(diagonals[i].second.x, diagonals[i].second.y);
		}
		context.stroke();
	}

	var colors = ["#f00", "#0f0", "#00f"];
	if (polys.length > 0){
		for (var i = 0; i < polys.length; i++){
			if (polys[i].size() > 0){
				polys[i].draw(context);
			}
		}
	}

	// if (pShape){
	// 	var relPosX = 200, relPosY = 200;
	// 	context.strokeStyle = "#fff";
	// 	context.lineWidth = 2;
	// 	for (var i = 0; i < pShape.length; i++){
	// 		for (var j = 0; j < pShape[i].vertices.length; j++){
	// 			if (j == 0){
	// 				context.moveTo(pShape[i].vertices[j][0] + relPosX, pShape[i].vertices[j][1] + relPosY);
	// 			}
	// 			else {
	// 				context.lineTo(pShape[i].vertices[j][0] + relPosX, pShape[i].vertices[j][1] + relPosY);
	// 			}
	// 		}
	// 	}
	// 	context.closePath();
	// 	context.stroke();
	// 	context.lineWidth = 1;
	// }
	
	setTimeout(render, 1000.0 / 60.0);
}
//-------------------------------------------//

// function UpdateLoop(){
// 	app.updateGameLogic();
// 	requestAnimationFrame(UpdateLoop);
// }

init();

setTimeout(render, 1000.0 / 60.0);