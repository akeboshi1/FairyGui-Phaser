import { GearBase } from './gears/GearBase';
import { GearDisplay2 } from './gears/GearDisplay2';
import { GearDisplay } from './gears/GearDisplay';
import { Controller } from './Controller';
import { UIConfig } from './UIConfig';
import { ByteBuffer } from './utils/ByteBuffer';
import { ToolSet } from './utils/ToolSet';
import { RelationType, ObjectPropID, ObjectType } from './FieldTypes';
import { Events } from './Events';
import { GTreeNode } from './GTreeNode';
import { GGroup } from './GGroup';
import { Relations } from './Relations';
import { PackageItem } from './PackageItem';
import { GComponent, ScreenType } from './GComponent';
import { DisplayObjectEvent, InteractiveEvent } from './event/DisplayObjectEvent';
import { GTree } from './GTree';
import { GearAnimation, GearColor, GearFontSize, GearIcon, GearLook, GearSize, GearText, GearXY } from './gears';
import { GButton, GComboBox, GGraph, GImage, GList, GLoader, GMovieClip, GProgressBar, GRichTextField, GRoot, GSlider, GTextField, GTextInput, Image } from '.';
export class DisplayStyle {
    static EMPTY: DisplayStyle = new DisplayStyle();
    /**水平缩放 */
    scaleX: number = 1;
    /**垂直缩放 */
    scaleY: number = 1;
    /**水平倾斜角度 */
    skewX: number = 0;
    /**垂直倾斜角度 */
    skewY: number = 0;
    /**X轴心点 */
    pivotX: number = 0;
    /**Y轴心点 */
    pivotY: number = 0;
    /**旋转角度 */
    rotation: number = 0;
    /**透明度 */
    alpha: number = 1;
    /**滚动区域 */
    scrollRect: Phaser.Geom.Rectangle;
    /**视口 */
    viewport: Phaser.Geom.Rectangle;
    /**点击区域 */
    hitArea: any;
}
export class GObject {
    public data: Object;
    public packageItem: PackageItem;
    public static draggingObject: GObject;

    protected _x: number = 0;
    protected _y: number = 0;
    private _alpha: number = 1;
    private _basePosX: number = 0;
    private _basePosY: number = 0;
    private _rotation: number = 0;
    private _visible: boolean = true;
    // 可交互默认false
    protected _touchable: boolean = false;
    private _grayed: boolean;
    private _draggable?: boolean;
    protected _scaleX: number = 1;
    protected _scaleY: number = 1;
    protected _skewX: number = 0;
    protected _skewY: number = 0;
    protected _pivotX: number = 0;
    protected _pivotY: number = 0;
    protected _relationPivot: boolean = false;
    protected _pivotAsAnchor: boolean;
    protected _pivotOffsetX: number = 0;
    protected _pivotOffsetY: number = 0;
    protected _adaptiveScaleX: number = 1;
    protected _adaptiveScaleY: number = 1;
    private _sortingOrder: number = 0;
    private _internalVisible: boolean = true;
    private _handlingController?: boolean;
    private _tooltips?: string;
    protected _pixelSnapping?: boolean;

    protected _relations: Relations;
    protected _group?: GGroup;
    private _gears: GearBase[];
    private _dragBounds?: Phaser.Geom.Rectangle;
    private _dragTesting?: boolean;
    private _dragStartPos?: Phaser.Geom.Point;

    // 记录是否已经调整过对象适配时而调整的缩放比例
    private _extenalScaleBoo: boolean = false;


    protected _displayStyle: DisplayStyle;
    private _timeEvent: Phaser.Time.TimerEvent;

    protected _displayObject: any;
    protected _xOffset: number = 0;
    protected _yOffset: number = 0;
    protected _scene: Phaser.Scene;
    protected _worldMatrix: Phaser.GameObjects.Components.TransformMatrix;
    protected _worldTx: number = 0;
    protected _worldTy: number = 0;
    protected _dprOffset: number = 1;

    public minWidth: number = 0;
    public minHeight: number = 0;
    public maxWidth: number = 0;
    public maxHeight: number = 0;
    public sourceWidth: number = 0;
    public sourceHeight: number = 0;
    public initWidth: number = 0;
    public initHeight: number = 0;

    public _parent: GComponent;
    public _width: number = 0;
    public _height: number = 0;
    public _rawWidth: number = 0;
    public _rawHeight: number = 0;
    public _id: string;
    public _name: string;
    public _underConstruct: boolean;
    public _gearLocked?: boolean;
    public _sizePercentInGroup: number = 0;
    public _treeNode?: GTreeNode;

    protected _objectType: number = 0;

    constructor(scene: Phaser.Scene, type: number) {
        this._id = "" + _gInstanceCounter++;
        this.type = type;
        this._name = "";
        this._dprOffset = GRoot.dpr * GRoot.uiScale;
        // todo 优先传入scene在创建display
        this.scene = scene;
        if (this.scene) this.createDisplayObject();
        this._displayStyle = new DisplayStyle();

        this._relations = new Relations(this);
        this._gears = new Array<GearBase>(10);
    }

    get basePosX(): number {
        return this._basePosX;
    }

    get basePosY(): number {
        return this._basePosY;
    }

    get extenalScaleBoo(): boolean {
        return this._extenalScaleBoo;
    }

    set exteanalScaleBoo(val: boolean) {
        this._extenalScaleBoo = val;
    }

    get adaptiveScaleX(): number {
        this._adaptiveScaleX = this.initWidth / this.sourceWidth;
        return this._adaptiveScaleX;
    }

    set adaptiveScaleX(val) {
        this._adaptiveScaleX = val;
    }

    get adaptiveScaleY(): number {
        this._adaptiveScaleY = this.initHeight / this.sourceHeight;
        return this._adaptiveScaleY;
    }

    set adaptiveScaleY(val) {
        this._adaptiveScaleY = val;
    }

    public resizeMask(wid: number, hei: number) {
        if (!this.displayObject) return;
        const childrens = (<Phaser.GameObjects.Container>this.displayObject).list;
        const cnt = childrens.length;
        for (let i: number = 0; i < cnt; i++) {
            const child = childrens[i];
            if (!child) continue;
            if (child instanceof Image) {
                this._resizeMask(child, wid, hei);
                continue;
            }
            let childList = (<any>child).list;
            if (!childList) {
                continue;
            }
            let childLen: number = childList.length;
            // 进度条的bar只做两层层级！！！
            for (let j: number = 0; j < childLen; j++) {
                const children = childList[j];
                if (!children) continue;
                if (children instanceof Image) {
                    if (!(<Image>children).curImage) continue;
                    this._resizeMask(children, wid, hei)
                    continue;
                }
            }
            // }
        }
    }

