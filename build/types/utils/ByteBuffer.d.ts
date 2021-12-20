export declare class ByteBuffer {
    stringTable: Array<string>;
    version: number;
    littleEndian: boolean;
    protected _view: DataView;
    protected _bytes: Uint8Array;
    protected _pos: number;
    protected _length: number;
    constructor(buffer: ArrayBuffer, offset?: number, length?: number);
    canRead(): boolean;
    get data(): Uint8Array;
    get position(): number;
    set position(value: number);
    skip(count: number): void;
    private validate;
    readByte(): number;
    readUbyte(): number;
    readBool(): boolean;
    readShort(): number;
    readUshort(): number;
    readInt(): number;
    readUint(): number;
    readFloat(): number;
    readString(len?: number): string;
    readS(): string;
    readSArray(cnt: number): Array<string>;
    writeS(value: string): void;
    readColor(hasAlpha?: boolean): number;
    readColorS(hasAlpha?: boolean): string;
    readChar(): string;
    readBuffer(): ByteBuffer;
    seek(indexTablePos: number, blockIndex: number): boolean;
}
