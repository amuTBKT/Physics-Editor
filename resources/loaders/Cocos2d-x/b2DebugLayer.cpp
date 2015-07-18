#include "b2DebugLayer.h"


b2DebugLayer* b2DebugLayer::create(b2World* pB2World, float ratio){
	b2DebugLayer *layer = new b2DebugLayer(pB2World, ratio);
	if (layer && layer->init())
	{
		layer->autorelease();
		return layer;
	}
	else
	{
		delete layer;
		layer = NULL;
		return NULL;
	}
}

b2DebugLayer::b2DebugLayer(b2World *world, float ratio){
	this->world = world;
	this->RATIO = ratio;
}

bool b2DebugLayer::init(){
	if (!Layer::init()){
		return false;
	}

	debugDraw = new b2DebugDraw(RATIO);
	
	uint32 flags = 0;
	flags += b2Draw::e_shapeBit;			// to render shape
	flags += b2Draw::e_jointBit;			// to render joints
	//flags += b2Draw::e_aabbBit;			// to render aabb (bounding box of physics body)
	//flags += b2Draw::e_pairBit;	
	flags += b2Draw::e_centerOfMassBit;		// to render transform (local x and y axis)
	debugDraw->SetFlags(flags);
	
	world->SetDebugDraw(debugDraw);

	return true;
}

void b2DebugLayer::setDebugFlags(uint32 flags){
	debugDraw->SetFlags(flags);
}

b2DebugLayer::~b2DebugLayer()
{
}
