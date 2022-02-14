import { AutoSizeType } from './FieldTypes';
import { BitmapFont } from './display/BitmapFont';
import { GTextField } from './GTextField';
import { TextField } from './display/text/TextField';
import { ByteBuffer, GRoot, ToolSet, UIConfig, UIPackage } from '.';
import { HAlignModeString, VAlignModeString } from './display/text/Types';
export class GBasicTextField extends GTextField {
    protected _textField: TextField;

    private _textWidth: number = 0;
    private _textHeight: number = 0;

    private _bitmapFont?: BitmapFont;
    private _lines?: Array<LineInfo>;

    constructor(scene: Phaser.Scene, type: number) {
        super(scene, type);

        // this._textField.align = "left";
        // this._textField.font = fgui.UIConfig.defaultFont;
        this._autoSize = AutoSizeType.Both;
        this._widthAutoSize = this._heightAutoSize = true;
        // this._textField["_sizeDirty"] = false;
    }

    get adaptiveScaleX(): number {
        return this._adaptiveScaleX
    }

    get adaptiveScaleY(): number {
        return this._adaptiveScaleY
    }

    set adaptiveScaleX(val) {
        this._adaptiveScaleX = val;
        this.doAlign();
    }

    set adaptiveScaleY(val) {
        this._adaptiveScaleY = val;
        this.doAlign();
    }

    public createDisplayObject(): void {
        this._displayObject = this._textField = new TextField(this.scene);
        this._displayObject.mouseEnabled = false;
    }

    public setup_afterAdd(buffer: ByteBuffer, beginPos: number): void {
        super.setup_afterAdd(buffer, beginPos);

        if (this.parent && this._pivotAsAnchor && (this.parent.pivotX !== 0 || this.parent.pivotY !== 0)) {
            const targetScale = GRoot.contentDprLevel + 1;
            this.adaptiveScaleX = this.adaptiveScaleY = GRoot.contentDprLevel + 1;
            const ownerScale = this["_contentItem"] && this["_contentItem"].isHighRes ? 1 : GRoot.dpr;
            const _delayY = this.y - this.parent.initHeight * (this.parent.pivotY);
            const _tmpX = this.pivotX === 0 ? this.x : this.pivotX * this._textWidth * targetScale / this.adaptiveScaleX - this.parent.pivotX * this.parent.initWidth * ownerScale / this.parent.adaptiveScaleX;
            // const _tmpY = this.pivotY === 0 ? this.y : this.pivotY * this.initHeight * targetScale / this.adaptiveScaleY - this.parent.pivotY * this.parent.initHeight * ownerScale / this.parent.adaptiveScaleY;
            this._setXY(_tmpX + this._textWidth, _delayY);
        }
        // 对文本进行适配
        // this.setResolution(GRoot.contentDprLevel + 1);
    }

    public setResolution(val) {
        this.adaptiveScaleX = this.adaptiveScaleY = val;
        this._textField.setResolution(val);
    }

    public get nativeText(): TextField {
        return this._textField;
    }

    public set text(value: string) {
        this._text = value;
        if (this._text == null)
            this._text = "";

        if (this._bitmapFont == null) {
            if (this._widthAutoSize)
                this._textField.width = 10000;
            var text2: string = this._text;
            // if (this._templateVars)
            // text2 = this.parseTemplate(text2);
            // if (this._ubbEnabled) //laya还不支持同一个文本不同样式
            //     this._textField.text = UBBParser.inst.parse(text2, true);
            // else
            this._textField.text = text2;
        }
        else {
            this._textField.text = "";
            this._textField["setChanged"]();
        }

        if (this.parent && this.parent._underConstruct) {
            // this._textField.typeset();
            this.updateSize();
            this.doAlign();
        }
    }

    public get text(): string {
        return this._text;
    }

    public get font(): string {
        return this._textField.style.fontFamily;
    }

    public set font(value: string) {
        this._font = value;
        if (this._font) {
            this._textField.setFont(this._font);
        } else {
            this._textField.setFont(UIConfig.defaultFont)
        }
    }

    public get fontSize(): number {
        const fontSize = this._textField.style.fontSize;
        if (typeof fontSize === "number") {
            return fontSize;
        }
        return parseInt(fontSize);
    }

    public set fontSize(value: number) {
        this._textField.setFontSize(value);
    }

    public get color(): string {
        return this._color;
    }

    public set color(value: string) {
        if (this._color != value) {
            this._color = value;
            this.updateGear(4);

            if (this.grayed)
                this._textField.setColor("#AAAAAA");
            else
                this._textField.setColor(this._color);
        }
    }

    public get align(): HAlignModeString {
        return this._align;
    }

