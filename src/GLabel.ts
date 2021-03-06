import { GTextInput } from './GTextInput';
import { ByteBuffer } from './utils/ByteBuffer';
import { ObjectPropID } from './FieldTypes';
import { GButton } from './GButton';
import { GTextField } from './GTextField';
import { GObject } from './GObject';
import { GComponent } from "./GComponent";

export class GLabel extends GComponent {
    protected _titleObject: GObject;
    protected _iconObject: GObject;

    constructor(scene: Phaser.Scene, type) {
        super(scene, type);
    }

    public get icon(): string {
        if (this._iconObject)
            return this._iconObject.icon;
        else
            return null;
    }

    public set icon(value: string) {
        if (this._iconObject)
            this._iconObject.icon = value;
        this.updateGear(7);
    }

    public get title(): string {
        if (this._titleObject)
            return this._titleObject.text;
        else
            return null;
    }

    public set title(value: string) {
        if (this._titleObject)
            this._titleObject.text = value;
        this.updateGear(6);
    }

    public get text(): string {
        return this.title;
    }

    public set text(value: string) {
        this.title = value;
    }

    public get titleColor(): string {
        var tf: GTextField = this.getTextField();
        if (tf)
            return tf.color;
        else
            return "#000000";
    }

    public set titleColor(value: string) {
        var tf: GTextField = this.getTextField();
        if (tf)
            tf.color = value;
        this.updateGear(4);
    }

    public get titleFontSize(): number {
        var tf: GTextField = this.getTextField();
        if (tf)
            return tf.fontSize;
        else
            return 0;
    }

    public set titleFontSize(value: number) {
        var tf: GTextField = this.getTextField();
        if (tf)
            tf.fontSize = value;
    }

    public get color(): string {
        return this.titleColor;
    }

    public set color(value: string) {
        this.titleColor = value;
    }

    public set editable(val: boolean) {
        if (this._titleObject instanceof GTextInput)
            this._titleObject.editable = val;
    }

    public get editable(): boolean {
        if (this._titleObject instanceof GTextInput)
            return this._titleObject.editable;
        else
            return false;
    }

    public getTextField(): GTextField {
        if (this._titleObject instanceof GTextField)
            return this._titleObject;
        else if ((this._titleObject instanceof GLabel) || (this._titleObject instanceof GButton))
            return this._titleObject.getTextField();
        else
            return null;
    }

    public getProp(index: number): any {
        switch (index) {
            case ObjectPropID.Color:
                return this.titleColor;
            case ObjectPropID.OutlineColor:
                {
                    var tf: GTextField = this.getTextField();
                    if (tf)
                        return tf.strokeColor;
                    else
                        return 0;
                }
            case ObjectPropID.FontSize:
                return this.titleFontSize;
            default:
                return super.getProp(index);
        }
    }

    public setProp(index: number, value: any): void {
        switch (index) {
            case ObjectPropID.Color:
                this.titleColor = value;
                break;
            case ObjectPropID.OutlineColor:
                {
                    var tf: GTextField = this.getTextField();
                    if (tf)
                        tf.strokeColor = value;
                }
                break;
            case ObjectPropID.FontSize:
                this.titleFontSize = value;
                break;
            default:
                super.setProp(index, value);
                break;
        }
    }

    protected constructExtension(buffer: ByteBuffer): Promise<void> {
        return new Promise((resolve, reject) => {
            this._titleObject = this.getChild("title");
            this._iconObject = this.getChild("icon");
            resolve();
        });
    }

    public setup_afterAdd(buffer: ByteBuffer, beginPos: number): void {
        super.setup_afterAdd(buffer, beginPos);

        if (!buffer.seek(beginPos, 6))
            return;

        if (buffer.readByte() != this.packageItem.objectType)
            return;

        var str: string;
        str = buffer.readS();
        if (str != null)
            this.title = str;
        str = buffer.readS();
        if (str != null)
            this.icon = str;
        if (buffer.readBool())
            this.titleColor = buffer.readColorS();
        var iv: number = buffer.readInt();
        if (iv != 0)
            this.titleFontSize = iv;

        if (buffer.readBool()) {
            var input: GTextField = this.getTextField();
            if (input instanceof GTextInput) {
                str = buffer.readS();
                if (str != null)
                    input.placeholder = str;

                str = buffer.readS();
                if (str != null)
                    input.restrict = str;

                iv = buffer.readInt();
                if (iv != 0)
                    input.maxLength = iv;
                iv = buffer.readInt();
                if (iv != 0) {
                    // TODO
                    // if (iv == 4)
                    // input.keyboardType = Laya.Input.TYPE_NUMBER;
                    // else if (iv == 3)
                    // input.keyboardType = Laya.Input.TYPE_URL;
                }
                if (buffer.readBool())
                    input.password = true;
            }
            else
                buffer.skip(13);
        }
    }
}
