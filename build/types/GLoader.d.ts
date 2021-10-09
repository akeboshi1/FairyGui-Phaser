import { ByteBuffer } from './utils/ByteBuffer';
import { MovieClip } from './display/MovieClip';
import { GObject } from './GObject';
import { GComponent } from './GComponent';
export declare class GLoader extends GObject {
    private _url;
    private _align;
    private _valign;
    private _autoSize;
    private _fill;
    private _shrinkOnly;
    private _showErrorSign;
    private _contentItem;
    private _content;
    private _errorSign?;
    private _content2?;
    private _updatingLayout;
    private static _errorSignPool;
    constructor(scene: Phaser.Scene);
    createDisplayObject(): void;
    dispose(): void;
    get url(): string;
    set url(value: string);
    get icon(): string;
    set icon(value: string);
    get align(): string;
    set align(value: string);
    get verticalAlign(): string;
    set verticalAlign(value: string);
    get fill(): number;
    set fill(value: number);
    get shrinkOnly(): boolean;
    set shrinkOnly(value: boolean);
    get autoSize(): boolean;
    set autoSize(value: boolean);
    get playing(): boolean;
    set playing(value: boolean);
    get frame(): number;
    set frame(value: number);
    get color(): string;
    set color(value: string);
    get fillMethod(): number;
    set fillMethod(value: number);
    get fillOrigin(): number;
    set fillOrigin(value: number);
    get fillClockwise(): boolean;
    set fillClockwise(value: boolean);
    get fillAmount(): number;
    set fillAmount(value: number);
    get showErrorSign(): boolean;
    set showErrorSign(value: boolean);
    get content(): MovieClip;
    get component(): GComponent;
    protected loadContent(): void;
    protected loadFromPackage(itemURL: string): Promise<void>;
    protected loadExternal(): void;
    protected freeExternal(texture: Phaser.Textures.Texture): void;
    protected onExternalLoadSuccess(texture: Phaser.Textures.Texture): void;
    protected onExternalLoadFailed(): void;
    private __getResCompleted;
    private setErrorState;
    private clearErrorState;
    private updateLayout;
    private clearContent;
    protected handleSizeChanged(): void;
    getProp(index: number): any;
    setProp(index: number, value: any): void;
    setup_beforeAdd(buffer: ByteBuffer, beginPos: number): void;
}
