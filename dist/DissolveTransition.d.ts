import type { TextureSource } from './types';
import { EventDispatcher } from './EventDispatcher';
export declare class DissolveTransition extends EventDispatcher {
    static loadImage(imageSource: string): Promise<HTMLImageElement>;
    static convertPowerOfTwo(image: HTMLImageElement): TextureSource;
    duration: number;
    private _progress;
    private _canvas;
    private _media;
    private _mask;
    private _isRunning;
    private _hasUpdated;
    private _destroyed;
    private _gl;
    private _vertexShader;
    private _fragmentShader;
    private _program;
    private _vertexBuffer;
    private _uvBuffer;
    private _uniformLocations;
    constructor(canvas: HTMLCanvasElement, media: TextureSource, mask: TextureSource);
    start(): void;
    setSize(w: number, h: number): void;
    render(): void;
    destroy(removeElement?: boolean): void;
    private _updateTexture;
    private _updateAspect;
    private _onUpdate;
}
