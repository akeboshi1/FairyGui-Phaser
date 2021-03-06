import { ByteBuffer } from './utils/ByteBuffer';
import { GTweener } from './tween/GTweener';
import { GComponent } from "./GComponent";
export declare class GProgressBar extends GComponent {
    private _min;
    private _max;
    private _value;
    private _titleType;
    private _reverse;
    private _titleObject;
    private _aniObject;
    private _barObjectH;
    private _barObjectV;
    private _barMaxWidth;
    private _barMaxHeight;
    private _barMaxWidthDelta;
    private _barMaxHeightDelta;
    private _barStartX;
    private _barStartY;
    constructor(scene: Phaser.Scene, type: any);
    get titleType(): number;
    set titleType(value: number);
    get min(): number;
    set min(value: number);
    get max(): number;
    set max(value: number);
    get value(): number;
    set value(value: number);
    tweenValue(value: number, duration: number): GTweener;
    update(newValue: number): void;
    private setFillAmount;
    protected constructExtension(buffer: ByteBuffer): Promise<void>;
    protected handleSizeChanged(): void;
    setup_afterAdd(buffer: ByteBuffer, beginPos: number): void;
}
