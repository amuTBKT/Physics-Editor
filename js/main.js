var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;

var canvas, context, scale = 1;
var viewport, sceneManager;
var shape, body, body1;

// initialize canvas and context
function init(){
	canvas = document.getElementById("canvas");
	canvas.width = SCREEN_WIDTH - 400;
	canvas.height = SCREEN_HEIGHT - 100;

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

	var size = 10;
	shape = new Shape(Shape.SHAPE_POLYGON);
	shape.addVertex(new Vertex(-100, -100, size, size));
	shape.addVertex(new Vertex(100, -100, size, size));
	shape.addVertex(new Vertex(100, 100, size, size));
	shape.addVertex(new Vertex(-100, 100, size, size));

	//shape.move(200, 200);

	var s = new Shape(Shape.SHAPE_CIRCLE, 200, 200);
	
	body = new Body();
	body.addShape(shape);
	body.addShape(s);
	body.move(200, 200);
	s.move(100, 100);

	body1 = new Body();
	body1.addShape(new Shape(Shape.SHAPE_BOX, 200, 200));

	sceneManager.addBody(body);
	sceneManager.addBody(body1);
}

// update loop 
function render() {	
	viewport.draw();

	// shape.rotate(0.5, 300, 200);
	// context.strokeRect(300 - 5, 200 - 5, 10, 10);

	context.strokeRect( 10,  10, SCREEN_WIDTH - 400 - 20, SCREEN_HEIGHT - 100 - 20);
	
	
	viewport.getRenderer().renderBody(body);
	viewport.getRenderer().renderBody(body1);
	

	context.restore();

	setTimeout(render, 1000.0 / 60.0);
}
//-------------------------------------------//


init();

setTimeout(render, 1000.0 / 60.0);