    private _resizeMask(children: Phaser.GameObjects.GameObject, wid: number, hei: number): Phaser.GameObjects.GameObject {
        if (children instanceof Image) {
            if (!(<Image>children).curImage) return children;
            // 建议不要用九宫做拉伸，性能存在问题
            if (!children.scale9Grid) {
                (<Image>children).curImage.setCrop(new Phaser.Geom.Rectangle(0, 0, wid, hei));
            } else {
                (<Image>children).setSize(wid, hei);
            }
            return children;
        }
        return children;
    }

    public get relationPivot(): boolean {
        return this._relationPivot;
    }

    public set relationPivot(val: boolean) {
        this._relationPivot = val;
    }

    public set type(val) {
        this._objectType = val;
    }

    public get type(): number {
        return this._objectType;
    }

    public get id(): string {
        return this._id;
    }

    public set id(value: string) {
        this._id = value;
    }

    public get name(): string {
        return this._name;
    }

    public set name(value: string) {
        this._name = value;
    }

    public get x(): number {
        return this._x;
    }

    public set x(value: number) {
        this.setXY(value, this._y);
    }

    public get y(): number {
        return this._y;
    }

    public set y(value: number) {
        this.setXY(this._x, value);
    }

    public get scene(): Phaser.Scene {
        return this._scene;
    }
    public set scene(value: Phaser.Scene) {
        this._scene = value;
    }

    public get pivotOffsetX(): number {
        return this._pivotOffsetX;
    }

    public get pivotOffsetY(): number {
        return this._pivotOffsetY;
    }

    public get worldMatrix(): Phaser.GameObjects.Components.TransformMatrix {
        if (!this._worldMatrix) {
            this._worldMatrix = (<Phaser.GameObjects.Container>this.displayObject).getWorldTransformMatrix();
            this._worldTx = this._worldMatrix.tx - this._x;
            this._worldTy = this._worldMatrix.ty - this._y;
        }
        return this._worldMatrix;
    }

    public get timeEvent(): Phaser.Time.TimerEvent {
        return this._timeEvent;
    }
    public set timeEvent(value: Phaser.Time.TimerEvent) {
        this._timeEvent = value;
    }

    public setXY(xv: number, yv: number, force: boolean = false, noEmitter: boolean = false): void {
        if (this._x != xv || this._y != yv || force) {
            var dx: number = xv - this._x;
            var dy: number = yv - this._y;
            this._x = xv;
            this._y = yv;

            this.handleXYChanged();
            if (this instanceof GGroup)
                this.moveChildren(dx, dy);

            this.updateGear(1);

            // if (this._parent && !(this._parent instanceof GList)) {
            if (this._parent) {
                this._parent.setBoundsChangedFlag();
                if (this._group)
                    this._group.setBoundsChangedFlag(true);
                if (!noEmitter) this.displayObject.emit(DisplayObjectEvent.XY_CHANGED);
            }

            if (GObject.draggingObject == this && !sUpdateInDragging)
                this.localToGlobalRect(0, 0, this._width, this._height, sGlobalRect);
        }
    }

    public get xMin(): number {
        return this._pivotAsAnchor ? (this._x - this._width * this._pivotX) : this._x;
    }

    public set xMin(value: number) {
        if (this._pivotAsAnchor)
            this.setXY(value + this._width * this._pivotX, this._y);
        else
            this.setXY(value, this._y);
    }

    public get yMin(): number {
        return this._pivotAsAnchor ? (this._y - this._height * this._pivotY) : this._y;
    }

    public set yMin(value: number) {
        if (this._pivotAsAnchor)
            this.setXY(this._x, value + this._height * this._pivotY);
        else
            this.setXY(this._x, value);
    }

    public get pixelSnapping(): boolean {
        return this._pixelSnapping;
    }

    public set pixelSnapping(value: boolean) {
        if (this._pixelSnapping != value) {
            this._pixelSnapping = value;
            this.handleXYChanged();
        }
    }

    public center(restraint?: boolean): void {
        let r: GComponent;
        let parentWid: number = 0;
        let parentHei: number = 0;
        if (this._parent) {
            r = this.parent;
            if (this.parent instanceof GRoot) {
                parentWid = (<GRoot>r).stageWidth;
                parentHei = (<GRoot>r).stageHeight;
            } else {
                parentWid = r.width;
                parentHei = r.height;
            }
        }
        else {
            r = this.root;
            parentWid = (<GRoot>r).stageWidth;
            parentHei = (<GRoot>r).stageHeight;
        }

        this.setXY((parentWid - this._width) / 2, (parentHei - this._height) / 2);
        if (restraint) {
            this.addRelation(r, RelationType.Center_Center);
            this.addRelation(r, RelationType.Middle_Middle);
        }
    }

    public get width(): number {
        this.ensureSizeCorrect();
        if (this._relations.sizeDirty)
            this._relations.ensureRelationsSizeCorrect();
        return this._width;
    }

    public set width(value: number) {
        this.setSize(value, this._rawHeight);
    }

    public get height(): number {
        this.ensureSizeCorrect();
        if (this._relations.sizeDirty)
            this._relations.ensureRelationsSizeCorrect();
        return this._height;
    }

    public set height(value: number) {
        this.setSize(this._rawWidth, value);
    }


    public setSize(wv: number, hv: number, ignorePivot?: boolean): void {
        if (this._rawWidth !== wv || this._rawHeight !== hv) {
            this._rawWidth = wv;
            this._rawHeight = hv;
            if (wv < this.minWidth)
                wv = this.minWidth;
            if (hv < this.minHeight)
                hv = this.minHeight;
            if (this.maxWidth > 0 && wv > this.maxWidth)
                wv = this.maxWidth;
            if (this.maxHeight > 0 && hv > this.maxHeight)
                hv = this.maxHeight;
            var dWidth: number = wv - this._width;
            var dHeight: number = hv - this._height;
            this._width = wv;
            this._height = hv;

            this.handleSizeChanged();
            if (this._pivotX != 0 || this._pivotY != 0) {
                if (!this._pivotAsAnchor) {
                    if (!ignorePivot)
                        this.setXY(this.x - this._pivotX * dWidth, this.y - this._pivotY * dHeight);
                    this.updatePivotOffset();
                }
                else {
                    this.applyPivot();
                }
            }

            if (this instanceof GGroup)
                this.resizeChildren(dWidth, dHeight);

            this.updateGear(2);

            this.displayObject.emit(DisplayObjectEvent.SIZE_CHANGED);
        }
    }

