import { ByteBuffer } from './utils/ByteBuffer';
import { UIConfig } from './UIConfig';
import { GButton } from './GButton';
import { GObjectPool } from './GObjectPool';
import { Controller } from './Controller';
import { UIPackage } from './UIPackage';
import { ListLayoutType, ListSelectionMode, ChildrenRenderOrder, OverflowType, ObjectType } from './FieldTypes';
import { GComponent } from "./GComponent";
import { GObject } from "./GObject";
import { Events } from './Events';
import { Handler } from './utils/Handler';
import { Utils } from './utils/Utils';
import { GRoot } from '.';
export class GList extends GComponent {
    /**
     * this.itemRenderer(number index, GObject item);
     */
    public itemRenderer: Handler;
    /**
     * this.itemProvider(index:number):string;
     */
    public itemProvider: Handler;

    public scrollItemToViewOnClick: boolean;
    public foldInvisibleItems: boolean;

    protected _layout: number;
    protected _lineCount: number = 0;
    protected _columnCount: number = 0;
    protected _lineGap: number = 0;
    protected _columnGap: number = 0;
    protected _defaultItem: string;
    protected _autoResizeItem: boolean;
    protected _selectionMode: number;
    protected _align: string;
    protected _verticalAlign: string;
    protected _selectionController?: Controller;

    protected _lastSelectedIndex: number = 0;
    protected _pool: GObjectPool;

    //Virtual List support
    protected _virtual?: boolean;
    protected _loop?: boolean;
    protected _numItems: number = 0;
    protected _realNumItems: number;
    protected _firstIndex: number = 0; //the top left index
    protected _curLineItemCount: number = 0; //item count in one line
    protected _curLineItemCount2: number; //只用在页面模式，表示垂直方向的项目数
    protected _itemSize?: Phaser.Geom.Point;
    protected _virtualListChanged: number = 0; //1-content changed, 2-size changed
    protected _virtualItems?: Array<ItemInfo>;
    protected _virtualWidth: number = 0;
    protected _virtualHeight: number = 0;
    protected _eventLocked?: boolean;
    protected itemInfoVer: number = 0; //用来标志item是否在本次处理中已经被重用了
    protected _timeDelta: number = 500;
    protected _refreshListEvent: any;//Phaser.Time.TimerEvent;
    protected _refreshListTime: Phaser.Time.TimerEvent;
    protected shiftKey: boolean = false;
    protected ctrlKey: boolean = false;
    /**
     * 异步存储item列表，防止多个相同item同时创建，添加到舞台上的先后顺序错乱
     */
    protected _tempItemList: any[];
    constructor(scene: Phaser.Scene, type) {
        super(scene, type);
        this._refreshListEvent = { delay: this._timeDelta / Utils.FPSTarget, callback: this._refreshVirtualList, callbackScope: this };
        this._trackBounds = true;
        this._pool = new GObjectPool();
        this._layout = ListLayoutType.SingleColumn;
        this._autoResizeItem = false;
        this._lastSelectedIndex = -1;
        this._selectionMode = ListSelectionMode.Single;
        this.opaque = true;
        this.scrollItemToViewOnClick = true;
        this._align = "left";
        this._verticalAlign = "top";
        this._tempItemList = [];
        this.name = "stage";

        this._container = scene.make.container(undefined, false);
        this._displayObject.add(this._container);

        // todo click 优先添加监听，防止scrollpane的pointerup将参数修改，影响glist _clickItem逻辑
        this.scene.input.on("pointerup", this.__clickItem, this);
        if (this.scene.input.keyboard) {
            this.scene.input.keyboard.on('keydown', this.__keyDown, this);
            this.scene.input.keyboard.on('keyup', this.__keyUp, this);
        }
    }

    get virtual(): boolean {
        return this._virtual;
    }

    set virtual(val) {
        this._virtual = val;
    }

    public createDisplayObject(): void {
        this._displayObject = this.scene.make.container(undefined, false);
        this._displayObject["$owner"] = this;
        const _delay = 1;
        this._renderEvent = { delay: _delay, callback: this.__render, callbackScope: this };
        this._buildNativeEvent = { delay: _delay, callback: this.buildNativeDisplayList, callbackScope: this };
    }

    private __keyDown(event) {

        switch (event.keyCode) {
            // shift
            case 16:
                this.shiftKey = true;
                break;
            // ctrl
            case 17:
                this.ctrlKey = true;
                break;

        }
        console.dir(event);
    }

    private __keyUp(event) {
        switch (event.keyCode) {
            // shift
            case 16:
                this.shiftKey = false;
                break;
            // ctrl
            case 17:
                this.ctrlKey = false;
                break;

        }
    }

    public dispose(): void {
        this.off(Events.SCROLL, this.__scrolled, this);
        this.scene.input.off("pointerup", this.__clickItem, this);
        if (this.scene.input.keyboard) {
            this.scene.input.keyboard.off('keydown', this.__keyDown, this);
            this.scene.input.keyboard.off('keyup', this.__keyUp, this);
        }
        this.shiftKey = false;
        this.ctrlKey = false;
        this._pool.clear();
        super.dispose();
    }

    public get layout(): number {
        return this._layout;
    }

    public set layout(value: number) {
        if (this._layout != value) {
            this._layout = value;
            this.setBoundsChangedFlag();
            if (this._virtual)
                this.setVirtualListChangedFlag(true);
        }
    }

    public get lineCount(): number {
        return this._lineCount;
    }

    public set lineCount(value: number) {
        if (this._lineCount != value) {
            this._lineCount = value;
            if (this._layout == ListLayoutType.FlowVertical || this._layout == ListLayoutType.Pagination) {
                this.setBoundsChangedFlag();
                if (this._virtual)
                    this.setVirtualListChangedFlag(true);
            }
        }
    }

    public get columnCount(): number {
        return this._columnCount;
    }

    public set columnCount(value: number) {
        if (this._columnCount != value) {
            this._columnCount = value;
            if (this._layout == ListLayoutType.FlowHorizontal || this._layout == ListLayoutType.Pagination) {
                this.setBoundsChangedFlag();
                if (this._virtual)
                    this.setVirtualListChangedFlag(true);
            }
        }
    }

    public get lineGap(): number {
        return this._lineGap;
    }

    public set lineGap(value: number) {
        if (this._lineGap != value) {
            this._lineGap = value * GRoot.dpr;
            this.setBoundsChangedFlag();
            if (this._virtual)
                this.setVirtualListChangedFlag(true);
        }
    }

    public get columnGap(): number {
        return this._columnGap;
    }

    public set columnGap(value: number) {
        if (this._columnGap != value) {
            this._columnGap = value * GRoot.dpr;
            this.setBoundsChangedFlag();
            if (this._virtual)
                this.setVirtualListChangedFlag(true);
        }
    }

    public get align(): string {
        return this._align;
    }

    public set align(value: string) {
        if (this._align != value) {
            this._align = value;
            this.setBoundsChangedFlag();
            if (this._virtual)
                this.setVirtualListChangedFlag(true);
        }
    }

    public get verticalAlign(): string {
        return this._verticalAlign;
    }

    public set verticalAlign(value: string) {
        if (this._verticalAlign != value) {
            this._verticalAlign = value;
            this.setBoundsChangedFlag();
            if (this._virtual)
                this.setVirtualListChangedFlag(true);
        }
    }

    public get virtualItemSize(): Phaser.Geom.Point {
        return this._itemSize;
    }

    public set virtualItemSize(value: Phaser.Geom.Point) {
        if (this._virtual) {
            if (this._itemSize == null)
                this._itemSize = new Phaser.Geom.Point();
            this._itemSize.setTo(value.x, value.y);
            this.setVirtualListChangedFlag(true);
        }
    }

    public get defaultItem(): string {
        return this._defaultItem;
    }

    public set defaultItem(val: string) {
        this._defaultItem = UIPackage.normalizeURL(val);
    }

    public get autoResizeItem(): boolean {
        return this._autoResizeItem;
    }

    public set autoResizeItem(value: boolean) {
        if (this._autoResizeItem != value) {
            this._autoResizeItem = value;
            this.setBoundsChangedFlag();
            if (this._virtual)
                this.setVirtualListChangedFlag(true);
        }
    }

    public get selectionMode(): number {
        return this._selectionMode;
    }

    public set selectionMode(value: number) {
        this._selectionMode = value;
    }

    public get selectionController(): Controller {
        return this._selectionController;
    }

    public set selectionController(value: Controller) {
        this._selectionController = value;
    }

    public get itemPool(): GObjectPool {
        return this._pool;
    }

    public getFromPool(url?: string): Promise<GObject> {
        return new Promise((reslove, rejcet) => {
            if (!url)
                url = this._defaultItem;

            this._pool.getObject(url).then((obj) => {
                if (obj)
                    obj.visible = true;
                return reslove(obj);
            });
        });
    }

    public returnToPool(obj: GObject): void {
        // obj.displayObject.cacheAs = "none";
        this._pool.returnObject(obj);
    }

    public addChildAt(child: GObject, index: number): GObject {
        super.addChildAt(child, index);
        if (child instanceof GButton) {
            child.selected = false;
            child.changeStateOnClick = false;
        }
        return child;
    }

    public addItem(url?: string): Promise<GObject> {
        return new Promise((reslove, reject) => {
            if (!url)
                url = this._defaultItem;

            UIPackage.createObjectFromURL(url).then((obj) => {
                this.addChild(obj);
                reslove(obj);
            });
        });
    }

    /**
     * 一次添加多个listitem
     * @param datas 
     */
    public addItems(count: number, url?: string): Promise<any> {
        return new Promise((resolve1, reject) => {
            if (!url)
                url = this._defaultItem;
            const promiseList = [];
            for (let i: number = 0; i < count; i++) {
                promiseList.push(this._addItems(url));
            }
            // 同时创建多个相同item会由于异步问题导致显示对象添加顺序错乱
            Promise.all(promiseList).then(() => {
                resolve1(this._tempItemList);
            });
        });
    }

    protected _addItems(url): Promise<GObject> {
        return new Promise((resolve, reject) => {
            UIPackage.createObjectFromURL(url).then((obj) => {
                this._tempItemList.push(obj);
                this.addChild(obj);
                resolve(obj);
            });
        });
    }

    public addItemFromPool(url?: string): Promise<GObject> {
        return new Promise((reslove, reject) => {
            this.getFromPool(url).then((obj) => {
                this.addChild(obj);
                reslove(obj);
            });
        });
    }

    public removeChildAt(index: number, dispose?: boolean): Promise<GObject> {
        return new Promise((reslove, reject) => {
            super.removeChildAt(index).then((obj) => {
                if (dispose) {
                    obj.dispose();
                } else {
                    // this.scene.input.off("pointerup", this.__clickItem, this);
                }
                reslove(obj);
            });
        });
    }

