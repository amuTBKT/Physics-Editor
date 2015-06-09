var Viewport = (function(canvas){

	function InputHandler(){
		// mouse tracking variables
		this.start = [0, 0];						// [mouse_on_down.x  , mouse_on_down.y  ]
		this.current = [0, 0];						// [mouse_on_up.x    , mouse_on_up.y    ]
		this.delta = [0, 0];						// [mouse_delta_pos.x, mouse_delta_pos.y]
		this.mouseSensitivity = 1;					// navigation speed, depends on scale of the viewport
		this.mouseStatus = [0, 0];					// [is_down, is_left = 1 or is_right = 2]
		this.selectionArea = [0, 0, 0, 0];			// [x, y, width, height]
	}

	InputHandler.IS_LEFT_MOUSE_BUTTON = 1;
	InputHandler.IS_RIGHT_MOUSE_BUTTON = 2;

	InputHandler.prototype.isMouseDown = function(){
		return this.mouseStatus[0] == 1;
	}

	InputHandler.prototype.isRightClick = function(){
		return this.mouseStatus[1] == InputHandler.IS_RIGHT_MOUSE_BUTTON;
	}

	InputHandler.prototype.isLeftClick = function(){
		return this.mouseStatus[1] == InputHandler.IS_LEFT_MOUSE_BUTTON;
	}

	function Navigator(){
		// canvas manipulating parameters
		this.panning = [0, 0];						// canvas translation.[x, y]
		this.origin = [0, 0];						// canvas origin.[x, y]
		this.scale = 1;								// canvas scale (scaleX = scaleY)
		this.scaleLimits = [0.5, 3]					// [min scale, max scale]
	}

	Navigator.prototype.screenPointToWorld = function(x, y){
		return 	[
					(x / this.scale - this.panning[0] + this.origin[0]), 
					(y / this.scale - this.panning[1] + this.origin[1])
				];
	}

	Navigator.prototype.worldPointToScreen = function(x, y){
		return 	[
					(x + this.panning[0] - this.origin[0]) * this.scale, 
					(y + this.panning[1] - this.origin[1]) * this.scale
				];	
	}

	function Viewport(canvas){
		this.canvas = canvas;
		this.context = canvas.getContext("2d");
		this.navigator = new Navigator();
		this.inputHandler = new InputHandler();
	}


	Viewport.prototype.onMouseDown = function(e){
		// check whether right button is pressd or not
		var inputHandler = this.inputHandler;
		inputHandler.mouseStatus[0] = 1;

		if (e.which)
			inputHandler.mouseStatus[1] = (e.which == 3) + 1;
    	else if (e.button)
    		inputHandler.mouseStatus[1] = (e.button == 2) + 1;

		inputHandler.start = [e.offsetX, e.offsetY];

		if (inputHandler.mouseStatus[1] == InputHandler.IS_RIGHT_MOUSE_BUTTON)
			return;

		// select bodies

		inputHandler.selectionArea[0] = e.offsetX;
		inputHandler.selectionArea[1] = e.offsetY;
		inputHandler.selectionArea[4] = 1;
	}

	Viewport.prototype.onMouseMove = function(e){
		var inputHandler = this.inputHandler, navigator = this.navigator;
		if (inputHandler.mouseStatus[0]){
			inputHandler.selectionArea[2] = (e.offsetX - inputHandler.selectionArea[0]);
			inputHandler.selectionArea[3] = (e.offsetY - inputHandler.selectionArea[1]);

			inputHandler.current = [e.offsetX, e.offsetY];

			inputHandler.delta[0] = inputHandler.current[0] - inputHandler.start[0];
			inputHandler.delta[0] *= inputHandler.mouseSensitivity / navigator.scale;
			inputHandler.delta[1] = inputHandler.current[1] - inputHandler.start[1];
			inputHandler.delta[1] *= inputHandler.mouseSensitivity / navigator.scale;

			// if (editBody){
			// 	selection.move(delta[0], delta[1]);
			// }
			// else {
				if (inputHandler.mouseStatus[1] == InputHandler.IS_RIGHT_MOUSE_BUTTON){
					navigator.panning[0] += inputHandler.delta[0];
					navigator.panning[1] += inputHandler.delta[1];

					inputHandler.selectionArea[2] = 0;
					inputHandler.selectionArea[3] = 0;
				}
			// }

			inputHandler.start[0] = inputHandler.current[0];
			inputHandler.start[1] = inputHandler.current[1];

			return;
		}

		// check for bodies and shape
	}

	Viewport.prototype.onMouseUp = function(e){
		var inputHandler = this.inputHandler;
		inputHandler.mouseStatus[0] = 0;	
	}

	// viewport scaling
	Viewport.prototype.onMouseWheel = function(e){
		var mouseX = e.offsetX;
	    var mouseY = e.offsetY;
	    var wheel = e.wheelDelta / 120;

	    var navigator = this.navigator;

	    var zoom = 1 + wheel / 2;

	    if (zoom > 1){
	    	if (navigator.scale > navigator.scaleLimits[1]) 
	    		return;
	    }
		else{
			if (navigator.scale < navigator.scaleLimits[0]) 
				return;
		}

	    this.context.translate(
	        navigator.origin[0],
	        navigator.origin[1]
	    );
	    this.context.scale(zoom,zoom);
	    this.context.translate(
	        -( mouseX / navigator.scale + navigator.origin[0] - mouseX / ( navigator.scale * zoom ) ),
	        -( mouseY / navigator.scale + navigator.origin[1] - mouseY / ( navigator.scale * zoom ) )
	    );

	    navigator.origin[0] = ( mouseX / navigator.scale + navigator.origin[0] - mouseX / ( navigator.scale * zoom ) );
	    navigator.origin[1] = ( mouseY / navigator.scale + navigator.origin[1] - mouseY / ( navigator.scale * zoom ) );
	    navigator.scale *= zoom;
	}

	Viewport.prototype.screenPointToWorld = function(x, y){
		return 	this.navigator.screenPointToWorld(x, y);
	}

	Viewport.prototype.worldPointToScreen = function(x, y){
		return 	this.navigator.worldPointToScreen(x, y);
	}

	Viewport.prototype.getNavigator = function(){
		return this.navigator;
	}

	Viewport.prototype.getInputHandler = function(){
		return this.inputHandler;
	}

	Viewport.prototype.getContext = function(){
		return this.context;
	}

	var instance;
    return {
        getInstance: function(){
            if (instance == null) {
                instance = new Viewport(canvas);
                // Hide the constructor so the returned objected can't be new'd...
                instance.constructor = null;
            }
            return instance;
        }
   };

})(canvas);