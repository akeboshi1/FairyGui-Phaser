import { PackageItem } from './PackageItem';
import { GRoot } from './GRoot';
export enum LoaderType {
    IMAGE = "image",
    ATLAS = "atlas",
    AUDIO = "audio",
    VIDEO = "video",
    JSON = "json",
    SCRIPT = "script",
    GLSL = "glsl",
    BITMAPFONT = "bitmapFont",
    SPRITESHEET = "spritesheet",

}

export interface IResCallBackObj {
    id: string,
    completeCallBack: Function,
    errorCallBack?: Function,
    context?: any
}
export class AssetProxy {
    private _resMap: Map<string, string>;
    private _resCallBackMap: Map<string, Map<string, IResCallBackObj>>;
    // private _completeCallBack: Function;
    // private _errorCallBack: Function;
    private _emitter: Phaser.Events.EventEmitter;
    constructor() {
        this._resMap = new Map();
        this._resCallBackMap = new Map();
        this._emitter = new Phaser.Events.EventEmitter;
    }

    public get emitter(): Phaser.Events.EventEmitter {
        return this._emitter;
    }

    private static _inst: AssetProxy;

    public static get inst(): AssetProxy {
        if (!AssetProxy._inst)
            AssetProxy._inst = new AssetProxy();
        return AssetProxy._inst;
    }

    public getRes(id: string, key: string, type: string): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this._resMap.get(key)) {
                const url = GRoot.inst.getResUIUrl(key);
                this.load(id, key, url, type, (file) => {
                    this._emitter.emit(file + "_" + type + "_complete", file);
                    this._resMap.set(key, url);
                    resolve(file);
                }, () => {
                    reject("__DEFAULT");
                }, this);
            } else {
                resolve(key);
            }
        });
    }

    public load(id: string, key: string, url: any, type: string, completeCallBack: Function, errorCallBack?: Function, context?: any): void {
        let rescbMap = this._resCallBackMap.get(key);
        if (!rescbMap) {
            rescbMap = new Map();
            rescbMap.set(context, {
                id,
                completeCallBack,
                errorCallBack,
                context
            });
        } else {
            if (!rescbMap.get(context)) {
                rescbMap.set(context, {
                    id,
                    completeCallBack,
                    errorCallBack,
                    context
                });
            }
        }
        this._resCallBackMap.set(key, rescbMap);
        const fun = (value) => {
            rescbMap.forEach((obj: IResCallBackObj) => {
                if (obj.context && (obj.context instanceof AssetProxy === true || obj.context["_displayObject"])) {
                    const texture: Phaser.Textures.Texture = GRoot.inst.scene.textures.get(value);
                    obj.completeCallBack.apply(obj.context, [texture]);
                }
            });
        }
        switch (type) {
            case LoaderType.IMAGE:
                if (GRoot.inst.scene.textures.exists(key)) {
                    fun(key);
                    return;
                }
                GRoot.inst.scene.load.image(key, url);
                break;
            case LoaderType.ATLAS:
                GRoot.inst.scene.load.atlas(key, url);
                break;
            case LoaderType.AUDIO:
                if (GRoot.inst.scene.cache.audio.exists(key)) {
                    fun(key);
                    return;
                }
                GRoot.inst.scene.load.audio(key, url);
                break;
            case LoaderType.VIDEO:
                if (GRoot.inst.scene.cache.video.exists(key)) {
                    fun(key);
                    return;
                }
                GRoot.inst.scene.load.video(key, url);
                break;
            case LoaderType.JSON:
                if (GRoot.inst.scene.cache.json.exists(key)) {
                    fun(key);
                    return;
                }
                GRoot.inst.scene.load.json(key, url);
                break;
            case LoaderType.SCRIPT:
                if (GRoot.inst.scene.cache.obj.exists(key)) {
                    fun(key);
                    return;
                }
                GRoot.inst.scene.load.script(key, url);
                break;
            case LoaderType.GLSL:
                if (GRoot.inst.scene.cache.shader.exists(key)) {
                    fun(key);
                    return;
                }
                GRoot.inst.scene.load.glsl(key, url);
                break;
            case LoaderType.BITMAPFONT:
                if (GRoot.inst.scene.cache.bitmapFont.exists(key)) {
                    fun(key);
                    return;
                }
                GRoot.inst.scene.load.bitmapFont(key, url);
                break;
            case LoaderType.SPRITESHEET:
                GRoot.inst.scene.load.spritesheet(key, url);
                break;
            default:
                if (GRoot.inst.scene.textures.exists(key)) {
                    fun(key);
                    return;
                }
                GRoot.inst.scene.load.image(key, url);
                break;
        }
        this.addListen(type, key);
        GRoot.inst.scene.load.start();
    }

    public addListen(type: string, key: string) {
        this.removeListen();
        GRoot.inst.scene.load.on(Phaser.Loader.Events.FILE_COMPLETE + "-" + type + "-" + key, this.onLoadComplete, this);
        GRoot.inst.scene.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR + "-" + type + "-" + key, this.onLoadError, this);
        GRoot.inst.scene.load.on(Phaser.Loader.Events.COMPLETE, this.totalComplete, this);
    }

    public removeListen() {
        GRoot.inst.scene.load.off(Phaser.Loader.Events.COMPLETE, this.totalComplete, this);
    }

    public startLoad() {
        GRoot.inst.scene.load.start();
    }

    private totalComplete(loader?: any, totalComplete?: number, totalFailed?: number) {
    }

    private onLoadComplete(key: string, file?: File) {
        const rescbMap = this._resCallBackMap.get(key);
        if (rescbMap) {
            rescbMap.forEach((obj: IResCallBackObj) => {
                if (obj.context && (obj.context instanceof AssetProxy === true || obj.context["_displayObject"])) {
                    const texture: Phaser.Textures.Texture = GRoot.inst.scene.textures.get(key);
                    obj.completeCallBack.apply(obj.context, [texture]);
                }
            });
        }
        this._resCallBackMap.delete(key);
        GRoot.inst.scene.load.off(Phaser.Loader.Events.FILE_COMPLETE + "-" + file + "-" + key, this.onLoadComplete, this);
        GRoot.inst.scene.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR + "-" + file + "-" + key, this.onLoadError, this);
    }

    private onLoadError(key: string, file?: File) {
        const rescbMap = this._resCallBackMap.get(key);
        if (rescbMap) {
            rescbMap.forEach((obj: IResCallBackObj) => {
                if (obj.context && (obj.context instanceof AssetProxy === true || obj.context["_displayObject"])) {
                    const texture: Phaser.Textures.Texture = GRoot.inst.scene.textures.get(key);
                    obj.completeCallBack.apply(obj.context, [texture]);
                }
            });
        }
        this._resCallBackMap.delete(key);
        GRoot.inst.scene.load.off(Phaser.Loader.Events.FILE_COMPLETE + "-" + file + "-" + key, this.onLoadComplete, this);
        GRoot.inst.scene.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR + "-" + file + "-" + key, this.onLoadError, this);
    }
}
