var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;

var canvas, context, scale = 1;
var viewport, sceneManager;

// initialize canvas and context
function init(){
	canvas = document.getElementById("canvas");
	canvas.width = SCREEN_WIDTH * 0.8;
	canvas.height = SCREEN_HEIGHT * 0.8;

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
			$("#pos_x")[0].value = viewport.getInputHandler().selection[0].x;
			$("#pos_y")[0].value = viewport.getInputHandler().selection[0].y;
			return;
		}

		$("#pos_x")[0].value = viewport.getInputHandler().selection[0].position[0];
		$("#pos_y")[0].value = viewport.getInputHandler().selection[0].position[1];
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
			$("#pos_x")[0].value = viewport.getInputHandler().selection[0].x;
			$("#pos_y")[0].value = viewport.getInputHandler().selection[0].y;
			return;
		}
		
		$("#pos_x")[0].value = viewport.getInputHandler().selection[0].position[0];
		$("#pos_y")[0].value = viewport.getInputHandler().selection[0].position[1];
		// console.log("mousemove");
	});
	viewport.canvas.addEventListener("mouseup", function(e){
		viewport.onMouseUp(e);
		// console.log("mouseup");
	});
	viewport.canvas.addEventListener("click", function(e){
		viewport.onClick(e);
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
			if (parseFloat(this.value)){
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
			if (parseFloat(this.value)){
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
	setTimeout(render, 1000.0 / 60.0);
}
//-------------------------------------------//


init();

setTimeout(render, 1000.0 / 60.0);