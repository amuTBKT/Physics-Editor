var mouseX, mouseY, mousePVec, isMouseDown, selectedBody, mouseJoint;
var _navigator;

function GameView(canvas, navigator) {
  this.canvas = canvas;
  this.context = canvas.getContext('2d');
  _navigator = navigator;
  this.world;

  this.worldLoader = WorldLoader();

  this.hasLoaded = false;
  this.paused = false;
}

/* SETUP */
GameView.prototype.setup = function(scene, fromFile){
  if (this.context){
    if (fromFile){
      var ref = this;
      $.getJSON(scene, function(data){
        ref.init(data);
      });
    }
    else {
      this.init(scene);
    }  
  }
};

/* RESCALE */
GameView.prototype.rescale = function(){
  // canvas.setAttribute('width', window.innerWidth);
  // canvas.setAttribute('height', window.innerHeight);
  // this.draw();
};

/* INIT */
GameView.prototype.init = function(scene){
  // add event listeners
  this.canvas.addEventListener("mousedown", function(e) {
    isMouseDown = true;
    handleMouseMove(e);
    this.addEventListener("mousemove", handleMouseMove, true);
  }, true);

  this.canvas.addEventListener("mouseup", function() {
    this.removeEventListener("mousemove", handleMouseMove, true);
    isMouseDown = false;
    mouseX = undefined;
    mouseY = undefined;
  }, true);

  // create physics world
  this.world = new b2World(new b2Vec2(0, 10), true);

  // set debug draw
  var debugDraw = new b2DebugDraw();
  debugDraw.SetSprite(this.context);
  debugDraw.SetDrawScale(30.0);
  debugDraw.SetFillAlpha(0.5);
  debugDraw.SetLineThickness(1.0);
  debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
  this.world.SetDebugDraw(debugDraw);

  // load scene
  this.worldLoader.loadJsonScene(scene, this.world);

  this.hasLoaded = true;
};

/* DRAW */
GameView.prototype.draw = function(){
  this.world.DrawDebugData();
  this.world.ClearForces();

  for (var i = 0; i < this.worldLoader.gameObjects.length; i++){
    // handle sprite rotation and translation
    var gameObject = this.worldLoader.gameObjects[i];
    this.context.save();
    this.context.translate(gameObject.body.GetPosition().x * 30, gameObject.body.GetPosition().y * 30);
    this.context.rotate(gameObject.body.GetAngle());
    
    if (gameObject.spriteData.length > 0){
      var spriteData  = gameObject.spriteData,
          sourceX     = spriteData[0],
          sourceY     = spriteData[1],
          sourceW     = spriteData[2],
          sourceH     = spriteData[3],
          imageW      = spriteData[4],
          imageH      = spriteData[5];
      this.context.drawImage(gameObject.sprite, sourceX, sourceY, sourceW, sourceH, -imageW / 2, -imageH / 2, imageW, imageH);
      
    }
    else {
      var imageW = gameObject.sprite.width, imageH = gameObject.sprite.height;
      this.context.drawImage(gameObject.sprite, -imageW / 2, -imageH / 2, imageW, imageH);
    }
    this.context.restore();
  }
};

/* UPDATE */
GameView.prototype.update = function(){
  if(isMouseDown && (!mouseJoint)) {
     var body = getBodyAtMouse(this.world);
     if(body) {
        var md = new b2MouseJointDef();
        md.bodyA = this.world.GetGroundBody();
        md.bodyB = body;
        md.target.Set(mouseX, mouseY);
        md.collideConnected = true;
        md.maxForce = 300.0 * body.GetMass();
        mouseJoint = this.world.CreateJoint(md);
        body.SetAwake(true);
     }
  }
  
  if(mouseJoint) {
     if(isMouseDown) {
        mouseJoint.SetTarget(new b2Vec2(mouseX, mouseY));
     } else {
        this.world.DestroyJoint(mouseJoint);
        mouseJoint = null;
     }
  }

  this.world.Step(1 / 60, 10, 10);
};

GameView.prototype.dispose = function(){

};

GameView.prototype.updateView = function(){
  if (!this.paused){
    this.update();
  }
  this.draw();
}

function handleMouseMove(e) {
  mouseX = _navigator.screenPointToWorld(e.offsetX, e.offsetY)[0] / 30;
  mouseY = _navigator.screenPointToWorld(e.offsetX, e.offsetY)[1] / 30;
}

function getBodyAtMouse(world) {
  mousePVec = new b2Vec2(mouseX, mouseY);
  var aabb = new b2AABB();
  aabb.lowerBound.Set(mouseX - 0.001, mouseY - 0.001);
  aabb.upperBound.Set(mouseX + 0.001, mouseY + 0.001);
  
  // Query the world for overlapping shapes.
  selectedBody = null;
  world.QueryAABB(getBodyCB, aabb);
  return selectedBody;
}

function getBodyCB(fixture) {
  if(fixture.GetBody().GetType() != b2Body.b2_staticBody) {
     if(fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), mousePVec)) {
        selectedBody = fixture.GetBody();
        return false;
     }
  }
  return true;
}