    public ensureSizeCorrect(): void {
    }

    public makeFullScreen(): void {
        this.setSize(GRoot.inst.stageWidth, GRoot.inst.stageHeight);
    }

    public get actualWidth(): number {
        return this.width * Math.abs(this._scaleX);
    }

    public get actualHeight(): number {
        return this.height * Math.abs(this._scaleY);
    }

    public get scaleX(): number {
        return this._scaleX;
    }

    public set scaleX(value: number) {
        this.setScale(value, this._scaleY);
    }

    public get scaleY(): number {
        return this._scaleY;
    }

    public set scaleY(value: number) {
        this.setScale(this._scaleX, value);
    }

    public setScale(sx: number, sy: number, force: boolean = false): void {
        if (this._scaleX != sx || this._scaleY != sy || force) {
            this._scaleX = sx;
            this._scaleY = sy;
            this.handleScaleChanged();
            this.applyPivot();

            this.updateGear(2);
        }
    }
    public setExtenralScale(sx: number, sy: number, screenType: ScreenType, force: boolean = false): void {
    }

    public get skewX(): number {
        return this._skewX;
    }

    public set skewX(value: number) {
        this.setSkew(value, this._skewY);
    }

    public get skewY(): number {
        return this._skewY;
    }

    public set skewY(value: number) {
        this.setSkew(this._skewX, value);
    }

    public setSkew(sx: number, sy: number): void {
        if (this._skewX != sx || this._skewY != sy) {
            this._skewX = sx;
            this._skewY = sy;
            if (this._displayObject) {
                this._displayStyle.skewX = (-sx * Math.PI) / 180;
                this._displayStyle.skewY = (sy * Math.PI) / 180;
                this._displayObject.skewX = this._displayStyle.skewX;
                this._displayObject.skewY = this._displayStyle.skewY;
                this.applyPivot();
            }
        }
    }

    public get pivotX(): number {
        return this._pivotX;
    }

    public set pivotX(value: number) {
        this.setPivot(value, this._pivotY);
    }

    public get pivotY(): number {
        return this._pivotY;
    }

    public set pivotY(value: number) {
        this.setPivot(this._pivotX, value);
    }

    public setPivot(xv: number, yv: number = 0, asAnchor?: boolean): void {
        if (this._pivotX != xv || this._pivotY != yv || this._pivotAsAnchor != asAnchor) {
            this._pivotX = xv;
            this._pivotY = yv;
            this._pivotAsAnchor = asAnchor;

            this.updatePivotOffset();
            this.handleXYChanged();
        }
    }

    public get pivotAsAnchor(): boolean {
        return this._pivotAsAnchor;
    }

    protected internalSetPivot(xv: number, yv: number, asAnchor: boolean): void {
        this._pivotX = xv;
        this._pivotY = yv;
        this._pivotAsAnchor = asAnchor;
        if (this._pivotAsAnchor)
            this.handleXYChanged();
    }

    protected updatePivotOffset(): void {
        if (this._displayObject) {
            const transform = this._displayObject.getLocalTransformMatrix();
            if (transform && (this._pivotX != 0 || this._pivotY != 0)) {
                sHelperPoint.x = this._pivotX * this.initWidth;
                sHelperPoint.y = this._pivotY * this.initHeight;
                const pt: Phaser.Geom.Point = new Phaser.Geom.Point();
                (<Phaser.Geom.Point>transform.transformPoint(this._pivotX * this.initWidth,
                    this._pivotY * this.initHeight, pt));
                this._pivotOffsetX = this.x - pt.x;
                this._pivotOffsetY = this.y - pt.y;
            }
            else {
                this._pivotOffsetX = 0;
                this._pivotOffsetY = 0;
            }
        }

        // if (this._displayObject) {
        //     const transform = this._displayObject.getLocalTransformMatrix();
        //     if (transform && (this._pivotX != 0 || this._pivotY != 0)) {
        //         sHelperPoint.x = this._pivotX * this._width;
        //         sHelperPoint.y = this._pivotY * this._height;
        //         const pt: Phaser.Geom.Point = new Phaser.Geom.Point();
        //         (<Phaser.Geom.Point>transform.transformPoint(this._pivotX * this.initWidth,
        //             this._pivotY * this.initHeight, pt));
        //         this._pivotOffsetX = this._pivotX * this._width - pt.x;
        //         this._pivotOffsetY = this._pivotY * this._height - pt.y;
        //     }
        //     else {
        //         this._pivotOffsetX = 0;
        //         this._pivotOffsetY = 0;
        //     }
        // }
    }

    protected applyPivot(): void {
        if (this._pivotX != 0 || this._pivotY != 0) {
            // if (this._displayObject) {
            //     if (this._touchable) {
            //         this.removeInteractive();
            //         this._displayObject.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.initWidth, this.initHeight), Phaser.Geom.Rectangle.Contains);
            //     } else {
            //         this.removeInteractive();
            //     }
            // }
            this.updatePivotOffset();
            this.handleXYChanged();
        }
    }

    public get touchable(): boolean {
        return this._touchable;
    }

    public set touchable(value: boolean) {
        if (this._touchable != value) {
            this.setTouchable(value);
        }
    }

    public setTouchable(value: boolean) {
        this._touchable = value;
        this.updateGear(3);

        // if ((this instanceof GImage) || (this instanceof GMovieClip)
        //     || (this instanceof GTextField) && !(this instanceof GTextInput) && !(this instanceof GRichTextField))
        //     //Touch is not supported by GImage/GMovieClip/GTextField
        //     return;
        this.changeInteractive();

        this.updatePivotOffset();
    }
    // private _g: Phaser.GameObjects.Graphics;
    public changeInteractive() {
        if (this._displayObject) {
            if (this._touchable) {
                const realWid = this.initWidth * this._dprOffset;
                const realHei = this.initHeight * this._dprOffset;
                const rect: Phaser.Geom.Rectangle = new Phaser.Geom.Rectangle((0.5 - this._pivotX) * realWid, (0.5 - this._pivotY) * realHei,
                    realWid, realHei);
                if (!this._displayObject.input) this._displayObject.setInteractive(rect, Phaser.Geom.Rectangle.Contains);
                else this._displayObject.input.hitArea = rect;

                // if (this._g) (<Phaser.GameObjects.Container>this._displayObject).remove(this._g);
                // else this._g = this.scene.make.graphics(undefined, false);
                // this._g.clear();
                // this._g.fillStyle(0x66cc00, 0.5);
                // this._g.fillRoundedRect(0, 0, rect.width, rect.height, 5);//0, 0, this._width * GRoot.dpr, this._height * GRoot.dpr);
                // this._displayObject.addAt(this._g, 0);
            }
        }
    }

