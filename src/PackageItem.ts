import { BitmapFont } from './display/BitmapFont';
import { PixelHitTestData } from './utils/PixelHitTest';
import { ByteBuffer } from './utils/ByteBuffer';
import { UIPackage } from './UIPackage';
import { GRoot } from './GRoot';
export class PackageItem {
    public owner: UIPackage;

    public type: number;
    public objectType?: number;

    public id: string;
    public name: string;
    public x: number = 0;
    public y: number = 0;
    public tx: number = 0;
    public ty: number = 0;
    public width: number = 0;
    public height: number = 0;
    public file: string;
    public decoded?: boolean;
    public loading?: Array<Function>;
    public rawData?: ByteBuffer;

    public highResolution?: Array<string>;
    public branches?: Array<string>;

    //image
    public scale9Grid?: Phaser.Geom.Rectangle;
    public scaleByTile?: boolean;
    public tileGridIndice?: number;
    public smoothing?: boolean;
    public texture?: Phaser.Textures.Texture;
    public pixelHitTestData?: PixelHitTestData;

    //movieclip
    public interval?: number;
    public repeatDelay?: number;
    public swing?: boolean;
    public frames?: Phaser.Textures.Frame[];

    //componenet
    public extensionType?: any;

    //font 
    public bitmapFont?: BitmapFont;

    //skeleton
    // public templet?: Laya.Templet;
    public skeletonAnchor?: Phaser.Geom.Point;

    private _isHighRes: boolean = false;

    constructor() {
    }

    public getBranch(): PackageItem {
        if (this.branches && this.owner._branchIndex != -1) {
            var itemId: string = this.branches[this.owner._branchIndex];
            if (itemId)
                return this.owner.getItemById(itemId);
        }

        return this;
    }

    public getHighResolution(): PackageItem {
        this._isHighRes = false;
        // if (this.highResolution && GRoot.contentDprLevel > 0) {
        //     var itemId: string = this.highResolution[GRoot.contentDprLevel - 1];
        //     if (itemId) {
        //         const item = this.owner.getItemById(itemId);
        //         item.isHighRes = true;
        //         this._isHighRes = true;
        //         return item;
        //     }
        // }
        return this;
    }

    public get isHighRes(): boolean {
        return this._isHighRes;
    }

    public set isHighRes(val) {
        this._isHighRes = val;
    }

    public toString(): string {
        return this.name;
    }

    public load(): Promise<Object> {
        return new Promise((resolve, reject) => {
            this.owner.getItemAsset(this).then((obj) => {
                resolve(obj);
            });
        });
    }
}