    public removeChildToPoolAt(index: number): void {
        super.removeChildAt(index).then((obj) => {
            this.returnToPool(obj);
        });
    }

    public removeChildToPool(child: GObject): void {
        super.removeChild(child);
        this.returnToPool(child);
    }

    public removeChildrenToPool(beginIndex?: number, endIndex?: number): void {
        if (beginIndex == undefined) beginIndex = 0;
        if (endIndex == undefined) endIndex = -1;
        if (endIndex < 0 || endIndex >= this._children.length)
            endIndex = this._children.length - 1;

        for (var i: number = beginIndex; i <= endIndex; ++i)
            this.removeChildToPoolAt(beginIndex);
    }

    public get selectedIndex(): number {
        var i: number;
        if (this._virtual) {
            for (i = 0; i < this._realNumItems; i++) {
                var ii: ItemInfo = this._virtualItems[i];
                if ((ii.obj instanceof GButton) && ii.obj.selected
                    || ii.obj == null && ii.selected) {
                    if (this._loop)
                        return i % this._numItems;
                    else
                        return i;
                }
            }
        }
        else {
            var cnt: number = this._children.length;
            for (i = 0; i < cnt; i++) {
                var obj: GObject = this._children[i];
                if ((obj instanceof GButton) && obj.selected)
                    return i;
            }
        }

        return -1;
    }

    public set selectedIndex(value: number) {
        if (value >= 0 && value < this.numItems) {
            if (this._selectionMode != ListSelectionMode.Single)
                this.clearSelection();
            this.addSelection(value);
        }
        else
            this.clearSelection();
    }

    public getSelection(result?: number[]): number[] {
        if (!result)
            result = new Array<number>();
        var i: number;
        if (this._virtual) {
            for (i = 0; i < this._realNumItems; i++) {
                var ii: ItemInfo = this._virtualItems[i];
                if ((ii.obj instanceof GButton) && ii.obj.selected
                    || ii.obj == null && ii.selected) {
                    var j: number = i;
                    if (this._loop) {
                        j = i % this._numItems;
                        if (result.indexOf(j) != -1)
                            continue;
                    }
                    result.push(j);
                }
            }
        }
        else {
            var cnt: number = this._children.length;
            for (i = 0; i < cnt; i++) {
                var obj: GObject = this._children[i];
                if ((obj instanceof GButton) && obj.selected)
                    result.push(i);
            }
        }
        return result;
    }

    public addSelection(index: number, scrollItToView?: boolean): void {
        if (this._selectionMode == ListSelectionMode.None)
            return;

        this.checkVirtualList();

        if (this._selectionMode == ListSelectionMode.Single)
            this.clearSelection();

        if (scrollItToView)
            this.scrollToView(index);

        this._lastSelectedIndex = index;
        var obj: GObject;
        if (this._virtual) {
            var ii: ItemInfo = this._virtualItems[index];
            if (ii.obj)
                obj = ii.obj;
            ii.selected = true;
        }
        else
            obj = this.getChildAt(index);

        if ((obj instanceof GButton) && !obj.selected) {
            obj.selected = true;
            this.updateSelectionController(index);
        }
    }

    public removeSelection(index: number): void {
        if (this._selectionMode == ListSelectionMode.None)
            return;

        var obj: GObject;
        if (this._virtual) {
            var ii: ItemInfo = this._virtualItems[index];
            if (ii.obj)
                obj = ii.obj;
            ii.selected = false;
        }
        else
            obj = this.getChildAt(index);

        if (obj instanceof GButton)
            obj.selected = false;
    }

    public clearSelection(): void {
        var i: number;
        if (this._virtual) {
            for (i = 0; i < this._realNumItems; i++) {
                var ii: ItemInfo = this._virtualItems[i];
                if (ii.obj instanceof GButton)
                    ii.obj.selected = false;
                ii.selected = false;
            }
        }
        else {
            var cnt: number = this._children.length;
            for (i = 0; i < cnt; i++) {
                var obj: GObject = this._children[i];
                if (obj instanceof GButton)
                    obj.selected = false;
            }
        }
    }

    protected clearSelectionExcept(g: GObject): void {
        var i: number;
        if (this._virtual) {
            for (i = 0; i < this._realNumItems; i++) {
                var ii: ItemInfo = this._virtualItems[i];
                if (ii.obj != g) {
                    if (ii.obj instanceof GButton)
                        ii.obj.selected = false;
                    ii.selected = false;
                }
            }
        }
        else {
            var cnt: number = this._children.length;
            for (i = 0; i < cnt; i++) {
                var obj: GObject = this._children[i];
                if ((obj instanceof GButton) && obj != g)
                    obj.selected = false;
            }
        }
    }

    public selectAll(): void {
        this.checkVirtualList();

        var last: number = -1;
        var i: number;
        if (this._virtual) {
            for (i = 0; i < this._realNumItems; i++) {
                var ii: ItemInfo = this._virtualItems[i];
                if ((ii.obj instanceof GButton) && !ii.obj.selected) {
                    ii.obj.selected = true;
                    last = i;
                }
                ii.selected = true;
            }
        }
        else {
            var cnt: number = this._children.length;
            for (i = 0; i < cnt; i++) {
                var obj: GObject = this._children[i];
                if ((obj instanceof GButton) && !obj.selected) {
                    obj.selected = true;
                    last = i;
                }
            }
        }

        if (last != -1)
            this.updateSelectionController(last);
    }

    public selectNone(): void {
        this.clearSelection();
    }

    public selectReverse(): void {
        this.checkVirtualList();

        var last: number = -1;
        var i: number;
        if (this._virtual) {
            for (i = 0; i < this._realNumItems; i++) {
                var ii: ItemInfo = this._virtualItems[i];
                if (ii.obj instanceof GButton) {
                    ii.obj.selected = !ii.obj.selected;
                    if (ii.obj.selected)
                        last = i;
                }
                ii.selected = !ii.selected;
            }
        }
        else {
            var cnt: number = this._children.length;
            for (i = 0; i < cnt; i++) {
                var obj: GObject = this._children[i];
                if (obj instanceof GButton) {
                    obj.selected = !obj.selected;
                    if (obj.selected)
                        last = i;
                }
            }
        }

        if (last != -1)
            this.updateSelectionController(last);
    }

    public handleArrowKey(dir: number): void {
        var index: number = this.selectedIndex;
        if (index == -1)
            return;

        switch (dir) {
            case 1://up
                if (this._layout == ListLayoutType.SingleColumn || this._layout == ListLayoutType.FlowVertical) {
                    index--;
                    if (index >= 0) {
                        this.clearSelection();
                        this.addSelection(index, true);
                    }
                }
                else if (this._layout == ListLayoutType.FlowHorizontal || this._layout == ListLayoutType.Pagination) {
                    var current: GObject = this._children[index];
                    var k: number = 0;
                    for (var i: number = index - 1; i >= 0; i--) {
                        var obj: GObject = this._children[i];
                        if (obj.y != current.y) {
                            current = obj;
                            break;
                        }
                        k++;
                    }
                    for (; i >= 0; i--) {
                        obj = this._children[i];
                        if (obj.y != current.y) {
                            this.clearSelection();
                            this.addSelection(i + k + 1, true);
                            break;
                        }
                    }
                }
                break;

            case 3://right
                if (this._layout == ListLayoutType.SingleRow || this._layout == ListLayoutType.FlowHorizontal || this._layout == ListLayoutType.Pagination) {
                    index++;
                    if (index < this.numItems) {
                        this.clearSelection();
                        this.addSelection(index, true);
                    }
                }
                else if (this._layout == ListLayoutType.FlowVertical) {
                    current = this._children[index];
                    k = 0;
                    var cnt: number = this._children.length;
                    for (i = index + 1; i < cnt; i++) {
                        obj = this._children[i];
                        if (obj.x != current.x) {
                            current = obj;
                            break;
                        }
                        k++;
                    }
                    for (; i < cnt; i++) {
                        obj = this._children[i];
                        if (obj.x != current.x) {
                            this.clearSelection();
                            this.addSelection(i - k - 1, true);
                            break;
                        }
                    }
                }
                break;

            case 5://down
                if (this._layout == ListLayoutType.SingleColumn || this._layout == ListLayoutType.FlowVertical) {
                    index++;
                    if (index < this.numItems) {
                        this.clearSelection();
                        this.addSelection(index, true);
                    }
                }
                else if (this._layout == ListLayoutType.FlowHorizontal || this._layout == ListLayoutType.Pagination) {
                    current = this._children[index];
                    k = 0;
                    cnt = this._children.length;
                    for (i = index + 1; i < cnt; i++) {
                        obj = this._children[i];
                        if (obj.y != current.y) {
                            current = obj;
                            break;
                        }
                        k++;
                    }
                    for (; i < cnt; i++) {
                        obj = this._children[i];
                        if (obj.y != current.y) {
                            this.clearSelection();
                            this.addSelection(i - k - 1, true);
                            break;
                        }
                    }
                }
                break;

            case 7://left
                if (this._layout == ListLayoutType.SingleRow || this._layout == ListLayoutType.FlowHorizontal || this._layout == ListLayoutType.Pagination) {
                    index--;
                    if (index >= 0) {
                        this.clearSelection();
                        this.addSelection(index, true);
                    }
                }
                else if (this._layout == ListLayoutType.FlowVertical) {
                    current = this._children[index];
                    k = 0;
                    for (i = index - 1; i >= 0; i--) {
                        obj = this._children[i];
                        if (obj.x != current.x) {
                            current = obj;
                            break;
                        }
                        k++;
                    }
                    for (; i >= 0; i--) {
                        obj = this._children[i];
                        if (obj.x != current.x) {
                            this.clearSelection();
                            this.addSelection(i + k + 1, true);
                            break;
                        }
                    }
                }
                break;
        }
    }

    protected __clickItem(pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject): void {
        if ((this._scrollPane && this._scrollPane.isDragged) || !gameObject || !gameObject[0] || Math.round(pointer.downX) !== Math.round(pointer.upX)
            || Math.round(pointer.downY) !== Math.round(pointer.upY))
            return;
        let item: GObject = <GObject>(gameObject[0]["$owner"]);
        // 如果clickitem的父对象为空，不可能为glist则直接跳出
        if (!item) return;
        let boo = false;
        let target = gameObject[0];
        while (!boo) {
            if ((item.parent && (item.parent.type === ObjectType.List || item.parent.type === ObjectType.Tree || item.parent.type == ObjectType.ComboBox)) || item.type === ObjectType.List || item.type === ObjectType.Tree || item.type === ObjectType.ComboBox) {
                target = item.displayObject;
                boo = true;
            } else {
                item = item.parent;
                if (!item || !item.parent) {
                    boo = true;
                } else {
                    boo = false;
                }
            }
        }
        // 如果clickitem的父对象为空，不可能为glist则直接跳出
        if (!item || !item.parent) return;
        this.setSelectionOnEvent(item, { target });

        if (this._scrollPane && this.scrollItemToViewOnClick)
            this._scrollPane.scrollToView(item, true);

        this.dispatchItemEvent(item, Events.createEvent(Events.CLICK_ITEM, this.displayObject, { target, touchId: pointer.id }));
    }