    protected removeInteractive() {
        this._displayObject.disableInteractive();
    }

    public get grayed(): boolean {
        return this._grayed;
    }

    public set grayed(value: boolean) {
        if (this._grayed != value) {
            this._grayed = value;
            this.handleGrayedChanged();
            this.updateGear(3);
        }
    }

    public get enabled(): boolean {
        return !this._grayed && this._touchable;
    }

    public set enabled(value: boolean) {
        this.grayed = !value;
        this.touchable = value;
    }

    public get rotation(): number {
        return this._rotation;
    }

    public set rotation(value: number) {
        if (this._rotation != value) {
            this._rotation = value;
            if (this._displayObject) {
                // phaser 显示对象的rotation是弧度，angle则是角度
                this._displayObject.rotation = this.normalizeRotation * (Math.PI / 180);
                this.applyPivot();
            }
            this.updateGear(3);
        }
    }

    public get normalizeRotation(): number {
        var rot: number = this._rotation % 360;
        if (rot > 180)
            rot = rot - 360;
        else if (rot < -180)
            rot = 360 + rot;
        return rot;
    }

    public get alpha(): number {
        return this._alpha;
    }

    public set alpha(value: number) {
        if (this._alpha != value) {
            this._alpha = value;
            this.handleAlphaChanged();
            this.updateGear(3);
        }
    }

    public get visible(): boolean {
        return this._visible;
    }

    public set visible(value: boolean) {
        if (this._visible != value) {
            this._visible = value;
            this.handleVisibleChanged();
            if (this._parent)
                this._parent.setBoundsChangedFlag();
            if (this._group && this._group.excludeInvisibles)
                this._group.setBoundsChangedFlag();
        }
    }

    public get internalVisible(): boolean {
        return this._internalVisible && (!this._group || this._group.internalVisible);
    }

    public get internalVisible2(): boolean {
        return this._visible && (!this._group || this._group.internalVisible2);
    }

    public get internalVisible3(): boolean {
        return this._internalVisible && this._visible;
    }

    public get sortingOrder(): number {
        return this._sortingOrder;
    }

    public set sortingOrder(value: number) {
        if (value < 0)
            value = 0;
        if (this._sortingOrder != value) {
            var old: number = this._sortingOrder;
            this._sortingOrder = value;
            if (this._parent)
                this._parent.childSortingOrderChanged(this, old, this._sortingOrder);
        }
    }

    public get focused(): boolean {
        return this.root.focus == this;
    }

    public requestFocus(): void {
        this.root.focus = this;
    }

    public get tooltips(): string {
        return this._tooltips;
    }

    public set tooltips(value: string) {
        if (this._tooltips) {
            this._displayObject.off(InteractiveEvent.POINTER_OVER, this.__rollOver, this);
            this._displayObject.off(InteractiveEvent.POINTER_OUT, this.__rollOut, this);
        }

        this._tooltips = value;
        if (this._tooltips) {
            this._displayObject.on(InteractiveEvent.POINTER_OVER, this.__rollOver, this);
            this._displayObject.on(InteractiveEvent.POINTER_OUT, this.__rollOut, this);
        }
    }

    private __rollOver(evt: InteractiveEvent): void {
        // this._timeEvent = GRoot.inst.addTimeEvent(new Phaser.Time.TimerEvent({ delay: 100, callback: this.__doShowTooltips }));
        // Laya.timer.once(100, this, this.__doShowTooltips);
    }

    private __doShowTooltips(): void {
        // var r: GRoot = this.root;
        // if (r)
        // this.root.showTooltips(this._tooltips);
    }

    private __rollOut(evt: InteractiveEvent): void {
        // if (this._timeEvent) GRoot.inst.removeTimeEvent(this._timeEvent);
        // Laya.timer.clear(this, this.__doShowTooltips);
        // this.root.hideTooltips();
    }

    public get blendMode(): Phaser.BlendModes | string {
        return this._displayObject.blendMode;
    }

    public set blendMode(value: Phaser.BlendModes | string) {
        this._displayObject.blendMode = value;
    }

    public get filters(): any[] {
        return null;// this._displayObject.filters;
    }

    public set filters(value: any[]) {
        // this._displayObject.filters = value;
    }

    public get inContainer(): boolean {
        return this._displayObject != null && this._displayObject.parentContainer != null;
    }

    public get onStage(): boolean {
        return this._displayObject !== null && this.scene !== null;
    }

    public get resourceURL(): string {
        if (this.packageItem)
            return "ui://" + this.packageItem.owner.id + this.packageItem.id;
        else
            return null;
    }

    public set group(value: GGroup) {
        if (this._group != value) {
            if (this._group)
                this._group.setBoundsChangedFlag();
            this._group = value;
            if (this._group)
                this._group.setBoundsChangedFlag();
        }
    }

    public get group(): GGroup {
        return this._group;
    }

    public getGear(index: number): GearBase {
        var gear: GearBase = this._gears[index];
        if (!gear)
            this._gears[index] = gear = createGear(this, index);
        return gear;
    }

    protected updateGear(index: number): void {
        if (this._underConstruct || this._gearLocked)
            return;

        var gear: GearBase = this._gears[index];
        if (gear && gear.controller)
            gear.updateState();
    }

    public checkGearController(index: number, c: Controller): boolean {
        return this._gears[index] && this._gears[index].controller == c;
    }

    public updateGearFromRelations(index: number, dx: number, dy: number): void {
        if (this._gears[index])
            this._gears[index].updateFromRelations(dx, dy);
    }

    public addDisplayLock(): number {
        var gearDisplay: GearDisplay = <GearDisplay>(this._gears[0]);
        if (gearDisplay && gearDisplay.controller) {
            var ret: number = gearDisplay.addLock();
            this.checkGearDisplay();

            return ret;
        }
        else
            return 0;
    }

    public releaseDisplayLock(token: number): void {
        var gearDisplay: GearDisplay = <GearDisplay>(this._gears[0]);
        if (gearDisplay && gearDisplay.controller) {
            gearDisplay.releaseLock(token);
            this.checkGearDisplay();
        }
    }

    private checkGearDisplay(): void {
        if (this._handlingController)
            return;

        var connected: boolean = !this._gears[0] || (<GearDisplay>(this._gears[0])).connected;
        if (this._gears[8])
            connected = (<GearDisplay2>this._gears[8]).evaluate(connected);

        if (connected != this._internalVisible) {
            this._internalVisible = connected;
            if (this._parent) {
                this._parent.childStateChanged(this);
                if (this._group && this._group.excludeInvisibles)
                    this._group.setBoundsChangedFlag();
            }
        }
    }

