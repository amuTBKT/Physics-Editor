var Editor;	// global variable

function init(){
	var canvas = document.getElementById("canvas");
	canvas.width = window.innerWidth * 0.8;
	canvas.height = window.innerHeight * 0.8;

	// create instance of physics editor
	Editor = new PhysicsEditor(canvas);

	// cached variables
	var viewport = Editor.getViewport(),
	 	lastElementSelected;

	// to avoid viewport events while editing selection properties 
	document.addEventListener("mousedown", function(e){
		lastElementSelected = e.target;
	});

	// key events
	window.addEventListener("keydown", function(e){
		if (lastElementSelected == viewport.canvas)
			viewport.onKeyDown(e);
	});
	window.addEventListener("keyup", function(e){
		if (lastElementSelected == viewport.canvas)
			viewport.onKeyUp(e)
	});
	window.addEventListener("resize", function(e){
		// canvas.width = window.innerWidth * 0.8;
		// canvas.height = window.innerHeight * 0.8;
		// Editor.viewport.getRenderer().setStageWidthHeight(canvas.width, canvas.height);
	});
	window.onbeforeunload = function(){
    	return "All Unsaved Changes Would Be Lost";
	}
}

// update loop 
function render() {	
	Editor.viewport.draw(Editor.getGameView());
	setTimeout(render, 1000.0 / 60.0);		// update at 60 fps
}
//-------------------------------------------//

// launch the editor
init();
setTimeout(render, 1000.0 / 60.0);			// update at 60 fps