    public set align(value: HAlignModeString) {
        this._align = value;
        this._textField.setAlign(this._align);
        this.doAlign();
    }

    public get valign(): VAlignModeString {
        return this._valign;
    }

    public set valign(value: VAlignModeString) {
        this._valign = value;
        this._textField.setVAlign(this._valign);
        this.doAlign();
    }

    public get leading(): number {
        return this._textField.style.lineSpacing;
    }

    public set leading(value: number) {
        this._textField.setLineSpacing(value);
        // this._textField.leading = value;
    }

    public get letterSpacing(): number {
        return this._letterSpace;
    }

    public set letterSpacing(value: number) {
        this._letterSpace = value;
        this._textField.setLetterSpacing(value);
    }

    public get bold(): boolean {
        return this._textField.style.bold;
    }

    public set bold(value: boolean) {
        this._textField.setBold(value);
    }

    public get italic(): boolean {
        return this._textField.style.italic;
    }

    public set italic(value: boolean) {
        this._textField.setItalic(value);
    }

    public get underline(): boolean {
        return false;
    }

    public set underline(value: boolean) {
        this._textField.setUnderline(value ? 2 : 0);
    }

    public get singleLine(): boolean {
        return this._singleLine;
    }

    public set singleLine(value: boolean) {
        this._singleLine = value;
        if (!this._widthAutoSize && !this._singleLine) {
            // 设置换行宽度，是否忽略空格
            this._textField.setWordWrapWidth(this.initWidth, true);
        } else {
            this._textField.setSingleLine(true);
        }
    }

    public get stroke(): number {
        return this._textField.style.strokeThickness;
    }

    public set stroke(value: number) {
        this._textField.setStroke(this._strokeColor, value);
    }

    public get strokeColor(): string {
        return this._strokeColor;
    }

    public set strokeColor(value: string) {
        if (this._strokeColor != value) {
            this._strokeColor = value;
            this._textField.setStroke(this._strokeColor, this.stroke);
            this.updateGear(4);
        }
    }

    public setStroke(color: string, thickness: number) {
        if (this._strokeColor !== color || this._stroke !== thickness) {
            this._strokeColor = color;
            this._stroke = thickness;
            this._textField.setStroke(color, thickness);
        }
    }

    public setShadowStyle(color: string) {
        this._textField.setShadowStyle(color);
    }

    public setShadowOffset(x: number, y: number) {
        this._textField.setShadowOffset(x, y);
    }

    protected updateAutoSize(): void {
        if (!this._underConstruct) {
            if (!this._heightAutoSize)
                this._textField.setSize(this.width, this.height);
            else if (!this._widthAutoSize)
                this._textField.width = this.width;
        }
    }

    public get textWidth(): number {
        return this._textWidth;
    }

    public ensureSizeCorrect(): void {
        // if (!this._underConstruct && this._textField["_isChanged"])
        // this._textField.typeset();
    }

    public typeset(): void {
        if (this._bitmapFont)
            this.renderWithBitmapFont();
        else if (this._widthAutoSize || this._heightAutoSize)
            this.updateSize();
    }

    protected updateSize(): void {
        this._textWidth = Math.ceil(this._textField.displayWidth);
        this._textHeight = Math.ceil(this._textField.displayHeight);

        var w: number, h: number = 0;
        if (this._widthAutoSize) {
            w = this._textWidth;
            if (this._textField.displayWidth != w) {
                this._textField.displayWidth = w;
            }
        }
        else
            w = this.width;

        if (this._heightAutoSize) {
            h = this._textHeight;
            if (!this._widthAutoSize) {
                if (this._textField.displayHeight != this._textHeight)
                    this._textField.displayHeight = this._textHeight;
            }
        }
        else {
            h = this.height;
            if (this._textHeight > h)
                this._textHeight = h;
            if (this._textField.displayHeight != this._textHeight)
                this._textField.displayHeight = this._textHeight;
        }

        this._updatingSize = true;
        this.setSize(w, h);
        this._updatingSize = false;
    }

    public setSize(w, h) {
        super.setSize(w, h);
    }

    public dispose(): void {
        if (this._textField) {
            this._textField.preDestroy();
            this._textField = null;
        }
        super.dispose();
    }

