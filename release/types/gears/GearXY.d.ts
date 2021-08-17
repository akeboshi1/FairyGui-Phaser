import { ByteBuffer } from './../utils/ByteBuffer';
import { GObject } from './../GObject';
import { GearBase } from './GearBase';
export declare class GearXY extends GearBase {
    positionsInPercent: boolean;
    private _storage;
    private _default;
    constructor(owner: GObject);
    protected init(): void;
    protected addStatus(pageId: string, buffer: ByteBuffer): void;
    addExtStatus(pageId: string, buffer: ByteBuffer): void;
    apply(): void;
    private __tweenUpdate;
    private __tweenComplete;
    updateState(): void;
    updateFromRelations(dx: number, dy: number): void;
}
