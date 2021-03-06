import { PopupDirection } from './FieldTypes';
import { Controller } from './Controller';
import { GButton } from './GButton';
import { GObject } from './GObject';
import { UIConfig } from './UIConfig';
import { GList } from './GList';
import { GComponent } from "./GComponent";
import { GRoot, Handler, RelationType, UIPackage } from '.';
import { Events } from './Events';

export class PopupMenu {

    protected _contentPane: GComponent;
    protected _list: GList;
    constructor(protected _scene: Phaser.Scene, private resourceURL?: string) {
        if (!this.resourceURL) {
            this.resourceURL = UIConfig.popupMenu;
            if (!this.resourceURL)
                throw "UIConfig.popupMenu not defined";
        }

    }

    public init(): Promise<void> {
        return new Promise((resolve, reject) => {
            UIPackage.createObjectFromURL(this.resourceURL).then((obj) => {
                this._contentPane = obj.asCom;
                // this._contentPane.on(Laya.Event.DISPLAY, this.__addedToStage, this);
                this._list = <GList>(this._contentPane.getChild("list"));
                this._list.removeChildrenToPool();
                this._list.addRelation(this._contentPane, RelationType.Width);
                this._list.removeRelation(this._contentPane, RelationType.Height);
                this._contentPane.addRelation(this._list, RelationType.Height);
                this._list.on(Events.CLICK_ITEM, this.__clickItem, this);
                resolve();
            })
        });
    }

    public dispose(): void {
        this._contentPane.dispose();
    }

    /**
     * 一次创建一个item
     * @param caption 
     * @param handler 
     * @returns 
     */
    public addItem(caption: string, handler?: (item?: GObject, evt?: Event) => void): Promise<GButton> {
        return new Promise((resolve, reject) => {
            this._list.addItemFromPool().then((obj) => {
                var item: GButton = obj.asButton;
                item.title = caption;
                item.data = handler;
                item.grayed = false;
                var c: Controller = item.getController("checked");
                if (c)
                    c.selectedIndex = 0;
                resolve(item);
            });

        });
    }

    /**
     * 一次创建多个items，由于异步问题，会导致promise返回后显示对象的添加的先后顺序错乱(index 5先被添加到0，0位置)
     * @param captions 
     * @param handler 
     * @returns 
     */
    public addItems(captions: string[], handler?: (item?: GObject, evt?: Event) => void): Promise<void> {
        return new Promise((resolve, reject) => {
            const count = captions.length;
            this._list.addItems(count).then((objlist) => {
                for (let i: number = 0; i < count; i++) {
                    const obj = objlist[i];
                    var item: GButton = obj.asButton;
                    item.title = captions[i];
                    item.data = handler;
                    item.grayed = false;
                    var c: Controller = item.getController("checked");
                    if (c)
                        c.selectedIndex = 0;
                }
                resolve();
            })
        });
    }

    public addItemAt(caption: string, index: number, handler?: (item?: GObject, evt?: Event) => void): Promise<GButton> {
        return new Promise((resolve, reject) => {
            this._list.getFromPool().then((obj) => {
                var item: GButton = obj.asButton;
                this._list.addChildAt(item, index);
                item.title = caption;
                item.data = handler;
                item.grayed = false;
                var c: Controller = item.getController("checked");
                if (c)
                    c.selectedIndex = 0;
                resolve(item);
            });
        });
    }

    public addSeperator(): void {
        if (UIConfig.popupMenu_seperator == null)
            throw "UIConfig.popupMenu_seperator not defined";
        this._list.addItemFromPool(UIConfig.popupMenu_seperator);
    }

    public getItemName(index: number): string {
        var item: GObject = this._list.getChildAt(index);
        return item.name;
    }

    public setItemText(name: string, caption: string): void {
        var item: GButton = <GButton>this._list.getChild(name);
        item.title = caption;
    }

    public setItemVisible(name: string, visible: boolean): void {
        var item: GButton = <GButton>this._list.getChild(name);
        if (item.visible != visible) {
            item.visible = visible;
            this._list.setBoundsChangedFlag();
        }
    }

    public setItemGrayed(name: string, grayed: boolean): void {
        var item: GButton = <GButton>this._list.getChild(name);
        item.grayed = grayed;
    }

    public setItemCheckable(name: string, checkable: boolean): void {
        var item: GButton = <GButton>this._list.getChild(name);
        var c: Controller = item.getController("checked");
        if (c) {
            if (checkable) {
                if (c.selectedIndex == 0)
                    c.selectedIndex = 1;
            }
            else
                c.selectedIndex = 0;
        }
    }

    public setItemChecked(name: string, checked: boolean): void {
        var item: GButton = <GButton>this._list.getChild(name);
        var c: Controller = item.getController("checked");
        if (c)
            c.selectedIndex = checked ? 2 : 1;
    }

    public isItemChecked(name: string): boolean {
        var item: GButton = <GButton>this._list.getChild(name);
        var c: Controller = item.getController("checked");
        if (c)
            return c.selectedIndex == 2;
        else
            return false;
    }

    public removeItem(name: string): boolean {
        var item: GObject = this._list.getChild(name);
        if (item) {
            var index: number = this._list.getChildIndex(item);
            this._list.removeChildToPoolAt(index);
            return true;
        }
        else
            return false;
    }

    public clearItems(): void {
        this._list.removeChildrenToPool();
    }

    public get itemCount(): number {
        return this._list.numChildren;
    }

    public get contentPane(): GComponent {
        return this._contentPane;
    }

    public get list(): GList {
        return this._list;
    }

    public show(target: GObject = null, dir?: PopupDirection | boolean) {
        var r: GRoot = target != null ? target.root : GRoot.inst;
        r.showPopup(this.contentPane, (target instanceof GRoot) ? null : target, dir);
    }

    private __clickItem(itemObject: GObject): void {
        this._scene.time.delayedCall(100, this.__clickItem2, [itemObject], this);
    }

    private __clickItem2(itemObject: GObject): void {
        if (!(itemObject instanceof GButton))
            return;
        if (itemObject.grayed) {
            this._list.selectedIndex = -1;
            return;
        }
        var c: Controller = itemObject.asCom.getController("checked");
        if (c && c.selectedIndex != 0) {
            if (c.selectedIndex == 1)
                c.selectedIndex = 2;
            else
                c.selectedIndex = 1;
        }
        var r: GRoot = <GRoot>(this._contentPane.parent);
        if (r) r.hidePopup(this.contentPane);
        if (itemObject.data != null) {
            (<Handler>itemObject.data).run();
        }
    }

}