    private renderWithBitmapFont(): void {

        // var gr: Phaser.GameObjects.Graphics = this._displayObject.graphics;
        // gr.clear();

        // if (!this._lines)
        //     this._lines = new Array<LineInfo>();
        // else
        //     returnList(this._lines);

        // var lineSpacing: number = this.leading - 1;
        // var rectWidth: number = this.width - GUTTER_X * 2;
        // var lineWidth: number = 0, lineHeight: number = 0, lineTextHeight: number = 0;
        // var glyphWidth: number = 0, glyphHeight: number = 0;
        // var wordChars: number = 0, wordStart: number = 0, wordEnd: number = 0;
        // var lastLineHeight: number = 0;
        // var lineBuffer: string = "";
        // var lineY: number = GUTTER_Y;
        // var line: LineInfo;
        // var wordWrap: boolean = true; // ===========!this._widthAutoSize && !this._singleLine;
        // var fontSize: number = this.fontSize;
        // var fontScale: number = this._bitmapFont.resizable ? fontSize / this._bitmapFont.size : 1;
        // this._textWidth = 0;
        // this._textHeight = 0;

        // var text2: string = this._text;
        // if (this._templateVars)
        //     text2 = this.parseTemplate(text2);
        // var textLength: number = text2.length;
        // for (var offset: number = 0; offset < textLength; ++offset) {
        //     var ch: string = text2.charAt(offset);
        //     var cc: number = ch.charCodeAt(0);

        //     if (cc == 10) {
        //         lineBuffer += ch;
        //         line = borrow();
        //         line.width = lineWidth;
        //         if (lineTextHeight == 0) {
        //             if (lastLineHeight == 0)
        //                 lastLineHeight = fontSize;
        //             if (lineHeight == 0)
        //                 lineHeight = lastLineHeight;
        //             lineTextHeight = lineHeight;
        //         }
        //         line.height = lineHeight;
        //         lastLineHeight = lineHeight;
        //         line.textHeight = lineTextHeight;
        //         line.text = lineBuffer;
        //         line.y = lineY;
        //         lineY += (line.height + lineSpacing);
        //         if (line.width > this._textWidth)
        //             this._textWidth = line.width;
        //         this._lines.push(line);

        //         lineBuffer = "";
        //         lineWidth = 0;
        //         lineHeight = 0;
        //         lineTextHeight = 0;
        //         wordChars = 0;
        //         wordStart = 0;
        //         wordEnd = 0;
        //         continue;
        //     }

        //     if (cc >= 65 && cc <= 90 || cc >= 97 && cc <= 122) //a-z,A-Z
        //     {
        //         if (wordChars == 0)
        //             wordStart = lineWidth;
        //         wordChars++;
        //     }
        //     else {
        //         if (wordChars > 0)
        //             wordEnd = lineWidth;
        //         wordChars = 0;
        //     }

        //     if (cc == 32) {
        //         glyphWidth = Math.ceil(fontSize / 2);
        //         glyphHeight = fontSize;
        //     }
        //     else {
        //         var glyph: BMGlyph = this._bitmapFont.glyphs[ch];
        //         if (glyph) {
        //             glyphWidth = Math.ceil(glyph.advance * fontScale);
        //             glyphHeight = Math.ceil(glyph.lineHeight * fontScale);
        //         }
        //         else {
        //             glyphWidth = 0;
        //             glyphHeight = 0;
        //         }
        //     }
        //     if (glyphHeight > lineTextHeight)
        //         lineTextHeight = glyphHeight;

        //     if (glyphHeight > lineHeight)
        //         lineHeight = glyphHeight;

        //     if (lineWidth != 0)
        //         lineWidth += this._letterSpacing;
        //     lineWidth += glyphWidth;

        //     if (!wordWrap || lineWidth <= rectWidth) {
        //         lineBuffer += ch;
        //     }
        //     else {
        //         line = borrow();
        //         line.height = lineHeight;
        //         line.textHeight = lineTextHeight;

        //         if (lineBuffer.length == 0) {//the line cannt fit even a char
        //             line.text = ch;
        //         }
        //         else if (wordChars > 0 && wordEnd > 0) {//if word had broken, move it to new line
        //             lineBuffer += ch;
        //             var len: number = lineBuffer.length - wordChars;
        //             line.text = ToolSet.trimRight(lineBuffer.substr(0, len));
        //             line.width = wordEnd;
        //             lineBuffer = lineBuffer.substr(len);
        //             lineWidth -= wordStart;
        //         }
        //         else {
        //             line.text = lineBuffer;
        //             line.width = lineWidth - (glyphWidth + this._letterSpacing);
        //             lineBuffer = ch;
        //             lineWidth = glyphWidth;
        //             lineHeight = glyphHeight;
        //             lineTextHeight = glyphHeight;
        //         }
        //         line.y = lineY;
        //         lineY += (line.height + lineSpacing);
        //         if (line.width > this._textWidth)
        //             this._textWidth = line.width;

        //         wordChars = 0;
        //         wordStart = 0;
        //         wordEnd = 0;
        //         this._lines.push(line);
        //     }
        // }

        // if (lineBuffer.length > 0) {
        //     line = borrow();
        //     line.width = lineWidth;
        //     if (lineHeight == 0)
        //         lineHeight = lastLineHeight;
        //     if (lineTextHeight == 0)
        //         lineTextHeight = lineHeight;
        //     line.height = lineHeight;
        //     line.textHeight = lineTextHeight;
        //     line.text = lineBuffer;
        //     line.y = lineY;
        //     if (line.width > this._textWidth)
        //         this._textWidth = line.width;
        //     this._lines.push(line);
        // }

        // if (this._textWidth > 0)
        //     this._textWidth += GUTTER_X * 2;

        // var count: number = this._lines.length;
        // if (count == 0) {
        //     this._textHeight = 0;
        // }
        // else {
        //     line = this._lines[this._lines.length - 1];
        //     this._textHeight = line.y + line.height + GUTTER_Y;
        // }

        // var w: number, h: number = 0;
        // if (this._widthAutoSize) {
        //     if (this._textWidth == 0)
        //         w = 0;
        //     else
        //         w = this._textWidth;
        // }
        // else
        //     w = this.width;

        // if (this._heightAutoSize) {
        //     if (this._textHeight == 0)
        //         h = 0;
        //     else
        //         h = this._textHeight;
        // }
        // else
        //     h = this.height;

        // this._updatingSize = true;
        // this.setSize(w, h);
        // this._updatingSize = false;

        // this.doAlign();

        // if (w == 0 || h == 0)
        //     return;

        // var charX: number = GUTTER_X;
        // var lineIndent: number = 0;
        // var charIndent: number = 0;
        // rectWidth = this.width - GUTTER_X * 2;
        // var lineCount: number = this._lines.length;
        // var color: string = this._bitmapFont.tint ? this._color : null;
        // for (var i: number = 0; i < lineCount; i++) {
        //     line = this._lines[i];
        //     charX = GUTTER_X;

        //     if (this.align == "center")
        //         lineIndent = (rectWidth - line.width) / 2;
        //     else if (this.align == "right")
        //         lineIndent = rectWidth - line.width;
        //     else
        //         lineIndent = 0;
        //     textLength = line.text.length;
        //     for (var j: number = 0; j < textLength; j++) {
        //         ch = line.text.charAt(j);
        //         cc = ch.charCodeAt(0);

        //         if (cc == 10)
        //             continue;

        //         if (cc == 32) {
        //             charX += this._letterSpacing + Math.ceil(fontSize / 2);
        //             continue;
        //         }

        //         glyph = this._bitmapFont.glyphs[ch];
        //         if (glyph) {
        //             charIndent = (line.height + line.textHeight) / 2 - Math.ceil(glyph.lineHeight * fontScale);
        //             if (glyph.texture) {
        //                 gr.drawTexture(glyph.texture,
        //                     charX + lineIndent + Math.ceil(glyph.x * fontScale),
        //                     line.y + charIndent + Math.ceil(glyph.y * fontScale),
        //                     glyph.width * fontScale,
        //                     glyph.height * fontScale, null, 1, color);
        //             }
        //             charX += this._letterSpacing + Math.ceil(glyph.advance * fontScale);
        //         }
        //         else {
        //             charX += this._letterSpacing;
        //         }
        //     }//this.text loop
        // }//line loop
    }

