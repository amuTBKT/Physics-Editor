var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;

var canvas, scale = 1;
var viewport, sceneManager, uiManager, gameView;

function init(){
	canvas = document.getElementById("canvas");
	canvas.width = SCREEN_WIDTH * 0.8;
	canvas.height = SCREEN_HEIGHT * 0.8;

	// var object = JSON.parse('{"STATE_DEFAULT_MODE":0,"STATE_SHAPE_EDIT_MODE":1,"STATE_BODY_EDIT_MODE":2,"STATE_SHAPE_DRAW_MODE":3,"state":0,"bodies":[{"name":"body0","userData":"","texture":"","spriteData":[],"shapes":[{"shapeType":0,"position":[-210,75],"scaleXY":[1,1],"rotation":0,"vertices":[{"x":-260,"y":25,"width":10,"height":10,"isSelected":false},{"x":-160,"y":25,"width":10,"height":10,"isSelected":false},{"x":-160,"y":125,"width":10,"height":10,"isSelected":false},{"x":-260,"y":125,"width":10,"height":10,"isSelected":false}],"bounds":[-210,75,100,100],"centroid":[-210,75],"isSelected":false,"inEditMode":false,"friction":1,"restitution":0.25,"density":1,"isSensor":0,"width":100,"height":100}],"position":[-210,75],"scaleXY":[1,1],"rotation":0,"bounds":[-210,75,100,100],"isSelected":false,"bodyType":2,"isBulllet":0,"isFixedRotation":false},{"name":"body1","userData":"","texture":"","spriteData":[],"shapes":[{"shapeType":1,"position":[99,-179],"scaleXY":[1,1],"rotation":0,"vertices":[{"x":149,"y":-179,"width":10,"height":10,"isSelected":false},{"x":139.45084971874738,"y":-149.61073738537635,"width":10,"height":10,"isSelected":false},{"x":114.45084971874738,"y":-131.44717418524232,"width":10,"height":10,"isSelected":false},{"x":83.54915028125264,"y":-131.44717418524232,"width":10,"height":10,"isSelected":false},{"x":58.54915028125263,"y":-149.61073738537635,"width":10,"height":10,"isSelected":false},{"x":49,"y":-179,"width":10,"height":10,"isSelected":false},{"x":58.54915028125263,"y":-208.38926261462365,"width":10,"height":10,"isSelected":false},{"x":83.54915028125262,"y":-226.55282581475768,"width":10,"height":10,"isSelected":false},{"x":114.45084971874736,"y":-226.55282581475768,"width":10,"height":10,"isSelected":false},{"x":139.45084971874735,"y":-208.38926261462368,"width":10,"height":10,"isSelected":false}],"bounds":[99,-179,100,95.10565162951536],"centroid":[99,-179],"isSelected":false,"inEditMode":false,"friction":1,"restitution":0.25,"density":1,"isSensor":0,"radius":50}],"position":[99,-179],"scaleXY":[1,1],"rotation":0,"bounds":[99,-179,100,95.10565162951536],"isSelected":false,"bodyType":2,"isBulllet":0,"isFixedRotation":false},{"name":"body2","userData":"","texture":"","spriteData":[],"shapes":[{"shapeType":2,"position":[91,100],"scaleXY":[1,1],"rotation":0,"vertices":[{"x":41,"y":50,"width":10,"height":10,"isSelected":false},{"x":141,"y":50,"width":10,"height":10,"isSelected":false},{"x":141,"y":150,"width":10,"height":10,"isSelected":false},{"x":41,"y":150,"width":10,"height":10,"isSelected":false}],"bounds":[91,100,100,100],"centroid":[91,100],"isSelected":false,"inEditMode":false,"friction":1,"restitution":0.25,"density":1,"isSensor":0}],"position":[91,100],"scaleXY":[1,1],"rotation":0,"bounds":[91,100,100,100],"isSelected":false,"bodyType":2,"isBulllet":0,"isFixedRotation":false},{"name":"body3","userData":"","texture":"","spriteData":[],"shapes":[{"shapeType":0,"position":[-114,-92],"scaleXY":[1,1],"rotation":0,"vertices":[{"x":-164,"y":-142,"width":10,"height":10,"isSelected":false},{"x":-64,"y":-142,"width":10,"height":10,"isSelected":false},{"x":-64,"y":-42,"width":10,"height":10,"isSelected":false},{"x":-164,"y":-42,"width":10,"height":10,"isSelected":false}],"bounds":[-114,-92,100,100],"centroid":[-114,-92],"isSelected":false,"inEditMode":false,"friction":1,"restitution":0.25,"density":1,"isSensor":0,"width":100,"height":100}],"position":[-114,-92],"scaleXY":[1,1],"rotation":0,"bounds":[-114,-92,100,100],"isSelected":false,"bodyType":2,"isBulllet":0,"isFixedRotation":false}],"joints":[],"selectedBodies":[],"selectedShapes":[],"selectedVertices":[],"selectedJoints":[],"constructor":null}');
	
	sceneManager = SceneManager.getInstance();
	// sceneManager.loadScene(object);

	viewport = Viewport.getInstance(canvas, sceneManager);

	uiManager = UIManager.getInstance(sceneManager);
	uiManager.initialize(viewport.getInputHandler());
	uiManager.playBackControls = $("#controls").find("button");
	// play back controls //
	uiManager.playBackControls[0].addEventListener("click", function(){
		if (gameView){
			gameView = null;
			viewport.getInputHandler().inGameMode = 0;
			$(this).removeClass("glyphicon-stop").addClass("glyphicon-play");
		}
		else {
			gameView = new GameView(canvas, viewport.getNavigator());
			gameView.setup(sceneManager.exportWorld());
			// gameView.setup("resources/scene.json", true);
			viewport.getInputHandler().inGameMode = 1;
			$(this).removeClass("glyphicon-play").addClass("glyphicon-stop");
		}
	});
	uiManager.playBackControls[1].addEventListener("click", function(){
		if (gameView != null)
			gameView.paused = !gameView.paused;
	});
	uiManager.playBackControls[2].addEventListener("click", function(){
		if (gameView != null && gameView.paused)
			gameView.update();
	});
	//////////////////////

	viewport.canvas.addEventListener("mousewheel", function(e){
		viewport.onMouseWheel(e);
	});
	viewport.canvas.addEventListener("mousedown", function(e){
		e.preventDefault();
		viewport.onMouseDown(e);
		uiManager.onMouseDown(viewport.getInputHandler());
	});
	viewport.canvas.addEventListener("mousemove", function(e){
		e.preventDefault();
		viewport.onMouseMove(e);
		uiManager.onMouseMove(viewport.getInputHandler());
	}, false);
	viewport.canvas.addEventListener("mouseup", function(e){
		viewport.onMouseUp(e);
		uiManager.onMouseUp(viewport.getInputHandler());
	}, false);

	window.addEventListener("keydown", function(e){
		// console.log(e.which);
		viewport.onKeyDown(e);
	});
	window.addEventListener("keyup", function(e){
		// console.log(e.which);
		viewport.onKeyUp(e);

		// if (e.which == 13){
		// 	gameView.paused = !gameView.paused;
		// }

		// else if (e.which == 32){
		// 	if (gameView){
		// 		gameView = null;
		// 		viewport.getInputHandler().inGameMode = 0;
		// 	}
		// 	else {
		// 		gameView = new GameView(canvas, viewport.getNavigator());
		// 		gameView.setup(sceneManager.exportWorld());
		// 		// gameView.setup("resources/scene.json", true);
		// 		viewport.getInputHandler().inGameMode = 1;
		// 	}
		// }
	});

	sceneManager.createBody(Shape.SHAPE_BOX);
	sceneManager.createBody(Shape.SHAPE_CIRCLE);
	sceneManager.createBody(Shape.SHAPE_POLYGON);
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