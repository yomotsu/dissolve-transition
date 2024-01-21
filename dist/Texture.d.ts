import type { TextureSource } from './types';
import { EventDispatcher } from './EventDispatcher';
export declare class Texture extends EventDispatcher {
    image: TextureSource;
    texture: WebGLTexture;
    private _gl;
    constructor(image: TextureSource, gl: WebGLRenderingContext);
    isLoaded(): boolean;
    onload(): void;
    setImage(image: TextureSource): void;
}