    protected handleGrayedChanged(): void {
        super.handleGrayedChanged();

        // if (this.grayed)
        //     this._textField.color = "#AAAAAA";
        // else
        //     this._textField.color = this._color;
    }

    protected doAlign(): void {
        // 横向
        if (this.align === "left" || this._textWidth === 0) {
            this._xOffset = GUTTER_X;
        } else {
            let dx: number = this.width - this._textWidth;
            if (dx < 0) dx = 0;
            if (this.align === "center") {
                this._xOffset = Math.floor(dx / 2);
            } else {
                this._xOffset = Math.floor(dx);
            }
        }
        // 纵向
        if (this.valign == "top" || this._textHeight == 0) {
            this._yOffset = GUTTER_Y;
        }
        else {
            var dh: number = this.height - this._textHeight;
            if (dh < 0)
                dh = 0;
            if (this.valign == "center")
                this._yOffset = Math.floor(dh / 2);
            else
                this._yOffset = Math.floor(dh);
        }
        this.handleXYChanged();
    }

    public setXY(xv: number, yv: number, force: boolean = false): void {
        super.setXY(xv, yv);
    }

    public flushVars(): void {
        this.text = this._text;
    }
}

export interface LineInfo {
    width: number;
    height: number;
    textHeight: number;
    text: string;
    y: number;
}

const GUTTER_X: number = 2;
const GUTTER_Y: number = 2;
