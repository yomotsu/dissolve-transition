export const VERTEX_SHADER_SOURCE = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
	gl_Position = vec4( position, 1., 1. );
	vUv = uv;
}
`;

export const FRAGMENT_SHADER_SOURCE = `
precision highp float;
varying vec2 vUv;
uniform float progress;
uniform sampler2D media, mask;

float dissolveLowEdge = 0.0;
float dissolveHighEdge = 1.0;
float edgeDelta = dissolveHighEdge - dissolveLowEdge;

void main(){

	vec4 color = texture2D( media, vUv );
	float dissolveProgress = progress * ( 1.0 + edgeDelta );
	float alpha = smoothstep( dissolveLowEdge, dissolveHighEdge, clamp( texture2D( mask, vUv ).r - 1.0 + dissolveProgress, 0.0, 1.0 ) );

	gl_FragColor = vec4( color.rgb, color.a * alpha );
	// gl_FragColor = vec4( vec3( color.a * alpha ), 1. );

}
`;