    public get relations(): Relations {
        return this._relations;
    }

    public addRelation(target: GObject, relationType: number, usePercent?: boolean): void {
        this._relations.add(target, relationType, usePercent);
    }

    public removeRelation(target: GObject, relationType?: number): void {
        this._relations.remove(target, relationType);
    }

    public get displayObject(): Phaser.GameObjects.GameObject {
        return this._displayObject;
    }

    public get parent(): GComponent {
        return this._parent;
    }

    public set parent(val: GComponent) {
        this._parent = val;
    }

    public removeFromParent(): void {
        if (this._parent)
            this._parent.removeChild(this);
    }

    public get root() {
        if (this instanceof GRoot)
            return this;

        let p: GObject = this._parent;
        while (p) {
            if (p instanceof GRoot)
                return p;
            p = p.parent;
        }
        return GRoot.inst;
    }

    public get asCom(): GComponent {
        return <any>this;
    }

    public get asButton(): GButton {
        return <GButton><any>this;
    }

    // public get asLabel(): GLabel {
    //     return <GLabel><any>this;
    // }

    public get asProgress(): GProgressBar {
        return <GProgressBar><any>this;
    }

    public get asTextField(): GTextField {
        return <GTextField><any>this;
    }

    public get asRichTextField(): GRichTextField {
        return <GRichTextField><any>this;
    }

    public get asTextInput(): GTextInput {
        return <GTextInput><any>this;
    }

    public get asLoader(): GLoader {
        return <GLoader><any>this;
    }

    public get asList(): GList {
        return <GList><any>this;
    }

    public get asTree(): GTree {
        return <GTree><any>this;
    }

    public get asGraph(): GGraph {
        return <GGraph><any>this;
    }

    public get asGroup(): GGroup {
        return <GGroup><any>this;
    }


    public get asSlider(): GSlider {
        return <GSlider><any>this;
    }

    public get asComboBox(): GComboBox {
        return <GComboBox><any>this;
    }

    public get asImage(): GImage {
        return <GImage><any>this;
    }

    public get asMovieClip(): GMovieClip {
        return <GMovieClip><any>this;
    }

    public get text(): string {
        return null;
    }

    public set text(value: string) {
    }

    public get icon(): string {
        return null;
    }

    public set icon(value: string) {
    }

    public get treeNode(): GTreeNode {
        return this._treeNode;
    }

    public get isDisposed(): boolean {
        return this._displayObject == null;
    }

    public get scrollRect(): Phaser.Geom.Rectangle {
        return this._displayStyle && this._displayStyle.scrollRect;
    }

    public set scrollRect(val: Phaser.Geom.Rectangle) {
        this._displayStyle.scrollRect = val;
    }

    /**
     * <p>可以设置一个Rectangle区域作为点击区域，或者设置一个<code>HitArea</code>实例作为点击区域，HitArea内可以设置可点击和不可点击区域。</p>
     * <p>如果不设置hitArea，则根据宽高形成的区域进行碰撞。</p>
    */
    get hitArea(): any {
        return this._displayStyle.hitArea;
    }

    set hitArea(value: any) {
        this._displayStyle.hitArea = value;
    }

    public dispose(): void {
        this._extenalScaleBoo = false;
        this.removeFromParent();
        if (this._relations) {
            this._relations.dispose();
            this._relations = null;
        }
        if (this._displayObject) {
            this._displayObject.destroy();
            this._displayObject = null;
        }
        for (var i: number = 0; i < 10; i++) {
            var gear: GearBase = this._gears[i];
            if (gear)
                gear.dispose();
        }
    }

    public onClick(listener: Function, context: any): void {
        this.on(InteractiveEvent.GAMEOBJECT_UP, listener, context);
    }

    public offClick(listener: Function, context: any): void {
        this.off(InteractiveEvent.GAMEOBJECT_UP, listener, context);
    }

    public hasClickListener(): boolean {
        return this._displayObject && this._touchable;// hasListener(InteractiveEvent.CLICK);
    }

    /**
     * 添加fairygui内部事件
     * @param type 
     * @param listener 
     * @param context 
     */
    public onEvent(type: string, listener: Function, context: any = this): void {
        GRoot.inst.input.addToListener(type, this._displayObject, listener, context);
    }

    public offEvent(type: string, listener: Function, context: any = this): void {
        GRoot.inst.input.removeFromListener(type, this._displayObject, context);
    }

    /**
     * 添加phaser交互事件
     * @param type 
     * @param listener 
     * @param context 
     */
    public on(type: string, listener: Function, context: any = this): void {
        if (this._touchable) {
            GRoot.inst.input.addToListener(type, this._displayObject, listener, context);
        }
    }

    public off(type: string, listener: Function, context: any = this): void {
        GRoot.inst.input.removeFromListener(type, this._displayObject, context);
    }

    public get draggable(): boolean {
        return this._draggable;
    }

    public set draggable(value: boolean) {
        if (this._draggable != value) {
            this._draggable = value;
            this.initDrag();
        }
    }

    public get dragBounds(): Phaser.Geom.Rectangle {
        return this._dragBounds;
    }

    public set dragBounds(value: Phaser.Geom.Rectangle) {
        this._dragBounds = value;
    }

    public startDrag(touchID?: number): void {
        // if (this._displayObject.stage == null)
        //     return;

        this.dragBegin(touchID);
    }

    public stopDrag(): void {
        this.dragEnd();
    }

    public get dragging(): boolean {
        return GObject.draggingObject == this;
    }

    public localToGlobal(ax?: number, ay?: number, result?: Phaser.Geom.Point): Phaser.Geom.Point {
        ax = ax || 0;
        ay = ay || 0;

        if (this._pivotAsAnchor) {
            ax += this._pivotX * this._width;
            ay += this._pivotY * this._height;
        }

        result = result || new Phaser.Geom.Point();
        result.x = ax;
        result.y = ay;
        return this._localToGlobal(result, false);

    }

    _localToGlobal(point: Phaser.Geom.Point, createNewPoint: boolean = false): Phaser.Geom.Point {
        if (createNewPoint === true) {
            point = new Phaser.Geom.Point(point.x, point.y);
        }
        let ele: Phaser.GameObjects.Container = this._displayObject;
        if (!ele) return point;
        const worldMatrix = (<Phaser.GameObjects.Container>this._displayObject).getWorldTransformMatrix();
        // while (ele) {
        //     if (!ele.parentContainer) break;
        //     ele = ele.parentContainer;
        // }
        return new Phaser.Geom.Point(worldMatrix.tx / GRoot.dpr, worldMatrix.ty / GRoot.dpr);
    }

