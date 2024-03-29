// import type { TextureSource, MediaSource } from './types';
import type { TextureSource } from './types';
import { EventDispatcher } from './EventDispatcher';
import { MAX_TEXTURE_SIZE, getWebglContext, ceilPowerOfTwo, isPowerOfTwo } from './webgl-utils';
import { Texture } from './Texture';
import {
	VERTEX_SHADER_SOURCE,
	FRAGMENT_SHADER_SOURCE,
} from './shader';


const VERTEXES = new Float32Array( [
	- 1, - 1,
		1, - 1,
	- 1,   1,
		1, - 1,
		1,   1,
	- 1,   1,
] );

const UV = new Float32Array( [
	0.0, 0.0,
	1.0, 0.0,
	0.0, 1.0,
	1.0, 0.0,
	1.0, 1.0,
	0.0, 1.0,
] );

export class DissolveTransition extends EventDispatcher {

	static loadImage( imageSource: string ): Promise<HTMLImageElement> {

		return new Promise( ( resolve ) => {

			const img = new Image();
			const onLoad = () => {

				img.removeEventListener( 'load', onLoad );
				resolve( img );

			}
			img.addEventListener( 'load', onLoad );
			img.src = imageSource;

		} );

	}

	static convertPowerOfTwo( image: HTMLImageElement ): TextureSource {

		const $canvas = document.createElement( 'canvas' );

		if ( image.naturalWidth === 0 ) {

			console.warn( 'Image must be loaded before converting' );
			return image;

		}

		const width = Math.min( ceilPowerOfTwo( image.naturalWidth ), MAX_TEXTURE_SIZE );
		const height = Math.min( ceilPowerOfTwo( image.naturalHeight ), MAX_TEXTURE_SIZE );

		if ( isPowerOfTwo( width ) && isPowerOfTwo( height ) ) return image;
		$canvas.width = width;
		$canvas.height = height;

		$canvas.getContext( '2d' )?.drawImage( image, 0, 0, width, height );
		return $canvas;

	}

	duration: number = 4000;

	private _progress: number = 0;
	private _canvas: HTMLCanvasElement;
	private _media: Texture;
	private _mask: Texture;
	private _isRunning: boolean = false;
	private _hasUpdated: boolean = true;
	private _destroyed: boolean = false;

	private _gl: WebGLRenderingContext;
	private _vertexShader: WebGLShader;
	private _fragmentShader: WebGLShader | null;
	private _program: WebGLProgram | null;
	private _vertexBuffer: WebGLBuffer;
	private _uvBuffer: WebGLBuffer;
	private _uniformLocations: {
		progress        : WebGLUniformLocation | null,
		dissolveLowEdge :WebGLUniformLocation | null,
		dissolveHighEdge:WebGLUniformLocation | null,
		uvScale         : WebGLUniformLocation | null,
		media           : WebGLUniformLocation | null,
		mask            : WebGLUniformLocation | null,
	};

	constructor( canvas: HTMLCanvasElement, media: TextureSource, mask: TextureSource ) {

		super();

		this._canvas = canvas;

		this._gl = getWebglContext( canvas );
		this._vertexBuffer = this._gl.createBuffer()!;
		this._uvBuffer = this._gl.createBuffer()!;

		this._vertexShader = this._gl.createShader( this._gl.VERTEX_SHADER )!;
		this._gl.shaderSource( this._vertexShader, VERTEX_SHADER_SOURCE );
		this._gl.compileShader( this._vertexShader );

		this._fragmentShader = this._gl.createShader( this._gl.FRAGMENT_SHADER )!;
		this._gl.shaderSource( this._fragmentShader, FRAGMENT_SHADER_SOURCE );
		this._gl.compileShader( this._fragmentShader );

		this._program = this._gl.createProgram()!;
		this._gl.attachShader( this._program, this._vertexShader );
		this._gl.attachShader( this._program, this._fragmentShader );
		this._gl.linkProgram( this._program );
		this._gl.useProgram( this._program );

		// http://webos-goodies.jp/archives/overlaying_webgl_on_html.html
		this._gl.enable( this._gl.BLEND );
		this._gl.blendFuncSeparate(
			this._gl.SRC_ALPHA,
			this._gl.ONE_MINUS_SRC_ALPHA,
			this._gl.ONE,
			this._gl.ZERO,
		);

		// vertexes
		this._gl.bindBuffer( this._gl.ARRAY_BUFFER, this._vertexBuffer );
		this._gl.bufferData( this._gl.ARRAY_BUFFER, VERTEXES, this._gl.STATIC_DRAW );

		const position = this._gl.getAttribLocation( this._program, 'position' );
		this._gl.vertexAttribPointer( position, 2, this._gl.FLOAT, false, 0, 0 );
		this._gl.enableVertexAttribArray( position );

		// uv attr
		this._gl.bindBuffer( this._gl.ARRAY_BUFFER, this._uvBuffer );
		this._gl.bufferData( this._gl.ARRAY_BUFFER, UV, this._gl.STATIC_DRAW );

		const uv = this._gl.getAttribLocation( this._program, 'uv' );
		this._gl.vertexAttribPointer( uv, 2, this._gl.FLOAT, false, 0, 0 );
		this._gl.enableVertexAttribArray( uv );

		this._uniformLocations = {
			progress        : this._gl.getUniformLocation( this._program, 'progress' ),
			dissolveLowEdge : this._gl.getUniformLocation( this._program, 'dissolveLowEdge' ),
			dissolveHighEdge: this._gl.getUniformLocation( this._program, 'dissolveHighEdge' ),
			uvScale         : this._gl.getUniformLocation( this._program, 'uvScale' ),
			media           : this._gl.getUniformLocation( this._program, 'media' ),
			mask            : this._gl.getUniformLocation( this._program, 'mask' ),
		};

		this._gl.uniform1f( this._uniformLocations.dissolveLowEdge, 0 );
		this._gl.uniform1f( this._uniformLocations.dissolveHighEdge, .2 );

		this._media = new Texture( media, this._gl );
		this._mask  = new Texture( mask,  this._gl );

		this._media.addEventListener( 'updated', this._updateTexture.bind( this ) );
		this._mask.addEventListener( 'updated', this._updateTexture.bind( this ) );

		this._updateTexture();
		this.setSize( this._canvas.width, this._canvas.height );

		return this;

	}

