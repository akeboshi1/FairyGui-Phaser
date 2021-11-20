import { DisplayObject } from '../displayobject/DisplayObject';
import { CanvasText } from './canvastext/CanvasText';
import { ImageManager } from './imagemanager/ImageManager';
import { TextStyle } from './style/TextStyle';
import { FillStyleType, HAlignModeString, VAlignModeString } from './Types';
export declare class TextField extends DisplayObject {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D | null;
    frame: Phaser.Textures.Frame;
    texture: Phaser.Textures.Texture;
    padding: Phaser.Geom.Rectangle;
    dirty: boolean;
    protected _text: string;
    protected _imageManager: ImageManager;
    protected _canvasText: CanvasText;
    protected _style: TextStyle;
    constructor(scene: Phaser.Scene);
    setText(value: string | string[]): this;
    addImage(key: string, config: string): this;
    drawAreaBounds(graphics: any, color: any): this;
    updateText(runWrap?: boolean): this;
    setWordWrapWidth(width: number, useAdvancedWrap: boolean): void;
    setSingleLine(val: boolean): void;
    setInteractive(hitArea?: Phaser.Types.Input.InputConfiguration | any, callback?: Phaser.Types.Input.HitAreaCallback, dropZone?: boolean): this;
    renderCanvas(renderer: Phaser.Renderer.Canvas.CanvasRenderer, src: TextField, camera: Phaser.Cameras.Scene2D.Camera, parentMatrix: Phaser.GameObjects.Components.TransformMatrix): void;
    renderWebGL(renderer: Phaser.Renderer.WebGL.WebGLRenderer, src: TextField, camera: Phaser.Cameras.Scene2D.Camera, parentMatrix: Phaser.GameObjects.Components.TransformMatrix): void;
    setColor(val: string): void;
    setAlign(val: HAlignModeString): void;
    setVAlign(val: VAlignModeString): void;
    setBold(val: boolean): void;
    setItalic(val: boolean): void;
    setUnderline(thickness?: number, style?: FillStyleType, offsetY?: number): void;
    setShadowStyle(color: string): void;
    setShadowOffset(x: number, y: number): void;
    setShadowFill(val: boolean): void;
    setLetterSpacing(val: number): void;
    setStroke(color: FillStyleType, thickness: number): void;
    setLineSpacing(val: number): void;
    setFont(font: string): void;
    setFontSize(fontSize: string | number): void;
    setValign(val: VAlignModeString): void;
    protected onContextRestored(): void;
    protected preDestroy(): void;
    get imageManager(): ImageManager;
    get canvasText(): CanvasText;
    get style(): TextStyle;
    get text(): string;
    set text(val: string);
}