    protected dispatchItemEvent(item: GObject, evt: any): void {
        this.displayObject.emit(Events.CLICK_ITEM, item, evt);
    }

    protected setSelectionOnEvent(item: GObject, evt: any): void {
        if (!(item instanceof GButton) || this._selectionMode == ListSelectionMode.None)
            return;

        var dontChangeLastIndex: boolean = false;
        var index: number = this.childIndexToItemIndex(this.getChildIndex(item));

        if (this._selectionMode == ListSelectionMode.Single) {
            if (!item.selected) {
                this.clearSelectionExcept(item);
                item.selected = true;
            }
        }
        else {
            if (this.shiftKey) {
                if (!item.selected) {
                    if (this._lastSelectedIndex != -1) {
                        var min: number = Math.min(this._lastSelectedIndex, index);
                        var max: number = Math.max(this._lastSelectedIndex, index);
                        max = Math.min(max, this.numItems - 1);
                        var i: number;
                        if (this._virtual) {
                            for (i = min; i <= max; i++) {
                                var ii: ItemInfo = this._virtualItems[i];
                                if (ii.obj instanceof GButton)
                                    ii.obj.selected = true;
                                ii.selected = true;
                            }
                        }
                        else {
                            for (i = min; i <= max; i++) {
                                var obj: GObject = this.getChildAt(i);
                                if (obj instanceof GButton)
                                    obj.selected = true;
                            }
                        }

                        dontChangeLastIndex = true;
                    }
                    else {
                        item.selected = true;
                    }
                }
            }
            else if (this.ctrlKey || this._selectionMode == ListSelectionMode.Multiple_SingleClick) {
                item.selected = !item.selected;
            }
            else {
                if (!item.selected) {
                    this.clearSelectionExcept(item);
                    item.selected = true;
                }
                else
                    this.clearSelectionExcept(item);
            }
        }

        if (!dontChangeLastIndex)
            this._lastSelectedIndex = index;

        if (item.selected)
            this.updateSelectionController(index);
    }

    public resizeToFit(itemCount?: number, minSize?: number): void {
        if (itemCount == null) itemCount = 100000;
        minSize = minSize || 0;
        this.ensureBoundsCorrect();

        var curCount: number = this.numItems;
        if (itemCount > curCount)
            itemCount = curCount;

        if (this._virtual) {
            var lineCount: number = Math.ceil(itemCount / this._curLineItemCount);
            if (this._layout == ListLayoutType.SingleColumn || this._layout == ListLayoutType.FlowHorizontal)
                this.viewHeight = lineCount * this._itemSize.y + Math.max(0, lineCount - 1) * this._lineGap;
            else
                this.viewWidth = lineCount * this._itemSize.x + Math.max(0, lineCount - 1) * this._columnGap;
        }
        else if (itemCount == 0) {
            if (this._layout == ListLayoutType.SingleColumn || this._layout == ListLayoutType.FlowHorizontal)
                this.viewHeight = minSize;
            else
                this.viewWidth = minSize;
        }
        else {
            var i: number = itemCount - 1;
            var obj: GObject = null;
            while (i >= 0) {
                obj = this.getChildAt(i);
                if (!this.foldInvisibleItems || obj.visible)
                    break;
                i--;
            }
            if (i < 0) {
                if (this._layout == ListLayoutType.SingleColumn || this._layout == ListLayoutType.FlowHorizontal)
                    this.viewHeight = minSize;
                else
                    this.viewWidth = minSize;
            }
            else {
                var size: number = 0;
                if (this._layout == ListLayoutType.SingleColumn || this._layout == ListLayoutType.FlowHorizontal) {
                    size = obj.y + obj.height;
                    if (size < minSize)
                        size = minSize;
                    this.viewHeight = size;
                }
                else {
                    size = obj.x + obj.width;
                    if (size < minSize)
                        size = minSize;
                    this.viewWidth = size;
                }
            }
        }
    }

    public getMaxItemWidth(): number {
        var cnt: number = this._children.length;
        var max: number = 0;
        for (var i: number = 0; i < cnt; i++) {
            var child: GObject = this.getChildAt(i);
            if (child.width > max)
                max = child.width;
        }
        return max;
    }

    protected handleSizeChanged(): void {
        super.handleSizeChanged();

        this.setBoundsChangedFlag();
        if (this._virtual)
            this.setVirtualListChangedFlag(true);
    }

    public handleControllerChanged(c: Controller): void {
        super.handleControllerChanged(c);

        if (this._selectionController == c)
            this.selectedIndex = c.selectedIndex;
    }

    protected updateSelectionController(index: number): void {
        if (this._selectionController && !this._selectionController.changing
            && index < this._selectionController.pageCount) {
            var c: Controller = this._selectionController;
            this._selectionController = null;
            c.selectedIndex = index;
            this._selectionController = c;
        }
    }

    protected shouldSnapToNext(dir: number, delta: number, size: number): boolean {
        return dir < 0 && delta > UIConfig.defaultScrollSnappingThreshold * size
            || dir > 0 && delta > (1 - UIConfig.defaultScrollSnappingThreshold) * size
            || dir == 0 && delta > size / 2;
    }

    public getSnappingPositionWithDir(xValue: number, yValue: number, xDir: number, yDir: number, result?: Phaser.Geom.Point): Phaser.Geom.Point {
        if (this._virtual) {
            if (!result)
                result = new Phaser.Geom.Point();
            var saved: number;
            var index: number;
            var size: number;
            if (this._layout == ListLayoutType.SingleColumn || this._layout == ListLayoutType.FlowHorizontal) {
                saved = yValue;
                s_n = yValue;
                const pos1 = this.getIndexOnPos1(false);
                index = pos1 < 0 ? 0 : pos1;
                yValue = s_n;
                if (index < this._virtualItems.length && index < this._realNumItems) {
                    size = this._virtualItems[index].height;
                    if (this.shouldSnapToNext(yDir, saved - yValue, size))
                        yValue += size + this._lineGap;
                }
            }
            else if (this._layout == ListLayoutType.SingleRow || this._layout == ListLayoutType.FlowVertical) {
                saved = xValue;
                s_n = xValue;
                index = this.getIndexOnPos2(false);
                xValue = s_n;
                if (index < this._virtualItems.length && index < this._realNumItems) {
                    size = this._virtualItems[index].width;
                    if (this.shouldSnapToNext(xDir, saved - xValue, size))
                        xValue += size + this._columnGap;
                }
            }
            else {
                saved = xValue;
                s_n = xValue;
                index = this.getIndexOnPos3(false);
                xValue = s_n;
                if (index < this._virtualItems.length && index < this._realNumItems) {
                    size = this._virtualItems[index].width;
                    if (this.shouldSnapToNext(xDir, saved - xValue, size))
                        xValue += size + this._columnGap;
                }
            }

            result.x = xValue;
            result.y = yValue;
            return result;
        }
        else
            return super.getSnappingPositionWithDir(xValue, yValue, xDir, yDir, result);
    }

    public scrollToView(index: number, ani?: boolean, setFirst?: boolean): void {
        if (this._virtual) {
            if (this._numItems == 0)
                return;

            this.checkVirtualList();

            if (index >= this._virtualItems.length)
                throw new Error("Invalid child index: " + index + ">" + this._virtualItems.length);

            if (this._loop)
                index = Math.floor(this._firstIndex / this._numItems) * this._numItems + index;

            var rect: Phaser.Geom.Rectangle;
            var ii: ItemInfo = this._virtualItems[index];
            var pos: number = 0;
            var i: number;
            if (this._layout == ListLayoutType.SingleColumn || this._layout == ListLayoutType.FlowHorizontal) {
                for (i = this._curLineItemCount - 1; i < index; i += this._curLineItemCount)
                    pos += this._virtualItems[i].height + this._lineGap;
                rect = new Phaser.Geom.Rectangle(0, pos, this._itemSize.x, ii.height);
            }
            else if (this._layout == ListLayoutType.SingleRow || this._layout == ListLayoutType.FlowVertical) {
                for (i = this._curLineItemCount - 1; i < index; i += this._curLineItemCount)
                    pos += this._virtualItems[i].width + this._columnGap;
                rect = new Phaser.Geom.Rectangle(pos, 0, ii.width, this._itemSize.y);
            }
            else {
                var page: number = index / (this._curLineItemCount * this._curLineItemCount2);
                rect = new Phaser.Geom.Rectangle(page * this.viewWidth + (index % this._curLineItemCount) * (ii.width + this._columnGap),
                    (index / this._curLineItemCount) % this._curLineItemCount2 * (ii.height + this._lineGap),
                    ii.width, ii.height);
            }

            if (this._scrollPane)
                this._scrollPane.scrollToView(rect, ani, setFirst);
        }
        else {
            var obj: GObject = this.getChildAt(index);
            if (this._scrollPane)
                this._scrollPane.scrollToView(obj, ani, setFirst);
            else if (this._parent && this._parent.scrollPane)
                this._parent.scrollPane.scrollToView(obj, ani, setFirst);
        }
    }

    public getFirstChildInView(): number {
        return this.childIndexToItemIndex(super.getFirstChildInView());
    }

    public childIndexToItemIndex(index: number): number {
        if (!this._virtual)
            return index;

        if (this._layout == ListLayoutType.Pagination) {
            for (var i: number = this._firstIndex; i < this._realNumItems; i++) {
                if (this._virtualItems[i].obj) {
                    index--;
                    if (index < 0)
                        return i;
                }
            }

            return index;
        }
        else {
            index += this._firstIndex;
            if (this._loop && this._numItems > 0)
                index = index % this._numItems;

            return index;
        }
    }

    public itemIndexToChildIndex(index: number): number {
        if (!this._virtual)
            return index;

        if (this._layout == ListLayoutType.Pagination) {
            return this.getChildIndex(this._virtualItems[index].obj);
        }
        else {
            if (this._loop && this._numItems > 0) {
                var j: number = this._firstIndex % this._numItems;
                if (index >= j)
                    index = index - j;
                else
                    index = this._numItems - j + index;
            }
            else
                index -= this._firstIndex;

            return index;
        }
    }

    public setVirtual(): Promise<void> {
        return new Promise((resolve, reject) => {
            this._setVirtual(false).then(() => {
                resolve();
            }).catch((error) => {
                reject();
            })
        });
    }

    /**
     * Set the list to be virtual list, and has loop behavior.
     */
    public setVirtualAndLoop(): Promise<void> {
        return new Promise((resolve, reject) => {
            this._setVirtual(true).then(() => {
                resolve();
            }).catch((error) => {
                reject();
            })
        });
    }

