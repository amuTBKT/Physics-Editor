var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;

var canvas, context, scale = 1;
var viewport;
var shape, body;

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

	var size = 10;
	shape = new Shape(Shape.SHAPE_POLYGON);
	shape.addVertex(new Vertex(-100, -100, size, size));
	shape.addVertex(new Vertex(100, -100, size, size));
	shape.addVertex(new Vertex(100, 100, size, size));
	shape.addVertex(new Vertex(-100, 100, size, size));

	//shape.move(200, 200);

	var s = new Shape(Shape.SHAPE_POLYGON);
	s.addVertex(new Vertex(-100, -100, size, size));
	s.addVertex(new Vertex(100, -100, size, size));
	s.addVertex(new Vertex(100, 100, size, size));
	s.addVertex(new Vertex(-100, 100, size, size));

	body = new Body();
	body.addShape(shape);
	body.addShape(s);
	body.move(200, 200);
}

// update loop 
function render() {	
	viewport.draw();

	// shape.rotate(0.5, 300, 200);
	// context.strokeRect(300 - 5, 200 - 5, 10, 10);

	context.strokeRect( 10,  10, SCREEN_WIDTH - 400 - 20, SCREEN_HEIGHT - 100 - 20);
	
	
	viewport.getRenderer().renderBody(body);
	

	context.restore();

	setTimeout(render, 1000.0 / 60.0);
}
//-------------------------------------------//


init();

setTimeout(render, 1000.0 / 60.0);