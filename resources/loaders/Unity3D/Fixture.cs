using UnityEngine;
using System.Collections;

public class Fixture {

	// physics material to be used by the collider
	public PhysicsMaterial2D physicsMaterial;
	// density of fixture
	public float density;
	// shape type (to be used when creating colliders)
	public int shapeType;
	// size of collier (Vetor2(width, height) for BoxCollider2D and Vector2(radius, radius) for CircleCollider2D)
	public Vector2 size;
	// offset position of collider from body
	public Vector2 offset;
	// vertices for creating PolygonCollider2D or Edgeollider2D
	public Vector2[] vertices;
	// is collider trigger
	public bool isTrigger;
}
