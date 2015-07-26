#include "b2DebugDraw.h"


b2DebugDraw::b2DebugDraw(float ratio)
{
	this->RATIO = ratio;
}

void b2DebugDraw::DrawPolygon(const b2Vec2* vertices, int vertexCount, const b2Color& color){
	glLineWidth(2);

	Vec2 *verts = new Vec2[vertexCount];
	for (int i = 0; i < vertexCount; i++){
		verts[i] = Vec2(vertices[i].x * RATIO, vertices[i].y * RATIO);
	}
	DrawPrimitives::setDrawColor4F(color.r, color.g, color.b, 1);
	DrawPrimitives::drawPoly(verts, vertexCount, true);

	glLineWidth(1);
}

void b2DebugDraw::DrawSolidPolygon(const b2Vec2* vertices, int vertexCount, const b2Color& color){
	glLineWidth(2);
	DrawPrimitives::setDrawColor4F(color.r, color.g, color.b, 1);

	Vec2 *verts = new Vec2[vertexCount];
	Vec2 *prevVert;
	for (int i = 0; i < vertexCount; i++){
		verts[i] = Vec2(vertices[i].x * RATIO, vertices[i].y * RATIO);
		
		// render edges
		if (i != 0){
			DrawPrimitives::drawLine(*prevVert, verts[i]);
		}
		
		if (i == vertexCount - 1){
			DrawPrimitives::drawLine(verts[i], verts[0]);
		}
		prevVert = &verts[i];
	}

	glLineWidth(2);
	
	// enable blending
	glEnable(GL_BLEND);
	glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
	
	// render solid shape with transparency
	DrawPrimitives::drawSolidPoly(verts, vertexCount, Color4F(color.r, color.g, color.b, 0.5));

	// disalbe blending
	glDisable(GL_BLEND);
}

void b2DebugDraw::DrawCircle(const b2Vec2& center, float32 radius, const b2Color& color){
	glLineWidth(2);

	DrawPrimitives::setDrawColor4F(color.r, color.g, color.b, 1);
	DrawPrimitives::drawCircle(Vec2(center.x * RATIO, center.y * RATIO), radius * RATIO, 360, 20, true);

	glLineWidth(1);
}

void b2DebugDraw::DrawSolidCircle(const b2Vec2& center, float32 radius, const b2Vec2& axis, const b2Color& color){
	// enable blending
	glEnable(GL_BLEND);
	glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);

	DrawPrimitives::setDrawColor4F(color.r, color.g, color.b, 0.5);
	DrawPrimitives::drawSolidCircle(Vec2(center.x * RATIO, center.y * RATIO), radius * RATIO, 360, 20);

	// disalbe blending
	glDisable(GL_BLEND);

	DrawCircle(center, radius, color);
}

void b2DebugDraw::DrawSegment(const b2Vec2& p1, const b2Vec2& p2, const b2Color& color){
	glLineWidth(2);

	DrawPrimitives::setDrawColor4F(color.r, color.g, color.b, 1);
	DrawPrimitives::drawLine(Vec2(p1.x * RATIO, p1.y * RATIO), Vec2(p2.x * RATIO, p2.y * RATIO));
	
	glLineWidth(1);
}

void b2DebugDraw::DrawTransform(const b2Transform& xf){
	Vec2 pos = Vec2(xf.p.x * RATIO, xf.p.y * RATIO), dest;
	float length = 20;

	glLineWidth(2);

	// render x-axis
	DrawPrimitives::setDrawColor4F(1, 0, 0, 1);
	dest = Vec2(pos.x + length * xf.q.GetXAxis().x, pos.y + length * xf.q.GetXAxis().y);
	DrawPrimitives::drawLine(pos, dest);

	// render y-axis
	DrawPrimitives::setDrawColor4F(0, 1, 0, 1);
	dest = Vec2(pos.x + length * xf.q.GetYAxis().x, pos.y + length * xf.q.GetYAxis().y);
	DrawPrimitives::drawLine(pos, dest);

	glLineWidth(1);
}

b2DebugDraw::~b2DebugDraw()
{
}
