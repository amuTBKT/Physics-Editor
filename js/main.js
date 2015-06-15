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
		// console.log("mousedown");
	});
	viewport.canvas.addEventListener("mousemove", function(e){
		viewport.onMouseMove(e);
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