    public globalToLocal(ax?: number, ay?: number, result?: Phaser.Geom.Point): Phaser.Geom.Point {
        ax = ax || 0;
        ay = ay || 0;
        result = result || new Phaser.Geom.Point();
        result.x = ax;
        result.y = ay;
        result = this._globalToLocal(result, false);

        if (this._pivotAsAnchor) {
            result.x -= this._pivotX * this._width;
            result.y -= this._pivotY * this._height;
        }
        return result;

        // let ele: Phaser.GameObjects.Container = this._displayObject;
        // let list: any[] = [];
        // while (ele) {
        //     list.push(ele);
        //     if (!ele.parentContainer) break;
        //     ele = ele.parentContainer;
        // }
        // var i: number = list.length - 1;
        // while (i >= 0) {
        //     ele = list[i];
        //     i--;
        // }
        // return new Phaser.Geom.Point(ele.x, ele.y);
    }

    _globalToLocal(point: Phaser.Geom.Point, createNewPoint: boolean = false): Phaser.Geom.Point {
        if (createNewPoint) {
            point = new Phaser.Geom.Point(point.x, point.y);
        }
        let ele: Phaser.GameObjects.Container = this._displayObject;
        let list: any[] = [];
        while (ele) {
            list.push(ele);
            if (!ele.parentContainer) break;
            ele = ele.parentContainer;
        }
        var i: number = list.length - 1;
        while (i >= 0) {
            ele = list[i];
            point = this.fromParentPoint(point);
            i--;
        }
        return point;
    }

    /**
     * 将本地坐标系坐标转转换到父容器坐标系。
     * @param point 本地坐标点。
     * @return  转换后的点。
     */
    toParentPoint(point: Phaser.Geom.Point): Phaser.Geom.Point {
        if (!point) return point;
        point.x -= this.pivotX;
        point.y -= this.pivotY;
        const tmpPoint = new Phaser.Geom.Point();
        if (this._displayObject) {
            const matrix = this._displayObject.getLocalTransformMatrix();
            matrix.transformPoint(point.x, point.y, tmpPoint);
        }
        tmpPoint.x += this._displayObject.x;
        tmpPoint.y += this._displayObject.y;
        var scroll: Phaser.Geom.Rectangle = this._displayStyle.scrollRect;
        if (scroll) {
            point.x -= scroll.x;
            point.y -= scroll.y;
        }
        return point;
    }

    /**
     * 将父容器坐标系坐标转换到本地坐标系。
     * @param point 父容器坐标点。
     * @return  转换后的点。
     */
    fromParentPoint(point: Phaser.Geom.Point): Phaser.Geom.Point {
        if (!point) return point;
        point.x -= this._displayObject.x;
        point.y -= this._displayObject.y;
        var scroll: Phaser.Geom.Rectangle = this._displayStyle.scrollRect;
        if (scroll) {
            point.x += scroll.x;
            point.y += scroll.y;
        }
        const matrix = this._displayObject.getLocalTransformMatrix();
        if (matrix) {
            //_transform.setTranslate(0,0);
            this.invertTransformPoint(point);
        }
        point.x += this.pivotX;
        point.y += this.pivotY;
        return point;
    }

    /**
 * 对指定的点应用当前矩阵的逆转化并返回此点。
 * @param	out 待转化的点 Point 对象。
 * @return	返回out
 */
    invertTransformPoint(out: Phaser.Geom.Point): Phaser.Geom.Point {
        const matrix = this._displayObject.getLocalTransformMatrix();
        var a1: number = matrix.a;
        var b1: number = matrix.b;
        var c1: number = matrix.c;
        var d1: number = matrix.d;
        var tx1: number = matrix.tx;
        var n: number = a1 * d1 - b1 * c1;

        var a2: number = d1 / n;
        var b2: number = -b1 / n;
        var c2: number = -c1 / n;
        var d2: number = a1 / n;
        var tx2: number = (c1 * matrix.ty - d1 * tx1) / n;
        var ty2: number = -(a1 * matrix.ty - b1 * tx1) / n;
        return out.setTo(a2 * out.x + c2 * out.y + tx2, b2 * out.x + d2 * out.y + ty2);
    }

    public localToGlobalRect(ax?: number, ay?: number, aw?: number, ah?: number, result?: Phaser.Geom.Rectangle): Phaser.Geom.Rectangle {
        ax = ax || 0;
        ay = ay || 0;
        aw = aw || 0;
        ah = ah || 0;
        result = result || new Phaser.Geom.Rectangle();
        var pt: Phaser.Geom.Point = this.localToGlobal(ax, ay);
        result.x = pt.x;
        result.y = pt.y;
        pt = this.localToGlobal(ax + aw, ay + ah);
        result.width = pt.x - result.x;
        result.height = pt.y - result.y;
        return result;
    }

    public globalToLocalRect(ax?: number, ay?: number, aw?: number, ah?: number, result?: Phaser.Geom.Rectangle): Phaser.Geom.Rectangle {
        ax = ax || 0;
        ay = ay || 0;
        aw = aw || 0;
        ah = ah || 0;
        result = result || new Phaser.Geom.Rectangle();
        var pt: Phaser.Geom.Point = this.globalToLocal(ax, ay);
        result.x = pt.x;
        result.y = pt.y;
        pt = this.globalToLocal(ax + aw, ay + ah);
        result.width = pt.x - result.x;
        result.height = pt.y - result.y;
        return result;
    }

    public handleControllerChanged(c: Controller): void {
        this._handlingController = true;
        for (var i: number = 0; i < 10; i++) {
            var gear: GearBase = this._gears[i];
            if (gear && gear.controller == c)
                gear.apply();
        }
        this._handlingController = false;

        this.checkGearDisplay();
    }

    public createDisplayObject(): void {
        this._displayObject = this.scene.make.container(undefined, false);
        this._displayObject["$owner"] = this;
    }

    public setDisplayObject(val) {
        this._displayObject = val;
        this._displayObject["$owner"] = this;
    }

