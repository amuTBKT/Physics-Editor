var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;

var canvas, context, scale = 1;
var viewport;

// initialize canvas and context
function init(){
	canvas = document.getElementById("canvas");
	canvas.width = SCREEN_WIDTH - 400;
	canvas.height = SCREEN_HEIGHT - 100;

	viewport = Viewport.getInstance(canvas);
	context = viewport.getRenderer().context;

	viewport.canvas.addEventListener("mousewheel", function(e){
		viewport.onMouseWheel(e);
	});
	viewport.canvas.addEventListener("mousedown", function(e){
		viewport.onMouseDown(e);
	});
	viewport.canvas.addEventListener("mousemove", function(e){
		viewport.onMouseMove(e);
	});
	viewport.canvas.addEventListener("mouseup", function(e){
		viewport.onMouseUp(e);
	});
}

// update loop 
function render() {

	viewport.draw();

	context.strokeRect( 10,  10, SCREEN_WIDTH - 400 - 20, SCREEN_HEIGHT - 100 - 20);
	
	context.restore();

	setTimeout(render, 1000.0 / 60.0);
}
//-------------------------------------------//


init();

setTimeout(render, 1000.0 / 60.0);