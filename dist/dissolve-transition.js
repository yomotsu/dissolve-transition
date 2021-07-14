/*!
 * @author yomotsu
 * dissolve-transition
 * https://github.com/yomotsu/dissolve-transition
 * Released under the MIT License.
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.DissolveTransition = factory());
}(this, (function () { 'use strict';

	/*! *****************************************************************************
	Copyright (c) Microsoft Corporation.

	Permission to use, copy, modify, and/or distribute this software for any
	purpose with or without fee is hereby granted.

	THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
	REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
	AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
	INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
	LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
	OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
	PERFORMANCE OF THIS SOFTWARE.
	***************************************************************************** */
	/* global Reflect, Promise */

	var extendStatics = function(d, b) {
	    extendStatics = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
	    return extendStatics(d, b);
	};

	function __extends(d, b) {
	    if (typeof b !== "function" && b !== null)
	        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
	    extendStatics(d, b);
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	}

	var EventDispatcher = (function () {
	    function EventDispatcher() {
	        this._listeners = {};
	    }
	    EventDispatcher.prototype.addEventListener = function (type, listener) {
	        var listeners = this._listeners;
	        if (listeners[type] === undefined)
	            listeners[type] = [];
	        if (listeners[type].indexOf(listener) === -1) {
	            listeners[type].push(listener);
	        }
	    };
	    EventDispatcher.prototype.hasEventListener = function (type, listener) {
	        var listeners = this._listeners;
	        return listeners[type] !== undefined && listeners[type].indexOf(listener) !== -1;
	    };
	    EventDispatcher.prototype.removeEventListener = function (type, listener) {
	        var listeners = this._listeners;
	        var listenerArray = listeners[type];
	        if (listenerArray !== undefined) {
	            var index = listenerArray.indexOf(listener);
	            if (index !== -1)
	                listenerArray.splice(index, 1);
	        }
	    };
	    EventDispatcher.prototype.dispatchEvent = function (event) {
	        var listeners = this._listeners;
	        var listenerArray = listeners[event.type];
	        if (listenerArray !== undefined) {
	            event.target = this;
	            var array = listenerArray.slice(0);
	            for (var i = 0, l = array.length; i < l; i++) {
	                array[i].call(this, event);
	            }
	        }
	    };
	    return EventDispatcher;
	}());

	function getWebglContext(canvas, contextAttributes) {
	    return (canvas.getContext('webgl', contextAttributes) ||
	        canvas.getContext('experimental-webgl', contextAttributes));
	}
	var MAX_TEXTURE_SIZE = (function () {
	    var $canvas = document.createElement('canvas');
	    var gl = getWebglContext($canvas);
	    var MAX_TEXTURE_SIZE = gl.getParameter(gl.MAX_TEXTURE_SIZE);
	    var ext = gl.getExtension('WEBGL_lose_context');
	    if (ext)
	        ext.loseContext();
	    return MAX_TEXTURE_SIZE;
	})();
	function ceilPowerOfTwo(value) {
	    return Math.pow(2, Math.ceil(Math.log(value) / Math.LN2));
	}
	function isPowerOfTwo(value) {
	    return (value & (value - 1)) === 0 && value !== 0;
	}

	var defaultImage = document.createElement('canvas');
	defaultImage.width = 2;
	defaultImage.height = 2;
	var Texture = (function (_super) {
	    __extends(Texture, _super);
	    function Texture(image, gl) {
	        var _this = _super.call(this) || this;
	        _this.image = image;
	        _this._gl = gl;
	        _this.texture = gl.createTexture();
	        gl.bindTexture(gl.TEXTURE_2D, _this.texture);
	        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
	        _this.onload();
	        return _this;
	    }
	    Texture.prototype.isLoaded = function () {
	        if (this.image instanceof HTMLCanvasElement)
	            return true;
	        if (this.image instanceof HTMLVideoElement)
	            return true;
	        return this.image.naturalWidth !== 0;
	    };
	    Texture.prototype.onload = function () {
	        var _this = this;
	        var onload = function () {
	            _this.image.removeEventListener('load', onload);
	            _this.setImage(_this.image);
	        };
	        if (this.isLoaded()) {
	            this.setImage(this.image);
	            return;
	        }
	        this.image.addEventListener('load', onload);
	    };
	    Texture.prototype.setImage = function (image) {
	        var _gl = this._gl;
	        var _image;
	        this.image = image;
	        if (this.isLoaded()) {
	            _image = this.image;
	        }
	        else {
	            _image = defaultImage;
	            this.onload();
	        }
	        if (!_gl) {
	            this.dispatchEvent({ type: 'updated' });
	            return;
	        }
	        var width = this.image instanceof HTMLImageElement ? this.image.naturalWidth : this.image.width;
	        var height = this.image instanceof HTMLImageElement ? this.image.naturalHeight : this.image.height;
	        var isPowerOfTwoSize = isPowerOfTwo(width) && isPowerOfTwo(height);
	        _gl.bindTexture(_gl.TEXTURE_2D, this.texture);
	        _gl.pixelStorei(_gl.UNPACK_FLIP_Y_WEBGL, true);
	        _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, isPowerOfTwoSize ? _gl.LINEAR_MIPMAP_NEAREST : _gl.LINEAR);
	        _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _gl.LINEAR);
	        _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_S, _gl.CLAMP_TO_EDGE);
	        _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_T, _gl.CLAMP_TO_EDGE);
	        _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, _gl.RGBA, _gl.UNSIGNED_BYTE, _image);
	        if (isPowerOfTwoSize)
	            _gl.generateMipmap(_gl.TEXTURE_2D);
	        _gl.bindTexture(_gl.TEXTURE_2D, null);
	        this.dispatchEvent({ type: 'updated' });
	    };
	    return Texture;
	}(EventDispatcher));

	var VERTEX_SHADER_SOURCE = "\nattribute vec2 position;\nattribute vec2 uv;\nvarying vec2 vUv;\nvoid main() {\n\tgl_Position = vec4( position, 1., 1. );\n\tvUv = uv;\n}\n";
	var FRAGMENT_SHADER_SOURCE = "\nprecision highp float;\nvarying vec2 vUv;\nuniform float progress;\nuniform sampler2D media, mask;\n\nfloat dissolveLowEdge = 0.0;\nfloat dissolveHighEdge = 1.0;\nfloat edgeDelta = dissolveHighEdge - dissolveLowEdge;\n\nvoid main(){\n\n\tvec4 color = texture2D( media, vUv );\n\tfloat dissolveProgress = progress * ( 1.0 + edgeDelta );\n\tfloat alpha = smoothstep( dissolveLowEdge, dissolveHighEdge, clamp( texture2D( mask, vUv ).r - 1.0 + dissolveProgress, 0.0, 1.0 ) );\n\n\tgl_FragColor = vec4( color.rgb, color.a * alpha );\n\t// gl_FragColor = vec4( vec3( color.a * alpha ), 1. );\n\n}\n";

	var UV = new Float32Array([
	    0.0, 0.0,
	    1.0, 0.0,
	    0.0, 1.0,
	    1.0, 0.0,
	    1.0, 1.0,
	    0.0, 1.0,
	]);
	var DissolveTransition = (function (_super) {
	    __extends(DissolveTransition, _super);
	    function DissolveTransition(canvas, media, mask) {
	        var _this = _super.call(this) || this;
	        _this.duration = 2000;
	        _this._progress = 0;
	        _this._isRunning = false;
	        _this._hasUpdated = true;
	        _this._destroyed = false;
	        _this._vertexes = new Float32Array([
	            -1, -1,
	            1, -1,
	            -1, 1,
	            1, -1,
	            1, 1,
	            -1, 1,
	        ]);
	        _this._canvas = canvas;
	        _this._gl = getWebglContext(canvas);
	        _this._vertexBuffer = _this._gl.createBuffer();
	        _this._uvBuffer = _this._gl.createBuffer();
	        _this._vertexShader = _this._gl.createShader(_this._gl.VERTEX_SHADER);
	        _this._gl.shaderSource(_this._vertexShader, VERTEX_SHADER_SOURCE);
	        _this._gl.compileShader(_this._vertexShader);
	        _this._fragmentShader = _this._gl.createShader(_this._gl.FRAGMENT_SHADER);
	        _this._gl.shaderSource(_this._fragmentShader, FRAGMENT_SHADER_SOURCE);
	        _this._gl.compileShader(_this._fragmentShader);
	        _this._program = _this._gl.createProgram();
	        _this._gl.attachShader(_this._program, _this._vertexShader);
	        _this._gl.attachShader(_this._program, _this._fragmentShader);
	        _this._gl.linkProgram(_this._program);
	        _this._gl.useProgram(_this._program);
	        _this._gl.enable(_this._gl.BLEND);
	        _this._gl.blendFuncSeparate(_this._gl.SRC_ALPHA, _this._gl.ONE_MINUS_SRC_ALPHA, _this._gl.ONE, _this._gl.ZERO);
	        _this._gl.bindBuffer(_this._gl.ARRAY_BUFFER, _this._vertexBuffer);
	        _this._gl.bufferData(_this._gl.ARRAY_BUFFER, _this._vertexes, _this._gl.STATIC_DRAW);
	        var position = _this._gl.getAttribLocation(_this._program, 'position');
	        _this._gl.vertexAttribPointer(position, 2, _this._gl.FLOAT, false, 0, 0);
	        _this._gl.enableVertexAttribArray(position);
	        _this._gl.bindBuffer(_this._gl.ARRAY_BUFFER, _this._uvBuffer);
	        _this._gl.bufferData(_this._gl.ARRAY_BUFFER, UV, _this._gl.STATIC_DRAW);
	        var uv = _this._gl.getAttribLocation(_this._program, 'uv');
	        _this._gl.vertexAttribPointer(uv, 2, _this._gl.FLOAT, false, 0, 0);
	        _this._gl.enableVertexAttribArray(uv);
	        _this._uniformLocations = {
	            progress: _this._gl.getUniformLocation(_this._program, 'progress'),
	            media: _this._gl.getUniformLocation(_this._program, 'media'),
	            mask: _this._gl.getUniformLocation(_this._program, 'mask'),
	        };
	        _this._media = new Texture(media, _this._gl);
	        _this._mask = new Texture(mask, _this._gl);
	        _this._media.addEventListener('updated', _this._updateTexture.bind(_this));
	        _this._mask.addEventListener('updated', _this._updateTexture.bind(_this));
	        _this._updateTexture();
	        _this.setSize(_this._canvas.width, _this._canvas.height);
	        return _this;
	    }
	    DissolveTransition.loadImage = function (imageSource) {
	        return new Promise(function (resolve) {
	            var img = new Image();
	            var onLoad = function () {
	                img.removeEventListener('load', onLoad);
	                resolve(img);
	            };
	            img.addEventListener('load', onLoad);
	            img.src = imageSource;
	        });
	    };
	    DissolveTransition.convertPowerOfTwo = function (image) {
	        var _a;
	        var $canvas = document.createElement('canvas');
	        if (image.naturalWidth === 0) {
	            console.warn('Image must be loaded before converting');
	            return image;
	        }
	        var width = Math.min(ceilPowerOfTwo(image.naturalWidth), MAX_TEXTURE_SIZE);
	        var height = Math.min(ceilPowerOfTwo(image.naturalHeight), MAX_TEXTURE_SIZE);
	        if (isPowerOfTwo(width) && isPowerOfTwo(height))
	            return image;
	        $canvas.width = width;
	        $canvas.height = height;
	        (_a = $canvas.getContext('2d')) === null || _a === void 0 ? void 0 : _a.drawImage(image, 0, 0, width, height);
	        return $canvas;
	    };
	    DissolveTransition.prototype.start = function () {
	        var _this = this;
	        if (this._isRunning)
	            return;
	        this._isRunning = true;
	        var startTime = performance.now();
	        var tick = function () {
	            if (_this._destroyed)
	                return;
	            if (!_this._isRunning)
	                return;
	            var elapsedTime = performance.now() - startTime;
	            _this._progress = Math.min(Math.max(elapsedTime / _this.duration, 0), 1);
	            _this.render();
	            if (_this._progress === 1)
	                _this._isRunning = false;
	            requestAnimationFrame(tick);
	        };
	        tick();
	    };
	    DissolveTransition.prototype.setSize = function (w, h) {
	        if (this._canvas.width === w && this._canvas.height === h)
	            return;
	        this._canvas.width = w;
	        this._canvas.height = h;
	        this._gl.viewport(0, 0, w, h);
	        this._updateAspect();
	    };
	    DissolveTransition.prototype.render = function () {
	        if (this._destroyed)
	            return;
	        this._gl.clearColor(0, 0, 0, 0);
	        this._gl.uniform1f(this._uniformLocations.progress, this._progress);
	        this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
	        this._gl.drawArrays(this._gl.TRIANGLES, 0, 6);
	        this._gl.flush();
	        if (this._progress === 1) {
	            this._hasUpdated = false;
	            this.dispatchEvent({ type: 'transitionEnd' });
	        }
	    };
	    DissolveTransition.prototype.destroy = function (removeElement) {
	        if (removeElement === void 0) { removeElement = false; }
	        this._destroyed = true;
	        this._isRunning = false;
	        if (removeElement)
	            this.setSize(1, 1);
	        if (this._program) {
	            this._gl.activeTexture(this._gl.TEXTURE0);
	            this._gl.bindTexture(this._gl.TEXTURE_2D, null);
	            this._gl.activeTexture(this._gl.TEXTURE1);
	            this._gl.bindTexture(this._gl.TEXTURE_2D, null);
	            this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);
	            this._gl.deleteTexture(this._media.texture);
	            this._gl.deleteTexture(this._mask.texture);
	            this._gl.deleteBuffer(this._vertexBuffer);
	            this._gl.deleteBuffer(this._uvBuffer);
	            this._gl.deleteShader(this._vertexShader);
	            this._gl.deleteShader(this._fragmentShader);
	            this._gl.deleteProgram(this._program);
	        }
	        if (removeElement && !!this._canvas.parentNode) {
	            this._canvas.parentNode.removeChild(this._canvas);
	        }
	    };
	    DissolveTransition.prototype._updateTexture = function () {
	        this._gl.activeTexture(this._gl.TEXTURE0);
	        this._gl.bindTexture(this._gl.TEXTURE_2D, this._media.texture);
	        this._gl.uniform1i(this._uniformLocations.media, 0);
	        this._gl.activeTexture(this._gl.TEXTURE1);
	        this._gl.bindTexture(this._gl.TEXTURE_2D, this._mask.texture);
	        this._gl.uniform1i(this._uniformLocations.mask, 1);
	        this._onUpdate();
	    };
	    DissolveTransition.prototype._updateAspect = function () {
	        var canvasAspect = this._canvas.width / this._canvas.height;
	        var imageAspect = this._media instanceof HTMLImageElement ? this._media.naturalWidth / this._media.naturalHeight :
	            this._media instanceof HTMLCanvasElement ? this._media.width / this._media.height :
	                1;
	        var aspect = imageAspect / canvasAspect;
	        var posX = aspect < 1 ? 1.0 : aspect;
	        var posY = aspect > 1 ? 1.0 : canvasAspect / imageAspect;
	        this._vertexes[0] = -posX;
	        this._vertexes[1] = -posY;
	        this._vertexes[2] = posX;
	        this._vertexes[3] = -posY;
	        this._vertexes[4] = -posX;
	        this._vertexes[5] = posY;
	        this._vertexes[6] = posX;
	        this._vertexes[7] = -posY;
	        this._vertexes[8] = posX;
	        this._vertexes[9] = posY;
	        this._vertexes[10] = -posX;
	        this._vertexes[11] = posY;
	        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._vertexBuffer);
	        this._gl.bufferData(this._gl.ARRAY_BUFFER, this._vertexes, this._gl.STATIC_DRAW);
	        this._onUpdate();
	    };
	    DissolveTransition.prototype._onUpdate = function () {
	        var _this = this;
	        if (this._hasUpdated)
	            return;
	        this._hasUpdated = true;
	        requestAnimationFrame(function () {
	            _this.render();
	            _this._hasUpdated = false;
	        });
	    };
	    return DissolveTransition;
	}(EventDispatcher));

	return DissolveTransition;

})));