    protected handleXYChanged(): void {
        var xv: number = this._x + this._xOffset;
        var yv: number = this._y + this._yOffset;
        let offsetXParam: number = GRoot.dpr * GRoot.uiScale;
        let offsetYParam: number = GRoot.dpr * GRoot.uiScale;
        if (this.parent && (this.parent.name === "")) {
            offsetXParam = GRoot.dpr;
            offsetYParam = GRoot.dpr;
        }

        if (this._pixelSnapping) {
            xv = Math.round(xv);
            yv = Math.round(yv);
        }
        this._displayObject.setPosition(xv * offsetXParam, yv * offsetYParam);


        // var xv: number = this._x;
        // var yv: number = this._y + this._yOffset;
        // if (this._pivotAsAnchor) {
        //     xv -= this._pivotX * this._width;
        //     yv -= this._pivotY * this._height;
        // }
        // if (this._pixelSnapping) {
        //     xv = Math.round(xv);
        //     yv = Math.round(yv);
        // }

        // this._displayObject.setPosition(xv + this._pivotOffsetX, yv + this._pivotOffsetY);
    }

    protected handleSizeChanged(): void {
        if (this.name === "maskBG" || (this.parent && this.parent.name === "maskBG") || (this._parent && this._parent.type === ObjectType.List)) {
            this._displayObject.setSize(this._width * GRoot.dpr, this._height * GRoot.dpr);
        } else if (this.type === ObjectType.List) {
            const contentScaleWid = GRoot.contentScaleWid > 1 ? GRoot.contentScaleWid : GRoot.uiScale;
            const contentScaleHei = GRoot.contentScaleHei > 1 ? GRoot.contentScaleHei : GRoot.uiScale;
            this._displayObject.setSize(this._width * GRoot.dpr * contentScaleWid, this._height * GRoot.dpr * contentScaleHei);
        } else {
            this._displayObject.setSize(this._width * GRoot.dpr * GRoot.uiScale, this._height * GRoot.dpr * GRoot.uiScale);
        }
        this.changeInteractive();
        // (<Phaser.GameObjects.Container>this.displayObject).setDisplaySize(this._width, this._height);
        // this._displayObject.setInteractive(new Phaser.Geom.Rectangle(0, 0, this._width, this._height), Phaser.Geom.Rectangle.Contains);
    }

    protected handleScaleChanged(): void {
        this._displayObject.setScale(this._scaleX, this._scaleY);
    }

    protected handleGrayedChanged(): void {
        ToolSet.setColorFilter(this._displayObject, this._grayed);
    }

    protected handleAlphaChanged(): void {
        this._displayObject.alpha = this._alpha;
    }

    public handleVisibleChanged(): void {
        this._displayObject.visible = this.internalVisible2;
    }

    public getProp(index: number): any {
        switch (index) {
            case ObjectPropID.Text:
                return this.text;
            case ObjectPropID.Icon:
                return this.icon;
            case ObjectPropID.Color:
                return null;
            case ObjectPropID.OutlineColor:
                return null;
            case ObjectPropID.Playing:
                return false;
            case ObjectPropID.Frame:
                return 0;
            case ObjectPropID.DeltaTime:
                return 0;
            case ObjectPropID.TimeScale:
                return 1;
            case ObjectPropID.FontSize:
                return 0;
            case ObjectPropID.Selected:
                return false;
            default:
                return undefined;
        }
    }

    public setProp(index: number, value: any): void {
        switch (index) {
            case ObjectPropID.Text:
                this.text = value;
                break;

            case ObjectPropID.Icon:
                this.icon = value;
                break;
        }
    }

    public constructFromResource(): Promise<void> {
        return new Promise((reslove, reject) => {
            reslove();
        });
    }

    public setup_beforeAdd(buffer: ByteBuffer, beginPos: number): void {
        buffer.seek(beginPos, 0);
        buffer.skip(5);

        var f1: number;
        var f2: number;

        this._id = buffer.readS();
        this._name = buffer.readS();
        f1 = buffer.readInt();
        f2 = buffer.readInt();
        this.setXY(f1, f2);

        if (buffer.readBool()) {
            this.initWidth = buffer.readInt();
            this.initHeight = buffer.readInt();
            this.setSize(this.initWidth, this.initHeight, true);
            // if (this.type === ObjectType.Image) {
            //     (<Image>this.displayObject).changeSize(this.initWidth, this.initHeight);
            // }
        }

        if (buffer.readBool()) {
            this.minWidth = buffer.readInt();
            this.maxWidth = buffer.readInt();
            this.minHeight = buffer.readInt();
            this.maxHeight = buffer.readInt();
        }

        if (buffer.readBool()) {
            f1 = buffer.readFloat();
            f2 = buffer.readFloat();
            this.setScale(f1, f2);
        }

        if (buffer.readBool()) {
            f1 = buffer.readFloat();
            f2 = buffer.readFloat();
            this.setSkew(f1, f2);
        }

        if (buffer.readBool()) {
            f1 = buffer.readFloat();
            f2 = buffer.readFloat();
            this.setPivot(f1, f2, buffer.readBool());
        }

        f1 = buffer.readFloat();
        if (f1 != 1) {
            if (f1 > 1) f1 = 1;
            this.alpha = f1;
        }

        f1 = buffer.readFloat();
        if (f1 != 0)
            this.rotation = f1;

        if (!buffer.readBool())
            this.visible = false;
        // console.log("visible object ===>", this);
        const touchable = buffer.readBool();
        if (this.type !== ObjectType.Text && this.type !== ObjectType.Image) {
            this.touchable = touchable;
        }
        // if (!buffer.readBool()) {
        //     this.touchable = false;
        // } else {
        //     this.touchable = true;
        // }
        if (buffer.readBool())
            this.grayed = true;
        var bm: number = buffer.readByte();
        if (BlendMode[bm])
            this.blendMode = BlendMode[bm];

        var filter: number = buffer.readByte();
        if (filter == 1) {
            ToolSet.setColorFilter(this._displayObject,
                [buffer.readFloat(), buffer.readFloat(), buffer.readFloat(), buffer.readFloat()]);
        }

        var str: string = buffer.readS();
        if (str != null)
            this.data = str;
    }

    public setup_afterAdd(buffer: ByteBuffer, beginPos: number): void {
        buffer.seek(beginPos, 1);

        var str: string = buffer.readS();
        if (str != null)
            this.tooltips = str;

        var groupId: number = buffer.readShort();
        if (groupId >= 0)
            this.group = <GGroup>this.parent.getChildAt(groupId);

        buffer.seek(beginPos, 2);

        var cnt: number = buffer.readShort();
        for (var i: number = 0; i < cnt; i++) {
            var nextPos: number = buffer.readShort();
            nextPos += buffer.position;

            var gear: GearBase = this.getGear(buffer.readByte());
            gear.setup(buffer);

            buffer.position = nextPos;
        }
        let wid: number = this.initWidth;
        let hei: number = this.initHeight;
        // if (this.parent && this.parent instanceof GRoot) {
        //     wid = GRoot.inst.stageWidth();
        //     hei = GRoot.inst.stageHeight();
        // }
        this.setSize(wid, hei, true);
        this.setTouchable(this._touchable);
        this.adaptiveScaleX = this.initWidth / this.sourceWidth;
        this.adaptiveScaleY = this.initHeight / this.sourceHeight;
        this._basePosX = this.x;
        this._basePosY = this.y;
    }