	start() {

		if ( this._isRunning ) return;

		this._isRunning = true;
		const startTime = performance.now();

		const tick = () => {

			if ( this._destroyed ) return;
			if ( ! this._isRunning ) return;

			const elapsedTime = performance.now() - startTime;
			this._progress = easeOutSine( clamp( elapsedTime / this.duration, 0, 1 ) );

			this.render();

			if ( this._progress === 1 ) {

				this._isRunning = false;
				this.dispatchEvent( { type: 'transitionEnd' } );

			}

			requestAnimationFrame( tick );

		};

		tick();

	}

	reset() {

		this._isRunning = false;
		this._progress = 0;
		this.render();

	}

	setSize( w: number, h: number ) {

		if ( this._canvas.width  === w && this._canvas.height === h ) return;

		this._canvas.width  = w;
		this._canvas.height = h;
		this._gl.viewport( 0, 0, w, h );

		// update vertex buffer
		this._updateAspect();

	}

	render() {

		if ( this._destroyed ) return;

		this._gl.clearColor( 0, 0, 0, 0 );
		this._gl.uniform1f( this._uniformLocations.progress, this._progress );
		this._gl.clear( this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT );
		this._gl.drawArrays( this._gl.TRIANGLES, 0, 6 );
		this._gl.flush();

		if ( this._progress === 1 ) this._hasUpdated = false;

	}

	destroy( removeElement = false ) {

		this._destroyed   = true;
		this._isRunning   = false;

		if ( removeElement ) this.setSize( 1, 1 );

		if ( this._program ) {

			// https://stackoverflow.com/a/23606581/1512272
			this._gl.activeTexture( this._gl.TEXTURE0 );
			this._gl.bindTexture( this._gl.TEXTURE_2D, null );
			this._gl.activeTexture( this._gl.TEXTURE1 );
			this._gl.bindTexture( this._gl.TEXTURE_2D, null );
			this._gl.bindBuffer( this._gl.ARRAY_BUFFER, null );

			this._gl.deleteTexture( this._media.texture );
			this._gl.deleteTexture( this._mask.texture );
			this._gl.deleteBuffer( this._vertexBuffer );
			this._gl.deleteBuffer( this._uvBuffer );
			this._gl.deleteShader( this._vertexShader );
			this._gl.deleteShader( this._fragmentShader );
			this._gl.deleteProgram( this._program );

		}

		if ( removeElement && !! this._canvas.parentNode ) {

			this._canvas.parentNode.removeChild( this._canvas );

		}

	}

	private _updateTexture() {

		this._gl.activeTexture( this._gl.TEXTURE0 );
		this._gl.bindTexture( this._gl.TEXTURE_2D, this._media.texture );
		this._gl.uniform1i( this._uniformLocations.media, 0 );

		this._gl.activeTexture( this._gl.TEXTURE1 );
		this._gl.bindTexture( this._gl.TEXTURE_2D, this._mask.texture );
		this._gl.uniform1i( this._uniformLocations.mask, 1 );

		this._updateAspect();

	}

	private _updateAspect() {

		// update vertex buffer
		const canvasAspect = this._canvas.width / this._canvas.height;
		const mediaAspect =
			this._media.image instanceof HTMLImageElement ? this._media.image.naturalWidth / this._media.image.naturalHeight :
			this._media.image instanceof HTMLCanvasElement ? this._media.image.width / this._media.image.height :
			1;
		const aspect = mediaAspect / canvasAspect;

		if ( aspect < 1.0 ) {

			this._gl.uniform2f( this._uniformLocations.uvScale, 1, aspect );

		} else {

			this._gl.uniform2f( this._uniformLocations.uvScale, 1 / aspect, 1 );

		}

		this._onUpdate();

	}

	private _onUpdate() {

		if ( this._isRunning ) return; // no need to render here. will be renderd anyway
		if ( this._hasUpdated ) return;

		this._hasUpdated = true;

		requestAnimationFrame( () => {

			this.render();
			this._hasUpdated = false;

		} );
	}

}

function clamp( num: number, min: number, max: number ): number {

	return Math.min( Math.max( num, min ), max );

}

function easeOutSine( x: number ): number {

  return Math.sin( ( x * Math.PI) / 2 );

}

