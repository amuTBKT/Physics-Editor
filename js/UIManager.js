var UIManager = (function(){

	function UIManager(sceneManager){
		this.sceneManager 	 = sceneManager;
		this.xyInput         = [];
		this.taskbar         = [];
		this.shapeProperties = [];			// density, friction, restitution, isSensor, edit	
		this.bodyProperties  = [];			// name, userdata, type, isBullet, edit, tex_file, tex_width, tex_height
	}

	UIManager.prototype.initialize = function(inputHandler){
		var sceneManager = this.sceneManager;

		// initialize transform tool buttons
		$("#transformTools").find("a").each(function(index){
			var action = $(this).data("event");
			mixin(this, inputHandler, action);
			
			this.addEventListener("click", function(e){
				e.preventDefault();
				e.target[action]();
			});
		});

		// initialize pivot tool buttons
		$("#pivotTools").find("a").each(function(index){
			var action = $(this).data("event");
			mixin(this, inputHandler, action);
			
			this.addEventListener("click", function(e){
				e.preventDefault();
				e.target[action]();
			});
		});

		this.xyInput = [$("#input_x")[0], $("#input_y")[0]];

		this.xyInput[0].addEventListener("keypress", function(e){
			if (e.which == 13){							// enter pressed
				if (!isNaN(parseFloat(this.value))){
					if (inputHandler.transformTool == 5){
						sceneManager.setScaleOfSelectedObjects(parseFloat(this.value), null, 0, inputHandler);	
					}
					else if (inputHandler.transformTool == 7){
						sceneManager.setPositionOfSelectedObjects(parseFloat(this.value), null, 0, inputHandler);	
					}
					else if (inputHandler.transformTool == 6){
						sceneManager.setRotationOfSelectedObjects(parseFloat(this.value), 0, inputHandler);	
					}
				}
			}
		});

		this.xyInput[1].addEventListener("keypress", function(e){
			if (e.which == 13){							// enter pressed
				if (!isNaN(parseFloat(this.value))){
					if (inputHandler.transformTool == 5){
						sceneManager.setScaleOfSelectedObjects(null, parseFloat(this.value), 0, inputHandler);
					}
					else if (inputHandler.transformTool == 7){
						sceneManager.setPositionOfSelectedObjects(null, parseFloat(this.value), 0, inputHandler);	
					}
				}
			}
		});

		$("#addToScene").find("a").each(function(index){
			mixin(this, sceneManager, "createBody");
			
			var params = parseInt($(this).data("shape"));
			
			this.addEventListener("click", function(e){
				e.preventDefault();
				var shapeType = parseInt(params / 10);
				if (shapeType == 0){
					e.target["createBody"](shapeType);
				}
				else {
					e.target["createBody"](shapeType, params % 10);	
				}
			});
		});
		$("#addToBody").find("a").each(function(index){
			mixin(this, sceneManager, "createShape");
			
			var params = parseInt($(this).data("shape"));
			
			this.addEventListener("click", function(e){
				e.preventDefault();
				var shapeType = parseInt(params / 10);
				if (shapeType == 0){
					e.target["createShape"](shapeType);
				}
				else {
					e.target["createShape"](shapeType, params % 10);	
				}
			});
		});

		// properties of selected shape(s)
		this.shapeProperties =  $("#shape_properties").find("input");
		for (var i = 0; i < 3; i++){
			this.shapeProperties[i].addEventListener('keypress', function(e){
				if (e.which == 13){
					var property = $(this).data('property');
					for (var i = 0; i < sceneManager.selectedShapes.length; i++){
						if (parseFloat(this.value) != NaN)
							sceneManager.selectedShapes[i][property] = parseFloat(this.value);
					}
				}
			});
		}
		$(this.shapeProperties[3]).change(function(){
			for (var i = 0; i < sceneManager.selectedShapes.length; i++){
				sceneManager.selectedShapes[i].isSensor = $(this).is(":checked");
			}
		});
		this.shapeProperties[4].addEventListener('click', function(){
			if (sceneManager.state == sceneManager.STATE_BODY_EDIT_MODE){
				sceneManager.enterShapeEditMode();
				this.value = "Done";
			}
			else if (sceneManager.state == sceneManager.STATE_SHAPE_EDIT_MODE){
				sceneManager.enterBodyEditMode();
				this.value = "Edit";
			}
		});

		// properties of selected body(s)
		this.bodyProperties = $("#body_properties").find("input");
		this.bodyProperties.push($("#body_properties").find("select")[0]);
		for (var i = 0; i < 2; i++){
			this.bodyProperties[i].addEventListener('keypress', function(e){
				if (e.which == 13){
					var property = $(this).data('property');
					for (var i = 0; i < sceneManager.selectedBodies.length; i++){
						sceneManager.selectedBodies[i][property] = this.value;
					}
				}
			});
		}
		$(this.bodyProperties[2]).change(function(){
			for (var i = 0; i < sceneManager.selectedBodies.length; i++){
				sceneManager.selectedBodies[i].isBullet = $(this).is(":checked");
			}
		});
		this.bodyProperties[3].addEventListener('click', function(){
			if (sceneManager.state == sceneManager.STATE_DEFAULT_MODE){
				sceneManager.enterBodyEditMode();
				this.value = "Done";
			}
			else if (sceneManager.state == sceneManager.STATE_BODY_EDIT_MODE) {
				sceneManager.enterDefaultMode();
				this.value = "Edit";
			}
		});
		// this.bodyProperties[7].change(function(){
		// 	console.log("Select");
		// });
	};

	UIManager.prototype.onMouseDown = function(inputHandler){
		this.updateShapePropertyView();
		this.updateBodyPropertyView();

		// update input-xy
		if (inputHandler.selection.length != 1){
			this.xyInput[0].value = "";
			this.xyInput[1].value = "";
			return;
		}
		this.updateInputXY(inputHandler);
	};

	UIManager.prototype.onMouseMove = function(inputHandler){
		this.updateShapePropertyView();
		this.updateBodyPropertyView();

		// update input-xy
		if (inputHandler.selection.length != 1){
			this.xyInput[0].value = "";
			this.xyInput[1].value = "";
			return;
		}
		this.updateInputXY(inputHandler);
	};

	UIManager.prototype.onMouseUp = function(inputHandler){
		this.updateShapePropertyView();
		this.updateBodyPropertyView();

		if (inputHandler.selection.length != 1){
			this.xyInput[0].value = "";
			this.xyInput[1].value = "";
			return;
		}
		this.updateInputXY(inputHandler);
	};

	UIManager.prototype.updateShapePropertyView = function(){
		var sceneManager = this.sceneManager;
		if ((sceneManager.state == sceneManager.STATE_BODY_EDIT_MODE || 
			sceneManager.state == sceneManager.STATE_SHAPE_EDIT_MODE) && 
			sceneManager.selectedShapes.length > 0){
			$("#shape_properties").show();

			if(sceneManager.selectedShapes.length == 1){
				this.shapeProperties[0].value = sceneManager.selectedShapes[0].density;
				this.shapeProperties[1].value = sceneManager.selectedShapes[0].friction;
				this.shapeProperties[2].value = sceneManager.selectedShapes[0].restitution;
				// this.shapeProperties[3] 
				$(this.shapeProperties[4]).show(); 
			}
			else {
				this.shapeProperties[0].value = "";
				this.shapeProperties[1].value = "";
				this.shapeProperties[2].value = "";
				$(this.shapeProperties[4]).hide(); 
			}
		}
		else {
			// hide this view
			$("#shape_properties").hide();
		}
	};

	UIManager.prototype.updateBodyPropertyView = function(){
		var sceneManager = this.sceneManager;
		if ((sceneManager.state == sceneManager.STATE_DEFAULT_MODE || 
			sceneManager.state == sceneManager.STATE_BODY_EDIT_MODE) && 
			sceneManager.selectedBodies.length > 0){
			$("#body_properties").show();

			if(sceneManager.selectedBodies.length == 1){
				this.bodyProperties[0].value = sceneManager.selectedBodies[0].name;
				this.bodyProperties[1].value = sceneManager.selectedBodies[0].userData;
				$(this.bodyProperties[3]).show();
				// this.bodyProperties[3] 
			}
			else {
				this.bodyProperties[0].value = "";
				this.bodyProperties[1].value = "";
				$(this.bodyProperties[3]).hide();
			}
		}
		else {
			// hide this view
			$("#body_properties").hide();
		}
	};

	// update input-xy whenever an object is selected / moved 
	UIManager.prototype.updateInputXY = function(inputHandler){
		if (inputHandler.transformTool == 5){
			if (this.sceneManager.state != this.sceneManager.STATE_SHAPE_EDIT_MODE){
				this.xyInput[0].value = inputHandler.selection[0].scaleXY[0].toFixed(2);
				this.xyInput[1].value = inputHandler.selection[0].scaleXY[1].toFixed(2);
			}
			else {
				this.xyInput[0].value = "";
				this.xyInput[1].value = "";
			}
		}
		else if (inputHandler.transformTool == 7){
			if (this.sceneManager.state == this.sceneManager.STATE_SHAPE_EDIT_MODE){
				if (inputHandler.selection.length == 1 && inputHandler.selection[0].x){
					this.xyInput[0].value = inputHandler.selection[0].x.toFixed(2);
					this.xyInput[1].value = inputHandler.selection[0].y.toFixed(2);
				}
			}
			else {
				this.xyInput[0].value = inputHandler.selection[0].position[0].toFixed(2);
				this.xyInput[1].value = inputHandler.selection[0].position[1].toFixed(2);
			}
		}
		else if (inputHandler.transformTool == 6){
			if (this.sceneManager.state != this.sceneManager.STATE_SHAPE_EDIT_MODE && inputHandler.selection[0].rotation){
				this.xyInput[0].value = inputHandler.selection[0].rotation.toFixed(2);
				this.xyInput[1].value = "";
			}
			else {
				this.xyInput[0].value = "";
				this.xyInput[1].value = "";
			}	
		}
	};

	// binds custom object methods to dom events
	function mixin(target, source, methods){
		for (var ii = 2, ll = arguments.length; ii < ll; ii++){
			var method = arguments[ii];
			target[method] = source[method].bind(source);
		}
	}

	var instance;
	return{
		getInstance: function(sceneManager){
			if (instance == null){
				instance = new UIManager(sceneManager);
				instance.constructor = null;
			}
			return instance;
		}
	};

})();