    //drag support
    //-------------------------------------------------------------------

    private initDrag(): void {
        if (this._draggable)
            this._displayObject.on(InteractiveEvent.POINTER_DOWN, this.__begin, this);
        else
            this._displayObject.off(InteractiveEvent.POINTER_DOWN, this.__begin, this);
    }

    private dragBegin(touchID?: number): void {
        if (GObject.draggingObject) {
            let tmp: GObject = GObject.draggingObject;
            tmp.stopDrag();
            GObject.draggingObject = null;

            Events.dispatch(Events.DRAG_END, tmp._displayObject, { touchId: touchID });
        }

        sGlobalDragStart.x = this.scene.input.activePointer.worldX;
        sGlobalDragStart.y = this.scene.input.activePointer.worldY;

        this.localToGlobalRect(0, 0, this._width, this._height, sGlobalRect);
        this._dragTesting = true;
        GObject.draggingObject = this;

        this._displayObject.on(InteractiveEvent.POINTER_MOVE, this.__moving, this);
        this._displayObject.on(InteractiveEvent.POINTER_UP, this.__end, this);
    }

    private dragEnd(): void {
        if (GObject.draggingObject == this) {
            this.reset();
            this._dragTesting = false;
            GObject.draggingObject = null;
        }
        sDraggingQuery = false;
    }

    private reset(): void {
        this._displayObject.off(InteractiveEvent.POINTER_MOVE, this.__moving, this);
        this._displayObject.off(InteractiveEvent.POINTER_UP, this.__end, this);
    }

    private __begin(): void {
        if (!this._dragStartPos)
            this._dragStartPos = new Phaser.Geom.Point();
        this._dragStartPos.x = this.scene.input.activePointer.worldX;
        this._dragStartPos.y = this.scene.input.activePointer.worldY;
        this._dragTesting = true;

        this._displayObject.on(InteractiveEvent.POINTER_MOVE, this.__moving, this);
        this._displayObject.on(InteractiveEvent.POINTER_UP, this.__end, this);
    }

    private __moving(pointer: Phaser.Input.Pointer): void {
        if (GObject.draggingObject != this && this._draggable && this._dragTesting) {
            var sensitivity: number = UIConfig.touchDragSensitivity;
            if (this._dragStartPos
                && Math.abs(this._dragStartPos.x - this.scene.input.activePointer.x) < sensitivity
                && Math.abs(this._dragStartPos.y - this.scene.input.activePointer.y) < sensitivity)
                return;

            this._dragTesting = false;

            sDraggingQuery = true;
            Events.dispatch(Events.DRAG_START, this._displayObject);
            if (sDraggingQuery)
                this.dragBegin();
        }

        if (GObject.draggingObject == this) {
            // 若存在嵌套层级，实际位置会有偏差，所以引入世界坐标，做补正
            this.worldMatrix;
            const worldTx = this._worldTx / this._dprOffset;
            const worldTy = this._worldTy / this._dprOffset;
            var xx: number = this.scene.input.activePointer.x - sGlobalDragStart.x - worldTx + sGlobalRect.x;
            var yy: number = this.scene.input.activePointer.y - sGlobalDragStart.y - worldTy + sGlobalRect.y;

            if (this._dragBounds) {
                var rect: Phaser.Geom.Rectangle = this._dragBounds;
                if (xx < rect.x - worldTx)
                    xx = rect.x;
                else if (xx + sGlobalRect.width + this._width > rect.right - worldTx) {
                    xx = rect.right - sGlobalRect.width - this._width - worldTx;
                    if (xx < rect.x - worldTx)
                        xx = rect.x - worldTx;
                }

                if (yy < rect.y - worldTy)
                    yy = rect.y - worldTy;
                else if (yy + sGlobalRect.height + this._height > rect.bottom - worldTy) {
                    yy = rect.bottom - sGlobalRect.height - this._height - worldTy;
                    if (yy < rect.y - worldTy)
                        yy = rect.y - worldTy;
                }
            }

            sUpdateInDragging = true;
            var pt: Phaser.Geom.Point = this.parent.globalToLocal(xx, yy, sHelperPoint);
            this.setXY(Math.round(pt.x), Math.round(pt.y));
            sUpdateInDragging = false;

            Events.dispatch(Events.DRAG_MOVE, this._displayObject);
        }
    }

    private __end(evt: InteractiveEvent): void {
        if (GObject.draggingObject == this) {
            GObject.draggingObject = null;
            this.reset();

            Events.dispatch(Events.DRAG_END, this._displayObject, evt);
        }
        else if (this._dragTesting) {
            this._dragTesting = false;
            this.reset();
        }
    }

    get xOffset(): number {
        return this._xOffset
    }

    set xOffset(val: number) {
        this._xOffset = val;
    }

    set yOffset(val: number) {
        this._yOffset = val;
    }

    get yOffset(): number {
        return this._yOffset;
    }
    //-------------------------------------------------------------------

    public static cast(sprite: Phaser.GameObjects.GameObject): GObject {
        return <GObject>(sprite["$owner"]);
    }
}

let GearClasses: Array<typeof GearBase> = [
    GearDisplay, GearXY, GearSize, GearLook, GearColor,
    GearAnimation, GearText, GearIcon, GearDisplay2, GearFontSize
];

function createGear(owner: GObject, index: number): GearBase {
    let ret = new (GearClasses[index])();
    ret._owner = owner;
    return ret;
}

export const BlendMode = {
    2: Phaser.BlendModes.LIGHTER,
    3: Phaser.BlendModes.MULTIPLY,
    4: Phaser.BlendModes.SCREEN
}

var _gInstanceCounter: number = 0;
var sGlobalDragStart: Phaser.Geom.Point = new Phaser.Geom.Point();
export var sGlobalRect: Phaser.Geom.Rectangle = new Phaser.Geom.Rectangle();
var sHelperPoint: Phaser.Geom.Point = new Phaser.Geom.Point();
var sDragHelperRect: Phaser.Geom.Rectangle = new Phaser.Geom.Rectangle();
export var sUpdateInDragging: boolean;
var sDraggingQuery: boolean;
