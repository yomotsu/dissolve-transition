export const VERTEX_SHADER_SOURCE = `
attribute vec2 position;
attribute vec2 uv;
uniform vec2 uvScale;
varying vec2 vUv;
void main() {
	gl_Position = vec4( position, 1., 1. );

	vUv = uv;

	if ( uvScale.y < 1.0 ) {

		float offset = ( 1.0 - uvScale.y ) * .5;
		vUv.y = vUv.y * uvScale.y + offset;

	} else {

		float offset = ( 1.0 - uvScale.x ) * .5;
		vUv.x = vUv.x * uvScale.x + offset;

	}
}
`;

export const FRAGMENT_SHADER_SOURCE = `
precision highp float;
varying vec2 vUv;
uniform float progress;
uniform float dissolveLowEdge;
uniform float dissolveHighEdge;
uniform sampler2D media, mask;

void main(){

	vec4 color = texture2D( media, vUv );
	float alpha = smoothstep( dissolveLowEdge, dissolveHighEdge, clamp( texture2D( mask, vUv ).r - 1.0 + progress, 0.0, 1.0 ) );

	gl_FragColor = vec4( color.rgb, color.a * alpha );
	// gl_FragColor = vec4( vec3( color.a * alpha ), 1. );

}
`;
