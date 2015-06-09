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
	context = viewport.getContext();

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
	scale = viewport.getNavigator().scale;

	context.fillStyle = "rgba(1, 0, 0, 0)";
	context.clearRect(viewport.getNavigator().origin[0], viewport.getNavigator().origin[1], SCREEN_WIDTH / scale, SCREEN_WIDTH / scale);
	context.fillRect(viewport.getNavigator().origin[0], viewport.getNavigator().origin[1], SCREEN_WIDTH / scale, SCREEN_HEIGHT / scale);

	context.save();
	context.translate(viewport.getNavigator().panning[0], viewport.getNavigator().panning[1]);
	context.strokeRect( 10,  10, SCREEN_WIDTH - 400 - 20, SCREEN_HEIGHT - 100 - 20);
	context.restore();

	setTimeout(render, 1000.0 / 60.0);
}
//-------------------------------------------//


init();

setTimeout(render, 1000.0 / 60.0);