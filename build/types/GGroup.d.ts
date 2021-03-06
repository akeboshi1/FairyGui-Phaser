import { ByteBuffer } from './utils/ByteBuffer';
import { GObject } from './GObject';
export declare class GGroup extends GObject {
    private _layout;
    private _lineGap;
    private _columnGap;
    private _excludeInvisibles;
    private _autoSizeDisabled;
    private _mainGridIndex;
    private _mainGridMinSize;
    private _boundsChanged;
    private _percentReady;
    private _mainChildIndex;
    private _totalSize;
    private _numChildren;
    _updating: number;
    constructor(scene: Phaser.Scene, type: any);
    dispose(): void;
    /**
     * group 交互默认为false
     */
    set touchable(value: boolean);
    get layout(): number;
    set layout(value: number);
    get lineGap(): number;
    set lineGap(value: number);
    get columnGap(): number;
    set columnGap(value: number);
    get excludeInvisibles(): boolean;
    set excludeInvisibles(value: boolean);
    get autoSizeDisabled(): boolean;
    set autoSizeDisabled(value: boolean);
    get mainGridMinSize(): number;
    set mainGridMinSize(value: number);
    get mainGridIndex(): number;
    set mainGridIndex(value: number);
    setBoundsChangedFlag(positionChangedOnly?: boolean): void;
    ensureSizeCorrect(): void;
    ensureBoundsCorrect(): void;
    private updateBounds;
    private handleLayout;
    moveChildren(dx: number, dy: number): void;
    resizeChildren(dw: number, dh: number): void;
    protected handleAlphaChanged(): void;
    handleVisibleChanged(): void;
    setup_beforeAdd(buffer: ByteBuffer, beginPos: number): void;
    setup_afterAdd(buffer: ByteBuffer, beginPos: number): void;
}
