import { GTextField } from './GTextField';
import { TextField } from './display/text/TextField';
import { ByteBuffer } from '.';
import { HAlignModeString, VAlignModeString } from './display/text/Types';
export declare class GBasicTextField extends GTextField {
    protected _textField: TextField;
    private _textWidth;
    private _textHeight;
    private _bitmapFont?;
    private _lines?;
    constructor(scene: Phaser.Scene, type: number);
    private i18nChange;
    get adaptiveScaleX(): number;
    get adaptiveScaleY(): number;
    set adaptiveScaleX(val: number);
    set adaptiveScaleY(val: number);
    createDisplayObject(): void;
    setup_afterAdd(buffer: ByteBuffer, beginPos: number): void;
    setResolution(val: any): void;
    get nativeText(): TextField;
    set text(value: any);
    get text(): any;
    get font(): string;
    set font(value: string);
    get fontSize(): number;
    set fontSize(value: number);
    get color(): string;
    set color(value: string);
    get align(): HAlignModeString;
    set align(value: HAlignModeString);
    get valign(): VAlignModeString;
    set valign(value: VAlignModeString);
    get leading(): number;
    set leading(value: number);
    get letterSpacing(): number;
    set letterSpacing(value: number);
    get bold(): boolean;
    set bold(value: boolean);
    get italic(): boolean;
    set italic(value: boolean);
    get underline(): boolean;
    set underline(value: boolean);
    get singleLine(): boolean;
    set singleLine(value: boolean);
    get stroke(): number;
    set stroke(value: number);
    get strokeColor(): string;
    set strokeColor(value: string);
    setStroke(color: string, thickness: number): void;
    setShadowStyle(color: string): void;
    setShadowOffset(x: number, y: number): void;
    protected updateAutoSize(): void;
    get textWidth(): number;
    get textHeight(): number;
    ensureSizeCorrect(): void;
    typeset(): void;
    protected updateSize(): void;
    dispose(): void;
    private renderWithBitmapFont;
    protected handleGrayedChanged(): void;
    protected doAlign(): void;
    protected handleXYChanged1(): void;
    flushVars(): void;
}
export interface LineInfo {
    width: number;
    height: number;
    textHeight: number;
    text: string;
    y: number;
}
