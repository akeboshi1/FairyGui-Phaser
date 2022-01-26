import { TextField } from "../TextField";
import { FillStyleType, HAlignModeString, VAlignModeString } from "../Types";
export interface ITextStyle {
    fontFamily?: string;
    fontSize?: string;
    fontStyle?: string;
    font?: string;
    backgroundColor?: string;
    color?: string;
    stroke?: string;
    strokeThickness?: number;
    shadow?: Phaser.Types.GameObjects.Text.TextShadow;
    padding?: Phaser.Types.GameObjects.Text.TextPadding;
    align?: string;
    maxLines?: number;
    testString?: string;
    baselineX?: number;
    baselineY?: number;
    wordWrap?: Phaser.Types.GameObjects.Text.TextWordWrap;
    italic?: boolean;
    bold?: boolean;
    fillStyle?: FillStyleType;
    strokeStyle?: FillStyleType;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    shadowColor?: string;
    shadowBlur?: number;
    shadowStroke?: boolean;
    shadowFill?: boolean;
    underlineColor?: FillStyleType;
    underlineThickness?: number;
    underlineOffsetY?: number;
    rtl?: boolean;
    halign?: HAlignModeString;
    valign?: VAlignModeString;
    fixedWidth?: number;
    fixedHeight?: number;
    resolution?: number;
    lineSpacing?: number;
    letterSpacing?: number;
    wrapMode?: number;
    wrapWidth?: number;
    image?: any;
    metrics?: any;
    antialias?: boolean;
}
export declare class TextStyle implements ITextStyle {
    fontFamily?: string;
    fontSize?: string;
    fontStyle?: string;
    backgroundColor?: string;
    color?: string;
    stroke?: string;
    shadow?: Phaser.Types.GameObjects.Text.TextShadow;
    padding?: Phaser.Types.GameObjects.Text.TextPadding;
    align?: string;
    maxLines?: number;
    testString?: string;
    baselineX?: number;
    baselineY?: number;
    wordWrap?: Phaser.Types.GameObjects.Text.TextWordWrap;
    bold: boolean;
    italic: boolean;
    fillStyle?: FillStyleType;
    strokeStyle?: FillStyleType;
    strokeThickness?: number;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    shadowColor?: string;
    shadowBlur?: number;
    shadowStroke?: boolean;
    shadowFill?: boolean;
    underlineColor?: FillStyleType;
    underlineThickness?: number;
    underlineOffsetY?: number;
    halign?: HAlignModeString;
    valign?: VAlignModeString;
    fixedWidth?: number;
    fixedHeight?: number;
    resolution?: number;
    lineSpacing?: number;
    letterSpacing?: number;
    rtl?: boolean;
    private _wrapMode?;
    private _wrapWidth?;
    antialias?: boolean;
    protected _font: string;
    parent: TextField;
    private _metrics;
    constructor(text: TextField, style: ITextStyle);
    get font(): string;
    get wrapMode(): number;
    set wrapMode(val: number);
    get wrapWidth(): number;
    set wrapWidth(val: number);
    syncFont(canvas: any, context: any): void;
    setStyle(style: ITextStyle, updateText?: boolean, setDefaults?: boolean): TextField;
    update(recalculateMetrics: boolean): TextField;
    buildFont(): this;
    setFont(font: any, updateText: any): TextField;
    setFontFamily(family: string): TextField;
    setFontStyle(style: string): TextField;
    setFontSize(size: string | number): TextField;
    setFixedSize(width: number, height: number): TextField;
    setFill(color: string): void;
    setLineSpacing(value: number): void;
    setStroke(style: FillStyleType, thickness: number): TextField;
    setUnderLine(thickness?: number, style?: FillStyleType, offsetY?: number): TextField;
    setShadowStyle(color: string): TextField;
    setShadowOffset(x: number, y: number): TextField;
    setSingleLine(value: boolean): void;
    get canvas(): HTMLCanvasElement;
    get context(): CanvasRenderingContext2D;
    get isWrapFitMode(): boolean;
    get lineHeight(): any;
    get metrics(): any;
}
