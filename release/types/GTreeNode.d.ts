import { GComponent } from "./GComponent";
import { GTree } from "./GTree";
export declare class GTreeNode {
    data: any;
    private _parent;
    private _children;
    private _expanded;
    private _level;
    private _tree;
    _cell: GComponent;
    _resURL?: string;
    constructor(hasChild: boolean, resURL?: string);
    set expanded(value: boolean);
    get expanded(): boolean;
    get isFolder(): boolean;
    get parent(): GTreeNode;
    get text(): string;
    set text(value: string);
    get icon(): string;
    set icon(value: string);
    get cell(): GComponent;
    get level(): number;
    _setLevel(value: number): void;
    addChild(child: GTreeNode): GTreeNode;
    addChildAt(child: GTreeNode, index: number): GTreeNode;
    removeChild(child: GTreeNode): GTreeNode;
    removeChildAt(index: number): GTreeNode;
    removeChildren(beginIndex?: number, endIndex?: number): void;
    getChildAt(index: number): GTreeNode;
    getChildIndex(child: GTreeNode): number;
    getPrevSibling(): GTreeNode;
    getNextSibling(): GTreeNode;
    setChildIndex(child: GTreeNode, index: number): void;
    swapChildren(child1: GTreeNode, child2: GTreeNode): void;
    swapChildrenAt(index1: number, index2: number): void;
    get numChildren(): number;
    expandToRoot(): void;
    get tree(): GTree;
    _setTree(value: GTree): void;
}
