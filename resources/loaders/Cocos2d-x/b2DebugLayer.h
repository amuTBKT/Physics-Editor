#pragma once

/*
Author: Amit Kumar Mehar

This software is provided 'as-is', without any express or implied
warranty.  In no event will the authors be held liable for any damages
arising from the use of this software.
Permission is granted to anyone to use this software for any purpose,
including commercial applications, and to alter it and redistribute it
freely, subject to the following restrictions:
1. The origin of this software must not be misrepresented; you must not
claim that you wrote the original software. If you use this software
in a product, an acknowledgment in the product documentation would be
appreciated but is not required.
2. Altered source versions must be plainly marked as such, and must not be
misrepresented as being the original software.
3. This notice may not be removed or altered from any source distribution.
*/

#include <cocos2d.h>
#include <Box2D\Box2D.h>
#include <b2DebugDraw.h>

USING_NS_CC;

class b2DebugLayer : public Layer
{
private:
	b2World *world;
	float RATIO = 30.0;			// pixel to meter ratio
	b2DebugDraw *debugDraw;		// handles rendering (polygons, segments, transforms)

public:
	// always use b2DebugLayer::create to create instances of debug layer
	static b2DebugLayer* create(b2World *, float);
	b2DebugLayer(b2World *, float);
	~b2DebugLayer();

	virtual bool init();
	void setDebugFlags(uint32);

	// overriding draw function (is different than previous versions of coocs2d)
	CustomCommand _command;
	virtual void draw(Renderer *renderer, const Mat4& transform, uint32_t flags){
		_command.init(_globalZOrder);
		_command.func = CC_CALLBACK_0(b2DebugLayer::OnDraw, this, transform, flags);
		renderer->addCommand(&_command);
	}
	void OnDraw(const Mat4& transform, uint32_t flags){
		kmGLPushMatrix();
		kmGLLoadMatrix(&transform);
		world->DrawDebugData();
		kmGLPopMatrix();
	}
};