    protected _setVirtual(loop: boolean): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this._virtual) {
                if (this._scrollPane == null)
                    throw new Error("Virtual list must be scrollable!");

                if (loop) {
                    if (this._layout == ListLayoutType.FlowHorizontal || this._layout == ListLayoutType.FlowVertical)
                        throw new Error("Loop list instanceof not supported for FlowHorizontal or FlowVertical this.layout!");

                    this._scrollPane.bouncebackEffect = false;
                }

                this._virtual = true;
                this._loop = loop;
                this._virtualItems = new Array<ItemInfo>();
                this.removeChildrenToPool();

                const fun = () => {
                    if (this._layout == ListLayoutType.SingleColumn || this._layout == ListLayoutType.FlowHorizontal) {
                        this._scrollPane.scrollStep = this._itemSize.y;
                        if (this._loop)
                            this._scrollPane._loop = 2;
                    }
                    else {
                        this._scrollPane.scrollStep = this._itemSize.x;
                        if (this._loop)
                            this._scrollPane._loop = 1;
                    }

                    this.on(Events.SCROLL, this.__scrolled, this);
                    this.setVirtualListChangedFlag(true);
                };

                if (this._itemSize == null) {
                    this._itemSize = new Phaser.Geom.Point();
                    this.getFromPool(null).then((obj) => {
                        if (obj == null) {
                            reject("Virtual List must have a default list item resource.");
                            // throw new Error("Virtual List must have a default list item resource.");
                        }
                        else {
                            this._itemSize.x = obj.width;
                            this._itemSize.y = obj.height;
                        }
                        this.returnToPool(obj);
                        fun();
                        resolve()
                    });
                } else {
                    fun();
                    resolve();
                }
            }
        });
    }

    /**
     * Set the list item count. 
     * If the list instanceof not virtual, specified number of items will be created. 
     * If the list instanceof virtual, only items in view will be created.
     */
    public get numItems(): number {
        if (this._virtual)
            return this._numItems;
        else
            return this._children.length;
    }

    public set numItems(value: number) {
        var i: number;

        if (this._virtual) {
            if (this.itemRenderer == null)
                throw new Error("set itemRenderer first!");

            this._numItems = value;
            if (this._loop)
                this._realNumItems = this._numItems * 6;//设置6倍数量，用于循环滚动
            else
                this._realNumItems = this._numItems;

            //_virtualItems的设计是只增不减的
            var oldCount: number = this._virtualItems.length;
            if (this._realNumItems > oldCount) {
                for (i = oldCount; i < this._realNumItems; i++) {
                    var ii: ItemInfo = {
                        width: this._itemSize.x,
                        height: this._itemSize.y,
                        updateFlag: 0
                    };

                    this._virtualItems.push(ii);
                }
            }
            else {
                for (i = this._realNumItems; i < oldCount; i++)
                    this._virtualItems[i].selected = false;
            }

            if (this._virtualListChanged != 0) {
                if (this._refreshListTime) {
                    this.scene.time.removeEvent(this._refreshListEvent);
                    // this._refreshListTime.remove(false);
                    this._refreshListTime = null;
                }
                //Laya.timer.clear(this, this._refreshVirtualList);
            }
            //立即刷新
            this._refreshVirtualList();
        }
        else {
            var cnt: number = this._children.length;
            if (value > cnt) {
                for (i = cnt; i < value; i++) {
                    if (this.itemProvider == null)
                        this.addItemFromPool();
                    else
                        this.addItemFromPool(this.itemProvider.runWith(i));
                }
            }
            else {
                this.removeChildrenToPool(value, cnt);
            }

            if (this.itemRenderer != null) {
                for (i = 0; i < value; i++)
                    this.itemRenderer.runWith([i, this.getChildAt(i)]);
            }
        }
    }

    public refreshVirtualList(): void {
        this.setVirtualListChangedFlag(false);
    }

    protected checkVirtualList(): void {
        if (this._virtualListChanged != 0) {
            this._refreshVirtualList();
            if (this._refreshListTime) {
                this.scene.time.removeEvent(this._refreshListEvent);
                // this._refreshListTime.remove(false);
                this._refreshListTime = null;
            }
            // Laya.timer.clear(this, this._refreshVirtualList);
        }
    }

    protected setVirtualListChangedFlag(layoutChanged?: boolean): void {
        if (layoutChanged)
            this._virtualListChanged = 2;
        else if (this._virtualListChanged == 0)
            this._virtualListChanged = 1;
        if (!this._refreshListTime) this._refreshListTime = this.scene.time.addEvent(this._refreshListEvent);
        // Laya.timer.callLater(this, this._refreshVirtualList);
    }

    protected _refreshVirtualList(): void {
        if (!this._displayObject)
            return;

        var layoutChanged: boolean = this._virtualListChanged == 2;
        this._virtualListChanged = 0;
        this._eventLocked = true;

        if (layoutChanged) {
            if (this._layout == ListLayoutType.SingleColumn || this._layout == ListLayoutType.SingleRow)
                this._curLineItemCount = 1;
            else if (this._layout == ListLayoutType.FlowHorizontal) {
                if (this._columnCount > 0)
                    this._curLineItemCount = this._columnCount;
                else {
                    this._curLineItemCount = Math.floor((this._scrollPane.viewWidth + this._columnGap) / (this._itemSize.x + this._columnGap));
                    if (this._curLineItemCount <= 0)
                        this._curLineItemCount = 1;
                }
            }
            else if (this._layout == ListLayoutType.FlowVertical) {
                if (this._lineCount > 0)
                    this._curLineItemCount = this._lineCount;
                else {
                    this._curLineItemCount = Math.floor((this._scrollPane.viewHeight + this._lineGap) / (this._itemSize.y + this._lineGap));
                    if (this._curLineItemCount <= 0)
                        this._curLineItemCount = 1;
                }
            }
            else //pagination
            {
                if (this._columnCount > 0)
                    this._curLineItemCount = this._columnCount;
                else {
                    this._curLineItemCount = Math.floor((this._scrollPane.viewWidth + this._columnGap) / (this._itemSize.x + this._columnGap));
                    if (this._curLineItemCount <= 0)
                        this._curLineItemCount = 1;
                }

                if (this._lineCount > 0)
                    this._curLineItemCount2 = this._lineCount;
                else {
                    this._curLineItemCount2 = Math.floor((this._scrollPane.viewHeight + this._lineGap) / (this._itemSize.y + this._lineGap));
                    if (this._curLineItemCount2 <= 0)
                        this._curLineItemCount2 = 1;
                }
            }
        }

        var ch: number = 0, cw: number = 0;
        if (this._realNumItems > 0) {
            var i: number;
            var len: number = Math.ceil(this._realNumItems / this._curLineItemCount) * this._curLineItemCount;
            var len2: number = Math.min(this._curLineItemCount, this._realNumItems);
            if (this._layout == ListLayoutType.SingleColumn || this._layout == ListLayoutType.FlowHorizontal) {
                for (i = 0; i < len; i += this._curLineItemCount) {
                    const obj = this._virtualItems[i].obj;
                    ch += obj && obj.initHeight > this._virtualItems[i].height ? obj.initHeight + this._lineGap : this._virtualItems[i].height + this._lineGap;
                }

                if (ch > 0)
                    ch -= this._lineGap;

                if (this._autoResizeItem)
                    cw = this._scrollPane.viewWidth;
                else {
                    for (i = 0; i < len2; i++)
                        cw += this._virtualItems[i].width + this._columnGap;
                    if (cw > 0)
                        cw -= this._columnGap;
                }
            }
            else if (this._layout == ListLayoutType.SingleRow || this._layout == ListLayoutType.FlowVertical) {
                for (i = 0; i < len; i += this._curLineItemCount) {
                    const obj = this._virtualItems[i].obj;
                    cw += obj && obj.initWidth > this._virtualItems[i].width ? obj.initWidth + this._columnGap : this._virtualItems[i].width + this._columnGap;
                }

                if (cw > 0)
                    cw -= this._columnGap;

                if (this._autoResizeItem)
                    ch = this._scrollPane.viewHeight;
                else {
                    for (i = 0; i < len2; i++)
                        ch += this._virtualItems[i].height + this._lineGap;
                    if (ch > 0)
                        ch -= this._lineGap;
                }
            }
            else {
                var pageCount: number = Math.ceil(len / (this._curLineItemCount * this._curLineItemCount2));
                cw = pageCount * this.viewWidth;
                ch = this.viewHeight;
            }
        }

        this._virtualWidth = cw;
        this._virtualHeight = ch;

        this.handleAlign(cw, ch);
        this._scrollPane.setContentSize(cw, ch);

        this._eventLocked = false;

        this.handleScroll(true);
    }

    protected __scrolled(evt: any): void {
        this.handleScroll(false);
    }

    protected getIndexOnPos1(forceUpdate: boolean): number {
        if (this._realNumItems < this._curLineItemCount) {
            s_n = 0;
            return 0;
        }

        var i: number;
        var pos2: number;
        var pos3: number;

        if (this.numChildren > 0 && !forceUpdate) {
            pos2 = this.getChildAt(0).y;
            if (pos2 > s_n) {
                for (i = this._firstIndex - this._curLineItemCount; i >= 0; i -= this._curLineItemCount) {
                    pos2 -= (this._virtualItems[i].height + this._lineGap);
                    if (pos2 <= s_n) {
                        s_n = pos2;
                        return i;
                    }
                }

                s_n = 0;
                return 0;
            }
            else {
                for (i = this._firstIndex; i < this._realNumItems; i += this._curLineItemCount) {
                    pos3 = pos2 + this._virtualItems[i].height + this._lineGap;
                    if (pos3 > s_n) {
                        s_n = pos2;
                        return i;
                    }
                    pos2 = pos3;
                }

                s_n = pos2;
                return this._realNumItems - this._curLineItemCount;
            }
        }
        else {
            pos2 = 0;
            for (i = 0; i < this._realNumItems; i += this._curLineItemCount) {
                pos3 = pos2 + this._virtualItems[i].height + this._lineGap;
                if (pos3 > s_n) {
                    s_n = pos2;
                    return i;
                }
                pos2 = pos3;
            }

            s_n = pos2;
            return this._realNumItems - this._curLineItemCount;
        }
    }

    protected getIndexOnPos2(forceUpdate: boolean): number {
        if (this._realNumItems < this._curLineItemCount) {
            s_n = 0;
            return 0;
        }

        var i: number;
        var pos2: number;
        var pos3: number;

        if (this.numChildren > 0 && !forceUpdate) {
            pos2 = this.getChildAt(0).x;
            if (pos2 > s_n) {
                for (i = this._firstIndex - this._curLineItemCount; i >= 0; i -= this._curLineItemCount) {
                    pos2 -= (this._virtualItems[i].width + this._columnGap);
                    if (pos2 <= s_n) {
                        s_n = pos2;
                        return i;
                    }
                }

                s_n = 0;
                return 0;
            }
            else {
                for (i = this._firstIndex; i < this._realNumItems; i += this._curLineItemCount) {
                    pos3 = pos2 + this._virtualItems[i].width + this._columnGap;
                    if (pos3 > s_n) {
                        s_n = pos2;
                        return i;
                    }
                    pos2 = pos3;
                }

                s_n = pos2;
                return this._realNumItems - this._curLineItemCount;
            }
        }
        else {
            pos2 = 0;
            for (i = 0; i < this._realNumItems; i += this._curLineItemCount) {
                pos3 = pos2 + this._virtualItems[i].width + this._columnGap;
                if (pos3 > s_n) {
                    s_n = pos2;
                    return i;
                }
                pos2 = pos3;
            }

            s_n = pos2;
            return this._realNumItems - this._curLineItemCount;
        }
    }

    protected getIndexOnPos3(forceUpdate: boolean): number {
        if (this._realNumItems < this._curLineItemCount) {
            s_n = 0;
            return 0;
        }

        var viewWidth: number = this.viewWidth;
        var page: number = Math.floor(s_n / viewWidth);
        var startIndex: number = page * (this._curLineItemCount * this._curLineItemCount2);
        var pos2: number = page * viewWidth;
        var i: number;
        var pos3: number;
        for (i = 0; i < this._curLineItemCount; i++) {
            pos3 = pos2 + this._virtualItems[startIndex + i].width + this._columnGap;
            if (pos3 > s_n) {
                s_n = pos2;
                return startIndex + i;
            }
            pos2 = pos3;
        }

        s_n = pos2;
        return startIndex + this._curLineItemCount - 1;
    }

    protected handleScroll(forceUpdate: boolean): void {
        if (this._eventLocked)
            return;

        if (this._layout == ListLayoutType.SingleColumn || this._layout == ListLayoutType.FlowHorizontal) {
            var enterCounter: number = 0;
            const fun0 = () => {
                this.handleScroll1(forceUpdate).then((boo) => {
                    if (boo) {
                        enterCounter++;
                        forceUpdate = false;
                        if (enterCounter > 20) {
                            console.log("FairyGUI: list will never be <the> filled item renderer function always returns a different size.");
                        }
                        fun0();
                    } else {
                        this.handleArchOrder1();
                        this._boundsChanged = false;
                    }
                })
            }
            fun0();

            // while (this.handleScroll1(forceUpdate)) {
            //     enterCounter++;
            //     forceUpdate = false;
            //     if (enterCounter > 20) {
            //         console.log("FairyGUI: list will never be <the> filled item renderer function always returns a different size.");
            //         break;
            //     }
            // }
            // this.handleArchOrder1();
        }
        else if (this._layout == ListLayoutType.SingleRow || this._layout == ListLayoutType.FlowVertical) {
            enterCounter = 0;
            const fun1 = () => {
                this.handleScroll2(forceUpdate).then((boo) => {
                    if (boo) {
                        enterCounter++;
                        forceUpdate = false;
                        if (enterCounter > 20) {
                            console.log("FairyGUI: list will never be <the> filled item renderer function always returns a different size.");
                        }
                        fun1();
                    } else {
                        this.handleArchOrder2();
                        this._boundsChanged = false;
                    }
                });
            }
            fun1();
            // while (this.handleScroll2(forceUpdate)) {
            //     enterCounter++;
            //     forceUpdate = false;
            //     if (enterCounter > 20) {
            //         console.log("FairyGUI: list will never be <the> filled item renderer function always returns a different size.");
            //         break;
            //     }
            // }
            // this.handleArchOrder2();
        }
        else {
            this.handleScroll3(forceUpdate).then(() => {
                this._boundsChanged = false;
            });
        }
    }

    protected handleScroll1(forceUpdate: boolean): Promise<boolean> {
        return new Promise((reslove, reject) => {
            var pos: number = this._scrollPane.scrollingPosY / this._dprOffset;
            var max: number = pos + this._scrollPane.viewHeight;
            var end: boolean = max == this._scrollPane.contentHeight;//这个标志表示当前需要滚动到最末，无论内容变化大小
            // console.log("scrollPosY", pos);
            //寻找当前位置的第一条项目
            s_n = pos;
            // const singleHei = this._virtualItems[0].height * this._virtualItems.length + this._lineGap * (this._virtualItems.length - 1);
            // const viewNum = Math.floor(this._scrollPane.viewHeight / singleHei);
            const pos1 = this.getIndexOnPos1(forceUpdate);
            var newFirstIndex: number = pos1 < 0 ? 0 : pos1;
            pos = s_n;
            if (newFirstIndex == this._firstIndex && !forceUpdate) {
                reslove(false);
                return;
            }

            console.log("index:", this._firstIndex);
            var oldFirstIndex: number = this._firstIndex;
            // console.log("newFirstIndex ===>", newFirstIndex);
            // console.log("oldFirstIndex ===>", oldFirstIndex);
            this._firstIndex = newFirstIndex;
            var curIndex: number = newFirstIndex;
            var forward: boolean = oldFirstIndex > newFirstIndex;
            var childCount: number = this.numChildren;
            var lastIndex: number = oldFirstIndex + childCount - 1;
            var reuseIndex: number = forward ? lastIndex : oldFirstIndex;
            var curX: number = 0, curY: number = pos;
            var needRender: boolean;
            var deltaSize: number = 0;
            var firstItemDeltaSize: number = 0;
            var url: string = this._defaultItem;
            var ii: ItemInfo, ii2: ItemInfo;
            var i: number, j: number;
            var partSize: number = (this._scrollPane.viewWidth - this._columnGap * (this._curLineItemCount - 1)) / this._curLineItemCount;

            this.itemInfoVer++;
            const fun2 = () => {
                // 等待数据组织完成再处理
                childCount = this.numChildren;
                for (i = 0; i < childCount; i++) {
                    ii = this._virtualItems[oldFirstIndex + i];
                    if (!ii) continue;
                    if (ii.updateFlag != this.itemInfoVer && ii.obj) {
                        if (ii.obj instanceof GButton)
                            ii.selected = ii.obj.selected;
                        this.removeChildToPool(ii.obj);
                        ii.obj = null;
                    }
                }

                childCount = this._children.length;
                for (i = 0; i < childCount; i++) {
                    if (!this._virtualItems[newFirstIndex + i]) continue;
                    var obj: GObject = this._virtualItems[newFirstIndex + i].obj;
                    if (!obj) continue;
                    if (this._children[i] != obj)
                        this.setChildIndex(obj, i);
                }

                if (deltaSize != 0 || firstItemDeltaSize != 0)
                    this._scrollPane.changeContentSizeOnScrolling(0, deltaSize, 0, firstItemDeltaSize);

                if (curIndex > 0 && this.numChildren > 0 && this._container.y <= 0 && this.getChildAt(0).y > -this._container.y)//最后一页没填满！
                {
                    reslove(true);
                }
                else {
                    reslove(false);
                }
            }
            const fun1 = () => {
                if (needRender) {
                    if (this._autoResizeItem) {
                        if (this._layout == ListLayoutType.SingleColumn || this._columnCount > 0) {
                            ii.obj.setSize(partSize, ii.obj.initHeight * GRoot.uiScale, true);
                        } else if (this._layout == ListLayoutType.FlowHorizontal && GRoot.uiScale < 1) {
                            ii.obj.setSize(ii.obj.initWidth * GRoot.uiScale, ii.obj.initHeight * GRoot.uiScale, true);
                        }
                    }


                    this.itemRenderer.runWith([curIndex % this._numItems, ii.obj]);
                    // console.log("handle1 ===>", curIndex);
                    if (curIndex % this._curLineItemCount == 0) {
                        deltaSize += Math.ceil(ii.obj.height) - ii.height;
                        if (curIndex == newFirstIndex && oldFirstIndex > newFirstIndex) {
                            //当内容向下滚动时，如果新出现的项目大小发生变化，需要做一个位置补偿，才不会导致滚动跳动
                            firstItemDeltaSize = Math.ceil(ii.obj.height) - ii.height;
                        }
                    }
                    ii.width = Math.ceil(ii.obj.width);
                    ii.height = Math.ceil(ii.obj.height);
                }

                ii.updateFlag = this.itemInfoVer;
                ii.obj.setXY(curX / GRoot.uiScale, curY);
                if (curIndex == newFirstIndex) //要显示多1条才不会穿帮
                    max += ii.obj.initHeight;

                curX += ii.width + this._columnGap;

                if (curIndex % this._curLineItemCount == this._curLineItemCount - 1) {
                    curX = 0;
                    curY += ii.obj.initHeight + this._lineGap;
                }
                curIndex++;
                if (curIndex < this._realNumItems && (end || curY < max)) {
                    fun0();
                } else {
                    fun2();
                }
            }
            const fun0 = () => {
                ii = this._virtualItems[curIndex];

                if (ii.obj == null || forceUpdate) {
                    if (this.itemProvider != null) {
                        url = this.itemProvider.runWith(curIndex % this._numItems);
                        if (url == null)
                            url = this._defaultItem;
                        url = UIPackage.normalizeURL(url);
                    }

                    if (ii.obj && ii.obj.resourceURL != url) {
                        if (ii.obj instanceof GButton)
                            ii.selected = ii.obj.selected;
                        this.removeChildToPool(ii.obj);
                        ii.obj = null;
                    }
                }

                if (ii.obj == null) {
                    //搜索最适合的重用item，保证每次刷新需要新建或者重新render的item最少
                    if (forward) {
                        for (j = reuseIndex; j >= oldFirstIndex; j--) {
                            ii2 = this._virtualItems[j];
                            if (!ii2) continue;
                            if (ii2.obj && ii2.updateFlag != this.itemInfoVer && ii2.obj.resourceURL == url) {
                                if (ii2.obj instanceof GButton)
                                    ii2.selected = ii2.obj.selected;
                                ii.obj = ii2.obj;
                                ii2.obj = null;
                                if (j == reuseIndex)
                                    reuseIndex--;
                                break;
                            }
                        }
                    }
                    else {
                        for (j = reuseIndex; j <= lastIndex; j++) {
                            ii2 = this._virtualItems[j];
                            if (!ii2) continue;
                            if (ii2.obj && ii2.updateFlag != this.itemInfoVer && ii2.obj.resourceURL == url) {
                                if (ii2.obj instanceof GButton)
                                    ii2.selected = ii2.obj.selected;
                                ii.obj = ii2.obj;
                                ii2.obj = null;
                                if (j == reuseIndex)
                                    reuseIndex++;
                                break;
                            }
                        }
                    }

                    if (ii.obj) {
                        this.setChildIndex(ii.obj, forward ? curIndex - newFirstIndex : this.numChildren);
                        if (ii.obj instanceof GButton)
                            ii.obj.selected = ii.selected;

                        needRender = true;
                        fun1();
                    }
                    else {
                        this._pool.getObject(url).then((obj) => {
                            ii.obj = obj;
                            // const g = this.scene.make.graphics(undefined, false);
                            // g.clear();
                            // g.fillStyle(0xFFCC00);
                            // g.fillRoundedRect(0, 0, ii.obj.initWidth, ii.obj.initHeight - 4);
                            // (<Phaser.GameObjects.Container>ii.obj.displayObject).addAt(g, 0);
                            ii.obj.displayObject.setInteractive(new Phaser.Geom.Rectangle(0, 0, ii.obj.initWidth, ii.obj.initHeight), Phaser.Geom.Rectangle.Contains);
                            if (forward)
                                this.addChildAt(ii.obj, curIndex - newFirstIndex);
                            else
                                this.addChild(ii.obj);
                            if (ii.obj instanceof GButton)
                                ii.obj.selected = ii.selected;

                            needRender = true;
                            fun1();
                        });
                    }
                }
                else {
                    needRender = forceUpdate;
                    fun1();
                }
            }
            if (curIndex < this._realNumItems && (end || curY < max)) {
                fun0();
            } else {
                fun2();
            }

        });
    }

    public setBoundsChangedFlag(): void {
        if (!this._scrollPane && !this._trackBounds)
            return;

        if (!this._boundsChanged) {
            this._boundsChanged = true;
            if (!this._renderTime) this.scene.time.addEvent(this._renderEvent);
            //Laya.timer.callLater(this, this.__render);
        }
    }

    protected async handleScroll2(forceUpdate: boolean): Promise<boolean> {
        var pos: number = this._scrollPane.scrollingPosX / this._dprOffset;
        var max: number = pos + this._scrollPane.viewWidth;
        var end: boolean = pos == this._scrollPane.contentWidth;//这个标志表示当前需要滚动到最末，无论内容变化大小

        //寻找当前位置的第一条项目
        s_n = pos;
        var newFirstIndex: number = this.getIndexOnPos2(forceUpdate);
        pos = s_n;
        // console.log("pos ===>", pos, newFirstIndex);
        if (newFirstIndex == this._firstIndex && !forceUpdate)
            return false;

        var oldFirstIndex: number = this._firstIndex;
        this._firstIndex = newFirstIndex;
        var curIndex: number = newFirstIndex;
        var forward: boolean = oldFirstIndex > newFirstIndex;
        var childCount: number = this.numChildren;
        var lastIndex: number = oldFirstIndex + childCount - 1;
        var reuseIndex: number = forward ? lastIndex : oldFirstIndex;
        var curX: number = pos, curY: number = 0;
        var needRender: boolean;
        var deltaSize: number = 0;
        var firstItemDeltaSize: number = 0;
        var url: string = this._defaultItem;
        var ii: ItemInfo, ii2: ItemInfo;
        var i: number, j: number;
        var partSize: number = (this._scrollPane.viewHeight - this._lineGap * (this._curLineItemCount - 1)) / this._curLineItemCount;

        this.itemInfoVer++;

        while (curIndex < this._realNumItems && (end || curX < max)) {
            ii = this._virtualItems[curIndex];

            if (ii.obj == null || forceUpdate) {
                if (this.itemProvider != null) {
                    url = this.itemProvider.runWith(curIndex % this._numItems);
                    if (url == null)
                        url = this._defaultItem;
                    url = UIPackage.normalizeURL(url);
                }

                if (ii.obj && ii.obj.resourceURL != url) {
                    if (ii.obj instanceof GButton)
                        ii.selected = ii.obj.selected;
                    this.removeChildToPool(ii.obj);
                    ii.obj = null;
                }
            }

            if (ii.obj == null) {
                if (forward) {
                    for (j = reuseIndex; j >= oldFirstIndex; j--) {
                        ii2 = this._virtualItems[j];
                        if (ii2.obj && ii2.updateFlag != this.itemInfoVer && ii2.obj.resourceURL == url) {
                            if (ii2.obj instanceof GButton)
                                ii2.selected = ii2.obj.selected;
                            ii.obj = ii2.obj;
                            ii2.obj = null;
                            if (j == reuseIndex)
                                reuseIndex--;
                            break;
                        }
                    }
                }
                else {
                    for (j = reuseIndex; j <= lastIndex; j++) {
                        ii2 = this._virtualItems[j];
                        if (ii2.obj && ii2.updateFlag != this.itemInfoVer && ii2.obj.resourceURL == url) {
                            if (ii2.obj instanceof GButton)
                                ii2.selected = ii2.obj.selected;
                            ii.obj = ii2.obj;
                            ii2.obj = null;
                            if (j == reuseIndex)
                                reuseIndex++;
                            break;
                        }
                    }
                }

                if (ii.obj) {
                    this.setChildIndex(ii.obj, forward ? curIndex - newFirstIndex : this.numChildren);
                }
                else {
                    ii.obj = await this._pool.getObject(url);
                    if (forward)
                        this.addChildAt(ii.obj, curIndex - newFirstIndex);
                    else
                        this.addChild(ii.obj);

                }
                if (ii.obj instanceof GButton)
                    ii.obj.selected = ii.selected;

                needRender = true;
            }
            else {
                needRender = forceUpdate;
            }
            if (needRender) {
                if (this._autoResizeItem && (this._layout == ListLayoutType.SingleRow || this._lineCount > 0))
                    ii.obj.setSize(ii.obj.initWidth * GRoot.uiScale, partSize, true);

                this.itemRenderer.runWith([curIndex % this._numItems, ii.obj]);
                if (curIndex % this._curLineItemCount == 0) {
                    deltaSize += Math.ceil(ii.obj.width) - ii.width;
                    if (curIndex == newFirstIndex && oldFirstIndex > newFirstIndex) {
                        //当内容向下滚动时，如果新出现的一个项目大小发生变化，需要做一个位置补偿，才不会导致滚动跳动
                        firstItemDeltaSize = Math.ceil(ii.obj.width) - ii.width;
                    }
                }
                ii.width = Math.ceil(ii.obj.width);
                ii.height = Math.ceil(ii.obj.height);
            }

            ii.updateFlag = this.itemInfoVer;
            ii.obj.setXY(curX, curY);
            if (curIndex == newFirstIndex) //要显示多一条才不会穿帮
                max += ii.obj.initWidth;
            curY += ii.height + this._lineGap;
            // console.log("curY ===>", curY);
            if (curIndex % this._curLineItemCount == this._curLineItemCount - 1) {
                curY = 0;
                curX += ii.obj.initWidth + this._columnGap;
            }
            curIndex++;
        }

        for (i = 0; i < childCount; i++) {
            ii = this._virtualItems[oldFirstIndex + i];
            if (ii.updateFlag != this.itemInfoVer && ii.obj) {
                if (ii.obj instanceof GButton)
                    ii.selected = ii.obj.selected;
                this.removeChildToPool(ii.obj);
                ii.obj = null;
            }
        }

        childCount = this._children.length;
        for (i = 0; i < childCount; i++) {
            var obj: GObject = this._virtualItems[newFirstIndex + i].obj;
            if (this._children[i] != obj)
                this.setChildIndex(obj, i);
        }

        if (deltaSize != 0 || firstItemDeltaSize != 0)
            this._scrollPane.changeContentSizeOnScrolling(deltaSize, 0, firstItemDeltaSize, 0);

        if (curIndex > 0 && this.numChildren > 0 && this._container.x <= 0 && this.getChildAt(0).x > - this._container.x)//最后一页没填满！
            return true;
        else
            return false;
    }

    protected async handleScroll3(forceUpdate: boolean): Promise<void> {
        var pos: number = this._scrollPane.scrollingPosX / this._dprOffset;

        //寻找当前位置的第一条项目
        s_n = pos;
        var newFirstIndex: number = this.getIndexOnPos3(forceUpdate);
        pos = s_n;
        if (newFirstIndex == this._firstIndex && !forceUpdate)
            return;

        var oldFirstIndex: number = this._firstIndex;
        this._firstIndex = newFirstIndex;

        //分页模式不支持不等高，所以渲染满一页就好了

        var reuseIndex: number = oldFirstIndex;
        var virtualItemCount: number = this._virtualItems.length;
        var pageSize: number = this._curLineItemCount * this._curLineItemCount2;
        var startCol: number = newFirstIndex % this._curLineItemCount;
        var viewWidth: number = this.viewWidth;
        var page: number = Math.floor(newFirstIndex / pageSize);
        var startIndex: number = page * pageSize;
        var lastIndex: number = startIndex + pageSize * 2; //测试两页
        var needRender: boolean;
        var i: number;
        var ii: ItemInfo, ii2: ItemInfo;
        var col: number;
        var url: string = this._defaultItem;
        var partWidth: number = (this._scrollPane.viewWidth - this._columnGap * (this._curLineItemCount - 1)) / this._curLineItemCount;
        var partHeight: number = (this._scrollPane.viewHeight - this._lineGap * (this._curLineItemCount2 - 1)) / this._curLineItemCount2;

        this.itemInfoVer++;

        //先标记这次要用到的项目
        for (i = startIndex; i < lastIndex; i++) {
            if (i >= this._realNumItems)
                continue;

            col = i % this._curLineItemCount;
            if (i - startIndex < pageSize) {
                if (col < startCol)
                    continue;
            }
            else {
                if (col > startCol)
                    continue;
            }

            ii = this._virtualItems[i];
            ii.updateFlag = this.itemInfoVer;
        }

        var lastObj: GObject = null;
        var insertIndex: number = 0;
        for (i = startIndex; i < lastIndex; i++) {
            if (i >= this._realNumItems)
                continue;

            ii = this._virtualItems[i];
            if (ii.updateFlag != this.itemInfoVer)
                continue;

            if (ii.obj == null) {
                //寻找看有没有可重用的
                while (reuseIndex < virtualItemCount) {
                    ii2 = this._virtualItems[reuseIndex];
                    if (ii2.obj && ii2.updateFlag != this.itemInfoVer) {
                        if (ii2.obj instanceof GButton)
                            ii2.selected = ii2.obj.selected;
                        ii.obj = ii2.obj;
                        ii2.obj = null;
                        break;
                    }
                    reuseIndex++;
                }

                if (insertIndex == -1)
                    insertIndex = this.getChildIndex(lastObj) + 1;

                if (ii.obj == null) {
                    if (this.itemProvider != null) {
                        url = this.itemProvider.runWith(i % this._numItems);
                        if (url == null)
                            url = this._defaultItem;
                        url = UIPackage.normalizeURL(url);
                    }
                    ii.obj = await this._pool.getObject(url);
                    this.addChildAt(ii.obj, insertIndex);
                }
                else {
                    insertIndex = this.setChildIndexBefore(ii.obj, insertIndex);
                }
                insertIndex++;
                if (ii.obj instanceof GButton)
                    ii.obj.selected = ii.selected;

                needRender = true;

            }
            else {
                needRender = forceUpdate;
                insertIndex = -1;
                lastObj = ii.obj;
            }

            if (needRender) {
                if (this._autoResizeItem) {
                    if (this._curLineItemCount == this._columnCount && this._curLineItemCount2 == this._lineCount)
                        ii.obj.setSize(partWidth, partHeight, true);
                    else if (this._curLineItemCount == this._columnCount)
                        ii.obj.setSize(partWidth, ii.obj.initHeight * GRoot.uiScale, true);
                    else if (this._curLineItemCount2 == this._lineCount)
                        ii.obj.setSize(ii.obj.initWidth * GRoot.uiScale, partHeight, true);
                }

                this.itemRenderer.runWith([i % this._numItems, ii.obj]);
                ii.width = Math.ceil(ii.obj.width);
                ii.height = Math.ceil(ii.obj.height);
            }
        }

        //排列item
        var borderX: number = (startIndex / pageSize) * viewWidth;
        var xx: number = borderX;
        var yy: number = 0;
        var lineHeight: number = 0;
        for (i = startIndex; i < lastIndex; i++) {
            if (i >= this._realNumItems)
                continue;

            ii = this._virtualItems[i];
            if (ii.updateFlag == this.itemInfoVer)
                ii.obj.setXY(xx, yy);

            if (ii.height > lineHeight)
                lineHeight = ii.height;
            if (i % this._curLineItemCount == this._curLineItemCount - 1) {
                xx = borderX;
                yy += lineHeight + this._lineGap;
                lineHeight = 0;

                if (i == startIndex + pageSize - 1) {
                    borderX += viewWidth;
                    xx = borderX;
                    yy = 0;
                }
            }
            else
                xx += ii.width + this._columnGap;
        }

        //释放未使用的
        for (i = reuseIndex; i < virtualItemCount; i++) {
            ii = this._virtualItems[i];
            if (ii.updateFlag != this.itemInfoVer && ii.obj) {
                if (ii.obj instanceof GButton)
                    ii.selected = ii.obj.selected;
                this.removeChildToPool(ii.obj);
                ii.obj = null;
            }
        }
    }

    protected handleArchOrder1(): void {
        if (this.childrenRenderOrder == ChildrenRenderOrder.Arch) {
            var mid: number = this._scrollPane.posY + this.viewHeight / 2;
            var minDist: number = Number.POSITIVE_INFINITY;
            var dist: number = 0;
            var apexIndex: number = 0;
            var cnt: number = this.numChildren;
            for (var i: number = 0; i < cnt; i++) {
                var obj: GObject = this.getChildAt(i);
                if (!this.foldInvisibleItems || obj.visible) {
                    dist = Math.abs(mid - obj.y - obj.height / 2);
                    if (dist < minDist) {
                        minDist = dist;
                        apexIndex = i;
                    }
                }
            }
            this.apexIndex = apexIndex;
        }
    }

    protected handleArchOrder2(): void {
        if (this.childrenRenderOrder == ChildrenRenderOrder.Arch) {
            var mid: number = this._scrollPane.posX + this.viewWidth / 2;
            var minDist: number = Number.POSITIVE_INFINITY;
            var dist: number = 0;
            var apexIndex: number = 0;
            var cnt: number = this.numChildren;
            for (var i: number = 0; i < cnt; i++) {
                var obj: GObject = this.getChildAt(i);
                if (!this.foldInvisibleItems || obj.visible) {
                    dist = Math.abs(mid - obj.x - obj.width / 2);
                    if (dist < minDist) {
                        minDist = dist;
                        apexIndex = i;
                    }
                }
            }
            this.apexIndex = apexIndex;
        }
    }

    protected handleAlign(contentWidth: number, contentHeight: number): void {
        var newOffsetX: number = 0;
        var newOffsetY: number = 0;

        if (contentHeight < this.viewHeight) {
            if (this._verticalAlign == "middle")
                newOffsetY = Math.floor((this.viewHeight - contentHeight) / 2) * this._dprOffset;
            else if (this._verticalAlign == "bottom")
                newOffsetY = (this.viewHeight - contentHeight) * this._dprOffset;
        }

        if (contentWidth < this.viewWidth) {
            if (this._align == "center")
                newOffsetX = Math.floor((this.viewWidth - contentWidth) / 2) * this._dprOffset;
            else if (this._align == "right")
                newOffsetX = (this.viewWidth - contentWidth) * this._dprOffset;
        }

        if (newOffsetX != this._alignOffset.x * this._dprOffset || newOffsetY != this._alignOffset.y * this._dprOffset) {
            this._alignOffset.setTo(newOffsetX, newOffsetY);
            if (this._scrollPane)
                this._scrollPane.adjustMaskContainer();
            else
                this._container.setPosition((this._margin.left + this._alignOffset.x) * this._dprOffset, (this._margin.top + this._alignOffset.y) * this._dprOffset);
        }
    }

    protected updateBounds(): void {
        // if (this._virtual)
        //     return;

        var i: number;

        var child: GObject;
        var curX: number = 0;
        var curY: number = 0;
        var maxWidth: number = 0;
        var maxHeight: number = 0;
        var cw: number, ch: number;
        var j: number = 0;
        var page: number = 0;
        var k: number = 0;
        var cnt: number = this._children.length;
        var viewWidth: number = this.viewWidth;
        var viewHeight: number = this.viewHeight;
        var lineSize: number = 0;
        var lineStart: number = 0;
        var ratio: number;

        if (this._layout == ListLayoutType.SingleColumn) {
            for (i = 0; i < cnt; i++) {
                child = this.getChildAt(i);
                const baseHei = child.height;
                if (this.foldInvisibleItems && !child.visible)
                    continue;

                if (curY != 0)
                    curY += this._lineGap;
                // console.log("curY 0===>", curY, i);
                child.y = curY;
                if (this._autoResizeItem)
                    child.setSize(viewWidth, child.height * GRoot.uiScale, true);
                curY += Math.ceil(baseHei);
                if (child.width > maxWidth)
                    maxWidth = child.width;
            }
            ch = curY;
            // console.log("curY total===>", curY);
            if (ch <= viewHeight && this._autoResizeItem && this._scrollPane && this._scrollPane._displayInDemand && this._scrollPane.vtScrollBar) {
                viewWidth += this._scrollPane.vtScrollBar.width;
                for (i = 0; i < cnt; i++) {
                    child = this.getChildAt(i);
                    if (this.foldInvisibleItems && !child.visible)
                        continue;

                    child.setSize(viewWidth, child.height * GRoot.uiScale, true);
                    if (child.width > maxWidth)
                        maxWidth = child.width;
                }
            }

            cw = Math.ceil(maxWidth);
        }
        else if (this._layout == ListLayoutType.SingleRow) {
            for (i = 0; i < cnt; i++) {
                child = this.getChildAt(i);
                const baseWid = child.width;
                if (this.foldInvisibleItems && !child.visible)
                    continue;

                if (curX != 0)
                    curX += this._columnGap;
                child.x = curX;
                if (this._autoResizeItem)
                    child.setSize(child.width * GRoot.uiScale, viewHeight, true);
                curX += Math.ceil(baseWid);
                if (child.height > maxHeight)
                    maxHeight = child.height;
            }
            cw = curX;

            if (cw <= viewWidth && this._autoResizeItem && this._scrollPane && this._scrollPane._displayInDemand && this._scrollPane.hzScrollBar) {
                viewHeight += this._scrollPane.hzScrollBar.height;
                for (i = 0; i < cnt; i++) {
                    child = this.getChildAt(i);
                    if (this.foldInvisibleItems && !child.visible)
                        continue;

                    child.setSize(child.width * GRoot.uiScale, viewHeight, true);
                    if (child.height > maxHeight)
                        maxHeight = child.height;
                }
            }

            ch = Math.ceil(maxHeight);
        }
        else if (this._layout == ListLayoutType.FlowHorizontal) {
            if (this._autoResizeItem && this._columnCount > 0) {
                for (i = 0; i < cnt; i++) {
                    child = this.getChildAt(i);
                    const baseHei = child.height;
                    if (this.foldInvisibleItems && !child.visible)
                        continue;

                    lineSize += child.sourceWidth;
                    j++;
                    if (j == this._columnCount || i == cnt - 1) {
                        ratio = (viewWidth - lineSize - (j - 1) * this._columnGap) / lineSize;
                        curX = 0;
                        for (j = lineStart; j <= i; j++) {
                            child = this.getChildAt(j);
                            if (this.foldInvisibleItems && !child.visible)
                                continue;

                            child.setXY(curX, curY);

                            if (j < i) {
                                child.setSize(child.sourceWidth + Math.round(child.sourceWidth * ratio), child.height * GRoot.uiScale, true);
                                curX += Math.ceil(child.width) + this._columnGap;
                            }
                            else {
                                child.setSize(viewWidth - curX, child.height * GRoot.uiScale, true);
                            }
                            if (baseHei > maxHeight)
                                maxHeight = baseHei;
                        }
                        //new line
                        curY += Math.ceil(maxHeight) + this._lineGap;
                        maxHeight = 0;
                        j = 0;
                        lineStart = i + 1;
                        lineSize = 0;
                    }
                }
                ch = curY + Math.ceil(maxHeight);
                cw = viewWidth;
            }
            else {
                for (i = 0; i < cnt; i++) {
                    child = this.getChildAt(i);
                    if (this.foldInvisibleItems && !child.visible)
                        continue;

                    if (curX != 0)
                        curX += this._columnGap;

                    if (this._columnCount != 0 && j >= this._columnCount
                        || this._columnCount == 0 && curX + child.width > viewWidth && maxHeight != 0) {
                        //new line
                        curX = 0;
                        curY += Math.ceil(maxHeight) + this._lineGap;
                        maxHeight = 0;
                        j = 0;
                    }
                    child.setXY(curX, curY);
                    curX += Math.ceil(child.width);
                    if (curX > maxWidth)
                        maxWidth = curX;
                    if (child.width > maxHeight)
                        maxHeight = child.height;
                    j++;
                }
                ch = curY + Math.ceil(maxHeight);
                cw = Math.ceil(maxWidth);
            }
        }
        else if (this._layout == ListLayoutType.FlowVertical) {
            if (this._autoResizeItem && this._lineCount > 0) {
                for (i = 0; i < cnt; i++) {
                    child = this.getChildAt(i);
                    const baseWid = child.width;
                    if (this.foldInvisibleItems && !child.visible)
                        continue;

                    lineSize += child.sourceHeight;
                    j++;
                    if (j == this._lineCount || i == cnt - 1) {
                        ratio = (viewHeight - lineSize - (j - 1) * this._lineGap) / lineSize;
                        curY = 0;
                        for (j = lineStart; j <= i; j++) {
                            child = this.getChildAt(j);
                            if (this.foldInvisibleItems && !child.visible)
                                continue;

                            child.setXY(curX, curY);

                            if (j < i) {
                                child.setSize(child.width * GRoot.uiScale, child.sourceHeight + Math.round(child.sourceHeight * ratio), true);
                                curY += Math.ceil(child.height) + this._lineGap;
                            }
                            else {
                                child.setSize(child.width * GRoot.uiScale, viewHeight - curY, true);
                            }
                            if (baseWid > maxWidth)
                                maxWidth = baseWid;
                        }
                        //new line
                        curX += Math.ceil(maxWidth) + this._columnGap;
                        maxWidth = 0;
                        j = 0;
                        lineStart = i + 1;
                        lineSize = 0;
                    }
                }
                cw = curX + Math.ceil(maxWidth);
                ch = viewHeight;
            }
            else {
                for (i = 0; i < cnt; i++) {
                    child = this.getChildAt(i);
                    if (this.foldInvisibleItems && !child.visible)
                        continue;

                    if (curY != 0)
                        curY += this._lineGap;

                    if (this._lineCount != 0 && j >= this._lineCount
                        || this._lineCount == 0 && curY + child.height > viewHeight && maxWidth != 0) {
                        curY = 0;
                        curX += Math.ceil(maxWidth) + this._columnGap;
                        maxWidth = 0;
                        j = 0;
                    }
                    child.setXY(curX, curY);
                    curY += Math.ceil(child.height);
                    if (curY > maxHeight)
                        maxHeight = curY;
                    if (child.width > maxWidth)
                        maxWidth = child.width;
                    j++;
                }
                cw = curX + Math.ceil(maxWidth);
                ch = Math.ceil(maxHeight);
            }
        }
        else //pagination
        {
            var eachHeight: number;
            if (this._autoResizeItem && this._lineCount > 0)
                eachHeight = Math.floor((viewHeight - (this._lineCount - 1) * this._lineGap) / this._lineCount);

            if (this._autoResizeItem && this._columnCount > 0) {
                for (i = 0; i < cnt; i++) {
                    child = this.getChildAt(i);
                    const baseHei = child.height;
                    if (this.foldInvisibleItems && !child.visible)
                        continue;

                    if (j == 0 && (this._lineCount != 0 && k >= this._lineCount
                        || this._lineCount == 0 && curY + baseHei > viewHeight)) {
                        //new page
                        page++;
                        curY = 0;
                        k = 0;
                    }

                    lineSize += child.sourceWidth;
                    j++;
                    if (j == this._columnCount || i == cnt - 1) {
                        ratio = (viewWidth - lineSize - (j - 1) * this._columnGap) / lineSize;
                        curX = 0;
                        for (j = lineStart; j <= i; j++) {
                            child = this.getChildAt(j);
                            const baseWid = child.width;
                            if (this.foldInvisibleItems && !child.visible)
                                continue;

                            child.setXY(page * viewWidth + curX, curY);

                            if (j < i) {
                                child.setSize(child.sourceWidth + Math.round(child.sourceWidth * ratio),
                                    this._lineCount > 0 ? eachHeight : baseHei, true);
                                curX += Math.ceil(baseWid) + this._columnGap;
                            }
                            else {
                                child.setSize(viewWidth - curX, this._lineCount > 0 ? eachHeight : child.height * GRoot.uiScale, true);
                            }
                            if (baseHei > maxHeight)
                                maxHeight = baseHei;
                        }
                        //new line
                        curY += Math.ceil(maxHeight) + this._lineGap;
                        maxHeight = 0;
                        j = 0;
                        lineStart = i + 1;
                        lineSize = 0;

                        k++;
                    }
                }
            }
            else {
                for (i = 0; i < cnt; i++) {
                    child = this.getChildAt(i);
                    if (this.foldInvisibleItems && !child.visible)
                        continue;

                    if (curX != 0)
                        curX += this._columnGap;

                    if (this._autoResizeItem && this._lineCount > 0)
                        child.setSize(child.width * GRoot.uiScale, eachHeight, true);

                    if (this._columnCount != 0 && j >= this._columnCount
                        || this._columnCount == 0 && curX + child.width > viewWidth && maxHeight != 0) {
                        //new line
                        curX = 0;
                        curY += Math.ceil(maxHeight) + this._lineGap;
                        maxHeight = 0;
                        j = 0;
                        k++;

                        if (this._lineCount != 0 && k >= this._lineCount
                            || this._lineCount == 0 && curY + child.height > viewHeight && maxWidth != 0)//new page
                        {
                            page++;
                            curY = 0;
                            k = 0;
                        }
                    }
                    child.setXY(page * viewWidth + curX, curY);
                    curX += Math.ceil(child.width);
                    if (curX > maxWidth)
                        maxWidth = curX;
                    if (child.height > maxHeight)
                        maxHeight = child.height;
                    j++;
                }
            }
            ch = page > 0 ? viewHeight : curY + Math.ceil(maxHeight);
            cw = (page + 1) * viewWidth;
        }

        if (this._virtual) {
            cw = cw > this._virtualWidth ? cw : this._virtualWidth;
            ch = ch > this._virtualHeight ? ch : this._virtualHeight;
        }

        this.handleAlign(cw, ch);
        this.setBounds(0, 0, cw, ch);
    }

    public setup_beforeAdd(buffer: ByteBuffer, beginPos: number): Promise<void> {
        return new Promise((resolve, reject) => {
            super.setup_beforeAdd(buffer, beginPos);

            buffer.seek(beginPos, 5);

            var i1: number;

            this._layout = buffer.readByte();
            this._selectionMode = buffer.readByte();
            i1 = buffer.readByte();
            this._align = i1 == 0 ? "left" : (i1 == 1 ? "center" : "right");
            i1 = buffer.readByte();
            this._verticalAlign = i1 == 0 ? "top" : (i1 == 1 ? "middle" : "bottom");
            this._lineGap = buffer.readShort() * GRoot.dpr;
            this._columnGap = buffer.readShort() * GRoot.dpr;
            this._lineCount = buffer.readShort();
            this._columnCount = buffer.readShort();
            const _autoResize = buffer.readBool();
            this._autoResizeItem = _autoResize ? _autoResize : GRoot.uiScale < 1;
            this._childrenRenderOrder = buffer.readByte();
            this._apexIndex = buffer.readShort();

            if (buffer.readBool()) {
                this._margin.top = buffer.readInt();
                this._margin.bottom = buffer.readInt();
                this._margin.left = buffer.readInt();
                this._margin.right = buffer.readInt();
            }

            const fun0 = (): Promise<void> => {
                return new Promise((resolve, reject) => {
                    if (buffer.readBool()) //clipSoftness
                        buffer.skip(8);

                    if (buffer.version >= 2) {
                        this.scrollItemToViewOnClick = buffer.readBool();
                        this.foldInvisibleItems = buffer.readBool();
                    }

                    buffer.seek(beginPos, 8);

                    this._defaultItem = buffer.readS();

                    this.readItems(buffer).then(() => {
                        resolve();
                    });
                });
            }


            var overflow: number = buffer.readByte();
            if (overflow == OverflowType.Scroll) {
                var savedPos: number = buffer.position;
                buffer.seek(beginPos, 7);
                this.setupScroll(buffer).then(() => {
                    buffer.position = savedPos;
                    fun0().then(() => {
                        resolve();
                    });
                });
            }
            else {
                this.setupOverflow(overflow);
                fun0().then(() => {
                    resolve();
                });
            }
        });

    }

    protected handleXYChanged(): void {
        var xv: number = this._x + this._xOffset;
        var yv: number = this._y + this._yOffset;
        let offsetXParam: number = GRoot.dpr;
        let offsetYParam: number = GRoot.dpr;

        if (this._pixelSnapping) {
            xv = Math.round(xv);
            yv = Math.round(yv);
        }
        this._displayObject.setPosition(xv * offsetXParam, yv * offsetYParam);
    }

    protected readItems(buffer: ByteBuffer): Promise<void> {
        return new Promise((resolve, reject) => {
            var cnt: number;
            var i: number;
            var nextPos: number;
            var str: string;

            cnt = buffer.readShort();


            const fun0 = (i) => {
                if (i >= cnt) {
                    resolve();
                    return;
                }
                nextPos = buffer.readShort();
                nextPos += buffer.position;

                str = buffer.readS();
                if (str == null) {
                    str = this._defaultItem;
                    if (!str) {
                        buffer.position = nextPos;
                        fun0(++i);
                        return;
                    }
                }
                this.getFromPool(str).then((obj) => {
                    if (obj) {
                        this.addChild(obj);
                        if (buffer.canRead()) {
                            this.setupItem(buffer, obj);
                        }
                    }
                    buffer.position = nextPos;
                    fun0(++i);
                });
            }
            fun0(0);
        });
    }

    protected setupItem(buffer: ByteBuffer, obj: GObject): void {
        var str: string;
        // 自对象本生有定义资源，父对象不对其进行修改
        str = buffer.readS();
        if (str != null)
            obj.text = str;
        str = buffer.readS();
        if (str != null && (obj instanceof GButton))
            obj.selectedTitle = str;
        str = buffer.readS();
        if (str != null)
            obj.icon = str;
        str = buffer.readS();
        if (str != null && (obj instanceof GButton))
            obj.selectedIcon = str;
        str = buffer.readS();
        if (str != null)
            obj.name = str;

        var cnt: number;
        var i: number;

        if (obj instanceof GComponent) {
            cnt = buffer.readShort();
            for (i = 0; i < cnt; i++) {
                var cc: Controller = obj.getController(buffer.readS());
                str = buffer.readS();
                if (cc)
                    cc.selectedPageId = str;
            }

            if (buffer.version >= 2) {
                cnt = buffer.readShort();
                for (i = 0; i < cnt; i++) {
                    var target: string = buffer.readS();
                    var propertyId: number = buffer.readShort();
                    var value: String = buffer.readS();
                    var obj2: GObject = obj.getChildByPath(target);
                    if (obj2)
                        obj2.setProp(propertyId, value);
                }
            }
        }
    }

    public setup_afterAdd(buffer: ByteBuffer, beginPos: number): void {
        super.setup_afterAdd(buffer, beginPos);

        buffer.seek(beginPos, 6);

        var i: number = buffer.readShort();
        if (i != -1)
            this._selectionController = this._parent.getControllerAt(i);
        // const g = this.scene.make.graphics(undefined, false);
        // g.fillStyle(0xFFCC00, .4);
        // g.fillRect(0, 0, this.initWidth, this.initHeight);
        // (<Phaser.GameObjects.Container>this.displayObject).add(g);
    }
}

interface ItemInfo {
    width: number;
    height: number;
    obj?: GObject;
    updateFlag: number;
    selected?: boolean;
}

var s_n: number = 0;
